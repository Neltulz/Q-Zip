<!-- components/LoadingDots.vue -->
<template>
  <div v-if="visible" class="loading-dots">
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
}>();
</script>

<style scoped>
.loading-dots {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 16px;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--text-clr-muted);
  animation: pulse 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

.dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes pulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
