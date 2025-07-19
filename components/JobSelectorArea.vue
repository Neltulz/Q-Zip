<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/JobSelectorArea.vue @preserve -->

<template>
  <nav class="job-selector-area" data-component-name="JobSelectorArea">
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
            'drag-over': job.id === dragOverJobId,
          }"
          button-style-class="trans-btn btn-darkr can-become-active"
          :data-job-id="job.id"
          :data-name="'job-' + job.id"
          :draggable="true"
          @click="selectJob(job.id)"
          @dragend="onDragEnd"
          @dragstart="onDragStart($event, job.id)"
          @drop.stop.prevent="onDrop(job.id)"
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
        </CustomButton>
      </div>
    </OverlayScrollbarsComponent>

    <div class="job-selector-btn-wrapper">
      <div class="job-selector-btns-start">
        <CustomButton
          class="add-job-btn"
          button-style-class="trans-btn"
          data-name="add-job-btn"
          first-icon-name="mdi:add"
          :first-icon-size="24"
          @click="addJob"
        />
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
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useJobsStore } from "@/stores/jobsStore";
import type { Job } from "@/stores/jobsStore";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useThemeStore } from "@/stores/themeStore";
import { useUiStore } from "@/stores/uiStore";
import { useModalsStore } from "@/stores/modalsStore";
import type { ModalOptions } from "@/types/modal";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logInteraction } from "@/utils/loggers";

const themeStore = useThemeStore();
const jobsStore = useJobsStore();
const uiStore = useUiStore();
const modalsStore = useModalsStore();

const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));
const jobsList = computed(() => jobsStore.jobs);

const draggedJobId = ref<number | null>(null);
const dragOverJobId = ref<number | null>(null);

onMounted(() => {
  jobsStore.initialize();
});

watch(
  () => jobsStore.jobs,
  (newJobs: Job[]) => {
    if (!jobsStore.selectedJobId || !newJobs.some((job: Job) => job.id === jobsStore.selectedJobId)) {
      if (newJobs.length > 0) {
        jobsStore.selectJob(newJobs[0].id);
      }
    }
  },
  { immediate: true, deep: true }
);

// Add/remove a global class when dragging starts/ends.
watch(draggedJobId, (currentValue, oldValue) => {
  if (currentValue !== null && oldValue === null) {
    document.body.classList.add("is-dragging");
  } else if (currentValue === null && oldValue !== null) {
    document.body.classList.remove("is-dragging");
  }
});

const selectJob = (jobId: number): void => {
  // Prevent selection change when dragging
  if (draggedJobId.value !== null) return;
  jobsStore.selectJob(jobId);
};

const addJob = (): void => {
  jobsStore.addJob();
  const newJobId: number = Math.max(...jobsStore.jobs.map((j: Job) => j.id));
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

  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, { description: modalOptions.description }, (action) => {
    if (action === "proceed") {
      const currentSelectedJobId = jobsStore.selectedJobId;
      jobsStore.removeJobs([jobId], currentSelectedJobId);
      nextTick();
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
    }
  });
};

// --- Drag and Drop Handlers ---

const onDragStart = (event: DragEvent, jobId: number): void => {
  if (DEBUG && debugConfig.logDragAndDrop) logInteraction("JobSelectorArea", `Drag Start for job ID: ${jobId}`);

  // This is necessary to initiate the drag operation and set the cursor correctly.
  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", String(jobId));
    event.dataTransfer.effectAllowed = "move";
  }

  draggedJobId.value = jobId;
};

const handleDragOver = (event: DragEvent): void => {
  const target = (event.target as HTMLElement).closest(".job-selector");

  if (target instanceof HTMLElement && target.dataset.jobId) {
    const targetId = Number(target.dataset.jobId);
    if (targetId !== draggedJobId.value) {
      if (dragOverJobId.value !== targetId) {
        dragOverJobId.value = targetId;
      }
    }
  } else {
    if (dragOverJobId.value !== null) {
      dragOverJobId.value = null;
    }
  }
};

const handleDragLeave = (): void => {
  if (DEBUG && debugConfig.logDragAndDrop) logInteraction("JobSelectorArea", `Drag Leave`);
  dragOverJobId.value = null;
};

