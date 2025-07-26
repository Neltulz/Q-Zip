<!-- layouts/welcome.vue @preserve -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!--
  Description: This file defines the welcome layout. It always displays options
  to "Start Fresh" or "Restore Previous Session". The "Restore" button and the
  "Remember My Choice" checkbox are disabled if no previous session data
  exists. When the user makes a choice, it updates the `skipWelcomeScreen`
  preference based on the checkbox. The TitleBar component is now managed globally in app.vue.
-->
<!--
  Usage Example: This layout is dynamically loaded by app.vue based on the
  state in the layoutStore.
-->
<template>
  <div class="welcome-layout">
    <div class="content-wrapper">
      <h1 class="welcome-heading">Welcome</h1>

      <div class="actions-wrapper">
        <CustomButton
          btn-theme="primary"
          button-style-class="bordered-btn"
          class="action-button"
          data-name="start-fresh-btn"
          first-icon-name="mdi:broom"
          justify="start"
          @click="handleStartFresh"
        >
          Start Fresh
        </CustomButton>
        <CustomButton
          btn-theme="default"
          button-style-class="bordered-btn"
          class="action-button"
          data-name="restore-session-btn"
          :disabled="!hasPreviousSession"
          first-icon-name="mdi:restore"
          justify="start"
          @click="handleRestoreSession"
        >
          Restore Previous Session
        </CustomButton>
      </div>

      <!-- "Remember My Choice" checkbox, disabled when there's no session to restore -->
      <div class="remember-choice-wrapper">
        <input
          id="remember-choice"
          v-model="userPreferencesStore.rememberChoicePreference"
          type="checkbox"
          :disabled="!hasPreviousSession"
        />
        <label for="remember-choice">Remember My Choice</label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useLayoutStore } from "@/stores/layoutStore";
import { useJobsStore, defaultGlobalSettings } from "@/stores/jobsStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";

const layoutStore = useLayoutStore();
const jobsStore = useJobsStore();
const navStore = useNavigationStore();
const userPreferencesStore = useUserPreferencesStore();

/**
 * Determines if a previous session exists.
 */
const hasPreviousSession = computed((): boolean => {
  const hasMultipleJobs: boolean = jobsStore.jobs.length > 1;
  // FIX: Use optional chaining `?.` to safely access `files` on a potentially undefined job.
  const singleJobHasFiles: boolean = jobsStore.jobs.length === 1 && (jobsStore.jobs[0]?.files.length ?? 0) > 0;
  const globalSettingsChanged: boolean = JSON.stringify(jobsStore.globalSettings) !== JSON.stringify(defaultGlobalSettings);

  return hasMultipleJobs || singleJobHasFiles || globalSettingsChanged;
});

/**
 * Handles the "Start Fresh" action.
 */
const handleStartFresh = (): void => {
  jobsStore.resetJobs();
  jobsStore.resetGlobalSettings();
  navStore.setActivePage("JobSetup");

  if (userPreferencesStore.rememberChoicePreference && hasPreviousSession.value) {
    userPreferencesStore.setSkipWelcomeScreen(true);
    userPreferencesStore.setStartFreshDefault(true);
  } else {
    userPreferencesStore.setSkipWelcomeScreen(false);
  }
  layoutStore.showDefaultLayout();
};

/**
 * Handles the "Restore Previous Session" action.
 */
const handleRestoreSession = (): void => {
  if (userPreferencesStore.rememberChoicePreference && hasPreviousSession.value) {
    userPreferencesStore.setSkipWelcomeScreen(true);
    userPreferencesStore.setStartFreshDefault(false);
  } else {
    userPreferencesStore.setSkipWelcomeScreen(false);
  }
  layoutStore.showDefaultLayout();
};
</script>

<style scoped>
.welcome-layout {
  align-items: center;
  background-color: var(--bg-clr-darkr);
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: center;
  width: 100vw;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  text-align: center;
}

.welcome-heading {
  color: var(--txt-clr-liter);
  font-size: 3rem;
  font-weight: 600;
}

.actions-wrapper {
  align-items: stretch;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-button {
  font-size: 1.125rem;
  gap: 1em;
  padding-block: 1em;
  padding-inline: 2em;
}

.remember-choice-wrapper {
  align-items: center;
  color: var(--txt-clr-lite);
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-block-start: 1rem;
}

.remember-choice-wrapper:has(input:disabled) {
  pointer-events: none;
  opacity: 0.6;
}

.remember-choice-wrapper > #remember-choice {
  accent-color: var(--primary-clr);
  align-items: center;
  height: 1rem;
  width: 1rem;
}

.remember-choice-wrapper > label[for="remember-choice"] {
  align-items: center;
  display: flex;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
