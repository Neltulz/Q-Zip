// stores/debugStore.ts
// 
import { defineStore } from "pinia";
import { ref, watch, computed } from "vue";
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
  logDebugButtonPositions: boolean;
  // Visual helpers
  showHotzones: boolean;
  // Special options
  decorumMessages: boolean;
  logFileTableActivation: boolean;
  preventTooltipClosing: boolean;
  // Tooltip debugging options
  logTooltipCreation: boolean;
  logTooltipTargetResolution: boolean;
  logTooltipVisibilityChanges: boolean;
  logTooltipOrphanedDetection: boolean;
  // Opacity controls
  debugPopupOpacity: number;
  debugPopupSecondaryOpacity: number;
  enableSecondaryOpacity: boolean;
  // Tooltip debugging options
  disableDropdownPointerEvents: boolean;
  increaseTooltipZIndex: boolean;
  forceTooltipInteractive: boolean;
  // Backdrop blur controls
  backdropBlur: number;
  disableBackdropBlurOnDrag: boolean;
  // Interior elements opacity
  debugPopupInteriorOpacity: number;
  // TitleBar debug options
  showTitlebarHighlight: boolean;
  titlebarHighlightColor: string;
  titlebarHighlightOpacity: number;
  // TitleBar event logging
  logTitleBarEvents: boolean;
}

export interface DebugPosition {
  x: number;
  y: number;
}

export interface DebugDimensions {
  width: number;
  height: number;
}

