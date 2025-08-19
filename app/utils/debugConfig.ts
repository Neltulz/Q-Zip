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
 */
// @preserve
// Master switch to enable or disable all debugging logs. Use `setAllLoggingEnabled` to toggle at runtime.
// Master switch to enable or disable all debugging logs. Default OFF for
// production-like runs; enable explicitly during development or testing.
export let DEBUG: boolean = true;
// Individual flags for controlling specific types of logs.
export const debugConfig: Record<string, boolean> = {
  // Logs messages when Vue components are mounted.
  logComponentMounts: false,
  // Logs when template refs (like buttonRef) are updated.
  logRefUpdates: false,
  // Logs user interaction events like clicks and input changes.
  logClicksAndInputs: true,
  // Logs actions and state changes within Pinia stores.
  logStoreActions: false,
  // Logs events specific to the DropdownMenu component.
  logDropdownEvents: true,
  // For general UI interactions like scrolling or accordion transitions.
  logUIEvents: true,
  // For handling Tauri's drag-and-drop events.
  logDragAndDrop: false,
  // For events from composables that manage state (e.g., dropdownManager).
  logComposableManagerEvents: true,
  // For developer warnings about missing props or potential issues.
  logMissingPropWarnings: true,
  // For logging file selection changes in the JobArea.
  logFileSelection: false,
  // Logs when a drag-and-drop operation is canceled by a failsafe.
  logDragDropFailsafe: false,
  // Logs events related to the notification system.
  logNotifications: false,
  // Logs events related to loading animations.
  logLoadingEvents: true,
  // Logs dual progress tracking events for debugging multiple folder operations.
  logDualProgress: false, // Temporarily disabled for orphaned tooltip debugging
  // Logs events related to the Vue rendering lifecycle.
  logRenderingEvents: false,
  // Logs events related to UI interactivity and responsiveness.
  logUIInteractivity: true,
  // Logs component attribute inheritance issues and Vue warnings.
  logComponentAttributes: false,
  // Logs Vue warnings and component inheritance issues.
  logVueWarnings: false,
  // Logs keyboard events and combinations with intelligent filtering.
  logKeyboardEvents: false,
  // Logs mouse hover events for debugging tooltip issues.
  logHoverEvents: true,
  // Logs tooltip visibility and positioning events.
  logTooltipEvents: true,
};
// Helper to toggle all logging flags at runtime. This updates the master DEBUG
// flag and flips every individual debugConfig flag to the provided value.
export const setAllLoggingEnabled = (enabled: boolean) => {
  DEBUG = enabled;
  Object.keys(debugConfig).forEach((k) => {
    // @ts-ignore - dynamic assignment to flags
    debugConfig[k] = enabled;
  });
};
// NOTE: Do NOT enable logging automatically on import. Call `setAllLoggingEnabled(true)`
// from a dev-only entrypoint when you need verbose logs.
// Convenience helper available in DevTools to toggle all logging at runtime.
// Usage: `window.__QZIP_DEBUG(true)` enables all logs; pass `false` to disable.
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__QZIP_DEBUG = (on: boolean) => setAllLoggingEnabled(!!on);
  // Enable verbose logging automatically only in development builds
  // DISABLED: Set to false to reduce console noise during development
  try {
    const isDev = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) ||
      (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');
    if (isDev && false) { // Changed to false to disable auto-enabling
      try {
        (window as any).__QZIP_DEBUG(true);
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
