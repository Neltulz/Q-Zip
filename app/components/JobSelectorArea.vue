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
        <template v-for="(job, index) in jobsList" :key="job.id">
          <CustomButton
            :ref="(el) => setJobButtonRef(job.id, el)"
            class="job-selector"
            :class="{
              active: jobsStore.selectedJobId === job.id,
              'active-line-inline': jobsStore.selectedJobId === job.id,
              'is-dragged': job.id === draggedJobId,
              'drop-target-hover': hoveredJobId === job.id && dragDropStore.isInternalDragActive,
              'drag-over': dragOverJobId === job.id,
              [`has-notification-${jobNotificationStates.get(job.id)}`]: jobNotificationStates.has(job.id),
            }"
            button-style-class="trans-btn btn-darkr can-become-active"
            :data-job-id="job.id"
            :data-name="'job-' + job.id"
            :draggable="true"
            data-has-context-menu="true"
            @click="selectJob(job.id)"
            @contextmenu.prevent="showJobContextMenu($event, job.id)"
            @dragend="onDragEnd"
            @dragstart="onDragStart($event, job.id)"
            @dragover.prevent="handleJobTabDragOver($event, job.id)"
            @dragleave="handleJobTabDragLeave($event)"
            @drop.prevent="handleJobTabDrop($event, job.id)"
            @mouseenter="tooltipManager.showTooltip('job-' + job.id)"
            @mouseleave="tooltipManager.hideTooltip()"
          >
            <span class="job-sel-icon">
              <Icon name="mdi:briefcase" size="20" />
            </span>
            <span class="job-info">
              <span class="job-sel-title">Job {{ job.id }}</span>
              <span class="job-sel-num-files">{{ job.files.length }} Items</span>
            </span>
            <div class="job-sel-options">
              <CustomButton
                button-style-class="trans-btn close-job-btn"
                data-name="close-job-btn"
                first-icon-name="mdi:close"
                :first-icon-size="18"
                @click.stop.prevent="removeJob(job.id)"
              />
            </div>
          </CustomButton>

          <!-- Context Menu for each job tab -->
          <DropdownMenu
            :ref="(el) => setContextMenuRef(job.id, el)"
            :dropdown-data-name="'job-' + job.id + '-context-menu'"
            :hide-trigger="true"
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
                    removeJob(job.id);
                    close();
                  }
                "
              >
                Remove Job
              </CustomButton>
            </template>
          </DropdownMenu>

          <!-- Dropdown for drag-and-drop actions -->
          <DropdownMenu
            :ref="(el) => setDragActionMenuRef(job.id, el)"
            :dropdown-data-name="`drag-action-job-${job.id}`"
            :hide-trigger="true"
          >
            <template #default="{ close }">
              <CustomButton
                button-style-class="trans-btn"
                data-name="drag-action-copy-btn"
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
              <CustomButton
                button-style-class="trans-btn"
                data-name="drag-action-move-btn"
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
              <hr />
              <CustomButton
                button-style-class="trans-btn btn-lite"
                data-name="drag-action-cancel-btn"
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

          <InfoTooltip
            :visible="tooltipManager.activeTooltipId.value === 'job-' + job.id"
            :content="{ text: 'Right click for more options' }"
            :target="jobButtonRefs.get(job.id)?.visualStyleRef"
            placement="bottom"
          />
        </template>
      </div>
    </OverlayScrollbarsComponent>

    <div class="job-selector-btn-wrapper">
      <div
        class="job-selector-btns-start"
        @mouseenter="tooltipManager.showTooltip('add-job')"
        @mouseleave="tooltipManager.hideTooltip()"
      >
        <CustomButton
          ref="addJobButtonRef"
          class="add-job-btn"
          :class="{
            'drop-target-hover': hoveredJobId === 'new-job' && dragDropStore.isInternalDragActive,
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
        <!-- Dropdown for drag-and-drop actions on 'New Job' button -->
        <DropdownMenu
          :ref="(el) => setDragActionMenuRef('new-job', el)"
          dropdown-data-name="drag-action-new-job"
          :hide-trigger="true"
        >
          <template #default="{ close }">
            <CustomButton
              button-style-class="trans-btn"
              data-name="drag-action-copy-to-new-btn"
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
            <CustomButton
              button-style-class="trans-btn"
              data-name="drag-action-move-to-new-btn"
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
            <hr />
            <CustomButton
              button-style-class="trans-btn btn-lite"
              data-name="drag-action-cancel-btn"
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
        <InfoTooltip
          :visible="tooltipManager.activeTooltipId.value === 'add-job'"
          :content="{ text: 'Create New Job (Ctrl+T)' }"
          :target="addJobButtonRef?.visualStyleRef"
          placement="bottom"
          :debug-force-visible="false"
        />
      </div>

      <div class="job-selector-btns-end">
        <DropdownMenu
          ref="extraOptionsDropdownRef"
          aria-label="Job Selector Options"
          button-class="remove-all-jobs-btn"
          button-style-class="trans-btn"
          :dropdown-data-name="'extra-job-selector-options-dropdown'"
          :last-icon-size="24"
          placement="bottom-end"
          @mouseenter="tooltipManager.showTooltip('job-selector-options')"
          @mouseleave="tooltipManager.hideTooltip()"
          @click="tooltipManager.hideTooltip()"
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
        <InfoTooltip
          :visible="tooltipManager.activeTooltipId.value === 'job-selector-options'"
          :content="{ text: 'Job Selector Options' }"
          :target="extraOptionsTarget"
          placement="bottom"
        />
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type ComponentPublicInstance, onBeforeUpdate } from "vue";
import { useJobsStore } from "@/stores/jobsStore";
import type { FileItem } from "@/types/types";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import type { OverlayScrollbars } from "overlayscrollbars";
import { useThemeStore } from "@/stores/themeStore";
import { useUiStore, type NotificationType, type Notification } from "@/stores/uiStore";
import { useModalsStore } from "@/stores/modalsStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import type { ModalOptions } from "@/types/modal";
import DropdownMenu from "@/components/DropdownMenu.vue";
import CustomButton from "./CustomButton.vue";
import InfoTooltip from "./InfoTooltip.vue";
import { useScrollContainer } from "@/composables/useScrollContainer";
import { useTooltipManager } from "@/composables/useTooltipManager";

