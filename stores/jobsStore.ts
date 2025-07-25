// stores/jobsStore.ts @preserve

/** @preserve
 * This store manages jobs and global compression settings for the
 * application. It handles job creation, file management within jobs,
 * reordering, and settings updates using Pinia.
 *
 * Key Features:
 * - `jobs`: Array of jobs, each containing files and settings.
 * - `globalSettings`: Default compression settings applied globally.
 * - `selectedJobId`: Tracks the currently selected job.
 * - Actions to add, remove, reorder, and manage jobs and files.
 *
 * Usage Example:
 *
 * vue
 * <template>
 * <div>
 * <button @click="addNewJob">Add Job</button>
 * <button @click="selectJob(1)">Select Job 1</button>
 * <button @click="moveJob(0, 1)">Move First Job</button>
 * </div>
 * </template>
 *
 * <script setup>
 * import { useJobsStore } from '@/stores/jobsStore'
 * const jobsStore = useJobsStore()
 *
 * const addNewJob = () => jobsStore.addJob()
 * const selectJob = (id: number) => jobsStore.selectJob(id)
 * const moveJob = (from, to) => jobsStore.moveJob(from, to)
 * </script>
 *
 * Used in files:
 * ArchiveConfigAdvanced.vue, ArchiveConfigCompress.vue,
 * ArchiveConfigEncrypt.vue, ArchiveConfigGeneral.vue,
 * CompressionSection.vue, JobSelectorArea.vue
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

    async function addFilesToJob(jobId: number, paths: string[]): Promise<void> {
      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        const newFiles = await Promise.all(paths.map(getFileDetails));
        const validNewFiles = newFiles.filter(
          (file): file is FileItem =>
            file != null &&
            typeof file.path === "string" &&
            typeof file.name === "string" &&
            typeof file.size === "number" &&
            typeof file.type === "string" &&
            typeof file.parentPath === "string"
        );
        validNewFiles.forEach((validFile: FileItem) => {
          if (!job.files.some((file: FileItem) => file.path === validFile.path)) {
            job.files.push(validFile);
          }
        });
        if (DEBUG && debugConfig.logStoreActions) {
          console.log(`Added ${validNewFiles.length} files to job ${jobId}`);
        }
      }
    }

    /**
     * Adds FileItem objects directly to a job.
     * Used for pasting from clipboard where FileItem details are already known.
     * @param jobId The ID of the job to add files to.
     * @param files The FileItem objects to add.
     */
    function addClipboardFilesToJob(jobId: number, files: FileItem[]): void {
      const job = jobs.value.find((j) => j.id === jobId);
      if (job) {
        let addedCount = 0; // Changed from const to let
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
        selectJob(jobs.value[0].id);
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
            const newIndex = oldIndex - 1 - idsToRemove.filter((id) => id < oldJobs[oldIndex - 1].id).length;
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
      selectJob(jobs.value[0].id);
      if (DEBUG && debugConfig.logStoreActions) {
        console.log(`Removed all jobs and reset to one job`);
      }
    }

    function resetJobs(): void {
      jobs.value = [];
      addJob();
      selectJob(jobs.value[0].id);
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
        // Add files to target, preventing duplicates
        targetJob.files.push(...filesToMove.filter((file) => !targetJob.files.some((f) => f.path === file.path)));
        // Remove files from source
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
        // Add files to target, preventing duplicates
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
      jobs.value.splice(toIndex, 0, jobToMove);
      if (DEBUG && debugConfig.logStoreActions) {
        console.log(`Moved job from index ${fromIndex} to ${toIndex}`);
      }
    }

    /**
     * Creates a new job for each path provided and adds the corresponding file.
     * @param paths - An array of file/folder paths.
     */
    async function createJobsFromPaths(paths: string[]): Promise<void> {
      const newJobIds: number[] = [];
      for (const path of paths) {
        const newJobId = addJob();
        newJobIds.push(newJobId);
        await addFilesToJob(newJobId, [path]);
      }
      if (newJobIds.length > 0) {
        selectJob(newJobIds[0]);
      }
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
      addClipboardFilesToJob, // Expose the new action
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
