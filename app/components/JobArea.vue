<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/JobArea.vue @preserve -->
<template>
  <div ref="jobAreaRef" class="job-area" data-component-name="JobArea">
    <!-- Context menu for the job area -->
    <DropdownMenu ref="jobContextMenuRef" dropdown-data-name="job-area-context-menu" :hide-trigger="true">
      <template #default="{ close }">
        <CustomButton
          button-style-class="trans-btn"
          data-name="context-paste-btn"
          first-icon-name="mdi:content-paste"
          :first-icon-size="20"
          shortcut-text="Ctrl+V"
          :disabled="!clipboardStore.hasClipboardItems()"
          @click="
            () => {
              handlePaste();
              close();
            }
          "
        >
          Paste
        </CustomButton>
        <!-- Other context menu items -->
      </template>
    </DropdownMenu>

    <transition name="job-fade">
      <!-- UPDATED: Added jobRef -->
      <div v-if="activeJob" :key="activeJob.id" ref="jobRef" class="job">
        <div class="job-header">
          <h2>Job {{ activeJob.id }}</h2>
        </div>
        <!-- REMOVED: The selection box is no longer rendered here -->
        <div ref="jobContentRef" class="job-content" @contextmenu.prevent.stop="showJobContextMenu">
          <FileTable
            ref="fileTableRef"
            :files="activeJob.files"
            :is-dragging="false"
            :job-id="activeJob.id"
            :cut-files="clipboardStore.cutFilePaths"
            :cut-source-job-id="clipboardStore.sourceJobId"
            @copy-files="confirmCopyFiles"
            @copy-to-new-job="confirmCopyToNewJob"
            @move-files="confirmMoveFiles"
            @move-to-new-job="confirmMoveToNewJob"
            @remove-files="confirmRemoveFiles"
            @selection-changed="handleSelectionChange"
            @add-files="addItemsToJob"
            @add-folders="addItemsToJob"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useModalsStore } from "@/stores/modalsStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import { useUiStore } from "@/stores/uiStore";
import type { ModalOptions } from "@/types/modal";
import FileTable from "@/components/FileTable.vue";
import AddFilesAndFolders from "@/components/AddFilesAndFolders.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import type { FileItem } from "@/types/types";

type FileOperationPayload = {
  targetJobId: number;
  files: string[];
};

type ContextMenuFileOperationPayload = {
  targetJobId: number;
  rightClickedPath: string;
};

const jobsStore = useJobsStore();
const modalsStore = useModalsStore();
const clipboardStore = useClipboardStore();
const uiStore = useUiStore();

const fileTableRef = ref<InstanceType<typeof FileTable> | null>(null);
const jobAreaRef = ref<HTMLElement | null>(null);
const jobContentRef = ref<HTMLElement | null>(null);
const jobRef = ref<HTMLElement | null>(null);
const jobContextMenuRef = ref<InstanceType<typeof DropdownMenu> | null>(null);
const selectedFilePaths = ref<string[]>([]);

const activeJob = computed(() => {
  return jobsStore.jobs.find((job: Job) => job.id === jobsStore.selectedJobId);
});

// REMOVED: marqueeBoxStyle is no longer needed in this component
// const marqueeBoxStyle = computed(() => ({
//   transform: `translate(${uiStore.marqueeBox.x}px, ${uiStore.marqueeBox.y}px)`,
//   width: `${uiStore.marqueeBox.width}px`,
//   height: `${uiStore.marqueeBox.height}px`,
// }));

const showJobContextMenu = (event: MouseEvent) => {
  if ((event.target as Element).closest('.file-row[data-has-context-menu="true"]')) {
    return;
  }
  jobContextMenuRef.value?.openDropdown({ x: event.clientX, y: event.clientY });
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!activeJob.value || !fileTableRef.value) return;

  const isShortcutKey = (event.ctrlKey || event.metaKey) && ["a", "c", "x", "v"].includes(event.key);
  if (isShortcutKey || event.key === "Delete") {
    event.preventDefault();
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "a") {
    fileTableRef.value.toggleAll();
  } else if (event.key === "Delete") {
    if (selectedFilePaths.value.length > 0) {
      confirmRemoveFiles(selectedFilePaths.value);
    }
  } else if ((event.ctrlKey || event.metaKey) && event.key === "c") {
    if (selectedFilePaths.value.length > 0) {
      const filesToCopy: FileItem[] = selectedFilePaths.value
        .map((path) => activeJob.value?.files.find((file) => file.path === path))
        .filter(Boolean) as FileItem[];
      clipboardStore.copy(filesToCopy, activeJob.value.id);
    }
  } else if ((event.ctrlKey || event.metaKey) && event.key === "x") {
    if (selectedFilePaths.value.length > 0) {
      const filesToCut: FileItem[] = selectedFilePaths.value
        .map((path) => activeJob.value?.files.find((file) => file.path === path))
        .filter(Boolean) as FileItem[];
      clipboardStore.cut(filesToCut, activeJob.value.id);
    }
  } else if ((event.ctrlKey || event.metaKey) && event.key === "v") {
    handlePaste();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});

const handlePaste = () => {
  if (clipboardStore.hasClipboardItems() && activeJob.value) {
    const filesToPaste = clipboardStore.clipboard;
    const sourceJobId = clipboardStore.sourceJobId;
    const isCutOperation = clipboardStore.isCut;
    const targetJobId = activeJob.value.id;

    openOperationConfirmModal(isCutOperation ? "move" : "copy", filesToPaste, targetJobId, sourceJobId);
  }
};

