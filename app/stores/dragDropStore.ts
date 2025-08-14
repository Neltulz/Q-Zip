// stores/dragDropStore.ts
// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file. @preserve
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
 * dragDropStore.startInternalDrag(...);
 */

import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import { logStoreAction } from "@/utils/loggers";

export const useDragDropStore = defineStore(
  "dragDrop",
  () => {
    // --- STATE ---
    const isInternalDragActive: Ref<boolean> = ref(false);
    const internalDraggedFiles: Ref<string[]> = ref([]);
    const internalDragOperation: Ref<"move" | "copy" | null> = ref(null);
    const internalDragSourceJobId: Ref<number | null> = ref(null);
    const dropOccurred: Ref<boolean> = ref(false);

    // --- ACTIONS ---
    function setDropOccurred(value: boolean): void {
      logStoreAction("dragDropStore", `Setting dropOccurred to: ${value}`);
      dropOccurred.value = value;
    }

    function startInternalDrag(files: string[], operation: "move" | "copy" | null = null, sourceJobId: number): void {
      logStoreAction("dragDropStore", `Starting internal drag: ${files.length} files, operation: ${operation}, sourceJob: ${sourceJobId}`);
      isInternalDragActive.value = true;
      internalDraggedFiles.value = files;
      internalDragOperation.value = operation;
      internalDragSourceJobId.value = sourceJobId;
      dropOccurred.value = false;
    }

    function endInternalDrag(): void {
      logStoreAction("dragDropStore", "Ending internal drag.");
      isInternalDragActive.value = false;
      internalDraggedFiles.value = [];
      internalDragOperation.value = null;
      internalDragSourceJobId.value = null;
      dropOccurred.value = false;
    }

    return {
      isInternalDragActive,
      internalDraggedFiles,
      internalDragOperation,
      internalDragSourceJobId,
      dropOccurred,
      setDropOccurred,
      startInternalDrag,
      endInternalDrag,
    };
  },
  {
    persist: false,
  },
);
