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

  // Special flag for suppressing DECORUM messages
  suppressDecorumLogs: true, // Default to true to reduce noise
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
    if (k.startsWith('log') || k === 'suppressDecorumLogs') {
      // @ts-ignore - dynamic assignment to flags
      debugConfig[k] = enabled;
    }
  });
};

// Helper to reset debugConfig to original values
export const resetDebugConfig = () => {
  // Reset to original values if they exist, otherwise set to false
  Object.keys(debugConfig).forEach((k) => {
    if (k.startsWith('log') || k === 'suppressDecorumLogs') {
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
    if (k.startsWith('log') || k === 'suppressDecorumLogs') {
      // @ts-ignore - dynamic assignment to flags
      debugConfig[k] = storeConfig[k];
      // Also store in originalDebugConfig for reset functionality
      originalDebugConfig[k] = storeConfig[k] ?? false;
    }
  });

  // Update the master DEBUG flag based on whether any logging is enabled
  const hasAnyLoggingEnabled = Object.entries(storeConfig).some(([key, value]) =>
    (key.startsWith('log') || key === 'suppressDecorumLogs') && value === true
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
  if ((key.startsWith('log') || key === 'suppressDecorumLogs') && key in debugConfig) {
    // @ts-ignore - dynamic assignment to flags
    debugConfig[key] = value;

    // Update the master DEBUG flag based on whether any logging is enabled
    const hasAnyLoggingEnabled = Object.entries(debugConfig).some(([k, v]) =>
      (k.startsWith('log') || k === 'suppressDecorumLogs') && v === true
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

  console.log('%c🔧 Debug helpers loaded! Available commands:', 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');
  console.log('  __QZIP_DEBUG(true/false)     - Enable/disable all logging');
  console.log('  __QZIP_DEBUG_GET()           - Get current debug config');
  console.log('  __QZIP_DEBUG_SET(key, value) - Set individual option');
  console.log('  __QZIP_DEBUG_LIST()          - List all available options');
  console.log('  __QZIP_DEBUG_STORE()         - Show store access instructions');
  console.log('  __QZIP_DEBUG_SET("suppressDecorumLogs", false) - Show DECORUM messages');

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
