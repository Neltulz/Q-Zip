<!-- 
  LoadingAnim.vue @preserve
-->
<template>
  <transition name="fade" @after-leave="onAfterLeave">
    <div v-show="visible" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-content">
          <!--
            Loading animation from SpinKit.
            Creator: Tobias Ahlin
            Website: https://tobiasahlin.com/spinkit/
            X Profile: https://x.com/tobiasahlin
           -->
          <div v-if="!isPaused" class="sk-circle">
            <div class="sk-circle1 sk-child"></div>
            <div class="sk-circle2 sk-child"></div>
            <div class="sk-circle3 sk-child"></div>
            <div class="sk-circle4 sk-child"></div>
            <div class="sk-circle5 sk-child"></div>
            <div class="sk-circle6 sk-child"></div>
            <div class="sk-circle7 sk-child"></div>
            <div class="sk-circle8 sk-child"></div>
            <div class="sk-circle9 sk-child"></div>
            <div class="sk-circle10 sk-child"></div>
            <div class="sk-circle11 sk-child"></div>
            <div class="sk-circle12 sk-child"></div>
          </div>
          <div v-else class="pause-icon-container">
            <Icon name="mdi:pause-circle" size="60" />
          </div>
          <!-- Progress information -->
          <div v-if="showProgress" class="progress-info">
            <div class="scanning-label">Scanning item:</div>
            <div class="filename-text">{{ processedFilename }}</div>
            <div class="progress-count">{{ currentItem }}/{{ totalItems }} items</div>
            <div v-if="totalItems && totalItems > 0" class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
            </div>
          </div>
          <div v-if="$slots.default" class="loading-message">
            <slot />
          </div>
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
      </div>
    </div>
  </transition>
</template>
<script setup lang="ts">
import { watch, ref, computed, nextTick } from "vue";
import CustomButton from "./CustomButton.vue";
import DropdownMenu from "./DropdownMenu.vue";
import { logLoading } from "@/utils/loggers";
const props = defineProps<{
  visible: boolean;
  currentItem?: number;
  totalItems?: number;
  progressMessage?: string;
}>();
const emit = defineEmits(["cancel", "pause", "animation-finished", "nevermind"]);
const cancelDropdownRef = ref<InstanceType<typeof DropdownMenu> | null>(null);
const isPaused = ref(false);
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
watch(
  () => props.visible,
  (newValue) => {
    logLoading("LoadingAnim", `Visibility changed to: ${newValue}`);
    // Reset pause state when loading starts or ends
    if (newValue) {
      isPaused.value = false;
    } else {
      // Reset pause state and close the dropdown when loading ends
      isPaused.value = false;
      // Ensure dropdown is closed when loading ends
      nextTick(() => {
        if (cancelDropdownRef.value) {
          cancelDropdownRef.value.closeDropdown();
        }
      });
    }
  }
);
const onAfterLeave = () => {
  logLoading("LoadingAnim", "Fade-out transition finished. Emitting animation-finished.");
  // Ensure dropdown is closed after transition
  nextTick(() => {
    if (cancelDropdownRef.value) {
      cancelDropdownRef.value.closeDropdown();
    }
  });
  emit("animation-finished");
};
const handleCancelClick = () => {
  logLoading("LoadingAnim", "Cancel button clicked.");
  // Reset pause state when cancelling
  isPaused.value = false;
  emit("cancel");
};
const handlePauseClick = () => {
  logLoading("LoadingAnim", `Pause button clicked. Current state: ${isPaused.value ? 'paused' : 'playing'}`);
  isPaused.value = !isPaused.value;
  emit("pause", isPaused.value);
};
const handleConfirmCancel = () => {
  logLoading("LoadingAnim", "Confirm cancel button clicked.");
  emit("cancel");
  // Close the dropdown properly
  if (cancelDropdownRef.value) {
    cancelDropdownRef.value.closeDropdown();
  }
};

</script>
<style scoped>
.loading-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
  transition: opacity 0.3s ease;
}
.loading-container {
  background-color: var(--bg-clr-darkr);
  border: 1px solid var(--brdr-clr-lite);
  padding: 24px;
  border-radius: 8px;
  min-width: 320px;
}
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 280px;
}
.scanning-label {
  font-size: 14px;
  color: var(--txt-clr-liter);
  text-align: center;
  font-weight: 500;
}
.filename-text {
  font-size: 14px;
  color: var(--txt-clr-liter);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.progress-count {
  font-size: 12px;
  color: var(--txt-clr-lite);
  font-weight: 500;
}
.progress-bar {
  width: 100%;
  height: 4px;
  background-color: var(--brdr-clr-lite);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background-color: var(--accent-clr, hsl(211, 100%, 50%));
  border-radius: 2px;
  transition: width 0.3s ease;
}
.loading-message {
  font-size: 14px;
  color: var(--txt-clr-liter);
  text-align: center;
}
.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.cancel-confirmation {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px;
  min-width: 200px;
}
.confirmation-text {
  font-size: 14px;
  color: var(--txt-clr-liter);
  text-align: center;
  font-weight: 500;
}
.confirmation-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pause-icon-container {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  color: var(--accent-clr, hsl(0, 0%, 100%));
}
/* SpinKit animation styles */
.sk-circle {
  width: 60px;
  height: 60px;
  position: relative;
  margin-bottom: 8px;
}
.sk-circle .sk-child {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
}
.sk-circle .sk-child:before {
  content: '';
  display: block;
  margin: 0 auto;
  width: 15%;
  height: 15%;
  background-color: var(--accent-clr, hsl(0, 0%, 100%));
  border-radius: 100%;
  animation: sk-circle-bounce-delay 1.2s infinite ease-in-out both;
}
.sk-circle .sk-circle2 { transform: rotate(30deg); }
.sk-circle .sk-circle3 { transform: rotate(60deg); }
.sk-circle .sk-circle4 { transform: rotate(90deg); }
.sk-circle .sk-circle5 { transform: rotate(120deg); }
.sk-circle .sk-circle6 { transform: rotate(150deg); }
.sk-circle .sk-circle7 { transform: rotate(180deg); }
.sk-circle .sk-circle8 { transform: rotate(210deg); }
.sk-circle .sk-circle9 { transform: rotate(240deg); }
.sk-circle .sk-circle10 { transform: rotate(270deg); }
.sk-circle .sk-circle11 { transform: rotate(300deg); }
.sk-circle .sk-circle12 { transform: rotate(330deg); }
.sk-circle .sk-circle2:before { animation-delay: -1.1s; }
.sk-circle .sk-circle3:before { animation-delay: -1.0s; }
.sk-circle .sk-circle4:before { animation-delay: -0.9s; }
.sk-circle .sk-circle5:before { animation-delay: -0.8s; }
.sk-circle .sk-circle6:before { animation-delay: -0.7s; }
.sk-circle .sk-circle7:before { animation-delay: -0.6s; }
.sk-circle .sk-circle8:before { animation-delay: -0.5s; }
.sk-circle .sk-circle9:before { animation-delay: -0.4s; }
.sk-circle .sk-circle10:before { animation-delay: -0.3s; }
.sk-circle .sk-circle11:before { animation-delay: -0.2s; }
.sk-circle .sk-circle12:before { animation-delay: -0.1s; }
@keyframes sk-circle-bounce-delay {
  0%, 80%, 100% {
    transform: scale(0);
  } 40% {
    transform: scale(1.0);
  }
}
/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>