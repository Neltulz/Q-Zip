<!-- 
  FileTableToolbar.vue @preserve
-->
<template>
  <ToolBar v-if="showToolbar" class="file-table-toolbar" :class="{ 'is-active': isFiletableActive }" @click="handleToolbarClick">
    <template #start>
      <!-- Add Files and Folders Dropdown -->
      <div class="toolbar-button-wrapper">
        <DropdownMenu
          ref="addDropdownRef"
          button-style-class="trans-btn"
          dropdown-data-name="add-files-and-folders-dropdown"
          first-icon-name="mdi:add"
          :first-icon-size="20"
          last-icon-name="mdi:chevron-down"
          :last-icon-size="20"
          :show-cancel-button="true"
          @mouseenter="(event) => handleAddMouseEnter(event)"
          @mouseleave="handleAddMouseLeave"
          @dropdown-opened="handleAddDropdownOpened"
        >
          <template #button-content> Add... </template>
          <template #default="{ close }">
            <CustomButton
              button-style-class="trans-btn"
              first-icon-name="mdi:file-outline"
              :first-icon-size="20"
              data-name="add-files-btn"
              shortcut-text="Ctrl+O"
              @click="handleAddFile(close)"
            >
              Add File
            </CustomButton>
            <CustomButton
              button-style-class="trans-btn"
              first-icon-name="mdi:folder"
              :first-icon-size="20"
              data-name="add-folders-btn"
              shortcut-text="Ctrl+F"
              @click="handleAddFolder(close)"
            >
              Add Folder
            </CustomButton>
          </template>
        </DropdownMenu>
        <!-- Only render tooltip when target exists -->
        <template v-if="addDropdownRef?.$el">
          <InfoTooltip
            tooltip-id="add-files-dropdown"
            :visible="tooltipManager.activeTooltipId.value === 'add-files-dropdown'"
            :content="{ text: 'Add files or folders to this job' }"
            :target="addDropdownRef.$el"
            placement="bottom"
            keyboardShortcut="Add Files: Ctrl+O
