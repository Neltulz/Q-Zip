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
      :class="[
        'debug-button',
        { 'attached-bottom': isAttached },
        { 'magnetizing': isMagnetizing }
      ]"
      :style="buttonStyle"
      data-component-name="DebugButton"
      @mousedown="startDrag"
      @click="handleClick"
    >
      <Icon name="mdi:bug" class="debug-button-icon" />
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

// Track button size to compute snapping/constraints
const buttonSize = ref(34); // default matches --min-tch-tgt

// Magnetization thresholds for each edge
const edgeThreshold = 50; // pixels from edge to trigger snapping

// Track which edge the button is snapped to (only set after drag ends)
const snappedEdge = ref<string | null>(null);

// Track when the button is in the process of magnetizing (for smooth transitions)
const isMagnetizing = ref(false);

// Track which transition type is active
const transitionType = ref<'css' | 'js' | null>(null);

// Track the target position during transitions (to override snapped positioning)
const transitionTarget = ref<{ x: number; y: number } | null>(null);

// Flag to disable drag updates during transitions (prevents glitchy movement)
const disableDragUpdates = ref(false);

// Flag to temporarily disable edge detection during detachment
const disableEdgeDetection = ref(false);

// Animation state for dynamic detachment following
let animationFrameId: number | null = null;
let targetMouseX = 0;
let targetMouseY = 0;
// Smooth-move state guard
let isSmoothMoving = false;
let lastSmoothMoveAt = 0;
// Disable edge detection until this timestamp (used to prevent immediate re-detaches)
let disableEdgeUntil = 0;
const edgeDisableAfterSmoothMs = 250;
// Prevent immediate detaches after a snap
let recentlySnappedAt = 0;
const snapGraceMs = 220; // ms to ignore detach intent after snapping
// Throttle/distance config for smooth moves
const smoothCooldownMs = 250; // minimum ms between smooth moves (raised to reduce churn)
const smoothMinDistance = 12; // px minimum distance to start smooth move (raised to ignore micro-detaches)

// Debug logging state
let debugLoggingInterval: number | null = null;
// Hotzone previous edge tracker for logging transitions
let prevHotzoneEdge: string | null = null;
// Hotzone entry/destination positions
let hotzoneEntryPos: { x: number; y: number } | null = null;
let hotzoneDestinationPos: { x: number; y: number } | null = null;

// Explicit finite button state (only these five allowed)
type ButtonState =
  | 'moving-with-cursor'
  | 'attached-to-edge'
  | 'moving-towards-edge'
  | 'moving-away-from-edge'
  | 'no-longer-moving';
const buttonState = ref<ButtonState>('no-longer-moving');
const setButtonState = (s: ButtonState) => {
  if (buttonState.value === s) return;
  dbgLog('STATE', { from: buttonState.value, to: s });
  buttonState.value = s;
};

// Stop all animations and reset state
const stopAllAnimations = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    dbgLog('ANIMATION STOP - cancelled frame', { animationFrameId, pos: debugStore.debugButtonPosition, targetMouseX, targetMouseY, snappedEdge: snappedEdge.value });
  }

  // Clear all transient states
  snappedEdge.value = null;
  isMagnetizing.value = false;
  transitionType.value = null;
  disableDragUpdates.value = false;
  disableEdgeDetection.value = false;
  transitionTarget.value = null;

  if (debugLoggingInterval !== null) {
    // keep logging active while dragging/attaching; only clear on mouseup (stopDrag)
    // clearInterval(debugLoggingInterval);
    // debugLoggingInterval = null;
  }
  // reset smooth move guard when animations forcibly stopped
  isSmoothMoving = false;
  // entering no-longer-moving since animations were explicitly stopped
  setButtonState('no-longer-moving');
  dbgLog('DETACH stopAllAnimations() called', { pos: debugStore.debugButtonPosition, targetMouseX, targetMouseY, snappedEdge: snappedEdge.value });
};

// Complete the attachment animation, keeping the button snapped
const completeAttachmentAnimation = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  // Clear transient states but KEEP snappedEdge
  isMagnetizing.value = false;
  transitionType.value = null;
  disableDragUpdates.value = false;
  transitionTarget.value = null;

  if (debugLoggingInterval !== null) {
    // keep logging active while dragging/attaching; only clear on mouseup (stopDrag)
    // clearInterval(debugLoggingInterval);
    // debugLoggingInterval = null;
  }
  dbgLog('DETACH completeAttachmentAnimation() called', { pos: debugStore.debugButtonPosition, targetMouseX, targetMouseY, snappedEdge: snappedEdge.value });
  // we've finished moving towards the edge
  setButtonState('attached-to-edge');
};

