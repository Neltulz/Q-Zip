<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  InfoTooltipContainer.vue @preserve
-->
<!-- components/InfoTooltipContainer.vue @preserve -->
<!-- 
  InfoTooltipContainer.vue @preserve
-->
<!--
  InfoTooltipContainer.vue
  What it is:
  - A floating tooltip component that teleports to the tooltip container and positions itself
    relative to a target element using @floating-ui/vue.
  What it does:
  - Shows either simple text (with optional shortcut parsing like "Copy (Ctrl+C)")
    or a structured notification payload (e.g., source/destination jobs and a
    scrollable list of affected file paths with reasons).
  - Automatically flips/offsets/shifts to stay in view and renders a styled arrow
    pointing at the target element.
  - Uses a lightweight fade transition and high-contrast, blurred backdrop styling.
  Key features:
  - Teleport to tooltip container for better organization
  - Smart positioning (offset, flip, shift, arrow)
  - Simple text mode with shortcut extraction
  - Rich details mode for notification/message details
  - Conditional rendering - only mounts in DOM when visible
  Props:
  - visible: boolean — Controls visibility and DOM mounting
  - content: TooltipContent (NotificationMessageDetails | { text: string }) — What to display
  - target: MaybeElement — The reference element for positioning
  - debugForceVisible: boolean — Forces visibility for debugging
  Example usage:
  <InfoTooltipContainer
    :visible="isTooltipVisible"
    :content="{ text: 'Copy (Ctrl+C)' }"
    :target="buttonRef"
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
        :class="{ interactive: interactive, 'simple-tooltip': !!parsedContent, 'disabled-target': isTargetDisabled, [props.class]: props.class }"
        :style="floatingStyles"
        @mouseenter="(event) => emit('mouseenter', event)"
        @mouseleave="(event) => emit('mouseleave', event)"
      >
        <div class="tooltip-content">
          <!-- Display simple text content -->
          <template v-if="parsedContent">
            <div class="info-line tooltip-text-content" :style="maxWidth ? { maxWidth } : {}">
              <span>{{ parsedContent.mainText }}</span>
              <span v-if="parsedContent.shortcut" class="shortcut-key-text">{{ parsedContent.shortcut }}</span>
            </div>
          </template>
          <!-- Display structured notification details -->
          <template v-else-if="'filePaths' in content">
            <div v-if="content.sourceJobId" class="info-line"><strong>Source:</strong> Job {{ content.sourceJobId }}</div>
            <div v-if="content.destinationJobId" class="info-line">
              <strong>Destination:</strong> Job {{ content.destinationJobId }}
            </div>
            <hr v-if="content.sourceJobId || content.destinationJobId" />
            <div v-if="content.filePaths && content.filePaths.length > 0" class="file-list-container">
              <strong>Affected Items:</strong>
              <ul class="file-list">
                <li v-for="path in content.filePaths" :key="path">
                  <span class="file-name">{{ getFileName(path) }}</span>
                  <span v-if="content.reasons && content.reasons[path]" class="reason"> - {{ content.reasons[path] }} </span>
                </li>
              </ul>
            </div>
          </template>
          
          <!-- Keyboard shortcut slot -->
          <template v-if="keyboardShortcut">
            <div class="info-line keyboard-shortcut-line">
              <HotKey :keys="getShortcutParts(keyboardShortcut)" :disabled="isTargetDisabled" />
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
import { logUI, logRendering } from "@/utils/loggers";
import HotKey from "@/components/HotKey.vue";
// Allow a simple text property for more generic tooltips
type TooltipContent = NotificationMessageDetails | { text: string; icon?: string };
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
  maxWidth: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    default: "",
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
// Resolve the provided `target` prop to the "best" DOM element to anchor to.
// If a CustomButton (or its wrapper) is passed, prefer its internal
// `.visual-style` element when available so tooltips anchor to the visible surface.
const resolvedTarget = computed(() => {
  const raw = (props as any).target;
  if (!raw) return null;
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
          if (el instanceof Element) return el;
        } catch (e) {
          /* ignore */
        }
      } else if (vsRef.value instanceof Element) {
        return vsRef.value;
      }
    }
  }
  // If an Element was passed, prefer its `.visual-style` child when present
  if (maybe instanceof Element) {
    const inner = (maybe as Element).querySelector?.(".visual-style");
    if (inner) return inner as Element;
    return maybe as Element;
  }
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
    
    logUI("InfoTooltipContainer", "Disabled state detection", {
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
    logUI("InfoTooltipContainer", "Visibility changed", { visible: v, interactive: props.interactive, content: props.content });
    if (v) {
      try {
        const el = resolvedTarget.value as Element | null;
        if (el) {
          logUI("InfoTooltipContainer", "Resolved target element", { 
            element: el, 
            rect: el.getBoundingClientRect(),
            placement: props.placement,
            fallbackPlacements: props.fallbackPlacements,
            content: props.content
          });
        } else {
          logUI("InfoTooltipContainer", "No resolved target", { content: props.content });
        }
      } catch (e) {
        logUI("InfoTooltipContainer", "Error resolving target", { error: e, content: props.content });
      }
    } else {
      // Log when tooltip becomes invisible to track potential orphaned state
      logUI("InfoTooltipContainer", "Tooltip became invisible", {
        wasVisible: true,
        content: props.content,
        target: props.target
      });
    }
  }
);

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
            logUI("InfoTooltipContainer", "ORPHANED TOOLTIP DETECTED: Target no longer in DOM", {
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
            logUI("InfoTooltipContainer", "ORPHANED TOOLTIP DETECTED: Target is hidden", {
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
              logUI("InfoTooltipContainer", "ORPHANED TOOLTIP DETECTED: Target in closing dropdown", {
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
        } else {
          logUI("InfoTooltipContainer", "ORPHANED TOOLTIP DETECTED: No resolved target", {
            content: props.content,
            target: props.target
          });
        }
      }, 1000); // Check every second
    } else {
      // Stop periodic checks when tooltip becomes invisible
      if (orphanedCheckInterval) {
        clearInterval(orphanedCheckInterval);
        orphanedCheckInterval = null;
        logUI("InfoTooltipContainer", "Stopped orphaned tooltip checks", {
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
    logUI("InfoTooltipContainer", "Cleaned up orphaned tooltip checks on unmount");
  }
});
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
*/
@import './info-tooltip-comp/info-tooltip.scoped.css';
</style>
