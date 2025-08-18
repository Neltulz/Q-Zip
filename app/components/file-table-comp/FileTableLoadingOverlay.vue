<!-- 
  FileTableLoadingOverlay.vue @preserve
  Full-featured loading overlay component for FileTable operations
  
  This component provides a complete loading experience with progress tracking,
  pause/resume functionality, and cancel options. It uses simplified loading
  animation components for the actual animations.
-->
<template>
  <div class="full-animation">
    <!-- Loading animation with fade transition -->
    <div class="animation-container">
      <component 
        :is="animationComponent" 
        key="loading-animation"
        :class="{ 'hidden': isPaused }"
      />
      <div class="pause-icon-container" :class="{ 'hidden': !isPaused }" key="pause-icon">
        <Icon 
          name="mdi:pause" 
          :size="48" 
          class="pause-icon"
        />
      </div>
    </div>
    
    <!-- Progress information -->
    <div v-if="showProgress" class="progress-info">
      <div class="scanning-label" :class="{ 'paused': isPaused }">
        {{ isPaused ? 'PAUSED' : 'SCANNING' }}
      </div>
      <div class="filename-text" :title="processedFilename" :class="{ 'paused': isPaused }">{{ processedFilename }}</div>
      
      <!-- Overall progress bar for multiple folders -->
      <div v-if="showOverallProgress" class="overall-progress-section">
        <div class="overall-progress-label" :class="{ 'paused': isPaused }">
          Overall Progress
        </div>
        <div class="overall-progress-bar" :class="{ 'paused': isPaused }">
          <div class="overall-progress-fill" :style="{ width: `${overallProgressPercentage}%` }"></div>
        </div>
        <div class="overall-progress-wrapper">
          <div class="overall-progress-percentage" :title="`${overallProgressPercentage}%`" :class="{ 'paused': isPaused }">{{ overallProgressPercentage }}%</div>
          <div class="overall-progress-count" :title="`${overallCurrentFolder}/${overallTotalFolders}`" :class="{ 'paused': isPaused }">{{ overallCurrentFolder }}/{{ overallTotalFolders }}</div>
        </div>
      </div>
      
      <!-- Current folder progress bar -->
      <div v-if="totalItems && totalItems > 0" class="progress-bar" :class="{ 'paused': isPaused }">
        <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
      </div>
      <div class="progress-wrapper">
        <div class="progress-percentage" :title="`${progressPercentage}%`" :class="{ 'paused': isPaused }">{{ progressPercentage }}%</div>
        <div class="progress-count" :title="`${currentItem}/${totalItems}`" :class="{ 'paused': isPaused }">{{ currentItem }}/{{ totalItems }}</div>
      </div>
    </div>
    
    <!-- Loading message -->
    <div v-if="$slots.default" class="loading-message" :class="{ 'paused': isPaused }">
      <span v-if="isPaused">Click <span class="resume-highlight">Resume</span> to continue...</span>
      <span v-else>{{ loadingMessageText }}</span>
    </div>
    
    <!-- Control buttons -->
    <div class="button-group">
      <CustomButton
        button-style-class="default"
        data-name="pause-loading-btn"
        :first-icon-name="isPaused ? 'mdi:play' : 'mdi:pause'"
        @click="handlePauseClick"
      >
        {{ isPaused ? 'Resume' : 'Pause' }}
      </CustomButton>
      <DropdownMenu
        ref="cancelDropdownRef"
        btn-theme="danger"
        button-style-class="default"
        data-name="cancel-dropdown"
        dropdown-data-name="cancel-dropdown"
        first-icon-name="mdi:cancel"
        placement="right-center"
        :show-cancel-button="true"
        cancel-button-text="Nevermind"
        last-icon-name=""
      >
        <template #button-content>
          Cancel
        </template>
        <template #default>
          <div class="cancel-confirmation">
            <div class="confirmation-text">Confirm Cancel</div>
            <div class="confirmation-checkbox">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="removeScannedItems"
                  class="checkbox-input"
                />
                <span class="checkbox-text">Remove already scanned items</span>
              </label>
            </div>
            <div class="confirmation-buttons">
              <CustomButton
                button-style-class="default"
                btn-theme="danger"
                data-name="confirm-cancel-btn"
                first-icon-name="mdi:check"
                @click="handleConfirmCancel"
              >
                Yes, please cancel
              </CustomButton>
            </div>
          </div>
        </template>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import CustomButton from "../CustomButton.vue";
