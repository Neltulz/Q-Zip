// plugins/flashDirective.ts @preserve
/* * @preserve
 * Flash on Click Directive
 * Description:
 * Adds a 'flashing' class on mousedown and removes it on mouseup or mouseout.
 * This version now includes logging for the global mouseup event to help
 * debug drag-and-drop release issues.
 *
 * Example:
 * <button v-flash-on-click class="button">Click Me</button>
 */

import { defineNuxtPlugin } from "nuxt/app";
import type { NuxtApp } from "nuxt/app";

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
      let isMouseDown: boolean = false;

      const onMouseDown = (event: MouseEvent) => {
        event.stopPropagation();
        isMouseDown = true;
        flashEl.classList.add("flashing");
      };

      const onMouseUp = (_event: MouseEvent) => {
        // REMOVED: Global log on every mouseup event.
        // Logging is now handled by individual components like CustomButton.
        isMouseDown = false;
        flashEl.classList.remove("flashing");
      };

      const onMouseOver = (_event: MouseEvent) => {
        if (isMouseDown) {
          flashEl.classList.add("flashing");
        }
      };

      const onMouseOut = (_event: MouseEvent) => {
        if (isMouseDown) {
          flashEl.classList.remove("flashing");
        }
      };

      flashEl.addEventListener("mousedown", onMouseDown);
      document.addEventListener("mouseup", onMouseUp);
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