// Animation function for attachment to edges
const startAttachmentAnimation = (startX: number, startY: number, targetX: number, targetY: number, targetEdge: string) => {
  if (animationFrameId !== null) stopAllAnimations();

  isMagnetizing.value = true;
  transitionType.value = 'js';
  disableDragUpdates.value = true;
  snappedEdge.value = targetEdge;
  // initialize transitionTarget to the animation start so the UI doesn't jump
  transitionTarget.value = { x: startX ?? debugStore.debugButtonPosition.x, y: startY ?? debugStore.debugButtonPosition.y };

  dbgLog(`ANIMATION START attachment to ${targetEdge}`, { startX, startY, targetX, targetY, snappedEdge: snappedEdge.value });
  // we're moving towards the edge
  setButtonState('moving-towards-edge');

  const animationSpeed = 0.25;
  const snapDistance = 3;
  let frameCount = 0;

  const animate = () => {
    frameCount++;
    // During JS-driven attachment animation prefer transitionTarget as the
    // authoritative in-flight position to avoid race with store updates.
    const currentPos = transitionTarget.value || debugStore.debugButtonPosition;
    const deltaX = targetX - currentPos.x;
    const deltaY = targetY - currentPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance <= snapDistance || frameCount > 60) {
      // finalize: update store once so persisted position matches final pos
      debugStore.updateDebugButtonPosition({ x: targetX, y: targetY });
      dbgLog(`ANIMATION COMPLETE snapped to ${targetEdge}`, { frameCount, pos: { x: targetX, y: targetY } });
      // record snap time to provide a short grace period to avoid immediate detach
      recentlySnappedAt = Date.now();
      completeAttachmentAnimation(); // Use the new function here
      return;
    }

    const moveX = deltaX * animationSpeed;
    const moveY = deltaY * animationSpeed;
    const newX = currentPos.x + moveX;
    const newY = currentPos.y + moveY;

    // update transient transition target only; don't update store every frame
    transitionTarget.value = { x: newX, y: newY };
    animationFrameId = requestAnimationFrame(animate);
  };
  animationFrameId = requestAnimationFrame(animate);
};

// Smooth move animation for detaching: animate from current position to a target (usually the cursor)
const startSmoothMove = (startX: number, startY: number, targetX: number, targetY: number) => {
  // Prevent repeated starts if we're already smoothing or just started one recently (throttle)
  const now = Date.now();
  if (isSmoothMoving) {
    dbgLog('ANIMATION SKIP smooth move: already running', { startX, startY, targetX, targetY, now, lastSmoothMoveAt });
    return;
  }
  if (now - lastSmoothMoveAt < smoothCooldownMs) {
    dbgLog('ANIMATION SKIP smooth move: cooldown', { now, lastSmoothMoveAt, smoothCooldownMs });
    return;
  }

  // Check distance threshold before starting
  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < smoothMinDistance) {
    dbgLog('ANIMATION SKIP smooth move: too short distance', { dist, smoothMinDistance, startX, startY, targetX, targetY });
    return;
  }

  // mark start
  isSmoothMoving = true;
  lastSmoothMoveAt = now;

  if (animationFrameId !== null) stopAllAnimations();

  isMagnetizing.value = true;
  transitionType.value = 'js';
  disableDragUpdates.value = true;
  transitionTarget.value = { x: startX, y: startY };

  dbgLog('ANIMATION START smooth move', { startX, startY, targetX, targetY, dist });
  // smooth move means moving away from edge or following cursor after detach
  setButtonState('moving-away-from-edge');

  const animationSpeed = 0.25;
  const snapDistance = 3;
  let frameCount = 0;

  const animate = () => {
    frameCount++;
    const currentPos = debugStore.debugButtonPosition;
    const deltaX = targetX - currentPos.x;
    const deltaY = targetY - currentPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance <= snapDistance || frameCount > 60) {
      debugStore.updateDebugButtonPosition({ x: targetX, y: targetY });
      dbgLog('ANIMATION COMPLETE smooth move', { frameCount, pos: { x: targetX, y: targetY } });
      // finish transition state but DO NOT re-enable edge detection here; stopDrag will handle finalization
      isMagnetizing.value = false;
      transitionType.value = null;
      disableDragUpdates.value = false;
      transitionTarget.value = null;
      animationFrameId = null;
      isSmoothMoving = false;
      return;
    }

    const moveX = deltaX * animationSpeed;
    const moveY = deltaY * animationSpeed;
    const newX = currentPos.x + moveX;
    const newY = currentPos.y + moveY;

    debugStore.updateDebugButtonPosition({ x: newX, y: newY });
    transitionTarget.value = { x: newX, y: newY };
    animationFrameId = requestAnimationFrame(animate);
  };
  animationFrameId = requestAnimationFrame(animate);
};


