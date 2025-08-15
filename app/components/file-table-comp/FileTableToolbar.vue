<!-- 
  FileTableToolbar.vue @preserve
-->
<template>
  <ToolBar v-if="showToolbar" class="file-table-toolbar" :class="{ 'is-active': isFiletableActive }" @click="handleToolbarClick">
    <template #start>
             <DropdownMenu
         button-style-class="trans-btn"
         dropdown-data-name="add-files-and-folders-dropdown"
         first-icon-name="mdi:add"
         :first-icon-size="20"
         last-icon-name="mdi:chevron-down"
         :last-icon-size="20"
         :show-cancel-button="true"
       >
         <template #button-content> Add... </template>
         <template #default="{ close }">
           <CustomButton
             button-style-class="trans-btn"
             first-icon-name="mdi:file-outline"
             :first-icon-size="20"
             data-name="add-files-btn"
             @click="handleAddFile(close)"
           >
             Add File
           </CustomButton>
           <CustomButton
             button-style-class="trans-btn"
             first-icon-name="mdi:folder"
             :first-icon-size="20"
             data-name="add-folders-btn"
             @click="handleAddFolder(close)"
           >
             Add Folder
           </CustomButton>
         </template>
       </DropdownMenu>
      <CustomButton
        button-style-class="trans-btn"
        data-name="refresh-files-btn"
        first-icon-name="mdi:refresh"
        :first-icon-size="20"
        @click.stop="refreshFiles"
      >
        Refresh
      </CustomButton>
      <CustomButton
        button-style-class="trans-btn"
        data-btn-theme="danger"
        data-name="remove-selected-files-btn"
        :disabled="selectedFiles.length === 0"
        first-icon-name="mdi:remove"
        :first-icon-size="20"
        @click.stop="removeSelectedFiles"
      >
        Remove Selected
      </CustomButton>
             <DropdownMenu
         button-style-class="trans-btn"
         dropdown-data-name="copy-to-job-dropdown"
         :disabled="selectedFiles.length === 0"
         first-icon-name="mdi:content-copy"
         :first-icon-size="20"
         last-icon-name="mdi:chevron-down"
         :last-icon-size="20"
         placement="bottom-start"
         :show-cancel-button="true"
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
             <DropdownMenu
         button-style-class="trans-btn"
         dropdown-data-name="move-to-job-dropdown"
         :disabled="selectedFiles.length === 0"
         first-icon-name="mdi:arrow-right"
         :first-icon-size="20"
         last-icon-name="mdi:chevron-down"
         :last-icon-size="20"
         placement="bottom-start"
         :show-cancel-button="true"
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
    </template>
    <template #end>
             <DropdownMenu
         button-style-class="trans-btn"
         dropdown-data-name="file-table-settings-dropdown"
         first-icon-name="mdi:cog"
         :first-icon-size="20"
         last-icon-name="mdi:chevron-down"
         :last-icon-size="20"
         placement="bottom-end"
         :show-cancel-button="true"
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
    </template>
  </ToolBar>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
import { open } from "@tauri-apps/plugin-dialog";
import DropdownMenu from "../DropdownMenu.vue";
import CustomButton from "../CustomButton.vue";
import ToolBar from "../ToolBar.vue";
const props = defineProps<{
  jobId: number;
  selectedFiles: string[];
  showToolbar?: boolean;
  isFiletableActive?: boolean;
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
const jobs = computed(() => jobsStore.jobs);
// Get preferences from store
const checkboxMode = computed(() => userPreferencesStore.checkboxMode);
const autoCheckOnSelect = computed(() => userPreferencesStore.autoCheckOnSelect);
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
:deep(.trans-btn.is-active:hover) {
  background-color: var(--accent-clr, hsla(211, 100.00%, 50.00%, 0.30));
}
/* Disabled state styling */
:deep(.trans-btn:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