import DropdownMenu from "../DropdownMenu.vue";
import CircleLoadingAnim from "../loading-anim-comp/CircleLoadingAnim.vue";
import SpinnerLoadingAnim from "../loading-anim-comp/SpinnerLoadingAnim.vue";
import DoubleBounceLoadingAnim from "../loading-anim-comp/DoubleBounceLoadingAnim.vue";
import { logLoading, logDualProgress } from "@/utils/loggers";

const props = defineProps<{
  currentItem?: number;
  totalItems?: number;
  progressMessage?: string;
  isPaused: boolean;
  animationType?: 'circle' | 'spinner' | 'double-bounce';
  // New props for dual progress tracking
  overallCurrentFolder?: number;
  overallTotalFolders?: number;
  overallProgressMessage?: string;
}>();

const emit = defineEmits<{
  pause: [isPaused: boolean];
  cancel: [removeScannedItems?: boolean];
}>();

const cancelDropdownRef = ref<InstanceType<typeof DropdownMenu> | null>(null);
const removeScannedItems = ref(true); // Default to true to maintain current behavior

// Determine which animation component to use
const animationComponent = computed(() => {
  switch (props.animationType) {
    case 'spinner':
      return SpinnerLoadingAnim;
    case 'double-bounce':
      return DoubleBounceLoadingAnim;
    case 'circle':
    default:
      return CircleLoadingAnim;
  }
});

const showProgress = computed(() => {
  return props.totalItems !== undefined && props.totalItems > 0;
});

const showOverallProgress = computed(() => {
  const shouldShow = props.overallTotalFolders !== undefined && props.overallTotalFolders > 0;
  
  // Log when overall progress values change (for debugging dual progress)
  logDualProgress("FileTableLoadingOverlay", `Overall progress check`, {
    shouldShow,
    overallTotalFolders: props.overallTotalFolders,
    overallCurrentFolder: props.overallCurrentFolder,
    overallProgressMessage: props.overallProgressMessage
  });
  
  return shouldShow;
});

const progressPercentage = computed(() => {
  if (!props.totalItems || props.totalItems === 0) return 0;
  return Math.round((props.currentItem || 0) / props.totalItems * 100);
});

const overallProgressPercentage = computed(() => {
  if (!props.overallTotalFolders || props.overallTotalFolders === 0) return 0;
  return Math.round((props.overallCurrentFolder || 0) / props.overallTotalFolders * 100);
});

const processedFilename = computed(() => {
  if (!props.progressMessage) return '';
  // Remove "Scanning file: " prefix if it exists
  return props.progressMessage.replace(/^Scanning file:\s*/, '');
});

const loadingMessageText = computed(() => {
  if (props.isPaused) {
    return 'Click "Resume" to continue...';
  }
  return 'Adding items, please wait...';
});

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
      logLoading("FileTableLoadingOverlay", `Progress update: ${newCurrent}/${newTotal} (${newPercentage * 10}%) - "${newMessage}"`);
    }
  },
  { deep: true }
);

// Watch for pause state changes
watch(
  () => props.isPaused,
  (newPausedState, oldPausedState) => {
    if (newPausedState !== oldPausedState) {
      logLoading("FileTableLoadingOverlay", `Pause state changed: ${oldPausedState} -> ${newPausedState} at ${performance.now().toFixed(2)}ms`);
    }
  }
);