// Whether the button is attached to the bottom (for backward compatibility)
const isAttached = computed(() => {
  return snappedEdge.value === 'bottom';
});

  // Computed button style (absolute position based on snapped edge or transition target)
  const buttonStyle = computed(() => {
    const pos = transitionTarget.value || debugStore.debugButtonPosition;
    const edge = snappedEdge.value;

    // During transitions, use detached positioning even if snapped to an edge
    if (isMagnetizing.value && transitionTarget.value) {
      return {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      } as Record<string, string>;
    }

    let style: Record<string, string>;

    if (edge === 'bottom') {
      // Constrain position to ensure button stays visible
      style = {
        left: `${Math.min(pos.x, window.innerWidth - buttonSize.value)}px`,
        top: `${window.innerHeight - buttonSize.value}px`,
      };
    } else if (edge === 'top') {
      // Constrain position to ensure button stays visible
      style = {
        left: `${Math.min(pos.x, window.innerWidth - buttonSize.value)}px`,
        top: '0px',
      };
    } else if (edge === 'left') {
      // Constrain position to ensure button stays visible
      style = {
        left: '0px',
        top: `${Math.min(pos.y, window.innerHeight - buttonSize.value)}px`,
      };
    } else if (edge === 'right') {
      // Constrain position to ensure button stays visible - use left instead of right
      style = {
        left: `${window.innerWidth - buttonSize.value}px`,
        top: `${Math.min(pos.y, window.innerHeight - buttonSize.value)}px`,
      };
    } else {
      // Default: use absolute positioning with viewport constraints
      style = {
        left: `${Math.max(0, Math.min(pos.x, window.innerWidth - buttonSize.value))}px`,
        top: `${Math.max(0, Math.min(pos.y, window.innerHeight - buttonSize.value))}px`,
      };
    }
    return style;
  });

// Handle click (but not drag)
const handleClick = (event: MouseEvent) => {
  if (!isDragging.value) {
    debugStore.toggleDebugPopup();
  }
};

