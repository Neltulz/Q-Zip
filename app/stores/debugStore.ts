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
  logTraceEvents: boolean;
  // Special options
  suppressDecorumLogs: boolean;
  logFileTableActivation: boolean;
}

export interface DebugPosition {
  x: number;
  y: number;
}

export const useDebugStore = defineStore(
  "debug",
  () => {
    // Make store globally accessible for console debugging
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__QZIP_DEBUG_STORE_INSTANCE = null; // Will be set when store is created
    } catch (e) {
      // ignore if window not available
    }
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

    // Active tab in debug popup - persists across hot reloads
    const activeDebugTab = ref('general');

    // Debug options - store is now the single source of truth
    const debugOptions = ref<DebugOptions>({
      // Default values (previously in debugConfig.ts)
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
      logTraceEvents: false,
      // Special options
      suppressDecorumLogs: true,
      logFileTableActivation: false,
    });

    // Sync to debugConfig on store initialization
    syncDebugConfig(debugOptions.value);

    // Toggle debug popup visibility
    const toggleDebugPopup = () => {
      isDebugPopupVisible.value = !isDebugPopupVisible.value;
    };

    // Update a specific debug option
    const updateDebugOption = <K extends keyof DebugOptions>(
      key: K,
      value: DebugOptions[K]
    ) => {
      const oldValue = debugOptions.value[key];
      debugOptions.value[key] = value;

      // Log the change
      console.log(`%c🔧 Debug option changed: ${key} = ${oldValue} → ${value}`, 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');

      // Sync to debugConfig for immediate runtime effect
      if (key.startsWith('log')) {
        syncDebugConfig(debugOptions.value);
      }
    };

    // Reset all debug options to defaults
    const resetDebugOptions = () => {
      debugOptions.value = {
        // Reset to store's built-in defaults
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
        logTraceEvents: false,
        // Special options
        suppressDecorumLogs: true,
        logFileTableActivation: false,
      };

      // Sync reset to debugConfig
      syncDebugConfig(debugOptions.value);
    };

    // Update debug popup position
    const updateDebugPopupPosition = (position: DebugPosition) => {
      debugPopupPosition.value = position;
    };

    // Update debug button position
    const updateDebugButtonPosition = (position: DebugPosition) => {
      debugButtonPosition.value = position;
    };

    // Update active debug tab
    const updateActiveDebugTab = (tabId: string) => {
      activeDebugTab.value = tabId;
    };

    // Create store instance and make it globally accessible
    const storeInstance = {
      isDebugPopupVisible,
      debugPopupPosition,
      debugButtonPosition,
      activeDebugTab,
      debugOptions,
      toggleDebugPopup,
      updateDebugOption,
      resetDebugOptions,
      updateDebugPopupPosition,
      updateDebugButtonPosition,
      updateActiveDebugTab,
    };

    // Initialize debugConfig with store values on creation
    // This ensures debugConfig reflects the store's state (including persisted values)
    syncDebugConfig(debugOptions.value);

    // Make store globally accessible for console debugging
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__QZIP_DEBUG_STORE_INSTANCE = storeInstance;
    } catch (e) {
      // ignore if window not available
    }

    return storeInstance;
  },
  {
    persist: true,
  }
);
