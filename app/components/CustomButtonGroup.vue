<!-- #region top-comments -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!--
  components/CustomButtonGroup.vue @preserve
-->
<!-- components/CustomButtonGroup.vue @preserve -->
<!--
  Description:
  A reusable button group component that displays connected buttons with
  dividers between them. The active button shows a blue line indicator at
  the bottom. Supports arbitrary number of buttons with automatic divider
  management and hover states.

  Features:
  - Connected button styling with background
  - Automatic dividers between buttons
  - Active state with blue line indicator
  - Hover effects that hide adjacent dividers
  - Support for arbitrary number of buttons
  - Flexible button configuration
-->
<!-- #endregion -->
<!-- #region template -->
<template>
  <div class="custom-button-group" :class="{ disabled }" data-component-name="CustomButtonGroup">
    <slot />
  </div>
</template>

<!-- #region script -->
<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  }
);



// Expose the component for parent access if needed
defineExpose({});
</script>
<!-- #endregion -->
<!-- #region styles -->
<style scoped>
/* Custom Button Group Block */
.custom-button-group {
  --btn-line-thickness: 2px;
  display: flex;
  position: relative;
  padding-inline: 0;
  width: 100%;
}

/* Background pseudo-element for button group - positioned behind buttons */
.custom-button-group:before {
  background-color: var(--bg-clr-liter);
  border-radius: var(--brdr-rad-smalr);
  content: "";
  inset: 0;
  position: absolute;
  z-index: 0;
}

/* Disabled state modifier */
.custom-button-group--disabled {
  opacity: 0.25;
  pointer-events: none;
}

/* Debug popup specific z-index fixes */
.debug-popup .custom-button-group {
  z-index: 10000;
}

.debug-popup .custom-button-group :deep(.custom-button) {
  z-index: 10001;
}

.debug-popup .custom-button-group .divider {
  z-index: 10002;
}

/* First button element - no left margin */
.custom-button-group :deep(.custom-button:first-child) {
  margin-inline-start: 2px;
}

/* Last button element - no right margin */
.custom-button-group :deep(.custom-button:last-child) {
  margin-inline-end: 2px;
}

/* Button element styling */
.custom-button-group :deep(.custom-button) {
  margin-inline: 0;
  padding-inline: 1.5em;
  position: relative;
  z-index: 1;
  min-width: 80px;
  flex: 1;
}

/* Button content visibility */
.custom-button-group :deep(.custom-button .button-content) {
  display: flex !important;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: visible;
}

/* Fix visual-style positioning - remove inset that causes layout issues */
.custom-button-group :deep(.custom-button .visual-style) {
  inset: 0 !important;
}



/* Divider element between buttons - completely global for slotted content */
:global(.divider) {
  border-inline-start: 2px solid var(--brdr-clr-liter) !important;
  height: 100% !important;
  margin-block: 0 !important;
  position: relative !important;
  transition: opacity 500ms ease !important;
  z-index: 5 !important;
  opacity: 1 !important;
}

/* Hide dividers adjacent to hovered/active buttons */
:global(.custom-button:hover + .divider) {
  opacity: 0 !important;
}

:global(.custom-button.active + .divider) {
  opacity: 0 !important;
}
</style>
<!-- #endregion -->
