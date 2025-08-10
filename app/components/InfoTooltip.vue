<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/InfoTooltip.vue @preserve -->

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

  Key features:
  - Teleport to body for layering reliability
  - Smart positioning (offset, flip, shift, arrow)
  - Simple text mode with shortcut extraction
  - Rich details mode for notification/message details

  Props:
  - visible: boolean — Controls visibility
  - content: TooltipContent (NotificationMessageDetails | { text: string }) — What to display
  - target: MaybeElement — The reference element for positioning
  - debugForceVisible: boolean — Forces visibility for debugging

  Example usage:
  <InfoTooltip
    :visible="isTooltipVisible"
    :content="{ text: 'Copy (Ctrl+C)' }"
    :target="buttonRef"
  />
-->
<template>
  <teleport to="body">
      <div
        ref="floatingRef"
        class="info-tooltip"
        :class="{ interactive: interactive, 'simple-tooltip': !!parsedContent, 'is-visible': visible || debugForceVisible }"
        :style="floatingStyles"
      >
        <div class="tooltip-content">
          <!-- Display simple text content -->
          <template v-if="parsedContent">
            <div class="info-line tooltip-text-content">
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
        </div>
        <!-- Use an inline SVG for a perfect, styleable arrow -->
        <svg ref="arrowRef" class="tooltip-arrow" :data-side="side" :style="arrowStyle" viewBox="0 0 16 9">
          <path d="M 0 0 L 8 8 L 16 0" />
        </svg>
      </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, toRef, watch, type PropType } from "vue";
import type { NotificationMessageDetails } from "@/stores/uiStore";
import { useFloating, autoUpdate, offset, flip, shift, arrow } from "@floating-ui/vue";
import type { MaybeElement } from "@vueuse/core";

// Allow a simple text property for more generic tooltips
type TooltipContent = NotificationMessageDetails | { text: string };

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
});

const floatingRef = ref<HTMLElement | null>(null);
const arrowRef = ref(null);

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

// Debug: when visible, optionally log resolved target and rect to help diagnose placement
watch(
  () => props.visible,
  (v) => {
    if (v) {
      try {
        const el = resolvedTarget.value as Element | null;
        if (el) {
          // eslint-disable-next-line no-console
          console.debug("InfoTooltip: resolved target element:", el, el.getBoundingClientRect());
        } else {
          // eslint-disable-next-line no-console
          console.debug("InfoTooltip: no resolved target");
        }
      } catch (e) {
        // ignore
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
      fallbackPlacements: (props.allowFlipToTop
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
    arrow({ element: arrowRef, padding: 4 }),
  ],
});

const side = computed(() => placement.value.split("-")[0]);

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

  const logicalSideMap = {
    top: "inset-block-end",
    right: "inset-inline-start",
    bottom: "inset-block-start",
    left: "inset-inline-end",
  };

  const staticSide = logicalSideMap[side.value as keyof typeof logicalSideMap];

  if (!staticSide) return {};

  // Measure arrow element height when available so we can offset it precisely
  // to sit flush with the tooltip body. Fall back to 9px if measurement not ready.
  const measuredHeight = (() => {
    try {
      const el = arrowRef.value as HTMLElement | null;
      if (el) {
        const h = el.getBoundingClientRect().height;
        if (h && !Number.isNaN(h)) return h;
      }
    } catch (e) {
      /* ignore */
    }
    return 9;
  })();

  const offsetValue = `-${Math.round(measuredHeight)}px`;

  return {
    insetInlineStart: x != null ? `${x}px` : "",
    insetBlockStart: y != null ? `${y}px` : "",
    [staticSide]: offsetValue,
  };
});

const getFileName = (path: string) => {
  return path.split(/[\\/]/).pop() || path;
};
</script>

<style scoped>
/* Use opacity transitions on the persistent element. We rely on the
   `.is-visible` class to toggle opacity so the element stays mounted while
   moving between adjacent targets, preventing unmount/mount flicker. */
.info-tooltip {
  opacity: 0;
  transition-property: opacity;
  transition-duration: 240ms;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
.info-tooltip.is-visible {
  opacity: 1;
  /* When becoming visible, use the enter timing */
  transition-duration: 240ms;
}
.info-tooltip:not(.is-visible) {
  /* When hiding, ensure a slower fade-out */
  transition-duration: 420ms;
  transition-timing-function: cubic-bezier(0.33, 0, 0.1, 1);
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

  .info-tooltip {
  position: absolute;
  z-index: 10001;
  background-color: hsla(var(--bg-hue), var(--bg-sat), calc(var(--bg-lum) * 2.2), 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid var(--brdr-clr-liter);
  border-radius: var(--brdr-rad-smal);
  box-shadow: 0 2px 15px hsla(0, 0%, 0%, 0.5);
  inline-size: max-content;
  min-inline-size: 150px;
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

    path {
      fill: hsla(var(--bg-hue), var(--bg-sat), calc(var(--bg-lum) * 2.2), 0.75);
      stroke: var(--brdr-clr-liter);
      stroke-width: 1px;
    }

    &[data-side="bottom"] {
      transform: rotate(180deg);
    }
    &[data-side="left"] {
      transform: rotate(90deg);
    }
    &[data-side="right"] {
      transform: rotate(-90deg);
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
  }
}

/* When interactive=true, allow pointer events on the tooltip */
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
