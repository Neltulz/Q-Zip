<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  JobSelectorArea.vue @preserve
-->
<!-- components/JobSelectorArea.vue @preserve -->
<!-- 
  JobSelectorArea.vue @preserve
-->
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
              'drop-target-hover': hoveredJobId === job.id && dragDropStore.isInternalDragActive,
              [`has-notification-${jobNotificationStates.get(job.id)}`]: jobNotificationStates.has(job.id),
            }"
            button-style-class="trans-btn btn-darkr can-become-active"
            :data-job-id="job.id"
            :data-name="'job-' + job.id"
            data-has-context-menu="true"
            @click="selectJob(job.id)"
            @contextmenu.prevent="showJobContextMenu($event, job.id)"
            @dragover.prevent="handleDragOver"
            @dragleave="handleDragLeave"
            @drop.prevent="handleJobTabDrop($event, job.id)"
                            @mouseenter="(event) => handleJobMouseEnter(job.id, event)"
            @mouseleave="handleJobMouseLeave"
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
                  :ref="(el) => setRemoveJobMenuRef(job.id, el)"
                  button-style-class="trans-btn close-job-btn"
                  :dropdown-data-name="`remove-job-${job.id}-dropdown`"
                  last-icon-name="mdi:close"
                  :last-icon-size="18"
                  placement="bottom-center"
                  :show-cancel-button="false"
                  :on-button-click="(event) => handleRemoveJobClick(event, job.id)"
                  @mouseenter="(event: MouseEvent) => handleRemoveJobButtonMouseEnter(job.id, event)"
                  @mouseleave="handleRemoveJobButtonMouseLeave"
                  @dropdown-opened="handleRemoveJobDropdownOpened(job.id)"
                  @action-button-activated="handleActionButtonActivated"
                >
                                   <template #default="{ close }">
                    <div class="remove-job-confirmation">
                      <div class="confirmation-header">
                        <h3 class="confirmation-title">Remove Job?</h3>
                        <p class="confirmation-question">Are you sure you want to remove this job?</p>
                      </div>
                      
                      <div class="job-preview">
                        <div class="job-preview-content">
                          <div class="job-preview-icon">
                            <Icon name="mdi:briefcase" size="16" />
                          </div>
                          <div class="job-preview-info">
                            <div class="job-preview-title">Job {{ job.id }}</div>
                            <div class="job-preview-details">{{ job.files.length }} Items</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template #content-bottom="{ close }">
                    <hr />
                    <div class="confirmation-actions">
                      <CustomButton
                        :ref="(el) => setTipButtonRef(job.id, el)"
                        button-style-class="tip-button"
                        :data-name="'tip-button-' + job.id + '-btn'"
                        first-icon-name="mdi:lightbulb-outline"
                        :first-icon-size="20"
                        justify="center"
                        @mouseenter="(event) => showTipTooltip(job.id, event)"
                        @mouseleave="hideTipTooltip(job.id)"
                      />
                      <CustomButton
                        :ref="(el) => setCancelRemoveJobBtnRef(job.id, el)"
                        button-style-class="bordered-btn"
                        :data-name="'cancel-remove-job-' + job.id + '-btn'"
                        first-icon-name="mdi:close"
                        :first-icon-size="20"
                        justify="end"
                        @mouseup="close"
                        @mouseenter="(event) => showCancelRemoveJobTooltip(job.id, event)"
                        @mouseleave="hideCancelRemoveJobTooltip(job.id)"
                      >
                        Cancel
                      </CustomButton>
                      <CustomButton
                        :ref="(el) => setConfirmRemoveJobBtnRef(job.id, el)"
                        button-style-class="bordered-btn"
                        :data-name="'confirm-remove-job-' + job.id + '-btn'"
                        first-icon-name="mdi:trash"
                        :first-icon-size="20"
                        btn-theme="danger"
                        justify="end"
                        @mouseup="
                          () => {
                            removeJob(job.id);
                            close();
                          }
                        "
                        @mouseenter="(event) => showConfirmRemoveJobTooltip(job.id, event)"
                        @mouseleave="hideConfirmRemoveJobTooltip(job.id)"
                      >
                        Remove Job
                      </CustomButton>
                      
                      <!-- Tooltips for remove job confirmation buttons -->
                      <InfoTooltip
                        :visible="getCancelRemoveJobTooltipVisible(job.id)"
                        :content="{ text: 'Cancel the removal', inlineHotKey: { keys: ['ESC'], position: 'end' } } as ExtendedTooltipContent"
                        :target="cancelRemoveJobBtnRefs.get(job.id)?.visualStyleRef"
                        placement="bottom"
                      />
                      <InfoTooltip
                        :visible="getTipTooltipVisible(job.id)"
                        :content="{ text: 'Hold Shift when clicking X or press Ctrl+Shift+Del to bypass confirmation', inlineHotKey: { keys: ['CTRL', 'SHIFT', 'DEL'], position: 'inline' } } as ExtendedTooltipContent"
                        :target="tipButtonRefs.get(job.id)?.visualStyleRef"
                        placement="bottom"
                      />
                      <InfoTooltip
                        :visible="getConfirmRemoveJobTooltipVisible(job.id)"
                        :content="{ text: 'Confirm job removal', inlineHotKey: { keys: ['ENTER'], position: 'end' } } as ExtendedTooltipContent"
                        :target="confirmRemoveJobBtnRefs.get(job.id)?.visualStyleRef"
                        placement="bottom"
                      />
                    </div>
                  </template>
                              </DropdownMenu>
               <InfoTooltip
                 :visible="tooltipManager.activeTooltipId.value === 'remove-job-' + job.id"
                 :content="{ text: 'Remove Job', inlineHotKey: { keys: ['SHIFT', 'DEL'], position: 'end' } } as ExtendedTooltipContent"
                 :target="removeJobDropdownRefs.get(job.id)?.$el"
                 placement="bottom"
               />
             </div>
          </CustomButton>
          <!-- Context Menu for each job tab -->
          <DropdownMenu
            :ref="(el) => setContextMenuRef(job.id, el)"
            :dropdown-data-name="'job-' + job.id + '-context-menu'"
            :hide-trigger="true"
            :show-cancel-button="true"
            @action-button-activated="handleActionButtonActivated"
          >
            <template #default="{ close }">
              <CustomButton
                button-style-class="trans-btn btn-lite"
                :data-name="'move-job-left-' + job.id + '-btn'"
                :disabled="index === 0"
                first-icon-name="mdi:arrow-left"
                :first-icon-size="20"
                shortcut-text="Ctrl+Shift+Left"
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
                shortcut-text="Ctrl+Shift+Right"
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
                 shortcut-text="Shift+Del"
                 :show-tooltip="true"
                 tooltip-placement="bottom"
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
            :show-cancel-button="true"
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
            </template>
          </DropdownMenu>
          
        </template>
      </div>
    </OverlayScrollbarsComponent>
    <div class="job-selector-btn-wrapper">
      <div
        class="job-selector-btns-start"
                    @mouseenter="(event) => handleAddJobMouseEnter(event)"
        @mouseleave="handleAddJobMouseLeave"
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
          :show-cancel-button="true"
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
          </template>
        </DropdownMenu>
        <InfoTooltip
          :visible="tooltipManager.activeTooltipId.value === 'add-job'"
          :content="{ text: 'Create New Job', inlineHotKey: { keys: ['CTRL', 'T'], position: 'end' } } as ExtendedTooltipContent"
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
           :show-cancel-button="true"
                       @mouseenter="(event: MouseEvent) => handleExtraOptionsMouseEnter(event)"
           @mouseleave="handleExtraOptionsMouseLeave"
           @dropdown-opened="handleExtraOptionsDropdownOpened"
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type ComponentPublicInstance, onBeforeUpdate, reactive } from "vue";
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
import InfoTooltip from "./InfoTooltipContainer.vue";

