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

// Helper function to get a formatted timestamp
const getTimestamp = (): string => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

// Base styles for the log messages
const baseStyle: string = "border-radius: 3px; padding: 2px 4px; color: white;";
const callerStyle: string = "color: #9c27b0; font-weight: bold;"; // Purple
const timestampStyle: string = "color: #666; font-weight: normal;";

// --- Logger for Button Presses (mousedown) ---
const pressStyle: string = `${baseStyle} background-color: #34a853;`; // Green
export const logButtonPress = (callerName: string, message: string): void => {
  if (DEBUG && debugConfig.logClicksAndInputs) {
    console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, pressStyle);
  }
};

// --- Logger for Button Releases (mouseup) ---
const releaseStyle: string = `${baseStyle} background-color: #4285f4;`; // Blue
export const logButtonRelease = (callerName: string, message: string): void => {
  if (DEBUG && debugConfig.logClicksAndInputs) {
    console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, releaseStyle);
  }
};

// --- Logger for General Interactions (change, input) ---
const interactionStyle: string = `${baseStyle} background-color: #7d7d7d;`; // Gray
export const logInteraction = (callerName: string, message: string): void => {
  if (DEBUG && debugConfig.logClicksAndInputs) {
    console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, interactionStyle);
  }
};

// --- Logger for Manager/System Events ---
const managerStyle: string = `${baseStyle} background-color: #fbbc05; color: black;`; // Yellow
export const logManagerAction = (callerName: string, message: string, element?: Element): void => {
  if (DEBUG && debugConfig.logComposableManagerEvents) {
    if (element) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, managerStyle, element);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, managerStyle);
    }
  }
};

// --- Logger for Pinia Store Actions ---
const storeStyle: string = `${baseStyle} background-color: #d93025;`; // Red
export const logStoreAction = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logStoreActions) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, storeStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, storeStyle);
    }
  }
};

// --- Logger for Global Click Events ---
const globalEventStyle: string = `${baseStyle} background-color: #ff6f00;`; // Orange
export const logGlobalEvent = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logUIEvents) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, globalEventStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, globalEventStyle);
    }
  }
};

// --- Logger for Vue Component Lifecycle Events ---
const lifecycleStyle: string = `${baseStyle} background-color: #1a73e8;`; // Darker Blue
export const logLifecycle = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logComponentMounts) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, lifecycleStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, lifecycleStyle);
    }
  }
};

// --- Logger for Vue Transition Events ---
const transitionStyle: string = `${baseStyle} background-color: #00bcd4;`; // Cyan
export const logTransition = (callerName: string, message: string, element: Element): void => {
  if (DEBUG && debugConfig.logUIEvents) {
    // Re-using the logUIEvents flag for transitions
    console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, transitionStyle, element);
  }
};

// --- Logger for File Selection Events ---
const selectionStyle: string = `${baseStyle} background-color: #8e44ad;`; // Purple
export const logSelectionChange = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logFileSelection) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, selectionStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, selectionStyle);
    }
  }
};

// --- Logger for Drag and Drop Events ---
const dragDropStyle: string = `${baseStyle} background-color: #673ab7;`; // Deep Purple
export const logDragDropEvent = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logDragAndDrop) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, dragDropStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, dragDropStyle);
    }
  }
};

// --- Logger for Active Drop Zone ---
const dropZoneStyle: string = `${baseStyle} background-color: #00acc1;`; // Bright Cyan
export const logDropZoneEvent = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logDragAndDrop) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, dropZoneStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, dropZoneStyle);
    }
  }
};

// --- Logger for Failsafe/Cancellation Events ---
const failsafeStyle: string = `${baseStyle} background-color: #e67e22;`; // Carrot Orange
export const logFailsafe = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logDragDropFailsafe) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, failsafeStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, failsafeStyle);
    }
  }
};

// --- Logger for Tracing Events ---
const traceStyle: string = `${baseStyle} background-color: #f44336;`; // Red
export const logTrace = (callerName: string, message: string): void => {
  // Always log traces if the master DEBUG switch is on.
  if (DEBUG) {
    console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, traceStyle);
    console.trace("Trace"); // Add a stack trace for detailed debugging
  }
};

// --- Logger for Developer Warnings ---
const warningStyle: string = `${baseStyle} background-color: #ff9800; color: black;`; // Bright Orange
export const logWarning = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logMissingPropWarnings) {
    if (data) {
      console.warn(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, warningStyle, data);
    } else {
      console.warn(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, warningStyle);
    }
  }
};

// --- Logger for Notification Events ---
const notificationStyle: string = `${baseStyle} background-color: #2196f3;`; // Blue
export const logNotification = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logNotifications) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, notificationStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, notificationStyle);
    }
  }
};

// --- Logger for Loading Events ---
const loadingStyle: string = `${baseStyle} background-color: #009688;`; // Teal
export const logLoading = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logLoadingEvents) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, loadingStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, loadingStyle);
    }
  }
};

// --- Logger for Rendering Events ---
const renderingStyle: string = `${baseStyle} background-color: #607d8b;`; // Blue Gray
export const logRendering = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logRenderingEvents) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, renderingStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, renderingStyle);
    }
  }
};

// --- Logger for UI Interactivity Events ---
const uiInteractivityStyle: string = `${baseStyle} background-color: #8bc34a; color: black;`; // Light Green
export const logUI = (callerName: string, message: string, data?: unknown): void => {
  if (DEBUG && debugConfig.logUIInteractivity) {
    if (data) {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, uiInteractivityStyle, data);
    } else {
      console.log(`%c${getTimestamp()} %c[${callerName}] %c${message}`, timestampStyle, callerStyle, uiInteractivityStyle);
    }
  }
};