// Handle drag movement
const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;

  targetMouseX = event.clientX;
  targetMouseY = event.clientY;

  if (isMagnetizing.value || disableDragUpdates.value) {
    return;
  }

  handleDragLogIfNeeded('handleDrag entry', { clientX: event.clientX, clientY: event.clientY, dragStart: dragStartPosition.value, isMagnetizing: isMagnetizing.value, disableDragUpdates: disableDragUpdates.value });

  const deltaX = event.clientX - dragStartX.value;
  const deltaY = event.clientY - dragStartY.value;
  const minX = 8;
  const maxX = Math.max(minX, window.innerWidth - buttonSize.value - 8);
  const maxDragY = window.innerHeight + 40;

  const rawX = dragStartPosition.value.x + deltaX;
  const rawY = dragStartPosition.value.y + deltaY;

  let snappedTo = null;
  if (!disableEdgeDetection.value) {
    const threshold = edgeThreshold;
    const isNearTop = rawY <= threshold;
    const isNearBottom = rawY >= window.innerHeight - buttonSize.value - threshold;
    const isNearLeft = rawX <= threshold;
    const isNearRight = rawX >= window.innerWidth - buttonSize.value - threshold;

    if (isNearTop) snappedTo = 'top';
    else if (isNearBottom) snappedTo = 'bottom';
    else if (isNearLeft) snappedTo = 'left';
    else if (isNearRight) snappedTo = 'right';
  }

  handleDragLogIfNeeded('handleDrag edge detection', { rawX, rawY, snappedTo, snappedEdge: snappedEdge.value, deltaX, deltaY, edgeThreshold });

  // HOTZONE logic (cursor-based: 100px from each edge)
  const hotzoneSize = 100;
  let hotzoneEdge: string | null = null;
  const cursorX = event.clientX;
  const cursorY = event.clientY;
  // Add a small hysteresis so brief cursor jitter doesn't cause rapid enter/exit
  const hotzoneHysteresis = 12;
  const inHotTop = cursorY <= hotzoneSize || (prevHotzoneEdge === 'top' && cursorY <= hotzoneSize + hotzoneHysteresis);
  const inHotBottom = cursorY >= window.innerHeight - hotzoneSize || (prevHotzoneEdge === 'bottom' && cursorY >= window.innerHeight - hotzoneSize - hotzoneHysteresis);
  const inHotLeft = cursorX <= hotzoneSize || (prevHotzoneEdge === 'left' && cursorX <= hotzoneSize + hotzoneHysteresis);
  const inHotRight = cursorX >= window.innerWidth - hotzoneSize || (prevHotzoneEdge === 'right' && cursorX >= window.innerWidth - hotzoneSize - hotzoneHysteresis);
  if (inHotTop) hotzoneEdge = 'top';
  else if (inHotBottom) hotzoneEdge = 'bottom';
  else if (inHotLeft) hotzoneEdge = 'left';
  else if (inHotRight) hotzoneEdge = 'right';

  const inHotzone = !!hotzoneEdge;
  if (isDragging.value && inHotzone) {
    // If we're already attached to this edge, do nothing (keep it stable)
    if (snappedEdge.value === hotzoneEdge && buttonState.value === 'attached-to-edge') {
      // ensure store and logs are updated but don't restart animations
      debugStore.setActiveHotzoneEdge(hotzoneEdge);
      return;
    }

    if (buttonState.value !== 'moving-towards-edge') {
      dbgLog('HOTZONE entered (cursor)', { hotzoneEdge, cursorX, cursorY });
      dbgLog('[HOTZONE CONTACT] Entered hotzone', { hotzoneEdge, pos: debugStore.debugButtonPosition, mouse: { x: cursorX, y: cursorY } });
      setButtonState('moving-towards-edge');
      // record visual entry position using the real DOM location so we don't capture
      // any transient store values that may be out-of-sync with the rendered button
      if (buttonRef.value) {
        const r = buttonRef.value.getBoundingClientRect();
        hotzoneEntryPos = { x: Math.max(0, Math.min(window.innerWidth - buttonSize.value, Math.round(r.left))), y: Math.max(0, Math.min(window.innerHeight - buttonSize.value, Math.round(r.top))) };
      } else {
        hotzoneEntryPos = { ...debugStore.debugButtonPosition };
      }
    }
    debugStore.setActiveHotzoneEdge(hotzoneEdge);

    // If the hotzone is left/right and we're dragging, keep the button stuck to the
    // side but allow vertical movement following the cursor. This prevents the
    // button from fighting the user while still providing edge-locked vertical drag.
    if (isDragging.value && (hotzoneEdge === 'left' || hotzoneEdge === 'right')) {
      const edgeX = hotzoneEdge === 'left' ? 0 : window.innerWidth - buttonSize.value;
      const followY = Math.max(8, Math.min(maxDragY, cursorY - buttonSize.value / 2));
      debugStore.updateDebugButtonPosition({ x: edgeX, y: followY });
      // Mark as attached-to-edge so other logic treats it as edge-locked
      snappedEdge.value = hotzoneEdge;
      setButtonState('attached-to-edge');
      return;
    }

    // Compute clamped target coordinates for the given hotzone edge.
    const currentPos = { ...debugStore.debugButtonPosition };
    let targetX = currentPos.x;
    let targetY = currentPos.y;
    if (hotzoneEdge === 'top') {
      targetY = 0;
      // Align X to cursor (center the button under cursor)
      targetX = Math.max(minX, Math.min(maxX, cursorX - buttonSize.value / 2));
    } else if (hotzoneEdge === 'bottom') {
      targetY = window.innerHeight - buttonSize.value;
      targetX = Math.max(minX, Math.min(maxX, cursorX - buttonSize.value / 2));
    } else if (hotzoneEdge === 'left') {
      targetX = 0;
      // preserve current Y so we don't snap to top
      targetY = Math.max(8, Math.min(maxDragY, currentPos.y));
    } else if (hotzoneEdge === 'right') {
      targetX = window.innerWidth - buttonSize.value;
      targetY = Math.max(8, Math.min(maxDragY, currentPos.y));
    }

    // record destination position for this hotzone
    hotzoneDestinationPos = { x: targetX, y: targetY };

    const sameTarget = transitionTarget.value && transitionTarget.value.x === targetX && transitionTarget.value.y === targetY && snappedEdge.value === hotzoneEdge;
    // Determine a stable start position for the animation: prefer the recorded entry position
    const startX = hotzoneEntryPos ? hotzoneEntryPos.x : currentPos.x;
    const startY = hotzoneEntryPos ? hotzoneEntryPos.y : currentPos.y;
    // Don't restart an attachment animation for the same edge if we're already snapped to it
    if (!isMagnetizing.value && snappedEdge.value !== hotzoneEdge && !sameTarget) {
      // Ensure the stored button position matches the recorded hotzone entry position
      // so the animation visually starts from the spot where the user first entered
      // the hotzone instead of jumping from an intermediate value.
      const stored = debugStore.debugButtonPosition;
      if (hotzoneEntryPos && (Math.abs(stored.x - startX) > 0.5 || Math.abs(stored.y - startY) > 0.5)) {
        debugStore.updateDebugButtonPosition({ x: startX, y: startY });
      }
      // Use the recorded entry position as the animation start so we animate from where
      // the button was when the hotzone was first entered, avoiding sudden jumps.
      startAttachmentAnimation(startX, startY, targetX, targetY, hotzoneEdge as string);
    }
  } else if (isDragging.value && !inHotzone && buttonState.value === 'moving-towards-edge') {
    dbgLog('HOTZONE exited (cursor) -> start smooth move to cursor', { hotzoneEdge, cursorX, cursorY });
    dbgLog('[HOTZONE CONTACT] Exited hotzone', { prevHotzoneEdge, pos: debugStore.debugButtonPosition, mouse: { x: cursorX, y: cursorY } });
    // Animate from the current snapped/edge position back to the cursor smoothly.
    const edgePos = { ...debugStore.debugButtonPosition };
    const targetX = Math.max(minX, Math.min(maxX, cursorX - buttonSize.value / 2));
    const targetY = Math.max(8, Math.min(maxDragY, cursorY - buttonSize.value / 2));
    handleDragLogIfNeeded('HOTZONE exit starting smooth move', { edgePos, targetX, targetY }, true);
    // update state and clear hotzone marker
    setButtonState('moving-away-from-edge');
    debugStore.setActiveHotzoneEdge(null);
    // startSmoothMove will call stopAllAnimations() if needed
    startSmoothMove(edgePos.x, edgePos.y, targetX, targetY);
    return;
  }

  // track previous hotzoneEdge for logs
  if (hotzoneEdge !== prevHotzoneEdge) prevHotzoneEdge = hotzoneEdge;

  // Ensure the store's active hotzone is cleared whenever the cursor is outside hotzones
  // while dragging. This handles cases where state isn't 'moving-towards-edge' but the
  // overlay still needs to revert to inactive.
  if (isDragging.value && !inHotzone && debugStore.activeHotzoneEdge) {
    debugStore.setActiveHotzoneEdge(null);
  }

  // If there is no active hotzone while dragging, snap the button to the cursor so it
  // follows the mouse precisely (centered) — this makes the cursor the primary trigger
  // for hotzones instead of the button bounds.
  if (isDragging.value && !inHotzone) {
    const cx = Math.max(minX, Math.min(maxX, event.clientX - buttonSize.value / 2));
    const cy = Math.max(8, Math.min(maxDragY, event.clientY - buttonSize.value / 2));
    handleDragLogIfNeeded('handleDrag snapping to cursor', { cx, cy }, true);
    debugStore.updateDebugButtonPosition({ x: cx, y: cy });
    // detach from any snapped edge so the button is free to follow the cursor
    if (snappedEdge.value) {
      dbgLog('DETACH on no-hotzone: clearing snappedEdge', { snappedEdge: snappedEdge.value });
    }
    snappedEdge.value = null;
    // cancel any magnetizing/transition state
    isMagnetizing.value = false;
    transitionType.value = null;
    transitionTarget.value = null;
    disableDragUpdates.value = false;
    // keep edge detection disabled during drag; it will be re-enabled on mouseup
    disableEdgeDetection.value = true;
    setButtonState('moving-with-cursor');
    return;
  }

  let newX = Math.max(minX, Math.min(maxX, rawX));
  let newY = Math.max(8, Math.min(maxDragY, rawY));

  // If raw position is still near the same snapped edge, allow sliding along that edge
  if (snappedTo && snappedEdge.value && snappedTo === snappedEdge.value) {
    if (snappedEdge.value === 'bottom' || snappedEdge.value === 'top') {
      const constrainedX = Math.max(minX, Math.min(maxX, rawX));
      const edgeY = snappedEdge.value === 'bottom' ? window.innerHeight - buttonSize.value : 0;
      handleDragLogIfNeeded('handleDrag sliding on same edge', { snappedEdge: snappedEdge.value, constrainedX, edgeY, rawX, rawY });
      // still attached while sliding along the edge
      setButtonState('attached-to-edge');
      debugStore.updateDebugButtonPosition({ x: constrainedX, y: edgeY });
      return;
    }
    if (snappedEdge.value === 'left' || snappedEdge.value === 'right') {
      const constrainedY = Math.max(8, Math.min(maxDragY, rawY));
      const edgeX = snappedEdge.value === 'left' ? 0 : window.innerWidth - buttonSize.value;
      handleDragLogIfNeeded('handleDrag sliding on same edge (left/right)', { snappedEdge: snappedEdge.value, edgeX, constrainedY, rawX, rawY });
      // still attached while sliding along the edge
      setButtonState('attached-to-edge');
      debugStore.updateDebugButtonPosition({ x: edgeX, y: constrainedY });
      return;
    }
  }

  // If currently snapped to an edge, decide whether to slide along the edge or detach
  if (!snappedTo && snappedEdge.value) {
    const primaryHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const smallVertical = Math.abs(deltaY) < 8;

    // Determine explicit detach intent by distance away from the snapped edge
    const detachThreshold = 12; // pixels needed to consider a real detach
    let detachIntent = false;
    if (snappedEdge.value === 'bottom') {
      const edgeY = window.innerHeight - buttonSize.value;
      const dyFromEdge = edgeY - rawY; // positive when moving up away from bottom
      if (dyFromEdge > detachThreshold) detachIntent = true;
    } else if (snappedEdge.value === 'top') {
      const dyFromEdge = rawY - 0; // positive when moving down away from top
      if (dyFromEdge > detachThreshold) detachIntent = true;
    } else if (snappedEdge.value === 'left') {
      const dxFromEdge = rawX - 0; // positive when moving right away from left
      if (dxFromEdge > detachThreshold) detachIntent = true;
    } else if (snappedEdge.value === 'right') {
      const edgeX = window.innerWidth - buttonSize.value;
      const dxFromEdge = edgeX - rawX; // positive when moving left away from right
      if (dxFromEdge > detachThreshold) detachIntent = true;
    }

    // If detach intent detected, start a smooth move towards cursor — otherwise allow sliding
    // If detach intent detected, first check snap grace window to avoid immediate detach
    const now = Date.now();
    if (detachIntent) {
      if (now - recentlySnappedAt < snapGraceMs) {
        dbgLog('DETACH suppressed due to snap grace window', { now, recentlySnappedAt, snapGraceMs, rawX, rawY, snappedEdge: snappedEdge.value });
        // treat as edge-locked movement instead
        const constrainedX = Math.max(minX, Math.min(maxX, rawX));
        const edgeY = snappedEdge.value === 'bottom' ? window.innerHeight - buttonSize.value : 0;
        handleDragLogIfNeeded('handleDrag edge-locked due to grace window', { constrainedX, edgeY });
        debugStore.updateDebugButtonPosition({ x: constrainedX, y: edgeY });
        return;
      }

      // If the button isn't in the canonical 'attached-to-edge' state, suppress detach
      if (buttonState.value !== 'attached-to-edge') {
        dbgLog('DETACH suppressed: buttonState not attached', { buttonState: buttonState.value });
        // keep it edge-locked visually
        const constrainedX = Math.max(minX, Math.min(maxX, rawX));
        const edgeY = snappedEdge.value === 'bottom' ? window.innerHeight - buttonSize.value : 0;
        debugStore.updateDebugButtonPosition({ x: constrainedX, y: edgeY });
        return;
      }

      // Prevent detach logic while a smooth move is running or within the smooth cooldown
      if (isSmoothMoving || Date.now() - lastSmoothMoveAt < edgeDisableAfterSmoothMs) {
        dbgLog('DETACH suppressed: smooth move in-flight or in cooldown', { isSmoothMoving, lastSmoothMoveAt, edgeDisableAfterSmoothMs });
        return;
      }

      handleDragLogIfNeeded('DETACH handleDrag() detaching due to clear detach intent', { pos: debugStore.debugButtonPosition, rawX, rawY, deltaX, deltaY, snappedEdge: snappedEdge.value }, true);
      // moving away from edge (user pulled the button)
      setButtonState('moving-away-from-edge');
      const currentPos = { ...debugStore.debugButtonPosition };
      const targetXClamped = Math.max(minX, Math.min(maxX, event.clientX));
      const targetYClamped = Math.max(8, Math.min(maxDragY, event.clientY));
      handleDragLogIfNeeded('DETACH handleDrag() starting smooth move', { currentPos, targetXClamped, targetYClamped, deltaX, deltaY }, true);
      startSmoothMove(currentPos.x, currentPos.y, targetXClamped, targetYClamped);
      return;
    }

    // No detach intent — allow movement constrained to the snapped edge
    if ((snappedEdge.value === 'bottom' || snappedEdge.value === 'top') && (primaryHorizontal || smallVertical)) {
      const constrainedX = Math.max(minX, Math.min(maxX, rawX));
      const edgeY = snappedEdge.value === 'bottom' ? window.innerHeight - buttonSize.value : 0;
      handleDragLogIfNeeded('handleDrag edge-locked horizontal move', { snappedEdge: snappedEdge.value, constrainedX, edgeY, rawX, rawY, deltaX, deltaY });
      debugStore.updateDebugButtonPosition({ x: constrainedX, y: edgeY });
      return;
    }

    if ((snappedEdge.value === 'left' || snappedEdge.value === 'right') && (!primaryHorizontal || Math.abs(deltaX) < 8)) {
      const constrainedY = Math.max(8, Math.min(maxDragY, rawY));
      const edgeX = snappedEdge.value === 'left' ? 0 : window.innerWidth - buttonSize.value;
      handleDragLogIfNeeded('handleDrag edge-locked vertical move', { snappedEdge: snappedEdge.value, edgeX, constrainedY, rawX, rawY, deltaX, deltaY });
      debugStore.updateDebugButtonPosition({ x: edgeX, y: constrainedY });
      return;
    }
  }

  if (snappedTo && snappedTo !== snappedEdge.value) {
    if (snappedTo === 'left') newX = 0;
    else if (snappedTo === 'right') newX = window.innerWidth - buttonSize.value;
    else if (snappedTo === 'top') newY = 0;
    else if (snappedTo === 'bottom') newY = window.innerHeight - buttonSize.value;
    handleDragLogIfNeeded('handleDrag starting attachment animation', { from: debugStore.debugButtonPosition, to: { x: newX, y: newY }, snappedTo }, true);
    // If we're in a hotzone and the snapped target is the same edge, keep moving-towards-edge
    if (buttonState.value !== 'moving-towards-edge' && Math.abs(newX - dragStartPosition.value.x) < hotzoneSize && Math.abs(newY - dragStartPosition.value.y) < hotzoneSize) {
      setButtonState('moving-towards-edge');
    }
    startAttachmentAnimation(debugStore.debugButtonPosition.x, debugStore.debugButtonPosition.y, newX, newY, snappedTo);
  } else if (!snappedTo) {
    handleDragLogIfNeeded('handleDrag updating free position', { newX, newY, rawX, rawY });
    debugStore.updateDebugButtonPosition({ x: newX, y: newY });
  }
};