interface ScrollableOverlayScrollbars extends OverlayScrollbars {
  scroll: (destination: { x?: string | number; y?: string | number }, duration?: number) => void;
}

const { setScrollContainer } = useScrollContainer();

const themeStore = useThemeStore();
const jobsStore = useJobsStore();
const uiStore = useUiStore();
const modalsStore = useModalsStore();
const dragDropStore = useDragDropStore();
const tooltipManager = useTooltipManager();

const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));
const jobsList = computed(() => jobsStore.jobs);

const draggedJobId = ref<number | null>(null);
const dragOverJobId = ref<number | null>(null);
const hoveredJobId = ref<number | "new-job" | null>(null);

const scrollComponentRef = ref<InstanceType<typeof OverlayScrollbarsComponent> | null>(null);

const jobButtonRefs = ref(new Map<number | "new-job", InstanceType<typeof CustomButton>>());
const jobContextMenuRefs = ref(new Map<number, InstanceType<typeof DropdownMenu>>());
  const dragActionDropdownRefs = ref(new Map<number | "new-job", InstanceType<typeof DropdownMenu>>());
  const extraOptionsDropdownRef = ref<InstanceType<typeof DropdownMenu> | null>(null);

const pendingDropFilePaths = ref<string[]>([]);
const pendingDropSourceJobId = ref<number | null>(null);

const jobNotificationStates = ref<Map<number | "new-job", NotificationType>>(new Map());

  const addJobButtonRef = ref<InstanceType<typeof CustomButton> | null>(null);
  const extraOptionsTarget = computed(() => {
    const el = extraOptionsDropdownRef.value as any;
    if (!el) return null;
    // Try common exposed refs, fall back to querying DOM inside the component
    return el.buttonRef ?? el.$el?.querySelector?.('.visual-style') ?? null;
  });

