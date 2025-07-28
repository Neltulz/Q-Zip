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
      <!-- --- FIX: The :class binding now checks isOpenedByClick --- -->
      <CustomButton
        :btn-theme="props.btnTheme"
        :class="{ active: isOpen && isOpenedByClick }"
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
import { computed, nextTick, onUnmounted, ref, useSlots, watch, type CSSProperties, type PropType, type Ref } from "vue";
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

const customButtonStyles = computed(() => {
  const classes = new Set(props.buttonStyleClass ? props.buttonStyleClass.split(" ") : []);
  classes.add("options-btn");
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

const isOpenedByClick: Ref<boolean> = ref(false);

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
  return `placement-${direction}`;
});

const adjustDropdownPosition = async (): Promise<void> => {
  await nextTick();
  const dropdownEl = dropdownContent.value;
  if (!dropdownEl) return;

  let anchorRect: DOMRect;
  const isContextMenu = contextMenuCoords.value !== null;

  if (isContextMenu) {
    const { x, y } = contextMenuCoords.value!;
    anchorRect = new DOMRect(x, y, 0, 0);
  } else {
    const buttonEl = document.querySelector(`[data-name='options-btn-for-${props.dropdownDataName}']`);
    const anchorEl = buttonEl?.querySelector(".visual-style");
    if (!buttonEl || !anchorEl) return;
    anchorRect = anchorEl.getBoundingClientRect();
  }

  const dropdownRect = dropdownEl.getBoundingClientRect();
  const viewHeight = window.innerHeight;
  const viewWidth = window.innerWidth;
  const margin = 8;
  const gap = 2;

  const computedDropdownStyle: CSSStyleDeclaration = getComputedStyle(dropdownEl);
  const dropdownPaddingPx: number = parseFloat(computedDropdownStyle.getPropertyValue("--dropdown-pad") || "0");
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

  if (primary === "bottom" && anchorRect.bottom + dropdownRect.height + margin > viewHeight) {
    primary = "top";
  } else if (primary === "top" && anchorRect.top - dropdownRect.height - margin < 0) {
    primary = "bottom";
  } else if (primary === "right" && anchorRect.right + dropdownRect.width + margin > viewWidth) {
    primary = "left";
  } else if (primary === "left" && anchorRect.left - dropdownRect.width - margin < 0) {
    primary = "right";
  }

  if (primary === "top" || primary === "bottom") {
    if (secondary === "start" && anchorRect.left + dropdownRect.width + margin > viewWidth) {
      secondary = "end";
    } else if (secondary === "end" && anchorRect.right - dropdownRect.width - margin < 0) {
      secondary = "start";
    }
  } else {
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

  if (isOpen.value && !isContextMenuCall) {
    return;
  }

  if (isOpen.value) {
    isOpen.value = false;
    await nextTick();
  }

  if (isContextMenuCall) {
    closeAllDropdowns("Opening new context menu");
    await nextTick();
  }

  isOpenedByClick.value = !isContextMenuCall;

  if (debugConfig.logDropdownEvents) logInteraction("DropdownMenu", `Opening "${props.dropdownDataName}"`);
  isOpen.value = true;
  isContentLoaded.value = false;
  contextMenuCoords.value = coords || null;

  await nextTick();

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

  if (!isContextMenuCall) {
    closeUnrelatedDropdowns(dropdown);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(async () => {
      await adjustDropdownPosition();
      isContentLoaded.value = true;
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
  isContentLoaded.value = false;
  contextMenuCoords.value = null;
  isOpenedByClick.value = false;
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

  if (props.isSubmenu) {
    if (openTimeoutId.value) clearTimeout(openTimeoutId.value);
    openTimeoutId.value = window.setTimeout(() => {
      if (!isOpen.value) openDropdown();
    }, 500);
    return;
  }

  if (isOpen.value) {
    return;
  }

  const thisDropdownEl = dropdownMenuRef.value;
  if (!thisDropdownEl) return;

  const openSiblingExists = openDropdowns.value.some((openDropdown) => {
    if (openDropdown.isSubmenu) return false;

    const openDropdownRootEl = openDropdown.button.closest(".dropdown-menu");
    if (!openDropdownRootEl || openDropdownRootEl === thisDropdownEl) {
      return false;
    }

    return (
      thisDropdownEl.parentElement === openDropdownRootEl.parentElement &&
      (thisDropdownEl.previousElementSibling === openDropdownRootEl || thisDropdownEl.nextElementSibling === openDropdownRootEl)
    );
  });

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

.dropdown-content.content-ready {
  opacity: 1;
  pointer-events: all;
}
</style>
<!-- #endregion -->