const handlePauseClick = () => {
  const startTime = performance.now();
  console.log(`[FileTableLoadingOverlay] PAUSE BUTTON CLICKED at ${startTime.toFixed(2)}ms - current state: ${props.isPaused ? 'paused' : 'playing'}`);
  logLoading("FileTableLoadingOverlay", `Pause button clicked at ${startTime.toFixed(2)}ms - current state: ${props.isPaused ? 'paused' : 'playing'}`);
  
  // Immediate response for better UX
  emit("pause", !props.isPaused);
  
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  console.log(`[FileTableLoadingOverlay] Pause event emitted in ${responseTime.toFixed(2)}ms - new state: ${!props.isPaused ? 'paused' : 'playing'}`);
  logLoading("FileTableLoadingOverlay", `Pause event emitted in ${responseTime.toFixed(2)}ms - new state: ${!props.isPaused ? 'paused' : 'playing'}`);
};

const handleConfirmCancel = () => {
  const startTime = performance.now();
  logLoading("FileTableLoadingOverlay", `Cancel confirmed at ${startTime.toFixed(2)}ms`);
  
  emit("cancel", removeScannedItems.value);
  
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  logLoading("FileTableLoadingOverlay", `Cancel event emitted in ${responseTime.toFixed(2)}ms`);
  
  // Close the dropdown properly
  if (cancelDropdownRef.value) {
    cancelDropdownRef.value.closeDropdown();
  }
};
</script>

<style scoped>
/* Full animation container - <div class="full-animation"> */
.full-animation {
  align-items: center;
  display: flex;
  flex-direction: column;
  /* Avoid using gap here - use individual margins instead for better control */
  max-width: 320px;
  width: 100%;
}

/* Progress information container - <div class="progress-info"> */
.progress-info {
  align-items: center;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  width: 100%;
  margin-block-end: 16px;
}

/* Scanning label text - <div class="scanning-label"> */
.scanning-label {
  color: var(--txt-clr-liter);
  font-size: 16px;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  margin-block-end: 16px;
  transition: opacity 0.2s ease;
}

.scanning-label.paused {
  opacity: 0.5;
}

/* Filename text display - <div class="filename-text"> */
.filename-text {
  color: var(--txt-clr-liter);
  font-size: 12px;
  max-width: 100%;
  overflow: hidden;
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  transition: opacity 0.2s ease;
}

.filename-text.paused {
  opacity: 0.5;
}

/* Progress wrapper container - <div class="progress-wrapper"> */
.progress-wrapper {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* Progress percentage display - <div class="progress-percentage"> */
.progress-percentage {
  color: var(--txt-clr-lite);
  font-size: 12px;
  font-weight: 500;
  text-align: start;
  transition: opacity 0.2s ease;
}

.progress-percentage.paused {
  opacity: 0.5;
}

/* Progress count display - <div class="progress-count"> */
.progress-count {
  color: var(--txt-clr-lite);
  font-size: 12px;
  font-weight: 500;
  text-align: end;
  transition: opacity 0.2s ease;
}

.progress-count.paused {
  opacity: 0.5;
}

/* Progress bar container - <div class="progress-bar"> */
.progress-bar {
  background-color: var(--brdr-clr-lite);
  border-radius: 2px;
  block-size: 6px;
  inline-size: 100%;
  overflow: hidden;
  transition: opacity 0.2s ease;
  margin-block: 8px;
}

.progress-bar.paused {
  opacity: 0.5;
}

/* Progress fill indicator - <div class="progress-fill"> */
.progress-fill {
  background-color: var(--accent-clr, hsl(211, 100%, 50%));
  border-radius: 2px;
  block-size: 100%;
  transition: inline-size 0.3s ease;
}

/* Progress fill when paused - desaturated */
.progress-bar.paused .progress-fill {
  background-color: hsl(0, 0%, 60%);
}

/* Loading message container - <div class="loading-message"> */
.loading-message {
  color: var(--txt-clr-liter);
  font-size: 14px;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  transition: opacity 0.2s ease;
  margin-block-end: 16px;
}

.loading-message.paused {
  opacity: 0.8;
}

/* Resume highlight styling - <span class="resume-highlight"> */
.resume-highlight {
  color: var(--txt-clr-liter);
  font-weight: 600;
}

/* Button group container - <div class="button-group"> */
.button-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  width: 100%;
}