// Stop drag operation
const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);

  if (!isMagnetizing.value) {
    const pos = debugStore.debugButtonPosition;
    const clampedX = Math.max(8, Math.min(window.innerWidth - buttonSize.value - 8, pos.x));
    const clampedY = Math.max(8, Math.min(window.innerHeight - buttonSize.value, pos.y));
    if (clampedX !== pos.x || clampedY !== pos.y) {
      debugStore.updateDebugButtonPosition({ x: clampedX, y: clampedY });
    }
  }
  disableEdgeDetection.value = false;
  // drag ended -> no longer moving
  setButtonState('no-longer-moving');
  // Stop logging
  if (debugLoggingInterval !== null) {
    clearInterval(debugLoggingInterval);
    debugLoggingInterval = null;
  }
};

// Start drag operation
const startDrag = (event: MouseEvent) => {
  event.preventDefault();
  if (isMagnetizing.value) return;
  
  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  dragStartPosition.value = { ...debugStore.debugButtonPosition };

  // user started dragging -> moving with cursor
  setButtonState('moving-with-cursor');

  if (snappedEdge.value) {
    disableEdgeDetection.value = true;
    snappedEdge.value = null;
  }
  console.log(`%c[DETACH] startDrag(): detached from snapped edge and began drag — pos=${JSON.stringify(debugStore.debugButtonPosition)} mouseX=${dragStartX.value} mouseY=${dragStartY.value}`, 'color: #ff9800; font-weight: bold;');
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
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
    console.log(`%c[DEBUG BUTTON MOVING] x=${pos.x.toFixed(1)} y=${pos.y.toFixed(1)} mouseX=${targetMouseX.toFixed(1)} mouseY=${targetMouseY.toFixed(1)}`, 'color: #ff9800; font-weight: bold;');
  }, 100);
};

