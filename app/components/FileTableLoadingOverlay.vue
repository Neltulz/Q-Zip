<!-- 
  FileTableLoadingOverlay.vue @preserve
  Full-featured loading overlay component for FileTable operations
  
  This component provides a complete loading experience with progress tracking,
  pause/resume functionality, and cancel options. It uses simplified loading
  animation components for the actual animations.
-->
<template>
  <div class="full-animation">
    <!-- Loading animation component -->
    <component :is="animationComponent" />
    
    <!-- Progress information -->
    <div v-if="showProgress" class="progress-info">
      <div class="scanning-label">Scanning item:</div>
      <div class="filename-text">{{ processedFilename }}</div>
      <div class="progress-count">{{ currentItem }}/{{ totalItems }} items</div>
      <div v-if="totalItems && totalItems > 0" class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
      </div>
    </div>
    
    <!-- Loading message -->
    <div v-if="$slots.default" class="loading-message">
      <slot />
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
import { ref, computed } from "vue";
import CustomButton from "./CustomButton.vue";
import DropdownMenu from "./DropdownMenu.vue";
import CircleLoadingAnim from "./loading-anim-comp/CircleLoadingAnim.vue";
import SpinnerLoadingAnim from "./loading-anim-comp/SpinnerLoadingAnim.vue";
import DoubleBounceLoadingAnim from "./loading-anim-comp/DoubleBounceLoadingAnim.vue";

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

const handlePauseClick = () => {
  emit("pause", !props.isPaused);
};

const handleConfirmCancel = () => {
  emit("cancel");
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
  width: 100%;
}

/* Progress information container - <div class="progress-info"> */
.progress-info {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 280px;
  width: 100%;
}

/* Scanning label text - <div class="scanning-label"> */
.scanning-label {
  color: var(--txt-clr-liter);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

/* Filename text display - <div class="filename-text"> */
.filename-text {
  color: var(--txt-clr-liter);
  font-size: 14px;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Progress count display - <div class="progress-count"> */
.progress-count {
  color: var(--txt-clr-lite);
  font-size: 12px;
  font-weight: 500;
}

/* Progress bar container - <div class="progress-bar"> */
.progress-bar {
  background-color: var(--brdr-clr-lite);
  border-radius: 2px;
  block-size: 4px;
  inline-size: 100%;
  overflow: hidden;
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
  text-align: center;
}

/* Button group container - <div class="button-group"> */
.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
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
</style>
