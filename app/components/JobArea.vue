<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  JobArea.vue @preserve
-->
<!-- components/JobArea.vue @preserve -->
<!-- 
  JobArea.vue @preserve
-->
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
              restoreFileTableFocus();
            }
          "
        >
          Paste
        </CustomButton>
        <!-- Other context menu items -->
      </template>
    </DropdownMenu>
    <transition name="job-fade">
      <div v-if="activeJob" :key="activeJob.id" ref="jobRef" class="job">
        <div class="job-header">
          <h2>Job {{ activeJob.id }}</h2>
        </div>
        <div ref="jobContentRef" class="job-content" @contextmenu.prevent.stop="showJobContextMenu">
          <LoadingAnim 
            :visible="showLoading" 
            :current-item="jobsStore.progressInfo.currentItem"
            :total-items="jobsStore.progressInfo.totalItems"
            :progress-message="jobsStore.progressInfo.message"
            :overall-current-folder="jobsStore.progressInfo.overallCurrentFolder"
            :overall-total-folders="jobsStore.progressInfo.overallTotalFolders"
            :overall-progress-message="jobsStore.progressInfo.overallProgressMessage"
            @cancel="cancelOperation" 
            @pause="handlePause"
            @animation-finished="onAnimationFinished"
            @nevermind="handleNevermind"
          >
            {{ loadingMessage }}
          </LoadingAnim>
          <FileTable
            ref="fileTableRef"
            :files="activeJob.files"
            :is-loading="false"
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
            @file-table-context-menu-closed="restoreFileTableFocus"
            @refresh-files="handleRefreshFiles"
          />
        </div>
      </div>
    </transition>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from "vue";
import { useJobsStore, type Job } from "@/stores/jobsStore";

const emit = defineEmits<{
  "files-added": [paths: string[]];
  "folders-added": [paths: string[]];
}>();
import { useModalsStore } from "@/stores/modalsStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import { useUiStore } from "@/stores/uiStore";
import type { ModalOptions } from "@/types/modal";
import FileTable from "@/components/FileTable.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import type { FileItem } from "@/types/types";
import LoadingAnim from "@/components/LoadingAnim.vue";
import { logLoading, logRendering, logUI, logFocus, logGlobalEvent, logStoreAction, logDualProgress } from "@/utils/loggers";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
type FileOperationPayload = {
  targetJobId: number;
  files: string[];
};
type ContextMenuFileOperationPayload = {
  targetJobId: number;
  rightClickedPath: string;
};
type LoadingState = "idle" | "adding" | "removing" | "transferring";
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
const operationTimer = ref<NodeJS.Timeout | null>(null);
const loadingState = ref<LoadingState>("idle");
const showLoading = ref(false);

let operationCancelled = false;
const loadingMessage = computed(() => {
  switch (loadingState.value) {
    case "adding":
      return "Adding items, please wait...";
    case "removing":
      return "Removing items, please wait...";
    case "transferring":
      return "Transferring items...";
    default:
      return "";
  }
});
const activeJob = computed(() => {
  const job = jobsStore.jobs.find((job: Job) => job.id === jobsStore.selectedJobId);
  logRendering("JobArea", `activeJob computed: job ${jobsStore.selectedJobId} has ${job?.files.length || 0} files`);
  return job;
});
// When the selected job changes (e.g., user clicks a job tab), ensure the
// FileTable for the active job is marked as active so it receives keyboard
// focus and styling (`is-active` class).
watch(
  () => jobsStore.selectedJobId,
  (newId, oldId) => {
    if (newId !== oldId && newId !== null) {
      nextTick(() => {
        fileTableRef.value?.setActive(true);
      });
    }
  }
);
// Watch for changes in the active job's files to ensure FileTable updates
watch(
  () => activeJob.value?.files,
  (newFiles, oldFiles) => {
    logRendering("JobArea", `Active job files changed: ${oldFiles?.length || 0} -> ${newFiles?.length || 0} files`);
  },
  { deep: true }
);

