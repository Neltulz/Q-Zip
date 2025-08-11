<!-- styles for drag region moved to scoped CSS file -->

<!-- components/TitleBar.vue @preserve -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!--
  Description: This component defines the application's title bar, including
  the app menu, navigation buttons, and window controls. It now dynamically
  disables navigation buttons when the 'welcome' layout is active, uses
  the modalsStore to open modals for user interaction, and prevents the
  default system context menu from appearing on right-click. It now correctly
  closes all dropdown menus when a theme is selected or the app is exited.
-->
<template>
  <teleport to="[data-tauri-decorum-tb]">
    <div id="title-bar" data-component-name="TitleBar" @contextmenu.prevent>
      <div class="header-content">
        <div class="dropdown-and-app-title-wrapper">
          <DropdownMenu
            id="app-menu"
            ref="appMenuDropdownRef"
            btn-theme="liter"
            button-style-class="trans-btn"
            data-name="main-menu-dropdown"
            dropdown-data-name="main-menu-dropdown"
            last-icon-name="mdi:menu"
            :last-icon-size="24"
            placement="bottom-start"
            @mouseenter="showMainMenuTooltip"
            @mouseleave="hideMainMenuTooltip"
          >
            <template #default>
              <DropdownMenu
                :is-submenu="true"
                btn-theme="liter"
                button-style-class="trans-btn"
                data-name="theme-submenu-dropdown"
                dropdown-data-name="theme-submenu"
                first-icon-name="mdi:palette"
                :first-icon-size="20"
                last-icon-name="mdi:chevron-right"
                :last-icon-size="20"
                placement="right-start"
              >
                <template #button-content>
                  <span>Theme</span>
                </template>
                <template #default>
                  <CustomButton
                    title="Set the application theme to light mode."
                    :class="{ active: themeStore.theme === 'light' }"
                    btn-theme="liter"
                    button-style-class="trans-btn can-become-active active-line-inline-start"
                    data-name="light-theme-btn"
                    first-icon-name="mdi:weather-sunny"
                    :first-icon-size="20"
                    @click="setTheme('light')"
                  >
                    Light
                  </CustomButton>
                  <CustomButton
                    title="Set the application theme to dark mode."
                    :class="{ active: themeStore.theme === 'dark' }"
                    btn-theme="liter"
                    button-style-class="trans-btn can-become-active active-line-inline-start"
                    data-name="dark-theme-btn"
                    first-icon-name="mdi:weather-night"
                    :first-icon-size="20"
                    @click="setTheme('dark')"
                  >
                    Dark
                  </CustomButton>
                  <CustomButton
                    title="Sync the application theme with your operating system."
                    :class="{ active: themeStore.theme === 'system' }"
                    btn-theme="liter"
                    button-style-class="trans-btn can-become-active active-line-inline-start"
                    data-name="system-theme-btn"
                    first-icon-name="mdi:desktop-tower-monitor"
                    :first-icon-size="20"
                    @click="setTheme('system')"
                  >
                    System
                  </CustomButton>
                </template>
              </DropdownMenu>

              <DropdownMenu
                :is-submenu="true"
                btn-theme="liter"
                button-style-class="trans-btn"
                data-name="reset-submenu-dropdown"
                dropdown-data-name="reset-submenu"
                first-icon-name="mdi:refresh"
                :first-icon-size="20"
                last-icon-name="mdi:chevron-right"
                :last-icon-size="20"
                placement="right-start"
              >
                <template #button-content>
                  <span>Reset</span>
                </template>
                <template #default>
                  <CustomButton
                    v-for="resettable in resettables"
                    :key="resettable.name"
                    :data-name="`reset-${resettable.name.toLowerCase().replace(/ /g, '-')}-btn`"
                    :first-icon-name="resettable.icon"
                    :first-icon-size="20"
                    :title="resettable.tooltip"
                    btn-theme="liter"
                    button-style-class="trans-btn"
                    @click="showResetConfirmation(resettable.name, resettable.action)"
                  >
                    {{ resettable.name }}
                  </CustomButton>
                  <hr />
                  <CustomButton
                    btn-theme="danger"
                    button-style-class="trans-btn"
                    data-name="reset-all-btn"
                    first-icon-name="mdi:nuke"
                    :first-icon-size="20"
                    title="Reset all UI, jobs, and settings to their defaults."
                    @click="handleResetAll"
                  >
                    Reset All
                  </CustomButton>
                </template>
              </DropdownMenu>

              <hr />

              <CustomButton
                btn-theme="liter"
                button-style-class="trans-btn"
                data-name="debug-button-test-btn"
                first-icon-name="mdi:test-tube"
                :first-icon-size="20"
                @click="handleButtonTestClick"
                @mouseenter="scheduleSubmenuClosure"
              >
                Button Test
              </CustomButton>

              <hr />
              <CustomButton
                btn-theme="liter"
                button-style-class="trans-btn"
                data-name="exit-app-btn"
                first-icon-name="mdi:exit-to-app"
                :first-icon-size="20"
                @click="handleExit"
                @mouseenter="scheduleSubmenuClosure"
              >
                Exit
              </CustomButton>
            </template>
          </DropdownMenu>
          <InfoTooltip
            :visible="mainMenuTooltipVisible && !isMainMenuActive"
            :content="{ text: 'Main Menu' }"
            :target="mainMenuTooltipTarget"
            placement="bottom-start"
          />
          <span class="app-title-wrapper"><span class="app-title">Q-Zip</span> <span class="ver-num">v0.1.3</span></span>
        </div>

          <div class="center-nav-btns" :class="{ disabled: isWelcomeLayout }">
          <CustomButton
            btn-theme="liter"
            button-style-class="trans-btn"
            data-name="nav-to-welcome"
            ref="navToWelcomeRef"
            first-icon-name="mdi:home"
            :first-icon-size="20"
            title="Return to Welcome Screen"
            :disabled="isWelcomeLayout"
            @click="handleNavToWelcome"
            @mouseenter="showCenterTooltip('Return to the welcome screen', 'nav-to-welcome')"
            @mouseleave="hideCenterTooltip"
          />

          <div class="btn-group">
            <CustomButton
              btn-theme="liter"
              button-style-class="trans-btn can-become-active active-line-block-end"
              data-name="nav-to-job-setup"
              ref="navToJobSetupRef"
              first-icon-name="mdi:briefcase-outline"
              :first-icon-size="20"
              :class="{ active: navStore.activePage === 'JobSetup' }"
              :disabled="isWelcomeLayout"
              @click="navStore.setActivePage('JobSetup')"
              @mouseenter="showCenterTooltip('Add or remove jobs for archive creation.', 'nav-to-job-setup')"
              @mouseleave="hideCenterTooltip"
            >
              Job Setup
            </CustomButton>
            <div class="divider" />
            <CustomButton
              btn-theme="liter"
              button-style-class="trans-btn can-become-active active-line-block-end"
              data-name="nav-to-job-queue"
              ref="navToJobQueueRef"
              first-icon-name="mdi:view-list"
              :first-icon-size="20"
              :class="{ active: navStore.activePage === 'JobQueue' }"
              :disabled="isWelcomeLayout"
              @click="navStore.setActivePage('JobQueue')"
              @mouseenter="showCenterTooltip('View summary of archives queued for creation.', 'nav-to-job-queue')"
              @mouseleave="hideCenterTooltip"
            >
              Job Queue
            </CustomButton>
            <div class="divider" />
            <CustomButton
              btn-theme="liter"
              button-style-class="trans-btn can-become-active active-line-block-end"
              data-name="nav-to-progress"
              ref="navToProgressRef"
              first-icon-name="mdi:progress-clock"
              :first-icon-size="20"
              :class="{ active: navStore.activePage === 'Progress' }"
              :disabled="isWelcomeLayout"
              @click="navStore.setActivePage('Progress')"
              @mouseenter="showCenterTooltip('View archive creation progress.', 'nav-to-progress')"
              @mouseleave="hideCenterTooltip"
            >
              Progress
            </CustomButton>
          </div>
        </div>

        <!-- Center nav tooltip (single instance used for all center buttons) -->
        <InfoTooltip
          :visible="centerTooltipIsActive || (debugForceJobQueue && centerTooltipText && centerTooltipText.toLowerCase().includes('job queue'))"
          :content="{ text: centerTooltipText || (debugForceJobQueue ? 'Job Queue' : '') }"
          :target="debugForceCenterTarget || centerTooltipTarget"
          placement="bottom"
          :debugForceVisible="debugForceJobQueue"
        />
        <!-- Custom Zoom Indicator Button (hidden by default) -->
        <div v-if="showZoomIndicator" class="titlebar-zoom-indicator" style="grid-row:1">
          <CustomButton
            :data-name="'titlebar-zoom-reset-btn'"
            btn-theme="default"
            button-style-class="" 
            @click="resetGlobalZoom"
            class="zoom-indicator-btn"
          >
            {{ zoomText }}
          </CustomButton>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useThemeStore, type Theme } from "@/stores/themeStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { useLayoutStore } from "@/stores/layoutStore";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";
