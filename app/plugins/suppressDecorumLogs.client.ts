// plugins/suppressDecorumLogs.client.ts
// 
/**
 * Plugin to suppress DECORUM log messages from tauri-plugin-decorum
 * These messages are harmless but can be noisy during development
 */

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (process.client) {
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
          if (!config.suppressDecorumLogs) {
            return false;
          }
        }
      } catch (e) {
        // If we can't get the config, default to suppressing (safer)
        return true;
      }
      return typeof message === 'string' && message.includes('DECORUM');
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

    // Log that the filter is loaded (will be suppressed if DECORUM suppression is on)
    console.log('%c🔇 DECORUM log filter loaded', 'background: #9c27b0; color: white; padding: 2px 4px; border-radius: 3px;');
  }
});
