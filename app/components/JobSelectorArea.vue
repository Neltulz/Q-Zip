<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/JobSelectorArea.vue @preserve -->

<template>
  <nav
    class="job-selector-area"
    :class="{ 'internal-drag-active': dragDropStore.isInternalDragActive }"
    data-component-name="JobSelectorArea"
  >
    <OverlayScrollbarsComponent
      ref="scrollComponentRef"
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
          :ref="(el) => setJobButtonRef(job.id, el)"
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
              <hr />
              <CustomButton
                button-style-class="trans-btn btn-lite"
                data-name="drag-cancel-option"
                first-icon-name="mdi:cancel"
                :first-icon-size="20"
                @click="
                  () => {
                    dragDropStore.endInternalDrag();
                    close();
                  }
                "
              >
                Cancel
              </CustomButton>
            </template>
          </DropdownMenu>
        </CustomButton>
      </div>
    </OverlayScrollbarsComponent>

    <div class="job-selector-btn-wrapper">
      <div class="job-selector-btns-start">
        <CustomButton
          :ref="(el) => setJobButtonRef('new-job', el)"
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
            <hr />
            <CustomButton
              button-style-class="trans-btn btn-lite"
              data-name="drag-cancel-new-job-option"
              first-icon-name="mdi:cancel"
              :first-icon-size="20"
              @click="
                () => {
                  dragDropStore.endInternalDrag();
                  close();
                }
              "
            >
              Cancel
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type ComponentPublicInstance, onBeforeUpdate } from "vue";
import { useJobsStore } from "@/stores/jobsStore";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import type { OverlayScrollbars } from "overlayscrollbars";
import { useThemeStore } from "@/stores/themeStore";
import { useUiStore } from "@/stores/uiStore";
import { useModalsStore } from "@/stores/modalsStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import type { ModalOptions } from "@/types/modal";
import type { FileItem } from "@/types/types";
import { logInteraction, logDragDropEvent, logDropZoneEvent, logNotification, logTrace } from "@/utils/loggers";
import DropdownMenu from "@/components/DropdownMenu.vue";
import CustomButton from "./CustomButton.vue";
import { useScrollContainer } from "@/composables/useScrollContainer";

// --- FIX START ---
// Define a local interface that extends the base type with the missing `scroll` method.
interface ScrollableOverlayScrollbars extends OverlayScrollbars {
  scroll: (destination: { x?: string | number; y?: string | number }, duration?: number) => void;
}
// --- FIX END ---

const { setScrollContainer } = useScrollContainer();

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

const scrollComponentRef = ref<InstanceType<typeof OverlayScrollbarsComponent> | null>(null);

const jobButtonRefs = ref(new Map<number | "new-job", InstanceType<typeof CustomButton>>());
const dragActionDropdownRefs = ref(new Map<number | "new-job", InstanceType<typeof DropdownMenu>>());
const dragHoverTargetJobId = ref<number | "new-job" | null>(null);

const pendingDropFilePaths = ref<string[]>([]);
const pendingDropSourceJobId = ref<number | null>(null);

