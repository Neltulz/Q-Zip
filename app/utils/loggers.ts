// utils/loggers.ts @preserve
/**
 * @preserve
 * Description:
 * A collection of styled logger functions for browser console debugging.
 * Using CSS in console logs helps to visually distinguish different types
 * of events, making the debugging process more efficient. This update adds a
 * dedicated logger for notifications.
 *
 * How to use:
 * import { logInteraction } from '~/utils/loggers';
 * logInteraction('MyComponent', 'User clicked save');
 */

import { DEBUG, debugConfig } from "./debugConfig";

// Base styles for the log messages
const baseStyle: string = "border-radius: 3px; padding: 2px 4px; color: white;";
const callerStyle: string = "color: #9c27b0; font-weight: bold;"; // Purple

// --- Logger for Button Presses (mousedown) ---
const pressStyle: string = `${baseStyle} background-color: #34a853;`; // Green
export const logButtonPress = (callerName: string, message: string): void => {
  if (DEBUG && debugConfig.logClicksAndInputs) {
    console.log(`%c[${callerName}] %c${message}`, callerStyle, pressStyle);
  }
};

// --- Logger for Button Releases (mouseup) ---
const releaseStyle: string = `${baseStyle} background-color: #4285f4;`; // Blue
export const logButtonRelease = (callerName: string, message: string): void => {
  if (DEBUG && debugConfig.logClicksAndInputs) {
    console.log(`%c[${callerName}] %c${message}`, callerStyle, releaseStyle);
  }
};

// --- Logger for General Interactions (change, input) ---
const interactionStyle: string = `${baseStyle} background-color: #7d7d7d;`; // Gray
export const logInteraction = (callerName: string, message: string): void => {
  if (DEBUG && debugConfig.logClicksAndInputs) {
    console.log(`%c[${callerName}] %c${message}`, callerStyle, interactionStyle);
  }
};

// --- Logger for Manager/System Events ---
const managerStyle: string = `${baseStyle} background-color: #fbbc05; color: black;`; // Yellow
export const logManagerAction = (callerName: string, message: string, element?: Element): void => {
  if (DEBUG && debugConfig.logComposableManagerEvents) {
    if (element) {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, managerStyle, element);
    } else {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, managerStyle);
    }
  }
};

// --- Logger for Pinia Store Actions ---
const storeStyle: string = `${baseStyle} background-color: #d93025;`; // Red
export const logStoreAction = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logStoreActions) {
    if (data) {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, storeStyle, data);
    } else {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, storeStyle);
    }
  }
};

// --- Logger for Global Click Events ---
const globalEventStyle: string = `${baseStyle} background-color: #ff6f00;`; // Orange
export const logGlobalEvent = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logUIEvents) {
    if (data) {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, globalEventStyle, data);
    } else {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, globalEventStyle);
    }
  }
};

// --- Logger for Vue Component Lifecycle Events ---
const lifecycleStyle: string = `${baseStyle} background-color: #1a73e8;`; // Darker Blue
export const logLifecycle = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logComponentMounts) {
    if (data) {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, lifecycleStyle, data);
    } else {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, lifecycleStyle);
    }
  }
};

// --- Logger for Vue Transition Events ---
const transitionStyle: string = `${baseStyle} background-color: #00bcd4;`; // Cyan
export const logTransition = (callerName: string, message: string, element: Element): void => {
  if (DEBUG && debugConfig.logUIEvents) {
    // Re-using the logUIEvents flag for transitions
    console.log(`%c[${callerName}] %c${message}`, callerStyle, transitionStyle, element);
  }
};

// --- Logger for File Selection Events ---
const selectionStyle: string = `${baseStyle} background-color: #8e44ad;`; // Purple
export const logSelectionChange = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logFileSelection) {
    if (data) {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, selectionStyle, data);
    } else {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, selectionStyle);
    }
  }
};

// --- Logger for Drag and Drop Events ---
const dragDropStyle: string = `${baseStyle} background-color: #673ab7;`; // Deep Purple
export const logDragDropEvent = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logDragAndDrop) {
    if (data) {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, dragDropStyle, data);
    } else {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, dragDropStyle);
    }
  }
};

// --- Logger for Active Drop Zone ---
const dropZoneStyle: string = `${baseStyle} background-color: #00acc1;`; // Bright Cyan
export const logDropZoneEvent = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logDragAndDrop) {
    if (data) {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, dropZoneStyle, data);
    } else {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, dropZoneStyle);
    }
  }
};

// --- Logger for Failsafe/Cancellation Events ---
const failsafeStyle: string = `${baseStyle} background-color: #e67e22;`; // Carrot Orange
export const logFailsafe = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logDragDropFailsafe) {
    if (data) {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, failsafeStyle, data);
    } else {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, failsafeStyle);
    }
  }
};

// --- Logger for Tracing Events ---
const traceStyle: string = `${baseStyle} background-color: #f44336;`; // Red
export const logTrace = (callerName: string, message: string): void => {
  // Always log traces if the master DEBUG switch is on.
  if (DEBUG) {
    console.log(`%c[${callerName}] %c${message}`, callerStyle, traceStyle);
    console.trace("Trace"); // Add a stack trace for detailed debugging
  }
};

// --- Logger for Developer Warnings ---
const warningStyle: string = `${baseStyle} background-color: #ff9800; color: black;`; // Bright Orange
export const logWarning = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logMissingPropWarnings) {
    if (data) {
      console.warn(`%c[${callerName}] %c${message}`, callerStyle, warningStyle, data);
    } else {
      console.warn(`%c[${callerName}] %c${message}`, callerStyle, warningStyle);
    }
  }
};

// --- Logger for Notification Events ---
const notificationStyle: string = `${baseStyle} background-color: #2196f3;`; // Blue
export const logNotification = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logNotifications) {
    if (data) {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, notificationStyle, data);
    } else {
      console.log(`%c[${callerName}] %c${message}`, callerStyle, notificationStyle);
    }
  }
};
