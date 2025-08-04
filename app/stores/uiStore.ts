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
  id: number;
  title: string;
  messages: NotificationMessage[];
  glowType: NotificationType;
  targetId: number | "new-job";
  duration: number;
  position?: NotificationPosition;
  timeoutId: number | null;
}

type PendingNotificationPayload = Omit<Notification, "id" | "timeoutId" | "position" | "duration"> & { duration?: number };

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
      options: { sourceJobId?: number | null } = {}
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
      const newFilePaths = filePaths.filter((path) => !targetFilePaths.has(path));
      const skippedFilePaths = filePaths.filter((path) => targetFilePaths.has(path));
      const opPastTense = operation === "move" ? "moved" : "copied";

      const messages: NotificationMessage[] = [];
      let glowType: NotificationType = "info";
      let operationSucceeded = false;
      let operationFailed = false;

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

      if (skippedFilePaths.length > 0) {
        const reasons: Record<string, string> = {};
        skippedFilePaths.forEach((path) => {
          reasons[path] = "Already exists in destination";
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
          glowType,
          targetId: numericTargetId,
          duration: 8000,
        });
      }

      if (operationSucceeded || (targetJobId !== "new-job" && skippedFilePaths.length > 0)) {
        jobsStore.selectJob(numericTargetId);
      }
    }


    function toggleJobSelectorOrientation(): void {
      jobSelectorOrientation.value = jobSelectorOrientation.value === "horizontal" ? "vertical" : "horizontal";
    }

    function setPanelWidths(jobsWidth: PanelWidth, compressWidth: PanelWidth): void {
      jobsSectionWidth.value = jobsWidth;
      compressSectionWidth.value = compressWidth;
    }

    function addNotification(notification: Omit<Notification, "id" | "timeoutId" | "duration"> & { duration?: number }): void {
      const id = Date.now() + Math.random();
      const duration = notification.duration ?? 5000;

      const newNotification: Notification = {
        id,
        duration,
        ...notification,
        timeoutId: null,
      };

      newNotification.timeoutId = window.setTimeout(() => {
        removeNotification(id);
      }, duration);

      notifications.value.push(newNotification);
    }

    function removeNotification(id: number): void {
      const index = notifications.value.findIndex((n) => n.id === id);
      if (index > -1) {
        const notification = notifications.value[index];
        if (notification && notification.timeoutId) {
          clearTimeout(notification.timeoutId);
        }
        notifications.value.splice(index, 1);
      }
    }

    function pauseNotificationTimeout(id: number): void {
      const notification = notifications.value.find((n) => n.id === id);
      if (notification && notification.timeoutId) {
        clearTimeout(notification.timeoutId);
        notification.timeoutId = null;
      }
    }

    function resumeNotificationTimeout(id: number): void {
      const notification = notifications.value.find((n) => n.id === id);
      if (notification && notification.timeoutId === null) {
        notification.timeoutId = window.setTimeout(() => {
          removeNotification(id);
        }, notification.duration);
      }
    }

    function triggerJobNotification(notification: PendingNotificationPayload) {
      pendingNotification.value = notification;
    }

    function clearPendingNotification() {
      pendingNotification.value = null;
    }

    function resetUi(): void {
      jobSelectorOrientation.value = "horizontal";
      jobsSectionWidth.value = "3fr";
      compressSectionWidth.value = "2fr";
      notifications.value = [];
      // Reset marquee box on UI reset
      Object.assign(marqueeBox, { visible: false, x: 0, y: 0, width: 0, height: 0 });
    }

    return {
      jobSelectorOrientation,
      jobsSectionWidth,
      compressSectionWidth,
      notifications,
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
