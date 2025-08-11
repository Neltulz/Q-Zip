// composables/dropdownManager.ts @preserve

// A Vue composable that manages multiple dropdown menus by tracking their open states,
// handling global click events to close dropdowns when clicking outside, and supporting
// nested dropdowns by closing only unrelated dropdowns when a new one is opened.

import { ref, watch, onBeforeUnmount, watchEffect } from "vue";
import { logManagerAction, logGlobalEvent, logWarning } from "@/utils/loggers";

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

// Overlay element that blocks hover/clicks under dropdowns while a dropdown is open
let overlayEl: HTMLElement | null = null;
// Health check timer id for overlay (periodically ensure overlay visibility matches openDropdowns)
let overlayHealthCheckTimer: number | null = null;
let overlayUpdateTimer: number | null = null;

const ensureOverlay = () => {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.setAttribute("data-component", "dropdown-overlay");
  // Position under dropdown content (dropdown content uses z-index:100001)
  overlayEl.style.position = "fixed";
  overlayEl.style.inset = "0";
  // Place overlay above most UI but beneath modals (modal uses z-index:99999)
  // and beneath teleported dropdown content (dropdown content uses z-index:100001)
  overlayEl.style.zIndex = "99998";
  // Start hidden (transparent + no pointer events). We'll toggle visibility
  // via opacity so the fade runs consistently for every dropdown instance.
  overlayEl.style.background = "hsla(0, 0%, 0%, 0)";
  overlayEl.style.opacity = "0";
  overlayEl.style.transition = "opacity 180ms cubic-bezier(0.2, 0, 0, 1), background 180ms linear";
  overlayEl.style.pointerEvents = "none"; // only capture when visible
  overlayEl.style.userSelect = "none";
  // mark as not visible initially for easier debugging
  overlayEl.setAttribute("data-overlay-visible", "false");
  overlayEl.addEventListener("click", (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    logManagerAction("dropdownManager", "Overlay clicked - closing all dropdowns");
    closeAllDropdowns("Overlay clicked");
  });
  logManagerAction("dropdownManager", "Created dropdown overlay element (conditional)");
  return overlayEl;
};

const showOverlay = () => {
  logManagerAction("dropdownManager", "showOverlay called");
  try {
    // Don't show overlay if a modal is open
    if (document.querySelector(".modal-wrapper.modal-open")) {
      logManagerAction("dropdownManager", "Modal is open, not showing dropdown overlay");
      return;
    }

    const el = ensureOverlay();
    // Add to DOM only when needed
    if (!document.body.contains(el)) {
      document.body.appendChild(el);
      logManagerAction("dropdownManager", "Overlay added to DOM");
    }
    // If already visible, noop to avoid noisy duplicate logs/DOM updates
    if (el.getAttribute("data-overlay-visible") === "true") return;

    // Make it visible with a smooth fade and enable pointer capture
    // Use RAF to ensure style changes are applied after insertion.
    requestAnimationFrame(() => {
      el.style.pointerEvents = "auto";
      el.style.background = "hsla(0, 0%, 0%, 0.18)";
      el.style.opacity = "1";
      el.setAttribute("data-overlay-visible", "true");
      logManagerAction("dropdownManager", "Overlay shown (visibility toggled on)");
    });
  } catch (e) {
    /* ignore */
  }
};

