// stores/dragDropStore.ts @preserve
/**
 * @preserve
 * Description:
 * This Pinia store manages the transient state for drag-and-drop operations.
 * It is intentionally non-persisted to ensure the drag-over overlay does not
 * get "stuck" after a failed drop or an application refresh. The store's
 * structure is aligned with other stores for architectural consistency.
 * Internal drag operations now support native HTML5 Drag and Drop, with
 * operation (move/copy) chosen post-drop via UI prompts.
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

    // New internal drag states
    const isInternalDragActive: Ref<boolean> = ref(false);
    const internalDraggedFiles: Ref<string[]> = ref([]);
    const internalDragOperation: Ref<"move" | "copy" | null> = ref(null);
    const internalDragSourceJobId: Ref<number | null> = ref(null);

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

    /**
     * Sets the state for an internal drag operation.
     * @param files - Array of paths of files being dragged.
     * @param operation - 'move' or 'copy' (optional, defaults to null since chosen post-drop).
     * @param sourceJobId - The ID of the job from which files are being dragged.
     */
    function startInternalDrag(files: string[], operation: "move" | "copy" | null = null, sourceJobId: number): void {
      logStoreAction("dragDropStore", `Starting internal drag: ${files.length} files, operation: ${operation}, sourceJob: ${sourceJobId}`);
      isInternalDragActive.value = true;
      internalDraggedFiles.value = files;
      internalDragOperation.value = operation;
      internalDragSourceJobId.value = sourceJobId;
    }

    /**
     * Clears the state of an internal drag operation.
     */
    function endInternalDrag(): void {
      logStoreAction("dragDropStore", "Ending internal drag.");
      isInternalDragActive.value = false;
      internalDraggedFiles.value = [];
      internalDragOperation.value = null;
      internalDragSourceJobId.value = null;
    }

    return {
      isExternalDragOver,
      setExternalDragOver,
      isInternalDragActive,
      internalDraggedFiles,
      internalDragOperation,
      internalDragSourceJobId,
      startInternalDrag,
      endInternalDrag,
    };
  },
  {
    // This store is not persisted to prevent the "stuck" drag-over state on
    // application refresh. The persist key is set to false to conform to the
    // project's unified store structure.
    persist: false,
  },
);