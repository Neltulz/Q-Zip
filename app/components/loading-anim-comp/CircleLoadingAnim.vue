<!-- 
  CircleLoadingAnim.vue @preserve
  Circle loading animation component (simplified)
  
  Loading animation from SpinKit.
  Creator: Tobias Ahlin
  Website: https://tobiasahlin.com/spinkit/
  X Profile: https://x.com/tobiasahlin
-->
<template>
  <div class="circle-animation">
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
    <div v-if="$slots.default" class="loading-message">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed for simple circle animation
</script>

<style scoped>
/* Circle animation container - <div class="circle-animation"> */
.circle-animation {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

/* Loading message container - <div class="loading-message"> */
.loading-message {
  color: var(--txt-clr-liter);
  font-size: 14px;
  text-align: center;
}

/* SpinKit circle animation container - <div class="sk-circle"> */
.sk-circle {
  block-size: 60px;
  inline-size: 60px;
  margin-block-end: 8px;
  position: relative;

  /* Individual circle child elements - <div class="sk-child"> */
  .sk-child {
    block-size: 100%;
    inline-size: 100%;
    inset-block-start: 0;
    inset-inline-start: 0;
    position: absolute;

    /* Circle dot pseudo-element */
    &:before {
      animation: sk-circle-bounce-delay 1.2s infinite ease-in-out both;
      background-color: var(--accent-clr, hsl(0, 0%, 100%));
      border-radius: 100%;
      block-size: 15%;
      content: '';
      display: block;
      inline-size: 15%;
      margin: 0 auto;
    }
  }

  /* Individual circle rotations */
  .sk-circle2 { transform: rotate(30deg); }
  .sk-circle3 { transform: rotate(60deg); }
  .sk-circle4 { transform: rotate(90deg); }
  .sk-circle5 { transform: rotate(120deg); }
  .sk-circle6 { transform: rotate(150deg); }
  .sk-circle7 { transform: rotate(180deg); }
  .sk-circle8 { transform: rotate(210deg); }
  .sk-circle9 { transform: rotate(240deg); }
  .sk-circle10 { transform: rotate(270deg); }
  .sk-circle11 { transform: rotate(300deg); }
  .sk-circle12 { transform: rotate(330deg); }

  /* Animation delays for each circle */
  .sk-circle2:before { animation-delay: -1.1s; }
  .sk-circle3:before { animation-delay: -1.0s; }
  .sk-circle4:before { animation-delay: -0.9s; }
  .sk-circle5:before { animation-delay: -0.8s; }
  .sk-circle6:before { animation-delay: -0.7s; }
  .sk-circle7:before { animation-delay: -0.6s; }
  .sk-circle8:before { animation-delay: -0.5s; }
  .sk-circle9:before { animation-delay: -0.4s; }
  .sk-circle10:before { animation-delay: -0.3s; }
  .sk-circle11:before { animation-delay: -0.2s; }
  .sk-circle12:before { animation-delay: -0.1s; }
}

/* SpinKit bounce delay animation */
@keyframes sk-circle-bounce-delay {
  0%, 80%, 100% {
    transform: scale(0);
  } 40% {
    transform: scale(1.0);
  }
}
</style>