import { useScrollContainer } from "@/composables/useScrollContainer";
import { useTooltipManager } from "@/composables/useTooltipManager";
import { useDropdownManager } from "@/composables/dropdownManager";
import { useButtonTooltip } from "@/composables/useButtonTooltip";
import { logDragDropEvent, logUI, logManagerAction, logNotification, logGlobalEvent, logHover, logTooltip } from "@/utils/loggers";
import { DEBUG, debugConfig } from "@/utils/debugConfig";

// Extended type for InfoTooltip content with inline HotKey support
type ExtendedTooltipContent = { text: string; icon?: string; inlineHotKey?: { keys: string[]; position: 'start' | 'end' | 'inline' } };

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
const { closeAllDropdowns } = useDropdownManager();
const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));
const jobsList = computed(() => jobsStore.jobs);
const hoveredJobId = ref<number | "new-job" | null>(null);
const scrollComponentRef = ref<InstanceType<typeof OverlayScrollbarsComponent> | null>(null);
const jobButtonRefs = ref(new Map<number | "new-job", InstanceType<typeof CustomButton>>());
const jobContextMenuRefs = ref(new Map<number, InstanceType<typeof DropdownMenu>>());
const dragActionDropdownRefs = ref(new Map<number | "new-job", InstanceType<typeof DropdownMenu>>());
const removeJobDropdownRefs = ref(new Map<number, InstanceType<typeof DropdownMenu>>());
const extraOptionsDropdownRef = ref<InstanceType<typeof DropdownMenu> | null>(null);
const pendingDropFilePaths = ref<string[]>([]);
const pendingDropSourceJobId = ref<number | null>(null);
const jobNotificationStates = ref<Map<number | "new-job", NotificationType>>(new Map());
const addJobButtonRef = ref<InstanceType<typeof CustomButton> | null>(null);