import { useDropdownManager } from "@/composables/dropdownManager";
import InfoTooltip from "@/components/InfoTooltipContainer.vue";
import { useResetManager } from "@/composables/useResetManager";
import { useModalsStore } from "@/stores/modalsStore";
import type { ModalOptions } from "@/types/modal";

const themeStore = useThemeStore();
const navStore = useNavigationStore();
const layoutStore = useLayoutStore();
const userPreferencesStore = useUserPreferencesStore();
const dropdownManager = useDropdownManager();
const { scheduleSubmenuClosure } = dropdownManager;
const { resettables, resetAll } = useResetManager();
const modalsStore = useModalsStore();

const isWelcomeLayout = computed((): boolean => {
  return layoutStore.currentLayout === "welcome";
});

// Main Menu tooltip state
const mainMenuTooltipVisible = ref(false);
const appMenuDropdownRef = ref<any | null>(null);

// Center navigation tooltip state
const centerTooltipVisible = ref(false);
const centerTooltipText = ref("");
const navToWelcomeRef = ref<any | null>(null);
const navToJobSetupRef = ref<any | null>(null);
const navToJobQueueRef = ref<any | null>(null);
const navToProgressRef = ref<any | null>(null);

const centerTooltipTarget = computed(() => {
  // Resolve by data-name -> prefer exposed visual style
  const nameToRef: Record<string, any> = {
    'nav-to-welcome': navToWelcomeRef.value,
    'nav-to-job-setup': navToJobSetupRef.value,
    'nav-to-job-queue': navToJobQueueRef.value,
    'nav-to-progress': navToProgressRef.value,
  };
  // If a ref is available and exposes visual style, use it
  const findEl = (r: any) => {
    try {
      if (!r) return null;
      if (typeof r.getTriggerVisualStyle === 'function') return r.getTriggerVisualStyle();
      if (r.visualStyleRef && r.visualStyleRef.value) return r.visualStyleRef.value;
      // fallback DOM lookup
      const el = (r as Element)?.querySelector?.('.visual-style') ?? null;
      return el;
    } catch (e) {
      return null;
    }
  };
  // Determine which nav is active via tooltip text mapping
  const names = ['nav-to-welcome', 'nav-to-job-setup', 'nav-to-job-queue', 'nav-to-progress'];
  for (const n of names) {
    if (centerTooltipText.value && centerTooltipText.value.toLowerCase().includes(n.split('-').slice(2).join(' '))) {
      const el = findEl(nameToRef[n]);
      if (el) return el;
    }
  }
  // Fallback: try to find by data-name attribute
  const el = document.querySelector(`[data-name='${centerTooltipNameCandidate.value}']`);
  return (el?.querySelector('.visual-style') as HTMLElement) ?? el;
});

