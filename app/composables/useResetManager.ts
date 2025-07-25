// composables/useResetManager.ts @preserve
/**
 * @preserve
 * Description: This composable centralizes all reset logic for the application's
 * various Pinia stores and UI elements. It provides a reactive list of
 * resettable actions and a function to reset all states at once.
 *
 * Usage Example:
 * import { useResetManager } from "@/composables/useResetManager";
 * const { resettables, resetAll, register } = useResetManager();
 */

import { ref, computed, type Ref } from "vue";
import { useThemeStore } from "@/stores/themeStore";
import { useUiStore } from "@/stores/uiStore";
import { useJobsStore } from "@/stores/jobsStore";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT } from "@/utils/appConfig";

export interface Resettable {
  name: string;
  icon: string;
  tooltip: string;
  action: () => void | Promise<void>;
}

// This ref should be managed within the composable instance
const resettables: Ref<Resettable[]> = ref([]);

export function useResetManager() {
  const themeStore = useThemeStore();
  const uiStore = useUiStore();
  const jobsStore = useJobsStore();
  const userPreferencesStore = useUserPreferencesStore();

  /**
   * Resets the main application window to its default size and centers it.
   */
  const resetWindow = async () => {
    const window = getCurrentWindow();
    await window.setSize(new LogicalSize(DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT));
    await window.center();
  };

  /**
   * A computed property that returns an array of all resettable actions.
   * Each object includes metadata for the UI and the action to perform.
   */
  const resettableActions = computed(() => [
    {
      name: "Reset Theme",
      icon: "mdi:palette-outline",
      tooltip: "Reset the application theme to its default.",
      action: () => themeStore.resetTheme(),
    },
    {
      name: "Reset UI",
      icon: "mdi:monitor-screenshot",
      tooltip: "Restore all UI panels and layouts to their default dimensions and positions.",
      action: () => uiStore.resetUi(),
    },
    {
      name: "Reset Jobs",
      icon: "mdi:briefcase-remove-outline",
      tooltip: "Clear all jobs from the queue and reset to a single, new entry.",
      action: () => jobsStore.resetJobs(),
    },
    {
      name: "Reset Settings",
      icon: "mdi:cog-outline",
      tooltip: "Revert all global compression settings to their default values.",
      action: () => jobsStore.resetGlobalSettings(),
    },
    {
      name: "Reset User Preferences",
      icon: "mdi:account-cog-outline",
      tooltip: "Reset all user preferences, such as the welcome screen choice.",
      action: () => userPreferencesStore.resetUserPreferences(),
    },
    {
      name: "Reset Window",
      icon: "mdi:window-restore",
      tooltip: "Restore the application window to its default size and centered position.",
      action: resetWindow,
    },
  ]);

  /**
   * A function that resets all application states to their defaults.
   * Note: Window reset is handled separately in the UI to ensure it runs last.
   */
  const resetAll = async () => {
    themeStore.resetTheme();
    uiStore.resetUi();
    jobsStore.resetJobs();
    jobsStore.resetGlobalSettings();
    userPreferencesStore.resetUserPreferences();
  };

  // The register function was not being returned from the composable.
  const register = (resettable: Resettable): void => {
    if (!resettables.value.some((r) => r.name === resettable.name)) {
      resettables.value.push(resettable);
    }
  };

  return {
    resettables: resettableActions, // Expose the computed list of actions
    register, // Expose the register function
    resetAll,
  };
}
