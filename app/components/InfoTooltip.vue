<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  InfoTooltip.vue @preserve
-->
<!-- components/InfoTooltip.vue @preserve -->
<!-- 
  InfoTooltip.vue @preserve
-->
<!--
  InfoTooltip.vue
  What it is:
  - A floating tooltip component that teleports to <body> and positions itself
    relative to a target element using @floating-ui/vue.
  What it does:
  - Shows either simple text (with optional shortcut parsing like "Copy (Ctrl+C)")
    or a structured notification payload (e.g., source/destination jobs and a
    scrollable list of affected file paths with reasons).
  - Automatically flips/offsets/shifts to stay in view and renders a styled arrow
    pointing at the target element.
  - Uses a lightweight fade transition and high-contrast, blurred backdrop styling.
  - Supports keyboard shortcut display with a keyboard icon.
  Key features:
  - Teleport to body for layering reliability
  - Smart positioning (offset, flip, shift, arrow)
  - Simple text mode with shortcut extraction
  - Rich details mode for notification/message details
  - Conditional rendering - only mounts in DOM when visible
  - Keyboard shortcut slot with icon
  Props:
  - visible: boolean — Controls visibility and DOM mounting
  - content: TooltipContent (NotificationMessageDetails | { text: string }) — What to display
  - target: MaybeElement — The reference element for positioning
  - debugForceVisible: boolean — Forces visibility for debugging
  - keyboardShortcut: string — Optional keyboard shortcut to display with icon
  Example usage:
  <InfoTooltip
    :visible="isTooltipVisible"
    :content="{ text: 'Copy' }"
    :target="buttonRef"
    :keyboardShortcut="Ctrl+C"
  />
  
  IMPORTANT: For proper implementation patterns and usage guidelines,
  see: app/components/info-tooltip-comp/info-tooltip-usage.md
-->
<template>
  <teleport to="body">
    <Transition
      name="tooltip-fade"
      appear
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="shouldRender"
        ref="floatingRef"
        class="info-tooltip"
        :class="{ 
          interactive: interactive, 
          'simple-tooltip': !!parsedContent,
          'disabled-target': isTargetDisabled
        }"
        :style="floatingStyles"
        @mouseenter="(event) => emit('mouseenter', event)"
        @mouseleave="(event) => emit('mouseleave', event)"
      >
                          <div class="tooltip-content">
           <!-- Display structured notification details -->
           <template v-if="'filePaths' in content">
             <div v-if="(content as NotificationMessageDetails).sourceJobId" class="info-line"><strong>Source:</strong> Job {{ (content as NotificationMessageDetails).sourceJobId }}</div>
             <div v-if="(content as NotificationMessageDetails).destinationJobId" class="info-line">
               <strong>Destination:</strong> Job {{ (content as NotificationMessageDetails).destinationJobId }}
             </div>
             <hr v-if="(content as NotificationMessageDetails).sourceJobId || (content as NotificationMessageDetails).destinationJobId" />
             <div v-if="(content as NotificationMessageDetails).filePaths && (content as NotificationMessageDetails).filePaths.length > 0" class="file-list-container">
               <strong>Affected Items:</strong>
               <ul class="file-list">
                 <li v-for="path in (content as NotificationMessageDetails).filePaths" :key="path">
                   <span class="file-name">{{ getFileName(path) }}</span>
                   <span v-if="(content as NotificationMessageDetails).reasons && (content as NotificationMessageDetails).reasons?.[path]" class="reason"> - {{ (content as NotificationMessageDetails).reasons?.[path] }} </span>
                 </li>
               </ul>
             </div>
           </template>
           
                       <!-- Multi-line keyboard shortcuts (like Add Files/Folders) -->
            <template v-else-if="keyboardShortcut && keyboardShortcutLines.length > 1">
              <div 
                v-for="(shortcut, index) in keyboardShortcutLines" 
                :key="index"
                class="info-line keyboard-shortcut-line"
              >
                <span class="keyboard-action-text">{{ getActionText(shortcut) }}</span>
                <HotKey :keys="getShortcutParts(getShortcutKey(shortcut))" :disabled="isTargetDisabled" />
              </div>
            </template>
           
                                   <!-- Single keyboard shortcut (like Refresh, Remove, etc.) -->
             <template v-else-if="keyboardShortcut && keyboardShortcutLines.length === 1">
               <div class="info-line tooltip-text-content">
                 <span>{{ content.text }}</span>
               </div>
               <div class="info-line keyboard-shortcut-line">
                 <span class="keyboard-action-text">{{ getActionName(content.text) }}</span>
                 <HotKey :keys="getShortcutParts(keyboardShortcut)" :disabled="isTargetDisabled" />
               </div>
             </template>
           
           <!-- Simple text content with icon -->
           <template v-else-if="'text' in content && !('filePaths' in content) && content.icon">
             <div class="info-line tooltip-text-content">
               <Icon :name="content.icon" class="tooltip-icon" />
               <span>{{ content.text }}</span>
             </div>
           </template>
           
           <!-- Simple text content (legacy parsing) -->
           <template v-else-if="parsedContent">
             <div class="info-line tooltip-text-content">
               <span>{{ parsedContent.mainText }}</span>
               <span v-if="parsedContent.shortcut" class="shortcut-key-text">{{ parsedContent.shortcut }}</span>
             </div>
           </template>
           
           <!-- Simple text content without icon or shortcuts -->
           <template v-else-if="'text' in content && !('filePaths' in content)">
             <div class="info-line tooltip-text-content">
               <span>{{ content.text }}</span>
             </div>
           </template>
         </div>
        <!-- Use an inline SVG for a perfect, styleable arrow -->
        <svg ref="arrowRef" class="tooltip-arrow" :data-side="side" :style="arrowStyle" viewBox="0 0 16 9">
          <path d="M 0 0 L 8 8 L 16 0" />
        </svg>
      </div>
    </Transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, toRef, watch, nextTick, onUnmounted, type PropType } from "vue";
