<!-- components/BottomButtons.vue @preserve -->
<template>
  <div :id="divId" class="buttons bottom-buttons" data-component-name="BottomButtons">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps({
  divId: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.bottom-buttons {
  display: grid;
  align-items: center;
  justify-content: end;
  grid-auto-flow: column;

  &:deep(.custom-button) {
    font-size: 1em;
  }
}
</style>
