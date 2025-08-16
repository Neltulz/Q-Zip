<!-- #region top-comments -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  DropdownMenu.vue @preserve
-->
<!-- components/DropdownMenu.vue @preserve -->
<!-- 
  DropdownMenu.vue @preserve
-->
<!--
  Description:
  A reusable dropdown menu component that can be triggered by a
  button click or programmatically (e.g., for a context menu).
  It supports nested submenus, dynamic positioning to stay
  within the viewport, and is managed by a global dropdown manager.
  All dropdowns now include a scrollable area by default, with
  optional slots for non-scrolling content at the top and bottom.
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
        ref="triggerButtonRef"
        :btn-theme="props.btnTheme"
        :class="{ active: isOpen && isOpenedByClick }"
        :button-style-class="customButtonStyles"
        :data-name="'options-btn-for-' + props.dropdownDataName"
        :disabled="props.disabled"
        :first-icon-name="props.firstIconName"
        :first-icon-size="props.firstIconSize"
        :last-icon-name="smartLastIconName"
        :last-icon-size="props.lastIconSize"
        @click.stop="(e: MouseEvent) => handleButtonClick(e)"
        @mouseenter="(e: MouseEvent) => handleMouseEnter(e)"
        @mouseleave="handleMouseLeave"
      >
        <slot name="button-content" />
      </CustomButton>
    </template>
    <teleport to="body">
      <template v-if="hasSlotContent">
        <Transition
          name="dropdown-fade"
          appear
          @enter="onDropdownEnter"
          @leave="onDropdownLeave"
        >
          <div
            v-if="isOpen"
            ref="dropdownContent"
            class="dropdown-content"
            :class="[transitionClass, { 'content-ready': isContentLoaded }]"
            :style="dropdownContentStyle"
            :data-belongs-to="props.dropdownDataName"
            @contextmenu.prevent
            @mouseenter="handleContentMouseEnter"
            @mouseleave="handleContentMouseLeave"
          >
          <slot name="content-top" :close="closeDropdown" />
          <OverlayScrollbarsComponent
            :options="{
              scrollbars: {
                visibility: 'auto',
                autoHide: 'move',
                autoHideSuspend: true,
                theme: currentTheme,
              },
            }"
            defer
          >
            <slot :close="closeDropdown" />
          </OverlayScrollbarsComponent>
          <slot name="content-bottom" :close="closeDropdown" />
          <template v-if="props.showCancelButton">
            <hr />
            <CustomButton
              :btn-theme="props.cancelButtonTheme"
              :button-style-class="props.cancelButtonStyleClass || 'trans-btn btn-lite'"
              data-name="dropdown-cancel-btn"
              first-icon-name="mdi:close"
              :first-icon-size="20"
              shortcut-text="Esc"
              @click="closeDropdown"
            >
              {{ props.cancelButtonText }}
            </CustomButton>
          </template>
        </div>
        </Transition>
      </template>
    </teleport>
  </div>