// Helper reactive to store the last hovered center button's data-name
const centerTooltipNameCandidate = ref('');

// Use the shared tooltip manager (same used by JobSelectorArea) so center
// nav button tooltips get the same delayed show/hide behavior and don't
// unmount/remount when switching between adjacent buttons.
import { useTooltipManager } from '@/composables/useTooltipManager';
const tooltipManager = useTooltipManager();

// Compute whether the center tooltip should be visible based on the shared
// tooltip manager's active id or the debug force flag. We keep `centerTooltipVisible`
// for backward-compat but the InfoTooltip uses this computed value so that the
// shared manager controls visibility.
const centerTooltipIsActive = computed(() => {
  const activeId = tooltipManager.activeTooltipId.value;
  // Require the manager to indicate a tooltip is visible so opacity transitions
  // on the InfoTooltip component match the intended fade behaviour when moving
  // between adjacent center nav buttons.
  if (tooltipManager.isAnyTooltipVisible && !tooltipManager.isAnyTooltipVisible.value) return false;
  if (activeId && centerTooltipNameCandidate.value) {
    return activeId === centerTooltipNameCandidate.value;
  }
  // when forcing Job Queue for debug, allow the tooltip to be visible
  if (debugForceJobQueue && centerTooltipText.value && centerTooltipText.value.toLowerCase().includes('job queue')) return true;
  return false;
});