import type { NotificationMessageDetails } from "@/stores/uiStore";
import { useFloating, autoUpdate, offset, flip, shift, arrow } from "@floating-ui/vue";
import type { MaybeElement } from "@vueuse/core";
import { logUI, logRendering, logTooltip } from "@/utils/loggers";
import { useDebugStore } from "@/stores/debugStore";
import HotKey from "@/components/HotKey.vue";
// Allow a simple text property for more generic tooltips
type TooltipContent = NotificationMessageDetails | { text: string; icon?: string };

const debugStore = useDebugStore();

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  content: {
    type: Object as PropType<TooltipContent>,
    required: true,
  },
  target: {
    type: Object as PropType<MaybeElement>,
    default: null,
  },
  debugForceVisible: {
    type: Boolean,
    default: false,
  },
  // When true the tooltip allows pointer interactions (e.g., clickable links).
  // Default false so tooltips don't block underlying controls.
  interactive: {
    type: Boolean,
    default: false,
  },
  // When false, avoid flipping the tooltip to any `top-*` placement. Useful
  // for controls pinned to the top edge where we always want the tooltip
  // to appear below the target.
  allowFlipToTop: {
    type: Boolean,
    default: true,
  },
  placement: {
    type: String as PropType<"top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end">,
    default: "top",
  },
  fallbackPlacements: {
    type: Array as PropType<("top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end")[]>,
    default: () => [],
  },
  // Optional keyboard shortcut to display with icon
  keyboardShortcut: {
    type: String,
    default: "",
  },
});
// Define emits for mouse events
const emit = defineEmits<{
  mouseenter: [event: MouseEvent];
  mouseleave: [event: MouseEvent];
}>();
const floatingRef = ref<HTMLElement | null>(null);
const arrowRef = ref(null);
// Computed property to determine if tooltip should be rendered in DOM
const shouldRender = computed(() => {
  return props.visible || props.debugForceVisible;
});

