<!-- components/DropZone.vue @preserve -->
<template>
  <div class="drop-zone-wrapper" :data-job-id="jobId" data-component-name="DropZone">
    <div class="drop-zone">
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
.drop-zone-wrapper {
  /* This element is the container for the container query. */
  container-type: size;
  container-name: dropzone-wrapper;

  /* This ensures the wrapper fills its grid cell and centers its content. */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 40px;
}

.drop-zone {
  /* This is the element that gets styled based on the wrapper's size. */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-block: 1rem;

  /* Default to a vertical layout (text above button). */
  flex-direction: column;
}

.prompt-message {
  font-size: 1.25rem;
  color: var(--fg-clr-mute);
  text-align: center;
}

/* When the WRAPPER's height is less than 90px, switch the INNER element
  to a horizontal layout. This happens when the file table grows,
  leaving less space for the dropzone.
*/
@container dropzone-wrapper (height < 90px) {
  .drop-zone {
    flex-direction: row;
  }
}
</style>
