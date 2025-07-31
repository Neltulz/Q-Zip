<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/JobArea.vue @preserve -->
<!--
  Description:
  This component displays the active job's files and manages the job area's
  state, including internal drag-to-select and a context menu on the job content area.
  It now tracks an 'active' state, adding an 'is-active' class when the user
  clicks within the component. This state is used to show a visual border
  around the content area. Includes enhanced logging to debug active state changes.
  Mouse down on file name text skips selection box to allow native drag from name.
-->
<template>
  <div
    ref="jobAreaRef"
    class="job-area"
    :class="{ 'is-active': isJobAreaActive }"
    data-component-name="JobArea"
    @mousedown="handleMouseDown"
  >
    <div v-if="selectionBox.visible" class="selection-box" :style="selectionBoxStyle" />

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
        <hr />
        <CustomButton
          button-style-class="trans-btn"
          data-name="context-settings-btn"
          first-icon-name="mdi:cog"
          :first-icon-size="20"
          @click="
            () => {
              console.log('Settings clicked');
              close();
            }
          "
        >
          Settings
        </CustomButton>
        <CustomButton
          button-style-class="trans-btn"
          data-name="context-about-btn"
          first-icon-name="mdi:information-outline"
          :first-icon-size="20"
          @click="
            () => {
              console.log('About clicked');
              close();
            }
          "
        >
          About
        </CustomButton>
        <CustomButton
          button-style-class="trans-btn"
          data-name="context-help-btn"
          first-icon-name="mdi:help-circle-outline"
          :first-icon-size="20"
          @click="
            () => {
              console.log('Help clicked');
              close();
            }
          "
        >
          Help
        </CustomButton>
        <hr />
        <CustomButton
          button-style-class="trans-btn btn-lite"
          data-name="context-cancel-btn"
          first-icon-name="mdi:cancel"
          :first-icon-size="20"
          shortcut-text="Esc"
          @click="close()"
        >
          Cancel
        </CustomButton>
      </template>
    </DropdownMenu>

    <transition name="job-fade">
      <div v-if="activeJob" :key="activeJob.id" class="job">
        <div class="job-header">
          <h2>Job {{ activeJob.id }}</h2>
        </div>
        <div class="job-content" @contextmenu.prevent.stop="showJobContextMenu">
          <FileTable
            ref="fileTableRef"
            :files="activeJob.files"
            :is-dragging="selectionBox.visible"
            :job-id="activeJob.id"
            :cut-files="clipboardStore.cutFilePaths"
            :cut-source-job-id="clipboardStore.sourceJobId"
            @copy-files="confirmCopyFiles"
            @copy-to-new-job="confirmCopyToNewJob"
            @move-files="confirmMoveFiles"
            @move-to-new-job="confirmMoveToNewJob"
            @remove-files="confirmRemoveFiles"
            @selection-changed="handleSelectionChange"
          />
          <DropZone :job-id="activeJob.id" @add-files="addItemsToJob" @add-folders="addItemsToJob" />
        </div>
        <div class="job-area-visual-select" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useModalsStore } from "@/stores/modalsStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import { useUiStore, type NotificationMessage, type NotificationType } from "@/stores/uiStore";
import type { ModalOptions } from "@/types/modal";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logSelectionChange, logFailsafe, logStoreAction } from "@/utils/loggers";
import FileTable from "@/components/FileTable.vue";
import DropZone from "@/components/DropZone.vue";
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
const dragDropStore = useDragDropStore();
const clipboardStore = useClipboardStore();
const uiStore = useUiStore();

const fileTableRef = ref<InstanceType<typeof FileTable> | null>(null);
const jobAreaRef = ref<HTMLElement | null>(null);
const jobContextMenuRef = ref<InstanceType<typeof DropdownMenu> | null>(null);
const selectedFilePaths = ref<string[]>([]);
const isDragSelecting = ref<boolean>(false);
const isJobAreaActive = ref<boolean>(false);

const mouseMoved = ref<boolean>(false);
const startPoint = reactive({ x: 0, y: 0 });
const selectionBox = reactive({
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});

const selectionBoxStyle = computed(() => ({
  left: `${selectionBox.x}px`,
  top: `${selectionBox.y}px`,
  width: `${selectionBox.width}px`,
  height: `${selectionBox.height}px`,
}));

const activeJob = computed(() => {
  return jobsStore.jobs.find((job: Job) => job.id === jobsStore.selectedJobId);
});

