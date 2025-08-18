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
          :size="64" 
          class="pause-icon"
        />
      </div>
    </div>
    
    <!-- Progress information -->
    <div v-if="showProgress" class="progress-info">
      <div class="scanning-label" :class="{ 'paused': isPaused }">
        {{ isPaused ? 'Paused' : 'Scanning item:' }}
      </div>
      <div class="filename-text" :title="processedFilename" :class="{ 'paused': isPaused }">{{ processedFilename }}</div>
      <div v-if="totalItems && totalItems > 0" class="progress-bar" :class="{ 'paused': isPaused }">
        <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
      </div>
      <div class="progress-count" :title="`${currentItem}/${totalItems}`" :class="{ 'paused': isPaused }">{{ currentItem }}/{{ totalItems }}</div>
    </div>
    
    <!-- Loading message -->
    <div v-if="$slots.default" class="loading-message" :class="{ 'paused': isPaused }" :title="isPaused ? 'Click Resume to continue' : 'Loading in progress'">
      {{ loadingMessageText }}
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
import { logLoading } from "@/utils/loggers";

const props = defineProps<{
  currentItem?: number;
  totalItems?: number;
  progressMessage?: string;
  isPaused: boolean;
  animationType?: 'circle' | 'spinner' | 'double-bounce';
}>();

const emit = defineEmits<{
  pause: [isPaused: boolean];
  cancel: [];
}>();

const cancelDropdownRef = ref<InstanceType<typeof DropdownMenu> | null>(null);

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

const progressPercentage = computed(() => {
  if (!props.totalItems || props.totalItems === 0) return 0;
  return Math.round((props.currentItem || 0) / props.totalItems * 100);
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

// Watch for progress updates
watch(
  () => [props.currentItem, props.totalItems, props.progressMessage],
  ([newCurrent, newTotal, newMessage], [oldCurrent, oldTotal, oldMessage]) => {
    if (newCurrent !== oldCurrent || newTotal !== oldTotal || newMessage !== oldMessage) {
      logLoading("FileTableLoadingOverlay", `Progress update received: ${newCurrent}/${newTotal} - "${newMessage}" at ${performance.now().toFixed(2)}ms`);
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
  
  emit("cancel");
  
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
  gap: 16px;
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
}

/* Scanning label text - <div class="scanning-label"> */
.scanning-label {
  color: var(--txt-clr-liter);
  font-size: 14px;
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

.scanning-label.paused {
  opacity: 0.5;
}

/* Filename text display - <div class="filename-text"> */
.filename-text {
  color: var(--txt-clr-liter);
  font-size: 14px;
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

/* Progress count display - <div class="progress-count"> */
.progress-count {
  color: var(--txt-clr-lite);
  font-size: 12px;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-align: end;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  transition: opacity 0.2s ease;
}

.progress-count.paused {
  opacity: 0.5;
}

/* Progress bar container - <div class="progress-bar"> */
.progress-bar {
  background-color: var(--brdr-clr-lite);
  border-radius: 2px;
  block-size: 4px;
  inline-size: 100%;
  overflow: hidden;
  margin-block-end: 8px;
  transition: opacity 0.2s ease;
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
}

.loading-message.paused {
  opacity: 0.8;
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

/* Confirmation buttons container - <div class="confirmation-buttons"> */
.confirmation-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Animation container to maintain consistent height */
.animation-container {
  block-size: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
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
  block-size: 80px;
  inline-size: 80px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Pause icon styling - <Icon class="pause-icon"> */
.pause-icon {
  color: var(--txt-clr-darkr);
  opacity: 1;
}

/* Ensure the iconify span has the correct height */
.pause-icon :deep(.iconify) {
  block-size: 64px;
  inline-size: 64px;
}
</style>