// Watch for progress info changes to track dual progress
watch(
  () => jobsStore.progressInfo,
  (newProgress, oldProgress) => {
    if (newProgress.overallTotalFolders !== oldProgress.overallTotalFolders || 
        newProgress.overallCurrentFolder !== oldProgress.overallCurrentFolder) {
      logDualProgress("JobArea", `Progress info changed in JobArea`, {
        old: {
          overallCurrentFolder: oldProgress.overallCurrentFolder,
          overallTotalFolders: oldProgress.overallTotalFolders,
          overallProgressMessage: oldProgress.overallProgressMessage
        },
        new: {
          overallCurrentFolder: newProgress.overallCurrentFolder,
          overallTotalFolders: newProgress.overallTotalFolders,
          overallProgressMessage: newProgress.overallProgressMessage
        },
        showLoading: showLoading.value
      });
    }
  },
  { deep: true }
);
// Restore file table focus when context menu closes
const restoreFileTableFocus = () => {
  logFocus("JobArea", "restoreFileTableFocus called", {
    hasFileTableRef: !!fileTableRef.value,
    activeJobId: activeJob.value?.id
  });
  if (fileTableRef.value) {
    nextTick(() => {
      logFocus("JobArea", "restoreFileTableFocus: calling setActive(true) in nextTick");
      fileTableRef.value?.setActive(true);
    });
  } else {
    logFocus("JobArea", "restoreFileTableFocus: fileTableRef is null");
  }
};
// If the FileTable component wasn't mounted at the time the selectedJobId
// watcher ran, activating it would be missed. Watch the fileTableRef and if
// it becomes available while this JobArea is the active job, mark it active.
watch(
  fileTableRef,
  (newRef) => {
    if (newRef && activeJob.value && jobsStore.selectedJobId === activeJob.value.id) {
      // Ensure DOM children mounted
      nextTick(() => {
        fileTableRef.value?.setActive(true);
      });
    }
  },
  { immediate: true }
);
// Listen for app-level selected-job events so we can deactivate the previous
// FileTable before the new one becomes active. This complements the watcher
// above which activates the new table.
const selectedJobHandler = (ev: Event) => {
  try {
    const e = ev as CustomEvent<{ oldId: number | null; newId: number }>;
    const { oldId, newId } = e.detail;
    // Log incoming selected-job-changed event
    if (DEBUG && debugConfig.logUIEvents) {
      logGlobalEvent("JobArea", `selected-job-changed received`, { oldId, newId, activeJobId: activeJob.value?.id });
    }
    // If this component was the previously selected job, deactivate its table
    if (activeJob.value && oldId !== null && activeJob.value.id === oldId) {
      // log and deactivate
      if (DEBUG && debugConfig.logUIEvents) {
        logGlobalEvent("JobArea", `deactivating fileTable for job ${oldId}`);
      }
      fileTableRef.value?.setActive(false);
    }
    // If this component is the newly selected job and the table exists, activate it
    if (activeJob.value && activeJob.value.id === newId && fileTableRef.value) {
      if (DEBUG && debugConfig.logUIEvents) {
        logGlobalEvent("JobArea", `activating fileTable for job ${newId}`);
      }
      fileTableRef.value?.setActive(true);
    }
  } catch (err) {
    // ignore
  }
};
onMounted(() => {
  window.addEventListener("app:selected-job-changed", selectedJobHandler as EventListener);
  window.addEventListener("app:ensure-activate-filetable", (ev: Event) => {
    try {
      const e = ev as CustomEvent<number>;
      const jobId = e.detail;
      if (activeJob.value && activeJob.value.id === jobId) {
        // ensure activation once mounted
        nextTick(() => {
          fileTableRef.value?.setActive(true);
        });
      }
    } catch (err) {
      // ignore
    }
  });
});
onUnmounted(() => {
  window.removeEventListener("app:selected-job-changed", selectedJobHandler as EventListener);
});
const cancelOperation = (removeScannedItems: boolean = true) => {
  const cancelRequestTime = performance.now();
  const cancelRequestISO = new Date().toISOString();
  logLoading("JobArea", `Cancel button clicked at ${cancelRequestISO} with removeScannedItems=${removeScannedItems}. Clearing operation timer.`);
  operationCancelled = true;
  if (operationTimer.value) {
    clearTimeout(operationTimer.value);
    operationTimer.value = null;
  }
  // Cancel the ongoing file processing operation in the jobs store
  jobsStore.cancelCurrentOperation(removeScannedItems);
  showLoading.value = false;
};
const onAnimationFinished = () => {
  logLoading("JobArea", "Animation finished event received.");
  if (!showLoading.value) {
    loadingState.value = "idle";
  }
};
const handleNevermind = () => {
  logLoading("JobArea", "Nevermind event received from LoadingAnim.");
  // This event is used to close dropdowns in the LoadingAnim component
  // The dropdown will be closed automatically by the dropdown manager
};
const handlePause = (isPaused: boolean) => {
  logLoading("JobArea", `Pause event received from LoadingAnim. Paused: ${isPaused}`);
  if (isPaused) {
    // Pause the current operation
    logLoading("JobArea", "Pausing current operation...");
    console.log(`[JobArea] Calling jobsStore.pauseCurrentOperation() at ${performance.now().toFixed(2)}ms`);
    jobsStore.pauseCurrentOperation();
    console.log(`[JobArea] jobsStore.pauseCurrentOperation() completed at ${performance.now().toFixed(2)}ms`);
  } else {
    // Resume the current operation
    logLoading("JobArea", "Resuming current operation...");
    console.log(`[JobArea] Calling jobsStore.resumeCurrentOperation() at ${performance.now().toFixed(2)}ms`);
    jobsStore.resumeCurrentOperation();
    console.log(`[JobArea] jobsStore.resumeCurrentOperation() completed at ${performance.now().toFixed(2)}ms`);
  }
};
const handleOperation = async (
  state: LoadingState,
  items: string[],
  action: () => Promise<any>
): Promise<void> => {
  operationCancelled = false;
  loadingState.value = state;
  // Set up progress tracking - jobsStore handles this internally now
  let loadingTimer: NodeJS.Timeout | null = null;
  const operationPromise = new Promise<void>((resolve) => {
    const performAction = async () => {
      try {
        if (!operationCancelled) {
          await action();
        }
        resolve();
      } catch (error) {
        if (error instanceof Error && error.message === "Operation cancelled") {
          logLoading("JobArea", "Operation was cancelled during execution");
        } else {
          console.error("Operation failed:", error);
        }
        resolve();
      }
    };
    performAction();
  });
  let shouldShowLoading = false;
  if (items.length >= 100) {
    shouldShowLoading = true;
  } else {
    const timeoutPromise = new Promise((resolve) => {
      loadingTimer = setTimeout(() => resolve("timeout"), 2000); // 2 seconds timeout
    });
    const result = await Promise.race([operationPromise, timeoutPromise]);
    if (result === "timeout") {
      shouldShowLoading = true;
    }
  }
  if (shouldShowLoading && !operationCancelled) {
    showLoading.value = true;
  }
  await operationPromise;
  if (loadingTimer) {
    clearTimeout(loadingTimer);
  }
  // Clear progress callback
  jobsStore.setProgressCallback(null);
  if (operationCancelled) {
    logLoading("JobArea", "Operation was cancelled. Bypassing final state change.");
    // Check if operation was cancelled and show notification for file processing operations
    if (state === "adding") {
      logLoading("JobArea", "Checking for cancelled paths after file processing cancellation...");
      nextTick(() => {
        const cancelledPaths = jobsStore.getCancelledPaths();
        logLoading("JobArea", `Found ${cancelledPaths.length} cancelled paths after cancellation`);
        if (cancelledPaths.length > 0) {
          logLoading("JobArea", "Showing cancellation notification...");
          showCancellationNotification(cancelledPaths);
          jobsStore.clearCancelledPaths(); // Clear the cancelled paths after showing notification
        }
      });
    }
    return;
  }
  logRendering("JobArea", "Operation complete. UI update is about to begin.");
  showLoading.value = false;
  nextTick(() => {
    requestAnimationFrame(() => {
      logUI("JobArea", "UI should now be interactive after DOM patch and repaint.");
    });
  });
};
const showJobContextMenu = (event: MouseEvent) => {
  if ((event.target as Element).closest('.file-row[data-has-context-menu="true"]')) {
    return;
  }
  // Clear file selection when right-clicking in empty area (standard file manager behavior)
  if (fileTableRef.value) {
    fileTableRef.value.deselectAll();
  }
  jobContextMenuRef.value?.openDropdown({ x: event.clientX, y: event.clientY });
};
const handleKeyDown = (event: KeyboardEvent) => {
  if (!activeJob.value || !fileTableRef.value) return;

  // Check if a text input is focused - if so, don't interfere with clipboard operations
  const activeElement = document.activeElement;
  const isTextInput = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.hasAttribute('contenteditable') ||
    activeElement.closest('[contenteditable="true"]')
  );

  // If a text input is focused, let the browser handle clipboard operations
  if (isTextInput && (event.ctrlKey || event.metaKey) && ["c", "x", "v"].includes(event.key)) {
    console.log('JobArea: Allowing clipboard operation in text input', {
      key: event.key,
      activeElement: activeElement?.tagName,
      isTextInput
    });
    return;
  }

  // Only handle shortcuts that don't conflict with FileTable (no CTRL+A)
  const isShortcutKey = (event.ctrlKey || event.metaKey) && ["c", "x", "v"].includes(event.key);
  if (isShortcutKey) {
    event.preventDefault();
    event.stopPropagation();
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "c") {
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
  // Add debugging to track duplicate calls
  logStoreAction("JobArea", "confirmRemoveFiles called", { 
    pathsCount: Array.isArray(paths) ? paths.length : 1,
    paths: Array.isArray(paths) ? paths : [paths],
    stackTrace: new Error().stack
  });

  const pathsToRemove: string[] = getPathsForAction(paths);
  const itemsToProcess: FileItem[] = getFileItemsFromPaths(pathsToRemove, activeJob.value?.id ?? null);
  const modalOptions: ModalOptions = {
    icon: "mdi:alert-outline",
    title: "Confirm Remove Items",
    description: [`Are you sure you want to remove ${pathsToRemove.length} selected item(s)?`],
    buttons: [
      { action: "proceed", text: "Remove Items", theme: "danger", styleClass: "bordered-btn", icon: "mdi:trash-can-outline" },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
    closeOnClickOutside: true,
  };
  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, { 
    itemsToProcess,
    itemsToSkip: [],
    showProcessColumn: true,
    showSkipColumn: false
  }, (action: string) => {
    if (action === "proceed" && activeJob.value) {
      handleOperation("removing", pathsToRemove, async () => {
        jobsStore.removeFilesFromJob(activeJob.value!.id, pathsToRemove);
        fileTableRef.value?.deselectAll();
      });
    }
    // Reactivate FileTable after modal closes
    nextTick(() => {
      fileTableRef.value?.setActive(true);
    });
  });
};
const openOperationConfirmModal = (
  operation: "move" | "copy",
  files: FileItem[],
  targetJobId: number | "new-job",
  sourceJobId: number | null
) => {
  // Add logging to debug the issue
  if (DEBUG && debugConfig.logStoreActions) {
    logStoreAction("JobArea", "openOperationConfirmModal called", { 
      operation,
      filesCount: files.length,
      targetJobId, 
      targetJobIdType: typeof targetJobId,
      sourceJobId,
      sourceJobIdType: typeof sourceJobId
    });
  }
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
  // Add logging for the targetName construction
  if (DEBUG && debugConfig.logStoreActions) {
    logStoreAction("JobArea", "targetName constructed", { 
      targetJobId, 
      targetJobIdType: typeof targetJobId,
      targetName,
      targetNameType: typeof targetName
    });
  }
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
    closeOnClickOutside: true,
  };
  modalsStore.openModal(
    "ResetConfirmationModalContent",
    modalOptions,
    {
      itemsToProcess,
      itemsToSkip,
      operation,
    },
    (action: string, conflictResolution?: 'skip' | 'replace') => {
      if (action === "proceed") {
        handleOperation(
          "transferring",
          files.map(f => f.path),
          async () => {
            uiStore.handleFileOperation(operation, files, targetJobId, { 
              sourceJobId, 
              conflictResolution: conflictResolution || (operation === 'move' ? 'replace' : 'skip')
            });
          }
        );
      }
      // Reactivate FileTable after modal closes
      nextTick(() => {
        fileTableRef.value?.setActive(true);
      });
    }
  );
};
const confirmMoveFiles = (payload: FileOperationPayload | ContextMenuFileOperationPayload): void => {
  const { targetJobId } = payload;
  // Add logging to debug the issue
  if (DEBUG && debugConfig.logStoreActions) {
    logStoreAction("JobArea", "confirmMoveFiles received payload", { 
      payload,
      targetJobId, 
      targetJobIdType: typeof targetJobId,
      hasFiles: "files" in payload,
      hasRightClickedPath: "rightClickedPath" in payload
    });
  }
  let pathsToMove = "files" in payload ? payload.files : getPathsForAction(payload.rightClickedPath || "");
  // If only one path was passed but the user currently has a multi-selection that includes
  // that path, prefer the full selection (defensive against races where selection wasn't
  // propagated in time).
  if (pathsToMove.length === 1 && selectedFilePaths.value.length > 1 && pathsToMove[0] && selectedFilePaths.value.includes(pathsToMove[0])) {
    pathsToMove = [...selectedFilePaths.value];
  }
  const fileItems = getFileItemsFromPaths(pathsToMove, activeJob.value?.id ?? null);
  openOperationConfirmModal("move", fileItems, targetJobId, activeJob.value?.id ?? null);
};
const confirmMoveToNewJob = (paths: string | string[]): void => {
  let pathsToMove = getPathsForAction(paths);
  if (pathsToMove.length === 1 && selectedFilePaths.value.length > 1 && pathsToMove[0] && selectedFilePaths.value.includes(pathsToMove[0])) {
    pathsToMove = [...selectedFilePaths.value];
  }
  const fileItems = getFileItemsFromPaths(pathsToMove, activeJob.value?.id ?? null);
  openOperationConfirmModal("move", fileItems, "new-job", activeJob.value?.id ?? null);
};
const confirmCopyFiles = (payload: FileOperationPayload | ContextMenuFileOperationPayload): void => {
  const { targetJobId } = payload;
  // Add logging to debug the issue
  if (DEBUG && debugConfig.logStoreActions) {
    logStoreAction("JobArea", "confirmCopyFiles received payload", { 
      payload,
      targetJobId, 
      targetJobIdType: typeof targetJobId,
      hasFiles: "files" in payload,
      hasRightClickedPath: "rightClickedPath" in payload
    });
  }
  let pathsToCopy = "files" in payload ? payload.files : getPathsForAction(payload.rightClickedPath || "");
  if (pathsToCopy.length === 1 && selectedFilePaths.value.length > 1 && pathsToCopy[0] && selectedFilePaths.value.includes(pathsToCopy[0])) {
    pathsToCopy = [...selectedFilePaths.value];
  }
  const fileItems = getFileItemsFromPaths(pathsToCopy, activeJob.value?.id ?? null);
  openOperationConfirmModal("copy", fileItems, targetJobId, activeJob.value?.id ?? null);
};
const confirmCopyToNewJob = (paths: string | string[]): void => {
  let pathsToCopy = getPathsForAction(paths);
  if (pathsToCopy.length === 1 && selectedFilePaths.value.length > 1 && pathsToCopy[0] && selectedFilePaths.value.includes(pathsToCopy[0])) {
    pathsToCopy = [...selectedFilePaths.value];
  }
  const fileItems = getFileItemsFromPaths(pathsToCopy, activeJob.value?.id ?? null);
  openOperationConfirmModal("copy", fileItems, "new-job", activeJob.value?.id ?? null);
};
const showCancellationNotification = (cancelledPaths: string[]): void => {
  logUI("JobArea", `showCancellationNotification called with ${cancelledPaths.length} cancelled paths`);
  // Create notification for cancelled operation using the regular notification system
  const notification = {
    title: "Operation Cancelled",
    messages: [
      {
        text: `File processing was cancelled. ${cancelledPaths.length} item${cancelledPaths.length > 1 ? 's' : ''} were not added.`,
        type: "warning" as const,
        details: {
          sourceJobId: null,
          destinationJobId: activeJob.value?.id || 0,
          filePaths: cancelledPaths,
          reasons: cancelledPaths.reduce((acc, path) => {
            acc[path] = "Processing cancelled by user";
            return acc;
          }, {} as Record<string, string>)
        }
      }
    ],
    glowType: "warning" as const,
    targetId: activeJob.value?.id || 0,
    duration: 5000 // 5 seconds
  };
  logUI("JobArea", `Adding regular notification for cancellation`);
  // Use the regular notification system instead of job-specific positioning
  uiStore.addNotification(notification);
};
const addItemsToJob = async (paths: string[]): Promise<void> => {
  const operationStartTime = performance.now();
  const operationStartISO = new Date().toISOString();
  logUI("JobArea", `addItemsToJob called with ${paths.length} paths at ${operationStartISO}:`, paths);
  if (activeJob.value) {
    const initialFileCount = activeJob.value.files.length;
    logUI("JobArea", `Initial file count for job ${activeJob.value.id}: ${initialFileCount}`);
    await handleOperation("adding", paths, async () => {
      const processingStartTime = performance.now();
      logLoading("JobArea", `Starting file processing for ${paths.length} paths at ${new Date().toISOString()}...`);
      
      // Determine if we're processing multiple folders or individual files
      // If we have multiple paths, treat them as folders for dual progress tracking
      let addedCount: number;
      if (paths.length > 1) {
        // Multiple folders - use dual progress tracking
        logLoading("JobArea", `Processing ${paths.length} folders with dual progress tracking`);
        addedCount = await jobsStore.addMultipleFoldersToJob(activeJob.value!.id, paths);
      } else {
        // Single folder or individual files - use single progress tracking
        logLoading("JobArea", `Processing single item with single progress tracking`);
        addedCount = await jobsStore.addFilesToJob(activeJob.value!.id, paths);
      }
      
      const processingEndTime = performance.now();
      const processingDuration = processingEndTime - processingStartTime;
      logLoading("JobArea", `File processing completed in ${processingDuration.toFixed(2)}ms. Added ${addedCount} files.`);
      return addedCount;
    });
    // Check if files were actually added (only for successful operations)
    nextTick(() => {
      const finalFileCount = activeJob.value?.files.length || 0;
      const totalOperationTime = performance.now() - operationStartTime;
      logUI("JobArea", `Final file count for job ${activeJob.value?.id}: ${finalFileCount} (was ${initialFileCount}). Total operation time: ${totalOperationTime.toFixed(2)}ms`);

      // Emit events for auto-determination of output location/filename
      if (finalFileCount > initialFileCount) {
        // Determine if we're dealing with files or folders based on the input paths
        // Since the store method handles both, we'll emit both events with the same paths
        // The parent component will handle them appropriately
        emit("files-added", paths);
        emit("folders-added", paths);
        logUI("JobArea", `Emitted file/folder addition events for auto-determination: ${paths.length} paths`);
      }
    });
  } else {
    logUI("JobArea", "No active job available for adding files");
  }
};
const handleRefreshFiles = () => {
  logUI("JobArea", "handleRefreshFiles called. Refreshing file table.");
  // Force a re-render by triggering a reactive update
  // The files should already be updated in the store, so we just need to ensure
  // the component re-renders with the new data
  nextTick(() => {
    if (fileTableRef.value) {
      try {
        // Call the FileTable's refresh method directly to force recalculation
        fileTableRef.value.handleRefreshFiles();
        // Also ensure the FileTable is active
        fileTableRef.value.setActive(true);
        logUI("JobArea", "FileTable refresh completed successfully");
      } catch (error) {
        logUI("JobArea", "Error refreshing FileTable", error);
      }
    } else {
      logUI("JobArea", "FileTable ref is null, cannot refresh");
    }
  });
};
</script>
<style scoped>
.job-content {
  position: relative; /* Needed for the loading overlay */
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
</style>
<style scoped src="./job-area-comp/job-area.scoped.css"></style>
