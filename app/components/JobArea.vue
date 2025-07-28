<!-- components/JobArea.vue @preserve -->
<!--
  Description:
  This component displays the active job's files and manages the job area's
  state, including internal drag-to-select.
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

    <transition name="job-fade">
      <div v-if="activeJob" :key="activeJob.id" class="job">
        <div class="job-header">
          <h2>Job {{ activeJob.id }}</h2>
        </div>
        <div class="job-content">
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
import type { ModalOptions } from "@/types/modal";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logSelectionChange, logInteraction, logFailsafe } from "@/utils/loggers";
import FileTable from "@/components/FileTable.vue";
import DropZone from "@/components/DropZone.vue";
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

const fileTableRef = ref<InstanceType<typeof FileTable> | null>(null);
const jobAreaRef = ref<HTMLElement | null>(null);
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

const handleWindowClick = (event: MouseEvent) => {
  if (!jobAreaRef.value) {
    logFailsafe("JobArea:handleWindowClick", "Fired but jobAreaRef is null.");
    return;
  }

  const clickedInside = jobAreaRef.value.contains(event.target as Node);

  if (!clickedInside) {
    if (isJobAreaActive.value) {
      logInteraction("JobArea", "Click outside detected. Setting job area to inactive.");
      isJobAreaActive.value = false;
    }
  } else {
    logInteraction("JobArea", "handleWindowClick detected click inside. No state change.");
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!isJobAreaActive.value || !activeJob.value || !fileTableRef.value) {
    return;
  }

  if ((event.ctrlKey || event.metaKey) && (event.key === "a" || event.key === "c" || event.key === "x" || event.key === "v")) {
    event.preventDefault();
  } else if (event.key === "Delete") {
    event.preventDefault();
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "a") {
    if (event.shiftKey) {
      fileTableRef.value.deselectAll();
      logInteraction("JobArea", "Keyboard shortcut: Ctrl+Shift+A (Deselect All)");
    } else {
      fileTableRef.value.toggleAll();
      logInteraction("JobArea", "Keyboard shortcut: Ctrl+A (Select All)");
    }
  } else if (event.key === "Delete") {
    if (selectedFilePaths.value.length > 0) {
      confirmRemoveFiles(selectedFilePaths.value);
      logInteraction("JobArea", "Keyboard shortcut: Delete (Remove Selected Items)");
    }
  } else if ((event.ctrlKey || event.metaKey) && event.key === "c") {
    if (selectedFilePaths.value.length > 0) {
      const filesToCopy: FileItem[] = selectedFilePaths.value
        .map((path) => activeJob.value?.files.find((file) => file.path === path))
        .filter(Boolean) as FileItem[];
      console.log(
        "[JobArea] Attempting to copy files:",
        filesToCopy.map((f) => f.name)
      );
      clipboardStore.copy(filesToCopy, activeJob.value.id);
      logInteraction("JobArea", "Keyboard shortcut: Ctrl+C (Copy Selected Items)");
    }
  } else if ((event.ctrlKey || event.metaKey) && event.key === "x") {
    if (selectedFilePaths.value.length > 0) {
      const filesToCut: FileItem[] = selectedFilePaths.value
        .map((path) => activeJob.value?.files.find((file) => file.path === path))
        .filter(Boolean) as FileItem[];
      console.log(
        "[JobArea] Attempting to cut files:",
        filesToCut.map((f) => f.name)
      );
      clipboardStore.cut(filesToCut, activeJob.value.id);
      logInteraction("JobArea", "Keyboard shortcut: Ctrl+X (Cut Selected Items)");
    }
  } else if ((event.ctrlKey || event.metaKey) && event.key === "v") {
    console.log(
      "[JobArea] Attempting to paste. Clipboard items:",
      clipboardStore.clipboard.map((f) => f.name)
    );
    if (clipboardStore.hasClipboardItems() && activeJob.value) {
      const filesToPaste = clipboardStore.clipboard;
      const sourceJob = clipboardStore.sourceJobId;
      const isCutOperation = clipboardStore.isCut;
      const targetJobId = activeJob.value.id;

      if (isCutOperation) {
        if (sourceJob !== null && sourceJob === targetJobId) {
          console.log("[JobArea] Cut and paste within the same job. Clearing clipboard.");
          clipboardStore.clear();
          logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste/Cut - Same Job) - No-op, clipboard cleared.");
        } else if (sourceJob !== null && sourceJob !== targetJobId) {
          const fileNames = filesToPaste.map((f: FileItem) => f.name);
          const modalOptions: ModalOptions = {
            icon: "mdi:content-cut",
            title: "Confirm Move Items",
            description: [
              `Are you sure you want to move ${fileNames.length} item(s) from Job ${sourceJob} to Job ${targetJobId}?`,
            ],
            buttons: [
              { action: "proceed", text: "Move Items", theme: "warning", styleClass: "bordered-btn" },
              { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
            ],
            footerJustifyContent: "center",
          };
          modalsStore.openModal(
            "ResetConfirmationModalContent",
            modalOptions,
            { description: modalOptions.description, fileList: fileNames },
            (action: string) => {
              if (action === "proceed") {
                jobsStore.moveFilesBetweenJobs(
                  sourceJob,
                  targetJobId,
                  filesToPaste.map((f: FileItem) => f.path)
                );
                clipboardStore.clear();
                fileTableRef.value?.deselectAll();
                logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste/Move Confirmed)");
              } else {
                logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste/Move Cancelled)");
              }
            }
          );
        }
      } else {
        if (sourceJob !== null && sourceJob === targetJobId) {
          console.log("[JobArea] Copy and paste within the same job. Silently adding files.");
          jobsStore.addClipboardFilesToJob(targetJobId, filesToPaste);
          fileTableRef.value?.deselectAll();
          logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste/Copy - Same Job) - Silently added.");
        } else {
          const fileNames = filesToPaste.map((f: FileItem) => f.name);
          const modalOptions: ModalOptions = {
            icon: "mdi:content-copy",
            title: "Confirm Copy Items",
            description: [`Are you sure you want to copy ${fileNames.length} item(s) to Job ${targetJobId}?`],
            buttons: [
              { action: "proceed", text: "Copy Items", theme: "primary", styleClass: "bordered-btn" },
              { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
            ],
            footerJustifyContent: "center",
          };
          modalsStore.openModal(
            "ResetConfirmationModalContent",
            modalOptions,
            { description: modalOptions.description, fileList: fileNames },
            (action: string) => {
              if (action === "proceed") {
                jobsStore.addClipboardFilesToJob(targetJobId, filesToPaste);
                fileTableRef.value?.deselectAll();
                logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste/Copy Confirmed)");
              } else {
                logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste/Copy Cancelled)");
              }
            }
          );
        }
      }
    } else {
      logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste) - Clipboard is empty.");
    }
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

