<!-- eslint-disable vue/no-v-html -->
<!-- components/modals/ResetConfirmationModalContent.vue -->
<!--
  Description:
  This component displays the content for confirmation modals.
  It can show a simple description, a list of file names, or a
  two-column view detailing which items will be processed and which will be skipped.
  The file lists are scrollable, and columns are hidden if they are empty.
-->
<template>
  <div class="reset-confirmation-content">
    <!-- The main description text passed from the parent -->
    <template v-if="Array.isArray(props.description)">
      <!-- eslint-disable-next-line vue/html-self-closing -->
      <p v-for="(line, index) in props.description" :key="index" v-html="line"></p>
    </template>
    <!-- eslint-disable-next-line vue/html-self-closing -->
    <p v-else-if="props.description" v-html="props.description"></p>

    <!-- Two-column layout for showing files to be processed vs. skipped -->
    <div
      v-if="hasFileLists"
      class="two-column-grid"
      :class="{
        'has-both-columns': showProcessColumn && showSkipColumn,
      }"
    >
      <!-- FEAT: This column is now hidden if there are no items to process -->
      <div v-if="showProcessColumn" class="column process-column">
        <h3>To Be Processed ({{ props.itemsToProcess.length }})</h3>
        <ul class="file-list">
          <li v-for="item in props.itemsToProcess" :key="item">{{ getFileName(item) }}</li>
        </ul>
      </div>
      <!-- FEAT: This column is now hidden if there are no items to skip -->
      <div v-if="showSkipColumn" class="column skip-column">
        <h3>To Be Skipped ({{ props.itemsToSkip.length }})</h3>
        <ul class="file-list">
          <li v-for="item in props.itemsToSkip" :key="item">{{ getFileName(item) }}</li>
        </ul>
      </div>
    </div>

    <!-- Legacy support for the simple fileList prop from the original user file -->
    <details v-if="props.fileList && props.fileList.length > 0 && !hasFileLists" class="file-list-details">
      <summary>View {{ props.fileList.length }} item(s)</summary>
      <ul class="file-list single-column">
        <li v-for="file in props.fileList" :key="file">{{ file }}</li>
      </ul>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";

const props = defineProps({
  description: {
    type: [String, Array] as PropType<string | string[]>,
    default: "",
  },
  fileList: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  itemsToProcess: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  itemsToSkip: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const showProcessColumn = computed(() => (props.itemsToProcess?.length ?? 0) > 0);
const showSkipColumn = computed(() => (props.itemsToSkip?.length ?? 0) > 0);
const hasFileLists = computed(() => showProcessColumn.value || showSkipColumn.value);

const getFileName = (path: string): string => {
  if (!path) return "";
  return path.split(/[\\/]/).pop() || path;
};
</script>

<style scoped>
.reset-confirmation-content p {
  margin-bottom: 1em;
  line-height: 1.6;
}
.reset-confirmation-content p:last-child {
  margin-bottom: 0;
}

.two-column-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px 24px;
  margin-top: 16px;
}

/* Use two columns on wider screens only if both columns are present */
.two-column-grid.has-both-columns {
  @media (min-width: 500px) {
    grid-template-columns: 1fr 1fr;
  }
}

.column h3 {
  border-bottom: 1px solid var(--brdr-clr);
  padding-bottom: 8px;
  margin-bottom: 8px;
  font-size: 1rem;
  font-weight: 600;
}

.process-column h3 {
  color: var(--success-clr);
}

.skip-column h3 {
  color: var(--warning-clr);
}

/* BUGFIX & FEAT: Ensure file lists are scrollable and use grid display */
.file-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  max-height: 250px; /* Set a max height */
  overflow-y: auto; /* Enable vertical scrolling */
  font-family: var(--font-mono);
  font-size: 0.85rem;
  display: grid; /* Changed from flex to grid */
  gap: 4px;
  padding: 8px;
  background-color: var(--bg-clr-darkr);
  border-radius: 4px;
}

.file-list li {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 2px 4px;
}

/* Legacy styles from user-provided file */
.file-list-details {
  border: 1px solid var(--brdr-clr);
  border-radius: 4px;
  margin-block-start: 1em;
}

.file-list-details summary {
  cursor: pointer;
  font-weight: 500;
  padding: 8px;
}

.file-list-details[open] > summary {
  border-block-end: 1px solid var(--brdr-clr);
}

.file-list-details .file-list.single-column {
  padding: 8px;
  max-height: 150px;
}
</style>
