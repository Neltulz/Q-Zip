<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  app.vue @preserve 
-->
<template>
  <TitleBar />
  <div class="app-container">
    <ModalContainer />
    <NotificationContainer />
      <DebugPopup />
    <InfoTooltipContainer />
  <DebugButton />
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
import InfoTooltipContainer from "@/components/InfoTooltipContainer.vue";
import { provideScrollContainer } from "@/composables/useScrollContainer";
import { zoomIn, zoomOut, resetZoom, setFileTableZoomFactor, getFileTableZoomFactor, getZoomFactor, setZoomFactor } from "@/composables/useZoom";
import { enableSelectionLock, disableSelectionLock } from "@/composables/useSelectionLock";
import { useKeyboardLogger } from "@/composables/useKeyboardLogger";
import { useDebugStore } from "@/stores/debugStore";
import { logGlobalEvent } from "@/utils/loggers";
provideScrollContainer();
const layoutStore = useLayoutStore();
const userPreferencesStore = useUserPreferencesStore();
const jobsStore = useJobsStore();
const dragDropStore = useDragDropStore();
const uiStore = useUiStore();
const debugStore = useDebugStore();

// Initialize keyboard logging
useKeyboardLogger();
const handleGlobalKeyDown = (event: KeyboardEvent): void => {
  if (event.key === "Escape") {
    // Universal escape handler for any active drag operation
    if (dragDropStore.isInternalDragActive) {
      dragDropStore.endInternalDrag();
    }
  }
  
  // Debug popup keyboard shortcut: Ctrl + Alt + Shift + B (for "Bug")
  // if (event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === "b") {
  //   event.preventDefault();
  //   debugStore.toggleDebugPopup();
  // }
  
  // Global refresh shortcuts
  if (event.ctrlKey || event.metaKey) {
    // Ctrl + F5 - always refreshes the browser
    if (event.key === "F5") {
      event.preventDefault();
      
      logGlobalEvent("App", "Ctrl+F5: Global browser refresh triggered");
      
      // Check if we're in development mode (localhost)
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        // In development mode, reload the page
        logGlobalEvent("App", "Ctrl+F5: Reloading page in development mode");
        window.location.reload();
      } else {
        // In production mode, we might want to restart the Tauri app
        // For now, just reload the page
        logGlobalEvent("App", "Ctrl+F5: Reloading page in production mode");
        window.location.reload();
      }
    }
    
    // Ctrl + Shift + R - hard refresh (clears cache if possible)
    if (event.shiftKey && event.key.toLowerCase() === "r") {
      event.preventDefault();
      
      logGlobalEvent("App", "Ctrl+Shift+R: Hard refresh triggered");
      
      // Check if we're in development mode (localhost)
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        // In development mode, try to clear cache and reload
        logGlobalEvent("App", "Ctrl+Shift+R: Hard refresh in development mode");
        // Force reload from server (bypass cache)
        window.location.reload(true);
      } else {
        // In production mode, just reload the page
        logGlobalEvent("App", "Ctrl+Shift+R: Hard refresh in production mode");
        window.location.reload();
      }
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
  // Ensure a dropdown container exists in the document body for teleports.
  try {
    if (typeof document !== 'undefined') {
      let container = document.getElementById('dropdown-content-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'dropdown-content-container';
        document.body.appendChild(container);
      }
    }
  } catch (e) {
    // ignore (SSR or restricted envs)
  }
  uiStore.notifications = [];
  // Disable text selection globally by default (except form controls)
  enableSelectionLock();
  // Re-apply saved zoom factors on mount so refresh restores previous zooms
  try {
    setZoomFactor(getZoomFactor());
  } catch (e) {
    // ignore
  }
  try {
    setFileTableZoomFactor(getFileTableZoomFactor());
  } catch (e) {
    // ignore
  }
  // Keyboard shortcuts for zoom (increment by 0.5 using CSS `--zoom` variable)
  const zoomKeyHandler = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    // Route keyboard zoom to file-table when the mouse is over the file table
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      if (lastIsInFileTable) {
        const current = getFileTableZoomFactor();
        setFileTableZoomFactor(current + 0.05);
      } else {
        zoomIn();
      }
    } else if (e.key === "-") {
      e.preventDefault();
      if (lastIsInFileTable) {
        const current = getFileTableZoomFactor();
        setFileTableZoomFactor(current - 0.05);
      } else {
        zoomOut();
      }
    } else if (e.key.toLowerCase() === "0") {
      e.preventDefault();
      if (lastIsInFileTable) {
        setFileTableZoomFactor(1);
      } else {
        resetZoom();
      }
    }
  };
  window.addEventListener("keydown", zoomKeyHandler);
  // Track whether the mouse cursor is currently over the file-table component so we
  // can route zoom commands (keyboard/wheel) to the file table when the cursor
  // is over it.
  let lastIsInFileTable = false;
  const mouseMoveTracker = (ev: MouseEvent) => {
    try {
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      lastIsInFileTable = !!(el && el.closest && el.closest(".file-table-comp"));
    } catch (e) {
      lastIsInFileTable = false;
    }
  };
  window.addEventListener("mousemove", mouseMoveTracker, { passive: true });
  // Broadcast a custom event when the user clicks outside any job-content so
  // components (like FileTable) can become inactive.
  const outsideClickHandler = (ev: MouseEvent) => {
    try {
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const inJob = !!(el && el.closest && el.closest(".job-content"));
      if (!inJob) {
        window.dispatchEvent(new CustomEvent("app:clicked-outside-job-content"));
      }
    } catch (e) {
      // ignore
    }
  };
  window.addEventListener("click", outsideClickHandler, { passive: true });
  // Ctrl + wheel to zoom (global). We'll route zoom to the file-table when the
  // mouse cursor is over the job-content area (tracked by mouseMoveTracker).
  const wheelHandler = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    // Determine delta: positive deltaY means wheel DOWN (zoom out), negative means UP (zoom in)
    const delta = e.deltaY;
    const increment = delta < 0 ? 1 : -1;
    if (lastIsInFileTable) {
      const current = getFileTableZoomFactor();
      setFileTableZoomFactor(current + increment * 0.05);
      return;
    }
    // otherwise global zoom
    if (delta < 0) zoomIn();
    else zoomOut();
  };
  window.addEventListener("wheel", wheelHandler, { passive: false });
  // Ensure we remove the handlers we registered inside this onMounted when the component unmounts
  onUnmounted(() => {
    window.removeEventListener("keydown", zoomKeyHandler);
    window.removeEventListener("wheel", wheelHandler);
    window.removeEventListener("mousemove", mouseMoveTracker);
  });
  window.addEventListener("keydown", handleGlobalKeyDown);
});
onUnmounted(() => {
  // Clean up selection lock when app unmounts
  disableSelectionLock();
  window.removeEventListener("keydown", handleGlobalKeyDown);
});
</script>
<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.app-root-dropdown-container {
  /* Provide a base z-index for teleported dropdowns. Dropdowns themselves
     still set z-index on `.dropdown-content`; this keeps a container-level
     baseline that is below the tooltip container. */
  z-index: 100000; /* must be lower than tooltip container (999999) */
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