watch(
  scrollComponentRef,
  (newRef) => {
    if (newRef) {
      const osInstance = newRef.osInstance();
      if (osInstance) {
        const viewport = osInstance.elements().viewport;
        setScrollContainer(viewport);
        logNotification("JobSelectorArea", "Scroll container SET via provide/inject.", viewport);
      }
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  setScrollContainer(null);
  logNotification("JobSelectorArea", "Component unmounted. Cleared shared scroll container.");
});

const setJobButtonRef = (jobId: number | "new-job", el: Element | ComponentPublicInstance | null) => {
  if (el) {
    jobButtonRefs.value.set(jobId, el as InstanceType<typeof CustomButton>);
  }
};

const setDragActionMenuRef = (jobId: number | "new-job", el: Element | ComponentPublicInstance | null) => {
  if (el) {
    dragActionDropdownRefs.value.set(jobId, el as InstanceType<typeof DropdownMenu>);
  }
};

onBeforeUpdate(() => {
  jobButtonRefs.value.clear();
  dragActionDropdownRefs.value.clear();
});

onMounted(() => {
  jobsStore.initialize();
});

watch(
  jobsList,
  (newJobs, oldJobs) => {
    if (newJobs.length > oldJobs.length) {
      nextTick(() => {
        const scrollInstance = scrollComponentRef.value?.osInstance();
        // --- FIX: Cast to our local type to safely call the .scroll() method ---
        if (scrollInstance) {
          logInteraction("JobSelectorArea", "New job added, scrolling to the end.");
          (scrollInstance as ScrollableOverlayScrollbars).scroll({ x: "max" }, 300);
        }
      });
    }
  },
  { deep: true }
);

watch(
  () => jobsStore.selectedJobId,
  (newId, oldId) => {
    if (newId !== oldId && newId !== null) {
      nextTick(() => {
        const buttonRef = jobButtonRefs.value.get(newId);
        const buttonEl = buttonRef?.buttonRef;
        if (buttonEl) {
          buttonEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
      });
    }
  }
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
      if (targetIdentifier === dragDropStore.internalDragSourceJobId) {
        event.dataTransfer.dropEffect = "none";
      } else {
        event.dataTransfer.dropEffect = "copy";
      }
    }
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
  logTrace("JobSelectorArea", `handleJobTabDrop: Drop detected on target: ${targetIdentifier}`);
  event.preventDefault();
  event.stopPropagation();

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
  logTrace("JobSelectorArea", `handleDragAction: User chose '${operation}' for target: ${targetIdentifier}`);
  const droppedFilePaths = pendingDropFilePaths.value;
  const sourceJobId = pendingDropSourceJobId.value;
  const itemCount = droppedFilePaths.length;

  logInteraction(
    "JobSelectorArea",
    `handleDragAction called: Operation=${operation}, Target=${targetIdentifier}, Files=${itemCount}, SourceJob=${sourceJobId}`
  );

  if (!sourceJobId || itemCount === 0) {
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
      logTrace("JobSelectorArea", `Modal confirmed for '${operation}' action.`);
      let finalTargetId: number;
      if (targetIdentifier === "new-job") {
        const newJobId = jobsStore.addJob();
        finalTargetId = newJobId;
        if (operation === "move") {
          jobsStore.moveFilesBetweenJobs(sourceJobId, newJobId, droppedFilePaths);
        } else {
          jobsStore.copyFilesToJob(sourceJobId, newJobId, droppedFilePaths);
        }
        jobsStore.selectJob(newJobId);
      } else {
        const targetJobId = targetIdentifier as number;
        finalTargetId = targetJobId;
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

      nextTick(() => {
        const logData: Record<string, unknown> = {};
        logTrace("JobSelectorArea", `nextTick: Preparing to add notification for target ${finalTargetId}`);
        const targetButtonRef = jobButtonRefs.value.get(finalTargetId);

        const buttonEl = targetButtonRef?.buttonRef;
        const visualStyleEl = buttonEl?.querySelector(".visual-style");
        const rect = visualStyleEl?.getBoundingClientRect();

        logData.buttonRef = buttonEl;
        logData.visualStyleEl = visualStyleEl;
        logData.rect = rect ? JSON.parse(JSON.stringify(rect)) : null;

        if (rect) {
          const opPastTense = operation === "move" ? "moved" : "copied";
          logNotification("JobSelectorArea", `Adding notification for target ${finalTargetId}`, logData);
          uiStore.addNotification({
            message: `${itemCount} item${itemCount > 1 ? "s" : ""} successfully ${opPastTense}.`,
            type: "success",
            targetId: finalTargetId,
            position: { top: rect.top, left: rect.left, width: rect.width },
          });
        } else {
          logNotification("JobSelectorArea", `Could not find rect for target ${finalTargetId} to create notification.`, logData);
        }
      });
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

<style scoped src="./job-selector-area-comp/job-selector-area.scoped.css"></style>