Add Folders: Ctrl+F"
            hotkey-size="small"
          />
        </template>
      </div>

      <!-- Refresh Button -->
      <div class="toolbar-button-wrapper">
        <CustomButton
          ref="refreshButtonRef"
          button-style-class="trans-btn"
          data-name="refresh-files-btn"
          :disabled="isRefreshing"
          :first-icon-name="isRefreshing ? '' : 'mdi:refresh'"
          :first-icon-size="20"
          @click.stop="refreshFiles"
          @mouseenter="(event) => handleRefreshMouseEnter(event)"
          @mouseleave="handleRefreshMouseLeave"
        >
          <!-- Show loading animation when refreshing -->
          <template v-if="isRefreshing">
            <div class="refresh-loading-container">
              <DoubleBounceLoadingAnim />
            </div>
          </template>
          Refresh
        </CustomButton>
        <!-- Only render tooltip when target exists -->
        <template v-if="refreshButtonRef?.visualStyleRef">
          <InfoTooltip
            tooltip-id="refresh-files-btn"
            :visible="tooltipManager.activeTooltipId.value === 'refresh-files-btn'"
            :content="{ text: 'Refresh the item list' }"
            :target="refreshButtonRef.visualStyleRef"
            placement="bottom"
            keyboardShortcut="F5"
            hotkey-size="small"
          />
        </template>
      </div>

      <!-- Remove Selected Button -->
      <div class="toolbar-button-wrapper">
        <CustomButton
          ref="removeButtonRef"
          button-style-class="trans-btn"
          data-btn-theme="danger"
          data-name="remove-selected-files-btn"
          :disabled="selectedFiles.length === 0"
          first-icon-name="mdi:remove"
          :first-icon-size="20"
          @click.stop="removeSelectedFiles"
          @mouseenter="(event) => handleRemoveMouseEnter(event)"
          @mouseleave="handleRemoveMouseLeave"
        >
          Remove Selected
        </CustomButton>
        <!-- Only render tooltip when target exists -->
        <template v-if="removeButtonRef?.visualStyleRef">
          <InfoTooltip
            tooltip-id="remove-selected-files-btn"
            :visible="tooltipManager.activeTooltipId.value === 'remove-selected-files-btn'"
            :content="{ text: 'Remove selected items from this job' }"
            :target="removeButtonRef.visualStyleRef"
            placement="bottom"
            keyboardShortcut="Del"
            hotkey-size="small"
          />
        </template>
      </div>

      <!-- Copy to Job Dropdown -->
      <div class="toolbar-button-wrapper">
        <DropdownMenu
          ref="copyDropdownRef"
          button-style-class="trans-btn"
          dropdown-data-name="copy-to-job-dropdown"
          :disabled="selectedFiles.length === 0"
          first-icon-name="mdi:content-copy"
          :first-icon-size="20"
          last-icon-name="mdi:chevron-down"
          :last-icon-size="20"
          placement="bottom-start"
          :show-cancel-button="true"
          @mouseenter="(event) => handleCopyMouseEnter(event)"
          @mouseleave="handleCopyMouseLeave"
          @dropdown-opened="handleCopyDropdownOpened"
        >
          <template #button-content> Copy to </template>
          <template #default="{ close }">
            <CustomButton
              v-for="job in jobs.filter((j: Job) => j.id !== jobId)"
              :key="job.id"
              button-style-class="trans-btn"
              :data-name="`copy-to-job-${job.id}-btn`"
              first-icon-name="mdi:briefcase"
              :first-icon-size="20"
              @click="
                () => {
                  copyToJob(job.id);
                  close();
                }
              "
            >
              Job {{ job.id }}
            </CustomButton>
          </template>
          <template #content-bottom="{ close }">
            <hr v-if="jobs.filter((j) => j.id !== jobId).length > 0" />
            <CustomButton
              button-style-class="trans-btn"
              data-name="copy-to-new-job-btn"
              first-icon-name="mdi:plus"
              :first-icon-size="20"
              @click="
                () => {
                  copyToNewJob();
                  close();
                }
              "
            >
              New Job
            </CustomButton>
          </template>
        </DropdownMenu>
        <!-- Only render tooltip when target exists -->
        <template v-if="copyDropdownRef?.$el">
          <InfoTooltip
            tooltip-id="copy-to-job-dropdown"
            :visible="tooltipManager.activeTooltipId.value === 'copy-to-job-dropdown'"
            :content="{ text: 'Copy selected items to another job' }"
            :target="copyDropdownRef.$el"
            placement="bottom"
            keyboardShortcut="Ctrl+Shift+C"
            hotkey-size="small"
          />
        </template>
      </div>

      <!-- Move to Job Dropdown -->
      <div class="toolbar-button-wrapper">
        <DropdownMenu
          ref="moveDropdownRef"
          button-style-class="trans-btn"
          dropdown-data-name="move-to-job-dropdown"
          :disabled="selectedFiles.length === 0"
          first-icon-name="mdi:arrow-right"
          :first-icon-size="20"
          last-icon-name="mdi:chevron-down"
          :last-icon-size="20"
          placement="bottom-start"
          :show-cancel-button="true"
          @mouseenter="(event) => handleMoveMouseEnter(event)"
          @mouseleave="handleMoveMouseLeave"
          @dropdown-opened="handleMoveDropdownOpened"
        >
          <template #button-content> Move to </template>
          <template #default="{ close }">
            <CustomButton
              v-for="job in jobs.filter((j: Job) => j.id !== jobId)"
              :key="job.id"
              button-style-class="trans-btn"
              :data-name="`move-to-job-${job.id}-btn`"
              first-icon-name="mdi:briefcase"
              :first-icon-size="20"
              @click="
                () => {
                  moveToJob(job.id);
                  close();
                }
              "
            >
              Job {{ job.id }}
            </CustomButton>
          </template>
          <template #content-bottom="{ close }">
            <hr v-if="jobs.filter((j) => j.id !== jobId).length > 0" />
            <CustomButton
              button-style-class="trans-btn"
              data-name="move-to-new-job-btn"
              first-icon-name="mdi:plus"
              :first-icon-size="20"
              @click="
                () => {
                  moveToNewJob();
                  close();
                }
              "
            >
              New Job
            </CustomButton>
          </template>
        </DropdownMenu>
        <!-- Only render tooltip when target exists -->
        <template v-if="moveDropdownRef?.$el">
          <InfoTooltip
            tooltip-id="move-to-job-dropdown"
            :visible="tooltipManager.activeTooltipId.value === 'move-to-job-dropdown'"
            :content="{ text: 'Move selected items to another job' }"
            :target="moveDropdownRef.$el"
            placement="bottom"
            keyboardShortcut="Ctrl+Shift+M"
            hotkey-size="small"
          />
        </template>
      </div>
    </template>
    <template #end>
      <!-- Settings Dropdown -->
      <div class="toolbar-button-wrapper">
        <DropdownMenu
          ref="settingsDropdownRef"
          button-style-class="trans-btn"
          dropdown-data-name="file-table-settings-dropdown"
          first-icon-name="mdi:cog"
          :first-icon-size="20"
          last-icon-name="mdi:chevron-down"
          :last-icon-size="20"
          placement="bottom-end"
          :show-cancel-button="true"
          @mouseenter="(event) => handleSettingsMouseEnter(event)"
          @mouseleave="handleSettingsMouseLeave"
          @dropdown-opened="handleSettingsDropdownOpened"
        >
          <template #button-content> Settings </template>
          <template #default="{ close }">
            <CustomButton
              button-style-class="trans-btn"
              :class="{ 'is-active': checkboxMode }"
              data-name="checkbox-mode-btn"
              :first-icon-name="checkboxMode ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'"
              :first-icon-size="20"
              @click="
                () => {
                  toggleCheckboxMode();
                  close();
                }
              "
            >
              Checkbox Mode
            </CustomButton>
            <CustomButton
              button-style-class="trans-btn"
              :class="{ 'is-active': autoCheckOnSelect }"
              data-name="auto-check-on-select-btn"
              :disabled="!checkboxMode"
              :first-icon-name="autoCheckOnSelect ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'"
              :first-icon-size="20"
              @click="
                () => {
                  toggleAutoCheckOnSelect();
                  close();
                }
              "
            >
              Auto check on select
            </CustomButton>
          </template>
        </DropdownMenu>
        <!-- Only render tooltip when target exists -->
        <template v-if="settingsDropdownRef?.$el">
          <InfoTooltip
            tooltip-id="file-table-settings-dropdown"
            :visible="tooltipManager.activeTooltipId.value === 'file-table-settings-dropdown'"
            :content="{ text: 'File table display settings' }"
            :target="settingsDropdownRef.$el"
            placement="bottom-end"
            keyboardShortcut="Ctrl+,"
            hotkey-size="small"
          />
        </template>
      </div>
    </template>
  </ToolBar>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
