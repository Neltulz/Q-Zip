<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/JobSelectorArea.vue @preserve -->

<template>
  <nav
    class="job-selector-area"
    :class="{ 'internal-drag-active': dragDropStore.isInternalDragActive }"
    data-component-name="JobSelectorArea"
  >
    <OverlayScrollbarsComponent
      defer
      class="job-selector-scrollable"
      :options="{
        scrollbars: {
          visibility: 'auto',
          autoHide: 'move',
          autoHideSuspend: true,
          theme: currentTheme,
        },
      }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="onDrop(null)"
    >
      <div class="job-selector-list">
        <CustomButton
          v-for="(job, index) in jobsList"
          :key="job.id"
          class="job-selector"
          :class="{
            active: jobsStore.selectedJobId === job.id,
            'is-dragged': job.id === draggedJobId,
            'drop-target-hover': hoveredJobId === job.id && dragDropStore.isInternalDragActive,
          }"
          button-style-class="trans-btn btn-darkr can-become-active"
          :data-job-id="job.id"
          :data-name="'job-' + job.id"
          :draggable="true"
          @click="selectJob(job.id)"
          @dragend="onDragEnd"
          @dragstart="onDragStart($event, job.id)"
          @dragover.prevent="handleJobTabDragOver($event, job.id)"
          @dragleave="handleJobTabDragLeave($event)"
          @drop.prevent="handleJobTabDrop($event, job.id)"
        >
          <span class="job-sel-icon">
            <Icon name="mdi:briefcase" size="20" />
          </span>
          <span class="job-info">
            <span class="job-sel-title">Job {{ job.id }}</span>
            <span class="job-sel-num-files">{{ job.files.length }} Items</span>
          </span>
          <div class="job-sel-options">
            <DropdownMenu
              button-style-class="trans-btn"
              :dropdown-data-name="'job-' + job.id + '-dropdown'"
              :last-icon-size="20"
              placement="bottom-start"
            >
              <template #default="{ close }">
                <CustomButton
                  button-style-class="trans-btn btn-lite"
                  :data-name="'move-job-left-' + job.id + '-btn'"
                  :disabled="index === 0"
                  first-icon-name="mdi:arrow-left"
                  :first-icon-size="20"
                  @mouseup="
                    () => {
                      reorderJob(index, 'left');
                      close();
                    }
                  "
                >
                  Move Left
                </CustomButton>
                <CustomButton
                  button-style-class="trans-btn btn-lite"
                  :data-name="'move-job-right-' + job.id + '-btn'"
                  :disabled="index === jobsList.length - 1"
                  first-icon-name="mdi:arrow-right"
                  :first-icon-size="20"
                  @mouseup="
                    () => {
                      reorderJob(index, 'right');
                      close();
                    }
                  "
                >
                  Move Right
                </CustomButton>
                <hr v-if="jobsList.length > 1" />
                <CustomButton
                  button-style-class="trans-btn btn-lite"
                  :data-name="'remove-job-' + job.id + '-btn'"
                  first-icon-name="mdi:trash"
                  :first-icon-size="20"
                  btn-theme="danger"
                  @mouseup="
                    () => {
                      close();
                      removeJob(job.id);
                    }
                  "
                >
                  Remove Job
                </CustomButton>
              </template>
            </DropdownMenu>
          </div>
          <DropdownMenu
            v-show="dragHoverTargetJobId === job.id"
            :ref="(el) => setDragActionMenuRef(job.id, el)"
            :hide-trigger="true"
            :dropdown-data-name="`drag-action-dropdown-${job.id}`"
            placement="bottom-end"
          >
            <template #default="{ close }">
              <CustomButton
                button-style-class="trans-btn btn-lite"
                data-name="drag-move-option"
                first-icon-name="mdi:arrow-right"
                :first-icon-size="20"
                @click="
                  () => {
                    handleDragAction('move', job.id);
                    close();
                  }
                "
              >
                Move Here
              </CustomButton>
              <CustomButton
                button-style-class="trans-btn btn-lite"
                data-name="drag-copy-option"
                first-icon-name="mdi:content-copy"
                :first-icon-size="20"
                @click="
                  () => {
                    handleDragAction('copy', job.id);
                    close();
                  }
                "
              >
                Copy Here
              </CustomButton>
            </template>
          </DropdownMenu>
        </CustomButton>
      </div>
    </OverlayScrollbarsComponent>

    <div class="job-selector-btn-wrapper">
      <div class="job-selector-btns-start">
        <CustomButton
          class="add-job-btn"
          :class="{ 'drop-target-hover': hoveredJobId === 'new-job' && dragDropStore.isInternalDragActive }"
          button-style-class="trans-btn"
          data-name="add-job-btn"
          first-icon-name="mdi:add"
          :first-icon-size="24"
          @click="addJob"
          @dragover.prevent="handleJobTabDragOver($event, 'new-job')"
          @dragleave="handleJobTabDragLeave($event)"
          @drop.prevent="handleJobTabDrop($event, 'new-job')"
        />
        <DropdownMenu
          v-show="dragHoverTargetJobId === 'new-job'"
          :ref="(el) => setDragActionMenuRef('new-job', el)"
          :hide-trigger="true"
          dropdown-data-name="drag-action-dropdown-new-job"
          placement="bottom-end"
        >
          <template #default="{ close }">
            <CustomButton
              button-style-class="trans-btn btn-lite"
              data-name="drag-move-to-new-job-option"
              first-icon-name="mdi:arrow-right"
              :first-icon-size="20"
              @click="
                () => {
                  handleDragAction('move', 'new-job');
                  close();
                }
              "
            >
              Move to New Job
            </CustomButton>
            <CustomButton
              button-style-class="trans-btn btn-lite"
              data-name="drag-copy-to-new-job-option"
              first-icon-name="mdi:content-copy"
              :first-icon-size="20"
              @click="
                () => {
                  handleDragAction('copy', 'new-job');
                  close();
                }
              "
            >
              Copy to New Job
            </CustomButton>
          </template>
        </DropdownMenu>
      </div>

      <div class="job-selector-btns-end">
        <DropdownMenu
          aria-label="Remove All Jobs"
          button-class="remove-all-jobs-btn"
          button-style-class="trans-btn"
          :dropdown-data-name="'extra-job-selector-options-dropdown'"
          :last-icon-size="24"
          placement="bottom-end"
        >
          <template #default="{ close }">
            <CustomButton
              button-style-class="trans-btn btn-lite"
              :data-name="'toggle-orientation-btn'"
              :first-icon-name="
                uiStore.jobSelectorOrientation === 'horizontal' ? 'mdi:view-day-outline' : 'mdi:view-week-outline'
              "
              :first-icon-size="20"
              @mouseup="
                () => {
                  uiStore.toggleJobSelectorOrientation();
                  close();
                }
              "
            >
              Switch to
              {{ uiStore.jobSelectorOrientation === "horizontal" ? "Vertical" : "Horizontal" }}
              Layout
            </CustomButton>
            <hr />
            <CustomButton
              button-style-class="trans-btn btn-lite"
              data-name="remova-all-jobs-btn"
              first-icon-name="mdi:trash"
              :first-icon-size="20"
              btn-theme="danger"
              @mouseup="
                () => {
                  close();
                  confirmRemoveAllJobs();
                }
              "
            >
              Remove All Jobs
            </CustomButton>
          </template>
        </DropdownMenu>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from "vue";
