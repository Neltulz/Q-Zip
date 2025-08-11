// stores/uiStore.ts @preserve
import { defineStore } from "pinia";
import { reactive, ref, type Ref } from "vue";
import { useJobsStore, type FileItem } from "@/stores/jobsStore";
import { useClipboardStore } from "./clipboardStore";

export type JobSelectorOrientation = "horizontal" | "vertical";
export type PanelWidth = string;
export type NotificationType = "success" | "warning" | "error" | "info";

export interface NotificationPosition {
  top: number;
  left: number;
  width: number;
}

export interface NotificationMessageDetails {
  sourceJobId: number | null;
  destinationJobId: number;
  filePaths: string[];
  reasons?: Record<string, string>;
}

export interface NotificationMessage {
  text: string;
  type: NotificationType;
  details?: NotificationMessageDetails;
}

export interface Notification {
  id: string;
  title: string;
  messages: NotificationMessage[];
  type: NotificationType;
  duration?: number;
  position?: NotificationPosition;
  timeoutId: number | null;
  isRemoving?: boolean;
}

type PendingNotificationPayload = Omit<Notification, "id" | "timeoutId" | "duration" | "position"> & { duration?: number };

// NEW: Interface for the marquee box state
export interface MarqueeBox {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useUiStore = defineStore(
  "ui",
  () => {
    const jobSelectorOrientation: Ref<JobSelectorOrientation> = ref("horizontal");
    const jobsSectionWidth: Ref<PanelWidth> = ref("3fr");
    const compressSectionWidth: Ref<PanelWidth> = ref("2fr");
    const notifications: Ref<Notification[]> = ref([]);
    const notificationQueue: Ref<Notification[]> = ref([]);
    const pendingNotification = ref<PendingNotificationPayload | null>(null);

    // NEW: Central state for the marquee selection box
    const marqueeBox = reactive<MarqueeBox>({
      visible: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

    // Centralized File Operation Logic
    function handleFileOperation(
      operation: "move" | "copy",
      files: FileItem[],
      targetJobId: number | "new-job",
      options: { sourceJobId?: number | null; conflictResolution?: 'skip' | 'replace' } = {}
    ) {
      const jobsStore = useJobsStore();
      const clipboardStore = useClipboardStore();

      const sourceJobId = options.sourceJobId;
      if (!sourceJobId) return;

      const sourceJob = jobsStore.jobs.find((j) => j.id === sourceJobId);
      if (!sourceJob) return;

      let numericTargetId: number;

      if (targetJobId === "new-job") {
        numericTargetId = jobsStore.addJob();
      } else {
        numericTargetId = targetJobId;
      }

      const targetJob = jobsStore.jobs.find((j) => j.id === numericTargetId);
      if (!targetJob) return;

      const filePaths = files.map(f => f.path);
      const targetFilePaths = new Set(targetJob.files.map((f) => f.path));
      const conflictResolution = options.conflictResolution || (operation === 'move' ? 'replace' : 'skip');

      let newFilePaths: string[];
      let skippedFilePaths: string[];
      let replacedFilePaths: string[];

      if (conflictResolution === 'replace') {
        // For replace, separate new files from existing files that will be replaced
        newFilePaths = filePaths.filter((path) => !targetFilePaths.has(path));
        replacedFilePaths = filePaths.filter((path) => targetFilePaths.has(path));
        skippedFilePaths = [];
      } else {
        // For skip, only process new files
        newFilePaths = filePaths.filter((path) => !targetFilePaths.has(path));
        skippedFilePaths = filePaths.filter((path) => targetFilePaths.has(path));
        replacedFilePaths = [];
      }

      const opPastTense = operation === "move" ? "moved" : "copied";

      const messages: NotificationMessage[] = [];
      let glowType: NotificationType = "info";
      let operationSucceeded = false;
      let operationFailed = false;

      // Handle new files
      if (newFilePaths.length > 0) {
        try {
          if (operation === "move") {
            jobsStore.moveFilesBetweenJobs(sourceJobId, numericTargetId, newFilePaths);
            if (clipboardStore.isCut) {
              clipboardStore.clear();
            }
          } else {
            jobsStore.copyFilesToJob(sourceJobId, numericTargetId, newFilePaths);
          }
          operationSucceeded = true;
          messages.push({
            text: `${newFilePaths.length} item${newFilePaths.length > 1 ? "s" : ""} successfully ${opPastTense}.`,
            type: "success",
            details: { sourceJobId, destinationJobId: numericTargetId, filePaths: newFilePaths },
          });
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
              reasons: Object.fromEntries(newFilePaths.map((path) => [path, "Operation failed. See console for details."])),
            },
          });
        }
      }

      // Handle replaced files
      if (replacedFilePaths.length > 0) {
        try {
          if (operation === "move") {
            jobsStore.moveFilesBetweenJobs(sourceJobId, numericTargetId, replacedFilePaths);
            if (clipboardStore.isCut) {
              clipboardStore.clear();
            }
          } else {
            jobsStore.copyFilesToJob(sourceJobId, numericTargetId, replacedFilePaths);
          }
          operationSucceeded = true;
          messages.push({
            text: `${replacedFilePaths.length} item${replacedFilePaths.length > 1 ? "s" : ""} were replaced.`,
            type: "success",
            details: { sourceJobId, destinationJobId: numericTargetId, filePaths: replacedFilePaths },
          });
        } catch (e) {
          operationFailed = true;
          console.error(`Failed to replace files:`, e);
          messages.push({
            text: `Failed to replace ${replacedFilePaths.length} items.`,
            type: "error",
            details: {
              sourceJobId,
              destinationJobId: numericTargetId,
              filePaths: replacedFilePaths,
              reasons: Object.fromEntries(replacedFilePaths.map((path) => [path, "Operation failed. See console for details."])),
            },
          });
        }
      }

      if (skippedFilePaths.length > 0) {
        const reasons: Record<string, string> = {};
        skippedFilePaths.forEach((path) => {
          reasons[path] = conflictResolution === 'replace' ? "Replaced existing file" : "Already exists in destination";
        });
        messages.push({
          text: `${skippedFilePaths.length} item${skippedFilePaths.length > 1 ? "s" : ""} were skipped.`,
          type: "warning",
          details: { sourceJobId, destinationJobId: numericTargetId, filePaths: skippedFilePaths, reasons },
        });
        if (operation === "move" && clipboardStore.isCut) {
          clipboardStore.clear();
        }
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
        triggerJobNotification({
          title,
          messages,
          type: glowType,
          duration: 8000,
        });
      }

      // NOTE: Previously we switched the UI to the destination job after a
      // successful move/copy. Keep the current job selected so the user remains
      // in context; notifications will inform them of the transfer instead.
    }


    function toggleJobSelectorOrientation(): void {
      jobSelectorOrientation.value = jobSelectorOrientation.value === "horizontal" ? "vertical" : "horizontal";
    }

    function setPanelWidths(jobsWidth: PanelWidth, compressWidth: PanelWidth): void {
      jobsSectionWidth.value = jobsWidth;
      compressSectionWidth.value = compressWidth;
    }

    function addNotification(notification: Omit<Notification, "id" | "timeoutId" | "duration"> & { duration?: number }): void {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duration = notification.duration ?? 5000;

      console.log(`[uiStore] Adding notification:`, {
        id,
        title: notification.title,
        messages: notification.messages,
        duration,
        hasPosition: !!notification.position,
        position: notification.position
      });

      const newNotification: Notification = {
        ...notification,
        id,
        duration,
        timeoutId: null,
      };

      // If there's already a notification for this job, remove it first
      const existingIndex = notifications.value.findIndex(n => n.id === id);
      if (existingIndex !== -1) {
        console.log(`[uiStore] Removing existing notification with same ID:`, id);
        notifications.value.splice(existingIndex, 1);
      }

      notifications.value.push(newNotification);
      console.log(`[uiStore] Notification added. Total notifications:`, notifications.value.length);
      console.log(`[uiStore] Current notifications:`, notifications.value.map(n => ({ id: n.id, title: n.title, hasPosition: !!n.position })));

      // Start the timeout for auto-removal
      const timeoutId = window.setTimeout(() => {
        console.log(`[uiStore] Auto-removing notification:`, id);
        removeNotification(id);
      }, duration);

      newNotification.timeoutId = timeoutId;
    }

    function removeNotification(id: string): void {
      console.log(`[uiStore] Removing notification:`, id);
      const index = notifications.value.findIndex((notification) => notification.id === id);
      if (index !== -1) {
        const notification = notifications.value[index];
        if (!notification) return;

        // Clear the timeout if it exists
        if (notification.timeoutId !== null) {
          clearTimeout(notification.timeoutId);
        }

        // Mark as removing for smooth transition
        notification.isRemoving = true;
        console.log(`[uiStore] Marked notification as removing:`, id);

        // Remove after transition
        setTimeout(() => {
          const removeIndex = notifications.value.findIndex((n) => n.id === id);
          if (removeIndex !== -1) {
            notifications.value.splice(removeIndex, 1);
            console.log(`[uiStore] Notification removed from array. Total notifications:`, notifications.value.length);
          }
        }, 300); // Match the CSS transition duration
      } else {
        console.log(`[uiStore] Notification not found for removal:`, id);
      }
    }

    function pauseNotificationTimeout(id: string): void {
      const notification = notifications.value.find((n) => n.id === id);
      if (notification && notification.timeoutId !== null) {
        clearTimeout(notification.timeoutId);
        notification.timeoutId = null;
      }
    }

    function resumeNotificationTimeout(id: string): void {
      const notification = notifications.value.find((n) => n.id === id);
      if (notification && notification.timeoutId === null) {
        const remainingTime = notification.duration || 5000;
        notification.timeoutId = window.setTimeout(() => {
          removeNotification(id);
        }, remainingTime);
      }
    }

    function triggerJobNotification(notification: PendingNotificationPayload) {
      pendingNotification.value = notification;
    }

    function clearPendingNotification() {
      pendingNotification.value = null;
    }

    function showNextNotification(): void {
      if (notificationQueue.value.length > 0 && notifications.value.length === 0) {
        // Add a small delay before showing the next notification to ensure smooth transition
        setTimeout(() => {
          const nextNotification = notificationQueue.value.shift()!;
          nextNotification.isRemoving = false;
          nextNotification.timeoutId = window.setTimeout(() => {
            removeNotification(nextNotification.id);
          }, nextNotification.duration);
          notifications.value.push(nextNotification);
        }, 200); // Small delay for smooth transition
      }
    }

    function resetUi(): void {
      jobSelectorOrientation.value = "horizontal";
      jobsSectionWidth.value = "3fr";
      compressSectionWidth.value = "2fr";
      notifications.value = [];
      notificationQueue.value = [];
      // Reset marquee box on UI reset
      Object.assign(marqueeBox, { visible: false, x: 0, y: 0, width: 0, height: 0 });
    }

    return {
      jobSelectorOrientation,
      jobsSectionWidth,
      compressSectionWidth,
      notifications,
      notificationQueue,
      pendingNotification,
      marqueeBox, // Expose the new state
      toggleJobSelectorOrientation,
      setPanelWidths,
      addNotification,
      removeNotification,
      pauseNotificationTimeout,
      resumeNotificationTimeout,
      triggerJobNotification,
      clearPendingNotification,
      showNextNotification,
      resetUi,
      handleFileOperation,
    };
  },
  {
    persist: {
      paths: ["jobSelectorOrientation", "jobsSectionWidth", "compressSectionWidth"],
    },
  }
);
