// utils/debugConfig.ts
// 
/**@preserve
 * Centralized configuration for debugging flags.
 * This allows for granular control over console logging throughout the application.
 *
 * How to use:
 * 1. Import DEBUG and debugConfig into any component or store.
 * import { DEBUG, debugConfig } from '~/utils/debugConfig';
 *
 * 2. Wrap console logs in a conditional check:
 * if (DEBUG && debugConfig.logComponentMounts) {
 * console.log('Component has mounted');
 * }
 *
 * FALLBACK METHODS (when UI is inaccessible):
 * 1. Console Commands (available globally):
 *    - __QZIP_DEBUG(true/false)     - Enable/disable all logging
 *    - __QZIP_DEBUG_GET()           - Get current debug config
 *    - __QZIP_DEBUG_SET(key, value) - Set individual option
 *    - __QZIP_DEBUG_LIST()          - List all available options
 *    - __QZIP_DEBUG_STORE()         - Show store access instructions
 *    - __QZIP_DEBUG_STATUS()        - Show current active/inactive options
 *
 * 2. Direct Store Access (in browser console):
 *    // Method A: Using the store composable
 *    const debugStore = useDebugStore();
 *    debugStore.updateDebugOption('logComponentMounts', true);
 *
 *    // Method B: Using global store instance
 *    __QZIP_DEBUG_STORE_INSTANCE.updateDebugOption('logComponentMounts', true);
 *    console.log(__QZIP_DEBUG_STORE_INSTANCE.debugOptions);
 *
 * 3. Direct Config Access (in browser console):
 *    import('/utils/debugConfig.js').then(m => {
 *      m.debugConfig.logComponentMounts = true;
 *    });
 */
// @preserve
// Master switch to enable or disable all debugging logs. Use `setAllLoggingEnabled` to toggle at runtime.
// Master switch to enable or disable all debugging logs. Default OFF for
// production-like runs; enable explicitly during development or testing.
export let DEBUG: boolean = true;
// Individual flags for controlling specific types of logs.
// These are initialized as empty and will be populated by the store.
// The store is the single source of truth for all debug options.
export const debugConfig: Record<string, boolean> = {
  // All values will be set by the store via syncDebugConfig()
  // This prevents having two sources of truth and potential conflicts.

  // Special flag for showing DECORUM messages
  decorumMessages: false, // Default to false to reduce noise
  // Special flag for FileTable activation events
  logFileTableActivation: false, // Default to false to reduce noise
  // Special flag for trace events
  logTraceEvents: false, // Default to false to reduce noise
};

// Store the original values for reset functionality
// These will be populated when the store initializes
const originalDebugConfig: Record<string, boolean> = {};

// Helper to toggle all logging flags at runtime. This updates the master DEBUG
// flag and flips every individual debugConfig flag to the provided value.
export const setAllLoggingEnabled = (enabled: boolean) => {
  DEBUG = enabled;
  Object.keys(debugConfig).forEach((k) => {
    if (k.startsWith('log') || k === 'decorumMessages') {
      // @ts-ignore - dynamic assignment to flags
      debugConfig[k] = enabled;
    }
  });
};

// Helper to reset debugConfig to original values
export const resetDebugConfig = () => {
  // Reset to original values if they exist, otherwise set to false
  Object.keys(debugConfig).forEach((k) => {
    if (k.startsWith('log') || k === 'decorumMessages') {
      // @ts-ignore - dynamic assignment to flags
      debugConfig[k] = originalDebugConfig[k] === undefined ? false : (originalDebugConfig[k] as boolean);
    }
  });
  DEBUG = false; // Reset master switch to false
};