import { useJobsStore } from "@/stores/jobsStore";
import type { Job } from "@/stores/jobsStore";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useThemeStore } from "@/stores/themeStore";
import { useUiStore } from "@/stores/uiStore";
import { useModalsStore } from "@/stores/modalsStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import type { ModalOptions } from "@/types/modal";
import type { FileItem } from "@/types/types";
import { logInteraction, logDragDropEvent, logDropZoneEvent } from "@/utils/loggers";
import DropdownMenu from "@/components/DropdownMenu.vue";

const themeStore = useThemeStore();
const jobsStore = useJobsStore();
const uiStore = useUiStore();
const modalsStore = useModalsStore();
const dragDropStore = useDragDropStore();
const clipboardStore = useClipboardStore();

const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));
const jobsList = computed(() => jobsStore.jobs);

const draggedJobId = ref<number | null>(null);
const dragOverJobId = ref<number | null>(null);
const hoveredJobId = ref<number | "new-job" | null>(null);

const dragActionDropdownRefs = ref(new Map<number | "new-job", InstanceType<typeof DropdownMenu>>());
const dragHoverTargetJobId = ref<number | "new-job" | null>(null);

const pendingDropFilePaths = ref<string[]>([]);
const pendingDropSourceJobId = ref<number | null>(null);

