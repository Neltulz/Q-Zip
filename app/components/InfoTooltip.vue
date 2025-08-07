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
    <Transition name="tooltip-fade">
      <div v-if="visible || debugForceVisible" ref="floatingRef" class="info-tooltip" :style="floatingStyles">
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
    </Transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, toRef, type PropType } from "vue";
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
});

const floatingRef = ref<HTMLElement | null>(null);
const arrowRef = ref(null);

const { floatingStyles, middlewareData, placement } = useFloating(toRef(props, "target"), floatingRef, {
  placement: "top",
  whileElementsMounted: autoUpdate,
  middleware: [offset(10), flip(), shift({ padding: 5 }), arrow({ element: arrowRef, padding: 4 })],
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

  // The offset now accounts for the new, larger SVG's height
  const offsetValue = "-9px";

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
.tooltip-fade-enter-active {
  transition: opacity 150ms ease-in-out;
}
.tooltip-fade-leave-active {
  transition: opacity 300ms ease-in-out;
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
  pointer-events: auto;
  white-space: nowrap;
  display: flex;
  align-items: center;
  padding-block: 8px;
  padding-inline: 12px;

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
      gap: 0.5em;
      position: relative;
      inset-block-start: 1px;
    }

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
</style>
