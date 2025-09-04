<!-- components/JobsSection.vue @preserve -->
<!-- 
  JobsSection.vue @preserve
-->
<!--
  Description:
  This component is a container for the JobSelectorArea and JobArea.
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
  >
    <JobSelectorArea />
    <div class="main-content-area">
      <OutputControls
        ref="outputControls"
        @request-auto-location="$emit('request-auto-location')"
        @request-auto-filename="$emit('request-auto-filename')"
      />
      <JobArea
        @files-added="$emit('files-added', $event)"
        @folders-added="$emit('folders-added', $event)"
      />
    </div>
  </section>
</template>
<script setup lang="ts">
import { useUiStore } from "@/stores/uiStore";
import JobArea from "./JobArea.vue";
import JobSelectorArea from "./JobSelectorArea.vue";
import OutputControls from "./OutputControls.vue";

const emit = defineEmits<{
  "files-added": [paths: string[]];
  "folders-added": [paths: string[]];
  "request-auto-location": [];
  "request-auto-filename": [];
}>();

const uiStore = useUiStore();
</script>
<style scoped>
#jobs-section {
  background-color: var(--btn-bg-activ-clr-dark, var(--bg-clr-lite));
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

  .main-content-area {
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    padding: 8px;
    row-gap: 8px;
  }

  &:deep(.file-table-comp) {
    border-radius: 8px;
  }

  &:deep(.file-table-visual-select) {
    border-radius: 8px;
  }

  &:deep(.file-table-toolbar) {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
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
          border-radius: 0 var(--brdr-rad-smalr) var(--brdr-rad-smalr) 0;
          & > .visual-style,
          &:before {
            --visual-style-inset: 0px;
          }
          & > .visual-style {
            inset-block-end: 0px;
            inset-block-start: 0px;
            inset-inline-end: 0px;
            inset-inline-start: 8px;
            border-bottom-left-radius: var(--brdr-rad) !important;
            border-bottom-right-radius: 0;
            border-top-left-radius: var(--brdr-rad);
            border-top-right-radius: 0;
          }
        }
      }
    }

    .main-content-area {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
    }
  }
}
</style>
