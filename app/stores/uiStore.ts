// stores/uiStore.ts @preserve
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";

export type JobSelectorOrientation = "horizontal" | "vertical";
export type PanelWidth = string;
export type NotificationType = "success" | "warning" | "error" | "info";

export interface NotificationPosition {
  top: number;
  left: number;
  width: number;
}

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  targetId: number | "new-job";
  duration: number;
  position?: NotificationPosition;
  timeoutId: number | null;
}

export const useUiStore = defineStore(
  "ui",
  () => {
    // State
    const jobSelectorOrientation: Ref<JobSelectorOrientation> = ref("horizontal");
    const jobsSectionWidth: Ref<PanelWidth> = ref("3fr");
    const compressSectionWidth: Ref<PanelWidth> = ref("2fr");
    const notifications: Ref<Notification[]> = ref([]);
    // --- FIX: REMOVED scrollContainer and setScrollContainer ---

    function toggleJobSelectorOrientation(): void {
      jobSelectorOrientation.value = jobSelectorOrientation.value === "horizontal" ? "vertical" : "horizontal";
    }

    function setPanelWidths(jobsWidth: PanelWidth, compressWidth: PanelWidth): void {
      jobsSectionWidth.value = jobsWidth;
      compressSectionWidth.value = compressWidth;
    }

    function addNotification(notification: Omit<Notification, "id" | "timeoutId" | "duration"> & { duration?: number }): void {
      const id = Date.now() + Math.random();
      const duration = notification.duration ?? 4000;

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

    function resetUi(): void {
      jobSelectorOrientation.value = "horizontal";
      jobsSectionWidth.value = "3fr";
      compressSectionWidth.value = "2fr";
      notifications.value = [];
    }

    return {
      jobSelectorOrientation,
      jobsSectionWidth,
      compressSectionWidth,
      notifications,
      toggleJobSelectorOrientation,
      setPanelWidths,
      addNotification,
      removeNotification,
      pauseNotificationTimeout,
      resumeNotificationTimeout,
      resetUi,
    };
  },
  {
    persist: {
      paths: ["jobSelectorOrientation", "jobsSectionWidth", "compressSectionWidth"],
    },
  }
);
