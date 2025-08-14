// stores/userPreferencesStore.ts
// 
/**
 * @preserve
 * Description: This Pinia store manages user preferences related to the application's
 * initial load behavior, specifically whether to skip the welcome screen,
 * whether to start a fresh session or restore a previous one by default,
 * the state of the "Remember My Choice" checkbox, and file table display preferences.
 * The state is persisted using `pinia-plugin-persistedstate`.
 *
 * Provides:
 * - `skipWelcomeScreen`: Reactive state indicating if the welcome screen should be skipped.
 * - `startFreshDefault`: Reactive state indicating if a fresh session should be started
 * by default when the welcome screen is skipped.
 * - `rememberChoicePreference`: Reactive state for the "Remember My Choice" checkbox.
 * - `checkboxMode`: Reactive state for file table checkbox mode (enabled by default).
 * - `autoCheckOnSelect`: Reactive state for auto-checking selected rows (enabled by default).
 * - `setSkipWelcomeScreen()`: Action to set the `skipWelcomeScreen` preference.
 * - `setStartFreshDefault()`: Action to set the `startFreshDefault` preference.
 * - `setRememberChoicePreference()`: Action to set the `rememberChoicePreference` state.
 * - `setCheckboxMode()`: Action to set the `checkboxMode` preference.
 * - `setAutoCheckOnSelect()`: Action to set the `autoCheckOnSelect` preference.
 * - `resetUserPreferences()`: Action to reset all user preferences to their default states.
 *
 * Usage Example:
 * import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
 * const userPreferencesStore = useUserPreferencesStore();
 * userPreferencesStore.setSkipWelcomeScreen(true);
 * userPreferencesStore.setStartFreshDefault(false);
 * userPreferencesStore.setRememberChoicePreference(true);
 * userPreferencesStore.setCheckboxMode(true);
 * userPreferencesStore.setAutoCheckOnSelect(false);
 */
// @preserve
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
export const useUserPreferencesStore = defineStore(
  "userPreferences",
  () => {
    // State
    const skipWelcomeScreen: Ref<boolean> = ref(false);
    const startFreshDefault: Ref<boolean> = ref(false); // true if "Start Fresh" was remembered, false for "Restore Session"
    const rememberChoicePreference: Ref<boolean> = ref(false); // New: State of the "Remember My Choice" checkbox
    const checkboxMode: Ref<boolean> = ref(true); // File table checkbox mode (enabled by default)
    const autoCheckOnSelect: Ref<boolean> = ref(true); // Auto check selected rows (enabled by default)
    // Actions
    /**
     * Sets the preference for skipping the welcome screen on subsequent launches.
     * @param value - `true` to skip the welcome screen, `false` to show it.
     */
    function setSkipWelcomeScreen(value: boolean): void {
      skipWelcomeScreen.value = value;
    }
    /**
     * Sets the default behavior when the welcome screen is skipped.
     * @param value - `true` to start a fresh session, `false` to restore the previous session.
     */
    function setStartFreshDefault(value: boolean): void {
      startFreshDefault.value = value;
    }
    /**
     * Sets the state of the "Remember My Choice" checkbox.
     * @param value - `true` if the checkbox is checked, `false` otherwise.
     */
    function setRememberChoicePreference(value: boolean): void {
      rememberChoicePreference.value = value;
    }
    /**
     * Sets the file table checkbox mode preference.
     * @param value - `true` to enable checkbox mode, `false` to disable it.
     */
    function setCheckboxMode(value: boolean): void {
      checkboxMode.value = value;
    }
    /**
     * Sets the auto check on select preference.
     * @param value - `true` to enable auto checking selected rows, `false` to disable it.
     */
    function setAutoCheckOnSelect(value: boolean): void {
      autoCheckOnSelect.value = value;
    }
    /**
     * Resets all user preferences managed by this store to their initial default values.
     */
    function resetUserPreferences(): void {
      skipWelcomeScreen.value = false;
      startFreshDefault.value = false;
      rememberChoicePreference.value = false; // Reset this preference too
      checkboxMode.value = true; // Reset to default enabled state
      autoCheckOnSelect.value = true; // Reset to default enabled state
    }
    return {
      skipWelcomeScreen,
      startFreshDefault,
      rememberChoicePreference, // Expose the new state
      checkboxMode,
      autoCheckOnSelect,
      setSkipWelcomeScreen,
      setStartFreshDefault,
      setRememberChoicePreference, // Expose the new action
      setCheckboxMode,
      setAutoCheckOnSelect,
      resetUserPreferences,
    };
  },
  {
    /**
     * Persist the state to storage using `pinia-plugin-persistedstate`.
     */
    persist: {
      key: "qzip-user-preferences",
      paths: ["skipWelcomeScreen", "startFreshDefault", "rememberChoicePreference", "checkboxMode", "autoCheckOnSelect"], // Persist all relevant states
    },
  },
);
