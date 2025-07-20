<!-- components/JobArea.vue @preserve -->
<!--
  Description:
  This component displays the active job's files and manages the job area's
  state, including external drag-and-drop and internal drag-to-select.
  It now tracks an 'active' state, adding an 'is-active' class when the user
  clicks within the component. This state is used to show a visual border
  around the content area. Includes enhanced logging to debug active state changes.

  Usage Example:
  This component is rendered within the `JobsSection` component, receiving
  the `isExternalDragOver` prop from the `dragDropStore`.
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

    <!--
      External Drag Overlay
      The visibility of this overlay is controlled by the `isExternalDragOver`
      prop, which originates from the `dragDropStore`. Its internal state
      (which zone is active) is managed locally.
      The overlay is always rendered but its opacity and pointer-events are
      controlled by the `externalOverlayStyle` computed property for smooth
      fade transitions and inspectability.
    -->
    <div
      class="external-drag-overlay"
      :class="{ 'has-active-target': activeDropZone !== null, 'has-error': dropError }"
      :data-is-external-drag-over="isExternalDragOver"
      :style="externalOverlayStyle"
    >
      <!-- Error Message Overlay -->
      <div v-if="dropError" class="drop-error-message">
        <Icon name="mdi:alert-circle-outline" size="48" />
        <span>{{ dropError }}</span>
      </div>

      <!-- Standard Drop Zones -->
      <template v-else>
        <!-- "Add to New Job" is now the first item -->
        <div
          ref="newJobDropZone"
          class="external-drop-zone new-job"
          :class="{ 'drop-target-active': activeDropZone === 'new' }"
          data-zone-type="new"
        >
          <div class="drop-zone-visual">
            <div class="drop-zone-content">
              <Icon name="mdi:package-variant-plus" size="32" />
              <span>Add to New Job</span>
            </div>
          </div>
        </div>
        <!-- "Add to Current Job" is now the second/middle item -->
        <div
          ref="currentJobDropZone"
          class="external-drop-zone current-job"
          :class="{ 'drop-target-active': activeDropZone === 'current' }"
          data-zone-type="current"
        >
          <div class="drop-zone-visual">
            <div class="drop-zone-content">
              <Icon name="mdi:application-import" size="32" />
              <span>Add to Current Job</span>
            </div>
          </div>
        </div>
        <!-- "Add to Separate Jobs" is now the third item -->
        <div
          ref="separateJobsDropZone"
          class="external-drop-zone separate-jobs"
          :class="{ 'drop-target-active': activeDropZone === 'separate' }"
          data-zone-type="separate"
        >
          <div class="drop-zone-visual">
            <div class="drop-zone-content">
              <Icon name="mdi:file-multiple-outline" size="32" />
              <span>Add to Separate Jobs</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Standard Job View -->
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
import { computed, onMounted, onUnmounted, reactive, ref, watch, type CSSProperties } from "vue";
import { listen } from "@tauri-apps/api/event";
import type { Event as TauriEvent, UnlistenFn } from "@tauri-apps/api/event";
import type { PhysicalPosition } from "@tauri-apps/api/window";
import { useJobsStore, type Job } from "@/stores/jobsStore";
import { useModalsStore } from "@/stores/modalsStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { useClipboardStore } from "@/stores/clipboardStore"; // Import the new clipboard store
import type { ModalOptions } from "@/types/modal";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logDragDropEvent, logDropZoneEvent, logSelectionChange, logInteraction, logFailsafe } from "@/utils/loggers";
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

defineProps<{
  isExternalDragOver: boolean;
}>();

const jobsStore = useJobsStore();
const modalsStore = useModalsStore();
const dragDropStore = useDragDropStore();
const clipboardStore = useClipboardStore(); // Initialize the clipboard store

const fileTableRef = ref<InstanceType<typeof FileTable> | null>(null);
const jobAreaRef = ref<HTMLElement | null>(null);
const currentJobDropZone = ref<HTMLElement | null>(null);
const newJobDropZone = ref<HTMLElement | null>(null);
const separateJobsDropZone = ref<HTMLElement | null>(null);
const selectedFilePaths = ref<string[]>([]);
const isDragSelecting = ref<boolean>(false);
const activeDropZone = ref<"current" | "new" | "separate" | null>(null);
const dropError = ref<string | null>(null);
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

const externalOverlayStyle = computed(
  (): CSSProperties => ({
    opacity: dragDropStore.isExternalDragOver ? 1 : 0,
    pointerEvents: dragDropStore.isExternalDragOver ? "auto" : "none",
  })
);

