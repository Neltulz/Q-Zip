// stores/uiStore.ts @preserve
/**
 * @preserve
 * Description:
 * This Pinia store manages the global UI state, including panel widths and
 * layout orientation. The transient `isExternalDragOver` state has been
 * removed and relocated to its own non-persisted store (`dragDropStore`)
 * to fix the "stuck drop zone" bug.
 *
 * Usage Example:
 * import { useUiStore } from "@/stores/uiStore";
 * const uiStore = useUiStore();
 * uiStore.toggleJobSelectorOrientation();
 */
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";

export type JobSelectorOrientation = "horizontal" | "vertical";
export type PanelWidth = string;

export const useUiStore = defineStore(
  "ui",
  () => {
    // State
    const jobSelectorOrientation: Ref<JobSelectorOrientation> = ref("horizontal");
    const jobsSectionWidth: Ref<PanelWidth> = ref("3fr");
    const compressSectionWidth: Ref<PanelWidth> = ref("2fr");

    // Actions
    function toggleJobSelectorOrientation(): void {
      jobSelectorOrientation.value = jobSelectorOrientation.value === "horizontal" ? "vertical" : "horizontal";
    }

    function setPanelWidths(jobsWidth: PanelWidth, compressWidth: PanelWidth): void {
      jobsSectionWidth.value = jobsWidth;
      compressSectionWidth.value = compressWidth;
    }

    function resetUi(): void {
      // FIX: Corrected typo from `jobSelectororientation` to `jobSelectorOrientation`.
      jobSelectorOrientation.value = "horizontal";
      jobsSectionWidth.value = "3fr";
      compressSectionWidth.value = "2fr";
    }

    return {
      jobSelectorOrientation,
      jobsSectionWidth,
      compressSectionWidth,
      toggleJobSelectorOrientation,
      setPanelWidths,
      resetUi,
    };
  },
  {
    persist: true, // This store remains persisted for UI layout settings.
  }
);
