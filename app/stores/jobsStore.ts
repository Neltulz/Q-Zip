// stores/jobsStore.ts @preserve

/** @preserve
 * This store manages jobs and global compression settings for the
 * application. It handles job creation, file management within jobs,
 * reordering, and settings updates using Pinia.
 */
// @preserve

import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import { getFileDetails } from "@/utils/fileUtils";
import { DEBUG, debugConfig } from "@/utils/debugConfig";

// Type definitions are now exported to be available across the application.
export interface FileItem {
  path: string;
  name: string;
  type: string;
  size: number;
  parentPath: string;
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

    // Actions
    function initialize(): void {
      if (jobs.value.length === 0) {
        addJob();
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Initialized with first job`);
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

    async function addFilesToJob(jobId: number, paths: string[]): Promise<number> {
      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        let addedCount = 0;
        for (const path of paths) {
          const fileDetails = await getFileDetails(path);
          // Check if getFileDetails returned a valid object (not null)
          if (fileDetails && !job.files.some((file: FileItem) => file.path === fileDetails.path)) {
            job.files.push(fileDetails);
            addedCount++;
          }
        }
        
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Added ${addedCount} of ${paths.length} attempted files to job ${jobId}`);
        }
        return addedCount;
      }
      return 0;
    }

    function addClipboardFilesToJob(jobId: number, files: FileItem[]): void {
      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        let addedCount = 0;
        files.forEach((fileToAdd: FileItem) => {
          if (!job.files.some((file: FileItem) => file.path === fileToAdd.path)) {
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
        // MODIFIED: Safely access jobs.value[0]?.id
        selectJob(jobs.value[0]?.id ?? null); // Use optional chaining and nullish coalescing
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Removed all jobs and added a new one`);
        }
        return;
      }

      jobs.value = filteredJobs.map((job, index) => ({
        ...job,
        id: index + 1,
      }));

      // MODIFIED: Added null check for currentSelectedJobId
      if (currentSelectedJobId !== null) {
        const isSelectedJobRemoved = idsToRemove.includes(currentSelectedJobId);
        if (!isSelectedJobRemoved) {
          const oldIndex = oldJobs.findIndex((job) => job.id === currentSelectedJobId);
          if (oldIndex !== -1) {
            // MODIFIED: Ensure oldJobs[oldIndex - 1] is not undefined before accessing id
            selectJob(oldIndex - idsToRemove.filter((id) => id < currentSelectedJobId).length + 1);
          }
        } else {
          const oldIndex = oldJobs.findIndex((job) => job.id === currentSelectedJobId);
          if (oldIndex > 0) {
            // MODIFIED: Safely access oldJobs[oldIndex - 1]?.id for filtering
            // Ensure oldJobs[oldIndex - 1] is not undefined for the filter condition
            const newIndex = oldIndex - 1 - idsToRemove.filter((id) => {
              const prevJob = oldJobs[oldIndex - 1];
              return prevJob && id < prevJob.id; // Explicitly check prevJob
            }).length;
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
      // MODIFIED: Safely access jobs.value[0]?.id
      selectJob(jobs.value[0]?.id ?? null); // Use optional chaining and nullish coalescing
      if (DEBUG && debugConfig.logStoreActions) {
        console.log(`Removed all jobs and reset to one job`);
      }
    }

    function resetJobs(): void {
      jobs.value = [];
      addJob();
      // MODIFIED: Safely access jobs.value[0]?.id
      selectJob(jobs.value[0]?.id ?? null); // Use optional chaining and nullish coalescing
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
        job.files = job.files.filter((file: FileItem) => !paths.includes(file.path));
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
      // MODIFIED: Check if jobToMove is defined before splicing
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
        await addFilesToJob(newJobId, [path]);
      }
      // MODIFIED: Safely access newJobIds[0] and ensure it's number | null
      selectJob(newJobIds.length > 0 ? newJobIds[0] : null);
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
      createJobsFromPaths,
    };
  },
  {
    persist: {
      key: "qzip-jobs",
    },
  }
);