const showCenterTooltip = (text: string, dataName: string) => {
  // suppress native title immediately to avoid OS/browser tooltip
  try {
    const el = document.querySelector(`[data-name='${dataName}']`) as HTMLElement | null;
    if (el && el.hasAttribute('title')) {
      (el as any).__originalTitle = el.getAttribute('title');
      el.removeAttribute('title');
    }
  } catch (e) {
    /* ignore */
  }

  centerTooltipText.value = text;
  centerTooltipNameCandidate.value = dataName;
  tooltipManager.showTooltip(dataName);
};

const hideCenterTooltip = () => {
  // restore original title if we removed it earlier (but don't immediately hide UI)
  try {
    const dataName = centerTooltipNameCandidate.value;
    if (dataName) {
      const el = document.querySelector(`[data-name='${dataName}']`) as HTMLElement | null;
      if (el && (el as any).__originalTitle !== undefined) {
        const orig = (el as any).__originalTitle;
        if (orig === null || orig === undefined) el.removeAttribute('title');
        else el.setAttribute('title', orig);
        delete (el as any).__originalTitle;
      }
    }
  } catch (e) {
    /* ignore */
  }

  tooltipManager.hideTooltip();
};

// Debug: force the Job Queue center tooltip to be visible and anchored to the
// Job Queue button even when not hovered. This is for temporary debugging only.
import { ref as vueRef2, computed as vueComputed2 } from 'vue';
// Debug flag for forcing the Job Queue tooltip. Leave `false` in normal use.
const debugForceJobQueue = vueRef2(false);
const resolveVisualElement = (r: any) => {
  try {
    if (!r) return null;
    if (typeof r.getTriggerVisualStyle === 'function') return r.getTriggerVisualStyle();
    if (r.visualStyleRef && r.visualStyleRef.value) return r.visualStyleRef.value;
    const el = (r as Element)?.querySelector?.('.visual-style') ?? null;
    return el;
  } catch (e) {
    return null;
  }
};

import { onMounted, watch as vueWatch } from 'vue';

// When forcing the Job Queue tooltip, we may need to wait for the rendered
// DOM element to exist. Use a small retry mechanism and store the found
// element here so InfoTooltip always receives a concrete Element reference.
const debugForcedElement = vueRef2<HTMLElement | null>(null);