// Computed property to determine if tooltip is in debug mode (permanently visible)
const isDebugMode = computed(() => {
  return props.visible && !props.interactive;
});
// Resolve the provided `target` prop to the "best" DOM element to anchor to.
// If a CustomButton (or its wrapper) is passed, prefer its internal
// `.visual-style` element when available so tooltips anchor to the visible surface.
const resolvedTarget = computed(() => {
  const raw = (props as any).target;
  if (!raw) {
    // Only log when tooltip is visible to avoid spam
    if (props.visible || props.debugForceVisible) {
      logTooltip("InfoTooltip", "No target provided", { target: props.target });
    }
    return null;
  }
  
  // Unwrap refs if necessary
  const maybe = raw && (raw.value !== undefined ? raw.value : raw);
  
  // If a component instance exposing `visualStyleRef` was passed, use that
  if (maybe && typeof maybe === "object") {
    // Component proxy exposing a ref
    const vsRef = maybe.visualStyleRef ?? maybe.getTriggerVisualStyle ?? null;
    if (vsRef) {
      // vsRef may be a Ref or a direct element-returning function
      if (typeof vsRef === "function") {
        try {
          const el = vsRef();
          if (el instanceof Element) {
            logTooltip("InfoTooltip", "Resolved target via function", { element: el, target: props.target });
            return el;
          }
        } catch (e) {
          logTooltip("InfoTooltip", "Error calling visual style function", { error: e, target: props.target });
        }
      } else if (vsRef.value instanceof Element) {
        logTooltip("InfoTooltip", "Resolved target via ref value", { element: vsRef.value, target: props.target });
        return vsRef.value;
      }
    }
  }
  
  // If an Element was passed, prefer its `.visual-style` child when present
  if (maybe instanceof Element) {
    const inner = (maybe as Element).querySelector?.(".visual-style");
    if (inner) {
      logTooltip("InfoTooltip", "Resolved target via .visual-style child", { element: inner, parent: maybe, target: props.target });
      return inner as Element;
    }
    logTooltip("InfoTooltip", "Resolved target directly as Element", { element: maybe, target: props.target });
    return maybe as Element;
  }
  
  logTooltip("InfoTooltip", "Could not resolve target", { raw, maybe, target: props.target });
  return null;
});

// Check if the target element is disabled
const isTargetDisabled = computed(() => {
  const target = resolvedTarget.value;
  if (!target) return false;
  
  // Force reactivity by accessing target properties
  // This ensures the computed property updates when the target's state changes
  const targetElement = target as HTMLElement;
  
  // Log disabled state detection for debugging
  if (props.visible || props.debugForceVisible) {
    const hasDisabledAttr = targetElement.hasAttribute('disabled');
    const hasDisabledClass = targetElement.classList.contains('disabled');
    const isButtonDisabled = targetElement instanceof HTMLButtonElement && targetElement.disabled;
    const disabledButton = targetElement.closest('button[disabled], .disabled');
    const ariaDisabled = targetElement.getAttribute('aria-disabled') === 'true';
    const computedStyle = window.getComputedStyle(targetElement);
    const pointerEventsNone = computedStyle.pointerEvents === 'none';
    
    logTooltip("InfoTooltip", "Disabled state detection", {
      target: targetElement,
      targetTagName: targetElement.tagName,
      targetClassName: targetElement.className,
      hasDisabledAttr,
      hasDisabledClass,
      isButtonDisabled,
      disabledButton: disabledButton ? disabledButton.tagName + '.' + disabledButton.className : null,
      ariaDisabled,
      pointerEvents: computedStyle.pointerEvents,
      pointerEventsNone,
      isDisabled: hasDisabledAttr || hasDisabledClass || isButtonDisabled || !!disabledButton || ariaDisabled || pointerEventsNone
    });
  }
  
  // Check if the target element itself is disabled
  if (targetElement.hasAttribute('disabled')) return true;
  
  // Check if the target has the disabled class
  if (targetElement.classList.contains('disabled')) return true;
  
  // Check if the target is a button and is disabled
  if (targetElement instanceof HTMLButtonElement && targetElement.disabled) return true;
  
  // Check if the target is inside a disabled button
  const disabledButton = targetElement.closest('button[disabled], .disabled');
  if (disabledButton) return true;
  
  // Additional check for aria-disabled attribute
  if (targetElement.getAttribute('aria-disabled') === 'true') return true;
  
  // Check computed styles for pointer-events: none (common disabled indicator)
  const computedStyle = window.getComputedStyle(targetElement);
  if (computedStyle.pointerEvents === 'none') return true;
  
  return false;
});
// Transition handlers for smooth enter/leave animations
const onEnter = (el: Element) => {
  // Ensure the element is properly positioned before showing
  nextTick(() => {
    if (el instanceof HTMLElement) {
      el.style.opacity = '1';
    }
  });
};
const onLeave = (el: Element) => {
  // Clean up any positioning when leaving
  if (el instanceof HTMLElement) {
    el.style.opacity = '0';
  }
};
// Debug: when visible, optionally log resolved target and rect to help diagnose placement
watch(
  () => props.visible,
  (v) => {
    logTooltip("InfoTooltip", `Visibility changed to ${v}`, { 
      visible: v, 
      interactive: props.interactive,
      content: props.content,
      placement: props.placement
    });
    if (v) {
      try {
        const el = resolvedTarget.value as Element | null;
        if (el) {
          logTooltip("InfoTooltip", "Resolved target element", { 
            element: el, 
            rect: el.getBoundingClientRect(),
            placement: props.placement,
            fallbackPlacements: props.fallbackPlacements,
            target: props.target
          });
        } else {
          logTooltip("InfoTooltip", "No resolved target", { target: props.target });
        }
      } catch (e) {
        logTooltip("InfoTooltip", "Error resolving target", { error: e, target: props.target });
      }
    } else {
      // Log when tooltip becomes invisible to track potential orphaned state
      logTooltip("InfoTooltip", "Tooltip became invisible", {
        wasVisible: true,
        content: props.content,
        target: props.target
      });
    }
  }
);