const onDrop = (targetJobId: number | null): void => {
  if (DEBUG && debugConfig.logDragAndDrop)
    logInteraction("JobSelectorArea", `Drop on job ID: ${targetJobId}. Dragged job ID: ${draggedJobId.value}`);
  if (draggedJobId.value === null) return;

  const fromIndex = jobsStore.jobs.findIndex((j) => j.id === draggedJobId.value);
  const toIndex = targetJobId === null ? jobsStore.jobs.length - 1 : jobsStore.jobs.findIndex((j) => j.id === targetJobId);

  if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
    jobsStore.moveJob(fromIndex, toIndex);
  }

  draggedJobId.value = null;
  dragOverJobId.value = null;
};

const onDragEnd = (): void => {
  if (DEBUG && debugConfig.logDragAndDrop) logInteraction("JobSelectorArea", `Drag End`);
  draggedJobId.value = null;
  dragOverJobId.value = null;
};

// --- Dropdown Reorder Handler ---

const reorderJob = (index: number, direction: "left" | "right"): void => {
  const fromIndex = index;
  const toIndex = direction === "left" ? index - 1 : index + 1;
  jobsStore.moveJob(fromIndex, toIndex);
};
</script>

<style scoped>
.job-selector-area {
  display: grid;
  grid-column: 1;
  grid-row: 1;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr;
  padding-inline: var(--pad-in);

  /*
    This rule prevents the OverlayScrollbars viewport from intercepting
    drag events, which would otherwise prevent drop from working.
  */
  :deep(body.is-dragging .os-viewport) {
    pointer-events: none;
  }

  &:has(.job-selector-btn-wrapper:empty) {
    grid-template-columns: auto auto;
  }

  &:has(.job-selector-btn-wrapper:empty) {
    grid-template-columns: 1fr;
  }

  .job-selector-btn-wrapper {
    align-items: center;
    display: flex;
    justify-content: space-between;

    .job-selector-btns-start {
      display: flex;
    }

    .job-selector-btns-end {
      display: flex;
    }

    &:empty {
      display: none;
    }
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

    & > :deep(button.job-selector) {
      --btn-line-thickness: 2px;
      --line-orientation: horizontal;
      --line-position: end;

      border-radius: var(--brdr-rad-smalr);
      min-height: 50px;
      min-width: fit-content;
      padding: 0;
      position: relative;
      transition: opacity 0.2s ease-in-out;

      /* Style for the job being dragged */
      &.is-dragged {
        opacity: 0.4;
      }

      /* Style for the potential drop target */
      &.drag-over {
        &::after {
          background-color: hsla(var(--accent-hsl), 0.75);
          block-size: 100%;
          content: "";
          inset-inline-start: -2px;
          inline-size: 4px;
          position: absolute;
          z-index: 1;
        }
      }

      > .visual-style,
      &:before {
        --visual-style-inset: 8px;
      }

      > .visual-style {
        transform-origin: bottom;
      }

      &.active {
        > .visual-style {
          background-color: var(--btn-bg-hvr-clr);
          border-color: var(--btn-bg-hvr-clr);
        }
      }

      &:hover > .button-content .job-sel-options .dropdown-menu,
      > .button-content .job-sel-options .dropdown-menu.active {
        > button.options-btn {
          opacity: 1;
        }
      }

      > .button-content {
        column-gap: 8px;
        display: grid;
        grid-row: 1;
        grid-template-areas: "job-sel-icon job-sel-info job-sel-options";
        grid-template-columns: auto 1fr auto;
        grid-template-rows: auto;
        padding-inline-end: var(--pad-in);
        padding-inline-start: calc(var(--pad-in) * 1.5);

        .job-sel-icon {
          align-items: center;
          display: flex;
          grid-area: job-sel-icon;
          justify-content: center;
          width: 24px;
        }

        .job-info {
          align-items: start;
          display: flex;
          flex-direction: column;
          grid-area: job-sel-info;
          justify-content: center;
          white-space: nowrap;

          .job-sel-title {
            line-height: 1;
            white-space: nowrap;
          }

          .job-sel-num-files {
            font-size: 0.8rem;
            line-height: 1;
            white-space: nowrap;
          }
        }

        .job-sel-options {
          align-items: center;
          grid-area: job-sel-options;
          justify-content: center;
          line-height: 0;
          padding: 0;
          white-space: nowrap;

          .dropdown-menu {
            &:deep(button.options-btn) {
              opacity: 0;
            }
          }

          /* the dropdown options-btn inside the job-selector button */
          &:deep(.dropdown-menu) {
            .custom-button {
              &:deep(.visual-style) {
                --btn-bg-hvr-clr: var(--btn-bg-hvr-clr-liter);
              }
            }
          }
        }
      }
    }
  }
}
</style>
