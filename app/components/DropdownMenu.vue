<!-- #region top-comments -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/DropdownMenu.vue @preserve -->
<!--
  Description:

  A reusable dropdown menu component that can be triggered by a
  button click or programmatically (e.g., for a context menu).
  It supports nested submenus, dynamic positioning to stay
  within the viewport, and is managed by a global dropdown manager.
  To prevent layout shifts from slow-loading content like icons,
  the dropdown's content is kept hidden until the browser has finished
  rendering, at which point it fades into view.
  It also prevents the default system context menu from appearing
  when right-clicking anywhere on the dropdown's content area.

  When used as a context menu, the trigger button is hidden, and
  the menu is opened via an exposed `openDropdown` method,
  positioning itself at the provided coordinates.
-->
<!-- #endregion -->

<!-- #region template -->
<template>
  <div
    ref="dropdownMenuRef"
    class="dropdown-menu"
    data-component-name="DropdownMenu"
    :class="{ active: isOpen }"
    :data-dropdown-name="props.dropdownDataName"
  >
    <template v-if="!props.hideTrigger">
      <CustomButton
        :btn-theme="props.btnTheme"
        :class="{ active: isOpen }"
        :button-style-class="customButtonStyles"
        :data-name="'options-btn-for-' + props.dropdownDataName"
        :disabled="props.disabled"
        :first-icon-name="props.firstIconName"
        :first-icon-size="props.firstIconSize"
        :last-icon-name="props.lastIconName"
        :last-icon-size="props.lastIconSize"
        @click.stop="handleButtonClick"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <slot name="button-content" />
      </CustomButton>
    </template>

    <teleport to="body">
      <!--
        FIX: Replaced `v-if` with `v-show`.
        `v-if` was destroying the component (and its children) on close, causing icons to reload.
        `v-show` keeps the component in the DOM and simply toggles its `display` style,
        preserving the state of the child components and preventing the icon flicker.
        A `v-if="hasSlotContent"` wrapper is added to avoid rendering an empty div if there's no slot content.
      -->
      <template v-if="hasSlotContent">
        <div
          v-show="isOpen"
          ref="dropdownContent"
          class="dropdown-content"
          :class="[transitionClass, { 'content-ready': isContentLoaded }]"
          :style="dropdownContentStyle"
          :data-belongs-to="props.dropdownDataName"
          @contextmenu.prevent
          @mouseenter="handleContentMouseEnter"
          @mouseleave="handleContentMouseLeave"
        >
          <slot :close="closeDropdown" />
        </div>
      </template>
    </teleport>
  </div>
</template>
<!-- #endregion -->

<!-- #region script -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useSlots,
  watch,
  type CSSProperties,
  type PropType,
  type Ref,
} from "vue";
import { useDropdownManager, type Dropdown } from "@/composables/dropdownManager";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logInteraction, logTrace } from "@/utils/loggers";

type Placement =
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end";

type BtnTheme = "default" | "lite" | "liter" | "dark" | "darkr" | "primary" | "danger" | "warning" | "info";

const props = defineProps({
  btnTheme: {
    type: String as PropType<BtnTheme>,
    default: "default",
  },
  buttonStyleClass: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  dropdownDataName: {
    type: String,
    required: true,
  },
  firstIconName: {
    type: String,
    default: "",
  },
  firstIconSize: {
    type: [String, Number],
    default: undefined,
  },
  hideTrigger: {
    type: Boolean,
    default: false,
  },
  isSubmenu: {
    type: Boolean,
    default: false,
  },
  lastIconName: {
    type: String,
    default: "mdi:dots-vertical",
  },
  lastIconSize: {
    type: [String, Number],
    default: undefined,
  },
  placement: {
    type: String as PropType<Placement>,
    default: "bottom-start",
  },
});