const setDragActionMenuRef = (jobId: number | "new-job", el: Element | ComponentPublicInstance | null) => {
  if (el) {
    dragActionDropdownRefs.value.set(jobId, el as InstanceType<typeof DropdownMenu>);
  }
};

onMounted(() => {
  jobsStore.initialize();
});

watch(
  () => jobsStore.jobs,
  (newJobs: Job[]) => {
    if (!jobsStore.selectedJobId || !newJobs.some((job) => job.id === jobsStore.selectedJobId)) {
      if (newJobs.length > 0 && newJobs[0]) {
        jobsStore.selectJob(newJobs[0].id);
      }
    }
  },
  { immediate: true, deep: true }
);

watch(draggedJobId, (currentValue, oldValue) => {
  if (currentValue !== null && oldValue === null) {
    document.body.classList.add("is-job-reordering");
    logDragDropEvent("JobSelectorArea", `Body class 'is-job-reordering' added. draggedJobId: ${currentValue}`);
  } else if (currentValue === null && oldValue !== null) {
    document.body.classList.remove("is-job-reordering");
    logDragDropEvent("JobSelectorArea", `Body class 'is-job-reordering' removed. draggedJobId: ${currentValue}`);
  }
});

watch(
  () => dragDropStore.isExternalDragOver,
  (isExternalDragActive) => {
    if (isExternalDragActive) {
      document.body.classList.add("is-external-drag-over");
      logDragDropEvent("JobSelectorArea", `Body class 'is-external-drag-over' added.`);
    } else {
      document.body.classList.remove("is-external-drag-over");
      logDragDropEvent("JobSelectorArea", `Body class 'is-external-drag-over' removed.`);
    }
  }
);

const selectJob = (jobId: number): void => {
  if (draggedJobId.value !== null) {
    logInteraction("JobSelectorArea", `Select job aborted: Dragging job ID ${draggedJobId.value}.`);
    return;
  }
  if (dragDropStore.isInternalDragActive) {
    logInteraction("JobSelectorArea", `Select job aborted: Internal file drag active.`);
    return;
  }

  jobsStore.selectJob(jobId);
  logInteraction("JobSelectorArea", `Job ${jobId} selected.`);
};

const addJob = (): void => {
  const newJobId = jobsStore.addJob();
  jobsStore.selectJob(newJobId);
  logInteraction("JobSelectorArea", `New job (ID: ${newJobId}) added and selected.`);
};

const removeJob = (jobId: number): void => {
  const modalOptions: ModalOptions = {
    icon: "mdi:alert-outline",
    title: "Confirm Remove Job",
    description: [`Are you sure you want to permanently remove <strong>Job ${jobId}</strong>?`],
    buttons: [
      { action: "proceed", text: "Remove Job", theme: "danger", styleClass: "bordered-btn", icon: "mdi:trash-can-outline" },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
  };

  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, { description: modalOptions.description }, (action) => {
    if (action === "proceed") {
      const currentSelectedJobId = jobsStore.selectedJobId;
      jobsStore.removeJobs([jobId], currentSelectedJobId);
      nextTick();
      logInteraction("JobSelectorArea", `Job ${jobId} removal confirmed.`);
    } else {
      logInteraction("JobSelectorArea", `Job ${jobId} removal cancelled.`);
    }
  });
};

