<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/TooltipContainer.vue @preserve -->

<!--
  TooltipContainer.vue

  What it is:
  - A dedicated container for tooltips that gets mounted to the body
  - Provides a centralized location for all tooltips in the application

  What it does:
  - Creates a container element that tooltips can teleport to
  - Ensures proper z-index layering for tooltips
  - Provides a single point of management for tooltip positioning

  Usage:
  - This component should be mounted once in your app root
  - Tooltips can then teleport to this container instead of body
  - Example: <teleport to="#tooltip-container">

  Benefits:
  - Better organization of tooltips in the DOM
  - Easier to manage tooltip layering
  - Can add global tooltip management features
-->

<template>
  <teleport to="body">
    <div 
      id="tooltip-container" 
      class="tooltip-container"
      aria-hidden="true"
    />
  </teleport>
</template>

<script setup lang="ts">
// No props or logic needed - this is just a container
</script>

<style scoped>
.tooltip-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10000;
  /* Ensure this container doesn't interfere with other elements */
  isolation: isolate;
}
</style>