const activeJob = computed(() => {
  return jobsStore.jobs.find((job: Job) => job.id === jobsStore.selectedJobId);
});

let unlistenDragEnter: UnlistenFn | undefined;
let unlistenDragLeave: UnlistenFn | undefined;
let unlistenDragOver: UnlistenFn | undefined;
let unlistenDrop: UnlistenFn | undefined;

// --- Global Event Handlers for Drag/Drop ---
const handleWindowDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const handleWindowDrop = (event: DragEvent) => {
  event.preventDefault();
};

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
    // This case is for debugging. It confirms the click was correctly identified as inside.
    logInteraction("JobArea", "handleWindowClick detected click inside. No state change.");
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!isJobAreaActive.value || !activeJob.value || !fileTableRef.value) {
    return; // Only process shortcuts if job area is active and a job is selected
  }

  // Prevent default behavior for handled shortcuts
  if ((event.ctrlKey || event.metaKey) && (event.key === "a" || event.key === "c" || event.key === "x" || event.key === "v")) {
    event.preventDefault();
  } else if (event.key === "Delete") {
    event.preventDefault();
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "a") {
    // Ctrl+A: Select all
    if (event.shiftKey) {
      // Ctrl+Shift+A: Deselect all
      fileTableRef.value.deselectAll();
      logInteraction("JobArea", "Keyboard shortcut: Ctrl+Shift+A (Deselect All)");
    } else {
      fileTableRef.value.toggleAll();
      logInteraction("JobArea", "Keyboard shortcut: Ctrl+A (Select All)");
    }
  } else if (event.key === "Delete") {
    // Delete key: Remove selected items
    if (selectedFilePaths.value.length > 0) {
      confirmRemoveFiles(selectedFilePaths.value);
      logInteraction("JobArea", "Keyboard shortcut: Delete (Remove Selected Items)");
    }
  } else if ((event.ctrlKey || event.metaKey) && event.key === "c") {
    // Ctrl+C: Copy selected items
    if (selectedFilePaths.value.length > 0) {
      const filesToCopy: FileItem[] = selectedFilePaths.value
        .map((path) => activeJob.value?.files.find((file) => file.path === path))
        .filter(Boolean) as FileItem[];
      console.log(
        "[JobArea] Attempting to copy files:",
        filesToCopy.map((f) => f.name)
      ); // Added log
      clipboardStore.copy(filesToCopy, activeJob.value.id); // Pass current activeJob.value.id as source
      logInteraction("JobArea", "Keyboard shortcut: Ctrl+C (Copy Selected Items)");
    }
  } else if ((event.ctrlKey || event.metaKey) && event.key === "x") {
    // Ctrl+X: Cut selected items
    if (selectedFilePaths.value.length > 0) {
      const filesToCut: FileItem[] = selectedFilePaths.value
        .map((path) => activeJob.value?.files.find((file) => file.path === path))
        .filter(Boolean) as FileItem[];
      console.log(
        "[JobArea] Attempting to cut files:",
        filesToCut.map((f) => f.name)
      ); // Added log
      clipboardStore.cut(filesToCut, activeJob.value.id); // Pass current activeJob.value.id as source
      logInteraction("JobArea", "Keyboard shortcut: Ctrl+X (Cut Selected Items)");
    }
  } else if ((event.ctrlKey || event.metaKey) && event.key === "v") {
    // Ctrl+V: Paste items
    console.log(
      "[JobArea] Attempting to paste. Clipboard items:",
      clipboardStore.clipboard.map((f) => f.name)
    ); // Added log
    if (clipboardStore.hasClipboardItems() && activeJob.value) {
      const filesToPaste = clipboardStore.clipboard;
      const sourceJob = clipboardStore.sourceJobId;
      const isCutOperation = clipboardStore.isCut;
      const targetJobId = activeJob.value.id;

      if (isCutOperation) {
        if (sourceJob !== null && sourceJob === targetJobId) {
          // Case 1: Cut and paste within the same job -> no-op, just clear clipboard
          console.log("[JobArea] Cut and paste within the same job. Clearing clipboard.");
          clipboardStore.clear();
          logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste/Cut - Same Job) - No-op, clipboard cleared.");
        } else if (sourceJob !== null && sourceJob !== targetJobId) {
          // Case 2: Cut and paste to a different job -> confirm move
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
                ); // Pass file paths
                clipboardStore.clear(); // Clear clipboard after successful move (only for cut operations)
                fileTableRef.value?.deselectAll();
                logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste/Move Confirmed)");
              } else {
                logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste/Move Cancelled)");
              }
            }
          );
        }
      } else {
        // Copy operation
        if (sourceJob !== null && sourceJob === targetJobId) {
          // Case 3: Copy and paste within the same job -> silently add files
          console.log("[JobArea] Copy and paste within the same job. Silently adding files.");
          jobsStore.addClipboardFilesToJob(targetJobId, filesToPaste);
          // DO NOT clear clipboard here, allowing multiple pastes for copy operations
          fileTableRef.value?.deselectAll();
          logInteraction("JobArea", "Keyboard shortcut: Ctrl+V (Paste/Copy - Same Job) - Silently added.");
        } else {
          // Case 4: Copy and paste to a different job -> confirm copy
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
                // Use the new action to directly add FileItem objects from clipboard
                jobsStore.addClipboardFilesToJob(targetJobId, filesToPaste);
                // DO NOT clear clipboard here, allowing multiple pastes for copy operations
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
  // Add global listeners to ensure the OS recognizes the window as a drop target
  window.addEventListener("dragover", handleWindowDragOver);
  window.addEventListener("drop", handleWindowDrop);
  window.addEventListener("mousedown", handleWindowClick);
  window.addEventListener("keydown", handleKeyDown); // Add keyboard shortcut listener

  // Centralize all Tauri drag-and-drop listeners here
  unlistenDragEnter = await listen("tauri://drag-enter", (event: TauriEvent<{ items?: string[] }>) => {
    // Explicitly type payload
    const items = event.payload?.items; // Access safely
    if (items === undefined || (Array.isArray(items) && items.length > 0)) {
      // Add Array.isArray check
      logDragDropEvent("JobArea", "Event: tauri://drag-enter -> setting global state to true");
      dragDropStore.setExternalDragOver(true);
    } else {
      logFailsafe("JobArea", "Drag enter event with no items, likely invalid source. Ignoring.");
    }
  });

  unlistenDragLeave = await listen("tauri://drag-leave", () => {
    logDragDropEvent("JobArea", "Event: tauri://drag-leave -> setting global state to false");
    dragDropStore.setExternalDragOver(false);
    activeDropZone.value = null;
  });

  unlistenDragOver = await listen("tauri://drag-over", handleDragOver);
  unlistenDrop = await listen("tauri://drag-drop", handleExternalDrop);
});