const confirmRemoveAllJobs = (): void => {
  const modalOptions: ModalOptions = {
    icon: "mdi:alert-outline",
    title: "Confirm Remove All Jobs",
    description: ["Are you sure you want to remove <strong>all jobs</strong>? This action cannot be undone."],
    buttons: [
      { action: "proceed", text: "Remove All", theme: "danger", styleClass: "bordered-btn", icon: "mdi:trash-can-outline" },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
  };

  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, { description: modalOptions.description }, (action) => {
    if (action === "proceed") {
      jobsStore.removeAllJobs();
      nextTick();
      logInteraction("JobSelectorArea", `All jobs removal confirmed.`);
    } else {
      logInteraction("JobSelectorArea", `All jobs removal cancelled.`);
    }
  });
};

const onDragStart = (event: DragEvent, jobId: number): void => {
  if (dragDropStore.isInternalDragActive) {
    logDragDropEvent("JobSelectorArea", `Job drag start prevented: Internal file drag active.`);
    event.preventDefault();
    return;
  }
  logDragDropEvent("JobSelectorArea", `Job drag start for job ID: ${jobId}`);

  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", String(jobId));
    event.dataTransfer.effectAllowed = "move";
  }

  draggedJobId.value = jobId;
};

const handleDragOver = (event: DragEvent): void => {
  if (dragDropStore.isInternalDragActive) {
    const target = (event.target as HTMLElement).closest(".job-selector, .add-job-btn");
    if (target instanceof HTMLElement) {
      const targetIdentifier = target.dataset.jobId ? Number(target.dataset.jobId) : "new-job";
      handleJobTabDragOver(event, targetIdentifier);
    } else {
      handleJobTabDragLeave(event);
    }
    return;
  }

  const target = (event.target as HTMLElement).closest(".job-selector");

  if (target instanceof HTMLElement && target.dataset.jobId) {
    const targetId = Number(target.dataset.jobId);
    if (targetId !== draggedJobId.value) {
      if (dragOverJobId.value !== targetId) {
        dragOverJobId.value = targetId;
        logDragDropEvent("JobSelectorArea", `Job drag over target: ${targetId}`);
      }
    }
  } else {
    if (dragOverJobId.value !== null) {
      logDragDropEvent("JobSelectorArea", `Job drag left all job targets.`);
      dragOverJobId.value = null;
    }
  }
};

const handleDragLeave = (event: DragEvent): void => {
  if (dragDropStore.isInternalDragActive) {
    handleJobTabDragLeave(event);
    return;
  }
  dragOverJobId.value = null;
};

const onDrop = (targetJobId: number | null): void => {
  if (dragDropStore.isInternalDragActive) {
    logDragDropEvent("JobSelectorArea", "File drag drop occurred outside specific tab. Ending drag.");
    dragDropStore.endInternalDrag();
    hoveredJobId.value = null;
    return;
  }

  const fromIndex = jobsStore.jobs.findIndex((j) => j.id === draggedJobId.value);
  const toIndex = targetJobId === null ? jobsStore.jobs.length - 1 : jobsStore.jobs.findIndex((j) => j.id === targetJobId);

  if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
    jobsStore.moveJob(fromIndex, toIndex);
    logInteraction("JobSelectorArea", `Job ${draggedJobId.value} moved from index ${fromIndex} to ${toIndex}.`);
  }

  draggedJobId.value = null;
  dragOverJobId.value = null;
};

const onDragEnd = (): void => {
  logDragDropEvent("JobSelectorArea", `Job drag end.`);
  draggedJobId.value = null;
  dragOverJobId.value = null;
  if (dragDropStore.isInternalDragActive) {
    dragDropStore.endInternalDrag();
  }
};

const handleJobTabDragOver = (event: DragEvent, targetIdentifier: number | "new-job") => {
  if (dragDropStore.isInternalDragActive) {
    event.preventDefault();
    if (event.dataTransfer) {
      // If dragging over the source job, indicate that it's not a valid drop target.
      if (targetIdentifier === dragDropStore.internalDragSourceJobId) {
        event.dataTransfer.dropEffect = "none";
      } else {
        event.dataTransfer.dropEffect = "copy";
      }
    }
    // Only log and update state if the hovered job ID has changed
    if (hoveredJobId.value !== targetIdentifier) {
      logDropZoneEvent("JobSelectorArea", `dragover: target changed from ${hoveredJobId.value} to ${targetIdentifier}`, {
        eventTarget: event.target,
      });
      hoveredJobId.value = targetIdentifier;
      dragHoverTargetJobId.value = targetIdentifier;
    }
  }
};

