// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
// modalsStore.ts

/**
 * @preserve
 * Description:
 * This store manages the state of active modals in the application. It allows
 * for dynamically opening and closing modals, ensuring they are only rendered
 * when needed. Modal state is persisted to maintain architectural consistency
 * with other stores in the project, which is required to prevent type-inference
 * failures.
 *
 * Usage Example:
 *
 * import { useModalsStore } from '@/stores/modalsStore';
 * const modalsStore = useModalsStore();
 *
 * // To open a modal with a callback:
 * modalsStore.openModal(
 * 'ResetConfirmationModalContent', // Component name in /components/modals
 * { title: 'Confirm Reset', description: 'Are you sure?' },
 * {}, // Props for the content component
 * (action) => { if (action === 'proceed') console.log('Confirmed!'); }
 * );
 *
 * // The ModalContainer component will automatically render this.
 */

import { defineStore } from "pinia";
import { ref, readonly, type Ref } from "vue";
import { logStoreAction, logManagerAction } from "@/utils/loggers";
import type { ActiveModal, ModalOptions } from "@/types/modal";

export const useModalsStore = defineStore(
  "modals",
  () => {
    // STATE
    const activeModals: Ref<ActiveModal[]> = ref([]);
    // Store for modal-specific data that can be passed to callbacks
    const modalData: Ref<Map<string, any>> = ref(new Map());

    // ACTIONS
    /**
     * Opens a new modal and adds it to the active stack.
     * @param component - The name of the modal content component (e.g., 'ResetConfirmationModalContent').
     * @param options - The configuration for the BaseModal shell (title, buttons, etc.).
     * @param props - The props to pass to the dynamic modal content component.
     * @param onClose - An optional callback function that executes when the modal is closed.
     */
    function openModal(
      component: string,
      options: ModalOptions,
      props?: Record<string, unknown>,
      onClose?: (action: string, data?: any) => void,
    ): void {
      const id = `modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      logStoreAction("modalsStore", `Opening modal: ${component} with ID: ${id}`, { options, props });
      logManagerAction("modalsStore", `Modal opening: ${component} (ID: ${id})`);

      activeModals.value.push({
        id,
        component,
        options,
        props: props || {},
        onClose,
      });

      logManagerAction("modalsStore", `Modal opened: ${component} (ID: ${id}). Total active modals: ${activeModals.value.length}`);
    }

    /**
     * Sets data for a specific modal that will be passed to the callback when the modal closes.
     * @param modalId - The unique ID of the modal.
     * @param data - The data to store for this modal.
     */
    function setModalData(modalId: string, data: any): void {
      modalData.value.set(modalId, data);
      logManagerAction("modalsStore", `Set modal data for ${modalId}:`, data);
    }

    /**
     * Closes a specific modal by its ID and executes its onClose callback.
     * @param id - The unique ID of the modal to close.
     * @param action - The string indicating how the modal was closed (e.g., 'proceed', 'cancel').
     */
    function closeModal(id: string, action: string): void {
      logStoreAction("modalsStore", `Closing modal ID: ${id} with action: ${action}`);
      logManagerAction("modalsStore", `Modal closing: ID ${id} with action: ${action}`);

      const modal = activeModals.value.find((m) => m.id === id);
      const data = modalData.value.get(id);

      if (modal?.onClose) {
        logStoreAction("modalsStore", `Executing onClose callback for modal ID: ${id}`);
        logManagerAction("modalsStore", `Executing onClose callback for modal: ${modal.component} (ID: ${id})`);
        modal.onClose(action, data);
      }

      // Clean up modal data
      modalData.value.delete(id);

      const index = activeModals.value.findIndex((m) => m.id === id);
      if (index > -1) {
        activeModals.value.splice(index, 1);
        logStoreAction("modalsStore", `Removed modal ID: ${id} from active stack.`);
        logManagerAction("modalsStore", `Modal closed: ID ${id}. Remaining active modals: ${activeModals.value.length}`);

        // Check for any remaining modal elements in the DOM
        setTimeout(() => {
          const remainingModals = document.querySelectorAll('.modal-wrapper');
          if (remainingModals.length > 0) {
            logManagerAction("modalsStore", `Warning: Found ${remainingModals.length} modal wrapper(s) still in DOM after closing modal ${id}`);
            remainingModals.forEach((modal, index) => {
              const modalId = modal.id;
              const isVisible = modal.classList.contains('modal-open');
              logManagerAction("modalsStore", `  Remaining modal ${index}: id=${modalId}, visible=${isVisible}`);
            });
          } else {
            logManagerAction("modalsStore", `All modal wrappers properly removed from DOM after closing modal ${id}`);
          }
        }, 100);
      }
    }

    /**
     * Closes all currently active modals.
     */
    function closeAllModals(): void {
      logStoreAction("modalsStore", "Closing all active modals.");
      // Call onClose for all modals before clearing
      for (const modal of activeModals.value) {
        if (modal.onClose) {
          modal.onClose("cancel"); // Default to 'cancel' action
        }
      }
      activeModals.value = [];
      modalData.value.clear();
    }

    return {
      activeModals: readonly(activeModals),
      openModal,
      setModalData,
      closeModal,
      closeAllModals,
    };
  },
  {
    persist: true,
  },
);
