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
      <div v-if="activeJob" :key="activeJob.id" ref="jobRef" class="job">
        <div class="job-header">
          <h2>Job {{ activeJob.id }}</h2>
          <!-- Test button for notifications -->
          <CustomButton
            button-style-class="trans-btn"
            data-name="test-notification-btn"
            first-icon-name="mdi:bell"
            :first-icon-size="16"
            @click="testNotification"
          >
            Test Notification
          </CustomButton>
        </div>
        <div ref="jobContentRef" class="job-content" @contextmenu.prevent.stop="showJobContextMenu">
          <LoadingAnim :visible="showLoading" @cancel="cancelOperation" @animation-finished="onAnimationFinished">
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
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from "vue";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useModalsStore } from "@/stores/modalsStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import { useUiStore } from "@/stores/uiStore";
import type { ModalOptions } from "@/types/modal";
import FileTable from "@/components/FileTable.vue";
import DropdownMenu from "@/components/DropdownMenu.vue";
import type { FileItem } from "@/types/types";
import LoadingAnim from "@/components/LoadingAnim.vue";
import { logLoading, logRendering, logUI } from "@/utils/loggers";

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
      return "Adding files, please wait...";
    case "removing":
      return "Removing Files, please wait...";
    case "transferring":
      return "Transferring files...";
    default:
      return "";
  }
});