// Watch for debug option changes to handle tooltip closing when debug mode is disabled
// TODO: Re-enable when preventTooltipClosing property is added to debug store
// watch(
//   () => debugStore.debugOptions.preventTooltipClosing,
//   (preventClosing) => {
//     if (!preventClosing) {
//       // When debug mode is disabled, allow tooltips to close normally
//       logTooltip("InfoTooltip", "Debug mode disabled - tooltips can now close normally");
//     } else {
//       logTooltip("InfoTooltip", "Debug mode enabled - tooltips will stay visible");
//     }
//   }
// );

// Add periodic check for orphaned tooltips when visible
let orphanedCheckInterval: number | null = null;

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      // Start periodic checks for orphaned tooltips
      orphanedCheckInterval = window.setInterval(() => {
        const target = resolvedTarget.value;
        if (target) {
          // Check if target is still in DOM
          if (!document.contains(target)) {
            logTooltip("InfoTooltip", "ORPHANED TOOLTIP DETECTED: Target no longer in DOM", {
              target: target,
              targetTagName: target.tagName,
              targetClassName: target.className,
              content: props.content
            });
          }
          
          // Check if target is hidden
          const rect = target.getBoundingClientRect();
          const isHidden = rect.width === 0 || rect.height === 0 ||
                          target.style.display === 'none' ||
                          target.style.visibility === 'hidden' ||
                          target.offsetParent === null;
          
          if (isHidden) {
            logTooltip("InfoTooltip", "ORPHANED TOOLTIP DETECTED: Target is hidden", {
              target: target,
              targetTagName: target.tagName,
              rect: { width: rect.width, height: rect.height },
              display: target.style.display,
              visibility: target.style.visibility,
              offsetParent: target.offsetParent,
              content: props.content
            });
          }
          
          // Check if target is inside a closing dropdown
          const dropdownContent = target.closest('.dropdown-content');
          if (dropdownContent) {
            const computedStyle = window.getComputedStyle(dropdownContent);
            const hasPointerEvents = computedStyle.pointerEvents !== 'none';
            const hasOpacity = parseFloat(computedStyle.opacity) > 0;
            const hasContentReadyClass = dropdownContent.classList.contains('content-ready');
            
            if (!hasPointerEvents || !hasOpacity || !hasContentReadyClass) {
              logTooltip("InfoTooltip", "ORPHANED TOOLTIP DETECTED: Target in closing dropdown", {
                target: target,
                targetTagName: target.tagName,
                dropdownContent: dropdownContent.getAttribute('data-belongs-to'),
                pointerEvents: computedStyle.pointerEvents,
                opacity: computedStyle.opacity,
                hasContentReadyClass,
                content: props.content
              });
            }
          }
        }
        // Removed the else clause that was logging "No resolved target" when target is null
        // This was causing unnecessary orphaned tooltip detection logs
      }, 1000); // Check every second
    } else {
      // Stop periodic checks when tooltip becomes invisible
      if (orphanedCheckInterval) {
        clearInterval(orphanedCheckInterval);
        orphanedCheckInterval = null;
        logTooltip("InfoTooltip", "Stopped orphaned tooltip checks", {
          content: props.content
        });
      }
    }
  }
);

