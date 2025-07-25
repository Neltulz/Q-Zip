<!-- components/LockButton.vue @preserve -->
<template>
  <CustomButton
    :first-icon-name="isLocked ? 'mdi:lock' : 'mdi:lock-open'"
    button-style-class="lock-btn trans-btn"
    data-name="lock-button"
    data-component-name="LockButton"
    @click="$emit('click')"
  />
</template>

<script setup lang="ts">
defineProps<{
  isLocked: boolean;
}>();
defineEmits(["click"]);
</script>

<style scoped>
button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1.2rem;
}
</style>
