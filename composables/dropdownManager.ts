// composables/dropdownManager.ts @preserve

// A Vue composable that manages multiple dropdown menus by tracking their open states,
// handling global click events to close dropdowns when clicking outside, and supporting
// nested dropdowns by closing only unrelated dropdowns when a new one is opened.

import { ref } from "vue";
import { logManagerAction, logGlobalEvent } from "@/utils/loggers";

// Define the structure of a dropdown object
export interface Dropdown {
  id: symbol;
  dropdownContent: HTMLElement | null; // Allow null to reflect reality
  button: HTMLElement;
  close: () => void;
  isSubmenu: boolean;
}

// Reactive array to track open dropdowns
const openDropdowns = ref<Dropdown[]>([]);
let submenuCloseTimer: number | null = null;

// Flag to ensure the global listener is added only once
let isListenerAdded: boolean = false;

// Cancels any pending submenu closure timer.
const cancelSubmenuClosure = (): void => {
  if (submenuCloseTimer) {
    logManagerAction("dropdownManager", "Canceling pending submenu closure.");
    clearTimeout(submenuCloseTimer);
    submenuCloseTimer = null;
  }
};

/**
 * Closes all open dropdowns.
 * @param reason - A string describing why the dropdowns are being closed.
 */
const closeAllDropdowns = (reason?: string): void => {
  if (openDropdowns.value.length > 0) {
    const reasonMsg = reason ? `Reason: ${reason}` : "No reason specified.";
    logManagerAction("dropdownManager", `Closing all dropdowns explicitly. ${reasonMsg}`);
    openDropdowns.value.forEach((dropdown) => dropdown.close());
  }
  // ALWAYS cancel any pending submenu closure timer when closing all dropdowns.
  cancelSubmenuClosure();
};

// Handle global clicks to close dropdowns if the click is outside any dropdown content
const handleGlobalClickOutside = (event: MouseEvent): void => {
  // Ignore right-clicks, as they are used to open context menus.
  if (event.button !== 0) {
    return;
  }

  logGlobalEvent("dropdownManager", "Global click detected. Target:", event.target);

  const target = event.target as HTMLElement;

  // If the click is inside a modal, don't close the dropdowns.
  if (target.closest(".modal-dialog")) {
    logGlobalEvent("dropdownManager", "Click is inside a modal. No action taken.");
    return;
  }

  // Check if the click was inside the content of any open dropdown OR on its controlling button.
  const isClickInsideSomethingManaged: boolean = openDropdowns.value.some(
    (dropdown) =>
      (dropdown.dropdownContent && dropdown.dropdownContent.contains(target)) || dropdown.button.contains(target)
  );

  // If the click is on a file row, let JobArea handle it.
  const isClickOnFileRow = target.closest(".file-row");

  if (isClickInsideSomethingManaged) {
    logGlobalEvent("dropdownManager", "Click is inside a managed dropdown/button. No action taken.");
    // Do nothing, the click is handled by the dropdown itself.
  } else if (isClickOnFileRow) {
    logGlobalEvent("dropdownManager", "Click is on a file row. Ignoring to allow selection.");
    // Do nothing, let the JobArea's mousedown handler manage the selection.
  } else {
    // When closing from a global click, we do NOT want to ignore the next click.
    closeAllDropdowns("Global click outside");
  }
};

// Handle Escape key press to close all dropdowns
const handleEscapeKey = (event: KeyboardEvent): void => {
  if (event.key === "Escape") {
    logGlobalEvent("dropdownManager", "Escape key pressed. Closing all dropdowns.");
    closeAllDropdowns("Escape key pressed");
  }
};

// Set up the global click listener to handle clicks outside dropdowns
const setupGlobalListener = (): void => {
  if (!isListenerAdded) {
    document.addEventListener("click", handleGlobalClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    isListenerAdded = true;
  }
};

// Export the composable function for use in components
export function useDropdownManager() {
  // Ensure the global listener is set up
  setupGlobalListener();
  return {
    // Expose the reactive array of open dropdowns
    openDropdowns,
    // Function to register a new dropdown when it opens
    registerDropdown: (dropdown: Dropdown): void => {
      openDropdowns.value.push(dropdown);
      logManagerAction("dropdownManager", `Registered dropdown. Total open: ${openDropdowns.value.length}`);
    },
    // Function to unregister a dropdown when it closes
    unregisterDropdown: (id: symbol): void => {
      const initialLength = openDropdowns.value.length;
      openDropdowns.value = openDropdowns.value.filter((d) => d.id !== id);
      if (openDropdowns.value.length < initialLength) {
        logManagerAction("dropdownManager", `Unregistered dropdown. Total open: ${openDropdowns.value.length}`);
      }
    },
    // Function to close all dropdowns except the current one and its ancestors
    closeUnrelatedDropdowns: (currentDropdown: Dropdown): void => {
      const ancestorIds = new Set<symbol>();
      let currentButton: HTMLElement | null = currentDropdown.button;

      // Traverse up the DOM to find ancestor dropdowns
      while (currentButton) {
        const parentContent: HTMLElement | null = currentButton.closest<HTMLElement>(".dropdown-content");
        if (!parentContent) break;

        const parentDropdown: Dropdown | undefined = openDropdowns.value.find((d) => d.dropdownContent === parentContent);

        if (parentDropdown) {
          ancestorIds.add(parentDropdown.id);
          // Continue search from the parent's button
          currentButton = parentDropdown.button;
        } else {
          // Stop if a parent dropdown in the DOM is not in our tracked list
          break;
        }
      }

      openDropdowns.value.forEach((dropdown) => {
        if (dropdown.id !== currentDropdown.id && !ancestorIds.has(dropdown.id)) {
          dropdown.close();
        }
      });
    },
    // Schedules the closure of any open submenus after a delay.
    scheduleSubmenuClosure: (): void => {
      if (submenuCloseTimer) clearTimeout(submenuCloseTimer);
      submenuCloseTimer = window.setTimeout(() => {
        logManagerAction("dropdownManager", "Timer fired, closing all submenus.");
        openDropdowns.value.forEach((dropdown) => {
          if (dropdown.isSubmenu) {
            dropdown.close();
          }
        });
        submenuCloseTimer = null;
      }, 1000); // 1-second delay
    },
    // Cancels any pending submenu closure.
    cancelSubmenuClosure,
    closeAllDropdowns,
  };
}