// Check if button position is valid (visible within viewport)
const isButtonPositionValid = () => {
  const pos = debugStore.debugButtonPosition;
  const margin = 20; // Allow some margin for edge cases

  return (
    pos.x >= -margin &&
    pos.x <= window.innerWidth - buttonSize.value + margin &&
    pos.y >= -margin &&
    pos.y <= window.innerHeight - buttonSize.value + margin
  );
};

// Find the nearest edge to snap to
const findNearestEdge = () => {
  const pos = debugStore.debugButtonPosition;
  const centerX = pos.x + buttonSize.value / 2;
  const centerY = pos.y + buttonSize.value / 2;

  const distanceToLeft = centerX;
  const distanceToRight = window.innerWidth - centerX;
  const distanceToTop = centerY;
  const distanceToBottom = window.innerHeight - centerY;

  const distances = {
    left: distanceToLeft,
    right: distanceToRight,
    top: distanceToTop,
    bottom: distanceToBottom
  };

  // Find the closest edge
  const nearestEdge = Object.entries(distances).reduce((a, b) => distances[a[0] as keyof typeof distances] < distances[b[0] as keyof typeof distances] ? a : b)[0] as keyof typeof distances;

  return nearestEdge;
};

// Auto-snap button to nearest edge if position is invalid
const autoSnapToNearestEdge = () => {
  const pos = debugStore.debugButtonPosition;

  if (!isButtonPositionValid()) {
    const nearestEdge = findNearestEdge();
    let newX = pos.x;
    let newY = pos.y;

    switch (nearestEdge) {
      case 'left':
        newX = 0;
        newY = Math.max(8, Math.min(window.innerHeight - buttonSize.value - 8, pos.y));
        break;
      case 'right':
        newX = window.innerWidth - buttonSize.value;
        newY = Math.max(8, Math.min(window.innerHeight - buttonSize.value - 8, pos.y));
        break;
      case 'top':
        newY = 0;
        newX = Math.max(8, Math.min(window.innerWidth - buttonSize.value - 8, pos.x));
        break;
      case 'bottom':
        newY = window.innerHeight - buttonSize.value;
        newX = Math.max(8, Math.min(window.innerWidth - buttonSize.value - 8, pos.x));
        break;
    }

    snappedEdge.value = nearestEdge;
    debugStore.updateDebugButtonPosition({ x: newX, y: newY });
  }
};

// Update button position when window resizes
const handleResize = () => {
  snappedEdge.value = null;
  const currentX = debugStore.debugButtonPosition.x;
  const currentY = debugStore.debugButtonPosition.y;
  const clampedX = Math.max(8, Math.min(window.innerWidth - buttonSize.value - 8, currentX));
  const clampedY = Math.max(8, Math.min(window.innerHeight - buttonSize.value, currentY));
  debugStore.updateDebugButtonPosition({ x: clampedX, y: clampedY });
};

onMounted(() => {
  if (buttonRef.value) {
    buttonSize.value = buttonRef.value.offsetHeight || buttonSize.value;
  }
  window.addEventListener('resize', handleResize);
  setTimeout(() => {
    autoSnapToNearestEdge();
  }, 100);
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
