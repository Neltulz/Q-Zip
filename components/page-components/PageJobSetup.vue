<!-- components/page-components/PageJobSetup.vue @preserve -->
<template>
  <div id="main-page" class="page" data-component-name="PageJobSetup">
    <PageHeader>
      <template #icon>
        <Icon name="mdi:briefcase-outline" size="64" />
      </template>
      <template #big-text>Job Setup</template>
      <template #description>This is where you'll setup jobs for archival creation.</template>
    </PageHeader>

    <div ref="mainContent" class="main-content" :style="mainContentStyles">
      <JobsSection ref="jobsSection" />
      <div ref="resizeDivider" class="resize-divider" />
      <CompressionSectionNew ref="compressSection" />
    </div>

    <BottomButtons div-id="main-bottom-bg">
      <CustomButton
        v-flash-on-click
        button-style-class=""
        data-name="next-btn"
        first-icon-name="mdi:arrow-right-thick"
        @click="navStore.setActivePage('JobQueue')"
      >
        Next
      </CustomButton>
    </BottomButtons>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type ComponentPublicInstance } from "vue";
import { useUiStore } from "@/stores/uiStore";
import { useNavigationStore } from "@/stores/navigationStore";

// Store setup
const uiStore = useUiStore();
const navStore = useNavigationStore();

// Refs for DOM elements and components
const mainContent = ref<HTMLElement | null>(null);
const jobsSection = ref<ComponentPublicInstance | null>(null);
const compressSection = ref<ComponentPublicInstance | null>(null);
const resizeDivider = ref<HTMLElement | null>(null);

// Reactive styles from store
const mainContentStyles = computed(() => ({
  "--jobs-section-width": uiStore.jobsSectionWidth,
  "--compress-section-width": uiStore.compressSectionWidth,
}));

// Resizing state
let isResizing: boolean = false;
let startX: number = 0;
let startJobsWidth: number = 0;
let startCompressWidth: number = 0;

const onMouseDown = (event: MouseEvent): void => {
  event.preventDefault();
  isResizing = true;
  startX = event.clientX;
  startJobsWidth = jobsSection.value?.$el.offsetWidth ?? 0;
  startCompressWidth = compressSection.value?.$el.offsetWidth ?? 0;
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const onMouseMove = (event: MouseEvent): void => {
  if (!isResizing) return;
  event.preventDefault();
  const deltaX: number = event.clientX - startX;
  const newJobsWidth: number = startJobsWidth + deltaX;
  const newCompressWidth: number = startCompressWidth - deltaX;
  if (mainContent.value) {
    mainContent.value.style.gridTemplateColumns = `minmax(350px, ${newJobsWidth}px) 10px minmax(350px, ${newCompressWidth}px)`;
  }
};

const onMouseUp = (): void => {
  if (!isResizing) return;
  isResizing = false;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);

  const finalJobsWidth: number = jobsSection.value?.$el.offsetWidth ?? 350;
  const finalCompressWidth: number = compressSection.value?.$el.offsetWidth ?? 350;
  const totalWidth: number = finalJobsWidth + finalCompressWidth;
  const dividerPosition: number = (finalJobsWidth / totalWidth) * 100;

  let newJobsWidthStr: string;
  let newCompressWidthStr: string;

  if (dividerPosition < 33.33) {
    newJobsWidthStr = `${finalJobsWidth}px`;
    newCompressWidthStr = "1fr";
  } else if (dividerPosition > 66.66) {
    newJobsWidthStr = "1fr";
    newCompressWidthStr = `${finalCompressWidth}px`;
  } else {
    const jobsFraction: number = (finalJobsWidth / totalWidth) * 5;
    const compressFraction: number = (finalCompressWidth / totalWidth) * 5;
    const roundedJobs: number = Math.round(jobsFraction * 1000) / 1000;
    const roundedCompress: number = Math.round(compressFraction * 1000) / 1000;
    newJobsWidthStr = `${roundedJobs}fr`;
    newCompressWidthStr = `${roundedCompress}fr`;
  }

  // Update the store with the new widths
  uiStore.setPanelWidths(newJobsWidthStr, newCompressWidthStr);

  // Remove inline grid-template-columns to let CSS variables take effect
  if (mainContent.value) {
    mainContent.value.style.gridTemplateColumns = "";
  }
};

onMounted((): void => {
  if (resizeDivider.value) {
    resizeDivider.value.addEventListener("mousedown", onMouseDown);
  }
});

onUnmounted((): void => {
  if (resizeDivider.value) {
    resizeDivider.value.removeEventListener("mousedown", onMouseDown);
  }
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>

<style scoped>
#main-page {
  .main-content {
    --jobs-section-width: 3fr;
    --compress-section-width: 2fr;

    display: grid;
    grid-template-areas: "jobs-section resize-divider compression-section";
    grid-template-columns: minmax(350px, var(--jobs-section-width)) 10px minmax(350px, var(--compress-section-width));
    grid-template-rows: 1fr;
  }

  .resize-divider {
    align-items: center;
    cursor: col-resize;
    display: flex;
    justify-content: center;

    &:after {
      background-color: var(--txt-clr);
      border-radius: 100px;
      content: "";
      display: block;
      height: var(--min-tch-tgt);
      opacity: 0.125;
      outline: 0px solid var(--txt-clr);
      transition: all 500ms ease;
      width: 2px;
    }

    &:hover {
      &:after {
        height: 50px;
        opacity: 0.75;
        outline-width: 1px;
        transition-duration: 250ms;
      }
    }
  }
}
</style>