const hideOverlay = () => {
  // Avoid noisy repeated hide calls by only acting when overlay is visible
  try {
    if (!overlayEl) return;
    if (overlayEl.getAttribute("data-overlay-visible") === "false") return;
    logManagerAction("dropdownManager", "hideOverlay called");

    // Fade out and disable pointer capture
    overlayEl.style.pointerEvents = "none";
    overlayEl.style.opacity = "0";
    overlayEl.style.background = "hsla(0, 0%, 0%, 0)";
    overlayEl.setAttribute("data-overlay-visible", "false");
    logManagerAction("dropdownManager", "Overlay hidden (visibility toggled off)");

    // Remove from DOM after fade animation completes
    setTimeout(() => {
      if (overlayEl && overlayEl.parentElement && overlayEl.getAttribute("data-overlay-visible") === "false") {
        overlayEl.parentElement.removeChild(overlayEl);
        overlayEl = null;
        logManagerAction("dropdownManager", "Overlay removed from DOM");
      }
    }, 180); // Match the CSS transition duration
  } catch (e) {
    /* ignore */
  }
};

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
  // Start hiding the overlay immediately so it can fade out concurrently
  // with dropdown close animations.
  try {
    hideOverlay();
  } catch (e) {
    /* ignore */
  }

  if (openDropdowns.value.length > 0) {
    const reasonMsg = reason ? `Reason: ${reason}` : "No reason specified.";
    logManagerAction("dropdownManager", `Closing all dropdowns explicitly. ${reasonMsg}`);

    // Check if any of the dropdowns being closed are drag action dropdowns
    const hasDragActionDropdown = openDropdowns.value.some((dropdown) => {
      const dropdownName = dropdown.dropdownContent?.getAttribute('data-belongs-to');
      return dropdownName && (dropdownName.startsWith('drag-action-job-') || dropdownName === 'drag-action-new-job');
    });

    openDropdowns.value.forEach((dropdown) => dropdown.close());

    // If we closed a drag action dropdown, also end the drag operation
    if (hasDragActionDropdown) {
      try {
        // Dynamically import the drag drop store to avoid circular dependencies
        import("@/stores/dragDropStore").then(({ useDragDropStore }) => {
          const dragDropStore = useDragDropStore();
          if (dragDropStore.isInternalDragActive) {
            logManagerAction("dropdownManager", "Drag action dropdown closed, ending drag operation");
            dragDropStore.endInternalDrag();
          }
        }).catch((e) => {
          logWarning("dropdownManager", `Error ending drag operation: ${e}`);
        });
      } catch (e) {
        logWarning("dropdownManager", `Error ending drag operation: ${e}`);
      }
    }
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
  // Check both modal-dialog and modal-wrapper to handle backdrop clicks properly
  if (target.closest(".modal-dialog") || target.closest(".modal-wrapper")) {
    logGlobalEvent("dropdownManager", "Click is inside a modal. No action taken.");
    return;
  }

  // Check if the click was inside the content of any open dropdown OR on its controlling button.
  const closestDropdownContent = target.closest('.dropdown-content') as HTMLElement | null;
  const isClickInsideSomethingManaged: boolean = openDropdowns.value.some((dropdown) => {
    const inContent = !!dropdown.dropdownContent && (dropdown.dropdownContent.contains(target) || dropdown.dropdownContent === closestDropdownContent);
    const onButton = dropdown.button && dropdown.button.contains(target);
    if (DEBUG && debugConfig.logDropdownEvents) {
      logTrace('dropdownManager', `Checking dropdown: ${dropdown.button.getAttribute('data-name') || 'btn'} -> inContent:${inContent} onButton:${onButton}`);
    }
    return inContent || onButton;
  });

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
    try {
      // Also ensure overlay is hidden even if no dropdowns remain registered
      if (overlayEl && overlayEl.getAttribute('data-overlay-visible') === 'true') {
        hideOverlay();
      }
    } catch (e) {
      /* ignore */
    }
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

  // Watch for modal state changes and hide overlay when modals open
  watchEffect(() => {
    const modalOpen = !!document.querySelector(".modal-wrapper.modal-open");
    if (modalOpen && overlayEl && overlayEl.getAttribute("data-overlay-visible") === "true") {
      logManagerAction("dropdownManager", "Modal opened, hiding dropdown overlay");
      hideOverlay();
    }
  });

  // Watch openDropdowns to show/hide the overlay element when any dropdowns are open
  // Use a debounced watcher to coalesce rapid register/unregister calls (submenus often
  // register/unregister quickly when hovering). This prevents races that left the overlay
  // visible after all dropdowns closed.
  watch(
    openDropdowns,
    (val) => {
      if (overlayUpdateTimer != null) clearTimeout(overlayUpdateTimer);
      overlayUpdateTimer = window.setTimeout(() => {
        try {
          if (openDropdowns.value && openDropdowns.value.length > 0) showOverlay();
          else hideOverlay();
        } catch (e) {
          /* ignore */
        }
        overlayUpdateTimer = null;
      }, 120); // short debounce to smooth submenu transitions
    },
    { deep: true }
  );

  // Start a health-check timer to ensure overlay isn't left visible when no dropdowns are open.
  // Runs every 5s and will hide the overlay if there are no open dropdowns.
  if (overlayHealthCheckTimer == null) {
    overlayHealthCheckTimer = window.setInterval(() => {
      try {
        if (overlayEl && overlayEl.getAttribute('data-overlay-visible') === 'true' && openDropdowns.value.length === 0) {
          logManagerAction('dropdownManager', 'Health-check: overlay visible but no open dropdowns — hiding overlay');
          hideOverlay();
        }
      } catch (e) {
        /* ignore */
      }
    }, 5000);
  }

  // Clean up overlay when module is unloaded (unlikely) or before unmount
  onBeforeUnmount(() => {
    hideOverlay();
    if (overlayHealthCheckTimer != null) {
      clearInterval(overlayHealthCheckTimer);
      overlayHealthCheckTimer = null;
    }
    if (isListenerAdded) {
      document.removeEventListener("click", handleGlobalClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      isListenerAdded = false;
    }
  });
  return {
    // Expose the reactive array of open dropdowns
    openDropdowns,
    // Function to register a new dropdown when it opens
    registerDropdown: (dropdown: Dropdown): void => {
      openDropdowns.value.push(dropdown);
      logManagerAction("dropdownManager", `Registered dropdown. Total open: ${openDropdowns.value.length}`);
      // Start the overlay fade-in immediately so it can animate concurrently
      // with the dropdown opening. We still use the debounced watcher for
      // hiding to avoid races when submenus rapidly unregister.
      try {
        showOverlay();
      } catch (e) {
        /* ignore */
      }
    },
    // Function to unregister a dropdown when it closes
    unregisterDropdown: (id: symbol): void => {
      const initialLength = openDropdowns.value.length;
      openDropdowns.value = openDropdowns.value.filter((d) => d.id !== id);
      if (openDropdowns.value.length < initialLength) {
        logManagerAction("dropdownManager", `Unregistered dropdown. Total open: ${openDropdowns.value.length}`);
        // Defer overlay visibility updates to the centralized watcher.
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
    // Close all dropdowns that are descendants of the dropdown with the given id.
    closeDescendantsOf: (parentId: symbol): void => {
      const parentDropdown = openDropdowns.value.find((d) => d.id === parentId);
      if (!parentDropdown) return;

      const isDescendant = (candidate: Dropdown): boolean => {
        let currentButton: HTMLElement | null = candidate.button;
        while (currentButton) {
          const parentContent: HTMLElement | null = currentButton.closest<HTMLElement>(".dropdown-content");
          if (!parentContent) break;
          const foundParent: Dropdown | undefined = openDropdowns.value.find((d) => d.dropdownContent === parentContent);
          if (foundParent) {
            if (foundParent.id === parentDropdown.id) return true;
            currentButton = foundParent.button;
          } else {
            break;
          }
        }
        return false;
      };

      openDropdowns.value.forEach((dropdown) => {
        if (dropdown.id !== parentDropdown.id && isDescendant(dropdown)) {
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
