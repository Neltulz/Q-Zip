// stores/debugStore.ts
// 
import { defineStore } from "pinia";
import { ref } from "vue";
import { debugConfig, setAllLoggingEnabled, syncDebugConfig, resetDebugConfig } from "~/utils/debugConfig";

export interface DebugOptions {
  // Logging options from debugConfig
  logComponentMounts: boolean;
  logRefUpdates: boolean;
  logClicksAndInputs: boolean;
  logStoreActions: boolean;
  logDropdownEvents: boolean;
  logUIEvents: boolean;
  logDragAndDrop: boolean;
  logComposableManagerEvents: boolean;
  logMissingPropWarnings: boolean;
  logFileSelection: boolean;
  logDragDropFailsafe: boolean;
  logNotifications: boolean;
  logLoadingEvents: boolean;
  logDualProgress: boolean;
  logRenderingEvents: boolean;
  logUIInteractivity: boolean;
  logComponentAttributes: boolean;
  logVueWarnings: boolean;
  logKeyboardEvents: boolean;
  logHoverEvents: boolean;
  logTooltipEvents: boolean;
}

export interface DebugPosition {
  x: number;
  y: number;
}

export const useDebugStore = defineStore(
  "debug",
  () => {
    // Debug popup visibility - hidden by default
    const isDebugPopupVisible = ref(false);

    // Debug popup position
    const debugPopupPosition = ref<DebugPosition>({
      x: 20, // Default to left side
      y: window.innerHeight - 520, // Above the debug button
    });

    // Debug button position (at bottom, draggable)
    const debugButtonPosition = ref<DebugPosition>({
      x: 20, // Left side
      y: window.innerHeight - 34, // At bottom (34px = --min-tch-tgt)
    });

    // Debug options
    const debugOptions = ref<DebugOptions>({
      // Initialize logging options from debugConfig
      logComponentMounts: debugConfig.logComponentMounts ?? false,
      logRefUpdates: debugConfig.logRefUpdates ?? false,
      logClicksAndInputs: debugConfig.logClicksAndInputs ?? true,
      logStoreActions: debugConfig.logStoreActions ?? false,
      logDropdownEvents: debugConfig.logDropdownEvents ?? true,
      logUIEvents: debugConfig.logUIEvents ?? true,
      logDragAndDrop: debugConfig.logDragAndDrop ?? false,
      logComposableManagerEvents: debugConfig.logComposableManagerEvents ?? true,
      logMissingPropWarnings: debugConfig.logMissingPropWarnings ?? true,
      logFileSelection: debugConfig.logFileSelection ?? false,
      logDragDropFailsafe: debugConfig.logDragDropFailsafe ?? false,
      logNotifications: debugConfig.logNotifications ?? false,
      logLoadingEvents: debugConfig.logLoadingEvents ?? true,
      logDualProgress: debugConfig.logDualProgress ?? false,
      logRenderingEvents: debugConfig.logRenderingEvents ?? false,
      logUIInteractivity: debugConfig.logUIInteractivity ?? true,
      logComponentAttributes: debugConfig.logComponentAttributes ?? false,
      logVueWarnings: debugConfig.logVueWarnings ?? false,
      logKeyboardEvents: debugConfig.logKeyboardEvents ?? false,
      logHoverEvents: debugConfig.logHoverEvents ?? true,
      logTooltipEvents: debugConfig.logTooltipEvents ?? true,
    });

    // Toggle debug popup visibility
    const toggleDebugPopup = () => {
      isDebugPopupVisible.value = !isDebugPopupVisible.value;
    };

    // Update a specific debug option
    const updateDebugOption = <K extends keyof DebugOptions>(
      key: K,
      value: DebugOptions[K]
    ) => {
      debugOptions.value[key] = value;

      // Handle verbose logging toggle
      if (key.startsWith('log')) {
        // Update debugConfig when individual logging options change
        syncDebugConfig(debugOptions.value);
      }
    };

    // Reset all debug options to defaults
    const resetDebugOptions = () => {
      debugOptions.value = {
        // Reset logging options to debugConfig defaults
        logComponentMounts: false,
        logRefUpdates: false,
        logClicksAndInputs: true,
        logStoreActions: false,
        logDropdownEvents: true,
        logUIEvents: true,
        logDragAndDrop: false,
        logComposableManagerEvents: true,
        logMissingPropWarnings: true,
        logFileSelection: false,
        logDragDropFailsafe: false,
        logNotifications: false,
        logLoadingEvents: true,
        logDualProgress: false,
        logRenderingEvents: false,
        logUIInteractivity: true,
        logComponentAttributes: false,
        logVueWarnings: false,
        logKeyboardEvents: false,
        logHoverEvents: true,
        logTooltipEvents: true,
      };

      // Reset debugConfig to defaults
      resetDebugConfig();
    };

    // Update debug popup position
    const updateDebugPopupPosition = (position: DebugPosition) => {
      debugPopupPosition.value = position;
    };

    // Update debug button position
    const updateDebugButtonPosition = (position: DebugPosition) => {
      debugButtonPosition.value = position;
    };

    return {
      isDebugPopupVisible,
      debugPopupPosition,
      debugButtonPosition,
      debugOptions,
      toggleDebugPopup,
      updateDebugOption,
      resetDebugOptions,
      updateDebugPopupPosition,
      updateDebugButtonPosition,
    };
  },
  {
    persist: true,
  }
);