// Use a Set to ensure class names are unique.
const customButtonStyles = computed(() => {
  // Split the incoming classes from the prop string into an array.
  const classes = new Set(props.buttonStyleClass ? props.buttonStyleClass.split(" ") : []);

  // Add the 'options-btn' class. The Set will automatically prevent duplicates.
  classes.add("options-btn");

  // Join the unique classes back into a single string.
  return Array.from(classes).filter(Boolean).join(" ");
});

const slots = useSlots();
const hasSlotContent: boolean = !!slots.default;

const isOpen: Ref<boolean> = ref(false);
const isContentLoaded: Ref<boolean> = ref(false);
const dropdownContent: Ref<HTMLElement | null> = ref(null);
const dropdownId: symbol = Symbol("dropdown");
const openTimeoutId: Ref<number | null> = ref(null);
const dropdownMenuRef = ref<HTMLDivElement | null>(null);

const actualPlacement: Ref<Placement> = ref(props.placement);
const dropdownTop: Ref<string> = ref("-9999px");
const dropdownLeft: Ref<string> = ref("-9999px");
const contextMenuCoords = ref<{ x: number; y: number } | null>(null);

const dropdownContentStyle = computed(
  (): CSSProperties => ({
    top: dropdownTop.value,
    left: dropdownLeft.value,
  })
);

const transitionClass = computed((): string => {
  const [direction] = actualPlacement.value.split("-");
  return `placement-${direction}`; // e.g., 'placement-top'
});

const adjustDropdownPosition = async (): Promise<void> => {
  await nextTick();

  const dropdownEl = dropdownContent.value;
  if (!dropdownEl) return;

  let anchorRect: DOMRect;
  const isContextMenu = contextMenuCoords.value !== null;

  if (isContextMenu) {
    // For context menus, the anchor is the cursor position.
    const { x, y } = contextMenuCoords.value!;
    anchorRect = new DOMRect(x, y, 0, 0);
  } else {
    // For regular dropdowns, the anchor is the button.
    const buttonEl = document.querySelector(`[data-name='options-btn-for-${props.dropdownDataName}']`);
    const anchorEl = buttonEl?.querySelector(".visual-style");
    if (!buttonEl || !anchorEl) return;
    anchorRect = anchorEl.getBoundingClientRect();
  }

  const dropdownRect = dropdownEl.getBoundingClientRect();
  const viewHeight = window.innerHeight;
  const viewWidth = window.innerWidth;
  const margin = 8; // Keep for collision detection
  const gap = 2; // 2px gap between button and dropdown content

  // Get the computed padding from the dropdown content element
  const computedDropdownStyle: CSSStyleDeclaration = getComputedStyle(dropdownEl);
  const dropdownPaddingPx: number = parseFloat(computedDropdownStyle.getPropertyValue("--dropdown-pad") || "0");
  // Get the computed border width from the dropdown content element
  const dropdownBorderWidthPx: number = parseFloat(computedDropdownStyle.getPropertyValue("--dropdown-border-width") || "0");

  let visualStyleInsetPx = 0;
  if (!isContextMenu) {
    const buttonEl = document.querySelector(`[data-name='options-btn-for-${props.dropdownDataName}']`);
    if (buttonEl) {
      const computedButtonStyle: CSSStyleDeclaration = getComputedStyle(buttonEl);
      const visualStyleInset: string = computedButtonStyle.getPropertyValue("--visual-style-inset");
      visualStyleInsetPx = parseFloat(visualStyleInset);
    }
  }

  if (DEBUG && debugConfig.logDropdownEvents) {
    logTrace("DropdownMenu", `Adjusting position for "${props.dropdownDataName}"`);
  }

  let [primary, secondary] = (isContextMenu ? "bottom-start" : props.placement).split("-") as [string, string];

  // Adjust primary placement (block axis for top/bottom, inline for left/right)
  if (primary === "bottom" && anchorRect.bottom + dropdownRect.height + margin > viewHeight) {
    primary = "top";
  } else if (primary === "top" && anchorRect.top - dropdownRect.height - margin < 0) {
    primary = "bottom";
  } else if (primary === "right" && anchorRect.right + dropdownRect.width + margin > viewWidth) {
    primary = "left";
  } else if (primary === "left" && anchorRect.left - dropdownRect.width - margin < 0) {
    primary = "right";
  }

  // Adjust secondary placement (alignment)
  if (primary === "top" || primary === "bottom") {
    // Horizontal alignment check
    if (secondary === "start" && anchorRect.left + dropdownRect.width + margin > viewWidth) {
      secondary = "end";
    } else if (secondary === "end" && anchorRect.right - dropdownRect.width - margin < 0) {
      secondary = "start";
    }
  } else {
    // Vertical alignment check
    if (secondary === "start" && anchorRect.top + dropdownRect.height + margin > viewHeight) {
      secondary = "end";
    } else if (secondary === "end" && anchorRect.bottom - dropdownRect.height - margin < 0) {
      secondary = "start";
    }
  }

  const newPlacement = `${primary}-${secondary}` as Placement;
  actualPlacement.value = newPlacement;

  let top = 0;
  let left = 0;
  const { top: anchorTop, bottom: anchorBottom, left: anchorLeft, right: anchorRight } = anchorRect;
  const { width: ddWidth, height: ddHeight } = dropdownRect;

  switch (newPlacement) {
    case "top-start":
      top = anchorTop - ddHeight - gap;
      left = anchorLeft;
      break;
    case "top-end":
      top = anchorTop - ddHeight - gap;
      left = anchorRight - ddWidth;
      break;
    case "bottom-end":
      top = anchorBottom + gap;
      left = anchorRight - ddWidth;
      break;
    case "left-start":
      top = anchorTop;
      left = anchorLeft - ddWidth - gap;
      break;
    case "left-end":
      top = anchorBottom - ddHeight;
      left = anchorLeft - ddWidth - gap;
      break;
    case "right-start":
      top = anchorTop;
      left = anchorRight + gap;
      break;
    case "right-end":
      top = anchorBottom - ddHeight;
      left = anchorRight + gap;
      break;
    case "bottom-start":
    default:
      top = anchorBottom + gap;
      left = anchorLeft;
      break;
  }

  // Apply negative vertical offset for submenus based on the dropdown padding
  // AND the visual-style-inset of the button, AND the dropdown border width.
  if (props.isSubmenu && !isContextMenu) {
    if (newPlacement.startsWith("left") || newPlacement.startsWith("right")) {
      top -= dropdownPaddingPx + visualStyleInsetPx + dropdownBorderWidthPx;
    }
  }

  dropdownTop.value = `${top}px`;
  dropdownLeft.value = `${left}px`;
};

