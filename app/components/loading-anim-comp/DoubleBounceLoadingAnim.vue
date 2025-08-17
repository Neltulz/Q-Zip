<!-- 
  DoubleBounceLoadingAnim.vue @preserve
  Double-bounce loading animation component
  
  Double-bounce animation from SpinKit.
  Creator: Tobias Ahlin
  Website: https://tobiasahlin.com/spinkit/
  X Profile: https://x.com/tobiasahlin
-->
<template>
  <div class="double-bounce-animation">
    <div class="spinner">
      <div class="double-bounce1"></div>
      <div class="double-bounce2"></div>
    </div>
    <div v-if="$slots.default" class="loading-message">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed for simple double-bounce animation
</script>

<style scoped>
/* Double-bounce animation container - <div class="double-bounce-animation"> */
.double-bounce-animation {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

/* Double-bounce spinner container - <div class="spinner"> */
.spinner {
  block-size: 40px;
  inline-size: 40px;
  margin: 0 auto;
  position: relative;
}

/* Double-bounce circles - <div class="double-bounce1">, <div class="double-bounce2"> */
.double-bounce1,
.double-bounce2 {
  animation: sk-bounce 2.0s infinite ease-in-out;
  background-color: var(--accent-clr, hsl(0, 0%, 20%));
  block-size: 100%;
  border-radius: 50%;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  opacity: 0.6;
  position: absolute;
}

/* Animation delay for second bounce */
.double-bounce2 {
  animation-delay: -1.0s;
}

/* Loading message container - <div class="loading-message"> */
.loading-message {
  color: var(--txt-clr-liter);
  font-size: 14px;
  text-align: center;
}

/* Double-bounce animation keyframes */
@keyframes sk-bounce {
  0%, 100% {
    transform: scale(0.0);
  } 50% {
    transform: scale(1.0);
  }
}
</style>
