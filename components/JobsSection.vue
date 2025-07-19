<!-- components/JobsSection.vue @preserve -->
<!--
  Description:
  This component is a container for the JobSelectorArea and JobArea. It passes
  the `isExternalDragOver` state from the `dragDropStore` to `JobArea`, connecting
  the global state to the component that handles the UI and events. Added logging
  to debug `isExternalDragOver` state changes for drag-and-drop troubleshooting.
  The @dragover.prevent and @drop.prevent handlers are added to ensure the OS
  recognizes this entire section as a valid drop target.

  Usage Example:
  This component is used within a page layout to structure the main job
  management interface.
-->
<template>
  <section
    id="jobs-section"
    data-component-name="JobsSection"
    :class="{
      'vertical-job-selector-list': uiStore.jobSelectorOrientation === 'vertical',
    }"
    @dragover.prevent
    @drop.prevent
  >
    <JobSelectorArea />
    <JobArea :is-external-drag-over="isExternalDragOver" />
  </section>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useUiStore } from "@/stores/uiStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { logDragDropEvent } from "@/utils/loggers";

const uiStore = useUiStore();
const dragDropStore = useDragDropStore();
const isExternalDragOver = computed(() => dragDropStore.isExternalDragOver);

// Debug isExternalDragOver state changes
watch(
  isExternalDragOver,
  (newValue) => {
    logDragDropEvent("JobsSection", `isExternalDragOver prop changed to: ${newValue}`);
  },
  { immediate: true }
);
</script>

<style scoped>
#jobs-section {
  background-color: var(--bg-clr-darkr);
  border-block-end-width: 1px;
  border-block-start-width: 1px;
  border-inline-end-width: 1px;
  border-inline-start-width: 1px;
  border-style: solid;
  border-color: var(--brdr-clr);
  border-end-end-radius: var(--brdr-rad);
  border-end-start-radius: var(--brdr-rad);
  border-start-end-radius: var(--brdr-rad);
  border-start-start-radius: var(--brdr-rad);
  display: grid;
  grid-area: jobs-section;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  overflow: hidden;

  @media (width < 1024px) {
    & {
      border-inline-end-width: 0;
      border-inline-start-width: 0;
      border-end-end-radius: 0;
      border-end-start-radius: 0;
      border-start-end-radius: 0;
      border-start-start-radius: 0;
    }
  }

  &:deep(.job-selector-area) {
    border-block-end-width: 1px;
    border-block-start-width: 0;
    border-inline-end-width: 0;
    border-inline-start-width: 0;
    border-style: solid;
    border-color: var(--brdr-clr);
  }

  &.vertical-job-selector-list {
    grid-template-columns: auto 1fr;
    grid-template-rows: 1fr;

    &:deep(.job-selector-area) {
      border-block-end-width: 0;
      border-block-start-width: 0;
      border-inline-end-width: 1px;
      border-inline-start-width: 0;
      border-style: solid;
      border-color: var(--brdr-clr);
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
      min-inline-size: 0;
      padding-inline-end: 0;
      padding-inline-start: 0;

      & .job-selector-btn-wrapper {
        flex-direction: column;
      }

      & .job-selector-list {
        align-items: stretch;
        display: flex;
        flex-direction: column;
        padding-block-end: 8px;
        padding-block-start: 8px;
        row-gap: 4px;

        & button.job-selector {
          --line-orientation: vertical !important;
          min-width: unset;

          & > .visual-style,
          &:before {
            --visual-style-inset: 0px;
          }
        }
      }
    }
  }
}
</style>
