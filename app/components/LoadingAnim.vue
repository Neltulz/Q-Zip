<!-- 
  IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
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
          <div class="sk-circle">
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
          
          <!-- Progress information -->
          <div v-if="showProgress" class="progress-info">
            <div class="progress-text">{{ progressMessage }}</div>
            <div class="progress-count">{{ currentItem }}/{{ totalItems }} items</div>
            <div v-if="totalItems > 0" class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
            </div>
          </div>
          
          <div v-if="$slots.default" class="loading-message">
            <slot />
          </div>
          <CustomButton
            button-style-class="default"
            data-name="cancel-loading-btn"
            first-icon-name="mdi:cancel"
            @click="handleCancelClick"
          >
            Cancel
          </CustomButton>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { watch, ref, computed } from "vue";
import CustomButton from "./CustomButton.vue";
import { logLoading } from "@/utils/loggers";

const props = defineProps<{
  visible: boolean;
  currentItem?: number;
  totalItems?: number;
  progressMessage?: string;
}>();

const emit = defineEmits(["cancel", "animation-finished"]);

const showProgress = computed(() => {
  return props.totalItems !== undefined && props.totalItems > 0;
});

const progressPercentage = computed(() => {
  if (!props.totalItems || props.totalItems === 0) return 0;
  return Math.round((props.currentItem || 0) / props.totalItems * 100);
});

watch(
  () => props.visible,
  (newValue) => {
    logLoading("LoadingAnim", `Visibility changed to: ${newValue}`);
  }
);

const onAfterLeave = () => {
  logLoading("LoadingAnim", "Fade-out transition finished. Emitting animation-finished.");
  emit("animation-finished");
};

const handleCancelClick = () => {
  logLoading("LoadingAnim", "Cancel button clicked.");
  emit("cancel");
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
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
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

.progress-text {
  font-size: 14px;
  color: var(--txt-clr-liter);
  text-align: center;
  word-break: break-word;
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
  background-color: var(--accent-clr);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.loading-message {
  font-size: 14px;
  color: var(--txt-clr-liter);
  text-align: center;
}

/* SpinKit animation styles */
.sk-circle {
  width: 40px;
  height: 40px;
  position: relative;
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
  background-color: var(--accent-clr);
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
