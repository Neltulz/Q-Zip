// plugins/themePlugin.ts
// 
/*
 * Theme Management Plugin
   This plugin manages the application's theme by synchronizing it with the system's color scheme preference
   and the theme store. It:
   - Initializes the theme based on the theme store's state.
   - Sets a '--theme' CSS variable on the HTML element to 'light' or 'dark'.
   - Adds or removes the 'dark' class on the HTML element based on the effective theme.
   - If the theme is 'system', it removes the style attribute, allowing CSS media queries to determine the theme.
   - Watches the theme store for changes and updates the theme accordingly.
   - Listens for system theme changes and updates the store.
   It uses the `useThemeStore` from '~/stores/themeStore' to manage the theme state and is automatically
   applied when registered in the Nuxt configuration.
   @preserve
 */
import { defineNuxtPlugin } from "nuxt/app";
import { useThemeStore, type Theme } from "@/stores/themeStore";
import { watch } from "vue";
export default defineNuxtPlugin((_nuxtApp) => {
  const themeStore = useThemeStore();

  // Check if debug logging is enabled before logging theme info
  const isDebugEnabled = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globalObj = (window as any);
      if (globalObj.__QZIP_DEBUG_GET) {
        const config = globalObj.__QZIP_DEBUG_GET();
        // Only log if any debug logging is enabled
        return Object.entries(config).some(([key, value]) =>
          (key.startsWith('log') || key === 'decorumMessages') && value === true
        );
      }
    } catch (e) {
      // If we can't check debug state, don't log
    }
    return false;
  };

  if (isDebugEnabled()) {
    console.log(`[themePlugin] Initial theme from store: ${themeStore.theme}`);
  }

  const applyTheme = (theme: Theme): void => {
    if (isDebugEnabled()) {
      console.log(`[themePlugin] Applying theme: ${theme}`);
    }
    const htmlElement = document.documentElement;
    // Remove any existing theme-related styles or classes
    htmlElement.removeAttribute("style");
    htmlElement.classList.remove("light", "dark");
    if (theme === "system") {
      // For system theme, rely on CSS media queries
      // The class will be added/removed by the updateSystemPreference based on actual system preference
    } else {
      // For explicit light/dark themes, set the CSS variable and add the class
      htmlElement.style.setProperty("--theme", theme);
      htmlElement.classList.add(theme);
    }
    // Ensure the 'dark' class is correctly applied/removed based on effective darkness
    if (themeStore.isEffectiveDark) {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  };
  // Watch for changes in themeStore.theme and apply theme
  watch(
    () => themeStore.theme,
    (newTheme) => {
      applyTheme(newTheme);
    },
    { immediate: true }
  );
  // Watch for changes in themeStore.isEffectiveDark to update the 'dark' class
  // This is crucial for 'system' theme where isEffectiveDark changes with system preference
  watch(
    () => themeStore.isEffectiveDark,
    (isDark) => {
      const htmlElement = document.documentElement;
      if (isDark) {
        htmlElement.classList.add("dark");
      } else {
        htmlElement.classList.remove("dark");
      }
    },
    { immediate: true }
  );
  // Listen for system theme changes and update the store
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const updateSystemPreference = (): void => {
    themeStore.setSystemDark(mediaQuery.matches);
  };
  mediaQuery.addEventListener("change", updateSystemPreference);
  // Set initial system theme preference on startup
  updateSystemPreference();
});
