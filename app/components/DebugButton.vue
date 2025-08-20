<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  DebugButton.vue @preserve
-->
<!-- components/DebugButton.vue @preserve -->
<!--
  DebugButton.vue
  What it is:
  - A draggable debug button that appears on the right side of the window
  - Can be dragged vertically to reposition
  - Clicking it toggles the debug popup
-->
<template>
  <div
    ref="buttonRef"
    class="debug-button"
    :style="buttonStyle"
    data-component-name="DebugButton"
    @mousedown="startDrag"
    @click="handleClick"
  >
    <Icon name="mdi:bug" class="debug-button-icon" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDebugStore } from "@/stores/debugStore";

const debugStore = useDebugStore();
const buttonRef = ref<HTMLElement | null>(null);

// Drag state
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragStartPosition = ref({ x: 0, y: 0 });

// Computed button style
const buttonStyle = computed(() => ({
  // Button is now positioned using CSS, no transform needed
}));

// Handle click (but not drag)
const handleClick = (event: MouseEvent) => {
  if (!isDragging.value) {
    debugStore.toggleDebugPopup();
  }
};

// Start drag operation
const startDrag = (event: MouseEvent) => {
  event.preventDefault();
  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  dragStartPosition.value = {
    x: debugStore.debugButtonPosition.x,
    y: debugStore.debugButtonPosition.y,
  };
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
};

// Handle drag movement
const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;
  
  const deltaX = event.clientX - dragStartX.value;
  const deltaY = event.clientY - dragStartY.value;
  
  const newX = Math.max(20, Math.min(window.innerWidth - 60, dragStartPosition.value.x + deltaX));
  const newY = Math.max(0, Math.min(window.innerHeight - 60, dragStartPosition.value.y + deltaY));
  
  debugStore.updateDebugButtonPosition({
    x: newX,
    y: newY,
  });
};

// Stop drag operation
const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// Update button position when window resizes
const handleResize = () => {
  // Ensure button stays within window bounds after resize
  const currentX = debugStore.debugButtonPosition.x;
  const currentY = debugStore.debugButtonPosition.y;
  
  const newX = Math.max(20, Math.min(window.innerWidth - 60, currentX));
  const newY = Math.max(0, Math.min(window.innerHeight - 60, currentY));
  
  debugStore.updateDebugButtonPosition({
    x: newX,
    y: newY,
  });
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
@import "./DebugButton.scoped.css";
</style>
