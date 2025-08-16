// plugins/vueWarningLogger.client.ts
// 
/**
 * @preserve
 * Description:
 * A plugin to intercept Vue warnings and log them for debugging purposes.
 * This helps identify component attribute inheritance issues and other Vue warnings.
 */

import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logVueWarning } from "@/utils/loggers";

export default defineNuxtPlugin(() => {
  if (!DEBUG || !debugConfig.logVueWarnings) return;

  // Store the original console.warn
  const originalWarn = console.warn;

  // Override console.warn to intercept Vue warnings
  console.warn = function (...args: any[]) {
    const message = args[0];

    // Check if this is a Vue warning about non-props attributes
    if (typeof message === 'string' && message.includes('Extraneous non-props attributes')) {
      logVueWarning("VueWarningLogger", "Vue attribute inheritance warning detected", {
        message: args.join(' '),
        stack: new Error().stack
      });
    }

    // Check if this is a Vue warning about non-emits event listeners
    if (typeof message === 'string' && message.includes('non-emits event listeners')) {
      logVueWarning("VueWarningLogger", "Vue event listener warning detected", {
        message: args.join(' '),
        stack: new Error().stack
      });
    }

    // Call the original console.warn
    originalWarn.apply(console, args);
  };
});
