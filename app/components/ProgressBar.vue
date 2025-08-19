<!-- 
  ProgressBar.vue @preserve
  Reusable progress bar component for displaying progress bars with labels
  
  This component provides a flexible progress display with support for:
  - Single progress bar with percentage and count
  - Optional label text
  - Pause state styling
  - Customizable progress bar colors
-->
<template>
  <div class="progress-section" :class="sectionClass">
    <div class="progress-wrapper">
      <div 
        class="progress-percentage" 
        :title="`${progressPercentage}%`" 
        :class="{ 'paused': isPaused }"
      >
        {{ progressPercentage }}%
      </div>
      <div 
        class="progress-count" 
        :title="`${current}/${total}`" 
        :class="{ 'paused': isPaused }"
      >
        {{ current }}/{{ total }}
      </div>
    </div>
    <div class="progress-bar" :class="{ 'paused': isPaused }">
      <div 
        class="progress-fill" 
        :class="fillClass"
        :style="{ width: `${progressPercentage}%` }"
      ></div>
    </div>
    <div 
      v-if="label" 
      class="progress-label" 
      :class="{ 'paused': isPaused }"
    >
      {{ label }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  current: number;
  total: number;
  label?: string;
  isPaused?: boolean;
  variant?: 'default' | 'overall' | 'current';
  sectionClass?: string;
}>();

const progressPercentage = computed(() => {
  if (!props.total || props.total === 0) return 0;
  return Math.round((props.current || 0) / props.total * 100);
});

const fillClass = computed(() => {
  switch (props.variant) {
    case 'overall':
      return 'overall-progress-fill';
    case 'current':
      return 'current-progress-fill';
    default:
      return 'default-progress-fill';
  }
});
</script>

<style scoped>
/* Progress section container - <div class="progress-section"> */
.progress-section {
  --progress-bar-height: 6px;
  --progress-fill-transition: inline-size 0.3s ease;
  --progress-text-size: 12px;
  --progress-transition: opacity 0.2s ease;
  
  align-items: center;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  width: 100%;
}

/* Progress wrapper container - <div class="progress-wrapper"> */
.progress-wrapper {
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
}

/* Progress percentage display - <div class="progress-percentage"> */
.progress-percentage {
  color: var(--txt-clr-lite);
  font-size: var(--progress-text-size);
  font-weight: 500;
  text-align: start;
  transition: var(--progress-transition);
}

.progress-percentage.paused {
  opacity: 0.5;
}

/* Progress count display - <div class="progress-count"> */
.progress-count {
  color: var(--txt-clr-lite);
  font-size: var(--progress-text-size);
  font-weight: 500;
  text-align: end;
  transition: var(--progress-transition);
}

.progress-count.paused {
  opacity: 0.5;
}

/* Progress bar container - <div class="progress-bar"> */
.progress-bar {
  background-color: var(--brdr-clr-lite);
  block-size: var(--progress-bar-height);
  border-radius: 2px;
  inline-size: 100%;
  margin-block: 4px;
  overflow: hidden;
  transition: var(--progress-transition);
}

.progress-bar.paused {
  opacity: 0.5;
}

/* Progress fill indicator - <div class="progress-fill"> */
.progress-fill {
  border-radius: 2px;
  block-size: 100%;
  transition: var(--progress-fill-transition);
}

/* Default progress fill - <div class="default-progress-fill"> */
.default-progress-fill {
  background-color: var(--accent-clr, hsl(211, 100%, 50%));
}

/* Overall progress fill - <div class="overall-progress-fill"> */
.overall-progress-fill {
  background-color: var(--accent-clr, hsl(211, 100%, 50%));
}

/* Current progress fill - <div class="current-progress-fill"> */
.current-progress-fill {
  background-color: hsl(120, 100%, 50%); /* Green color for current progress */
}

/* Progress fill when paused - desaturated */
.progress-bar.paused .progress-fill {
  background-color: hsl(0, 0%, 60%);
}

/* Progress label - <div class="progress-label"> */
.progress-label {
  color: var(--txt-clr-lite);
  font-size: var(--progress-text-size);
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-align: start;
  text-overflow: ellipsis;
  transition: var(--progress-transition);
  white-space: nowrap;
  width: 100%;
}

.progress-label.paused {
  opacity: 0.5;
}
</style>