const {
  openDropdowns,
  registerDropdown,
  unregisterDropdown,
  closeUnrelatedDropdowns,
  cancelSubmenuClosure,
  scheduleSubmenuClosure,
  closeAllDropdowns,
} = useDropdownManager();

const openDropdown = async (coords?: { x: number; y: number }): Promise<void> => {
  const isContextMenuCall = !!coords;

  // For regular button clicks, if it's already open, do nothing.
  if (isOpen.value && !isContextMenuCall) {
    return;
  }

  // If a context menu is already open and we get another context menu click,
  // or if a regular dropdown is open and we get a context menu click,
  // we need to close everything first before reopening at the new coordinates.
  if (isOpen.value) {
    isOpen.value = false;
    await nextTick(); // Let Vue process the closure and run watchers.
  }

  // If this is a context menu call, ensure all other dropdowns are also closed.
  // This is slightly redundant if the above block ran, but it's a safe catch-all.
  if (isContextMenuCall) {
    closeAllDropdowns("Opening new context menu");
    await nextTick();
  }

  // Now, proceed with opening.
  if (debugConfig.logDropdownEvents) logInteraction("DropdownMenu", `Opening "${props.dropdownDataName}"`);
  isOpen.value = true;
  isContentLoaded.value = false; // Content is not ready yet
  contextMenuCoords.value = coords || null;

  await nextTick(); // Wait for the dropdown content to be rendered in the DOM

  // For context menus, we need a dummy button element for the manager.
  // The dropdownMenuRef itself can serve this purpose.
  const buttonEl = props.hideTrigger
    ? dropdownMenuRef.value
    : (document.querySelector(`[data-name="options-btn-for-${props.dropdownDataName}"]`) as HTMLElement | null);

  if (!buttonEl) {
    if (debugConfig.logDropdownEvents) console.error(`Could not find button element.`);
    return;
  }

  const dropdown: Dropdown = {
    id: dropdownId,
    dropdownContent: dropdownContent.value,
    button: buttonEl,
    close: closeDropdown,
    isSubmenu: props.isSubmenu,
  };
  registerDropdown(dropdown);

  // Only close unrelated dropdowns for non-context menus.
  // Context menus should close everything, which is handled above.
  if (!isContextMenuCall) {
    closeUnrelatedDropdowns(dropdown);
  }

  // Wait for content (e.g., icons) to fully render, then position and show.
  // Using two animation frames is a reliable heuristic to wait for the browser's paint cycle.
  requestAnimationFrame(() => {
    requestAnimationFrame(async () => {
      await adjustDropdownPosition(); // Calculate position now that content size is stable
      isContentLoaded.value = true; // Make the content visible with a fade-in
      if (debugConfig.logDropdownEvents) logInteraction("DropdownMenu", `Content is ready for "${props.dropdownDataName}"`);
    });
  });
};