// Job-specific tooltip visibility states - Updated to use tooltipManager
// const cancelRemoveJobTooltipVisible = ref(new Map<number, boolean>());
// const confirmRemoveJobTooltipVisible = ref(new Map<number, boolean>());
// const tipButtonTooltipVisible = ref(new Map<number, boolean>());

// Function to get tooltip visibility for a job - Updated to use tooltipManager
const getCancelRemoveJobTooltipVisible = (jobId: number) => {
  return tooltipManager.activeTooltipId.value === `cancel-remove-job-${jobId}`;
};

const getConfirmRemoveJobTooltipVisible = (jobId: number) => {
  return tooltipManager.activeTooltipId.value === `confirm-remove-job-${jobId}`;
};

const getTipTooltipVisible = (jobId: number) => {
  return tooltipManager.activeTooltipId.value === `tip-remove-job-${jobId}`;
};

// Function to show/hide tooltips for a job - Updated to use tooltipManager with origin element
const showCancelRemoveJobTooltip = (jobId: number, event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip(`cancel-remove-job-${jobId}`, originElement);
};

const hideCancelRemoveJobTooltip = (jobId: number) => {
  tooltipManager.hideTooltip();
};

const showConfirmRemoveJobTooltip = (jobId: number, event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip(`confirm-remove-job-${jobId}`, originElement);
};

const hideConfirmRemoveJobTooltip = (jobId: number) => {
  tooltipManager.hideTooltip();
};

const showTipTooltip = (jobId: number, event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip(`tip-remove-job-${jobId}`, originElement);
};

const hideTipTooltip = (jobId: number) => {
  tooltipManager.hideTooltip();
};

// Job-specific refs for remove job confirmation buttons
const cancelRemoveJobBtnRefs = ref(new Map<number, InstanceType<typeof CustomButton>>());
const confirmRemoveJobBtnRefs = ref(new Map<number, InstanceType<typeof CustomButton>>());
const tipButtonRefs = ref(new Map<number, InstanceType<typeof CustomButton>>());

