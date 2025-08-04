<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- app.vue @preserve -->
<template>
  <div class="app-container">
    <TitleBar />
    <ModalContainer />
    <NotificationContainer />
    <Transition name="layout-fade" mode="out-in">
      <!--
        Wrap NuxtLayout in a div with a key to ensure a single root element
        for the Transition component and to properly trigger transitions
        when the layout name changes.
      -->
      <div :key="layoutStore.currentLayout" class="layout-wrapper">
        <NuxtLayout :name="layoutStore.currentLayout" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted, onUnmounted } from "vue";
import { useLayoutStore } from "@/stores/layoutStore";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
import { useJobsStore } from "@/stores/jobsStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { useUiStore } from "@/stores/uiStore";
import NotificationContainer from "@/components/NotificationContainer.vue";
import { provideScrollContainer } from "@/composables/useScrollContainer";

provideScrollContainer();

const layoutStore = useLayoutStore();
const userPreferencesStore = useUserPreferencesStore();
const jobsStore = useJobsStore();
const dragDropStore = useDragDropStore();
const uiStore = useUiStore();

const handleGlobalKeyDown = (event: KeyboardEvent): void => {
  if (event.key === "Escape") {
    // Universal escape handler for any active drag operation
    if (dragDropStore.isInternalDragActive) {
      dragDropStore.endInternalDrag();
    }
  }
};

onBeforeMount((): void => {
  if (userPreferencesStore.skipWelcomeScreen) {
    layoutStore.showDefaultLayout();
    if (userPreferencesStore.startFreshDefault) {
      jobsStore.resetJobs();
      jobsStore.resetGlobalSettings();
    }
  }
});

onMounted(() => {
  uiStore.notifications = [];
  window.addEventListener("keydown", handleGlobalKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeyDown);
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.layout-fade-enter-active,
.layout-fade-leave-active {
  transition: opacity 250ms ease;
}

.layout-fade-enter-from,
.layout-fade-leave-to {
  opacity: 0;
}

.layout-wrapper {
  flex-grow: 1;
  padding-block-start: var(--title-bar-height);
}
</style>
