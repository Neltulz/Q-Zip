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
            [`has-notification-${jobNotificationStates.get(job.id)}`]: jobNotificationStates.has(job.id),
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
                shortcut-text="Esc"
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
          :class="{
            'drop-target-hover': hoveredJobId === 'new-job' && dragDropStore.isInternalDragActive,
            [`has-notification-${jobNotificationStates.get('new-job')}`]: jobNotificationStates.has('new-job'),
          }"
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
              shortcut-text="Esc"
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
import { useUiStore, type NotificationType, type NotificationMessage } from "@/stores/uiStore";
import { useModalsStore } from "@/stores/modalsStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { useClipboardStore } from "@/stores/clipboardStore";
import type { ModalOptions } from "@/types/modal";
import DropdownMenu from "@/components/DropdownMenu.vue";
import CustomButton from "./CustomButton.vue";
import { useScrollContainer } from "@/composables/useScrollContainer";

interface ScrollableOverlayScrollbars extends OverlayScrollbars {
  scroll: (destination: { x?: string | number; y?: string | number }, duration?: number) => void;
}

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

const jobNotificationStates = ref<Map<number | "new-job", NotificationType>>(new Map());

watch(
  () => uiStore.notifications,
  (notifications, oldNotifications) => {
    const newNotifications = notifications.filter((n) => !oldNotifications.some((on) => on.id === n.id));

    newNotifications.forEach((notification) => {
      if (notification.targetId) {
        jobNotificationStates.value.set(notification.targetId, notification.glowType);
        setTimeout(() => {
          jobNotificationStates.value.delete(notification.targetId);
        }, notification.duration);
      }
    });
  },
  { deep: true }
);

watch(
  () => uiStore.pendingNotification,
  (notification) => {
    if (notification) {
      const { targetId } = notification;
      nextTick(() => {
        const buttonRef = jobButtonRefs.value.get(targetId);
        const buttonEl = buttonRef?.buttonRef;
        if (buttonEl) {
          buttonEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

          const visualStyleEl = buttonEl.querySelector(".visual-style");
          const rect = visualStyleEl?.getBoundingClientRect();
          const scrollEl = scrollComponentRef.value?.osInstance()?.elements().viewport;

          if (rect && scrollEl) {
            const scrollContainerRect = scrollEl.getBoundingClientRect();
            const position = {
              top: rect.top - scrollContainerRect.top + scrollEl.scrollTop,
              left: rect.left - scrollContainerRect.left + scrollEl.scrollLeft,
              width: rect.width,
            };
            uiStore.addNotification({ ...notification, position });
          } else {
            uiStore.addNotification(notification);
          }
        } else {
          uiStore.addNotification(notification);
        }
        uiStore.clearPendingNotification();
      });
    }
  },
  { deep: true }
);

watch(
  scrollComponentRef,
  (newRef) => {
    if (newRef) {
      const osInstance = newRef.osInstance();
      if (osInstance) {
        const viewport = osInstance.elements().viewport;
        setScrollContainer(viewport);
      }
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  setScrollContainer(null);
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
        if (scrollInstance) {
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
  } else if (currentValue === null && oldValue !== null) {
    document.body.classList.remove("is-job-reordering");
  }
});

watch(
  () => dragDropStore.isExternalDragOver,
  (isExternalDragActive) => {
    if (isExternalDragActive) {
      document.body.classList.add("is-external-drag-over");
    } else {
      document.body.classList.remove("is-external-drag-over");
    }
  }
);

const selectJob = (jobId: number): void => {
  if (draggedJobId.value !== null || dragDropStore.isInternalDragActive) return;
  jobsStore.selectJob(jobId);
};

const addJob = (): void => {
  const newJobId = jobsStore.addJob();
  jobsStore.selectJob(newJobId);
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
  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, {}, (action) => {
    if (action === "proceed") {
      jobsStore.removeJobs([jobId], jobsStore.selectedJobId);
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
  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, {}, (action) => {
    if (action === "proceed") {
      jobsStore.removeAllJobs();
    }
  });
};

const onDragStart = (event: DragEvent, jobId: number): void => {
  if (dragDropStore.isInternalDragActive) {
    event.preventDefault();
    return;
  }
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
    if (targetId !== draggedJobId.value) dragOverJobId.value = targetId;
  } else {
    dragOverJobId.value = null;
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
    dragDropStore.endInternalDrag();
    hoveredJobId.value = null;
    return;
  }
  const fromIndex = jobsStore.jobs.findIndex((j) => j.id === draggedJobId.value);
  const toIndex = targetJobId === null ? jobsStore.jobs.length - 1 : jobsStore.jobs.findIndex((j) => j.id === targetJobId);
  if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
    jobsStore.moveJob(fromIndex, toIndex);
  }
  draggedJobId.value = null;
  dragOverJobId.value = null;
};

const onDragEnd = (): void => {
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
      event.dataTransfer.dropEffect = targetIdentifier === dragDropStore.internalDragSourceJobId ? "none" : "copy";
    }
    if (hoveredJobId.value !== targetIdentifier) {
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
      hoveredJobId.value = null;
      dragHoverTargetJobId.value = null;
    }
  }
};