// Add delay for job switching to prevent rapid cycling
const lastJobSwitchTime = ref(0);
const JOB_SWITCH_DELAY = 150; // 150ms delay between job switches

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
      if (DEBUG && debugConfig.logNotifications) {
        logNotification("JobSelectorArea", `Pending notification received for targetId: ${targetId}`, {
          notification,
          jobButtonRefs: Array.from(jobButtonRefs.value.keys()),
          hasButtonRef: jobButtonRefs.value.has(targetId)
        });
      }
      nextTick(() => {
        const buttonRef = jobButtonRefs.value.get(targetId);
        const buttonEl = buttonRef?.buttonRef;
        if (DEBUG && debugConfig.logNotifications) {
          logNotification("JobSelectorArea", `Button reference lookup for targetId: ${targetId}`, {
            targetId,
            buttonRef: !!buttonRef,
            buttonEl: !!buttonEl,
            buttonRefs: Array.from(jobButtonRefs.value.keys())
          });
        }
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
            if (DEBUG && debugConfig.logNotifications) {
              logNotification("JobSelectorArea", `Adding notification with position`, position);
            }
            uiStore.addNotification({ ...notification, position });
          } else {
            if (DEBUG && debugConfig.logNotifications) {
              logNotification("JobSelectorArea", `Adding notification without position (no rect or scrollEl)`);
            }
            uiStore.addNotification(notification);
          }
        } else {
          if (DEBUG && debugConfig.logNotifications) {
            logNotification("JobSelectorArea", `Adding notification without position (no buttonEl)`);
          }
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
    // Only log ref updates when debugging ref management specifically
    if (DEBUG && debugConfig.logRefUpdates) {
      logManagerAction("JobSelectorArea", `Set job button ref for jobId: ${jobId}`);
    }
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
const setRemoveJobMenuRef = (jobId: number, el: Element | ComponentPublicInstance | null) => {
  if (el) {
    removeJobDropdownRefs.value.set(jobId, el as InstanceType<typeof DropdownMenu>);
  }
};

const setCancelRemoveJobBtnRef = (jobId: number, el: Element | ComponentPublicInstance | null) => {
  if (el) {
    cancelRemoveJobBtnRefs.value.set(jobId, el as InstanceType<typeof CustomButton>);
  }
};

const setConfirmRemoveJobBtnRef = (jobId: number, el: Element | ComponentPublicInstance | null) => {
  if (el) {
    confirmRemoveJobBtnRefs.value.set(jobId, el as InstanceType<typeof CustomButton>);
  }
};

const setTipButtonRef = (jobId: number, el: Element | ComponentPublicInstance | null) => {
  if (el) {
    tipButtonRefs.value.set(jobId, el as InstanceType<typeof CustomButton>);
  }
};

onBeforeUpdate(() => {
  jobButtonRefs.value.clear();
  jobContextMenuRefs.value.clear();
  dragActionDropdownRefs.value.clear();
  removeJobDropdownRefs.value.clear();
  cancelRemoveJobBtnRefs.value.clear();
  confirmRemoveJobBtnRefs.value.clear();
  tipButtonRefs.value.clear();
      // Removed local tooltip state cleanup - now handled by tooltipManager
    // cancelRemoveJobTooltipVisible.value.clear();
    // confirmRemoveJobTooltipVisible.value.clear();
    // tipButtonTooltipVisible.value.clear();
});
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key.toLowerCase() === "t") {
    event.preventDefault();
    addJob();
  }
  
  // Add Ctrl+Tab/Ctrl+Shift+Tab shortcuts for cycling between job tabs (browser-style)
  if (event.ctrlKey && event.key === "Tab" && jobsList.value.length > 1) {
    event.preventDefault();
    
    // Check if enough time has passed since last job switch
    const now = Date.now();
    if (now - lastJobSwitchTime.value < JOB_SWITCH_DELAY) {
      if (DEBUG && debugConfig.logUIInteractivity) {
        logUI("JobSelectorArea", `CTRL+${event.shiftKey ? "SHIFT+" : ""}TAB detected but ignored due to rapid switching (${now - lastJobSwitchTime.value}ms < ${JOB_SWITCH_DELAY}ms)`);
      }
      return;
    }
    
    const currentIndex = jobsList.value.findIndex(job => job.id === jobsStore.selectedJobId);
    if (currentIndex === -1) return;
    
    let newIndex: number;
    if (event.shiftKey) {
      // Ctrl+Shift+Tab: Previous job (wrap around to last)
      newIndex = currentIndex === 0 ? jobsList.value.length - 1 : currentIndex - 1;
    } else {
      // Ctrl+Tab: Next job (wrap around to first)
      newIndex = currentIndex === jobsList.value.length - 1 ? 0 : currentIndex + 1;
    }
    
    const newJob = jobsList.value[newIndex];
    if (newJob) {
      const newJobId = newJob.id;
      lastJobSwitchTime.value = now; // Update the last switch time
      if (DEBUG && debugConfig.logUIInteractivity) {
        const direction = event.shiftKey ? "previous" : "next";
        logUI("JobSelectorArea", `CTRL+${event.shiftKey ? "SHIFT+" : ""}TAB detected, cycling ${direction} from job ${jobsStore.selectedJobId} to job ${newJobId}`);
      }
      selectJob(newJobId);
    }
    return;
  }
  
  // Add Ctrl+1-9 shortcuts for jumping to specific jobs
  if (event.ctrlKey && /^[1-9]$/.test(event.key) && jobsList.value.length > 0) {
    event.preventDefault();
    const jobIndex = parseInt(event.key) - 1; // Convert 1-9 to 0-8
    const targetJob = jobsList.value[jobIndex];
    
    if (targetJob) {
      if (DEBUG && debugConfig.logUIInteractivity) {
        logUI("JobSelectorArea", `CTRL+${event.key} detected, jumping to job ${targetJob.id}`);
      }
      selectJob(targetJob.id);
    }
    return;
  }
  
  // Add Shift+Delete shortcut for opening the remove job dropdown for the currently selected job
  if (event.shiftKey && event.key === "Delete" && jobsStore.selectedJobId !== null) {
    // If there's only 1 job, clear it instead of removing
    if (jobsList.value.length <= 1) {
      event.preventDefault();
      const selectedJobId = jobsStore.selectedJobId;
      if (DEBUG && debugConfig.logUIInteractivity) {
        logUI("JobSelectorArea", `SHIFT+DEL detected, clearing job ${selectedJobId} (only job remaining)`);
      }
      jobsStore.clearJob(selectedJobId);
      return;
    }
    
    event.preventDefault();
    const selectedJobId = jobsStore.selectedJobId;
    const removeJobDropdown = removeJobDropdownRefs.value.get(selectedJobId);
    if (removeJobDropdown) {
      removeJobDropdown.openDropdown();
    }
  }
  
  // Add Ctrl+Shift+Delete shortcut for force removing the currently selected job (bypass confirmation)
  if (event.ctrlKey && event.shiftKey && event.key === "Delete" && jobsStore.selectedJobId !== null) {
    // If there's only 1 job, clear it instead of removing
    if (jobsList.value.length <= 1) {
      event.preventDefault();
      const selectedJobId = jobsStore.selectedJobId;
      if (DEBUG && debugConfig.logUIInteractivity) {
        logUI("JobSelectorArea", `CTRL+SHIFT+DEL detected, clearing job ${selectedJobId} (only job remaining)`);
      }
      jobsStore.clearJob(selectedJobId);
      return;
    }
    
    event.preventDefault();
    const selectedJobId = jobsStore.selectedJobId;
    if (DEBUG && debugConfig.logUIInteractivity) {
      logUI("JobSelectorArea", `CTRL+SHIFT+DEL detected, force removing job ${selectedJobId} without confirmation`);
    }
    removeJob(selectedJobId);
  }
  
  // Add Ctrl+Shift+Left/Right shortcuts for moving the currently selected job
  if (event.ctrlKey && event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight") && jobsStore.selectedJobId !== null) {
    event.preventDefault();
    const currentIndex = jobsList.value.findIndex(job => job.id === jobsStore.selectedJobId);
    if (currentIndex === -1) return;
    
    const direction = event.key === "ArrowLeft" ? "left" : "right";
    
    // Check if the move is valid
    if (direction === "left" && currentIndex === 0) {
      if (DEBUG && debugConfig.logUIInteractivity) {
        logUI("JobSelectorArea", `CTRL+SHIFT+LEFT detected but job ${jobsStore.selectedJobId} is already at the leftmost position`);
      }
      return;
    }
    
    if (direction === "right" && currentIndex === jobsList.value.length - 1) {
      if (DEBUG && debugConfig.logUIInteractivity) {
        logUI("JobSelectorArea", `CTRL+SHIFT+RIGHT detected but job ${jobsStore.selectedJobId} is already at the rightmost position`);
      }
      return;
    }
    
    if (DEBUG && debugConfig.logUIInteractivity) {
      logUI("JobSelectorArea", `CTRL+SHIFT+${direction.toUpperCase()} detected, moving job ${jobsStore.selectedJobId} ${direction}`);
    }
    reorderJob(currentIndex, direction);
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
const selectJob = (jobId: number): void => {
  if (dragDropStore.isInternalDragActive) return;
  const oldId = jobsStore.selectedJobId;
  try {
    // Dispatch the old and new ids so listeners can deterministically
    // deactivate the previous job's FileTable before the store updates.
      // log for debugging
      if (DEBUG && debugConfig.logUIEvents) {
        logGlobalEvent("JobSelectorArea", "selectJob dispatching app:selected-job-changed", { oldId, newId: jobId });
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
  if (DEBUG && debugConfig.logUIInteractivity) {
    logUI("JobSelectorArea", `removeJob called for job ${jobId}`);
  }
  jobsStore.removeJobs([jobId], jobsStore.selectedJobId);
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
    // Note: No FileTable to reactivate in JobSelectorArea
  });
};
const handleDragOver = (event: DragEvent): void => {
  if (dragDropStore.isInternalDragActive) {
    // File operation from FileTable
    const target = (event.target as HTMLElement).closest(".job-selector, .add-job-btn");
    if (target instanceof HTMLElement) {
      const targetIdentifier = target.dataset.jobId ? Number(target.dataset.jobId) : "new-job";
      handleJobTabDragOver(event, targetIdentifier);
    } else {
      handleJobTabDragLeave(event);
    }
  }
};
const handleDragLeave = (event: DragEvent): void => {
  if (dragDropStore.isInternalDragActive) {
    handleJobTabDragLeave(event);
  }
};
const onDrop = (targetJobId: number | null): void => {
  if (dragDropStore.isInternalDragActive) {
    dragDropStore.endInternalDrag();
    hoveredJobId.value = null;
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
  // This is a file operation from FileTable
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
  logManagerAction("JobSelectorArea", `handleDragAction called: operation=${operation}, target=${targetIdentifier}`);
  const droppedFilePaths = pendingDropFilePaths.value;
  const sourceJobId = pendingDropSourceJobId.value;
  if (!sourceJobId || droppedFilePaths.length === 0) {
    logManagerAction("JobSelectorArea", "handleDragAction: Invalid source job or no files, ending drag");
    dragDropStore.endInternalDrag();
    return;
  }
  const sourceJob = jobsStore.jobs.find((j) => j.id === sourceJobId);
  if (!sourceJob) {
    logManagerAction("JobSelectorArea", "handleDragAction: Source job not found, ending drag");
    dragDropStore.endInternalDrag();
    return;
  }
  const pathSet = new Set(droppedFilePaths);
  const filesToOperateOn = sourceJob.files.filter((f) => pathSet.has(f.path));
  // End the drag operation immediately when opening the confirmation modal
  // This will clear the dashed lines and visual indicators
  logManagerAction("JobSelectorArea", "handleDragAction: Ending drag operation before opening modal");
  dragDropStore.endInternalDrag();
  openOperationConfirmModal(operation, filesToOperateOn, targetIdentifier, sourceJobId);
};
const openOperationConfirmModal = (
  operation: "move" | "copy",
  files: FileItem[],
  targetJobId: number | "new-job",
  sourceJobId: number | null
) => {
  logManagerAction("JobSelectorArea", `openOperationConfirmModal called: operation=${operation}, target=${targetJobId}, files=${files.length}`);
  // Explicitly close any open drag action dropdowns before opening the modal
  const targetIdentifier = targetJobId;
  const dropdown = dragActionDropdownRefs.value.get(targetIdentifier);
  if (dropdown) {
    logManagerAction("JobSelectorArea", `Explicitly closing drag action dropdown for target: ${targetIdentifier}`);
    dropdown.closeDropdown();
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
  logManagerAction("JobSelectorArea", "openOperationConfirmModal: Opening modal");
  modalsStore.openModal(
    "ResetConfirmationModalContent",
    modalOptions,
    {
      itemsToProcess,
      itemsToSkip,
      operation,
    },
    (action: string, data?: any) => {
      logManagerAction("JobSelectorArea", `Modal callback: action=${action}, data=`, data);
      if (action === "proceed") {
        // Extract conflict resolution from the data, with fallback based on operation
        const conflictResolution = data?.conflictResolution || (operation === 'move' ? 'replace' : 'skip');
        logManagerAction("JobSelectorArea", `Using conflict resolution: ${conflictResolution}`);
        uiStore.handleFileOperation(operation, files, targetJobId, { 
          sourceJobId, 
          conflictResolution
        });
      }
      // Drag operation was already ended in handleDragAction, so no need to call it again
      // Reactivate the file table after modal closes
      const currentJobId = jobsStore.selectedJobId;
      if (currentJobId !== null) {
        logManagerAction("JobSelectorArea", `Reactivating file table for job ${currentJobId} after modal closes`);
        try {
          window.dispatchEvent(new CustomEvent("app:ensure-activate-filetable", { detail: currentJobId }));
        } catch (e) {
          logManagerAction("JobSelectorArea", `Error dispatching ensure-activate-filetable event: ${e}`);
        }
      }
    }
  );
};
const handleJobMouseEnter = (jobId: number, event: MouseEvent): void => {
  logHover("JobSelectorArea", `Job mouse enter for job ${jobId}`, { jobId });
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('job-' + jobId, originElement);
};
const handleJobMouseLeave = (event?: MouseEvent): void => {
  logHover("JobSelectorArea", `Job mouse leave`, { 
    hasEvent: !!event,
    relatedTarget: event?.relatedTarget,
    currentTarget: event?.currentTarget,
    containsRelatedTarget: event ? (event.currentTarget as HTMLElement)?.contains(event.relatedTarget as HTMLElement) : false
  });
  
  // If no event provided, hide the tooltip
  if (!event) {
    tooltipManager.hideTooltip();
    return;
  }
  
  // Check if the mouse is moving to a child element within the same job selector button
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  const currentTarget = event.currentTarget as HTMLElement;
  
  // If the related target is still within the current job selector button, don't hide the tooltip
  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    logHover("JobSelectorArea", `Not hiding tooltip - mouse still within job selector button`, { relatedTarget, currentTarget });
    return;
  }
  
  logHover("JobSelectorArea", `Hiding tooltip - mouse left job selector button`, { relatedTarget, currentTarget });
  tooltipManager.hideTooltip();
};
const handleAddJobMouseEnter = (event: MouseEvent): void => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('add-job', originElement);
};
const handleAddJobMouseLeave = (event?: MouseEvent): void => {
  // If no event provided, hide the tooltip
  if (!event) {
    tooltipManager.hideTooltip();
    return;
  }
  
  // Check if the mouse is moving to a child element within the same button
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  const currentTarget = event.currentTarget as HTMLElement;
  
  // If the related target is still within the current button, don't hide the tooltip
  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    return;
  }
  
  tooltipManager.hideTooltip();
};

