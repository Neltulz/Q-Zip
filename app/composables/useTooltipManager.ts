// app/composables/useTooltipManager.ts
import { ref, type Ref } from "vue";

// Shared state for all tooltips using this manager
const isAnyTooltipVisible = ref(false);
const activeTooltipId: Ref<string | null> = ref(null);
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const SHOW_DELAY = 500; // ms
const HIDE_DELAY = 100; // A brief delay to allow moving between elements

/**
 * A composable to manage the visibility of tooltips with delays,
 * mimicking native OS tooltip behavior.
 */
export function useTooltipManager() {
  const showTooltip = (tooltipId: string) => {
    // If we are moving from one tooltip to another, cancel the hide timer
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    // If a tooltip is already visible, show the new one instantly.
    if (isAnyTooltipVisible.value) {
      if (showTimer) clearTimeout(showTimer);
      activeTooltipId.value = tooltipId;
      isAnyTooltipVisible.value = true;
      return;
    }

    // If no tooltip is visible, start a timer to show this one.
    if (!showTimer) {
      showTimer = setTimeout(() => {
        activeTooltipId.value = tooltipId;
        isAnyTooltipVisible.value = true;
        showTimer = null;
      }, SHOW_DELAY);
    }
  };

  const hideTooltip = () => {
    // Clear any pending show timer
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }

    // Start a brief hide timer to see if the user moves to another tooltip
    if (!hideTimer) {
      hideTimer = setTimeout(() => {
        activeTooltipId.value = null;
        isAnyTooltipVisible.value = false;
        hideTimer = null;
      }, HIDE_DELAY);
    }
  };

  return {
    activeTooltipId,
    showTooltip,
    hideTooltip,
  };
}
