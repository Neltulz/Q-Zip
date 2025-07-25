// plugins/registerResets.client.ts @preserve
import { defineNuxtPlugin } from "nuxt/app";
import { useResetManager } from "@/composables/useResetManager";
import { useThemeStore } from "@/stores/themeStore";
import { useUiStore } from "@/stores/uiStore";
import { useJobsStore } from "@/stores/jobsStore";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import {
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
} from "@/utils/appConfig";

export default defineNuxtPlugin(() => {
  const { register } = useResetManager();

  const themeStore = useThemeStore();
  const uiStore = useUiStore();
  const jobsStore = useJobsStore();

  // Register all available reset actions
  register({
    name: "Reset Theme",
    icon: "mdi:palette-outline",
    tooltip: "Reset the application theme to its default.",
    action: () => themeStore.resetTheme(),
  });

  register({
    name: "Reset UI",
    icon: "mdi:application-cog-outline",
    tooltip: "Reset UI panels and layouts to their default sizes and positions.",
    action: () => uiStore.resetUi(),
  });

  register({
    name: "Reset Jobs",
    icon: "mdi:database-remove-outline",
    tooltip: "Clear all current jobs and start fresh with one new job.",
    action: () => jobsStore.resetJobs(),
  });

  register({
    name: "Reset Settings",
    icon: "mdi:cog-outline",
    tooltip: "Reset the global compression settings to their default values.",
    action: () => jobsStore.resetGlobalSettings(),
  });

  register({
    name: "Reset Window",
    icon: "mdi:arrow-expand-all",
    tooltip:
      "Restore the application window to its default size and centered position.",
    action: async () => {
      const win = getCurrentWindow();
      await win.setSize(
        new LogicalSize(DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT)
      );
      await win.center();
    },
  });
});