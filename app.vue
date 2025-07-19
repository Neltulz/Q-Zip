<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- app.vue @preserve -->
<!--
  Description:
  The root component of the application. It includes a 'keydown' event listener
  for the Escape key to act as a manual failsafe for a stuck drag-and-drop
  overlay. The global @dragover.prevent handler has been removed and relocated
  to JobArea.vue to properly handle the drop cursor.

  Usage Example:
  This component is the main entry point managed by Nuxt.
-->
<template>
  <div class="app-container" @contextmenu="handleContextMenu">
    <TitleBar />
    <ModalContainer />
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

    <!-- Global Right-Click Context Menu -->
    <DropdownMenu ref="contextMenuRef" dropdown-data-name="app-context-menu" hide-trigger>
      <template #default="{ close }">
        <CustomButton
          button-style-class="trans-btn btn-dark can-become-active active-line-block-end"
          data-name="context-menu-settings"
          first-icon-name="mdi:cog"
          :first-icon-size="20"
          @click="onContextMenuClick('Settings', close)"
        >
          Settings
        </CustomButton>
        <CustomButton
          button-style-class="trans-btn btn-liter can-become-active active-line-block-end"
          data-name="context-menu-help"
          first-icon-name="mdi:help-circle"
          :first-icon-size="20"
          @click="onContextMenuClick('Help', close)"
        >
          Help
        </CustomButton>
        <hr />
        <CustomButton
          button-style-class="trans-btn btn-liter can-become-active active-line-block-end"
          data-name="context-menu-about"
          first-icon-name="mdi:information"
          :first-icon-size="20"
          @click="onContextMenuClick('About', close)"
        >
          About
        </CustomButton>
      </template>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted, onUnmounted, ref, watch } from "vue";
import { useLayoutStore } from "@/stores/layoutStore";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
import { useJobsStore } from "@/stores/jobsStore";
import { useDragDropStore } from "@/stores/dragDropStore";
import { logGlobalEvent, logStoreAction, logFailsafe } from "@/utils/loggers";
import DropdownMenu from "@/components/DropdownMenu.vue";

const layoutStore = useLayoutStore();
const userPreferencesStore = useUserPreferencesStore();
const jobsStore = useJobsStore();
const dragDropStore = useDragDropStore();

const contextMenuRef = ref<InstanceType<typeof DropdownMenu> | null>(null);

/**
 * Failsafe handler for the Escape key. Allows the user to manually cancel
 * a stuck drag-over overlay.
 * @param {KeyboardEvent} event - The keyboard event.
 */
const handleGlobalKeyDown = (event: KeyboardEvent): void => {
  if (event.key === "Escape") {
    if (dragDropStore.isExternalDragOver) {
      logFailsafe("app.vue", `Drag-over state canceled due to: Escape key press`);
      dragDropStore.setExternalDragOver(false);
    }
  }
};

/**
 * Shows the custom context menu, but only if a drag operation is not in progress.
 * @param {MouseEvent} event - The mouse event.
 */
const handleContextMenu = (event: MouseEvent): void => {
  if (dragDropStore.isExternalDragOver) {
    logGlobalEvent("app.vue", "Context menu blocked due to active drag operation.");
    return;
  }

  const targetElement = event.target as HTMLElement;
  if (targetElement.closest("[data-has-context-menu]")) {
    logGlobalEvent("app.vue", "Context menu event handled by a child component.");
    return;
  }

  event.preventDefault();
  logGlobalEvent("app.vue", "Default context menu triggered on element:", targetElement);
  contextMenuRef.value?.openDropdown({ x: event.clientX, y: event.clientY });
};

const onContextMenuClick = (item: string, close: () => void): void => {
  console.log(`Context menu item clicked: ${item}`);
  close();
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
  // Failsafe: Ensure the drag-over state is always false on startup.
  dragDropStore.setExternalDragOver(false);
  logStoreAction("app.vue", `Initial value of isExternalDragOver on mount: ${dragDropStore.isExternalDragOver}`);

  // Add global listener for Escape key cancellation.
  window.addEventListener("keydown", handleGlobalKeyDown);
});

onUnmounted(() => {
  // Clean up global listeners to prevent memory leaks.
  window.removeEventListener("keydown", handleGlobalKeyDown);
});

// Watch the drag-over state for debugging purposes.
watch(
  () => dragDropStore.isExternalDragOver,
  (newValue) => {
    logStoreAction("app.vue", `isExternalDragOver state changed to: ${newValue}`);
  }
);
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Ensure the container takes full viewport height */
}

/* Define the fade transition for layout changes */
.layout-fade-enter-active,
.layout-fade-leave-active {
  transition: opacity 250ms ease;
}

.layout-fade-enter-from,
.layout-fade-leave-to {
  opacity: 0;
}

.layout-wrapper {
  flex-grow: 1; /* Allow the layout wrapper to take remaining height */
  padding-block-start: var(--title-bar-height); /* Offset for the global TitleBar */
}
</style>
