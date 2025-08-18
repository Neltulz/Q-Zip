<!-- 
  LoadingAnim.vue @preserve
  Master loading animation component that delegates to specific animation types
-->
<template>
  <transition name="fade" @after-leave="onAfterLeave">
    <div v-show="visible" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-content">
          <!-- Full-featured loading overlay with progress and controls -->
          <FileTableLoadingOverlay
            v-if="animationType === 'full'"
            :current-item="currentItem"
            :total-items="totalItems"
            :progress-message="progressMessage"
            :is-paused="isPaused"
            :overall-current-folder="overallCurrentFolder"
            :overall-total-folders="overallTotalFolders"
            :overall-progress-message="overallProgressMessage"
            animation-type="circle"
            @pause="handlePauseClick"
            @cancel="handleCancelClick"
          >
            <slot />
          </FileTableLoadingOverlay>

          <!-- Simple spinner animation -->
          <SpinnerLoadingAnim
            v-else-if="animationType === 'spinner'"
          >
            <slot />
          </SpinnerLoadingAnim>

          <!-- Double-bounce animation -->
          <DoubleBounceLoadingAnim
            v-else-if="animationType === 'double-bounce'"
          >
            <slot />
          </DoubleBounceLoadingAnim>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { watch, ref, nextTick } from "vue";
import { logLoading, logDualProgress } from "@/utils/loggers";
import FileTableLoadingOverlay from "./file-table-comp/FileTableLoadingOverlay.vue";
import SpinnerLoadingAnim from "./loading-anim-comp/SpinnerLoadingAnim.vue";
import DoubleBounceLoadingAnim from "./loading-anim-comp/DoubleBounceLoadingAnim.vue";

const props = withDefaults(defineProps<{
  visible: boolean;
  currentItem?: number;
  totalItems?: number;
  progressMessage?: string;
  animationType?: 'full' | 'spinner' | 'double-bounce';
  // New props for dual progress tracking
  overallCurrentFolder?: number;
  overallTotalFolders?: number;
  overallProgressMessage?: string;
}>(), {
  animationType: 'full'
});

const emit = defineEmits<{
  cancel: [removeScannedItems?: boolean];
  pause: [isPaused: boolean];
  "animation-finished": [];
  nevermind: [];
}>();
const isPaused = ref(false);

watch(
  () => props.visible,
  (newValue) => {
    logLoading("LoadingAnim", `Visibility changed to: ${newValue}`);
    // Reset pause state when loading starts or ends
    if (newValue) {
      isPaused.value = false;
    } else {
      // Reset pause state when loading ends
      isPaused.value = false;
    }
  }
);

// Watch for pause state changes
watch(
  () => isPaused.value,
  (newPausedState, oldPausedState) => {
    if (newPausedState !== oldPausedState) {
      logLoading("LoadingAnim", `Pause state changed: ${oldPausedState} -> ${newPausedState} at ${performance.now().toFixed(2)}ms`);
    }
  }
);

// Watch for progress updates (reduced logging to avoid spam)
watch(
  () => [props.currentItem, props.totalItems, props.progressMessage],
  ([newCurrent, newTotal, newMessage], [oldCurrent, oldTotal, oldMessage]) => {
    // Only log significant progress changes (every 10% or when total changes)
    const oldTotalNum = Number(oldTotal) || 0;
    const newTotalNum = Number(newTotal) || 0;
    const oldPercentage = oldTotalNum > 0 ? Math.round((Number(oldCurrent) || 0) / oldTotalNum * 10) : 0;
    const newPercentage = newTotalNum > 0 ? Math.round((Number(newCurrent) || 0) / newTotalNum * 10) : 0;
    
    if (newTotalNum !== oldTotalNum || newPercentage !== oldPercentage) {
      logLoading("LoadingAnim", `Progress update: ${newCurrent}/${newTotal} (${newPercentage * 10}%) - "${newMessage}"`);
    }
  },
  { deep: true }
);

// Watch for dual progress updates
watch(
  () => [props.overallCurrentFolder, props.overallTotalFolders, props.overallProgressMessage],
  ([newOverallCurrent, newOverallTotal, newOverallMessage], [oldOverallCurrent, oldOverallTotal, oldOverallMessage]) => {
    if (newOverallCurrent !== oldOverallCurrent || newOverallTotal !== oldOverallTotal || newOverallMessage !== oldOverallMessage) {
      logDualProgress("LoadingAnim", `Dual progress update received`, {
        old: {
          overallCurrentFolder: oldOverallCurrent,
          overallTotalFolders: oldOverallTotal,
          overallProgressMessage: oldOverallMessage
        },
        new: {
          overallCurrentFolder: newOverallCurrent,
          overallTotalFolders: newOverallTotal,
          overallProgressMessage: newOverallMessage
        }
      });
    }
  },
  { deep: true }
);

const onAfterLeave = () => {
  logLoading("LoadingAnim", "Fade-out transition finished. Emitting animation-finished.");
  emit("animation-finished");
};

const handleCancelClick = (removeScannedItems?: boolean) => {
  const startTime = performance.now();
  logLoading("LoadingAnim", `Cancel button clicked at ${startTime.toFixed(2)}ms with removeScannedItems=${removeScannedItems}`);
  
  // Reset pause state when cancelling
  isPaused.value = false;
  emit("cancel", removeScannedItems);
  
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  logLoading("LoadingAnim", `Cancel event emitted in ${responseTime.toFixed(2)}ms with removeScannedItems=${removeScannedItems}`);
};

const handlePauseClick = (paused: boolean) => {
  const startTime = performance.now();
  console.log(`[LoadingAnim] PAUSE BUTTON CLICKED at ${startTime.toFixed(2)}ms. Current state: ${paused ? 'paused' : 'playing'}`);
  logLoading("LoadingAnim", `Pause button clicked at ${startTime.toFixed(2)}ms. Current state: ${paused ? 'paused' : 'playing'}`);
  
  isPaused.value = paused;
  emit("pause", paused);
  
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  console.log(`[LoadingAnim] Pause event emitted in ${responseTime.toFixed(2)}ms - new state: ${paused ? 'paused' : 'playing'}`);
  logLoading("LoadingAnim", `Pause event emitted in ${responseTime.toFixed(2)}ms - new state: ${paused ? 'paused' : 'playing'}`);
};

</script>

<style scoped>
/* Main loading overlay container - <div class="loading-overlay"> */
.loading-overlay {
  align-items: center;
  backdrop-filter: blur(2px);
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  inset: 0;
  justify-content: center;
  position: absolute;
  transition: opacity 0.3s ease;
  z-index: 1000;
}

/* Loading container - <div class="loading-container"> */
.loading-container {
  background-color: var(--bg-clr-darkr);
  border: 1px solid var(--brdr-clr-lite);
  border-radius: 8px;
  min-width: 320px;
  padding: 24px;
}

/* Loading content wrapper - <div class="loading-content"> */
.loading-content {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Vue transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