</template>
<!-- #endregion -->
<!-- #region script -->
<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useSlots, watch, type CSSProperties, type PropType, type Ref } from "vue";
import { useDropdownManager, type Dropdown } from "@/composables/dropdownManager";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logInteraction, logTrace, logWarning, logManagerAction } from "@/utils/loggers";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import { useThemeStore } from "@/stores/themeStore";
import CustomButton from "./CustomButton.vue";
type Placement =
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "bottom-center"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end"
  | "right-center";
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
    default: "mdi:chevron-down",
  },
  lastIconSize: {
    type: [String, Number],
    default: undefined,
  },
  placement: {
    type: String as PropType<Placement>,
    default: "bottom-start",
  },
  showCancelButton: {
    type: Boolean,
    default: false,
  },
  cancelButtonText: {
    type: String,
    default: "Cancel",
  },
  cancelButtonTheme: {
    type: String as PropType<BtnTheme>,
    default: "default",
  },
  cancelButtonStyleClass: {
    type: String,
    default: "",
  },
  onButtonClick: {
    type: Function as PropType<(event: MouseEvent) => boolean | void>,
    default: undefined,
  },
});
const emit = defineEmits<{
  'dropdown-opened': [];
      'action-button-activated': [buttonData: { dataName: string | undefined, btnTheme: string | undefined, text: string | undefined }]
}>();
const themeStore = useThemeStore();
const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));
const customButtonStyles = computed(() => {
  const classes = new Set(props.buttonStyleClass ? props.buttonStyleClass.split(" ") : []);
  classes.add("options-btn");
  return Array.from(classes).filter(Boolean).join(" ");
});
// Smart icon logic: use vertical ellipsis if no content, downward caret if there's content
const smartLastIconName = computed(() => {
  // If lastIconName is explicitly set, use it
  if (props.lastIconName !== "mdi:chevron-down") {
    return props.lastIconName;
  }
  // Check if there's button content
  const hasButtonContent = slots["button-content"] && slots["button-content"]();
  const buttonContentText = hasButtonContent ? 
    (Array.isArray(hasButtonContent) ? hasButtonContent.map(vnode => (vnode as any).children).join('') : (hasButtonContent as any).children) : '';
  // If there's text content, use downward caret, otherwise use vertical ellipsis
  return buttonContentText && buttonContentText.trim() ? "mdi:chevron-down" : "mdi:dots-vertical";
});
const slots = useSlots();
const hasSlotContent: boolean = !!slots.default || !!slots["content-top"] || !!slots["content-bottom"];
const isOpen: Ref<boolean> = ref(false);
const isContentLoaded: Ref<boolean> = ref(false);
const dropdownContent: Ref<HTMLElement | null> = ref(null);
const triggerButtonRef = ref<any | null>(null);
const dropdownId: symbol = Symbol("dropdown");
const openTimeoutId: Ref<number | null> = ref(null);
const dropdownMenuRef = ref<HTMLDivElement | null>(null);
const isOpenedByClick: Ref<boolean> = ref(false);
// Transition handlers for smooth enter/leave animations
const onDropdownEnter = (el: Element) => {
  // Ensure the element is properly positioned before showing
  nextTick(() => {
    if (el instanceof HTMLElement) {
      el.style.opacity = '1';
    }
  });
};
const onDropdownLeave = (el: Element) => {
  // Clean up any positioning when leaving
  if (el instanceof HTMLElement) {
    el.style.opacity = '0';
  }
};
const actualPlacement: Ref<Placement> = ref(props.placement);
const dropdownTop: Ref<string> = ref("-9999px");
const dropdownLeft: Ref<string> = ref("-9999px");
const contextMenuCoords = ref<{ x: number; y: number } | null>(null);
const contextMenuAnchorEl = ref<HTMLElement | null>(null);
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
  } else if (contextMenuAnchorEl.value) {
    // If an explicit anchor element was provided (from the click), use it
    const el = contextMenuAnchorEl.value;
    anchorRect = el.getBoundingClientRect();
  } else {
    // Try to find the trigger button inside this component first (safer with arbitrary data-name values)
    const buttonSelector = `[data-name='options-btn-for-${props.dropdownDataName}']`;
    const localButtonEl = dropdownMenuRef.value?.querySelector(buttonSelector) as HTMLElement | null;
    const buttonEl = localButtonEl || (document.querySelector(buttonSelector) as HTMLElement | null);
    const anchorEl = buttonEl?.querySelector(".visual-style") || buttonEl;
    if (!buttonEl || !anchorEl) return;
    anchorRect = anchorEl.getBoundingClientRect();
  }
  const dropdownRect = dropdownEl.getBoundingClientRect();
  const viewHeight = window.innerHeight;
  const viewWidth = window.innerWidth;
  const margin = 8;
  const gap = 2;
  if (DEBUG && debugConfig.logDropdownEvents) {
    logTrace("DropdownMenu", `Adjusting position for "${props.dropdownDataName}"`);
  }
  // Default placement: for submenus prefer opening to the right
  const defaultPlacement = props.isSubmenu && !isContextMenu ? "right-start" : props.placement;
  let [primary, secondary] = (isContextMenu ? "bottom-start" : defaultPlacement).split("-") as [string, string];
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
    case "right-center":
      top = anchorTop + (anchorBottom - anchorTop) / 2 - ddHeight / 2;
      left = anchorRight + gap;
      break;
    case "bottom-center":
      top = anchorBottom + gap;
      left = anchorLeft + (anchorRight - anchorLeft) / 2 - ddWidth / 2;
      break;
    case "bottom-start":
    default:
      top = anchorBottom + gap;
      left = anchorLeft;
      break;
  }
  // Clamp the calculated position to ensure the dropdown stays within the viewport.
  if (left + ddWidth + margin > viewWidth) {
    left = viewWidth - ddWidth - margin;
  }
  if (left < margin) {
    left = margin;
  }
  if (top + ddHeight + margin > viewHeight) {
    top = viewHeight - ddHeight - margin;
  }
  if (top < margin) {
    top = margin;
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
  closeDescendantsOf,
  closeAllDropdowns,
} = useDropdownManager();
const openDropdown = async (opts?: { x?: number; y?: number; anchorEl?: HTMLElement }): Promise<void> => {
  // Consider this a context menu call only when explicit coords are provided and no anchorEl
  const isContextMenuCall = !!(opts && (opts.x !== undefined || opts.y !== undefined) && !opts.anchorEl);
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
  // With Vue transitions, we can immediately open the dropdown
  // The transition will handle the fade-in animation
  if (debugConfig.logDropdownEvents) logInteraction("DropdownMenu", `Opening "${props.dropdownDataName}"`);
  isOpen.value = true;
  isContentLoaded.value = false;
  contextMenuCoords.value = opts && opts.x !== undefined && opts.y !== undefined && !opts.anchorEl ? { x: opts.x!, y: opts.y! } : null;
  contextMenuAnchorEl.value = opts?.anchorEl ?? null;
  // Emit dropdown-opened event
  emit('dropdown-opened');
  await nextTick();
  // Prefer finding trigger inside this component's root; fallback to global search.
  // Use attribute-value equality checks (avoid CSS selector escaping issues with backslashes)
  const computedDataName = `options-btn-for-${props.dropdownDataName}`;
  let localButton: HTMLElement | null = null;
  if (dropdownMenuRef.value) {
    const candidates = Array.from(dropdownMenuRef.value.querySelectorAll('[data-name]')) as HTMLElement[];
    localButton = candidates.find((el) => el.getAttribute('data-name') === computedDataName) || null;
  }
  let buttonEl: HTMLElement | null = null;
  if (props.hideTrigger) {
    buttonEl = dropdownMenuRef.value;
  } else {
    if (localButton) buttonEl = localButton;
    else {
      const globalCandidates = Array.from(document.querySelectorAll('[data-name]')) as HTMLElement[];
      buttonEl = globalCandidates.find((el) => el.getAttribute('data-name') === computedDataName) || null;
    }
  }
  // Log lookup results for debugging
  logInteraction("DropdownMenu", `openDropdown lookup for ${props.dropdownDataName} - computedDataName: ${computedDataName}, hasLocalButton: ${!!localButton}, foundButton: ${!!buttonEl}`);
  if (!buttonEl) {
    // Log useful diagnostic info: list data-name attributes that may match
    const allNames = Array.from(document.querySelectorAll('[data-name]'))
      .map((el) => el.getAttribute('data-name'))
      .filter(Boolean) as string[];
    const candidates = allNames.filter((n) => n.includes('file-actions')).slice(0, 50);
    logWarning("DropdownMenu", `Could not find button element for ${props.dropdownDataName}. computedDataName: ${computedDataName}, candidatesCount: ${candidates.length}`);
    logInteraction("DropdownMenu", `Dropdown candidates for 'file-actions' (first 50): ${candidates.join(', ')}`);
    if (DEBUG && debugConfig.logDropdownEvents) logInteraction("DropdownMenu", `Total data-name elements: ${allNames.length}`);
    // As a last resort: if a click-anchored open was requested, allow fallback to click coords handled below
  }
  if (!buttonEl) {
    logWarning("DropdownMenu", `Cannot create dropdown without button element for ${props.dropdownDataName}`);
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
  const dropdownName = props.dropdownDataName;
  const isDragActionDropdown = dropdownName.startsWith('drag-action-job-') || dropdownName === 'drag-action-new-job';
  logManagerAction("DropdownMenu", `closeDropdown called for: ${dropdownName} (isDragAction: ${isDragActionDropdown})`);
  if (debugConfig.logDropdownEvents) logInteraction("DropdownMenu", `Closing "${props.dropdownDataName}"`);
  // Cancel any pending open timeouts for submenus
  if (openTimeoutId.value) {
    clearTimeout(openTimeoutId.value);
    openTimeoutId.value = null;
  }
  // Ensure any descendant submenus begin closing immediately so they fade out
  // when the parent dropdown is closed (covers clicks on parent trigger).
  // Only close descendants if this is not a submenu (to avoid race conditions)
  if (!props.isSubmenu) {
    try {
      closeDescendantsOf(dropdownId);
    } catch (e) {
      /* ignore */
    }
  }
  // Start fade-out by removing the content-ready class which transitions opacity -> 0
  isContentLoaded.value = false;
  contextMenuCoords.value = null;
  isOpenedByClick.value = false;
  // With Vue transitions, we can immediately set isOpen to false
  // The transition will handle the fade-out animation
  isOpen.value = false;
  
  // Ensure unregistration happens even if the watcher doesn't fire
  // This is a fallback for cases where the watcher might not trigger properly
  setTimeout(() => {
    if (isOpen.value === false) {
      logManagerAction("DropdownMenu", `Fallback unregistration for: ${dropdownName}`);
      unregisterDropdown(dropdownId);
    }
  }, 0);
  
  logManagerAction("DropdownMenu", `closeDropdown completed for: ${dropdownName}`);
};
const handleButtonClick = async (event?: MouseEvent): Promise<void> => {
  if (props.disabled || !hasSlotContent) return;
  
  // Call custom button click handler if provided
  if (props.onButtonClick && event) {
    const result = props.onButtonClick(event);
    // If the handler returns true, prevent default dropdown behavior
    if (result === true) {
      return;
    }
  }
  
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
    // If we have the click event, prefer opening positioned at the click and pass the actual button element as anchor
    if (event) {
      const anchorEl = (event.currentTarget as HTMLElement) || undefined;
      await openDropdown({ x: event.clientX, y: event.clientY, anchorEl });
    } else {
      await openDropdown();
    }
  }
};
const handleMouseEnter = (event?: MouseEvent): void => {
  cancelSubmenuClosure();
  if (props.isSubmenu) {
    if (openTimeoutId.value) clearTimeout(openTimeoutId.value);
    const anchorEl = (event?.currentTarget as HTMLElement) || undefined;
    openTimeoutId.value = window.setTimeout(() => {
      if (!isOpen.value) openDropdown({ anchorEl });
    }, 500);
    return;
  }
  if (isOpen.value) {
    // If the dropdown is already open and this is a parent trigger (not a submenu),
    // schedule submenus to close after a delay so they fade out naturally when
    // the user moves the pointer back to the parent trigger.
    if (!props.isSubmenu) {
      scheduleSubmenuClosure();
    }
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
    const anchorEl = (event?.currentTarget as HTMLElement) || undefined;
    openDropdown({ anchorEl });
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

// ESC key handler to close dropdown and Enter key handler for default action
const handleKeyDown = (event: KeyboardEvent): void => {
  if (DEBUG && debugConfig.logUIInteractivity) {
    logInteraction("DropdownMenu", `handleKeyDown called - key: ${event.key}, isOpen: ${isOpen.value}, dropdownName: ${props.dropdownDataName}`);
  }
  
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault();
    event.stopPropagation();
    if (DEBUG && debugConfig.logUIInteractivity) {
      logInteraction("DropdownMenu", `ESC key detected, closing dropdown "${props.dropdownDataName}"`);
    }
    closeDropdown();
  } else if (event.key === 'Enter' && isOpen.value) {
    event.preventDefault();
    event.stopPropagation();
    if (DEBUG && debugConfig.logUIInteractivity) {
      logInteraction("DropdownMenu", `Enter key detected, looking for default action button in "${props.dropdownDataName}"`);
    }
    
    // Find the default action button (usually the primary action like "Remove Job")
    const content = dropdownContent.value;
    if (content) {
      if (DEBUG && debugConfig.logUIInteractivity) {
        logInteraction("DropdownMenu", `Found dropdown content, searching for action buttons`);
        
        // Debug: log all buttons in the dropdown
        const allButtons = content.querySelectorAll('.custom-button');
        const allButtonInfo = Array.from(allButtons).map(btn => ({
          dataName: btn.getAttribute('data-name'),
          btnTheme: btn.getAttribute('btn-theme'),
          text: btn.textContent?.trim(),
          className: btn.className
        }));
        logInteraction("DropdownMenu", `All buttons in dropdown: ${JSON.stringify(allButtonInfo)}`);
      }
      
      // Look for a button with btn-theme="danger" or the first action button
      // Try multiple selectors to ensure we find the right button
      let actionButtons = content.querySelectorAll('.custom-button[btn-theme="danger"]');
      if (actionButtons.length === 0) {
        actionButtons = content.querySelectorAll('.custom-button[data-name*="confirm"]');
      }
      if (actionButtons.length === 0) {
        actionButtons = content.querySelectorAll('.custom-button[data-name*="remove"]');
      }
      if (actionButtons.length === 0) {
        // Fallback: look for any button with danger theme or confirm/remove in data-name
        actionButtons = content.querySelectorAll('.custom-button[btn-theme="danger"], .custom-button[data-name*="confirm"], .custom-button[data-name*="remove"]');
      }
      
      if (DEBUG && debugConfig.logUIInteractivity) {
        const buttonInfo = Array.from(actionButtons).map(btn => ({
          dataName: btn.getAttribute('data-name'),
          btnTheme: btn.getAttribute('btn-theme'),
          text: btn.textContent?.trim()
        }));
        logInteraction("DropdownMenu", `Found ${actionButtons.length} action buttons: ${JSON.stringify(buttonInfo)}`);
      }
      
      if (actionButtons.length > 0) {
        const defaultButton = actionButtons[0] as HTMLElement;
        const dataName = defaultButton.getAttribute('data-name') || '';
        const btnTheme = defaultButton.getAttribute('btn-theme') || '';
        const text = defaultButton.textContent?.trim() || '';
        
        if (DEBUG && debugConfig.logUIInteractivity) {
          logInteraction("DropdownMenu", `Emitting action-button-activated event - dataName: ${dataName}, btnTheme: ${btnTheme}, text: ${text}`);
        }
        
        // Emit custom event instead of calling click() to bypass dropdownManager
        emit('action-button-activated', { dataName, btnTheme, text });
      } else {
        if (DEBUG && debugConfig.logUIInteractivity) {
          logInteraction("DropdownMenu", `No action buttons found for Enter key`);
        }
      }
    } else {
      if (DEBUG && debugConfig.logUIInteractivity) {
        logInteraction("DropdownMenu", `No dropdown content found for Enter key`);
      }
    }
  }
};
watch(isOpen, (newIsOpen: boolean): void => {
  if (debugConfig.logDropdownEvents)
    logInteraction("DropdownMenu", `Visibility changed for "${props.dropdownDataName}" to ${newIsOpen}`);
  if (newIsOpen) {
    adjustDropdownPosition();
    window.addEventListener("resize", adjustDropdownPosition);
    // Add ESC key listener when dropdown opens
    document.addEventListener("keydown", handleKeyDown);
  } else {
    window.removeEventListener("resize", adjustDropdownPosition);
    // Remove ESC key listener when dropdown closes
    document.removeEventListener("keydown", handleKeyDown);
    logManagerAction("DropdownMenu", `About to unregister dropdown: ${props.dropdownDataName}`);
    unregisterDropdown(dropdownId);
  }
});
onUnmounted((): void => {
  window.removeEventListener("resize", adjustDropdownPosition);
  document.removeEventListener("keydown", handleKeyDown);
  if (openTimeoutId.value) clearTimeout(openTimeoutId.value);
  if (isOpen.value) unregisterDropdown(dropdownId);
});
const getTriggerVisualStyle = (): HTMLElement | null => {
  try {
    const exposed = triggerButtonRef.value as any;
    // custom-button exposes `visualStyleRef` (a ref to the element)
    const vsRef = exposed?.visualStyleRef;
    return vsRef?.value ?? null;
  } catch (e) {
    return null;
  }
};
defineExpose({ openDropdown, closeDropdown, getTriggerVisualStyle });
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
/* Transition animations for smooth enter/leave */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 180ms ease-in-out;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
}
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
  display: flex;
  flex-direction: column;
  inline-size: max-content;
  justify-content: stretch;
  margin-block-start: 0;
  max-height: 90vh;
  min-height: var(--min-tch-tgt);
  min-width: 200px;
  padding: var(--dropdown-pad);
  pointer-events: none; /* Initially non-interactive */
}
/* --- FIX START --- */
/* Use a descendant selector (space) instead of a direct child selector (>)
   to ensure the style applies to <hr> elements inside slots.
   Also, remove the negative margin to prevent overflow. */
