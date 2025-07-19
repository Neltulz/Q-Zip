<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/ModalContainer.vue @preserve -->
<!--
  Description:
  This component acts as a container for all dynamically rendered modals.
  It listens to the `modalsStore` and renders a `BaseModal` for each active
  modal instance. Modal content components are asynchronously and manually
  imported to ensure compatibility with the build environment.
-->
<template>
  <div id="modal-container" data-component-name="ModalContainer">
    <template v-for="modal in modalsStore.activeModals" :key="modal.id">
      <BaseModal :modal-data-name="modal.component" :modal-id="modal.id" :options="modal.options">
        <template #body-content>
          <component :is="modalContentComponents[modal.component]" v-bind="modal.props" />
        </template>
      </BaseModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, type Component, watchEffect } from "vue";
import { useModalsStore } from "@/stores/modalsStore";
import { logStoreAction } from "@/utils/loggers";

const modalsStore = useModalsStore();

// Watch for changes in the activeModals array and log them.
// This will confirm if the component is reacting to store updates.
watchEffect(() => {
  logStoreAction("ModalContainer", "Detected change in activeModals store", {
    count: modalsStore.activeModals.length,
    modals: JSON.parse(JSON.stringify(modalsStore.activeModals)), // Deep copy for logging
  });
});

// Manually define async components for modal content. This avoids issues with
// `import.meta.glob` type definitions not being found in the project's
// TypeScript configuration.
const modalContentComponents: Record<string, Component> = {
  DebugButtonTestModalContent: defineAsyncComponent(() => import("@/components/modals/DebugButtonTestModalContent.vue")),
  ResetConfirmationModalContent: defineAsyncComponent(() => import("@/components/modals/ResetConfirmationModalContent.vue")),
};
</script>

<style scoped>
#modal-container {
  position: absolute;
}
</style>
