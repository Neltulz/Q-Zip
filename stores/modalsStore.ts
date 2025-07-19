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
import { logStoreAction } from "@/utils/loggers";
import type { ActiveModal, ModalOptions } from "@/types/modal";

export const useModalsStore = defineStore(
  "modals",
  () => {
    // STATE
    const activeModals: Ref<ActiveModal[]> = ref([]);

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
      onClose?: (action: string) => void,
    ): void {
      const id = `modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      logStoreAction("modalsStore", `Opening modal: ${component} with ID: ${id}`, { options, props });
      activeModals.value.push({
        id,
        component,
        options,
        props: props || {},
        onClose,
      });
    }

    /**
     * Closes a specific modal by its ID and executes its onClose callback.
     * @param id - The unique ID of the modal to close.
     * @param action - The string indicating how the modal was closed (e.g., 'proceed', 'cancel').
     */
    function closeModal(id: string, action: string): void {
      logStoreAction("modalsStore", `Closing modal ID: ${id} with action: ${action}`);
      const modal = activeModals.value.find((m) => m.id === id);
      if (modal?.onClose) {
        logStoreAction("modalsStore", `Executing onClose callback for modal ID: ${id}`);
        modal.onClose(action);
      }

      const index = activeModals.value.findIndex((m) => m.id === id);
      if (index > -1) {
        activeModals.value.splice(index, 1);
        logStoreAction("modalsStore", `Removed modal ID: ${id} from active stack.`);
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
    }

    return {
      activeModals: readonly(activeModals),
      openModal,
      closeModal,
      closeAllModals,
    };
  },
  {
    persist: true,
  },
);