const attemptResolveJobQueueElement = (maxTries = 30, delayMs = 50) => {
  let tries = 0;
  const tryFind = () => {
    // Try the component ref first
    const compResolved = resolveVisualElement(navToJobQueueRef.value) ?? (navToJobQueueRef.value as any)?.visualStyleRef?.value ?? (navToJobQueueRef.value as any)?.buttonRef?.value;
    if (compResolved instanceof Element) {
      debugForcedElement.value = compResolved as HTMLElement;
      return;
    }

    // DOM fallback by data-name
    try {
      const btn = document.querySelector("[data-name='nav-to-job-queue']") as HTMLElement | null;
      if (btn) {
        const inner = btn.querySelector('.visual-style') as HTMLElement | null;
        debugForcedElement.value = inner ?? btn;
        return;
      }
    } catch (e) {
      /* ignore */
    }

    tries += 1;
    if (tries < maxTries) {
      setTimeout(tryFind, delayMs);
    }
  };
  tryFind();
};

onMounted(() => {
  if (debugForceJobQueue.value) attemptResolveJobQueueElement();
});

vueWatch(debugForceJobQueue, (val) => {
  if (val) attemptResolveJobQueueElement();
  else debugForcedElement.value = null;
});

const debugForceCenterTarget = vueComputed2(() => {
  if (!debugForceJobQueue.value) return null;
  return debugForcedElement.value ?? resolveVisualElement(navToJobQueueRef.value) ?? navToJobQueueRef.value;
});

const mainMenuTooltipTarget = computed(() => {
  // Prefer the DropdownMenu component's exposed visual-style getter if available
  const comp = appMenuDropdownRef.value as any;
  if (comp && typeof comp.getTriggerVisualStyle === "function") {
    const el = comp.getTriggerVisualStyle();
    if (el instanceof Element) return el;
  }

  const btn = document.querySelector("[data-name='options-btn-for-main-menu-dropdown']") as HTMLElement | null;
  return (btn?.querySelector(".visual-style") as HTMLElement | null) ?? btn;
});

const isMainMenuActive = computed(() => {
  const el = document.getElementById("app-menu");
  return !!(el && el.classList.contains("active"));
});

const showMainMenuTooltip = () => {
  mainMenuTooltipVisible.value = true;
};
const hideMainMenuTooltip = () => {
  mainMenuTooltipVisible.value = false;
};

// If the menu opens, ensure the tooltip is hidden
watch(isMainMenuActive, (val) => {
  if (val) mainMenuTooltipVisible.value = false;
});

const setTheme = (theme: Theme): void => {
  themeStore.setTheme(theme);
  dropdownManager.closeAllDropdowns("Theme selected");
};

const handleButtonTestClick = (): void => {
  const modalOptions: ModalOptions = {
    title: "Button Component Test",
    buttons: [
      {
        action: "cancel",
        text: "Close",
        styleClass: "bordered-btn",
      },
    ],
    footerJustifyContent: "center",
    closeOnClickOutside: true,
  };
  modalsStore.openModal("DebugButtonTestModalContent", modalOptions);
  dropdownManager.closeAllDropdowns("Clicked 'Button Test'");
};

const handleNavToWelcome = (): void => {
  userPreferencesStore.setSkipWelcomeScreen(false);
  layoutStore.showWelcomeLayout();
};