const showJobContextMenu = (event: MouseEvent) => {
  if ((event.target as Element).closest('.file-row[data-has-context-menu="true"]')) {
    return;
  }
  jobContextMenuRef.value?.openDropdown({ x: event.clientX, y: event.clientY });
};

const handleWindowClick = (event: MouseEvent) => {
  if (!jobAreaRef.value) {
    logFailsafe("JobArea:handleWindowClick", "Fired but jobAreaRef is null.");
    return;
  }
  const clickedInside = jobAreaRef.value.contains(event.target as Node);
  if (!clickedInside && isJobAreaActive.value) {
    isJobAreaActive.value = false;
  }
};

const handlePaste = () => {
  if (clipboardStore.hasClipboardItems() && activeJob.value) {
    const filesToPaste = clipboardStore.clipboard;
    const sourceJobId = clipboardStore.sourceJobId;
    const isCutOperation = clipboardStore.isCut;
    const targetJobId = activeJob.value.id;

    logStoreAction("JobArea", "Pasting items", {
      sourceJobId,
      targetJobId,
      isCut: isCutOperation,
      itemCount: filesToPaste.length,
    });

    // FEAT: For both copy and cut, always show the confirmation modal.
    openOperationConfirmModal(
      isCutOperation ? "move" : "copy",
      filesToPaste.map((f) => f.path),
      targetJobId,
      sourceJobId
    );
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!isJobAreaActive.value || !activeJob.value || !fileTableRef.value) {
    return;
  }

  const isShortcutKey = (event.ctrlKey || event.metaKey) && ["a", "c", "x", "v"].includes(event.key);
  if (isShortcutKey || event.key === "Delete") {
    event.preventDefault();
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "a") {
    if (event.shiftKey) {
      fileTableRef.value.deselectAll();
    } else {
      fileTableRef.value.toggleAll();
    }
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

onMounted(async () => {
  window.addEventListener("mousedown", handleWindowClick);
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("mousedown", handleWindowClick);
  window.removeEventListener("keydown", handleKeyDown);
});

watch(
  selectedFilePaths,
  (newPaths: string[], oldPaths: string[]) => {
    if (DEBUG && debugConfig.logFileSelection) {
      const newSet = new Set(newPaths);
      const oldSet = new Set(oldPaths);
      const getFileName = (path: string) => path.split(/[\\/]/).pop() || path;
      const added = newPaths.filter((path: string) => !oldSet.has(path));
      added.forEach((path: string) => logSelectionChange("JobArea", `"${getFileName(path)}" was added to the selection.`));
      const removed = oldPaths.filter((path: string) => !newSet.has(path));
      removed.forEach((path: string) => logSelectionChange("JobArea", `"${getFileName(path)}" was removed from the selection.`));
      if (added.length > 0 || removed.length > 0) {
        logSelectionChange("JobArea", `Current selection (${newPaths.length} items):`, newPaths.map(getFileName));
      }
    }
  },
  { deep: true }
);

const handleSelectionChange = (newSelection: string[]) => {
  selectedFilePaths.value = newSelection;
};

const getFileNamesFromPaths = (paths: string[], sourceJobId: number | null): string[] => {
  if (sourceJobId === null) return [];
  const sourceJob = jobsStore.jobs.find((j) => j.id === sourceJobId);
  if (!sourceJob) return [];
  const allFiles = sourceJob.files;
  return paths.map((path: string) => allFiles.find((file) => file.path === path)?.name).filter(Boolean) as string[];
};

const handleMouseDown = (event: MouseEvent): void => {
  if (!isJobAreaActive.value) {
    isJobAreaActive.value = true;
  }
  const targetElement = event.target as Element;
  const isInteractiveElement = targetElement.closest(
    "button, a, input, select, textarea, .dropdown-content, .row-actions, .file-table-toolbar"
  );
  const isDraggableItem = targetElement.closest(".item-name-content");
  if (event.button !== 0 || dragDropStore.isInternalDragActive || isInteractiveElement || isDraggableItem) {
    return;
  }
  event.preventDefault();
  mouseMoved.value = false;
  startPoint.x = event.clientX;
  startPoint.y = event.clientY;
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
};

const handleMouseMove = (event: MouseEvent): void => {
  const dx = Math.abs(event.clientX - startPoint.x);
  const dy = Math.abs(event.clientY - startPoint.y);
  if (!mouseMoved.value && (dx > 5 || dy > 5)) {
    mouseMoved.value = true;
    isDragSelecting.value = true;
  }
  if (mouseMoved.value) {
    selectionBox.visible = true;
    const areaRect = jobAreaRef.value?.getBoundingClientRect();
    if (!areaRect) return;
    const currentX = Math.max(areaRect.left, Math.min(event.clientX, areaRect.right));
    const currentY = Math.max(areaRect.top, Math.min(event.clientY, areaRect.bottom));
    const startX = Math.max(areaRect.left, Math.min(startPoint.x, areaRect.right));
    const startY = Math.max(areaRect.top, Math.min(startPoint.y, areaRect.bottom));
    const viewportSelection = {
      x: Math.min(startX, currentX),
      y: Math.min(startY, currentY),
      width: Math.abs(startX - currentX),
      height: Math.abs(startY - currentY),
    };
    fileTableRef.value?.updateSelectionByRect(viewportSelection, event.ctrlKey || event.metaKey);
    selectionBox.x = viewportSelection.x - areaRect.left;
    selectionBox.y = viewportSelection.y - areaRect.top;
    selectionBox.width = viewportSelection.width;
    selectionBox.height = viewportSelection.height;
  }
};

const handleMouseUp = (event: MouseEvent): void => {
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
  if (!mouseMoved.value && event.target instanceof Element) {
    const target: Element = event.target;
    const nameTextEl: Element | null = target.closest(".item-name-text");
    const isCheckbox: Element | null = target.closest(".item-checkbox .custom-button");
    if (nameTextEl) {
      const rowEl: Element | null = nameTextEl.closest(".file-row");
      if (rowEl) {
        fileTableRef.value?.onFileClick(event, rowEl.getAttribute("data-path") || "");
      }
    } else if (!isCheckbox && !target.closest(".file-table-toolbar")) {
      fileTableRef.value?.deselectAll();
    }
  }
  selectionBox.visible = false;
  isDragSelecting.value = false;
};

const getPathsForAction = (payload: string | string[]): string[] => {
  if (Array.isArray(payload)) return payload;
  const isRightClickedInSelection: boolean = selectedFilePaths.value.includes(payload);
  return isRightClickedInSelection && selectedFilePaths.value.length > 0 ? selectedFilePaths.value : [payload];
};

const handleFileOperation = (
  operation: "move" | "copy",
  paths: string[],
  targetJobId: number | "new-job",
  options: { sourceJobId?: number | null } = {}
) => {
  const sourceJobId = options.sourceJobId ?? activeJob.value?.id;
  if (!sourceJobId) return;

  const sourceJob = jobsStore.jobs.find((j) => j.id === sourceJobId);
  if (!sourceJob) return;

  let numericTargetId: number;

  if (targetJobId === "new-job") {
    numericTargetId = jobsStore.addJob();
  } else {
    numericTargetId = targetJobId;
  }

  const targetJob = jobsStore.jobs.find((j) => j.id === numericTargetId);
  if (!targetJob) return;

  const targetFilePaths = new Set(targetJob.files.map((f) => f.path));
  const newFilePaths = paths.filter((path) => !targetFilePaths.has(path));
  const skippedFilePaths = paths.filter((path) => targetFilePaths.has(path));
  const opPastTense = operation === "move" ? "moved" : "copied";

  const messages: NotificationMessage[] = [];
  let glowType: NotificationType = "info";
  let operationSucceeded = false;
  let operationFailed = false;

  if (newFilePaths.length > 0) {
    try {
      if (operation === "move") {
        jobsStore.moveFilesBetweenJobs(sourceJobId, numericTargetId, newFilePaths);
        // After a successful move (cut/paste), clear the clipboard.
        if (clipboardStore.isCut) {
          clipboardStore.clear();
        }
      } else {
        jobsStore.copyFilesToJob(sourceJobId, numericTargetId, newFilePaths);
      }
      operationSucceeded = true;
      messages.push({
        text: `${newFilePaths.length} item${newFilePaths.length > 1 ? "s" : ""} successfully ${opPastTense}.`,
        type: "success",
        details: { sourceJobId, destinationJobId: numericTargetId, filePaths: newFilePaths },
      });
    } catch (e) {
      operationFailed = true;
      console.error(`Failed to ${operation} files:`, e);
      messages.push({
        text: `Failed to ${operation} ${newFilePaths.length} items.`,
        type: "error",
        details: {
          sourceJobId,
          destinationJobId: numericTargetId,
          filePaths: newFilePaths,
          reasons: Object.fromEntries(newFilePaths.map((path) => [path, "Operation failed. See console for details."])),
        },
      });
    }
  }

  if (skippedFilePaths.length > 0) {
    const reasons: Record<string, string> = {};
    skippedFilePaths.forEach((path) => {
      reasons[path] = "Already exists in destination";
    });
    messages.push({
      text: `${skippedFilePaths.length} item${skippedFilePaths.length > 1 ? "s" : ""} were skipped.`,
      type: "warning",
      details: { sourceJobId, destinationJobId: numericTargetId, filePaths: skippedFilePaths, reasons },
    });
    // If it was a cut operation and some items were skipped, we should still clear the clipboard
    // because the user's intent was to paste.
    if (operation === "move" && clipboardStore.isCut) {
      clipboardStore.clear();
    }
  }

  if (operationFailed) {
    glowType = "error";
  } else if (operationSucceeded) {
    glowType = skippedFilePaths.length > 0 ? "warning" : "success";
  } else if (skippedFilePaths.length > 0) {
    glowType = "warning";
  }

  if (messages.length > 0) {
    const title = `${operation.charAt(0).toUpperCase() + operation.slice(1)} Complete`;
    uiStore.triggerJobNotification({
      title,
      messages,
      glowType,
      targetId: numericTargetId,
      duration: 8000,
    });
  }

  if (operationSucceeded || (targetJobId !== "new-job" && skippedFilePaths.length > 0)) {
    jobsStore.selectJob(numericTargetId);
  }

  fileTableRef.value?.deselectAll();
};

const confirmRemoveFiles = (paths: string | string[]): void => {
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
  paths: string[],
  targetJobId: number | "new-job",
  sourceJobId: number | null
) => {
  const targetJob = jobsStore.jobs.find((j) => j.id === targetJobId);
  const itemsToProcessPaths: string[] = [];
  const itemsToSkipPaths: string[] = [];

  if (targetJob) {
    const targetFilePaths = new Set(targetJob.files.map((f) => f.path));
    for (const path of paths) {
      if (targetFilePaths.has(path)) {
        itemsToSkipPaths.push(path);
      } else {
        itemsToProcessPaths.push(path);
      }
    }
  } else {
    itemsToProcessPaths.push(...paths);
  }

  // FEAT: Always show confirmation modal, even if all items would be skipped.
  // The old logic to bypass the modal has been removed.

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
      itemsToProcess: itemsToProcessPaths,
      itemsToSkip: itemsToSkipPaths,
    },
    (action: string) => {
      if (action === "proceed") {
        handleFileOperation(operation, paths, targetJobId, { sourceJobId });
      } else {
        // If user cancels a 'cut' operation, clear the clipboard
        if (operation === "move" && clipboardStore.isCut) {
          clipboardStore.clear();
        }
      }
    }
  );
};