const handleJobTabDragLeave = (event: DragEvent) => {
  if (dragDropStore.isInternalDragActive) {
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement | null;

    // A leave event is valid if the mouse is moving to an element that is not a child of the current target.
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      logDropZoneEvent("JobSelectorArea", `dragleave: Left job tab: ${hoveredJobId.value}. Related target:`, {
        relatedTarget: relatedTarget,
      });
      hoveredJobId.value = null;
      dragHoverTargetJobId.value = null;
    }
  }
};

const handleJobTabDrop = (event: DragEvent, targetIdentifier: number | "new-job") => {
  event.preventDefault();
  event.stopPropagation();

  // Prevent dropping onto the source job itself
  if (targetIdentifier === dragDropStore.internalDragSourceJobId) {
    logDragDropEvent("JobSelectorArea", `File drop prevented on source tab: ${targetIdentifier}.`);
    dragDropStore.endInternalDrag();
    return;
  }

  logDragDropEvent("JobSelectorArea", `File drop detected on tab: ${targetIdentifier}.`);

  pendingDropFilePaths.value = [...dragDropStore.internalDraggedFiles];
  pendingDropSourceJobId.value = dragDropStore.internalDragSourceJobId;

  hoveredJobId.value = null;

  nextTick(() => {
    const dropdown = dragActionDropdownRefs.value.get(targetIdentifier);
    if (dropdown) {
      dropdown.openDropdown({ x: event.clientX, y: event.clientY });
      logInteraction(
        "JobSelectorArea",
        `Opened dropdown on drop for target: ${targetIdentifier} at coords (${event.clientX}, ${event.clientY}).`
      );
    } else {
      logInteraction("JobSelectorArea", `Dropdown ref not found for target ${targetIdentifier} after drop.`);
      dragDropStore.endInternalDrag();
    }
  });
};

