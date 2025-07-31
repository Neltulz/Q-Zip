<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/InfoTooltip.vue @preserve -->
<template>
  <teleport to="body">
    <div v-if="visible" ref="tooltipRef" class="info-tooltip" :style="tooltipStyle">
      <div class="tooltip-content">
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
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, type PropType, type StyleValue } from "vue";
import type { NotificationMessageDetails } from "@/stores/uiStore";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  content: {
    type: Object as PropType<NotificationMessageDetails>,
    required: true,
  },
  targetRect: {
    type: Object as PropType<DOMRect | null>,
    default: null,
  },
});

const tooltipRef = ref<HTMLElement | null>(null);
const tooltipHeight = ref(0);

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      nextTick(() => {
        if (tooltipRef.value) {
          tooltipHeight.value = tooltipRef.value.offsetHeight;
        }
      });
    }
  }
);

const tooltipStyle = computed((): StyleValue => {
  if (!props.targetRect || !props.visible) {
    return { visibility: "hidden" };
  }

  const { top, right, height } = props.targetRect;
  const tooltipTop = top + height / 2 - tooltipHeight.value / 2;
  const tooltipLeft = right + 8; // 8px gap

  return {
    top: `${tooltipTop}px`,
    left: `${tooltipLeft}px`,
  };
});

const getFileName = (path: string) => {
  return path.split(/[\\/]/).pop() || path;
};
</script>

<style scoped>
/* FEAT: Allow tooltip to expand and prevent horizontal scroll */
.info-tooltip {
  position: fixed;
  z-index: 10001; /* Higher than notification popover */
  background-color: var(--bg-clr-liter);
  border: 1px solid var(--brdr-clr-lite);
  border-radius: var(--brdr-rad-smal);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 8px 12px;
  width: max-content; /* Allow width to grow based on content */
  min-width: 200px; /* Set a minimum width */
  max-width: 500px; /* Set a maximum width */
  pointer-events: auto; /* Allow mouse interaction */
}

.tooltip-content {
  font-size: 0.8rem;
  color: var(--txt-clr);
}

.info-line {
  margin-bottom: 4px;
}

hr {
  border: none;
  border-top: 1px solid var(--brdr-clr);
  margin: 6px 0;
}

.file-list-container {
  max-height: 200px;
  overflow-y: auto;
}

.file-list {
  list-style: none;
  padding-left: 12px;
  margin: 4px 0 0 0;
  display: grid; /* Changed from flex to grid */
  gap: 2px;
}

.file-list li {
  display: grid; /* Use grid for alignment */
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.file-name {
  /* Allow file names to wrap if they are too long */
  white-space: normal;
  word-break: break-all;
}

.reason {
  color: var(--txt-clr-dark);
  font-style: italic;
  white-space: nowrap;
}
</style>