onUnmounted(() => {
  // Clean up global listeners
  window.removeEventListener("dragover", handleWindowDragOver);
  window.removeEventListener("drop", handleWindowDrop);
  window.removeEventListener("mousedown", handleWindowClick);
  window.removeEventListener("keydown", handleKeyDown); // Remove keyboard shortcut listener

  // Clean up Tauri listeners
  if (unlistenDragEnter) unlistenDragEnter();
  if (unlistenDragLeave) unlistenDragLeave();
  if (unlistenDragOver) unlistenDragOver();
  if (unlistenDrop) unlistenDrop();
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
  // Always set the area as active on any mousedown within it.
  if (!isJobAreaActive.value) {
    logInteraction("JobArea", "Setting job area to active.");
    isJobAreaActive.value = true;
  }

  // Check if we should start a drag-selection.
  // If the click is on an interactive element, do nothing further.
  if (
    event.button !== 0 ||
    (event.target instanceof Element &&
      event.target.closest("button, a, input, select, textarea, .dropdown-content, .row-actions, .file-table-toolbar"))
  ) {
    return;
  }

  // If we're here, it's a valid mousedown to start a drag.
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

    // Clamp current mouse position to the job area's bounds (in viewport coordinates)
    const currentX = Math.max(areaRect.left, Math.min(event.clientX, areaRect.right));
    const currentY = Math.max(areaRect.top, Math.min(event.clientY, areaRect.bottom));

    // Clamp the start point as well to ensure the selection originates within the area.
    const startX = Math.max(areaRect.left, Math.min(startPoint.x, areaRect.right));
    const startY = Math.max(areaRect.top, Math.min(startPoint.y, areaRect.bottom));

    // Calculate the viewport-relative box for the selection logic
    const viewportSelection = {
      x: Math.min(startX, currentX),
      y: Math.min(startY, currentY),
      width: Math.abs(startX - currentX),
      height: Math.abs(startY - currentY),
    };

    // Pass the calculated viewport coordinates to the FileTable for intersection checks
    fileTableRef.value?.updateSelectionByRect(viewportSelection, event.ctrlKey || event.metaKey);

    // Calculate and store coordinates relative to the jobArea for visual styling
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
        fileTableRef.value?.clickRowByPath(event, rowEl.getAttribute("data-path") || "");
      }
    } else if (!isCheckbox && !target.closest(".file-table-toolbar")) {
      fileTableRef.value?.deselectAll();
    }
  }
  selectionBox.visible = false;
  isDragSelecting.value = false;
};