watch(isJobAreaActive, (newValue, oldValue) => {
  logInteraction("JobArea", `isJobAreaActive state changed from ${oldValue} to ${newValue}`);
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

const getFileNames = (paths: string[]): string[] => {
  if (!activeJob.value) return [];
  const allFiles = activeJob.value.files;
  return paths.map((path: string) => allFiles.find((file) => file.path === path)?.name).filter(Boolean) as string[];
};

const handleMouseDown = (event: MouseEvent): void => {
  if (!isJobAreaActive.value) {
    logInteraction("JobArea", "Setting job area to active.");
    isJobAreaActive.value = true;
  }

  const targetElement = event.target as Element;
  const isInteractiveElement = targetElement.closest(
    "button, a, input, select, textarea, .dropdown-content, .row-actions, .file-table-toolbar"
  );
  // --- FIX START ---
  // Check for the draggable container, not just the text, to prevent the
  // selection box from appearing when clicking the padding area.
  const isDraggableItem = targetElement.closest(".item-name-content");

  if (event.button !== 0 || dragDropStore.isInternalDragActive || isInteractiveElement || isDraggableItem) {
    return;
  }
  // --- FIX END ---

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
    if (DEBUG && debugConfig.logFileSelection) {
      logInteraction("JobArea", "Selection box drag started.");
    }
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
  if (mouseMoved.value) {
    if (DEBUG && debugConfig.logFileSelection) {
      logInteraction("JobArea", "Selection box drag ended.");
      logSelectionChange(
        "JobArea",
        `Final selection (${selectedFilePaths.value.length} items):`,
        selectedFilePaths.value.map((p: string) => p.split(/[\\/]/).pop() || p)
      );
    }
  } else if (event.target instanceof Element) {
    const target: Element = event.target;
    const nameTextEl: Element | null = target.closest(".item-name-text");
    const isCheckbox: Element | null = target.closest(".item-checkbox .custom-button");
    if (nameTextEl) {
      const rowEl: Element | null = nameTextEl.closest(".file-row");
      if (rowEl) {
        if (DEBUG && debugConfig.logFileSelection) {
          const modifiers: string[] = [];
          if (event.ctrlKey || event.metaKey) modifiers.push("CTRL");
          if (event.shiftKey) modifiers.push("SHIFT");
          const modifierString: string = modifiers.length > 0 ? ` with [${modifiers.join(" + ")}]` : "";
          const fileName: string = (rowEl.querySelector(".item-name-text")?.textContent || "unknown file").trim();
          logInteraction("JobArea", `File row clicked${modifierString} on "${fileName}".`);
        }
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
  if (Array.isArray(payload)) {
    return payload;
  }
  const isRightClickedInSelection: boolean = selectedFilePaths.value.includes(payload);
  return isRightClickedInSelection && selectedFilePaths.value.length > 0 ? selectedFilePaths.value : [payload];
};

const confirmRemoveFiles = (paths: string | string[]): void => {
  const pathsToRemove: string[] = getPathsForAction(paths);
  const fileList: string[] = getFileNames(pathsToRemove);
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
  modalsStore.openModal(
    "ResetConfirmationModalContent",
    modalOptions,
    { description: modalOptions.description, fileList },
    (action: string) => {
      if (action === "proceed" && activeJob.value) {
        jobsStore.removeFilesFromJob(activeJob.value.id, pathsToRemove);
        fileTableRef.value?.deselectAll();
      }
    }
  );
};

const confirmMoveFiles = (payload: FileOperationPayload | ContextMenuFileOperationPayload): void => {
  const { targetJobId } = payload;
  const pathsToMove: string[] = "files" in payload ? payload.files : getPathsForAction(payload.rightClickedPath);
  const fileList: string[] = getFileNames(pathsToMove);
  const modalOptions: ModalOptions = {
    icon: "mdi:alert-outline",
    title: "Confirm Move Items",
    description: [`Are you sure you want to move ${pathsToMove.length} selected item(s) to <strong>Job ${targetJobId}</strong>?`],
    buttons: [
      { action: "proceed", text: "Move Items", theme: "warning", styleClass: "bordered-btn" },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
  };
  modalsStore.openModal(
    "ResetConfirmationModalContent",
    modalOptions,
    { description: modalOptions.description, fileList },
    (action: string) => {
      if (action === "proceed" && activeJob.value) {
        jobsStore.moveFilesBetweenJobs(activeJob.value.id, targetJobId, pathsToMove);
        fileTableRef.value?.deselectAll();
      }
    }
  );
};

const confirmMoveToNewJob = (paths: string | string[]): void => {
  const pathsToMove: string[] = getPathsForAction(paths);
  const fileList: string[] = getFileNames(pathsToMove);
  const modalOptions: ModalOptions = {
    icon: "mdi:alert-outline",
    title: "Confirm Move to New Job",
    description: [`Are you sure you want to move ${pathsToMove.length} selected item(s) to a new job?`],
    buttons: [
      { action: "proceed", text: "Move to New Job", theme: "warning", styleClass: "bordered-btn" },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
  };
  modalsStore.openModal(
    "ResetConfirmationModalContent",
    modalOptions,
    { description: modalOptions.description, fileList },
    (action: string) => {
      if (action === "proceed" && activeJob.value) {
        const newJobId: number = jobsStore.addJob();
        jobsStore.moveFilesBetweenJobs(activeJob.value.id, newJobId, pathsToMove);
        jobsStore.selectJob(newJobId);
        fileTableRef.value?.deselectAll();
      }
    }
  );
};

const confirmCopyFiles = (payload: FileOperationPayload | ContextMenuFileOperationPayload): void => {
  const { targetJobId } = payload;
  const pathsToCopy: string[] = "files" in payload ? payload.files : getPathsForAction(payload.rightClickedPath);
  const fileList: string[] = getFileNames(pathsToCopy);
  const modalOptions: ModalOptions = {
    icon: "mdi:alert-outline",
    title: "Confirm Copy Items",
    description: [`Are you sure you want to copy ${pathsToCopy.length} selected item(s) to <strong>Job ${targetJobId}</strong>?`],
    buttons: [
      { action: "proceed", text: "Copy Items", theme: "warning", styleClass: "bordered-btn" },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
  };
  modalsStore.openModal(
    "ResetConfirmationModalContent",
    modalOptions,
    { description: modalOptions.description, fileList },
    (action: string) => {
      if (action === "proceed" && activeJob.value) {
        jobsStore.copyFilesToJob(activeJob.value.id, targetJobId, pathsToCopy);
        fileTableRef.value?.deselectAll();
      }
    }
  );
};

const confirmCopyToNewJob = (paths: string | string[]): void => {
  const pathsToCopy: string[] = getPathsForAction(paths);
  const fileList: string[] = getFileNames(pathsToCopy);
  const modalOptions: ModalOptions = {
    icon: "mdi:alert-outline",
    title: "Confirm Copy to New Job",
    description: [`Are you sure you want to copy ${pathsToCopy.length} selected item(s) to a new job?`],
    buttons: [
      { action: "proceed", text: "Copy to New Job", theme: "primary", styleClass: "bordered-btn" },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
  };
  modalsStore.openModal(
    "ResetConfirmationModalContent",
    modalOptions,
    { description: modalOptions.description, fileList },
    (action: string) => {
      if (action === "proceed" && activeJob.value) {
        const newJobId: number = jobsStore.addJob();
        jobsStore.copyFilesToJob(activeJob.value.id, newJobId, pathsToCopy);
        jobsStore.selectJob(newJobId);
        fileTableRef.value?.deselectAll();
      }
    }
  );
};

const addItemsToJob = (paths: string[]): void => {
  if (activeJob.value) {
    jobsStore.addFilesToJob(activeJob.value.id, paths);
  }
};
</script>

<style scoped src="./job-area-comp/job-area.scoped.css"></style>
