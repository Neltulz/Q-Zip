/** @preserve
 * This store manages jobs and global compression settings for the
 * application. It handles job creation, file management within jobs,
 * reordering, and settings updates using Pinia.
 */
// @preserve

import { defineStore } from "pinia";
import { ref, type Ref, nextTick } from "vue";
import { getFileDetails, getQuickFileDetails, calculateFolderStatistics } from "@/utils/fileUtils";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logStoreAction } from "@/utils/loggers";

// Type definitions are now exported to be available across the application.
export interface FileItem {
  path: string;
  name: string;
  type: string;
  size: number;
  parentPath: string;
  // Optional fields for timestamps and folder statistics
  modified?: number; // UNIX timestamp
  created?: number; // UNIX timestamp
  files?: number;
  folders?: number;
  filesTotal?: number;
  foldersTotal?: number;
  // Lazy loading support
  isLazyLoaded?: boolean; // Indicates if folder stats are still being calculated
  lazyLoadError?: string; // Error message if lazy loading failed
}

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
    const lazyLoadingUpdateTrigger: Ref<number> = ref(0);

    // Actions
    function initialize(): void {
      if (jobs.value.length === 0) {
        addJob();
        selectJob(jobs.value[0]?.id ?? null);
      }
      
      // Restore lazy loading state for folders that need statistics calculated
      restoreLazyLoadingState();
    }

    /**
     * Restores lazy loading state for folders that were persisted but still need
     * their statistics calculated. This ensures folder information is restored
     * at program startup.
     */
    function restoreLazyLoadingState(): void {
      let totalFoldersToRestore = 0;
      
      for (const job of jobs.value) {
        const foldersToRestore = job.files.filter(file => 
          file.type === "Folder" && 
          (file.isLazyLoaded || (!file.files && !file.folders && !file.filesTotal && !file.foldersTotal))
        );
        
        if (foldersToRestore.length > 0) {
          totalFoldersToRestore += foldersToRestore.length;
          
          // Mark folders as needing lazy loading
          for (const folder of foldersToRestore) {
            folder.isLazyLoaded = true;
            folder.lazyLoadError = undefined;
          }
          
          // Start background calculation for this job's folders
          calculateFolderStatisticsInBackground(job.id, foldersToRestore);
        }
      }
      
      if (totalFoldersToRestore > 0) {
        logStoreAction("jobsStore", `🔄 Restoring lazy loading state for ${totalFoldersToRestore} folders across ${jobs.value.length} jobs`);
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

    async function addFilesToJob(jobId: number, paths: string[]): Promise<number> {
      const job = jobs.value.find((j) => j.id === jobId);
      if (!job) return 0;

      const startTime = performance.now();
      logStoreAction("jobsStore", `Starting to process ${paths.length} files for job ${jobId}...`);

      const existingFilePaths = new Set(job.files.map((file) => file.path));
      const newPaths = paths.filter(path => !existingFilePaths.has(path));

      if (newPaths.length === 0) {
        logStoreAction("jobsStore", "No new files to add, all paths already exist in the job.");
        return 0;
      }

      const fileDetailPromises = newPaths.map(path => getFileDetails(path));
      const fileDetailsResults = await Promise.all(fileDetailPromises);

      const validFilesToAdd = fileDetailsResults.filter((details): details is FileItem => details !== null);

      if (validFilesToAdd.length > 0) {
        job.files.push(...validFilesToAdd);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      logStoreAction("jobsStore", `Added ${validFilesToAdd.length} new files to job ${jobId}.`);
      if (DEBUG) {
        console.log(`[jobsStore] File processing for ${paths.length} paths took ${duration.toFixed(2)} ms.`);
      }

      return validFilesToAdd.length;
    }

    /**
     * Quickly adds files to a job using lazy loading for folder statistics.
     * This function adds files immediately and calculates folder stats in the background.
     * @param jobId The ID of the job to add files to.
     * @param paths Array of file paths to add.
     * @returns An object containing the number of files successfully added and any errors.
     */
    async function addFilesToJobLazy(jobId: number, paths: string[]): Promise<{
      addedCount: number;
      failedPaths: string[];
      errors: Record<string, string>;
    }> {
      const job = jobs.value.find((j) => j.id === jobId);
      if (!job) return { addedCount: 0, failedPaths: paths, errors: {} };

      const startTime = performance.now();
      logStoreAction("jobsStore", `Starting to process ${paths.length} files for job ${jobId} with lazy loading...`);

      const existingFilePaths = new Set(job.files.map((file) => file.path));
      const newPaths = paths.filter(path => !existingFilePaths.has(path));

      if (newPaths.length === 0) {
        logStoreAction("jobsStore", "No new files to add, all paths already exist in the job.");
        return { addedCount: 0, failedPaths: [], errors: {} };
      }

      // Use quick file details for immediate addition
      const fileDetailPromises = newPaths.map(async (path) => {
        try {
          return await getQuickFileDetails(path);
        } catch (error) {
          return null;
        }
      });
      
      const fileDetailsResults = await Promise.all(fileDetailPromises);

      const validFilesToAdd = fileDetailsResults.filter((details): details is FileItem => details !== null);
      const failedPaths: string[] = [];
      const errors: Record<string, string> = {};

      // Track which paths failed
      fileDetailsResults.forEach((result, index) => {
        if (result === null) {
          const path = newPaths[index];
          if (path) {
            failedPaths.push(path);
            errors[path] = "Failed to read file details";
          }
        }
      });

      if (validFilesToAdd.length > 0) {
        job.files.push(...validFilesToAdd);

        // Start background calculation for folders that need lazy loading
        const foldersToCalculate = validFilesToAdd.filter(file => file.isLazyLoaded);
        if (foldersToCalculate.length > 0) {
          calculateFolderStatisticsInBackground(jobId, foldersToCalculate);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      logStoreAction("jobsStore", `Added ${validFilesToAdd.length} new files to job ${jobId} with lazy loading.`);
      if (DEBUG) {
        console.log(`[jobsStore] Quick file processing for ${paths.length} paths took ${duration.toFixed(2)} ms.`);
      }

      return {
        addedCount: validFilesToAdd.length,
        failedPaths,
        errors
      };
    }

    /**
 * Calculates folder statistics in the background for files marked as lazy loaded.
 * This function updates the FileItems in place as calculations complete.
 * @param jobId The ID of the job containing the files.
 * @param foldersToCalculate Array of FileItems that need folder statistics calculated.
 */
    async function calculateFolderStatisticsInBackground(jobId: number, foldersToCalculate: FileItem[]): Promise<void> {
      logStoreAction("jobsStore", `🚀 Starting background calculation for ${foldersToCalculate.length} folders in job ${jobId}...`);

      const totalFolders = foldersToCalculate.length;
      let completedFolders = 0;
      let failedFolders = 0;

      // Process folders individually for real-time updates
      for (const folder of foldersToCalculate) {
        try {
          logStoreAction("jobsStore", `📁 Processing folder: ${folder.name} (${completedFolders + 1}/${totalFolders})`);

          await calculateFolderStatistics(folder);
          completedFolders++;

          logStoreAction("jobsStore", `✅ Completed folder statistics for: ${folder.name} (${completedFolders}/${totalFolders})`);

          // Force Vue to detect the changes by triggering a reactive update
          lazyLoadingUpdateTrigger.value++;
          
          // Use nextTick to ensure DOM updates
          await nextTick();

          // Small delay to keep UI responsive and allow updates
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          failedFolders++;
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          folder.lazyLoadError = errorMessage;
          folder.isLazyLoaded = false;
          
          console.error(`[jobsStore] ❌ Error calculating statistics for ${folder.path}:`, error);
          logStoreAction("jobsStore", `❌ Failed to calculate statistics for: ${folder.name} (${failedFolders} failed)`);
          
          // Still trigger reactive update even for failed calculations
          lazyLoadingUpdateTrigger.value++;
          await nextTick();
        }
      }

      logStoreAction("jobsStore", `🎉 Completed background calculation for job ${jobId}. Success: ${completedFolders}, Failed: ${failedFolders}, Total: ${totalFolders}`);

      // Final trigger to ensure UI updates
      lazyLoadingUpdateTrigger.value++;
      await nextTick();
    }

    function addClipboardFilesToJob(jobId: number, files: FileItem[]): void {
      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        let addedCount = 0;
        files.forEach((fileToAdd) => {
          if (!job.files.some((file) => file.path === fileToAdd.path)) {
            job.files.push(fileToAdd);
            addedCount++;
          }
        });
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Added ${addedCount} files from clipboard to job ${jobId}`);
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
        targetJob.files.push(...filesToMove.filter((file) => !targetJob.files.some((f) => f.path === file.path)));
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
        targetJob.files.push(...filesToCopy.filter((file) => !targetJob.files.some((f) => f.path === file.path)));
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

    async function createJobsFromPaths(paths: string[]): Promise<void> {
      const newJobIds: number[] = [];
      for (const path of paths) {
        const newJobId = addJob();
        newJobIds.push(newJobId);
        const result = await addFilesToJobLazy(newJobId, [path]);
        // Note: We could add error handling here if needed, but for now just log
        if (result.failedPaths.length > 0) {
          console.warn(`Failed to add path ${path} to new job ${newJobId}:`, result.errors[path]);
        }
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
      lazyLoadingUpdateTrigger,
      initialize,
      addJob,
      addFilesToJob,
      addFilesToJobLazy,
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
      createJobsFromPaths,
      restoreLazyLoadingState,
    };
  },
  {
    persist: {
      key: "qzip-jobs",
    },
  }
);