const showResetConfirmation = (resetName: string, action: () => void | Promise<void>): void => {
  let formattedDescription: string;

  switch (resetName) {
    case "Reset Theme":
      formattedDescription = `This will reset the application's <strong><em>Theme</em></strong> to its default.`;
      break;
    case "Reset UI":
      formattedDescription = `This will restore all <strong><em>UI Panels and Layouts</em></strong> to their default dimensions and positions.`;
      break;
    case "Reset Jobs":
      formattedDescription = `This will clear all <strong><em>Jobs</em></strong> from the queue and reset the job list to a single, new entry.`;
      break;
    case "Reset Settings":
      formattedDescription = `This will revert all global compression <strong><em>Settings</em></strong> to their default values.`;
      break;
    case "Reset User Preferences":
      formattedDescription = `This will reset all <strong><em>User Preferences</em></strong>, such as the 'skip welcome screen' choice.`;
      break;
    case "Reset Window":
      formattedDescription = `This will restore the application's <strong><em>Window</em></strong> to its default size and position.`;
      break;
    default:
      formattedDescription = `You are about to reset <strong><em>${resetName}</em></strong>. This action cannot be undone.`;
      break;
  }

  const description = [formattedDescription, "Are you sure you want to proceed?"];

  const modalOptions: ModalOptions = {
    icon: "mdi:alert-outline",
    title: `Confirm ${resetName}`,
    buttons: [
      {
        action: "proceed",
        icon: "mdi:refresh",
        isDefault: true,
        justify: "center",
        styleClass: "bordered-btn",
        text: "Proceed",
        theme: "danger",
      },
      {
        action: "cancel",
        justify: "center",
        styleClass: "bordered-btn",
        text: "Cancel",
      },
    ],
    footerJustifyContent: "center",
    closeOnClickOutside: true,
  };

  const props = { description };

  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, props, (modalAction: string) => {
    if (modalAction === "proceed") {
      action();
    }
  });
  dropdownManager.closeAllDropdowns(`Clicked '${resetName}'`);
};

const handleResetAll = (): void => {
  const description = [
    `You are about to reset <strong><em>all UI elements, jobs, and settings</em></strong> to their defaults. This is a comprehensive reset and cannot be undone.`,
    "Are you sure you want to proceed?",
  ];

  const action = async () => {
    await resetAll();
    const resetWindowAction = resettables.value.find((r) => r.name === "Reset Window")?.action;
    if (resetWindowAction) {
      await resetWindowAction();
    }
  };

  const modalOptions: ModalOptions = {
    icon: "mdi:nuke",
    title: "Confirm Reset All",
    buttons: [
      {
        action: "proceed",
        icon: "mdi:nuke",
        isDefault: true,
        justify: "center",
        styleClass: "bordered-btn",
        text: "Proceed",
        theme: "danger",
      },
      {
        action: "cancel",
        justify: "center",
        styleClass: "bordered-btn",
        text: "Cancel",
      },
    ],
    footerJustifyContent: "center",
    closeOnClickOutside: true,
  };

  const props = { description };

  modalsStore.openModal("ResetConfirmationModalContent", modalOptions, props, (modalAction: string) => {
    if (modalAction === "proceed") {
      action();
    }
  });
  dropdownManager.closeAllDropdowns("Clicked 'Reset All'");
};

const handleExit = (): void => {
  dropdownManager.closeAllDropdowns("Exiting app");
  getCurrentWindow().close();
};

// Zoom indicator state
import { ref as vueRef, onMounted as vueOnMounted, onUnmounted as vueOnUnmounted } from "vue";
import { resetZoom } from "@/composables/useZoom";
const showZoomIndicator = vueRef(false);
const zoomText = vueRef("100%");

const updateZoomIndicator = (val: number) => {
  if (!val || val === 1) {
    showZoomIndicator.value = false;
  } else {
    showZoomIndicator.value = true;
    zoomText.value = `${Math.round(val * 100)}%`;
  }
};

const resetGlobalZoom = () => {
  resetZoom();
};

vueOnMounted(() => {
  window.addEventListener("app:global-zoom-changed", (ev: Event) => {
    const e = ev as CustomEvent<number>;
    updateZoomIndicator(e.detail);
  });
  // compute position for zoom indicator so it sits left of native window controls
  // We no longer compute --titlebar-zoom-right; the zoom indicator uses the middle grid column.
});

vueOnUnmounted(() => {
  window.removeEventListener("app:global-zoom-changed", (ev: Event) => {
    const e = ev as CustomEvent<number>;
    updateZoomIndicator(e.detail);
  });
  window.removeEventListener('resize', () => {});
});
</script>