// Helper function to log current debug options status
const logDebugOptionsStatus = (options: DebugOptions) => {
  // Check if any debug logging is enabled before showing status
  const hasAnyLoggingEnabled = Object.entries(options).some(([key, value]) =>
    (key.startsWith('log') || key === 'decorumMessages') && value === true
  );

  // Define the exact order as they appear in the logging tab
  const debugOptionOrder = [
    'logComponentMounts',
    'logRefUpdates',
    'logRenderingEvents',
    'logClicksAndInputs',
    'logHoverEvents',
    'logKeyboardEvents',
    'logUIInteractivity',
    'logUIEvents',
    'logDropdownEvents',
    'logTooltipEvents',
    'logLoadingEvents',
    'logFileSelection',
    'logDragAndDrop',
    'logDragDropFailsafe',
    'logDualProgress',
    'logStoreActions',
    'logComposableManagerEvents',
    'logNotifications',
    'logTraceEvents',
    'logMissingPropWarnings',
    'logComponentAttributes',
    'logVueWarnings',
    'decorumMessages',
    'logFileTableActivation',
    'preventTooltipClosing',
    'logTooltipCreation',
    'logTooltipTargetResolution',
    'logTooltipVisibilityChanges',
    'logTooltipOrphanedDetection'
  ];

  // Always show status, but with different messaging based on whether any logging is enabled
  if (!hasAnyLoggingEnabled) {
    console.log('%c🔧 All debug options are currently disabled. Enable some options in the debug popup to see detailed status.', 'background: #9e9e9e; color: white; padding: 2px 4px; border-radius: 3px;');
    console.log('%c🔧 Debug Options Status at Startup (All Disabled):', 'background: #2196f3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
  } else {
    console.log('%c🔧 Debug Options Status at Startup:', 'background: #2196f3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
  }

  debugOptionOrder.forEach(option => {
    const isActive = options[option as keyof DebugOptions];
    const symbol = isActive ? '✓' : '✗';
    const color = isActive ? '#4caf50' : '#f44336';
    console.log(`%c${symbol} ${option}`, `color: ${color}; font-weight: bold;`);
  });

  console.log('%c💡 Use Ctrl+Alt+Shift+D to open debug popup or __QZIP_DEBUG_STORE() for console access', 'background: #9c27b0; color: white; padding: 2px 6px; border-radius: 3px;');
  console.log(''); // Empty line for readability
};

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

    // Debug popup dimensions
    const debugPopupDimensions = ref<DebugDimensions>({
      width: 500, // Default width
      height: 500, // Default height
    });

    // Debug button position (at bottom, draggable)
    const debugButtonPosition = ref<DebugPosition>({
      x: 20, // Left side
      y: window.innerHeight - 34, // At bottom (34px = --min-tch-tgt)
    });

    // Active hotzone edge (top|bottom|left|right) or null
    const activeHotzoneEdge = ref<string | null>(null);

    const setActiveHotzoneEdge = (edge: string | null) => {
      activeHotzoneEdge.value = edge;
    };

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
      logDebugButtonPositions: false,
      // Visual helpers
      showHotzones: false,
      // Special options
      decorumMessages: false,
      logFileTableActivation: false,
      preventTooltipClosing: false,
      // Tooltip debugging options
      logTooltipCreation: false,
      logTooltipTargetResolution: false,
      logTooltipVisibilityChanges: false,
      logTooltipOrphanedDetection: false,
      // Opacity controls
      debugPopupOpacity: 0.75,
      debugPopupSecondaryOpacity: 0.4,
      enableSecondaryOpacity: false,
      // Tooltip debugging options
      disableDropdownPointerEvents: false,
      increaseTooltipZIndex: false,
      forceTooltipInteractive: false,
      // Backdrop blur controls
      backdropBlur: 16,
      disableBackdropBlurOnDrag: true,
      // Interior elements opacity
      debugPopupInteriorOpacity: 0.75,
      // Visual helpers
      showHotzones: false,
      // TitleBar debug options
      showTitlebarHighlight: false,
      titlebarHighlightColor: 'hsl(210, 100%, 50%)',
      titlebarHighlightOpacity: 0.25,
      // TitleBar event logging
      logTitleBarEvents: false,
    });

    // Computed property to ensure store is properly initialized
    const isStoreInitialized = computed(() => {
      return Object.keys(debugOptions.value).length > 0;
    });

    // Computed properties for opacity calculations
    const currentOpacity = computed(() => {
      return debugOptions.value.debugPopupOpacity;
    });

    const secondaryOpacity = computed(() => {
      if (!debugOptions.value.enableSecondaryOpacity) {
        return debugOptions.value.debugPopupOpacity;
      }
      return debugOptions.value.debugPopupOpacity * debugOptions.value.debugPopupSecondaryOpacity;
    });

    // Watch for changes to debugOptions and sync to debugConfig
    // This ensures debugConfig stays in sync with the store, including after rehydration
    watch(debugOptions, (newOptions) => {
      // Extract only boolean properties for debugConfig sync
      const booleanOptions = Object.fromEntries(
        Object.entries(newOptions).filter(([_, value]) => typeof value === 'boolean')
      ) as Record<string, boolean>;
      syncDebugConfig(booleanOptions);
    }, { deep: true, immediate: true });

    // Watch for store initialization and log status
    watch(isStoreInitialized, (initialized) => {
      if (initialized) {
        // Small delay to ensure persistence rehydration is complete
        setTimeout(() => {
          logDebugOptionsStatus(debugOptions.value);
        }, 50);
      }
    }, { immediate: true });

    // Force a sync after a longer delay to ensure persistence is fully loaded
    setTimeout(() => {
      // Extract only boolean properties for debugConfig sync
      const booleanOptions = Object.fromEntries(
        Object.entries(debugOptions.value).filter(([_, value]) => typeof value === 'boolean')
      ) as Record<string, boolean>;
      syncDebugConfig(booleanOptions);
    }, 200);

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

      // Apply constraints for opacity values
      if (key === 'debugPopupOpacity') {
        const numValue = value as number;
        debugOptions.value[key] = Math.max(0.05, Math.min(1, numValue)) as DebugOptions[K];
      } else if (key === 'debugPopupSecondaryOpacity') {
        const numValue = value as number;
        debugOptions.value[key] = Math.max(0.05, Math.min(1, numValue)) as DebugOptions[K];
      } else if (key === 'debugPopupInteriorOpacity') {
        const numValue = value as number;
        debugOptions.value[key] = Math.max(0.05, Math.min(1, numValue)) as DebugOptions[K];
      } else {
        debugOptions.value[key] = value;
      }

      // Log the change
      console.log(`%c🔧 Debug option changed: ${key} = ${oldValue} → ${debugOptions.value[key]}`, 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');

      // Sync to debugConfig for immediate runtime effect
      if (key.startsWith('log')) {
        // Extract only boolean properties for debugConfig sync
        const booleanOptions = Object.fromEntries(
          Object.entries(debugOptions.value).filter(([_, value]) => typeof value === 'boolean')
        ) as Record<string, boolean>;
        syncDebugConfig(booleanOptions);
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
        logDebugButtonPositions: false,
        // Special options
        decorumMessages: false,
        logFileTableActivation: false,
        preventTooltipClosing: false,
        // Tooltip debugging options
        logTooltipCreation: false,
        logTooltipTargetResolution: false,
        logTooltipVisibilityChanges: false,
        logTooltipOrphanedDetection: false,
        // Opacity controls
        debugPopupOpacity: 0.75,
        debugPopupSecondaryOpacity: 0.4,
        enableSecondaryOpacity: false,
        // Tooltip debugging options
        disableDropdownPointerEvents: false,
        increaseTooltipZIndex: false,
        forceTooltipInteractive: false,
        // Backdrop blur controls
        backdropBlur: 16,
        disableBackdropBlurOnDrag: true,
        // Interior elements opacity
        debugPopupInteriorOpacity: 0.75,
      };

      // Sync reset to debugConfig
      // Extract only boolean properties for debugConfig sync
      const booleanOptions = Object.fromEntries(
        Object.entries(debugOptions.value).filter(([_, value]) => typeof value === 'boolean')
      ) as Record<string, boolean>;
      syncDebugConfig(booleanOptions);
    };

    // Reset debug popup dimensions to defaults
    const resetDebugPopupDimensions = () => {
      const oldDimensions = { ...debugPopupDimensions.value };
      debugPopupDimensions.value = {
        width: 500,
        height: 500,
      };

      // Log the reset
      console.log(`%c🔧 Debug popup dimensions reset: ${oldDimensions.width}x${oldDimensions.height} → 500x500`, 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
    };

    // Update debug popup position
    const updateDebugPopupPosition = (position: DebugPosition) => {
      debugPopupPosition.value = position;
    };

    // Update debug popup dimensions
    const updateDebugPopupDimensions = (dimensions: DebugDimensions) => {
      const oldDimensions = { ...debugPopupDimensions.value };
      debugPopupDimensions.value = dimensions;

      // Log the change
      console.log(`%c🔧 Debug popup dimensions changed: ${oldDimensions.width}x${oldDimensions.height} → ${dimensions.width}x${dimensions.height}`, 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');
    };

    // Update debug button position
    const updateDebugButtonPosition = (position: DebugPosition) => {
      debugButtonPosition.value = position;
    };

    // Update active debug tab
    const updateActiveDebugTab = (tabId: string) => {
      activeDebugTab.value = tabId;
    };

    // Show current debug options status
    const showDebugStatus = () => {
      // Check if any debug logging is enabled before showing detailed status
      const hasAnyLoggingEnabled = Object.entries(debugOptions.value).some(([key, value]) =>
        (key.startsWith('log') || key === 'decorumMessages') && value === true
      );

      // Always show basic status, but only show detailed status if logging is enabled
      if (!hasAnyLoggingEnabled) {
        console.log('%c🔧 All debug options are currently disabled. Enable some options in the debug popup to see detailed status.', 'background: #9e9e9e; color: white; padding: 2px 4px; border-radius: 3px;');

        // Show the status anyway, but in a condensed format
        console.log('%c🔧 Current Debug Options Status (All Disabled):', 'background: #2196f3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');

        // Define the exact order as they appear in the logging tab
        const debugOptionOrder = [
          'logComponentMounts',
          'logRefUpdates',
          'logRenderingEvents',
          'logClicksAndInputs',
          'logHoverEvents',
          'logKeyboardEvents',
          'logUIInteractivity',
          'logUIEvents',
          'logDropdownEvents',
          'logTooltipEvents',
          'logLoadingEvents',
          'logFileSelection',
          'logDragAndDrop',
          'logDragDropFailsafe',
          'logDualProgress',
          'logStoreActions',
          'logComposableManagerEvents',
          'logNotifications',
          'logTraceEvents',
          'logMissingPropWarnings',
          'logComponentAttributes',
          'logVueWarnings',
          'decorumMessages',
          'logFileTableActivation',
          'preventTooltipClosing',
          'logTooltipCreation',
          'logTooltipTargetResolution',
          'logTooltipVisibilityChanges',
          'logTooltipOrphanedDetection'
        ];

        // Show all options as disabled
        debugOptionOrder.forEach(option => {
          console.log(`%c✗ ${option}`, 'color: #f44336; font-weight: bold;');
        });

        console.log('%c💡 Use Ctrl+Alt+Shift+D to open debug popup or __QZIP_DEBUG_STORE() for console access', 'background: #9c27b0; color: white; padding: 2px 6px; border-radius: 3px;');
        console.log('%c📏 Debug popup position:', 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;', debugPopupPosition.value);
        console.log('%c📏 Debug popup dimensions:', 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;', debugPopupDimensions.value);
        console.log(''); // Empty line for readability
        return;
      }

      // Define the exact order as they appear in the logging tab
      const debugOptionOrder = [
        'logComponentMounts',
        'logRefUpdates',
        'logRenderingEvents',
        'logClicksAndInputs',
        'logHoverEvents',
        'logKeyboardEvents',
        'logUIInteractivity',
        'logUIEvents',
        'logDropdownEvents',
        'logTooltipEvents',
        'logLoadingEvents',
        'logFileSelection',
        'logDragAndDrop',
        'logDragDropFailsafe',
        'logDualProgress',
        'logStoreActions',
        'logComposableManagerEvents',
        'logNotifications',
        'logTraceEvents',
        'logMissingPropWarnings',
        'logComponentAttributes',
        'logVueWarnings',
        'decorumMessages',
        'logFileTableActivation',
        'preventTooltipClosing',
        'logTooltipCreation',
        'logTooltipTargetResolution',
        'logTooltipVisibilityChanges',
        'logTooltipOrphanedDetection'
      ];

      // Log the status
      console.log('%c🔧 Current Debug Options Status:', 'background: #2196f3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');

      debugOptionOrder.forEach(option => {
        const isActive = debugOptions.value[option as keyof DebugOptions];
        const symbol = isActive ? '✓' : '✗';
        const color = isActive ? '#4caf50' : '#f44336';
        console.log(`%c${symbol} ${option}`, `color: ${color}; font-weight: bold;`);
      });

      console.log('%c💡 Use Ctrl+Alt+Shift+D to open debug popup or __QZIP_DEBUG_STORE() for console access', 'background: #9c27b0; color: white; padding: 2px 6px; border-radius: 3px;');
      console.log('%c📏 Debug popup position:', 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;', debugPopupPosition.value);
      console.log('%c📏 Debug popup dimensions:', 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;', debugPopupDimensions.value);
      console.log(''); // Empty line for readability
    };

    // Force refresh the store state and sync with debugConfig
    const forceRefresh = () => {
      console.log('%c🔄 Force refreshing debug store state', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
      // Extract only boolean properties for debugConfig sync
      const booleanOptions = Object.fromEntries(
        Object.entries(debugOptions.value).filter(([_, value]) => typeof value === 'boolean')
      ) as Record<string, boolean>;
      syncDebugConfig(booleanOptions);
      showDebugStatus();
    };

    // Create store instance and make it globally accessible
    const storeInstance = {
      isDebugPopupVisible,
      debugPopupPosition,
      debugPopupDimensions,
      debugButtonPosition,
      activeHotzoneEdge,
      activeDebugTab,
      debugOptions,
      isStoreInitialized,
      currentOpacity,
      secondaryOpacity,
      toggleDebugPopup,
      updateDebugOption,
      resetDebugOptions,
      resetDebugPopupDimensions,
      updateDebugPopupPosition,
      updateDebugPopupDimensions,
      updateDebugButtonPosition,
      updateActiveDebugTab,
      showDebugStatus,
      forceRefresh,
      setActiveHotzoneEdge,
    };

    // Store is now fully initialized with persisted values

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
