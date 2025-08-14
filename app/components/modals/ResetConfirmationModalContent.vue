<!-- eslint-disable vue/no-v-html -->
<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
  ResetConfirmationModalContent.vue @preserve
-->
<!-- components/modals/ResetConfirmationModalContent.vue -->
<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
  ResetConfirmationModalContent.vue @preserve
-->
<template>
  <div class="reset-confirmation-content">
    <template v-if="Array.isArray(props.description)">
      <p v-for="(line, index) in props.description" :key="index" v-html="line"></p>
    </template>
    <p v-else-if="props.description" v-html="props.description"></p>

    <div v-if="hasFileLists" class="file-table-container">
      <div v-if="props.showProcessColumn" class="column process-column">
        <h3>To Be Processed ({{ props.itemsToProcess.length }})</h3>
        <FileTable
          v-if="props.itemsToProcess.length > 0"
          :files="props.itemsToProcess"
          :is-loading="false"
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
        <!-- For copy operations: show static text -->
<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
  ResetConfirmationModalContent.vue @preserve
-->
        <h3 v-if="props.operation === 'copy'" class="static-header">
          Skip existing items ({{ props.itemsToSkip.length }})
        </h3>
        
        <!-- For move operations: show dropdown -->
<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
  ResetConfirmationModalContent.vue @preserve
-->
        <h3 v-else class="dynamic-header">
          <DropdownMenu
            dropdown-data-name="conflict-resolution-dropdown"
            :first-icon-name="''"
            :last-icon-name="'mdi:chevron-down'"
            :last-icon-size="16"
            placement="bottom-start"
          >
            <template #button-content>{{ conflictResolutionOption }}</template>
            <template #default="{ close }">
              <CustomButton
                button-style-class="trans-btn"
                data-btn-theme="danger"
                :data-name="'conflict-replace-btn'"
                first-icon-name="mdi:content-save"
                :first-icon-size="20"
                @click="
                  () => {
                    conflictResolution = 'replace';
                    close();
                  }
                "
              >
                Replace
              </CustomButton>
              <CustomButton
                button-style-class="trans-btn"
                :data-name="'conflict-skip-btn'"
                first-icon-name="mdi:skip-next"
                :first-icon-size="20"
                @click="
                  () => {
                    conflictResolution = 'skip';
                    close();
                  }
                "
              >
                Skip
              </CustomButton>
            </template>
          </DropdownMenu>
          existing items ({{ props.itemsToSkip.length }})
        </h3>
        <FileTable
          :files="props.itemsToSkip"
          :is-loading="false"
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
import { computed, ref, watch, type PropType } from "vue";
import FileTable from "@/components/FileTable.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import CustomButton from "@/components/CustomButton.vue";
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
  operation: {
    type: String as PropType<'move' | 'copy'>,
    default: 'move',
  },
  showProcessColumn: {
    type: Boolean,
    default: true,
  },
  // Modal store and ID passed from parent
  modalsStore: {
    type: Object,
    default: null,
  },
  modalId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits<{
  'conflict-resolution-changed': [value: 'skip' | 'replace']
}>();

// Conflict resolution state - default based on operation
const conflictResolution = ref<'skip' | 'replace'>(props.operation === 'move' ? 'replace' : 'skip');

// Computed properties
const showSkipColumn = computed(() => (props.itemsToSkip?.length ?? 0) > 0);
const hasFileLists = computed(() => {
  // Show file lists if we have items to process and showProcessColumn is true, or if we have items to skip
  return (props.showProcessColumn && (props.itemsToProcess?.length ?? 0) > 0) || (props.itemsToSkip?.length ?? 0) > 0;
});

const conflictResolutionOption = computed(() => {
  return conflictResolution.value === 'skip' ? 'Skip' : 'Replace';
});

// Watch for conflict resolution changes and emit to parent
watch(conflictResolution, (newValue) => {
  emit('conflict-resolution-changed', newValue);
  
  // Also set the data in the modal store so it's available to the callback
  if (props.modalsStore && props.modalId) {
    props.modalsStore.setModalData(props.modalId, { conflictResolution: newValue });
  }
});

// Watch for operation changes to update default conflict resolution
watch(() => props.operation, (newOperation) => {
  conflictResolution.value = newOperation === 'move' ? 'replace' : 'skip';
});

// Set initial conflict resolution data
if (props.modalsStore && props.modalId) {
  props.modalsStore.setModalData(props.modalId, { conflictResolution: conflictResolution.value });
}
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
  text-align: left !important; /* Left-justify headers */
}

.process-column h3 {
  color: var(--success-clr);
}

.skip-column h3 {
  color: var(--warning-clr);
}

.dynamic-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.static-header {
  /* Same styling as dynamic header but without flex layout */
}

/* Ensure dropdown menu has proper font size */
:deep(.dropdown-content) {
  font-size: 1rem;
}

:deep(.dropdown-content .custom-button) {
  font-size: 1rem;
}

:deep(.file-table-comp) {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--brdr-clr-dark);
  border-radius: 4px;
  background-color: var(--bg-clr-darkr);
  max-width: 1000px;
  margin-inline: auto;
}

:deep(.file-table) {
  font-size: 0.9rem;
}

:deep(.file-row:last-of-type) {
  border-bottom: none;
}
</style>