const handleExtraOptionsMouseEnter = (event: MouseEvent): void => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('job-selector-options', originElement);
};

const handleExtraOptionsMouseLeave = (event?: MouseEvent): void => {
  // If no event provided, hide the tooltip
  if (!event) {
    tooltipManager.hideTooltip();
    return;
  }
  
  // Check if the mouse is moving to a child element within the same button
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  const currentTarget = event.currentTarget as HTMLElement;
  
  // If the related target is still within the current button, don't hide the tooltip
  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    return;
  }
  
  tooltipManager.hideTooltip();
};

// Dropdown opened event handler to hide associated tooltip immediately
const handleExtraOptionsDropdownOpened = (): void => {
  tooltipManager.hideTooltipImmediately();
};

const handleRemoveJobButtonMouseEnter = (jobId: number, event: MouseEvent): void => {
  logHover("JobSelectorArea", `Remove job button mouse enter for job ${jobId}`, { jobId });
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('remove-job-' + jobId, originElement);
};

const handleRemoveJobButtonMouseLeave = (event?: MouseEvent): void => {
  logHover("JobSelectorArea", `Remove job button mouse leave`, { 
    hasEvent: !!event,
    relatedTarget: event?.relatedTarget,
    currentTarget: event?.currentTarget,
    containsRelatedTarget: event ? (event.currentTarget as HTMLElement)?.contains(event.relatedTarget as HTMLElement) : false
  });
  
  // If no event provided, hide the tooltip
  if (!event) {
    tooltipManager.hideTooltip();
    return;
  }
  
  // Check if the mouse is moving to a child element within the same button
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  const currentTarget = event.currentTarget as HTMLElement;
  
  // If the related target is still within the current button, don't hide the tooltip
  if (relatedTarget && currentTarget.contains(relatedTarget)) {
    logHover("JobSelectorArea", `Not hiding remove job tooltip - mouse still within button`, { relatedTarget, currentTarget });
    return;
  }
  
  // Special case: if we're moving from the close button back to the job selector button,
  // don't hide the tooltip because the job selector button will handle it
  if (relatedTarget && relatedTarget.classList.contains('job-selector')) {
    logHover("JobSelectorArea", `Moving from close button to job selector - not hiding tooltip`, { 
      relatedTarget: relatedTarget,
      currentTarget: currentTarget
    });
    return;
  }
  
  logHover("JobSelectorArea", `Hiding remove job tooltip - mouse left button`, { relatedTarget, currentTarget });
  tooltipManager.hideTooltip();
};

