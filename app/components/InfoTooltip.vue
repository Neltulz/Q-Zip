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
    keyboard-shortcut="Ctrl+C"
  />
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
        :class="{ interactive: interactive, 'simple-tooltip': !!parsedContent }"
        :style="floatingStyles"
        @mouseenter="(event) => emit('mouseenter', event)"
        @mouseleave="(event) => emit('mouseleave', event)"
      >
        <div class="tooltip-content">
          <!-- Display simple text content with optional icon (check first) -->
          <template v-if="'text' in content && !('filePaths' in content) && content.icon">
            <div class="info-line tooltip-text-content">
              <Icon :name="content.icon" class="tooltip-icon" />
              <span>{{ content.text }}</span>
            </div>
          </template>
          <!-- Display simple text content (legacy parsing) -->
          <template v-else-if="parsedContent">
            <div class="info-line tooltip-text-content">
              <span>{{ parsedContent.mainText }}</span>
              <span v-if="parsedContent.shortcut" class="shortcut-key-text">{{ parsedContent.shortcut }}</span>
            </div>
          </template>
          <!-- Display simple text content without icon -->
          <template v-else-if="'text' in content && !('filePaths' in content)">
            <div class="info-line tooltip-text-content">
              <span>{{ content.text }}</span>
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
              <Icon name="mdi:keyboard" class="keyboard-icon" />
              <span class="keyboard-shortcut-text">{{ keyboardShortcut }}</span>
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
import { ref, computed, toRef, watch, nextTick, type PropType } from "vue";
import type { NotificationMessageDetails } from "@/stores/uiStore";
import { useFloating, autoUpdate, offset, flip, shift, arrow } from "@floating-ui/vue";
import type { MaybeElement } from "@vueuse/core";
import { logUI, logRendering } from "@/utils/loggers";
import { Icon } from "#components";
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
    // Disabled logging for InfoTooltip
    // logUI("InfoTooltip", "Visibility changed", { visible: v, interactive: props.interactive });
    if (v) {
      try {
        const el = resolvedTarget.value as Element | null;
        if (el) {
          // Disabled logging for InfoTooltip
          // logUI("InfoTooltip", "Resolved target element", { 
          //   element: el, 
          //   rect: el.getBoundingClientRect(),
          //   placement: props.placement,
          //   fallbackPlacements: props.fallbackPlacements
          // });
        } else {
          // Disabled logging for InfoTooltip
          // logUI("InfoTooltip", "No resolved target");
        }
      } catch (e) {
        // Disabled logging for InfoTooltip
        // logUI("InfoTooltip", "Error resolving target", { error: e });
      }
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
</script>
<style scoped>
/* Transition animations for smooth enter/leave */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 240ms cubic-bezier(0.2, 0, 0, 1);
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
.info-tooltip {
  position: absolute;
  z-index: 100002;
  background-color: hsla(var(--bg-hue), var(--bg-sat), calc(var(--bg-lum) * 2.2), 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid var(--brdr-clr-liter);
  border-radius: var(--brdr-rad-smal);
  box-shadow: 0 2px 15px hsla(0, 0%, 0%, 0.5);
  inline-size: max-content;
  min-inline-size: var(--min-tch-tgt);
  max-inline-size: 500px;
  /* Default: don't capture pointer events so tooltips don't block underlying controls */
  pointer-events: none;
  white-space: nowrap;
  display: flex;
  align-items: center;
  padding-block: 6px;
  padding-inline: 10px;
  .tooltip-arrow {
    position: absolute;
    inline-size: 16px;
    block-size: 9px;
    /* Ensure arrow is properly centered and positioned */
    transform-origin: center;
    /* Prevent any layout shifts */
    pointer-events: none;
    path {
      fill: hsla(var(--bg-hue), var(--bg-sat), calc(var(--bg-lum) * 2.2), 0.75);
      stroke: var(--brdr-clr-liter);
      stroke-width: 1px;
      /* Ensure the path is centered within the SVG */
      vector-effect: non-scaling-stroke;
    }
    &[data-side="bottom"] {
      transform: rotate(180deg);
    }
    &[data-side="left"] {
      transform: rotate(-90deg);
    }
    &[data-side="right"] {
      transform: rotate(90deg);
    }
  }
  .tooltip-content {
    font-size: 1em;
    color: var(--txt-clr-liter);
    .tooltip-text-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5em;
      position: relative;
      inset-block-start: 1px;
      width: 100%;
      text-align: center;
      
      .tooltip-icon {
        width: 16px;
        height: 16px;
        color: var(--txt-clr-liter);
        flex-shrink: 0;
      }
    }
    /* Only center the simple text tooltip mode; keep other structured content left-aligned.
       Use a non-nested selector below to target when the root tooltip also has the
       `simple-tooltip` class (the previous nested selector was not matching). */
    .info-line {
      margin-block-end: 4px;
    }
    hr {
      border: none;
      border-block-start: 1px solid var(--brdr-clr);
      margin-block: 6px;
      margin-inline: 0;
    }
    .file-list-container {
      max-block-size: 200px;
      overflow-y: auto;
    }
    .file-list {
      list-style: none;
      padding-inline-start: 12px;
      margin-block-start: 4px;
      margin-block-end: 0;
      margin-inline: 0;
      display: grid;
      gap: 2px;
      li {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        .file-name {
          white-space: normal;
          word-break: break-all;
        }
        .reason {
          color: var(--txt-clr-dark);
          font-style: italic;
          white-space: nowrap;
        }
      }
    }
    .keyboard-shortcut-line {
      display: flex;
      align-items: center;
      gap: 0.5em;
      margin-block-start: 4px;
      .keyboard-icon {
        width: 16px;
        height: 16px;
        color: var(--blu-lite); /* Use the blue color from styles.css */
        flex-shrink: 0;
      }
      .keyboard-shortcut-text {
        font-size: 0.9em;
        color: var(--blu-lite); /* Use the blue color from styles.css */
        font-weight: 500;
      }
    }
  }
}
/* Only when it's visible AND interactive should it get pointer events */
.info-tooltip.interactive {
  pointer-events: auto;
}
/* For simple-text tooltips, center the tooltip body itself so the arrow
   and content remain visually centered. Applying justify-content to the
   root `.info-tooltip` element is more reliable than targeting an inner
   child when positioning is handled by Floating UI. */
.info-tooltip.simple-tooltip {
  justify-content: center;
  text-align: center; /* also ensure text within is centered */
}
</style>
