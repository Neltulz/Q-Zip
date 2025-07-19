<!-- eslint-disable vue/no-v-html @preserve -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/BaseModal.vue @preserve -->
<!--
  Description:
  A generic, reusable modal component that provides the basic structure
  (header, body, footer) and animations. It now manually handles its state
  to prevent blocking interaction with the main application window.
-->
<template>
  <teleport to="body">
    <div
      v-if="isMounted"
      :id="modalId"
      class="modal-wrapper"
      :class="[animationState, { 'modal-open': isVisible }]"
      :data-name="modalDataName"
      data-component-name="BaseModal"
      @click="handleClose('cancel')"
    >
      <div class="modal-backdrop" />
      <dialog ref="dialog" class="modal-dialog">
        <!-- @click.stop prevents clicks inside the modal from closing it -->
        <div v-if="options" class="modal-content" @click.stop>
          <div class="modal-header">
            <div class="start-section">
              <slot name="header-icon">
                <Icon v-if="options?.icon" :name="options.icon" size="24" />
                <Icon v-else name="mdi:information-outline" size="24" />
              </slot>
              <slot name="header-title">
                <h2 class="title">{{ options?.title }}</h2>
              </slot>
            </div>

            <div class="end-section">
              <slot name="end-buttons" />
              <CustomButton
                button-style-class="trans-btn"
                data-name="modal-close-btn"
                first-icon-name="mdi:close"
                :first-icon-size="24"
                @click="handleClose('close')"
              />
            </div>
          </div>

          <div class="modal-body">
            <OverlayScrollbarsComponent
              class="modal-body-scrollbar"
              defer
              :options="{
                scrollbars: {
                  visibility: 'auto',
                  autoHide: 'move',
                  autoHideSuspend: true,
                  theme: currentTheme,
                },
              }"
            >
              <slot name="body-content">
                <!-- Default body content if no slot is provided -->
                <template v-if="Array.isArray(options?.description)">
                  <p v-for="(line, index) in options.description" :key="index" v-html="line" />
                </template>
                <p v-else v-html="options?.description" />
              </slot>
            </OverlayScrollbarsComponent>
          </div>

          <div
            v-if="options?.buttons?.length"
            class="modal-footer"
            :style="{
              justifyContent: options.footerJustifyContent || 'space-around',
            }"
          >
            <slot name="footer-buttons">
              <CustomButton
                v-for="button in options?.buttons"
                :key="button.text"
                :btn-theme="button.theme"
                :button-style-class="button.styleClass"
                :data-name="`modal-${button.action}-btn`"
                :first-icon-name="button.icon || getDefaultButtonIcon(button.action)"
                :first-icon-size="20"
                :justify="button.justify"
                @click="handleClose(button.action)"
              >
                {{ button.text }}
              </CustomButton>
            </slot>
          </div>
        </div>
      </dialog>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useThemeStore } from "@/stores/themeStore";
import { useModalsStore } from "@/stores/modalsStore";
import { logLifecycle } from "@/utils/loggers";
import type { ModalOptions } from "@/types/modal";

const props = defineProps<{
  options: ModalOptions;
  modalId: string;
  modalDataName?: string;
}>();

const themeStore = useThemeStore();
const modalsStore = useModalsStore();

const dialog = ref<HTMLDialogElement | null>(null);
const isMounted = ref(false);
const closeDelay = 300; // Animation duration

const isVisible = ref(false);
const animationState = ref("");

const handleKeydown = (event: KeyboardEvent): void => {
  // Only handle ESC if this is the topmost modal
  const allModals = modalsStore.activeModals;
  if (allModals.length > 0 && allModals[allModals.length - 1].id === props.modalId) {
    if (event.key === "Escape") {
      handleClose("cancel");
    }
  }
};

