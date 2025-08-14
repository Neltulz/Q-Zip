<!-- components/AddFilesAndFolders.vue @preserve (formerly DropZone.vue) -->
<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
  AddFilesAndFolders.vue @preserve
-->
<template>
  <div class="add-files-wrapper" :data-job-id="jobId" data-component-name="AddFilesAndFolders">
    <div class="add-files-content">
      <div class="prompt-message">Add Files/Folders</div>
      <DropdownMenu
        first-icon-name="mdi:add"
        :first-icon-size="20"
        last-icon-name="mdi:chevron-down"
        :last-icon-size="20"
        dropdown-data-name="add-files-and-folders-dropdown"
      >
        <template #button-content> Add...</template>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { open } from "@tauri-apps/plugin-dialog";

defineProps<{
  jobId: number;
}>();

const emit = defineEmits<{
  (e: "add-files" | "add-folders", paths: string[]): void;
}>();

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
</script>

<style scoped>
.add-files-wrapper {
  container-type: size;
  container-name: addfiles-wrapper;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
  min-height: 40px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.add-files-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-block: 1rem;
  flex-direction: column;
}

.prompt-message {
  font-size: 1.25rem;
  color: var(--fg-clr-mute);
  text-align: center;
}

@container addfiles-wrapper (height < 90px) {
  .add-files-content {
    flex-direction: row;
  }
}
</style>