.dropdown-content hr {
  background-color: var(--brdr-clr-liter);
  border: 0;
  block-size: 1px;
  display: block;
  /* margin-inline: calc(var(--dropdown-pad) * -1); */ /* This was causing the overflow */
  margin-block: 2px;
}
/* --- FIX END --- */
.dropdown-content hr:first-child,
.dropdown-content hr:last-child {
  display: none;
}
.dropdown-content > .custom-button > .visual-style,
.dropdown-content > .dropdown-menu > .custom-button > .visual-style {
  box-shadow: none;
}
.dropdown-content > .custom-button.can-become-active,
.dropdown-content > .dropdown-menu > .custom-button.can-become-active {
  --line-orientation: vertical;
  --line-position: start;
}
.dropdown-content.content-ready {
  opacity: 1;
  pointer-events: all;
}
/* Ensure CustomButton visual-style has no drop shadow inside dropdowns (teleported content) */
.dropdown-content .custom-button > .visual-style,
.dropdown-content .dropdown-menu .custom-button > .visual-style {
  box-shadow: none !important;
  border: none !important;
}
/* Improve contrast for dropdown buttons: muted by default, brighter on hover/active.
   Avoid overriding the explicit themed button styles (primary/danger/warning/info).
   Only apply these generic dropdown backgrounds to buttons that are NOT one of those themes. */
