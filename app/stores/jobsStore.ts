// 
// jobsStore.ts
/** @preserve
 * This store manages jobs and global compression settings for the
 * application. It handles job creation, file management within jobs,
 * reordering, and settings updates using Pinia.
 */
// @preserve
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import { getFileDetails, setCancellationFlag, setPauseFlag, setProgressCallback as setFileUtilsProgressCallback } from "@/utils/fileUtils";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logStoreAction } from "@/utils/loggers";
import type { FileItem } from "@/types/types";
// Type definitions are now exported to be available across the application.
export interface CompressionSettings {
  // General
  useInputLocationsForOutput: boolean;
  outputFolder: string;
  createMultipleArchives: boolean;
  ifArchiveExists: string;
  updateMode: string;
  pathMode: string;
  // Compression
  archiveFormat: string;
  compressionLevel: number;
  compressionMethod: string;
  dictionarySize: string;
  wordSize: number | string;
  solidBlockSize: string;
  numCpuThreads: string;
  memoryUsage: string;
  // Advanced
  sfxArchive: string;
  sharedFiles: string;
  fileDeletion: string;
  splitToVolumes: string;
  parameters: string;
  // Encryption
  password: string;
  encryptionMethod: string;
  fileNameEncryption: string;
  // Custom Extension
  useCustomExtension: boolean;
  customExtension: string;
}
export interface Job {
  id: number;
  files: FileItem[];
  settings: Partial<CompressionSettings>;
}
export const defaultGlobalSettings: CompressionSettings = {
  useInputLocationsForOutput: true,
  outputFolder: "",
  createMultipleArchives: false,
  ifArchiveExists: "rename_new",
  updateMode: "add_replace",
  pathMode: "relative",
  archiveFormat: "7z",
  compressionLevel: 5,
  compressionMethod: "LZMA2",
  dictionarySize: "32 MB",
  wordSize: 32,
  solidBlockSize: "4 GB",
  numCpuThreads: "Auto",
  memoryUsage: "80%",
  sfxArchive: "archive",
  sharedFiles: "no_compression",
  fileDeletion: "no_deletion",
  splitToVolumes: "",
  parameters: "",
  password: "",
  encryptionMethod: "AES-256",
  fileNameEncryption: "use_encryption",
  useCustomExtension: false,
  customExtension: "",
};
export const useJobsStore = defineStore(
  "jobs",
  () => {
    // State
    const jobs: Ref<Job[]> = ref([]);
    const globalSettings: Ref<CompressionSettings> = ref({
      ...defaultGlobalSettings,
    });
    const selectedJobId: Ref<number | null> = ref(null);
    // Cancellation and pause support
    let currentOperationCancelled = false;
    let currentOperationJobId: number | null = null;
    let cancelledPaths: string[] = [];
    let cancelStartTime: number | null = null;
    let progressCallback: ((current: number, total: number, message: string) => void) | null = null;
    let isOperationPaused = false;
    // Actions
    function initialize(): void {
      if (jobs.value.length === 0) {
        const newJobId = addJob();
        selectJob(newJobId);
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Initialized with first job and selected it.`);
        }
      } else if (!selectedJobId.value || !jobs.value.some(j => j.id === selectedJobId.value)) {
        if (jobs.value[0]) {
          selectJob(jobs.value[0].id);
        }
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Selected job was invalid. Defaulting to first job.`);
        }
      }
    }
    function addJob(): number {
      const newId: number = jobs.value.length > 0 ? Math.max(...jobs.value.map((j) => j.id)) + 1 : 1;
      jobs.value.push({
        id: newId,
        files: [],
        settings: {},
      });
      if (DEBUG && debugConfig.logStoreActions) {
        console.log(`Added job with ID: ${newId}`);
      }
      return newId;
    }
    function cancelCurrentOperation(): void {
      if (currentOperationJobId !== null) {
        cancelStartTime = performance.now();
        currentOperationCancelled = true;
        isOperationPaused = false; // Reset pause state when cancelling
        setCancellationFlag(true); // Set the flag in fileUtils
        setPauseFlag(false); // Reset pause flag in fileUtils
        logStoreAction("jobsStore", `Cancelling current operation for job ${currentOperationJobId} at ${new Date().toISOString()}`);
      }
    }
    function pauseCurrentOperation(): void {
      if (currentOperationJobId !== null) {
        isOperationPaused = true;
        setPauseFlag(true); // Set the flag in fileUtils
        logStoreAction("jobsStore", `Pausing current operation for job ${currentOperationJobId} at ${new Date().toISOString()}`);
      }
    }
    function resumeCurrentOperation(): void {
      if (currentOperationJobId !== null) {
        isOperationPaused = false;
        setPauseFlag(false); // Clear the flag in fileUtils
        logStoreAction("jobsStore", `Resuming current operation for job ${currentOperationJobId} at ${new Date().toISOString()}`);
      }
    }
    function setProgressCallbackInternal(callback: ((current: number, total: number, message: string) => void) | null): void {
      progressCallback = callback;
      setFileUtilsProgressCallback(callback); // Set the callback in fileUtils
    }
    function getCancelledPaths(): string[] {
      return [...cancelledPaths];
    }
    function clearCancelledPaths(): void {
      cancelledPaths = [];
    }
    async function addFilesToJob(jobId: number, paths: string[]): Promise<number> {
      const job = jobs.value.find((j) => j.id === jobId);
      if (!job) return 0;
      // Set up cancellation tracking for this operation
      currentOperationCancelled = false;
      currentOperationJobId = jobId;
      cancelledPaths = []; // Reset cancelled paths for this operation
      setCancellationFlag(false); // Reset the flag in fileUtils
      const startTime = performance.now();
      const operationStartTime = new Date().toISOString();
      logStoreAction("jobsStore", `Starting to process ${paths.length} items for job ${jobId} at ${operationStartTime}...`);
      const existingFilePaths = new Set(job.files.map((file) => file.path));
      const newPaths = paths.filter(path => !existingFilePaths.has(path));
      if (newPaths.length === 0) {
        logStoreAction("jobsStore", "No new items to add, all paths already exist in job");
        return 0;
      }
      let addedCount = 0;
      const processedPaths: string[] = [];
      const newFileDetails: FileItem[] = []; // Collect all file details before updating
      // Process items one by one with frequent cancellation checks
      for (let i = 0; i < newPaths.length; i++) {
        const path = newPaths[i];
        if (!path) continue; // Skip undefined paths
        // Check for cancellation and pause more frequently for better responsiveness
        if (i % 5 === 0 || i === newPaths.length - 1) {
          if (currentOperationCancelled) {
            const cancelTime = performance.now();
            const timeSinceStart = cancelTime - startTime;
            const cancelDelay = cancelTime - (cancelStartTime || startTime);
            logStoreAction("jobsStore", `Item processing cancelled for job ${jobId} after ${timeSinceStart.toFixed(2)}ms. Cancellation delay: ${cancelDelay.toFixed(2)}ms. Processed ${processedPaths.length}/${newPaths.length} items. Cancelled paths: ${newPaths.length - processedPaths.length}`);
            // Add remaining paths to cancelled paths
            cancelledPaths = newPaths.slice(i);
            // Reset operation state when cancelled
            currentOperationCancelled = false;
            currentOperationJobId = null;
            isOperationPaused = false;
            setCancellationFlag(false);
            setPauseFlag(false);
            return processedPaths.length;
          }
          // Check for pause and wait if paused
          while (isOperationPaused && !currentOperationCancelled) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before checking again
          }
        }
        try {
          // Update progress for the current item
          if (progressCallback) {
            progressCallback(i + 1, newPaths.length, `Processing: ${path.split('\\').pop() || path.split('/').pop() || path}`);
          }
          // Get actual file details using the fileUtils function
          const fileDetails = await getFileDetails(path);
          // Check for cancellation after getting file details
          if (currentOperationCancelled) {
            const cancelTime = performance.now();
            const timeSinceStart = cancelTime - startTime;
            logStoreAction("jobsStore", `Item processing cancelled for job ${jobId} after ${timeSinceStart.toFixed(2)}ms. Processed ${processedPaths.length}/${newPaths.length} items. Cancelled paths: ${newPaths.length - processedPaths.length}`);
            // Add remaining paths to cancelled paths
            cancelledPaths = newPaths.slice(i);
            // Reset operation state when cancelled
            currentOperationCancelled = false;
            currentOperationJobId = null;
            isOperationPaused = false;
            setCancellationFlag(false);
            setPauseFlag(false);
            return processedPaths.length;
          }
          if (fileDetails) {
            newFileDetails.push(fileDetails); // Collect instead of pushing immediately
            processedPaths.push(path);
            addedCount++;
            // Log progress every 10 items (more frequent for folder scanning)
            if (addedCount % 10 === 0) {
              const currentTime = performance.now();
              const elapsed = currentTime - startTime;
              const rate = addedCount / (elapsed / 1000);
              logStoreAction("jobsStore", `Progress: ${addedCount}/${newPaths.length} items processed in ${elapsed.toFixed(2)}ms (${rate.toFixed(2)} items/sec)`);
            }
          } else {
            logStoreAction("jobsStore", `Could not get details for item ${path}, skipping`);
          }
        } catch (error) {
          if (error instanceof Error && error.message === "Operation cancelled") {
            // Re-throw cancellation errors to be handled by the caller
            throw error;
          }
          logStoreAction("jobsStore", `Error processing item ${path}: ${error}`);
        }
      }
      // Batch update: add all collected file details at once
      if (newFileDetails.length > 0) {
        job.files.push(...newFileDetails);
      }
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const rate = addedCount / (totalTime / 1000);
      logStoreAction("jobsStore", `Completed processing ${addedCount} items for job ${jobId} in ${totalTime.toFixed(2)}ms (${rate.toFixed(2)} items/sec)`);
      // Reset operation state when completed
      currentOperationCancelled = false;
      currentOperationJobId = null;
      isOperationPaused = false;
      setCancellationFlag(false);
      setPauseFlag(false);
      return addedCount;
    }
    function addClipboardFilesToJob(jobId: number, files: FileItem[]): void {
      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        const existingFilePaths = new Set(job.files.map((file) => file.path));
        const newFiles = files.filter((fileToAdd) => !existingFilePaths.has(fileToAdd.path));
        if (newFiles.length > 0) {
          // Use spread operator to ensure reactivity by creating a new array reference
          job.files = [...job.files, ...newFiles];
          if (DEBUG && debugConfig.logStoreActions) {
            console.log(`Added ${newFiles.length} files from clipboard to job ${jobId}`);
          }
        }
      }
    }
    function removeJobs(idsToRemove: number[], currentSelectedJobId: number | null): void {
      const oldJobs = [...jobs.value];
      const filteredJobs = jobs.value.filter((job) => !idsToRemove.includes(job.id));
      if (filteredJobs.length === 0) {
        jobs.value = [];
        addJob();
        selectJob(jobs.value[0]?.id ?? null);
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Removed all jobs and added a new one`);
        }
        return;
      }
      jobs.value = filteredJobs.map((job, index) => ({
        ...job,
        id: index + 1,
      }));
      if (currentSelectedJobId !== null) {
        const isSelectedJobRemoved = idsToRemove.includes(currentSelectedJobId);
        if (!isSelectedJobRemoved) {
          const oldIndex = oldJobs.findIndex((job) => job.id === currentSelectedJobId);
          if (oldIndex !== -1) {
            selectJob(oldIndex - idsToRemove.filter((id) => id < currentSelectedJobId).length + 1);
          }
        } else {
          const oldIndex = oldJobs.findIndex((job) => job.id === currentSelectedJobId);
          if (oldIndex > 0) {
            const prevJob = oldJobs[oldIndex - 1];
            const newIndex = oldIndex - 1 - idsToRemove.filter((id) => prevJob && id < prevJob.id).length;
            selectJob(newIndex + 1);
          } else {
            selectJob(1);
          }
        }
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Removed jobs: ${idsToRemove}, new selectedJobId: ${selectedJobId.value}`);
        }
      }
    }
    function removeAllJobs(): void {
      jobs.value = [];
      addJob();
      selectJob(jobs.value[0]?.id ?? null);
      if (DEBUG && debugConfig.logStoreActions) {
        console.log(`Removed all jobs and reset to one job`);
      }
    }
    function resetJobs(): void {
      jobs.value = [];
      addJob();
      selectJob(jobs.value[0]?.id ?? null);
      if (DEBUG && debugConfig.logStoreActions) {
        console.log(`Reset jobs store to initial state`);
      }
    }
    function resetGlobalSettings(): void {
      globalSettings.value = { ...defaultGlobalSettings };
      if (DEBUG && debugConfig.logStoreActions) {
        console.log("Reset global settings to default");
      }
    }
    function removeFilesFromJob(jobId: number, paths: string[]): void {
      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        const pathsToRemove = new Set(paths);
        job.files = job.files.filter((file) => !pathsToRemove.has(file.path));
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Removed ${paths.length} files from job ${jobId}`);
        }
      }
    }
    function selectJob(jobId: number | null): void {
      selectedJobId.value = jobId;
      if (DEBUG && debugConfig.logStoreActions) {
        console.log(`Selected job ID: ${jobId}`);
      }
    }
    function updateGlobalSettings(newSettings: Partial<CompressionSettings>): void {
      globalSettings.value = { ...globalSettings.value, ...newSettings };
    }
    function updateJobSettings(jobId: number, newSettings: Partial<CompressionSettings>): void {
      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        job.settings = { ...job.settings, ...newSettings };
      }
    }
    function moveFilesBetweenJobs(sourceJobId: number, targetJobId: number, filePaths: string[]): void {
      const sourceJob = jobs.value.find((j) => j.id === sourceJobId);
      const targetJob = jobs.value.find((j) => j.id === targetJobId);
      if (sourceJob && targetJob) {
        const filesToMove = sourceJob.files.filter((f) => filePaths.includes(f.path));
        const newFilesForTarget = filesToMove.filter((file) => !targetJob.files.some((f) => f.path === file.path));
        // Use spread operator to ensure reactivity by creating new array references
        targetJob.files = [...targetJob.files, ...newFilesForTarget];
        sourceJob.files = sourceJob.files.filter((f) => !filePaths.includes(f.path));
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Moved ${filesToMove.length} files from job ${sourceJobId} to job ${targetJobId}`);
        }
      }
    }
    function copyFilesToJob(sourceJobId: number, targetJobId: number, filePaths: string[]): void {
      const sourceJob = jobs.value.find((j) => j.id === sourceJobId);
      const targetJob = jobs.value.find((j) => j.id === targetJobId);
      if (sourceJob && targetJob) {
        const filesToCopy = sourceJob.files.filter((f) => filePaths.includes(f.path));
        const newFilesForTarget = filesToCopy.filter((file) => !targetJob.files.some((f) => f.path === file.path));
        // Use spread operator to ensure reactivity by creating new array references
        targetJob.files = [...targetJob.files, ...newFilesForTarget];
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Copied ${filesToCopy.length} files from job ${sourceJobId} to job ${targetJobId}`);
        }
      }
    }
    function moveJob(fromIndex: number, toIndex: number): void {
      if (fromIndex < 0 || fromIndex >= jobs.value.length || toIndex < 0 || toIndex >= jobs.value.length) {
        if (DEBUG) {
          console.error(`Invalid indices for moveJob: from ${fromIndex}, to ${toIndex}`);
        }
        return;
      }
      const [jobToMove] = jobs.value.splice(fromIndex, 1);
      if (jobToMove) {
        jobs.value.splice(toIndex, 0, jobToMove);
      }
      if (DEBUG && debugConfig.logStoreActions) {
        console.log(`Moved job from index ${fromIndex} to ${toIndex}`);
      }
    }
    function clearJob(jobId: number): void {
      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        // Clear all files from the job
        job.files = [];
        // Reset job-specific settings to empty object (will inherit from global settings)
        job.settings = {};
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Cleared job ${jobId}: removed all files and reset settings`);
        }
      }
    }
    async function createJobsFromPaths(paths: string[]): Promise<void> {
      const newJobIds: number[] = [];
      for (const path of paths) {
        const newJobId = addJob();
        newJobIds.push(newJobId);
        await addFilesToJob(newJobId, [path]);
      }
      // FIX: Use nullish coalescing operator `??` to ensure type is `number | null`.
      selectJob(newJobIds[0] ?? null);
      if (DEBUG && debugConfig.logStoreActions) {
        console.log(`Created ${newJobIds.length} new jobs from paths.`);
      }
    }
    return {
      jobs,
      globalSettings,
      selectedJobId,
      initialize,
      addJob,
      addFilesToJob,
      addClipboardFilesToJob,
      removeJobs,
      removeAllJobs,
      resetJobs,
      resetGlobalSettings,
      removeFilesFromJob,
      selectJob,
      updateGlobalSettings,
      updateJobSettings,
      moveFilesBetweenJobs,
      copyFilesToJob,
      moveJob,
      clearJob,
      createJobsFromPaths,
      cancelCurrentOperation,
      pauseCurrentOperation,
      resumeCurrentOperation,
      getCancelledPaths,
      clearCancelledPaths,
      setProgressCallback: setProgressCallbackInternal,
    };
  },
  {
    persist: {
      key: "qzip-jobs",
    },
  }
);
