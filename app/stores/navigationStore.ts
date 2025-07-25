/* stores/navigationStore.ts @preserve */
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";

// Define the possible page names for type safety.
export type PageName = "JobSetup" | "JobQueue" | "Progress";

// Define the order of the pages for transition logic.
const PAGE_ORDER: PageName[] = ["JobSetup", "JobQueue", "Progress"];

type TransitionName = "page-fade" | "slide-left" | "slide-right";

export const useNavigationStore = defineStore(
  "navigation",
  () => {
    // State
    const activePage: Ref<PageName> = ref("JobSetup");
    const transitionName: Ref<TransitionName> = ref("page-fade");

    // Actions
    function setActivePage(pageName: PageName) {
      const oldPage = activePage.value;

      // Do nothing if we are already on the target page.
      if (oldPage === pageName) {
        return;
      }

      const toIndex = PAGE_ORDER.indexOf(pageName);
      const fromIndex = PAGE_ORDER.indexOf(oldPage);

      // Determine the transition direction based on page order.
      if (toIndex === fromIndex) {
        transitionName.value = "page-fade";
      } else {
        transitionName.value =
          toIndex > fromIndex ? "slide-left" : "slide-right";
      }

      // Update the active page, which will trigger the navigation.
      activePage.value = pageName;
    }

    return {
      activePage,
      transitionName,
      setActivePage,
    };
  },
  {
    // Using the same persistence strategy as other stores.
    persist: {
      key: "qzip-navigation",
      paths: ["activePage"], // Only persist activePage.
    },
  }
);
