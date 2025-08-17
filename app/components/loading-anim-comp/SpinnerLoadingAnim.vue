<!-- 
  SpinnerLoadingAnim.vue @preserve
  Simple spinner loading animation component
  
  Simple spinner animation from SpinKit.
  Creator: Tobias Ahlin
  Website: https://tobiasahlin.com/spinkit/
  X Profile: https://x.com/tobiasahlin
-->
<template>
  <div class="spinner-animation">
    <div class="spinner">
      <div class="bounce1"></div>
      <div class="bounce2"></div>
      <div class="bounce3"></div>
    </div>
    <div v-if="$slots.default" class="loading-message">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed for simple spinner
</script>

<style scoped>
/* Spinner animation container - <div class="spinner-animation"> */
.spinner-animation {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

/* Simple spinner container - <div class="spinner"> */
.spinner {
  margin: 0 auto;
  text-align: center;
  inline-size: 70px;

  /* Spinner dots - <div class="bounce1">, <div class="bounce2">, <div class="bounce3"> */
  > div {
    animation: sk-bouncedelay 1.4s infinite ease-in-out both;
    background-color: var(--accent-clr, hsl(0, 0%, 20%));
    border-radius: 100%;
    block-size: 18px;
    display: inline-block;
    inline-size: 18px;
  }

  /* Animation delays for each dot */
  .bounce1 {
    animation-delay: -0.32s;
  }

  .bounce2 {
    animation-delay: -0.16s;
  }
}

/* Loading message container - <div class="loading-message"> */
.loading-message {
  color: var(--txt-clr-liter);
  font-size: 14px;
  text-align: center;
}

/* Spinner bounce delay animation */
@keyframes sk-bouncedelay {
  0%, 80%, 100% {
    transform: scale(0);
  } 40% {
    transform: scale(1.0);
  }
}
</style>
