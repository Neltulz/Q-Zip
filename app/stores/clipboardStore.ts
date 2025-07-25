// stores/clipboardStore.ts
import { defineStore } from 'pinia';
import { ref, computed, type Ref } from 'vue'; // Import ref and computed for Composition API style
import type { FileItem } from '@/types/types'; // Assuming you have a FileItem type in src/types/types.ts

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ClipboardState {
  clipboard: FileItem[];
  isCut: boolean;
  sourceJobId: number | null;
}

export const useClipboardStore = defineStore('clipboard', () => {
  // --- STATE ---
  const clipboard: Ref<FileItem[]> = ref([]);
  const isCut: Ref<boolean> = ref(false);
  const sourceJobId: Ref<number | null> = ref(null);

  // --- ACTIONS ---
  /**
   * Copies the given files to the clipboard.
   * @param files The FileItem objects to copy.
   * @param jobId The ID of the job from which the files are copied.
   */
  function copy(files: FileItem[], jobId: number) {
    console.log(`[clipboardStore] Copying ${files.length} files from job ${jobId}. Files:`, files.map(f => f.name)); // Added log
    clipboard.value = [...files];
    isCut.value = false;
    sourceJobId.value = jobId;
  }

  /**
   * Cuts the given files to the clipboard.
   * @param files The FileItem objects to cut.
   * @param jobId The ID of the job from which the files are cut.
   */
  function cut(files: FileItem[], jobId: number) {
    console.log(`[clipboardStore] Cutting ${files.length} files from job ${jobId}. Files:`, files.map(f => f.name)); // Added log
    clipboard.value = [...files];
    isCut.value = true;
    sourceJobId.value = jobId;
  }

  /**
   * Clears the clipboard.
   */
  function clear() {
    console.log(`[clipboardStore] Clearing clipboard.`); // Added log
    clipboard.value = [];
    isCut.value = false;
    sourceJobId.value = null;
  }

  /**
   * Checks if there are items in the clipboard.
   * @returns True if clipboard contains items, false otherwise.
   */
  function hasClipboardItems(): boolean {
    return clipboard.value.length > 0;
  }

  // --- GETTERS ---
  /**
   * Returns an array of file paths if the clipboard contains cut items.
   * Used to apply visual "dimming" to cut files in the source table.
   */
  const cutFilePaths = computed(() => isCut.value ? clipboard.value.map((file: FileItem) => file.path) : []);

  return {
    clipboard,
    isCut,
    sourceJobId,
    copy,
    cut,
    clear,
    hasClipboardItems,
    cutFilePaths,
  };
}, {
  // This store is not persisted as clipboard content is transient.
  persist: false,
});
