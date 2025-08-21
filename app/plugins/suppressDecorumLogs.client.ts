// plugins/suppressDecorumLogs.client.ts
// 
/**
 * Plugin to control DECORUM log messages from tauri-plugin-decorum
 * These messages are harmless but can be noisy during development
 * When decorumMessages is false, messages are suppressed
 * When decorumMessages is true, messages are shown
 */

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (process.client) {
    // Apply console override immediately to catch early DECORUM messages
    // Store original console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // Create filter function that checks current state
    const shouldSuppress = (message: string): boolean => {
      // Get current debug config state
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const globalObj = (window as any);
        if (globalObj.__QZIP_DEBUG_GET) {
          const config = globalObj.__QZIP_DEBUG_GET();
          // When decorumMessages is false, we should suppress DECORUM messages
          if (!config.decorumMessages) {
            return typeof message === 'string' && message.includes('DECORUM');
          }
        } else {
          // If debug system isn't loaded yet, default to suppressing DECORUM messages
          // This prevents DECORUM messages from showing before the debug system is ready
          return typeof message === 'string' && message.includes('DECORUM');
        }
      } catch (e) {
        // If we can't get the config, default to suppressing (safer)
        return typeof message === 'string' && message.includes('DECORUM');
      }
      return false; // Don't suppress if option is enabled or unavailable
    };

    // Override console.log
    console.log = (...args: any[]) => {
      const firstArg = args[0];
      if (shouldSuppress(firstArg)) {
        return; // Suppress the message
      }
      originalLog.apply(console, args);
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const firstArg = args[0];
      if (shouldSuppress(firstArg)) {
        return; // Suppress the message
      }
      originalWarn.apply(console, args);
    };

    // Override console.error
    console.error = (...args: any[]) => {
      const firstArg = args[0];
      if (shouldSuppress(firstArg)) {
        return; // Suppress the message
      }
      originalError.apply(console, args);
    };

    // Log that the filter is loaded (only if debug logging is enabled)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globalObj = (window as any);
      if (globalObj.__QZIP_DEBUG_GET) {
        const config = globalObj.__QZIP_DEBUG_GET();
        // Only log if any debug logging is enabled
        const hasAnyLoggingEnabled = Object.entries(config).some(([key, value]) =>
          (key.startsWith('log') || key === 'decorumMessages') && value === true
        );
        if (hasAnyLoggingEnabled) {
          console.log('%c🔇 DECORUM log filter loaded', 'background: #9c27b0; color: white; padding: 2px 4px; border-radius: 3px;');
        }
      }
    } catch (e) {
      // If we can't check debug state, don't log anything
    }
  }
});