const confirmMoveFiles = (payload: FileOperationPayload | ContextMenuFileOperationPayload): void => {
  const { targetJobId } = payload;
  const pathsToMove: string[] = "files" in payload ? payload.files : getPathsForAction(payload.rightClickedPath);
  openOperationConfirmModal("move", pathsToMove, targetJobId, activeJob.value?.id ?? null);
};

const confirmMoveToNewJob = (paths: string | string[]): void => {
  const pathsToMove: string[] = getPathsForAction(paths);
  openOperationConfirmModal("move", pathsToMove, "new-job", activeJob.value?.id ?? null);
};

const confirmCopyFiles = (payload: FileOperationPayload | ContextMenuFileOperationPayload): void => {
  const { targetJobId } = payload;
  const pathsToCopy: string[] = "files" in payload ? payload.files : getPathsForAction(payload.rightClickedPath);
  openOperationConfirmModal("copy", pathsToCopy, targetJobId, activeJob.value?.id ?? null);
};

const confirmCopyToNewJob = (paths: string | string[]): void => {
  const pathsToCopy: string[] = getPathsForAction(paths);
  openOperationConfirmModal("copy", pathsToCopy, "new-job", activeJob.value?.id ?? null);
};

const addItemsToJob = (paths: string[]): void => {
  if (activeJob.value) {
    jobsStore.addFilesToJob(activeJob.value.id, paths);
  }
};
</script>

<style scoped src="./job-area-comp/job-area.scoped.css"></style>