/* Ensure buttons have consistent width */
.button-group :deep(.custom-button) {
  flex-shrink: 0;
  flex-grow: 0;
  width: auto;
  max-width: none;
}

/* Responsive button stacking for thin containers */
@media (max-width: 280px) {
  .button-group {
    flex-direction: column;
  }
}

/* Cancel confirmation container - <div class="cancel-confirmation"> */
.cancel-confirmation {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
  padding: 8px;
}

/* Confirmation text - <div class="confirmation-text"> */
.confirmation-text {
  color: var(--txt-clr-liter);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

/* Confirmation checkbox - <div class="confirmation-checkbox"> */
.confirmation-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-block-end: 12px;
}

/* Checkbox label - <label class="checkbox-label"> */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--txt-clr-lite);
  font-size: 12px;
  user-select: none;
}

/* Checkbox input - <input class="checkbox-input"> */
.checkbox-input {
  inline-size: 16px;
  block-size: 16px;
  margin-inline-end: 8px;
  accent-color: var(--accent-clr, hsl(211, 100%, 50%));
}

/* Checkbox text - <span class="checkbox-text"> */
.checkbox-text {
  user-select: none;
}

/* Confirmation buttons container - <div class="confirmation-buttons"> */
.confirmation-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Overall progress section - <div class="overall-progress-section"> */
.overall-progress-section {
  align-items: center;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  width: 100%;
  margin-block-end: 16px;
}

/* Overall progress label - <div class="overall-progress-label"> */
.overall-progress-label {
  color: var(--txt-clr-lite);
  font-size: 12px;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  margin-block-end: 8px;
  transition: opacity 0.2s ease;
}

.overall-progress-label.paused {
  opacity: 0.5;
}

/* Overall progress bar - <div class="overall-progress-bar"> */
.overall-progress-bar {
  background-color: var(--brdr-clr-lite);
  border-radius: 2px;
  block-size: 6px;
  inline-size: 100%;
  overflow: hidden;
  transition: opacity 0.2s ease;
  margin-block-end: 8px;
}

.overall-progress-bar.paused {
  opacity: 0.5;
}

/* Overall progress fill indicator - <div class="overall-progress-fill"> */
.overall-progress-fill {
  background-color: var(--accent-clr, hsl(211, 100%, 50%));
  border-radius: 2px;
  block-size: 100%;
  transition: inline-size 0.3s ease;
}

/* Overall progress fill when paused - desaturated */
.overall-progress-bar.paused .overall-progress-fill {
  background-color: hsl(0, 0%, 60%);
}

/* Overall progress wrapper - <div class="overall-progress-wrapper"> */
.overall-progress-wrapper {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* Overall progress percentage - <div class="overall-progress-percentage"> */
.overall-progress-percentage {
  color: var(--txt-clr-lite);
  font-size: 12px;
  font-weight: 500;
  text-align: start;
  transition: opacity 0.2s ease;
}

.overall-progress-percentage.paused {
  opacity: 0.5;
}

/* Overall progress count - <div class="overall-progress-count"> */
.overall-progress-count {
  color: var(--txt-clr-lite);
  font-size: 12px;
  font-weight: 500;
  text-align: end;
  transition: opacity 0.2s ease;
}

.overall-progress-count.paused {
  opacity: 0.5;
}

/* Animation container to maintain consistent height */
.animation-container {
  --animation-height: 68px;
  block-size: var(--animation-height);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-block-end: 8px;
}

/* Loading animation and pause icon positioning */
.animation-container > * {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease;
}

/* Hidden state for smooth transitions */
.animation-container > *.hidden {
  opacity: 0;
  pointer-events: none;
}

/* Pause icon container - <div class="pause-icon-container"> */
.pause-icon-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-clr-lite);
  border-radius: 50%;
  block-size: var(--animation-height);
  inline-size: var(--animation-height);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Pause icon styling - <Icon class="pause-icon"> */
.pause-icon {
  color: var(--txt-clr-darkr);
  opacity: 1;
}

/* Ensure the iconify span has the correct height */
.pause-icon :deep(.iconify) {
  block-size: 48px;
  inline-size: 48px;
}
</style>
