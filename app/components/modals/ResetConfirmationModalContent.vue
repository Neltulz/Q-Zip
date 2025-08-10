<!-- eslint-disable vue/no-v-html -->
<!-- components/modals/ResetConfirmationModalContent.vue -->
<template>
  <div class="reset-confirmation-content">
    <template v-if="Array.isArray(props.description)">
      <p v-for="(line, index) in props.description" :key="index" v-html="line"></p>
    </template>
    <p v-else-if="props.description" v-html="props.description"></p>

    <div v-if="hasFileLists" class="file-table-container">
      <div v-if="showProcessColumn" class="column process-column">
        <h3>To Be Processed ({{ props.itemsToProcess.length }})</h3>
        <FileTable
          :files="props.itemsToProcess"
          :job-id="0"
          :cut-files="[]"
          :cut-source-job-id="null"
          :is-dragging="false"
          :activatable="false"
          :show-toolbar="false"
          :show-checkboxes="false"
          :show-row-actions="false"
          :is-selectable="false"
          :fixed-headers="true"
          :item-drag-enabled="false"
          :marquee-selection-enabled="false"
        />
      </div>
      <div v-if="showSkipColumn" class="column skip-column">
        <h3>To Be Skipped ({{ props.itemsToSkip.length }})</h3>
        <FileTable
          :files="props.itemsToSkip"
          :job-id="0"
          :cut-files="[]"
          :cut-source-job-id="null"
          :is-dragging="false"
          :activatable="false"
          :show-toolbar="false"
          :show-checkboxes="false"
          :show-row-actions="false"
          :is-selectable="false"
          :fixed-headers="true"
          :item-drag-enabled="false"
          :marquee-selection-enabled="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";
import FileTable from "@/components/FileTable.vue";
import type { FileItem } from "@/types/types";

const props = defineProps({
  description: {
    type: [String, Array] as PropType<string | string[]>,
    default: "",
  },
  itemsToProcess: {
    type: Array as PropType<FileItem[]>,
    default: () => [],
  },
  itemsToSkip: {
    type: Array as PropType<FileItem[]>,
    default: () => [],
  },
});

const showProcessColumn = computed(() => (props.itemsToProcess?.length ?? 0) > 0);
const showSkipColumn = computed(() => (props.itemsToSkip?.length ?? 0) > 0);
const hasFileLists = computed(() => showProcessColumn.value || showSkipColumn.value);
</script>

<style scoped>
.reset-confirmation-content p {
  margin-bottom: 1em;
  line-height: 1.6;
}
.reset-confirmation-content p:last-child {
  margin-bottom: 0;
}

.file-table-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
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

:deep(.file-table-comp) {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--brdr-clr-dark);
  border-radius: 4px;
  background-color: var(--bg-clr-darkr);
  max-width: 1000px; /* UPDATED: Added max-width */
  margin-inline: auto; /* UPDATED: Added margin-inline */
}

:deep(.file-table) {
  font-size: 0.9rem;
}

:deep(.file-row:last-of-type) {
  border-bottom: none;
}
</style>
