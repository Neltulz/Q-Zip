<!-- 
  components/CustomWindowControls.vue @preserve 
-->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!--
  Description: Custom window control buttons for Linux where Decorum doesn't work properly.
  This component provides minimize, maximize, and close functionality using Tauri's window API.
-->
<template>
  <div class="custom-window-controls" data-component-name="CustomWindowControls">
    <CustomButton
      btn-theme="liter"
      button-style-class="trans-btn window-control-btn"
      data-name="custom-minimize-btn"
      first-icon-name="mdi:chevron-down"
      :first-icon-size="16"
      title="Minimize"
      @click="handleMinimize"
    />
    <CustomButton
      btn-theme="liter"
      button-style-class="trans-btn window-control-btn"
      data-name="custom-maximize-btn"
      :first-icon-name="isMaximized ? 'mdi:crop-square' : 'mdi:rhombus-outline'"
      :first-icon-size="16"
      :title="isMaximized ? 'Restore' : 'Maximize'"
      @click="handleMaximize"
    />
    <CustomButton
      btn-theme="liter"
      button-style-class="trans-btn window-control-btn"
      data-name="custom-close-btn"
      first-icon-name="mdi:close"
      :first-icon-size="16"
      title="Close"
      @click="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { logGlobalEvent } from "@/utils/loggers";

const isMaximized = ref(false);

const handleMinimize = async () => {
  try {
    const window = getCurrentWindow();
    await window.minimize();
    logGlobalEvent("CustomWindowControls", "Window minimized");
  } catch (error) {
    console.error("Failed to minimize window:", error);
  }
};

const handleMaximize = async () => {
  try {
    const window = getCurrentWindow();
    if (isMaximized.value) {
      await window.unmaximize();
      logGlobalEvent("CustomWindowControls", "Window restored");
    } else {
      await window.maximize();
      logGlobalEvent("CustomWindowControls", "Window maximized");
    }
  } catch (error) {
    console.error("Failed to toggle maximize:", error);
  }
};

const handleClose = async () => {
  try {
    const window = getCurrentWindow();
    await window.close();
    logGlobalEvent("CustomWindowControls", "Window close requested");
  } catch (error) {
    console.error("Failed to close window:", error);
  }
};

const updateMaximizeState = async () => {
  try {
    const window = getCurrentWindow();
    isMaximized.value = await window.isMaximized();
  } catch (error) {
    console.error("Failed to get maximize state:", error);
  }
};

onMounted(async () => {
  await updateMaximizeState();
  
  // Listen for window state changes
  const unlistenResize = await getCurrentWindow().listen('tauri://resize', updateMaximizeState);
  const unlistenMove = await getCurrentWindow().listen('tauri://move', updateMaximizeState);
  
  onUnmounted(() => {
    unlistenResize();
    unlistenMove();
  });
});
</script>

<style scoped>
.custom-window-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 100%;
  z-index: 10000;
}

.window-control-btn {
  width: 46px;
  height: 32px;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

/* Style the visual-style div directly */
.window-control-btn > .visual-style {
  border: none !important;
  box-shadow: none !important;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.window-control-btn:hover > .visual-style {
  background-color: var(--bg-clr-lite);
  border: none !important;
  box-shadow: none !important;
}

.window-control-btn[data-name="custom-close-btn"]:hover > .visual-style {
  background-color: hsl(0, 65%, 55%) !important;
}
</style>