const handleJobTabDrop = (event: DragEvent, targetIdentifier: number | "new-job") => {
  event.preventDefault();
  event.stopPropagation();
  if (targetIdentifier === dragDropStore.internalDragSourceJobId) {
    dragDropStore.endInternalDrag();
    return;
  }
  pendingDropFilePaths.value = [...dragDropStore.internalDraggedFiles];
  pendingDropSourceJobId.value = dragDropStore.internalDragSourceJobId;
  hoveredJobId.value = null;
  nextTick(() => {
    const dropdown = dragActionDropdownRefs.value.get(targetIdentifier);
    if (dropdown) {
      dropdown.openDropdown({ x: event.clientX, y: event.clientY });
    } else {
      dragDropStore.endInternalDrag();
    }
  });
};

const handleDragAction = (operation: "move" | "copy", targetIdentifier: number | "new-job") => {
  const droppedFilePaths = pendingDropFilePaths.value;
  const sourceJobId = pendingDropSourceJobId.value;

  if (!sourceJobId || droppedFilePaths.length === 0) {
    dragDropStore.endInternalDrag();
    return;
  }

  const sourceJob = jobsStore.jobs.find((j) => j.id === sourceJobId);
  if (!sourceJob) {
    dragDropStore.endInternalDrag();
    return;
  }

  const onModalClose = (confirmed: boolean) => {
    if (confirmed) {
      let numericTargetId: number;
      const isNewJob = targetIdentifier === "new-job";
      if (isNewJob) {
        numericTargetId = jobsStore.addJob();
      } else {
        numericTargetId = targetIdentifier;
      }

      const targetJob = jobsStore.jobs.find((j) => j.id === numericTargetId);
      if (!targetJob) {
        dragDropStore.endInternalDrag();
        return;
      }

      const targetFilePaths = new Set(targetJob.files.map((f) => f.path));
      const newFilePaths = droppedFilePaths.filter((path) => !targetFilePaths.has(path));
      const skippedFilePaths = droppedFilePaths.filter((path) => targetFilePaths.has(path));
      const opPastTense = operation === "move" ? "moved" : "copied";

      const messages: NotificationMessage[] = [];
      let glowType: NotificationType = "info";
      let operationFailed = false;
      let operationSucceeded = false;

      if (newFilePaths.length > 0) {
        try {
          if (operation === "move") {
            jobsStore.moveFilesBetweenJobs(sourceJobId, numericTargetId, newFilePaths);
          } else {
            jobsStore.copyFilesToJob(sourceJobId, numericTargetId, newFilePaths);
          }
          operationSucceeded = true;
          messages.push({
            text: `${newFilePaths.length} item${newFilePaths.length > 1 ? "s" : ""} successfully ${opPastTense}.`,
            type: "success",
            details: { sourceJobId, destinationJobId: numericTargetId, filePaths: newFilePaths },
          });
          if (operation === "move" && clipboardStore.isCut && clipboardStore.sourceJobId === sourceJobId) {
            clipboardStore.clear();
          }
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
              reasons: Object.fromEntries(newFilePaths.map((path) => [path, "Operation failed. See console."])),
            },
          });
        }
      }

      if (skippedFilePaths.length > 0) {
        messages.push({
          text: `${skippedFilePaths.length} item${skippedFilePaths.length > 1 ? "s" : ""} were skipped.`,
          type: "warning",
          details: {
            sourceJobId,
            destinationJobId: numericTargetId,
            filePaths: skippedFilePaths,
            reasons: Object.fromEntries(skippedFilePaths.map((path) => [path, "Already exists in destination"])),
          },
        });
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

      if (operationSucceeded || (targetIdentifier !== "new-job" && skippedFilePaths.length > 0)) {
        jobsStore.selectJob(numericTargetId);
      }
    }
    dragDropStore.endInternalDrag();
    pendingDropFilePaths.value = [];
    pendingDropSourceJobId.value = null;
  };

  const isMoveToSameJob = operation === "move" && targetIdentifier !== "new-job" && sourceJobId === targetIdentifier;
  if (isMoveToSameJob) {
    dragDropStore.endInternalDrag();
    return;
  }

  const targetJob = jobsStore.jobs.find((j) => j.id === targetIdentifier);
  const itemsToProcess = [];
  const itemsToSkip = [];

  if (targetJob) {
    const targetFilePaths = new Set(targetJob.files.map((f) => f.path));
    for (const path of droppedFilePaths) {
      if (targetFilePaths.has(path)) {
        itemsToSkip.push(path);
      } else {
        itemsToProcess.push(path);
      }
    }
  } else {
    itemsToProcess.push(...droppedFilePaths);
  }

  if (itemsToProcess.length === 0 && itemsToSkip.length > 0) {
    onModalClose(true); // Treat as confirmed, but only skipped items will be processed
    return;
  }

  const opString = operation.charAt(0).toUpperCase() + operation.slice(1);
  const targetName = targetIdentifier === "new-job" ? "a new job" : `Job ${targetIdentifier}`;
  const modalOptions: ModalOptions = {
    icon: operation === "move" ? "mdi:arrow-right" : "mdi:content-copy",
    title: `Confirm ${opString} Items`,
    description: [`Are you sure you want to ${operation} the following item(s) to <strong>${targetName}</strong>?`],
    buttons: [
      { action: "proceed", text: `${opString} Items`, theme: "primary" },
      { action: "cancel", text: "Cancel" },
    ],
    footerJustifyContent: "center",
  };
  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, { itemsToProcess, itemsToSkip }, (action) =>
    onModalClose(action === "proceed")
  );
};

