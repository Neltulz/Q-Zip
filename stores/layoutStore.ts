/**
 * @preserve
 * Description: This Pinia store manages the active layout for the application.
 * It determines whether to show the 'welcome' layout or the 'default' application layout.
 * The state is persisted to ensure layout choices can be remembered across sessions.
 *
 * Usage Example:
 * import { useLayoutStore } from "@/stores/layoutStore"; // Or rely on Nuxt auto-import
 * const layoutStore = useLayoutStore();
 * layoutStore.showDefaultLayout(); // Switch to the default layout
 * layoutStore.showWelcomeLayout(); // Switch to the welcome layout
 */
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";

export type LayoutName = "welcome" | "default";

export const useLayoutStore = defineStore(
  "layout",
  () => {
    // State
    const currentLayout: Ref<LayoutName> = ref("welcome");

    // Actions
    /**
     * Switches the current layout to the default application view.
     */
    function showDefaultLayout(): void {
      currentLayout.value = "default";
    }

    /**
     * Switches the current layout to the welcome screen.
     */
    function showWelcomeLayout(): void {
      currentLayout.value = "welcome";
    }

    return {
      currentLayout,
      showDefaultLayout,
      showWelcomeLayout,
    };
  },
  {
    /**
     * Persist the state to storage.
     */
    persist: {
      key: "qzip-layout",
    },
  },
);
