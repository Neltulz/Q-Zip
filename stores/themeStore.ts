// stores/themeStore.ts @preserve

/** @preserve
 * Manages the application's theme ('light', 'dark', 'system') using Pinia.
 * Works with the theme plugin to sync with the system's color
 * scheme and apply theme-specific styles.
 *
 * Provides:
 * - `theme`: Reactive state for the current theme.
 * - `isEffectiveDark`: A getter that returns true if the active theme is dark.
 * - `setTheme()`: Sets the application theme.
 *
 * Usage Example:
 *
 * ```vue
 * <template>
 * <div>
 * <p>Current Theme: {{ themeStore.theme }}</p>
 * <p>Is Dark?: {{ themeStore.isEffectiveDark }}</p>
 * <button @click="setTheme('dark')">Set Dark Theme</button>
 * </div>
 * </template>
 *
 * <script setup>
 * import { useThemeStore } from '@/stores/themeStore'
 * const themeStore = useThemeStore()
 * const setTheme = (theme) => themeStore.setTheme(theme)
 * </script>
 * ```
 *
 * Used in Files:
 * CompressionSection.vue, JobSelectorArea.vue, themePlugin.ts, TitleBar.vue
 */
// @preserve

import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";

export type Theme = "light" | "dark" | "system";

export const useThemeStore = defineStore(
  "theme",
  () => {
    // State
    const theme: Ref<Theme> = ref("system");
    const isSystemDark: Ref<boolean> = ref(false);

    // Getters
    const isEffectiveDark = computed((): boolean => {
      if (theme.value === "system") {
        return isSystemDark.value;
      }
      return theme.value === "dark";
    });

    // Actions
    function setTheme(newTheme: Theme): void {
      console.log(`[themeStore] Setting theme to: ${newTheme}`);
      theme.value = newTheme;
    }

    function resetTheme(): void {
      theme.value = "system";
    }

    function setSystemDark(isDark: boolean): void {
      isSystemDark.value = isDark;
    }

    return {
      theme,
      isSystemDark,
      isEffectiveDark,
      setTheme,
      resetTheme,
      setSystemDark,
    };
  },
  {
    persist: {
      key: "qzip-theme",
      paths: ["theme"],
    },
  }
);