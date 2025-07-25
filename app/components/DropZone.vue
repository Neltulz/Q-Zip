<!-- components/DropZone.vue @preserve -->
<template>
  <div class="drop-zone" :data-job-id="jobId" data-component-name="DropZone">
    <div class="drop-zone-inner">
      <div class="drop-files-wrapper">
        <Icon name="mdi:folder-arrow-down" size="24" /><span class="drop-files-text"
          >Drop<span class="extended-text"> files/folders here</span></span
        >
      </div>

      <div class="or-text">- or -</div>

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
.drop-zone {
  align-items: center;
  container-type: size;
  display: flex;
  justify-content: center;
  min-height: 40px;

  .drop-zone-inner {
    align-items: center;
    border: 2px dashed var(--brdr-clr);
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    height: 50%;
    justify-content: center;
    max-height: 150px;
    max-width: 500px;
    min-height: 40px;
    min-width: 250px;
    padding-inline: var(--pad-in);
    row-gap: var(--pad-blok);
    width: 50%;

    .drop-files-wrapper {
      column-gap: var(--pad-in);
      display: flex;
      font-size: 16px;
    }

    .or-text {
      line-height: 1;
      padding-block-end: calc(var(--pad-blok) / 2);
    }
  }

  @container (height <= 250px) {
    .drop-zone-inner {
      column-gap: var(--pad-in);
      flex-direction: row;
      justify-content: center;
    }
  }

  @container (width <= 800px) {
    .drop-zone-inner {
      .extended-text {
        display: none;
      }
    }
  }

  @container (width <= 600px) {
    .drop-zone-inner {
      max-width: none;
      min-width: auto;
      width: 100%;
    }
  }
}
</style>
