<template>
  <ToolBar v-if="showToolbar" class="file-table-toolbar">
    <template #start>
      <DropdownMenu
        button-style-class="trans-btn"
        dropdown-data-name="add-files-and-folders-dropdown"
        first-icon-name="mdi:add"
        :first-icon-size="20"
        last-icon-name="mdi:chevron-down"
        :last-icon-size="20"
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
          <hr />
          <CustomButton
            button-style-class="trans-btn btn-lite"
            data-name="cancel-copy-to-btn"
            first-icon-name="mdi:cancel"
            :first-icon-size="20"
            shortcut-text="Esc"
            @click="close()"
          >
            Cancel
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
          <hr />
          <CustomButton
            button-style-class="trans-btn btn-lite"
            data-name="cancel-move-to-btn"
            first-icon-name="mdi:cancel"
            :first-icon-size="20"
            shortcut-text="Esc"
            @click="close()"
          >
            Cancel
          </CustomButton>
        </template>
      </DropdownMenu>
    </template>
  </ToolBar>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { open } from "@tauri-apps/plugin-dialog";
import DropdownMenu from "../DropdownMenu.vue";
import CustomButton from "../CustomButton.vue";
import ToolBar from "../ToolBar.vue";

const props = defineProps<{
  jobId: number;
  selectedFiles: string[];
  showToolbar?: boolean;
}>();

const emit = defineEmits([
  "remove-files",
  "move-files",
  "move-to-new-job",
  "copy-files",
  "copy-to-new-job",
  "add-files",
  "add-folders",
]);

const jobsStore = useJobsStore();
const jobs = computed(() => jobsStore.jobs);

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
</script>

<style scoped>
.file-table-toolbar {
  --bg-clr: transparent;
  margin-block-end: 4px;
  padding: 0;
  flex-shrink: 0;
}
</style>