watch(
  () => uiStore.notifications,
  (notifications: Notification[], oldNotifications: Notification[]) => {
    const newNotifications = notifications.filter(
      (n: Notification) => !oldNotifications.some((on: Notification) => on.id === n.id)
    );

    newNotifications.forEach((notification: Notification) => {
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
  (notification: any) => {
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
  (newRef: any) => {
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
  window.removeEventListener("keydown", handleKeyDown);
});

const setJobButtonRef = (jobId: number | "new-job", el: Element | ComponentPublicInstance | null) => {
  if (el) {
    jobButtonRefs.value.set(jobId, el as InstanceType<typeof CustomButton>);
  }
};

const setContextMenuRef = (jobId: number, el: Element | ComponentPublicInstance | null) => {
  if (el) {
    jobContextMenuRefs.value.set(jobId, el as InstanceType<typeof DropdownMenu>);
  }
};

const setDragActionMenuRef = (jobId: number | "new-job", el: Element | ComponentPublicInstance | null) => {
  if (el) {
    dragActionDropdownRefs.value.set(jobId, el as InstanceType<typeof DropdownMenu>);
  }
};

onBeforeUpdate(() => {
  jobButtonRefs.value.clear();
  jobContextMenuRefs.value.clear();
  dragActionDropdownRefs.value.clear();
});

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key.toLowerCase() === "t") {
    event.preventDefault();
    addJob();
  }
};

onMounted(() => {
  jobsStore.initialize();
  window.addEventListener("keydown", handleKeyDown);
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

const selectJob = (jobId: number): void => {
  if (draggedJobId.value !== null || dragDropStore.isInternalDragActive) return;
  const oldId = jobsStore.selectedJobId;
  try {
    // Dispatch the old and new ids so listeners can deterministically
    // deactivate the previous job's FileTable before the store updates.
      // log for debugging
      try {
        const { logGlobalEvent } = require("@/utils/loggers");
        logGlobalEvent("JobSelectorArea", "selectJob dispatching app:selected-job-changed", { oldId, newId: jobId });
      } catch (e) {
        // fallback
        // eslint-disable-next-line no-console
        console.log("JobSelectorArea.selectJob -> dispatching selected-job-changed", { oldId, newId: jobId });
      }

      window.dispatchEvent(new CustomEvent("app:selected-job-changed", { detail: { oldId, newId: jobId } }));
  } catch (e) {
    // ignore non-browser env
  }
  jobsStore.selectJob(jobId);
  // Ensure activation after the new JobArea mounts/updates (workaround for timing races)
  try {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("app:ensure-activate-filetable", { detail: jobId }));
    }, 50);
  } catch (e) {
    // ignore
  }
};

const showJobContextMenu = (event: MouseEvent, jobId: number) => {
  const contextMenu = jobContextMenuRefs.value.get(jobId);
  if (contextMenu) {
    contextMenu.openDropdown({ x: event.clientX, y: event.clientY });
  }
};

const addJob = (): void => {
  const newJobId = jobsStore.addJob();
  jobsStore.selectJob(newJobId);
};

const removeJob = (jobId: number): void => {
  const modalOptions: ModalOptions = {
    icon: "mdi:alert-outline",
    title: "Confirm Remove Job",
    description: [
      `Are you sure you want to permanently remove <strong>Job ${jobId}</strong>?`,
      "All files and any job-specific settings (like compression or encryption) will be lost.",
    ],
    buttons: [
      { action: "proceed", text: "Remove Job", theme: "danger", styleClass: "bordered-btn", icon: "mdi:trash-can-outline" },
      { action: "cancel", text: "Cancel", styleClass: "bordered-btn" },
    ],
    footerJustifyContent: "center",
    closeOnClickOutside: true,
  };
  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, { showProcessColumn: false }, (action) => {
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
    closeOnClickOutside: true,
  };
  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, { showProcessColumn: false }, (action) => {
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
  if (dragDropStore.isInternalDragActive && !dragDropStore.dropOccurred) {
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
    }
  }
};

const handleJobTabDragLeave = (event: DragEvent) => {
  if (dragDropStore.isInternalDragActive) {
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      hoveredJobId.value = null;
    }
  }
};

const handleJobTabDrop = (event: DragEvent, targetIdentifier: number | "new-job") => {
  event.preventDefault();
  event.stopPropagation();

  dragDropStore.setDropOccurred(true);

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

  const pathSet = new Set(droppedFilePaths);
  const filesToOperateOn = sourceJob.files.filter((f) => pathSet.has(f.path));

  openOperationConfirmModal(operation, filesToOperateOn, targetIdentifier, sourceJobId);
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
      operation,
    },
    (action: string, conflictResolution?: 'skip' | 'replace') => {
      if (action === "proceed") {
        uiStore.handleFileOperation(operation, files, targetJobId, { 
          sourceJobId, 
          conflictResolution: conflictResolution || (operation === 'move' ? 'replace' : 'skip')
        });
      }
      // Always end the drag operation when the modal closes, whether proceeding or cancelling.
      dragDropStore.endInternalDrag();
    }
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
/* Scoped styles remain the same */
</style>
