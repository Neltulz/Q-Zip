// utils/debugConfig.ts @preserve

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

// Master switch to enable or disable all debugging logs.
export const DEBUG: boolean = true;

// Individual flags for controlling specific types of logs.
export const debugConfig = {
  // Logs messages when Vue components are mounted.
  logComponentMounts: false,

  // Logs when template refs (like buttonRef) are updated.
  logRefUpdates: false,

  // Logs user interaction events like clicks and input changes.
  logClicksAndInputs: true,

  // Logs actions and state changes within Pinia stores.
  logStoreActions: true,

  // Logs events specific to the DropdownMenu component.
  logDropdownEvents: true,

  // For general UI interactions like scrolling or accordion transitions.
  logUIEvents: true,

  // For handling Tauri's drag-and-drop events.
  logDragAndDrop: true,

  // For events from composables that manage state (e.g., dropdownManager).
  logComposableManagerEvents: true,

  // For developer warnings about missing props or potential issues.
  logMissingPropWarnings: true,

  // For logging file selection changes in the JobArea.
  logFileSelection: true,

  // Logs when a drag-and-drop operation is canceled by a failsafe.
  logDragDropFailsafe: true,

  // Logs events related to the notification system.
  logNotifications: true,
};