/* Apply translucent dropdown background only to default-themed buttons so
   themed buttons (primary/danger/warning/info) keep their explicit styles. */
.dropdown-content .custom-button[data-btn-theme="default"] > .visual-style {
  /* Brighter translucent backgrounds for dropdown buttons using HSLA vars */
  background-color: hsla(var(--txt-hue), var(--txt-sat), calc(var(--txt-lum) + 4%), 0.06);
  transition: opacity 120ms ease, background-color 120ms ease;
  opacity: 0.75; /* slightly more visible by default */
}
/* Hover only applies when NOT active so active overrides hover.
   Exclude themed buttons so their own hover backgrounds remain intact. */
.dropdown-content .custom-button:not(.active):not([data-btn-theme="primary"]):not([data-btn-theme="danger"]):not([data-btn-theme="warning"]):not([data-btn-theme="info"]):hover > .visual-style {
  opacity: 0.95;
  background-color: hsla(var(--txt-hue), var(--txt-sat), calc(var(--txt-lum) + 8%), 0.14);
}
/* Active state must always win and be brightest */
.dropdown-content .custom-button[data-btn-theme="default"].active > .visual-style {
  opacity: 1 !important;
  background-color: hsla(var(--txt-hue), var(--txt-sat), calc(var(--txt-lum) + 12%), 0.22) !important;
}
/* Submenu triggers: slightly muted by default but fully bright when active */
.dropdown-content [data-name$="-submenu"] > .visual-style {
  opacity: 0.7;
  background-color: hsla(var(--txt-hue), var(--txt-sat), calc(var(--txt-lum) + 6%), 0.08);
}
.dropdown-content [data-name$="-submenu"].active > .visual-style {
  opacity: 1 !important;
  /* slightly toned-down highlight for submenu active state */
  background-color: hsla(var(--txt-hue), var(--txt-sat), calc(var(--txt-lum) + 10%), 0.18) !important;
}
/* Removed the rule that was hiding InfoTooltip when dropdown is active */
</style>
<!-- #endregion -->