const closeDropdown = (): void => {
  if (!isOpen.value) return;
  if (debugConfig.logDropdownEvents) logInteraction("DropdownMenu", `Closing "${props.dropdownDataName}"`);

  if (openTimeoutId.value) {
    clearTimeout(openTimeoutId.value);
    openTimeoutId.value = null;
  }

  isOpen.value = false;
  isContentLoaded.value = false; // Reset content loaded state
  contextMenuCoords.value = null; // Reset context menu state
};

const handleButtonClick = async (_event: MouseEvent): Promise<void> => {
  if (props.disabled || !hasSlotContent) return;

  cancelSubmenuClosure();
  if (openTimeoutId.value) {
    clearTimeout(openTimeoutId.value);
    openTimeoutId.value = null;
  }

  if (isOpen.value) {
    if (props.isSubmenu) {
      return;
    }
    closeDropdown();
  } else {
    await openDropdown();
  }
};

const handleMouseEnter = (): void => {
  cancelSubmenuClosure();

  // Handle submenus with a delay (existing logic)
  if (props.isSubmenu) {
    if (openTimeoutId.value) clearTimeout(openTimeoutId.value);
    openTimeoutId.value = window.setTimeout(() => {
      if (!isOpen.value) openDropdown();
    }, 500);
    return;
  }

  // If this dropdown is already open, do nothing.
  if (isOpen.value) {
    return;
  }

  const thisDropdownEl = dropdownMenuRef.value;
  if (!thisDropdownEl) return;

  // Check if any currently open dropdown is an immediate sibling.
  const openSiblingExists = openDropdowns.value.some((openDropdown) => {
    // We only care about other top-level dropdowns.
    if (openDropdown.isSubmenu) return false;

    // Find the root element of the already-open dropdown.
    const openDropdownRootEl = openDropdown.button.closest(".dropdown-menu");
    if (!openDropdownRootEl || openDropdownRootEl === thisDropdownEl) {
      return false;
    }

    // Check for immediate sibling relationship in the same parent.
    return (
      thisDropdownEl.parentElement === openDropdownRootEl.parentElement &&
      (thisDropdownEl.previousElementSibling === openDropdownRootEl || thisDropdownEl.nextElementSibling === openDropdownRootEl)
    );
  });

  // If an open sibling is found, open this dropdown.
  if (openSiblingExists) {
    openDropdown();
  }
};