// Clean up interval on component unmount
onUnmounted(() => {
  if (orphanedCheckInterval) {
    clearInterval(orphanedCheckInterval);
    orphanedCheckInterval = null;
    logTooltip("InfoTooltip", "Cleaned up orphaned tooltip checks on unmount");
  }
});

// Also watch for target changes and stop orphaned checks if target becomes null
watch(
  () => props.target,
  (newTarget) => {
    if (!newTarget && orphanedCheckInterval) {
      clearInterval(orphanedCheckInterval);
      orphanedCheckInterval = null;
      logTooltip("InfoTooltip", "Stopped orphaned tooltip checks due to null target");
    }
  }
);
const { floatingStyles, middlewareData, placement } = useFloating(resolvedTarget, floatingRef, {
  placement: toRef(props, "placement"),
  whileElementsMounted: autoUpdate,
  // Prefer keeping the tooltip below the target even when horizontal space is tight.
  // Provide an explicit fallback ordering so we try bottom-start / bottom-end first.
  // If `allowFlipToTop` is false, never include top placements in the fallbacks.
  middleware: [
    // Slightly larger vertical offset so the tooltip sits clearly below the target
    // and is less likely to overlap it when near the window edge.
    // Slightly smaller offset so tooltip sits closer to the visual surface
    offset(8),
    flip({
      fallbackPlacements: props.fallbackPlacements.length > 0 
        ? props.fallbackPlacements
        : (props.allowFlipToTop
          ? [
              "bottom-start",
              "bottom-end",
              "right-start",
              "right-end",
              "left-start",
              "left-end",
              "top-start",
              "top-end",
            ]
          : [
              "bottom-start",
              "bottom-end",
              "right-start",
              "right-end",
              "left-start",
              "left-end",
            ]),
    }),
    shift({ padding: 8 }),
    arrow({ 
      element: arrowRef, 
      padding: 8, // Increased padding for better alignment
    }),
  ],
});
const side = computed(() => {
  const currentSide = placement.value.split("-")[0];
  // Disabled logging for InfoTooltip
  // if (props.visible || props.debugForceVisible) {
  //   logRendering("InfoTooltip", "Side computed", { side: currentSide, placement: placement.value });
  // }
  return currentSide;
});
const parsedContent = computed(() => {
  if ("text" in props.content) {
    const match = props.content.text.match(/\s*\(([^)]+)\)$/);
    if (match) {
      const mainText = props.content.text.replace(match[0], "").trim();
      const shortcut = `(${match[1]})`;
      return { mainText, shortcut };
    }
    return { mainText: props.content.text, shortcut: null };
  }
  return null;
});

// Split keyboard shortcut text into lines for separate rendering
const keyboardShortcutLines = computed(() => {
  if (!props.keyboardShortcut) return [];
  return props.keyboardShortcut.split('\n').filter(line => line.trim());
});

