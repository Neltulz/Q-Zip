<!-- eslint-disable vue/no-v-html @preserve -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/BaseModal.vue @preserve -->
<template>
  <teleport to="body">
    <div
      v-if="isMounted"
      :id="props.modalId"
      class="modal-wrapper"
      :class="[animationState, { 'modal-open': isVisible }]"
      :data-name="props.modalDataName"
      data-component-name="BaseModal"
      @click="props.options?.closeOnClickOutside ? handleClose('cancel') : null"
    >
      <div class="modal-backdrop" />
      <dialog ref="dialog" class="modal-dialog">
        <div v-if="props.options" class="modal-content" @click.stop>
          <div class="modal-header">
            <div class="start-section">
              <slot name="header-icon">
                <Icon v-if="props.options.icon" :name="props.options.icon" size="24" />
                <Icon v-else name="mdi:information-outline" size="24" />
              </slot>
              <slot name="header-title">
                <h2 class="title">{{ props.options.title }}</h2>
              </slot>
            </div>
            <div class="end-section">
              <slot name="end-buttons" />
              <CustomButton
                v-if="props.options.showCloseButton"
                button-style-class="trans-btn"
                data-name="modal-close-btn"
                first-icon-name="mdi:close"
                :first-icon-size="24"
                @click="handleClose('cancel')"
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
                <template v-if="descriptionContent.length > 0">
                  <p v-for="(line, index) in descriptionContent" :key="index" v-html="line" />
                </template>
              </slot>
            </OverlayScrollbarsComponent>
          </div>

          <div
            v-if="props.options.buttons && props.options.buttons.length > 0"
            class="modal-footer"
            :style="{
              justifyContent: props.options.footerJustifyContent || 'space-around',
            }"
          >
            <slot name="footer-buttons">
              <CustomButton
                v-for="button in props.options.buttons"
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
import { ref, onMounted, computed, watchEffect } from "vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useThemeStore } from "@/stores/themeStore";
import { useModalsStore } from "@/stores/modalsStore";
import { logLifecycle } from "@/utils/loggers";
import type { ModalOptions as OriginalModalOptions } from "@/types/modal";
import CustomButton from "./CustomButton.vue";

// Locally extend the global modal options type for component-specific props
interface ModalOptions extends OriginalModalOptions {
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

// Correctly define props without destructuring to preserve reactivity
const props = defineProps<{
  options?: ModalOptions;
  modalId: string;
  modalDataName?: string;
  isActive: boolean; // New prop passed by ModalContainer
}>();

const themeStore = useThemeStore();
const modalsStore = useModalsStore();

const dialog = ref<HTMLDialogElement | null>(null);
const isMounted = ref(false);
const isVisible = ref(false);
const animationState = ref("");
const closeDelay = 300;

// This computed property now explicitly returns a `readonly string[]`,
// which resolves the TypeScript error in the template.
const descriptionContent = computed((): readonly string[] => {
  const desc = props.options?.description;
  if (!desc) {
    return [];
  }
  if (typeof desc === "string") {
    return [desc];
  }
  return desc; // At this point, desc must be `readonly string[]`
});

// Use watchEffect to safely manage the event listener's lifecycle
watchEffect((onInvalidate) => {
  // Only add the listener if the modal is active and has options
  if (!props.isActive || !props.options) {
    return;
  }

  // Create a stable copy of the options to satisfy TypeScript's control flow analysis
  const stableOptions = { ...props.options };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!props.isActive) return; // Re-check in case modal was closed

    if (event.key === "Escape" && (stableOptions.closeOnEscape ?? true)) {
      handleClose("cancel");
    } else if (event.key === "Enter") {
      const buttons = stableOptions.buttons;
      if (buttons && buttons.length > 0) {
        const defaultButton = buttons.find((b) => b.isDefault) || buttons.find((b) => b.action === "proceed");
        if (defaultButton) {
          handleClose(defaultButton.action);
          event.preventDefault();
        }
      }
    }
  };

  window.addEventListener("keydown", handleKeydown);

  // The onInvalidate callback automatically cleans up the listener
  onInvalidate(() => {
    window.removeEventListener("keydown", handleKeydown);
  });
});

onMounted(() => {
  logLifecycle("BaseModal", `Mounted with ID: ${props.modalId}`);
  isMounted.value = true;
  isVisible.value = true;

  setTimeout(() => {
    animationState.value = "modal-is-entering";
  }, 50);
});

const handleClose = (action: string): void => {
  if (animationState.value === "modal-is-leaving") return;

  animationState.value = "modal-is-leaving";

  setTimeout(() => {
    isVisible.value = false;
    animationState.value = "";
    modalsStore.closeModal(props.modalId, action);
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
</script>

<style scoped>
.modal-wrapper {
  align-items: center;
  display: flex;
  height: 100vh;
  inset: 0;
  inset-block-start: var(--title-bar-height);
  justify-content: center;
  pointer-events: all;
  position: fixed;
  z-index: 99999;
}

.modal-wrapper:not(.modal-open) {
  display: none;
}

.modal-backdrop {
  backdrop-filter: blur(0px);
  background-color: hsla(0, 0%, 0%, 0.5);
  inset: 0;
  opacity: 0;
  position: absolute;
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
  z-index: 1;
}

.modal-wrapper.modal-is-entering .modal-backdrop {
  backdrop-filter: blur(4px);
  opacity: 1;
}

.modal-wrapper.modal-is-leaving .modal-backdrop {
  backdrop-filter: blur(0px);
  opacity: 0;
}

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
  pointer-events: auto;
  position: relative;
  transform: perspective(1000px) scale(0.7) rotateX(45deg);
  transform-origin: center;
  width: auto;
  z-index: 2;
}

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
