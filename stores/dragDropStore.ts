// stores/dragDropStore.ts @preserve
/**
 * @preserve
 * Description:
 * This Pinia store manages the transient state for drag-and-drop operations.
 * It is intentionally non-persisted to ensure the drag-over overlay does not
 * get "stuck" after a failed drop or an application refresh. The store's
 * structure is aligned with other stores for architectural consistency.
 *
 * Usage Example:
 * import { useDragDropStore } from "@/stores/dragDropStore"; // Or rely on Nuxt auto-import
 * const dragDropStore = useDragDropStore();
 * dragDropStore.setExternalDragOver(true);
 */

import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import { logStoreAction } from "@/utils/loggers";

export const useDragDropStore = defineStore(
  "dragDrop",
  () => {
    // --- STATE ---
    const isExternalDragOver: Ref<boolean> = ref(false);

    // --- ACTIONS ---
    /**
     * Sets the global state indicating whether a file drag from outside the
     * window is currently in progress.
     * @param value - True if dragging is active, false otherwise.
     */
    function setExternalDragOver(value: boolean): void {
      logStoreAction("dragDropStore", `Setting isExternalDragOver to: ${value}`);
      isExternalDragOver.value = value;
    }

    return {
      isExternalDragOver,
      setExternalDragOver,
    };
  },
  {
    // This store is not persisted to prevent the "stuck" drag-over state on
    // application refresh. The persist key is set to false to conform to the
    // project's unified store structure.
    persist: false,
  },
);
