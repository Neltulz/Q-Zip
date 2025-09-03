<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  ModalContainer.vue @preserve
-->
<!-- components/ModalContainer.vue @preserve -->
<!-- 
  ModalContainer.vue @preserve
-->
<!--
  Description:
  This component acts as a container for all dynamically rendered modals.
  It listens to the `modalsStore`, renders a `BaseModal` for each active
  modal instance, and now explicitly tells each modal whether it is the
  topmost one via the `is-active` prop.
-->
<template>
  <div id="modal-container" data-component-name="ModalContainer">
    <template v-for="(modal, index) in modalsStore.activeModals" :key="modal.id">
      <BaseModal
        :ref="(el: any) => (baseModalRefs[modal.id] = el)"
        :is-active="index === modalsStore.activeModals.length - 1"
        :modal-data-name="modal.component"
        :modal-id="modal.id"
        :options="getModalOptions(modal)"
      >
        <template v-if="isThreeSection(modal.component)" #left-column="{ modalsStore, modalId }">
          <component
            :is="modalContentComponents[modal.component]"
            v-bind="modal.props"
            :modalsStore="modalsStore"
            :modalId="modalId"
            section="left"
            :selectedVersion="getSelectedVersion(modal.id)"
            @update:selectedVersion="(val: string) => setSelectedVersion(modal.id, val)"
          />
        </template>

        <template #body-content="{ modalsStore, modalId }">
          <component
            v-if="isThreeSection(modal.component)"
            :is="modalContentComponents[modal.component]"
            v-bind="modal.props"
            :modalsStore="modalsStore"
            :modalId="modalId"
            section="main"
            :selectedVersion="getSelectedVersion(modal.id)"
            @update:selectedVersion="(val: string) => setSelectedVersion(modal.id, val)"
          />
          <component
            v-else
            :is="modalContentComponents[modal.component]"
            v-bind="modal.props"
            :modalsStore="modalsStore"
            :modalId="modalId"
          />
        </template>

        <template v-if="wantsRightSection(modal.component)" #right-column="{ modalsStore, modalId }">
          <component
            :is="modalContentComponents[modal.component]"
            v-bind="modal.props"
            :modalsStore="modalsStore"
            :modalId="modalId"
            section="right"
            :selectedVersion="getSelectedVersion(modal.id)"
            @update:selectedVersion="(val: string) => setSelectedVersion(modal.id, val)"
          />
        </template>
      </BaseModal>
    </template>
  </div>
  
</template>
<script setup lang="ts">
import { defineAsyncComponent, type Component, watchEffect, reactive } from "vue";
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
  ChangelogModalContent: defineAsyncComponent(() => import("@/components/modals/ChangelogModalContent.vue")),
  AboutModalContent: defineAsyncComponent(() => import("@/components/modals/AboutModalContent.vue")),
  TestMultiColumnModal: defineAsyncComponent(() => import("@/components/modals/TestMultiColumnModal.vue")),
};

// Keep per-modal state for cross-section sync (e.g., version selection)
const perModalState = reactive<Record<string, { selectedVersion: string }>>({});

const getSelectedVersion = (modalId: string): string => {
  if (!perModalState[modalId]) {
    perModalState[modalId] = { selectedVersion: "0.1.24" };
  }
  return perModalState[modalId].selectedVersion;
};

const setSelectedVersion = (modalId: string, value: string) => {
  if (!perModalState[modalId]) {
    perModalState[modalId] = { selectedVersion: value };
  } else {
    perModalState[modalId].selectedVersion = value;
  }
};

// Hold refs to BaseModal instances to drive conditional column visibility
const baseModalRefs: Record<string, any> = {};

const isThreeSection = (componentName: string): boolean => {
  return componentName === 'ChangelogModalContent' || componentName === 'TestMultiColumnModal';
};

const wantsRightSection = (componentName: string): boolean => {
  // Only TestMultiColumnModal uses a right column for now.
  return componentName === 'TestMultiColumnModal';
};

const getModalOptions = (modal: any) => {
  // For Changelog, enforce fixed width/height and main column max width
  if (modal.component === 'ChangelogModalContent') {
    return {
      ...modal.options,
      widthMode: 'fixed',
      heightMode: 'fixed',
      fixedWidth: '95vw',
      fixedHeight: '70vh',
      // Provide a CSS var via style for main column cap
      style: { '--modal-main-max-width': '1000px' },
    };
  }
  // Defaults for others
  return modal.options;
};
</script>
<style scoped>
#modal-container {
  position: absolute;
}
</style>