// Helper to sync debugConfig with store values
// This is the primary way debugConfig gets updated - store is now the source of truth
export const syncDebugConfig = (storeConfig: Record<string, boolean>) => {
  Object.keys(storeConfig).forEach((k) => {
    if (k.startsWith('log') || k === 'decorumMessages') {
      // @ts-ignore - dynamic assignment to flags
      debugConfig[k] = storeConfig[k];
      // Also store in originalDebugConfig for reset functionality
      originalDebugConfig[k] = storeConfig[k] ?? false;
    }
  });

  // Update the master DEBUG flag based on whether any logging is enabled
  const hasAnyLoggingEnabled = Object.entries(storeConfig).some(([key, value]) =>
    (key.startsWith('log') || key === 'decorumMessages') && value === true
  );
  DEBUG = hasAnyLoggingEnabled;
};

// NOTE: Do NOT enable logging automatically on import. Call `setAllLoggingEnabled(true)`
// from a dev-only entrypoint when you need verbose logs.
// Convenience helpers available in DevTools for runtime debugging.

// Helper to get current debug config
const getDebugConfig = () => ({ ...debugConfig });

// Helper to set individual debug options via console
const setDebugOption = (key: string, value: boolean) => {
  if ((key.startsWith('log') || key === 'decorumMessages') && key in debugConfig) {
    // @ts-ignore - dynamic assignment to flags
    debugConfig[key] = value;

    // Update the master DEBUG flag based on whether any logging is enabled
    const hasAnyLoggingEnabled = Object.entries(debugConfig).some(([k, v]) =>
      (k.startsWith('log') || k === 'decorumMessages') && v === true
    );
    DEBUG = hasAnyLoggingEnabled;

    console.log(`%c🔧 Debug config updated: ${key} = ${value}`, 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');
  } else {
    console.warn(`%c⚠️ Invalid debug option: ${key}`, 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
  }
};

// Helper to list all available debug options
const listDebugOptions = () => {
  console.log('%c📋 Available debug options:', 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;');
  Object.entries(debugConfig).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
};

// Helper to show current debug options status
const showDebugStatus = () => {
  // Check if any debug logging is enabled before showing detailed status
  const hasAnyLoggingEnabled = Object.entries(debugConfig).some(([key, value]) =>
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
      'logFileTableActivation'
    ];

    // Show all options as disabled
    debugOptionOrder.forEach(option => {
      console.log(`%c✗ ${option}`, 'color: #f44336; font-weight: bold;');
    });

    console.log(`%c🔧 Master DEBUG flag: ${DEBUG}`, 'background: #9c27b0; color: white; padding: 2px 6px; border-radius: 3px;');
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
    'logFileTableActivation'
  ];

  // Log the status
  console.log('%c🔧 Current Debug Options Status:', 'background: #2196f3; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');

  debugOptionOrder.forEach(option => {
    const isActive = debugConfig[option];
    const symbol = isActive ? '✓' : '✗';
    const color = isActive ? '#4caf50' : '#f44336';
    console.log(`%c${symbol} ${option}`, `color: ${color}; font-weight: bold;`);
  });

  console.log(`%c🔧 Master DEBUG flag: ${DEBUG}`, 'background: #9c27b0; color: white; padding: 2px 6px; border-radius: 3px;');
  console.log(''); // Empty line for readability
};

// Helper to get Pinia store access instructions
const getStoreAccess = () => {
  console.log('%c🗄️ Pinia Store Access:', 'background: #9c27b0; color: white; padding: 2px 4px; border-radius: 3px;');
  console.log('  Method A: Using the store composable');
  console.log('  const debugStore = useDebugStore();');
  console.log('  debugStore.updateDebugOption("logComponentMounts", true);');
  console.log('  console.log(debugStore.debugOptions);');
  console.log('  ');
  console.log('  Method B: Using global store instance');
  console.log('  __QZIP_DEBUG_STORE_INSTANCE.updateDebugOption("logComponentMounts", true);');
  console.log('  console.log(__QZIP_DEBUG_STORE_INSTANCE.debugOptions);');
  console.log('  ');
  console.log('  Both methods will sync with the debug config automatically.');
};

// Make debugging functions globally available
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globalObj = (window as any);

  // Existing global function
  globalObj.__QZIP_DEBUG = (on: boolean) => {
    setAllLoggingEnabled(!!on);
    console.log(`%c🔧 All debug logging ${on ? 'enabled' : 'disabled'}`, 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');
  };

  // New console debugging helpers
  globalObj.__QZIP_DEBUG_GET = getDebugConfig;
  globalObj.__QZIP_DEBUG_SET = setDebugOption;
  globalObj.__QZIP_DEBUG_LIST = listDebugOptions;
  globalObj.__QZIP_DEBUG_STORE = getStoreAccess;
  globalObj.__QZIP_DEBUG_STATUS = showDebugStatus;

  // Add store status function to global scope
  globalObj.__QZIP_DEBUG_STORE_STATUS = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).__QZIP_DEBUG_STORE_INSTANCE) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__QZIP_DEBUG_STORE_INSTANCE.showDebugStatus();
      } else {
        console.log('%c⚠️ Debug store not available yet, using config status instead', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
        showDebugStatus();
      }
    } catch (e) {
      console.log('%c⚠️ Error accessing debug store, using config status instead', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
      showDebugStatus();
    }
  };

  // Add force refresh function to global scope
  globalObj.__QZIP_DEBUG_FORCE_REFRESH = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).__QZIP_DEBUG_STORE_INSTANCE) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__QZIP_DEBUG_STORE_INSTANCE.forceRefresh();
      } else {
        console.log('%c⚠️ Debug store not available yet', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
      }
    } catch (e) {
      console.log('%c⚠️ Error accessing debug store', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
    }
  };

  // Add color picker debugging function to global scope
  globalObj.__QZIP_DEBUG_COLOR_PICKER = () => {
    console.log('%c🔍 Color Picker Debug Inspector', 'background: #9c27b0; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');

    // Find all color picker related elements
    const colorPickerElements = [
      ...document.querySelectorAll('[class*="color-picker"]'),
      ...document.querySelectorAll('.color-picker'),
      ...document.querySelectorAll('.color-picker-panel'),
      ...document.querySelectorAll('.color-picker-overlay'),
      ...document.querySelectorAll('.color-picker-dropdown'),
      ...document.querySelectorAll('.color-picker-popup'),
      // Sandbox elements (most important for z-index issues)
      ...document.querySelectorAll('#nuxt-color-picker\\:sandbox'),
      ...document.querySelectorAll('.CP-sandbox'),
      ...document.querySelectorAll('[id*="color-picker"][id*="sandbox"]'),
      ...document.querySelectorAll('[class*="color-picker"][class*="sandbox"]'),
      ...document.querySelectorAll('[class*="CP"][class*="sandbox"]')
    ];

    console.log(`%cFound ${colorPickerElements.length} color picker elements:`, 'background: #9c27b0; color: white; padding: 2px 4px; border-radius: 3px;');

    // Check DebugPopup z-index
    const debugPopup = document.querySelector('.debug-popup');
    if (debugPopup) {
      const popupStyle = window.getComputedStyle(debugPopup);
      console.log('%c🔧 DebugPopup z-index:', 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;', {
        zIndex: popupStyle.zIndex,
        position: popupStyle.position,
        display: popupStyle.display
      });
    }

    colorPickerElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const zIndex = computedStyle.zIndex;
      const position = computedStyle.position;
      const display = computedStyle.display;
      const visibility = computedStyle.visibility;

      console.log(`%c🎨 Element ${index + 1}:`, 'background: #9c27b0; color: white; padding: 2px 4px; border-radius: 3px;', {
        tagName: element.tagName,
        className: element.className,
        zIndex,
        position,
        display,
        visibility,
        boundingRect: element.getBoundingClientRect(),
        element
      });

      // Add temporary visual debugging
      if (element instanceof HTMLElement) {
        element.style.border = '3px solid magenta !important';
        element.style.backgroundColor = 'rgba(255, 0, 255, 0.2) !important';
        element.style.boxShadow = '0 0 10px rgba(255, 0, 255, 0.8) !important';
        setTimeout(() => {
          element.style.border = '';
          element.style.backgroundColor = '';
          element.style.boxShadow = '';
        }, 5000);
      }
    });

    // Check if tooltip events logging is enabled
    console.log('%c💡 Tip: Enable tooltip events logging to see automatic color picker debugging:', 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;');
    console.log('  1. Open DebugPopup (Ctrl+Alt+Shift+D)');
    console.log('  2. Go to Logging tab');
    console.log('  3. Enable "Tooltip Events"');
    console.log('  4. Click on the border color picker');
  };

  // Add dimension management functions to global scope
  globalObj.__QZIP_DEBUG_RESET_DIMENSIONS = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).__QZIP_DEBUG_STORE_INSTANCE) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__QZIP_DEBUG_STORE_INSTANCE.resetDebugPopupDimensions();
        console.log('%c🔧 Debug popup dimensions reset to defaults', 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');
      } else {
        console.log('%c⚠️ Debug store not available yet', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
      }
    } catch (e) {
      console.log('%c⚠️ Error accessing debug store', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
    }
  };

  globalObj.__QZIP_DEBUG_GET_DIMENSIONS = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).__QZIP_DEBUG_STORE_INSTANCE) {
        const store = (window as any).__QZIP_DEBUG_STORE_INSTANCE;
        console.log('%c📏 Debug popup dimensions:', 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;');
        console.log('  Position:', store.debugPopupPosition);
        console.log('  Dimensions:', store.debugPopupDimensions);
        return { position: store.debugPopupPosition, dimensions: store.debugPopupDimensions };
      } else {
        console.log('%c⚠️ Debug store not available yet', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
        return null;
      }
    } catch (e) {
      console.log('%c⚠️ Error accessing debug store', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
      return null;
    }
  };

  // Always show debug helpers info, regardless of logging state
  console.log('%c🔧 Debug helpers loaded! Available commands:', 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');
  console.log('  __QZIP_DEBUG(true/false)     - Enable/disable all logging');
  console.log('  __QZIP_DEBUG_GET()           - Get current debug config');
  console.log('  __QZIP_DEBUG_SET(key, value) - Set individual option');
  console.log('  __QZIP_DEBUG_LIST()          - List all available options');
  console.log('  __QZIP_DEBUG_STORE()         - Show store access instructions');
  console.log('  __QZIP_DEBUG_STATUS()        - Show current active/inactive options');
  console.log('  __QZIP_DEBUG_STORE_STATUS()  - Show store debug options status');
  console.log('  __QZIP_DEBUG_FORCE_REFRESH() - Force refresh store state');
  console.log('  __QZIP_DEBUG_GET_DIMENSIONS() - Get debug popup position & dimensions');
  console.log('  __QZIP_DEBUG_RESET_DIMENSIONS() - Reset popup to default size');
  console.log('  __QZIP_DEBUG_COLOR_PICKER()  - Inspect color picker z-index issues');
  console.log('  __QZIP_DEBUG_SET("decorumMessages", true) - Show DECORUM messages');

  // Note: Debug status will be shown by the debug store during initialization
  // to avoid duplicate logging at startup

  // Enable verbose logging automatically only in development builds
  // DISABLED: Set to false to reduce console noise during development
  try {
    const isDev = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) ||
      (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');
    if (isDev && false) { // Changed to false to disable auto-enabling
      try {
        globalObj.__QZIP_DEBUG(true);
      } catch (e) {
        /* ignore */
      }
    }
  } catch (e) {
    /* ignore */
  }
} catch (e) {
  // ignore if window not available (e.g., SSR)
}
