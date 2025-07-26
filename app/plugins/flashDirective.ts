// plugins/flashDirective.ts @preserve
/* * @preserve
 * Flash on Click Directive
 * Description:
 * Adds a 'flashing' class on mousedown and removes it on mouseup or mouseout.
 * This version now includes logging for button presses and releases, and
 * is aware of active drag-and-drop operations to prevent interference.
 * The global mouseup listener now checks if the mousedown originated on the element
 * before logging and acting, preventing console flooding.
 *
 * Example:
 * <button v-flash-on-click class="button">Click Me</button>
 */

import { defineNuxtPlugin } from "nuxt/app";
import type { NuxtApp } from "nuxt/app";
import { useDragDropStore } from "@/stores/dragDropStore"; // Import the drag/drop store
import { logButtonPress, logButtonRelease } from "@/utils/loggers"; // Import loggers

// Define a custom interface to extend HTMLElement with our property
interface FlashElement extends HTMLElement {
  _flashOnClickHandlers?: {
    onMouseDown: (event: MouseEvent) => void;
    onMouseUp: (event: MouseEvent) => void;
    onMouseOver: (event: MouseEvent) => void;
    onMouseOut: (event: MouseEvent) => void;
  };
}

export default defineNuxtPlugin((nuxtApp: NuxtApp) => {
  nuxtApp.vueApp.directive("flash-on-click", {
    mounted(el: HTMLElement) {
      // Cast el to FlashElement once for type safety and clarity
      const flashEl = el as FlashElement;
      let isMouseDown = false;
      const dragDropStore = useDragDropStore(); // Get the store instance

      const onMouseDown = (event: MouseEvent) => {
        // Log button press before any checks, as it's a direct interaction
        const buttonName: string = flashEl.getAttribute("data-name") || "Unnamed Button";
        logButtonPress("FlashDirective", `PRESS: "${buttonName}"`);

        // If an internal drag is active, prevent flashing and propagation
        if (dragDropStore.isInternalDragActive) {
          event.preventDefault(); // Prevent default button behavior (e.g., focus)
          event.stopPropagation(); // Stop propagation to prevent parent elements from reacting
          return;
        }

        event.stopPropagation();
        isMouseDown = true;
        flashEl.classList.add("flashing");
      };

      const onMouseUp = (event: MouseEvent) => {
        // FIX: Only log and act if the mouse was initially pressed on this specific element.
        // This prevents every button's mouseup listener from firing on a single global mouseup event.
        if (isMouseDown) {
          const buttonName: string = flashEl.getAttribute("data-name") || "Unnamed Button";
          logButtonRelease("FlashDirective", `RELEASE: "${buttonName}"`);

          // If an internal drag is active, prevent default behaviors but still reset the state.
          if (dragDropStore.isInternalDragActive) {
            event.preventDefault();
            event.stopPropagation();
          }

          isMouseDown = false;
          flashEl.classList.remove("flashing");
        }
      };

      const onMouseOver = (_event: MouseEvent) => {
        // If an internal drag is active, do not apply hover effects
        if (dragDropStore.isInternalDragActive) return;
        if (isMouseDown) {
          flashEl.classList.add("flashing");
        }
      };

      const onMouseOut = (_event: MouseEvent) => {
        // If an internal drag is active, do not remove hover effects (they weren't applied)
        if (dragDropStore.isInternalDragActive) return;
        if (isMouseDown) {
          flashEl.classList.remove("flashing");
        }
      };

      flashEl.addEventListener("mousedown", onMouseDown);
      document.addEventListener("mouseup", onMouseUp); // Global mouseup to catch releases outside the button
      flashEl.addEventListener("mouseover", onMouseOver);
      flashEl.addEventListener("mouseout", onMouseOut);

      // Store handlers for cleanup with proper typing
      flashEl._flashOnClickHandlers = {
        onMouseDown,
        onMouseUp,
        onMouseOver,
        onMouseOut,
      };
    },
    unmounted(el: HTMLElement) {
      // Cast el to FlashElement once
      const flashEl = el as FlashElement;
      const handlers = flashEl._flashOnClickHandlers;
      if (handlers) {
        flashEl.removeEventListener("mousedown", handlers.onMouseDown);
        document.removeEventListener("mouseup", handlers.onMouseUp);
        flashEl.removeEventListener("mouseover", handlers.onMouseOver);
        flashEl.removeEventListener("mouseout", handlers.onMouseOut);
        delete flashEl._flashOnClickHandlers;
      }
    },
  });
});