const handleSelectionChange = (newSelection: string[]) => {
  selectedFilePaths.value = newSelection;
};

const getPathsForAction = (payload: string | string[]): string[] => {
  if (Array.isArray(payload)) return payload;
  const isRightClickedInSelection: boolean = selectedFilePaths.value.includes(payload);
  return isRightClickedInSelection && selectedFilePaths.value.length > 0 ? selectedFilePaths.value : [payload];
};

const getFileItemsFromPaths = (paths: string[], sourceJobId: number | null): FileItem[] => {
  if (sourceJobId === null) return [];
  const sourceJob = jobsStore.jobs.find((j) => j.id === sourceJobId);
  if (!sourceJob) return [];
  const pathSet = new Set(paths);
  return sourceJob.files.filter((file) => pathSet.has(file.path));
};

const getFileNamesFromPaths = (paths: string[], sourceJobId: number | null): string[] => {
  if (sourceJobId === null) return [];
  const sourceJob = jobsStore.jobs.find((j) => j.id === sourceJobId);
  if (!sourceJob) return [];
  const allFiles = sourceJob.files;
  return paths.map((path: string) => allFiles.find((file) => file.path === path)?.name).filter(Boolean) as string[];
};

const confirmRemoveFiles = (paths: string | string[]) => {
  const pathsToRemove: string[] = getPathsForAction(paths);
  const fileList: string[] = getFileNamesFromPaths(pathsToRemove, activeJob.value?.id ?? null);
  const modalOptions: ModalOptions = {
    icon: "mdi:alert-outline",
    title: "Confirm Remove Items",
    description: [`Are you sure you want to remove ${pathsToRemove.length} selected item(s)?`],
    buttons: [
      { action: "proceed", text: "Remove Items", theme: "danger", styleClass: "bordered-btn", icon: "mdi:trash-can-outline" },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
  };
  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, { fileList }, (action: string) => {
    if (action === "proceed" && activeJob.value) {
      jobsStore.removeFilesFromJob(activeJob.value.id, pathsToRemove);
      fileTableRef.value?.deselectAll();
    }
  });
};

const openOperationConfirmModal = (
  operation: "move" | "copy",
  files: FileItem[],
  targetJobId: number | "new-job",
  sourceJobId: number | null
) => {
  const targetJob = jobsStore.jobs.find((j) => j.id === targetJobId);
  let itemsToProcess: FileItem[] = [];
  let itemsToSkip: FileItem[] = [];

  if (targetJob) {
    const targetFilePaths = new Set(targetJob.files.map((f) => f.path));
    for (const file of files) {
      if (targetFilePaths.has(file.path)) {
        itemsToSkip.push(file);
      } else {
        itemsToProcess.push(file);
      }
    }
  } else {
    itemsToProcess.push(...files);
  }

  const opString = operation === "move" ? "Move" : "Copy";
  const targetName = targetJobId === "new-job" ? "a new job" : `Job ${targetJobId}`;
  const modalOptions: ModalOptions = {
    icon: operation === "move" ? "mdi:arrow-right" : "mdi:content-copy",
    title: `Confirm ${opString} Items`,
    description: [`Are you sure you want to ${operation} the following item(s) to <strong>${targetName}</strong>?`],
    buttons: [
      {
        action: "proceed",
        text: `${opString} Items`,
        theme: operation === "move" ? "warning" : "primary",
        styleClass: "bordered-btn",
      },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
  };

  modalsStore.openModal(
    "ResetConfirmationModalContent",
    modalOptions,
    {
      itemsToProcess,
      itemsToSkip,
    },
    (action: string) => {
      if (action === "proceed") {
        uiStore.handleFileOperation(operation, files, targetJobId, { sourceJobId });
      }
    }
  );
};

const confirmMoveFiles = (payload: FileOperationPayload | ContextMenuFileOperationPayload): void => {
  const { targetJobId } = payload;
  const pathsToMove = "files" in payload ? payload.files : getPathsForAction(payload.rightClickedPath);
  const fileItems = getFileItemsFromPaths(pathsToMove, activeJob.value?.id ?? null);
  openOperationConfirmModal("move", fileItems, targetJobId, activeJob.value?.id ?? null);
};

const confirmMoveToNewJob = (paths: string | string[]): void => {
  const pathsToMove = getPathsForAction(paths);
  const fileItems = getFileItemsFromPaths(pathsToMove, activeJob.value?.id ?? null);
  openOperationConfirmModal("move", fileItems, "new-job", activeJob.value?.id ?? null);
};

const confirmCopyFiles = (payload: FileOperationPayload | ContextMenuFileOperationPayload): void => {
  const { targetJobId } = payload;
  const pathsToCopy = "files" in payload ? payload.files : getPathsForAction(payload.rightClickedPath);
  const fileItems = getFileItemsFromPaths(pathsToCopy, activeJob.value?.id ?? null);
  openOperationConfirmModal("copy", fileItems, targetJobId, activeJob.value?.id ?? null);
};

const confirmCopyToNewJob = (paths: string | string[]): void => {
  const pathsToCopy = getPathsForAction(paths);
  const fileItems = getFileItemsFromPaths(pathsToCopy, activeJob.value?.id ?? null);
  openOperationConfirmModal("copy", fileItems, "new-job", activeJob.value?.id ?? null);
};

const addItemsToJob = (paths: string[]): void => {
  if (activeJob.value) {
    jobsStore.addFilesToJob(activeJob.value.id, paths);
  }
};
</script>

<style scoped>
/* REMOVED: Styles for the selection box are no longer needed here */
</style>

<style scoped src="./job-area-comp/job-area.scoped.css"></style>