// Dropdown opened event handler to hide associated tooltip
const handleRemoveJobDropdownOpened = (jobId: number): void => {
  tooltipManager.hideTooltipImmediately();
};

const handleActionButtonActivated = (buttonData: { dataName: string | undefined, btnTheme: string | undefined, text: string | undefined }): void => {
  console.log('JobSelectorArea: handleActionButtonActivated called', buttonData);
  if (DEBUG && debugConfig.logUIInteractivity) {
    logUI("JobSelectorArea", `handleActionButtonActivated called`, buttonData);
  }
  
  // Extract job ID from the data-name (format: "remove-job-{jobId}-btn")
  const jobIdMatch = buttonData.dataName?.match(/remove-job-(\d+)-btn/);
  if (jobIdMatch) {
    const jobId = parseInt(jobIdMatch[1]!);
    if (DEBUG && debugConfig.logUIInteractivity) {
      const dataName = buttonData.dataName ?? 'undefined';
      logUI("JobSelectorArea", `Extracted job ID ${jobId} from data-name "${dataName}"`);
    }
    
    // Check if this is the last job
    if (jobsList.value.length <= 1) {
      if (DEBUG && debugConfig.logUIInteractivity) {
        logUI("JobSelectorArea", `Enter key detected on last job, clearing job ${jobId}`);
      }
      jobsStore.clearJob(jobId);
    } else {
      if (DEBUG && debugConfig.logUIInteractivity) {
        logUI("JobSelectorArea", `Enter key detected, removing job ${jobId}`);
      }
      removeJob(jobId);
    }
  } else {
    if (DEBUG && debugConfig.logUIInteractivity) {
      const dataName = buttonData.dataName ?? 'undefined';
      logUI("JobSelectorArea", `Could not extract job ID from data-name "${dataName}"`);
    }
  }
};