import { open } from "@tauri-apps/plugin-dialog";
import DropdownMenu from "../DropdownMenu.vue";
import CustomButton from "../CustomButton.vue";
import ToolBar from "../ToolBar.vue";
import InfoTooltip from "../InfoTooltip.vue";
import DoubleBounceLoadingAnim from "../loading-anim-comp/DoubleBounceLoadingAnim.vue";
import { useTooltipManager } from "@/composables/useTooltipManager";

const props = defineProps<{
  jobId: number;
  selectedFiles: string[];
  showToolbar?: boolean;
  isFiletableActive?: boolean;
  isRefreshing?: boolean;
}>();

const emit = defineEmits([
  "remove-files",
  "move-files",
  "move-to-new-job",
  "copy-files",
  "copy-to-new-job",
  "add-files",
  "add-folders",
  "activate-filetable",
  "refresh-files",
]);

const jobsStore = useJobsStore();
const userPreferencesStore = useUserPreferencesStore();
const tooltipManager = useTooltipManager();
const jobs = computed(() => jobsStore.jobs);

// Get preferences from store
const checkboxMode = computed(() => userPreferencesStore.checkboxMode);
const autoCheckOnSelect = computed(() => userPreferencesStore.autoCheckOnSelect);

// Tooltip refs
const addDropdownRef = ref<any | null>(null);
const refreshButtonRef = ref<any | null>(null);
const removeButtonRef = ref<any | null>(null);
const copyDropdownRef = ref<any | null>(null);
const moveDropdownRef = ref<any | null>(null);
const settingsDropdownRef = ref<any | null>(null);

// Tooltip mouse event handlers - Updated to include origin element
const handleAddMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('add-files-dropdown', originElement);
};

const handleAddMouseLeave = () => {
  tooltipManager.hideTooltip();
};

const handleRefreshMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('refresh-files-btn', originElement);
};

const handleRefreshMouseLeave = () => {
  tooltipManager.hideTooltip();
};

const handleRemoveMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('remove-selected-files-btn', originElement);
};

const handleRemoveMouseLeave = () => {
  tooltipManager.hideTooltip();
};

const handleCopyMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('copy-to-job-dropdown', originElement);
};

const handleCopyMouseLeave = () => {
  tooltipManager.hideTooltip();
};

const handleMoveMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('move-to-job-dropdown', originElement);
};

const handleMoveMouseLeave = () => {
  tooltipManager.hideTooltip();
};

const handleSettingsMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('file-table-settings-dropdown', originElement);
};

const handleSettingsMouseLeave = () => {
  tooltipManager.hideTooltip();
};

// Dropdown opened event handlers to hide associated tooltips
const handleAddDropdownOpened = () => {
  tooltipManager.hideTooltipImmediately();
};

const handleCopyDropdownOpened = () => {
  tooltipManager.hideTooltipImmediately();
};

const handleMoveDropdownOpened = () => {
  tooltipManager.hideTooltipImmediately();
};

const handleSettingsDropdownOpened = () => {
  tooltipManager.hideTooltipImmediately();
};

const handleAddFile = async (close: () => void): Promise<void> => {
  close();
  const selected: string[] | null = await open({
    multiple: true,
    directory: false,
  });
  if (selected) {
    emit("add-files", selected);
  }
};

const handleAddFolder = async (close: () => void): Promise<void> => {
  close();
  const selected: string[] | null = await open({
    multiple: true,
    directory: true,
  });
  if (selected) {
    emit("add-folders", selected);
  }
};

const refreshFiles = (): void => {
  emit("refresh-files");
  emit("activate-filetable");
};

const removeSelectedFiles = (): void => {
  emit("remove-files", props.selectedFiles);
};

const moveToJob = (targetJobId: number): void => {
  emit("move-files", { targetJobId, files: props.selectedFiles });
};

const moveToNewJob = (): void => {
  emit("move-to-new-job", props.selectedFiles);
};

const copyToJob = (targetJobId: number): void => {
  emit("copy-files", { targetJobId, files: props.selectedFiles });
};

const copyToNewJob = (): void => {
  emit("copy-to-new-job", props.selectedFiles);
};

const toggleCheckboxMode = (): void => {
  userPreferencesStore.setCheckboxMode(!checkboxMode.value);
};

const toggleAutoCheckOnSelect = (): void => {
  userPreferencesStore.setAutoCheckOnSelect(!autoCheckOnSelect.value);
};

const handleToolbarClick = (event: Event): void => {
  // Prevent event bubbling to avoid triggering FileTable's deselect logic
  event.stopPropagation();
  // Emit event to parent to activate FileTable
  emit("activate-filetable");
};
</script>
<style scoped>
.file-table-toolbar {
  --bg-clr: transparent;
  padding: 0;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

/* Toolbar button wrapper for tooltip positioning */
.toolbar-button-wrapper {
  position: relative;
  display: inline-block;
}

/* Toolbar highlighting based on FileTable active state */
.file-table-toolbar:not(.is-active) {
  background-color: var(--toolbar-inactive-bg, hsla(0, 0.00%, 50.20%, 0.10));
}

.file-table-toolbar.is-active {
  background-color: var(--toolbar-active-bg, hsla(211, 100.00%, 50.00%, 0.10));
}

/* Dark theme adjustments */
:global(.dark) .file-table-toolbar:not(.is-active) {
  background-color: var(--toolbar-inactive-bg-dark, hsla(0, 0.00%, 50.20%, 0.15));
}

:global(.dark) .file-table-toolbar.is-active {
  background-color: var(--toolbar-active-bg-dark, hsla(211, 100.00%, 50.00%, 0.15));
}

/* Active state styling for checkbox mode and auto check buttons */
:deep(.trans-btn.is-active) {
  background-color: var(--accent-clr, hsla(211, 100.00%, 50.00%, 0.20));
  color: var(--accent-clr, hsl(211, 100.00%, 50.00%));
}

:deep(.trans-btn.is-active:hover:not(:disabled):not(.disabled)) {
  background-color: var(--accent-clr, hsla(211, 100.00%, 50.00%, 0.30));
}

/* Disabled state styling */
:deep(.trans-btn:disabled) {
  opacity: 0.5;
  cursor: default; /* Don't show not-allowed cursor */
  pointer-events: auto; /* Allow hover events for tooltips */
}

/* Prevent hover effects on disabled buttons */
:deep(.trans-btn:disabled:hover > .visual-style),
:deep(.trans-btn.disabled:hover > .visual-style) {
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

/* Refresh loading container styling */
.refresh-loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

/* Scale down the double bounce animation for button use */
.refresh-loading-container :deep(.double-bounce-animation) {
  gap: 0;
}

.refresh-loading-container :deep(.spinner) {
  block-size: 16px;
  inline-size: 16px;
}

.refresh-loading-container :deep(.loading-message) {
  display: none;
}
</style>