// --- External Drag and Drop Handlers ---

const isWithinBounds = (el: HTMLElement | null, pos: PhysicalPosition): boolean => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return pos.x > rect.left && pos.x < rect.right && pos.y > rect.top && pos.y < rect.bottom;
};

const handleDragOver = (event: TauriEvent<{ position: PhysicalPosition }>): void => {
  const { position } = event.payload;

  if (isWithinBounds(currentJobDropZone.value, position)) {
    if (activeDropZone.value !== "current") {
      logDropZoneEvent("JobArea", "Hovering 'current job' drop zone");
      activeDropZone.value = "current";
    }
  } else if (isWithinBounds(newJobDropZone.value, position)) {
    if (activeDropZone.value !== "new") {
      logDropZoneEvent("JobArea", "Hovering 'new job' drop zone");
      activeDropZone.value = "new";
    }
  } else if (isWithinBounds(separateJobsDropZone.value, position)) {
    if (activeDropZone.value !== "separate") {
      logDropZoneEvent("JobArea", "Hovering 'separate jobs' drop zone");
      activeDropZone.value = "separate";
    }
  } else if (activeDropZone.value !== null) {
    logDropZoneEvent("JobArea", "Left all drop zones");
    activeDropZone.value = null;
  }
};

const handleExternalDrop = async (event: TauriEvent<{ paths: string[] }>): Promise<void> => {
  logDragDropEvent("JobArea", `Event: tauri://drag-drop, paths: ${event.payload.paths.length}`, event.payload.paths);
  const { paths } = event.payload;

  // If no valid paths are received (e.g., dragging from a zip file), show an error and abort.
  if (!paths || paths.length === 0) {
    logFailsafe("JobArea", "Drop event received with no valid file paths. Aborting.");
    dropError.value = "Cannot drop files from archives. Please extract them first.";
    activeDropZone.value = null;

    // Keep the overlay visible to show the error, then hide everything.
    setTimeout(() => {
      dropError.value = null;
      dragDropStore.setExternalDragOver(false);
    }, 3000);
    return;
  }

  const dropTarget = activeDropZone.value;

  try {
    if (dropTarget === "current") {
      if (activeJob.value) {
        logDropZoneEvent("JobArea", `Attempting to add ${paths.length} files to current job (ID: ${activeJob.value.id})`);
        await jobsStore.addFilesToJob(activeJob.value.id, paths);
        logDropZoneEvent("JobArea", `Successfully added ${paths.length} files to current job (ID: ${activeJob.value.id})`);
      } else {
        logFailsafe("JobArea", "No active job available for drop in 'current' zone");
      }
    } else if (dropTarget === "new") {
      logDropZoneEvent("JobArea", `Attempting to create new job and add ${paths.length} files`);
      const newJobId: number = jobsStore.addJob();
      await jobsStore.addFilesToJob(newJobId, paths);
      jobsStore.selectJob(newJobId);
      logDropZoneEvent("JobArea", `Successfully created new job (ID: ${newJobId}) and added ${paths.length} files`);
    } else if (dropTarget === "separate") {
      logDropZoneEvent("JobArea", `Confirming creation of ${paths.length} separate jobs.`);
      confirmCreateSeparateJobs(paths);
    } else {
      logDragDropEvent("JobArea", "External drop occurred but not on a valid drop zone.");
    }
  } catch (error: unknown) {
    logFailsafe("JobArea", `Error during drop operation: ${error instanceof Error ? error.message : String(error)}`, error);
  }

  // This cleanup now only runs for successful drops.
  dragDropStore.setExternalDragOver(false);
  activeDropZone.value = null;
};

const confirmCreateSeparateJobs = (paths: string[]): void => {
  const modalOptions: ModalOptions = {
    icon: "mdi:file-multiple-outline",
    title: "Create Separate Jobs",
    description: [
      `You are about to create <strong>${paths.length}</strong> new job(s), one for each of the dropped items.`,
      `Do you want to proceed?`,
    ],
    buttons: [
      { action: "proceed", text: `Create ${paths.length} Jobs`, theme: "primary", styleClass: "bordered-btn" },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
  };

  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, { description: modalOptions.description }, (action) => {
    if (action === "proceed") {
      jobsStore.createJobsFromPaths(paths);
    }
  });
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

<style src="~/components/job-area-comp/job-area.scoped.css" scoped></style>