const handleMouseLeave = (): void => {
  if (props.isSubmenu) {
    if (openTimeoutId.value) clearTimeout(openTimeoutId.value);
    scheduleSubmenuClosure();
  }
};

const handleContentMouseEnter = (): void => {
  cancelSubmenuClosure();
};

const handleContentMouseLeave = (): void => {
  // This should only trigger for actual submenus, not the main context menu.
  if (props.isSubmenu) {
    scheduleSubmenuClosure();
  }
};

watch(isOpen, (newIsOpen: boolean): void => {
  if (debugConfig.logDropdownEvents)
    logInteraction("DropdownMenu", `Visibility changed for "${props.dropdownDataName}" to ${newIsOpen}`);
  if (newIsOpen) {
    adjustDropdownPosition();
    window.addEventListener("resize", adjustDropdownPosition);
  } else {
    window.removeEventListener("resize", adjustDropdownPosition);
    unregisterDropdown(dropdownId);
  }
});

onMounted((): void => {
  // Removed logging to reduce console noise
});

onUnmounted((): void => {
  window.removeEventListener("resize", adjustDropdownPosition);

  if (openTimeoutId.value) clearTimeout(openTimeoutId.value);

  if (isOpen.value) unregisterDropdown(dropdownId);
});

defineExpose({ openDropdown, closeDropdown });
</script>
<!-- #endregion -->

<!-- #region style scoped -->
<style scoped>
.dropdown-menu {
  display: flex;
  position: relative;

  &.active {
    z-index: 1000;
  }

  &:empty {
    /*
     * Hides the empty dropdown wrapper to prevent layout issues, such as
     * unwanted grid gaps. This is critical in two main scenarios:
     *
     * 1. When the dropdown has no items to display.
     * 2. When its content is teleported elsewhere in the DOM.
     *
     * Example: In JobSelectorArea.vue, when files are dragged over a
     * job button, a DropdownMenu appears. Its content (the "Copy" or
     * "Move" options) is teleported to the body. This rule hides the
     * now-empty original wrapper, preventing it from breaking the
     * button's layout.
     */
    display: none;
  }

  .custom-button {
    min-height: var(--min-tch-tgt);
    min-width: var(--min-tch-tgt);
  }
}
</style>
<!-- #endregion -->

<!-- #region style -->
<style>
/* These styles must be global because the dropdown content is teleported to `body`. */
.dropdown-content {
  --dropdown-pad: 2px;
  --dropdown-border-width: 1px;
  position: fixed;
  z-index: 100001;

  backdrop-filter: blur(10px);
  background: hsla(0, 0%, calc(var(--bg-lum) * 2), 0.75);
  border: var(--dropdown-border-width) solid var(--brdr-clr-liter);
  border-radius: var(--brdr-rad-smal);
  box-shadow: 0 5px 10px hsla(0, 0%, 0%, 0.75);
  display: grid;
  inline-size: max-content;
  justify-content: stretch;
  margin-block-start: 0;
  min-height: var(--min-tch-tgt);
  min-width: 200px;
  opacity: 0; /* Initially hidden */
  padding: var(--dropdown-pad);
  pointer-events: none; /* Initially non-interactive */
  transition: opacity 150ms ease-in-out;

  > hr {
    background-color: var(--brdr-clr-liter);
    border: 0;
    block-size: 1px;
    display: block;
    margin-inline: calc(var(--dropdown-pad) * -1);
    margin-block: 2px;
  }

  > hr:first-child,
  > hr:last-child {
    display: none;
  }

  > .custom-button > .visual-style,
  > .dropdown-menu > .custom-button > .visual-style {
    box-shadow: none;
  }

  > .custom-button.can-become-active,
  > .dropdown-menu > .custom-button.can-become-active {
    --line-orientation: vertical;
    --line-position: start;
  }
}

/*
  This class is added after the content has rendered and the dropdown
  has been positioned, triggering the fade-in transition.
*/
.dropdown-content.content-ready {
  opacity: 1;
  pointer-events: all;
}
</style>
<!-- #endregion -->
