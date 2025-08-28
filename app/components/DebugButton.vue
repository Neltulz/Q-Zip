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
  <Teleport to="body">
    <div
      ref="buttonRef"
      class="debug-button"
      :style="buttonStyle"
      data-component-name="DebugButton"
      @mousedown="startDrag"
      @click="handleClick"
    >
      <Icon name="mdi:bug" class="debug-button-icon" :size="debugStore.debugOptions.debugButtonIconSize || 20" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDebugStore } from "@/stores/debugStore";

const debugStore = useDebugStore();
const buttonRef = ref<HTMLElement | null>(null);

// Debug helpers
const dbgTime = () => new Date().toISOString();
const dbgDump = (v: any) => {
  try {
    return JSON.stringify(v);
  } catch (e) {
    return String(v);
  }
};
const dbgLog = (label: string, obj?: any) => {
  if (obj !== undefined) console.log(`%c[${dbgTime()}] ${label}`, 'color: #3f51b5; font-weight: bold;', obj);
  else console.log(`%c[${dbgTime()}] ${label}`, 'color: #3f51b5; font-weight: bold;');
};

// Throttled logger for high-frequency drag events
let lastHandleDragLogAt = 0;
let lastLoggedPos = { x: 0, y: 0 };
const handleDragLogIfNeeded = (label: string, obj?: any, force = false) => {
  const now = Date.now();
  const minInterval = 120; // ms
  // significant movement threshold
  const moveThreshold = 6;
  const pos = debugStore.debugButtonPosition;
  const dx = Math.abs(pos.x - lastLoggedPos.x);
  const dy = Math.abs(pos.y - lastLoggedPos.y);
  const moved = dx > moveThreshold || dy > moveThreshold;
  if (force || moved || now - lastHandleDragLogAt > minInterval) {
    lastHandleDragLogAt = now;
    lastLoggedPos.x = pos.x;
    lastLoggedPos.y = pos.y;
    dbgLog(label, obj);
  }
};

// Drag state
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragStartPosition = ref({ x: 0, y: 0 });

// Track if we just finished a significant drag operation to prevent accidental clicks
const justFinishedDragging = ref(false);

// Drag threshold - minimum distance to consider it a "real" drag vs just a click
const DRAG_THRESHOLD = 5; // pixels

// Track button size for positioning - now reactive to debug options
const buttonSize = computed(() => debugStore.debugOptions.debugButtonSize ?? 34);

// Debug logging state
let debugLoggingInterval: number | null = null;








    // Simple button style with basic viewport constraints
  const buttonStyle = computed(() => {
    const pos = debugStore.debugButtonPosition;
    const backdropBlur = debugStore.debugOptions.debugButtonBackdropBlur ?? 5;
    const backgroundColor = debugStore.debugOptions.debugButtonBackgroundColor ?? 'hsla(0, 0%, 0%, 0.5)';
    const borderColor = debugStore.debugOptions.debugButtonBorderColor ?? 'hsla(210, 100%, 50%, 0.8)';

    const style: Record<string, string> = {
        left: `${Math.max(0, Math.min(pos.x, window.innerWidth - buttonSize.value))}px`,
        top: `${Math.max(0, Math.min(pos.y, window.innerHeight - buttonSize.value))}px`,
        width: `${buttonSize.value}px`,
        height: `${buttonSize.value}px`,
        backgroundColor: backgroundColor,
        border: `2px solid ${borderColor}`,
      };

    // Only apply backdrop filter if blur value is greater than 0
    if (backdropBlur > 0) {
      style.backdropFilter = `blur(${backdropBlur}px)`;
    }

    return style;
  });

// Handle click (but not drag)
const handleClick = (event: MouseEvent) => {
  // Allow clicks unless we just finished a significant drag operation
  if (!isDragging.value && !justFinishedDragging.value) {
    debugStore.toggleDebugPopup();
  } else if (justFinishedDragging.value) {
    // Prevent the click if we just finished a significant drag
    event.preventDefault();
    event.stopPropagation();
  }
};

// Simple drag movement handler
const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;

  const deltaX = event.clientX - dragStartX.value;
  const deltaY = event.clientY - dragStartY.value;

  // Calculate new position with viewport constraints
  const newX = Math.max(0, Math.min(window.innerWidth - buttonSize.value, dragStartPosition.value.x + deltaX));
  const newY = Math.max(0, Math.min(window.innerHeight - buttonSize.value, dragStartPosition.value.y + deltaY));

  // Update button position
    debugStore.updateDebugButtonPosition({ x: newX, y: newY });
};

// Stop drag operation
const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);

  // Calculate total drag distance to determine if it was a significant drag
  const finalPos = debugStore.debugButtonPosition;
  const startPos = dragStartPosition.value;
  const dragDistance = Math.sqrt(
    Math.pow(finalPos.x - startPos.x, 2) + Math.pow(finalPos.y - startPos.y, 2)
  );

  // Stop logging
  if (debugLoggingInterval !== null) {
    clearInterval(debugLoggingInterval);
    debugLoggingInterval = null;
  }

  // Only prevent clicks if this was a significant drag operation
  if (dragDistance > DRAG_THRESHOLD) {
    justFinishedDragging.value = true;

    // Reset the flag after a short delay to allow normal clicks again
    setTimeout(() => {
      justFinishedDragging.value = false;
    }, 100);
  }
};

// Start drag operation
const startDrag = (event: MouseEvent) => {
  event.preventDefault();

  // Reset the drag-finished flag when starting a new drag
  justFinishedDragging.value = false;
  
  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  dragStartPosition.value = { ...debugStore.debugButtonPosition };

  // Start logging position every 100ms while dragging
  if (debugLoggingInterval !== null) {
    clearInterval(debugLoggingInterval);
  }
  debugLoggingInterval = window.setInterval(() => {
    // Only emit periodic moving logs while the user is actively dragging.
    if (!isDragging.value) {
      if (debugLoggingInterval !== null) {
        clearInterval(debugLoggingInterval);
        debugLoggingInterval = null;
      }
      return;
    }
    const pos = debugStore.debugButtonPosition;
    console.log(`%c[DEBUG BUTTON MOVING] x=${pos.x.toFixed(1)} y=${pos.y.toFixed(1)}`, 'color: #ff9800; font-weight: bold;');
  }, 100);

  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
};



// Update button position when window resizes
const handleResize = () => {
  const currentX = debugStore.debugButtonPosition.x;
  const currentY = debugStore.debugButtonPosition.y;
  const clampedX = Math.max(0, Math.min(window.innerWidth - buttonSize.value, currentX));
  const clampedY = Math.max(0, Math.min(window.innerHeight - buttonSize.value, currentY));
  debugStore.updateDebugButtonPosition({ x: clampedX, y: clampedY });
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