const handleDragAction = (operation: "move" | "copy", targetIdentifier: number | "new-job") => {
  const droppedFilePaths = pendingDropFilePaths.value;
  const sourceJobId = pendingDropSourceJobId.value;

  logInteraction(
    "JobSelectorArea",
    `handleDragAction called: Operation=${operation}, Target=${targetIdentifier}, Files=${droppedFilePaths.length}, SourceJob=${sourceJobId}`
  );

  if (!sourceJobId || droppedFilePaths.length === 0) {
    logInteraction("JobSelectorArea", "Drag action: Missing drag data in local state. Aborting.");
    dragDropStore.endInternalDrag();
    return;
  }

  const sourceJob = jobsStore.jobs.find((j) => j.id === sourceJobId);
  if (!sourceJob) {
    logInteraction("JobSelectorArea", `Drag action: Source job ${sourceJobId} not found. Aborting.`);
    dragDropStore.endInternalDrag();
    return;
  }

  const filesToConfirm: FileItem[] = sourceJob.files.filter((f) => droppedFilePaths.includes(f.path));
  const fileNames: string[] = filesToConfirm.map((f) => f.name);

  const onModalClose = (confirmed: boolean) => {
    if (confirmed) {
      if (targetIdentifier === "new-job") {
        const newJobId = jobsStore.addJob();
        if (operation === "move") {
          jobsStore.moveFilesBetweenJobs(sourceJobId, newJobId, droppedFilePaths);
        } else {
          jobsStore.copyFilesToJob(sourceJobId, newJobId, droppedFilePaths);
        }
        jobsStore.selectJob(newJobId);
      } else {
        const targetJobId = targetIdentifier as number;
        if (sourceJobId !== targetJobId) {
          if (operation === "move") {
            jobsStore.moveFilesBetweenJobs(sourceJobId, targetJobId, droppedFilePaths);
          } else {
            jobsStore.copyFilesToJob(sourceJobId, targetJobId, droppedFilePaths);
          }
        }
      }
      if (operation === "move" && clipboardStore.isCut && clipboardStore.sourceJobId === sourceJobId) {
        clipboardStore.clear();
      }
    }
    logInteraction("JobSelectorArea", `File drag: ${operation} ${confirmed ? "confirmed" : "cancelled"}.`);
    dragDropStore.endInternalDrag();
    pendingDropFilePaths.value = [];
    pendingDropSourceJobId.value = null;
  };

  const isMoveToSameJob = operation === "move" && targetIdentifier !== "new-job" && sourceJobId === targetIdentifier;

  if (isMoveToSameJob) {
    logInteraction("JobSelectorArea", "File drag: Move to same job. No action needed.");
    dragDropStore.endInternalDrag();
    return;
  }

  const title = operation === "move" ? "Confirm Move Items" : "Confirm Copy Items";
  const targetName = targetIdentifier === "new-job" ? "a new job" : `Job ${targetIdentifier}`;
  const description = `Are you sure you want to ${operation} ${fileNames.length} item(s) to <strong>${targetName}</strong>?`;

  const modalOptions: ModalOptions = {
    icon: operation === "move" ? "mdi:arrow-right" : "mdi:content-copy",
    title,
    description: [description],
    buttons: [
      {
        action: "proceed",
        text: operation === "move" ? "Move Items" : "Copy Items",
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
    { description: modalOptions.description, fileList: fileNames },
    (action: string) => onModalClose(action === "proceed")
  );
};

const reorderJob = (index: number, direction: "left" | "right"): void => {
  const fromIndex = index;
  const toIndex = direction === "left" ? index - 1 : index + 1;
  jobsStore.moveJob(fromIndex, toIndex);
  logInteraction("JobSelectorArea", `Job reordered: From index ${fromIndex} to ${toIndex}.`);
};
</script>

<style>
/* Global override to fix outline transition */
.job-selector > .visual-style,
.add-job-btn > .visual-style {
  outline: 2px solid transparent;
  outline-offset: 2px;
}
</style>

<style scoped>
.job-selector-area {
  display: grid;
  grid-column: 1;
  grid-row: 1;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr;
  padding-inline: var(--pad-in);
}

.job-selector-area.internal-drag-active {
  cursor: not-allowed;
}

.job-selector-area.internal-drag-active :deep(.job-selector),
.job-selector-area.internal-drag-active :deep(.add-job-btn) {
  cursor: pointer;
}

.job-selector-area.internal-drag-active :deep(.job-selector.active.drop-target-hover) {
  cursor: not-allowed;
}

.job-selector-area.internal-drag-active :deep(button.job-selector *) {
  pointer-events: none;
}

:deep(body.is-external-drag-over .os-viewport) {
  pointer-events: none;
}

.job-selector-area:has(.job-selector-btn-wrapper:empty) {
  grid-template-columns: auto auto;
}

.job-selector-area:has(.job-selector-btn-wrapper:empty) {
  grid-template-columns: 1fr;
}

.job-selector-btn-wrapper {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.job-selector-btn-wrapper .job-selector-btns-start {
  display: flex;
}

.job-selector-btn-wrapper .job-selector-btns-end {
  display: flex;
}

.job-selector-btn-wrapper:empty {
  display: none;
}

.add-job-btn {
  --btn-pad-blok: 0;
  --btn-pad-in: 0;
}

.remove-all-jobs-btn {
  --btn-pad-blok: 0;
  --btn-pad-in: 0;
}

.job-selector-list {
  align-items: center;
  display: inline-flex;
  overflow-x: hidden;
  overflow-y: auto;
}

.job-selector-list > :deep(button.job-selector) {
  --btn-line-thickness: 2px;
  --line-orientation: horizontal;
  --line-position: end;
  border-radius: var(--brdr-rad-smalr);
  min-height: 50px;
  min-width: fit-content;
  padding: 0;
  position: relative;
  transition: opacity 0.2s ease-in-out;
}

.job-selector-list > :deep(button.job-selector.is-dragged) {
  opacity: 0.4;
}

/* --- Drag & Drop Hover Styles --- */

/* 1. Default state for all valid drop targets when a drag is active */
.job-selector-area.internal-drag-active :deep(.job-selector-list button.job-selector:not(.active) > .visual-style),
.job-selector-area.internal-drag-active :deep(.add-job-btn .visual-style) {
  opacity: 1 !important; /* Override default transparency for non-active/trans-btns */
  outline-color: hsla(0, 0%, 70%, 0.7);
  box-shadow: none;
  transition: all 0.2s ease-in-out;
}

/* 2. Highlight the specific target being hovered over */
.job-selector-area.internal-drag-active
  :deep(.job-selector-list button.job-selector.drop-target-hover:not(.active) > .visual-style),
.job-selector-area.internal-drag-active :deep(.add-job-btn.drop-target-hover .visual-style) {
  outline-color: hsla(204, 100%, 70%, 0.7); /* Blue outline */
  box-shadow: 0 0 12px 3px hsla(204, 100%, 70%, 0.4); /* Blue glow */
}

/* 3. Style for the source job (active tab), indicating it's not a valid drop target */
.job-selector-area.internal-drag-active :deep(.job-selector-list button.job-selector.active.drop-target-hover > .visual-style) {
  opacity: 1 !important;
  outline-color: transparent; /* Effectively hsla(..., 0) */
  box-shadow: none; /* No glow */
}

/*
 * FIX for flickering:
 * When dragging over the button, make all of its children (icons, text)
 * ignore pointer events. This ensures that the 'dragover' event is
 * consistently registered on the button itself, not its children,
 * preventing the 'drop-target-hover' class from toggling rapidly.
*/
.job-selector-list > :deep(button.job-selector.drop-target-hover *) {
  pointer-events: none;
}

.job-selector-list > :deep(button.job-selector.drag-over::after) {
  background-color: hsla(var(--accent-hsl), 0.75);
  block-size: 100%;
  content: "";
  inset-inline-start: -2px;
  inline-size: 4px;
  position: absolute;
  z-index: 1;
}

.job-selector-list > :deep(button.job-selector > .visual-style),
.job-selector-list > :deep(button.job-selector:before) {
  --visual-style-inset: 8px;
}

.job-selector-list > :deep(button.job-selector > .visual-style) {
  transform-origin: bottom;
}

.job-selector-list > :deep(button.job-selector.active > .visual-style) {
  background-color: var(--btn-bg-hvr-clr);
  border-color: var(--btn-bg-hvr-clr);
}

.job-selector-list > :deep(button.job-selector:hover > .button-content .job-sel-options .dropdown-menu > button.options-btn),
.job-selector-list > :deep(button.job-selector > .button-content .job-sel-options .dropdown-menu.active > button.options-btn) {
  opacity: 1;
}

.job-selector-list > :deep(button.job-selector > .button-content) {
  column-gap: 8px;
  display: grid;
  grid-row: 1;
  grid-template-areas: "job-sel-icon job-sel-info job-sel-options";
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto;
  padding-inline-end: var(--pad-in);
  padding-inline-start: calc(var(--pad-in) * 1.5);
}

.job-selector-list > :deep(button.job-selector > .button-content .job-sel-icon) {
  align-items: center;
  display: flex;
  grid-area: job-sel-icon;
  justify-content: center;
  width: 24px;
}

.job-selector-list > :deep(button.job-selector > .button-content .job-info) {
  align-items: start;
  display: flex;
  flex-direction: column;
  grid-area: job-sel-info;
  justify-content: center;
  white-space: nowrap;
}

.job-selector-list > :deep(button.job-selector > .button-content .job-info .job-sel-title) {
  line-height: 1;
  white-space: nowrap;
}

.job-selector-list > :deep(button.job-selector > .button-content .job-info .job-sel-num-files) {
  font-size: 0.8rem;
  line-height: 1;
  white-space: nowrap;
}

.job-selector-list > :deep(button.job-selector > .button-content .job-sel-options) {
  align-items: center;
  grid-area: job-sel-options;
  justify-content: center;
  line-height: 0;
  padding: 0;
  white-space: nowrap;
}

.job-selector-list > :deep(button.job-selector > .button-content .job-sel-options .dropdown-menu > button.options-btn) {
  opacity: 0;
}

.job-selector-list > :deep(button.job-selector > .button-content .job-sel-options .dropdown-menu .custom-button .visual-style) {
  --btn-bg-hvr-clr: var(--btn-bg-hvr-clr-liter);
}
</style>
