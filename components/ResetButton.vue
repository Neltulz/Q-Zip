<!-- components/ResetButton.vue -->
<!--
  Description:
  A reusable button component that triggers a reset function when clicked.
  This is typically used to reset settings or values to their default states.

  Usage Example:
  In your parent component's template:
    <ResetButton :reset-function="() => resetSetting('someKey')" :disabled="isSettingAtDefault('someKey')" />
  Note: The resetFunction prop is required and should be a function that performs the reset action.
-->

<template>
  <button
    class="reset-btn minimal-trans-btn"
    title="Reset Setting"
    data-component-name="ResetButton"
    :disabled="disabled"
    @click="resetFunction"
  >
    <Icon name="mdi:arrow-u-left-top" size="16" />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  resetFunction: () => void;
  disabled: boolean;
}>();
</script>

<style scoped>
.reset-btn {
  grid-column: 1;
  justify-self: end;
  opacity: 0.5;
  padding: 0;
  pointer-events: auto;

  &:hover:not(:disabled) {
    opacity: 1;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0;
    pointer-events: none;
  }
}
</style>
