<!-- layouts/default.vue @preserve -->
<!-- Description: This file defines the default layout of the application, including the main content area where different pages are displayed with transition animations. The TitleBar is now managed globally in app.vue. -->
<!-- Usage Example: This layout is automatically applied as the main layout for the Nuxt.js application. -->
<template>
  <div class="default-layout">
    <UApp>
      <div class="page-wrapper">
        <Transition :name="navStore.transitionName">
          <component :is="activePageComponent" />
        </Transition>
      </div>
    </UApp>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import { useNavigationStore, type PageName } from "@/stores/navigationStore";
import PageJobSetup from "@/components/page-components/PageJobSetup.vue";
import PageJobQueue from "@/components/page-components/PageJobQueue.vue";
import PageProgress from "@/components/page-components/PageProgress.vue";

const navStore = useNavigationStore();

// A map to associate page names with their components.
const pages: Record<PageName, Component> = {
  JobSetup: PageJobSetup,
  JobQueue: PageJobQueue,
  Progress: PageProgress,
};

// A computed property to dynamically resolve the active component.
const activePageComponent = computed(() => {
  return pages[navStore.activePage];
});
</script>

<style>
/* --- SHARED STYLES (UNCHANGED) --- */
/*
  The transitioning elements are assigned to the same grid cell to ensure they
  overlap gracefully. This prevents layout shifts and visual flicker.
  A transform and opacity transition is applied for a smooth slide-and-fade effect.
*/
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  grid-area: 1 / 1;
  transition-duration: 0.3s; /* Slightly slower for clarity */
  transition-property: opacity, transform;
  transition-timing-function: cubic-bezier(0.55, 0, 0.1, 1); /* Smoother ease */
}

.page-fade-enter-active,
.page-fade-leave-active {
  grid-area: 1 / 1;
  transition: opacity 500ms ease-in-out;
}

/* --- LEAVE-TO / ENTER-FROM STATES (UNCHANGED) --- */

/* Default Fade (Fallback) */
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* Slide Left (Navigating FORWARD, e.g., Page 1 -> Page 2) */
/* Entering page (Page 2) comes from the right. */
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(50px);
}
/* Leaving page (Page 1) exits to the left. */
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

/* Slide Right (Navigating BACKWARD, e.g., Page 2 -> Page 1) */
/* Entering page (Page 1) comes from the left. */
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-50px);
}
/* Leaving page (Page 2) exits to the right. */
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
</style>

<style scoped>
.default-layout {
  display: grid;
  grid-template-areas: "page";
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  height: 100%;
  overflow: hidden;
  /* Removed padding-block-start as TitleBar is now global */
}

.page-wrapper {
  display: grid;
  grid-template-columns: 1fr;
  height: 100%; /* Prevent collapsing during page transitions */
  overflow: hidden; /* Hide the sliding content that goes outside the bounds */
  padding: var(--pad-in);
  position: relative; /* Needed for child elements if they were to be positioned */
}

@media (width < 1024px) {
  .page-wrapper {
    padding: 0;
  }
}
</style>