// Debug logging for tooltip content
const debugTooltipContent = computed(() => {
  if (DEBUG && debugConfig.logUIInteractivity && props.visible) {
    logUI("InfoTooltip", "Tooltip content debug", {
      hasText: 'text' in props.content,
      hasFilePaths: 'filePaths' in props.content,
      hasIcon: 'icon' in props.content,
      content: props.content,
      parsedContent: parsedContent.value,
      templateCondition: 'text' in props.content && !('filePaths' in props.content)
    });
  }
  return props.content;
});
const arrowStyle = computed(() => {
  const { x, y } = middlewareData.value.arrow || {};
  const currentSide = side.value;
  // Disabled logging for InfoTooltip
  // if (props.visible || props.debugForceVisible) {
  //   logRendering("InfoTooltip", "Arrow style computed", { 
  //     side: currentSide, 
  //     arrowX: x, 
  //     arrowY: y,
  //     placement: placement.value 
  //   });
  // }
  const logicalSideMap = {
    top: "inset-block-end",
    right: "inset-inline-start",
    bottom: "inset-block-start",
    left: "inset-inline-end",
  };
  const staticSide = logicalSideMap[currentSide as keyof typeof logicalSideMap];
  if (!staticSide) {
    // Disabled logging for InfoTooltip
    // if (props.visible || props.debugForceVisible) {
    //   logUI("InfoTooltip", "No static side found", { side: currentSide });
    // }
    return {};
  }
  // Measure arrow element dimensions when available for precise positioning
  const arrowDimensions = (() => {
    try {
      const el = arrowRef.value as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        return {
          width: rect.width || 16,
          height: rect.height || 9,
        };
      }
    } catch (e) {
      /* ignore */
    }
    return { width: 16, height: 9 };
  })();
  // Calculate offset to position arrow flush with tooltip edge
  const offsetValue = `-${Math.round(arrowDimensions.height)}px`;
  // Apply additional centering adjustments for better alignment
  let adjustedX = x;
  let adjustedY = y;
  // For right-side placement, ensure arrow is vertically centered
  if (currentSide === 'right' && y !== undefined) {
    // Center the arrow vertically on the target
    adjustedY = y;
  }
  // For bottom placement, ensure arrow is horizontally centered  
  if (currentSide === 'bottom' && x !== undefined) {
    // Center the arrow horizontally on the target
    adjustedX = x;
  }
  // Account for tooltip border radius and padding in arrow positioning
  const tooltipBorderRadius = 8; // Should match CSS border-radius
  const tooltipPadding = 10; // Should match CSS padding-inline
  // Adjust arrow position to account for border radius
  if (currentSide === 'right' && adjustedX !== undefined) {
    // For right placement, ensure arrow doesn't get too close to the edge
    adjustedX = Math.max(tooltipPadding, adjustedX);
  }
  if (currentSide === 'bottom' && adjustedY !== undefined) {
    // For bottom placement, ensure arrow doesn't get too close to the edge
    adjustedY = Math.max(tooltipPadding, adjustedY);
  }
  const style = {
    insetInlineStart: adjustedX != null ? `${adjustedX}px` : "",
    insetBlockStart: adjustedY != null ? `${adjustedY}px` : "",
    [staticSide]: offsetValue,
  };
  // Disabled logging for InfoTooltip
  // if (props.visible || props.debugForceVisible) {
  //   logRendering("InfoTooltip", "Arrow style result", { 
  //     style, 
  //     arrowDimensions,
  //     originalX: x,
  //     originalY: y,
  //     adjustedX,
  //     adjustedY
  //   });
  // }
  return style;
});
const getFileName = (path: string) => {
  return path.split(/[\\/]/).pop() || path;
};

// Helper functions for keyboard shortcut parsing
const getActionText = (shortcut: string) => {
  const colonIndex = shortcut.indexOf(':');
  if (colonIndex !== -1) {
    return shortcut.substring(0, colonIndex).trim();
  }
  return shortcut;
};

const getShortcutKey = (shortcut: string) => {
  const colonIndex = shortcut.indexOf(':');
  if (colonIndex !== -1) {
    return shortcut.substring(colonIndex + 1).trim();
  }
  return shortcut;
};

// Extract action name from description text (e.g., "Refresh the item list" -> "Refresh")
const getActionName = (description: string) => {
  // Common patterns for extracting action names
  const patterns = [
    /^(\w+)\s+the\s+/i, // "Refresh the item list" -> "Refresh"
    /^(\w+)\s+selected\s+/i, // "Remove selected items" -> "Remove"
    /^(\w+)\s+to\s+/i, // "Copy to another job" -> "Copy"
    /^(\w+)\s+from\s+/i, // "Remove from this job" -> "Remove"
    /^(\w+)\s+display\s+/i, // "File table display settings" -> "File"
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  // Fallback: return first word
  return description.split(' ')[0];
};

// Get shortcut parts for template rendering (returns array instead of HTML string)
const getShortcutParts = (shortcut: string) => {
  if (!shortcut) return [];
  
  // Split by common separators and handle special cases
  const parts = shortcut
    .toUpperCase()
    .split(/[+\-]/) // Split on + or - but don't keep the separators
    .map(part => part.trim()) // Trim whitespace
    .filter(part => part.length > 0); // Remove empty parts
  
  return parts;
};
</script>

<style scoped>
/* 
  IMPORTANT: All tooltip CSS has been moved to app/components/info-tooltip-comp/info-tooltip.scoped.css
  DO NOT add any CSS here - add it to the dedicated CSS file instead.
  
  CSS file location: app/components/info-tooltip-comp/info-tooltip.scoped.css
*/
@import './info-tooltip-comp/info-tooltip.scoped.css';
</style>