const activeJob = computed(() => {
  return jobsStore.jobs.find((job: Job) => job.id === jobsStore.selectedJobId);
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
    try {
      const { logGlobalEvent } = require("@/utils/loggers");
      logGlobalEvent("JobArea", `selected-job-changed received`, { oldId, newId, activeJobId: activeJob.value?.id });
    } catch (e) {
      // fallback
      // eslint-disable-next-line no-console
      console.log("JobArea.selectedJobHandler", { oldId, newId, activeJobId: activeJob.value?.id });
    }

    // If this component was the previously selected job, deactivate its table
    if (activeJob.value && oldId !== null && activeJob.value.id === oldId) {
      // log and deactivate
      // eslint-disable-next-line no-console
      console.log(`JobArea: deactivating fileTable for job ${oldId}`);
      fileTableRef.value?.setActive(false);
    }

    // If this component is the newly selected job and the table exists, activate it
    if (activeJob.value && activeJob.value.id === newId && fileTableRef.value) {
      // eslint-disable-next-line no-console
      console.log(`JobArea: activating fileTable for job ${newId}`);
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
  
  // Remove test notification code - no longer needed
});

onUnmounted(() => {
  window.removeEventListener("app:selected-job-changed", selectedJobHandler as EventListener);
});

const cancelOperation = () => {
  logLoading("JobArea", "Cancel button clicked. Clearing operation timer.");
  operationCancelled = true;
  if (operationTimer.value) {
    clearTimeout(operationTimer.value);
    operationTimer.value = null;
  }
  showLoading.value = false;
};

const onAnimationFinished = () => {
  logLoading("JobArea", "Animation finished event received.");
  if (!showLoading.value) {
    loadingState.value = "idle";
  }
};

const handleOperation = async (
  state: LoadingState,
  items: any[],
  action: () => Promise<any> | void,
  operationType?: "copy" | "move"
) => {
  operationCancelled = false;
  loadingState.value = state;

  let loadingTimer: NodeJS.Timeout | null = null;

  const operationPromise = new Promise<void>(async (resolve) => {
    // Temporarily disabled debug delay
    // if (operationType === "copy") {
    //   logLoading("JobArea", "Applying 5-second debug delay for copy operation.");
    //   await new Promise((res) => setTimeout(res, 5000));
    // }

    if (!operationCancelled) {
      await action();
    }
    resolve();
  });

  let shouldShowLoading = false;

  if (items.length >= 100) {
    shouldShowLoading = true;
  } else {
    const timeoutPromise = new Promise((resolve) => {
      loadingTimer = setTimeout(() => resolve("timeout"), 2000);
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

  if (operationCancelled) {
    logLoading("JobArea", "Operation was cancelled. Bypassing final state change.");
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
    closeOnClickOutside: true,
  };
  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, { fileList }, (action: string) => {
    if (action === "proceed" && activeJob.value) {
      handleOperation("removing", pathsToRemove, () => {
        jobsStore.removeFilesFromJob(activeJob.value!.id, pathsToRemove);
        fileTableRef.value?.deselectAll();
      });
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
          files,
                  () => {
          uiStore.handleFileOperation(operation, files, targetJobId, { 
            sourceJobId, 
            conflictResolution: conflictResolution || (operation === 'move' ? 'replace' : 'skip')
          });
        },
          operation
        );
      }
    }
  );
};

const confirmMoveFiles = (payload: FileOperationPayload | ContextMenuFileOperationPayload): void => {
  const { targetJobId } = payload;
  let pathsToMove = "files" in payload ? payload.files : getPathsForAction(payload.rightClickedPath);
  // If only one path was passed but the user currently has a multi-selection that includes
  // that path, prefer the full selection (defensive against races where selection wasn't
  // propagated in time).
  if (pathsToMove.length === 1 && selectedFilePaths.value.length > 1 && selectedFilePaths.value.includes(pathsToMove[0])) {
    pathsToMove = [...selectedFilePaths.value];
  }
  const fileItems = getFileItemsFromPaths(pathsToMove, activeJob.value?.id ?? null);
  openOperationConfirmModal("move", fileItems, targetJobId, activeJob.value?.id ?? null);
};

const confirmMoveToNewJob = (paths: string | string[]): void => {
  let pathsToMove = getPathsForAction(paths);
  if (pathsToMove.length === 1 && selectedFilePaths.value.length > 1 && selectedFilePaths.value.includes(pathsToMove[0])) {
    pathsToMove = [...selectedFilePaths.value];
  }
  const fileItems = getFileItemsFromPaths(pathsToMove, activeJob.value?.id ?? null);
  openOperationConfirmModal("move", fileItems, "new-job", activeJob.value?.id ?? null);
};

const confirmCopyFiles = (payload: FileOperationPayload | ContextMenuFileOperationPayload): void => {
  const { targetJobId } = payload;
  let pathsToCopy = "files" in payload ? payload.files : getPathsForAction(payload.rightClickedPath);
  if (pathsToCopy.length === 1 && selectedFilePaths.value.length > 1 && selectedFilePaths.value.includes(pathsToCopy[0])) {
    pathsToCopy = [...selectedFilePaths.value];
  }
  const fileItems = getFileItemsFromPaths(pathsToCopy, activeJob.value?.id ?? null);
  openOperationConfirmModal("copy", fileItems, targetJobId, activeJob.value?.id ?? null);
};

const confirmCopyToNewJob = (paths: string | string[]): void => {
  let pathsToCopy = getPathsForAction(paths);
  if (pathsToCopy.length === 1 && selectedFilePaths.value.length > 1 && selectedFilePaths.value.includes(pathsToCopy[0])) {
    pathsToCopy = [...selectedFilePaths.value];
  }
  const fileItems = getFileItemsFromPaths(pathsToCopy, activeJob.value?.id ?? null);
  openOperationConfirmModal("copy", fileItems, "new-job", activeJob.value?.id ?? null);
};

const addItemsToJob = async (paths: string[]): Promise<void> => {
  if (activeJob.value) {
    console.log(`[JobArea] Starting to add ${paths.length} items to job ${activeJob.value.id}`);
    
    handleOperation("adding", paths, async () => {
      const result = await jobsStore.addFilesToJobLazy(activeJob.value!.id, paths);
      
      console.log(`[JobArea] File addition result:`, result);
      
      // Show notification for failed additions
      if (result.failedPaths.length > 0) {
        const failedCount = result.failedPaths.length;
        const successCount = result.addedCount;
        
        console.log(`[JobArea] Creating notification for failed additions:`, { failedCount, successCount });
        
        // Create notification message
        const messages = [];
        
        if (successCount > 0) {
          messages.push({
            type: "success" as const,
            text: `Successfully added ${successCount} item${successCount === 1 ? '' : 's'}`
          });
        }
        
        if (failedCount > 0) {
          messages.push({
            type: "error" as const,
            text: `Failed to add ${failedCount} item${failedCount === 1 ? '' : 's'}`,
            details: {
              filePaths: result.failedPaths,
              reasons: result.errors,
              sourceJobId: activeJob.value!.id,
              destinationJobId: activeJob.value!.id
            }
          });
        }
        
        // Get job element position for notification
        const jobElement = jobRef.value;
        const position = jobElement ? jobElement.getBoundingClientRect() : null;
        
        console.log(`[JobArea] Job element:`, jobElement);
        console.log(`[JobArea] Job element position:`, position);
        
        if (position) {
          console.log(`[JobArea] Adding notification with position:`, position);
          
          uiStore.addNotification({
            title: "Add Items Result",
            messages,
            position,
            duration: 8000, // Show for 8 seconds to give time to read
            type: failedCount > 0 ? "warning" : "success"
          });
        } else {
          console.log(`[JobArea] No job element found, adding notification without position`);
          
          uiStore.addNotification({
            title: "Add Items Result",
            messages,
            duration: 8000,
            type: failedCount > 0 ? "warning" : "success"
          });
        }
      } else {
        console.log(`[JobArea] All files added successfully, no notification needed`);
      }
    });
  } else {
    console.log(`[JobArea] No active job found, cannot add items`);
  }
};

const testNotification = () => {
  if (activeJob.value) {
    console.log(`[JobArea] Testing notification for job ${activeJob.value.id}`);
    
    // Get job element position for notification
    const jobElement = jobRef.value;
    const position = jobElement ? jobElement.getBoundingClientRect() : null;
    
    console.log(`[JobArea] Test - Job element:`, jobElement);
    console.log(`[JobArea] Test - Job element position:`, position);
    
    if (position) {
      console.log(`[JobArea] Test - Adding notification with position:`, position);
      
      uiStore.addNotification({
        title: "Test Notification",
        messages: [
          {
            type: "info" as const,
            text: "This is a test notification with job-specific positioning",
            details: {
              filePaths: [],
              reasons: {},
              sourceJobId: activeJob.value!.id,
              destinationJobId: activeJob.value!.id
            }
          }
        ],
        position,
        duration: 5000,
        type: "info"
      });
    } else {
      console.log(`[JobArea] Test - No job element found, adding notification without position`);
      
      uiStore.addNotification({
        title: "Test Notification",
        messages: [
          {
            type: "info" as const,
            text: "This is a test notification without position data"
          }
        ],
        duration: 5000,
        type: "info"
      });
    }
  }
};
</script>

<style scoped>
.job-content {
  position: relative; /* Needed for the loading overlay */
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.job-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--brdr-clr-liter);
}

.job-header h2 {
  margin: 0;
  flex-grow: 1;
}
</style>

<style scoped src="./job-area-comp/job-area.scoped.css"></style>