const reorderJob = (index: number, direction: "left" | "right"): void => {
  const fromIndex = index;
  const toIndex = direction === "left" ? index - 1 : index + 1;
  jobsStore.moveJob(fromIndex, toIndex);
};
</script>

<style scoped>
@import "./job-selector-area-comp/job-selector-area.scoped.css";

.job-selector .visual-style,
.add-job-btn .visual-style {
  transition: box-shadow 0.3s ease-in-out, outline-color 0.3s ease-in-out;
}

@keyframes success-glow {
  from {
    outline-color: hsla(var(--success-hue, 145), var(--success-sat, 63%), 50%, 0.4);
    box-shadow: 0 0 5px hsla(var(--success-hue, 145), var(--success-sat, 63%), 50%, 0.5),
      0 0 10px hsla(var(--success-hue, 145), var(--success-sat, 63%), 50%, 0.4);
  }
  to {
    outline-color: hsla(var(--success-hue, 145), var(--success-sat, 63%), 50%, 0.8);
    box-shadow: 0 0 10px hsla(var(--success-hue, 145), var(--success-sat, 63%), 50%, 0.9),
      0 0 20px hsla(var(--success-hue, 145), var(--success-sat, 63%), 50%, 0.8);
  }
}

@keyframes warning-glow {
  from {
    outline-color: hsla(var(--warning-hue, 45), var(--warning-sat, 100%), 50%, 0.4);
    box-shadow: 0 0 5px hsla(var(--warning-hue, 45), var(--warning-sat, 100%), 50%, 0.5),
      0 0 10px hsla(var(--warning-hue, 45), var(--warning-sat, 100%), 50%, 0.4);
  }
  to {
    outline-color: hsla(var(--warning-hue, 45), var(--warning-sat, 100%), 50%, 0.8);
    box-shadow: 0 0 10px hsla(var(--warning-hue, 45), var(--warning-sat, 100%), 50%, 0.9),
      0 0 20px hsla(var(--warning-hue, 45), var(--warning-sat, 100%), 50%, 0.8);
  }
}

@keyframes error-glow {
  from {
    outline-color: hsla(var(--danger-hue, 0), var(--danger-sat, 65%), 55%, 0.4);
    box-shadow: 0 0 5px hsla(var(--danger-hue, 0), var(--danger-sat, 65%), 55%, 0.5),
      0 0 10px hsla(var(--danger-hue, 0), var(--danger-sat, 65%), 55%, 0.4);
  }
  to {
    outline-color: hsla(var(--danger-hue, 0), var(--danger-sat, 65%), 55%, 0.8);
    box-shadow: 0 0 10px hsla(var(--danger-hue, 0), var(--danger-sat, 65%), 55%, 0.9),
      0 0 20px hsla(var(--danger-hue, 0), var(--danger-sat, 65%), 55%, 0.8);
  }
}

@keyframes info-glow {
  from {
    outline-color: hsla(var(--blu-hue, 204), var(--blu-sat, 100%), 50%, 0.4);
    box-shadow: 0 0 5px hsla(var(--blu-hue, 204), var(--blu-sat, 100%), 50%, 0.5),
      0 0 10px hsla(var(--blu-hue, 204), var(--blu-sat, 100%), 50%, 0.4);
  }
  to {
    outline-color: hsla(var(--blu-hue, 204), var(--blu-sat, 100%), 50%, 0.8);
    box-shadow: 0 0 10px hsla(var(--blu-hue, 204), var(--blu-sat, 100%), 50%, 0.9),
      0 0 20px hsla(var(--blu-hue, 204), var(--blu-sat, 100%), 50%, 0.8);
  }
}

::v-deep(.job-selector.has-notification-success .visual-style),
::v-deep(.add-job-btn.has-notification-success .visual-style) {
  animation: success-glow 1.2s ease-in-out infinite alternate;
}

::v-deep(.job-selector.has-notification-warning .visual-style),
::v-deep(.add-job-btn.has-notification-warning .visual-style) {
  animation: warning-glow 1.2s ease-in-out infinite alternate;
}

::v-deep(.job-selector.has-notification-error .visual-style),
::v-deep(.add-job-btn.has-notification-error .visual-style) {
  animation: error-glow 1.2s ease-in-out infinite alternate;
}

::v-deep(.job-selector.has-notification-info .visual-style),
::v-deep(.add-job-btn.has-notification-info .visual-style) {
  animation: info-glow 1.2s ease-in-out infinite alternate;
}
</style>