<style>
:root {
  --title-bar-height: 40px;
}

#app-menu {
  z-index: 10000;
}

body:has(.modal-wrapper.modal-open) #app-menu {
  & > .custom-button {
    opacity: 0.25 !important;
    pointer-events: none !important;
  }
}

/*
Use the :has() selector to detect when a modal is open anywhere in the body
and apply disabled styles to the center navigation buttons.
*/
body:has(.modal-wrapper.modal-open) .center-nav-btns {
  opacity: 0.25;
  pointer-events: none;
}

[data-tauri-decorum-tb] {
  /* Turn the native toolbar container into a 3-column grid:
     1fr = main title area, 2nd column = zoom indicator, 3rd column = native window controls */
  display: grid !important;
  grid-auto-flow: column !important;
  grid-template-columns: 1fr auto auto !important;
  grid-template-rows: 1fr !important;
  align-items: center !important;
  height: var(--title-bar-height) !important;
  z-index: 0 !important;
}

/* Ensure all direct children of the native toolbar sit on the first grid row
   so they flow horizontally into the columns we defined rather than stacking. */
[data-tauri-decorum-tb] > * {
  grid-row: 1 !important;
}

/* Place the zoom indicator into the middle column if present. */
[data-tauri-decorum-tb] > .titlebar-zoom-indicator {
  grid-column: 2;
  justify-self: end;
}

/* Ensure our #title-bar (Vue root) occupies the main area */
#title-bar {
  grid-column: 1;
  grid-row: 1;
}

[data-tauri-decorum-tb] button,
[data-tauri-decorum-tb] .button {
  background-color: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  box-sizing: border-box;
  min-width: var(--min-tch-tgt);
  padding: 0;
  z-index: 10000;
}

[data-tauri-decorum-tb] button:after,
[data-tauri-decorum-tb] .button:after {
  border-radius: 0;
}

/* Force native window control buttons into the 3rd grid column */
[data-tauri-decorum-tb] button.decorum-tb-btn,
[data-tauri-decorum-tb] .button.decorum-tb-btn {
  align-self: stretch;
  height: 100%;
  position: relative;
  z-index: 100;
}

[data-tauri-decorum-tb] button.decorum-tb-btn:hover,
[data-tauri-decorum-tb] .button.decorum-tb-btn:hover {
  border: 0;
}

[data-tauri-decorum-tb] button#decorum-tb-minimize,
[data-tauri-decorum-tb] button#decorum-tb-maximize,
[data-tauri-decorum-tb] button#decorum-tb-close {
  cursor: default;
}

/* Place native window control buttons relative to the end of the grid using negative indices */
[data-tauri-decorum-tb] button#decorum-tb-close {
  grid-column: -1; /* last column */
}
[data-tauri-decorum-tb] button#decorum-tb-maximize {
  grid-column: -2; /* second-to-last */
}
[data-tauri-decorum-tb] button#decorum-tb-minimize {
  grid-column: -3; /* third-to-last */
}

[data-tauri-decorum-tb] button#decorum-tb-minimize:hover {
  background-color: var(--btn-bg-hvr-clr-lite);
}

[data-tauri-decorum-tb] button#decorum-tb-maximize:hover {
  background-color: var(--btn-bg-hvr-clr-lite);
}

[data-tauri-decorum-tb] button#decorum-tb-close:hover {
  background-color: hsl(0, 80%, 40%);
}

/* Ensure the drag region element is placed into the first grid cell so it
   occupies the main title area for dragging (global styles must apply). */
[data-tauri-decorum-tb] > [data-tauri-drag-region],
[data-tauri-decorum-tb] [data-tauri-drag-region],
[data-tauri-drag-region] {
  grid-column: 1;
  grid-row: 1;
  z-index: 1;
}
</style>

<style scoped>
@import "./title-bar-comp/title-bar.scoped.css";
</style>
