<!-- components/page-components/PageJobSetup.vue @preserve -->
<!-- 
  PageJobSetup.vue @preserve
-->
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
      <JobsSection
        ref="jobsSection"
        @files-added="handleFilesAdded"
        @folders-added="handleFoldersAdded"
      />
      <div ref="resizeDivider" class="resize-divider" />
      <CompressionSection
        ref="compressSection"
        @request-auto-determination="handleManualAutoDetermination"
      />
    </div>
    <BottomButtons div-id="main-bottom-bg">
      <CustomButton
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
import { useJobsStore } from "@/stores/jobsStore";
import { basename, dirname } from "@tauri-apps/api/path";

// Store setup
const uiStore = useUiStore();
const navStore = useNavigationStore();
const jobsStore = useJobsStore();
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

// Auto-determination methods for output location and filename
const determineOutputFromInput = async (inputPaths: string[]): Promise<{ location: string; filename: string }> => {
  if (!inputPaths || inputPaths.length === 0) {
    return { location: "", filename: "" };
  }

  // Use the first path to determine output location and filename
  const firstPath = inputPaths[0];

  try {
    // Get path components with proper error handling
    let parentDir: string = "";
    let baseName: string = "";

    try {
      // @ts-expect-error - Tauri API types are overly strict
      const parentDirResult = await dirname(firstPath);
      parentDir = parentDirResult || "";
    } catch {
      parentDir = "";
    }

    try {
      // @ts-expect-error - Tauri API types are overly strict
      const baseNameResult = await basename(firstPath);
      baseName = baseNameResult || "";
    } catch {
      baseName = "";
    }

    if (!parentDir || !baseName) {
      return { location: "", filename: "" };
    }

    // Check if it's a file (has extension) or folder
    const hasExtension = baseName.includes('.') && baseName.lastIndexOf('.') > 0;

    let outputLocation = parentDir;
    let outputFilename = baseName;

    if (hasExtension) {
      // It's a file - remove extension for the archive name
      const lastDotIndex = baseName.lastIndexOf('.');
      outputFilename = baseName.substring(0, lastDotIndex);
    }
    // If it's a folder, use the folder name as-is for the archive name

    return {
      location: outputLocation,
      filename: outputFilename
    };
  } catch (error) {
    console.error("Error determining output from input:", error);
    return { location: "", filename: "" };
  }
};

const handleFilesAdded = async (filePaths: string[]): Promise<void> => {
  if (!filePaths || filePaths.length === 0) return;

  try {
    const { location, filename } = await determineOutputFromInput(filePaths);

    // Update CompressionSection if we have valid values
    if (location && filename && compressSection.value) {
      // Call the exposed method on CompressionSection
      const compressSectionInstance = compressSection.value as any;
      if (compressSectionInstance.setOutputLocation && compressSectionInstance.setOutputFilename) {
        compressSectionInstance.setOutputLocation(location || "");
        compressSectionInstance.setOutputFilename(filename || "");
        console.log(`Auto-set output: location="${location}", filename="${filename}"`);
      }
    }
  } catch (error) {
    console.error("Error handling files added:", error);
  }
};

const handleFoldersAdded = async (folderPaths: string[]): Promise<void> => {
  // Use the same logic as files for folders
  await handleFilesAdded(folderPaths);
};

const handleManualAutoDetermination = async (): Promise<void> => {
  // Get the current active job's files to determine output from
  const activeJob = jobsStore.jobs.find(job => job.id === jobsStore.selectedJobId);
  if (!activeJob || activeJob.files.length === 0) {
    console.log("No active job or files found for auto-determination");
    return;
  }

  // Use the first file's path to determine output location and filename
  const firstFile = activeJob.files[0];
  if (firstFile && firstFile.path) {
    try {
      const { location, filename } = await determineOutputFromInput([firstFile.path]);

      // Update CompressionSection if we have valid values
      if (location && filename && compressSection.value) {
        const compressSectionInstance = compressSection.value as any;
        if (compressSectionInstance.setOutputLocation && compressSectionInstance.setOutputFilename) {
          compressSectionInstance.setOutputLocation(location || "");
          compressSectionInstance.setOutputFilename(filename || "");
          console.log(`Manual auto-set output: location="${location}", filename="${filename}" from file "${firstFile.path}"`);
        }
      }
    } catch (error) {
      console.error("Error in manual auto-determination:", error);
    }
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