// When the component mounts, it's because it was added to the store.
// We immediately start the entrance animation.
onMounted(() => {
  logLifecycle("BaseModal", `Mounted with ID: ${props.modalId}`);
  isMounted.value = true;
  isVisible.value = true;

  // After a short delay, add the entering class to trigger animations
  setTimeout(() => {
    animationState.value = "modal-is-entering";
    logLifecycle("BaseModal", "Animation state set to 'modal-is-entering'", { modalId: props.modalId });
  }, 50); // A small delay to ensure the element is in the DOM

  // Manually handle the Escape key
  window.addEventListener("keydown", handleKeydown);
});

const handleClose = (action: string): void => {
  // Prevent multiple close calls
  if (animationState.value === "modal-is-leaving") return;

  // 1. Add the leaving class to trigger exit animations
  animationState.value = "modal-is-leaving";
  logLifecycle("BaseModal", `Closing with action: '${action}'. Animation state set to 'modal-is-leaving'`, {
    modalId: props.modalId,
  });

  // 2. After animations are finished, tell the store to remove the modal.
  setTimeout(() => {
    isVisible.value = false;
    animationState.value = "";
    modalsStore.closeModal(props.modalId, action); // This triggers the unmount
  }, closeDelay);
};

const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));

const getDefaultButtonIcon = (action: string): string => {
  switch (action) {
    case "proceed":
      return "mdi:check-circle-outline";
    case "cancel":
      return "mdi:close-circle-outline";
    default:
      return "";
  }
};