const handleRemoveJobClick = (event: MouseEvent, jobId: number): boolean | void => {
  // Add comprehensive logging to debug the issue
  if (DEBUG && debugConfig.logUIInteractivity) {
    logUI("JobSelectorArea", `handleRemoveJobClick called`, {
      jobId,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      type: event.type,
      target: event.target,
      currentTarget: event.currentTarget
    });
  }
  
  // Check if SHIFT key is held down
  if (event.shiftKey) {
    // If there's only 1 job, clear it instead of removing
    if (jobsList.value.length <= 1) {
      event.preventDefault();
      event.stopPropagation();
      if (DEBUG && debugConfig.logUIInteractivity) {
        logUI("JobSelectorArea", `SHIFT+Click detected, clearing job ${jobId} (only job remaining)`);
      }
      jobsStore.clearJob(jobId);
      return true; // Prevent dropdown from opening
    }
    
    // SHIFT+Click: bypass confirmation and remove job directly
    event.preventDefault();
    event.stopPropagation();
    if (DEBUG && debugConfig.logUIInteractivity) {
      logUI("JobSelectorArea", `SHIFT+Click detected, removing job ${jobId} without confirmation`);
    }
    removeJob(jobId);
    return true; // Prevent dropdown from opening
  } else {
    // Normal click: let the dropdown handle it normally
    if (DEBUG && debugConfig.logUIInteractivity) {
      logUI("JobSelectorArea", `Normal click detected, allowing dropdown to open for job ${jobId}`);
    }
    // Return false/undefined to allow dropdown to open normally
  }
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