onUnmounted(() => {
  logLifecycle("BaseModal", `Unmounted ID: ${props.modalId}`);
  // Clean up the event listener
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.modal-wrapper {
  align-items: center;
  display: flex;
  height: 100vh;
  inset: 0;
  inset-block-start: var(--title-bar-height);
  justify-content: center;
  /*
    Make the wrapper non-interactive. This allows clicks to pass
    through the backdrop to the title bar, enabling dragging.
  */
  pointer-events: all; /* required so that when we click the backdrop, the modal closes */
  position: fixed;
  /* The z-index must be lower than the title bar (100000). */
  z-index: 99999;
}

/* Hide the wrapper when it's not open */
.modal-wrapper:not(.modal-open) {
  display: none;
}

/* --- Backdrop Styling --- */
.modal-backdrop {
  backdrop-filter: blur(0px);
  background-color: hsla(0, 0%, 0%, 0.5);
  inset: 0;
  opacity: 0;
  position: absolute;
  /* Transition properties are now triggered by the parent's classes */
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
  z-index: 1;
}

/* Fade in the backdrop during the entering phase */
.modal-wrapper.modal-is-entering .modal-backdrop {
  backdrop-filter: blur(4px);
  opacity: 1;
}

/* Fade out the backdrop during the leaving phase */
.modal-wrapper.modal-is-leaving .modal-backdrop {
  backdrop-filter: blur(0px);
  opacity: 0;
}

/* --- Dialog Styling --- */

/* Hide the native backdrop */
.modal-dialog::backdrop {
  display: none;
}

.modal-dialog {
  --modal-max-width: 75vw;
  --modal-bg: var(--bg-clr-liter);
  --modal-brdr: var(--brdr-clr-dark);
  --modal-header-pad-in: calc(var(--pad-in) * 3);
  --modal-header-pad-blok: calc(var(--pad-blok) * 2);
  --modal-body-pad-in: calc(var(--pad-in) * 3);
  --modal-body-pad-blok: calc(var(--pad-blok) * 2);
  --modal-footer-pad-in: calc(var(--pad-in) * 2);
  --modal-footer-pad-blok: calc(var(--pad-blok) * 2);

  align-self: center;
  background-color: transparent;
  border: none;
  color: var(--txt-clr-liter);
  display: flex;
  flex-direction: column;
  justify-self: center;
  max-height: 80vh;
  max-width: var(--modal-max-width);
  opacity: 0;
  overflow: visible;
  padding: 0;
  /*
    Enable pointer events only for the dialog itself, allowing the backdrop
    (part of the wrapper) to be non-interactive.
  */
  pointer-events: auto;
  position: relative;
  transform: perspective(1000px) scale(0.7) rotateX(45deg);
  transform-origin: center;
  width: auto;
  z-index: 2;
}

/* Animate the dialog based on the wrapper's state */
.modal-wrapper.modal-is-entering .modal-dialog {
  animation: modal-enter-3d 300ms ease-out forwards;
}

.modal-wrapper.modal-is-leaving .modal-dialog {
  animation: modal-leave-3d 300ms ease-in forwards;
}

.modal-content {
  background-color: var(--modal-bg);
  border: 1px solid var(--modal-brdr);
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px hsla(0, 0%, 0%, 0.5), 0 8px 10px -6px hsla(0, 0%, 0%, 0.1);
  display: grid;
  grid-template-areas:
    "modal-header"
    "modal-body"
    "modal-footer";
  grid-template-rows: auto 1fr auto;
  height: 100%;
  overflow: hidden;
  pointer-events: auto;
}

.modal-header {
  align-items: center;
  display: flex;
  gap: 12px;
  grid-area: modal-header;
  justify-content: space-between;
  overflow: hidden;
  padding-block: var(--modal-header-pad-blok);
  padding-inline: var(--modal-header-pad-in);
  width: 100%;
}

.modal-header .start-section {
  align-items: center;
  display: flex;
  gap: 12px;
  max-width: 100%;
  overflow: hidden;
}

.modal-header .start-section .iconify {
  min-width: 16px;
}

.modal-header .end-section {
  align-items: center;
  display: flex;
  gap: 8px;
}

.modal-header .title {
  flex-grow: 1;
  font-size: 1.5rem;
  font-weight: 600;
  min-width: 0;
}

.modal-body {
  grid-area: modal-body;
  line-height: 1.5;
  max-width: var(--modal-max-width);
  overflow: hidden;
}

.modal-body .modal-body-scrollbar {
  height: 100%;
  padding-block-end: calc(var(--modal-body-pad-blok) * 2);
  padding-block-start: var(--modal-body-pad-blok);
  padding-inline: var(--modal-body-pad-in);
}

.modal-body :deep(p) {
  margin-block-end: 1em;
  max-width: 100%;
  width: var(--ideal-char-reading-count);
}

.modal-body :deep(p:last-child) {
  margin-block-end: 0;
}

.modal-body:deep(.two-column-grid) {
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr 1fr;
  width: 100%;
}

.modal-body:deep(.column) {
  align-items: stretch;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-body:deep(.column > h3) {
  border-block-end: 1px solid var(--brdr-clr);
  margin-block-end: 8px;
  padding-block-end: 8px;
  text-align: center;
}

.modal-footer {
  background-color: var(--bg-clr-lite);
  display: flex;
  flex-wrap: wrap;
  gap: var(--pad-in);
  grid-area: modal-footer;
  overflow: hidden;
  padding-block: var(--modal-footer-pad-in);
  padding-inline: var(--modal-footer-pad-in);
  width: 100%;
}

.modal-footer:deep(.custom-button) {
  --visual-style-inset: 0px;
  flex-grow: 1;
  grid-template-columns: auto auto;
  justify-content: center;
  max-width: min(30ch, 100%);
  min-width: 20ch;
}

@media (width < 1024px) {
  .modal-dialog {
    --modal-max-width: 90vw;
  }
}

/* --- Keyframes --- */
@keyframes modal-enter-3d {
  from {
    opacity: 0;
    transform: perspective(1000px) scale(0.7) rotateX(45deg);
  }
  to {
    opacity: 1;
    transform: perspective(1000px) scale(1) rotateX(0deg);
  }
}

@keyframes modal-leave-3d {
  from {
    opacity: 1;
    transform: perspective(1000px) scale(1) rotateX(0deg);
  }
  to {
    opacity: 0;
    transform: perspective(1000px) scale(0.7) rotateX(-45deg);
  }
}
</style>
