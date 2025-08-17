// 
// app/composables/useTooltipManager.ts
import { ref, type Ref } from "vue";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logTooltip } from "@/utils/loggers";
// Shared state for all tooltips using this manager
const isAnyTooltipVisible = ref(false);
const activeTooltipId: Ref<string | null> = ref(null);
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let crossfadeTimer: ReturnType<typeof setTimeout> | null = null;
// Match the visual timing used by InfoTooltip transitions for consistency
const SHOW_DELAY = 240; // ms (enter transition)
const HIDE_DELAY = 420; // ms (leave transition)
// Short delay used when switching between adjacent tooltips so we get a
// natural fade-out / fade-in crossfade rather than an immediate swap.
const CROSSFade_DELAY = 120;
/**
 * A composable to manage the visibility of tooltips with delays,
 * mimicking native OS tooltip behavior.
 */
export function useTooltipManager() {
  const showTooltip = (tooltipId: string) => {
    logTooltip("TooltipManager", `showTooltip called for ${tooltipId}`, {
      tooltipId,
      currentActiveId: activeTooltipId.value,
      isAnyTooltipVisible: isAnyTooltipVisible.value,
      hasHideTimer: !!hideTimer,
      hasShowTimer: !!showTimer,
      hasCrossfadeTimer: !!crossfadeTimer
    });

    // If we are moving from one tooltip to another, cancel the hide timer
    if (hideTimer) {
      logTooltip("TooltipManager", `Clearing hide timer for ${tooltipId}`);
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    // Priority logic: if there's a pending show timer and we're trying to show a "remove-job-" tooltip,
    // cancel the pending timer and show the remove-job tooltip immediately
    if (showTimer && tooltipId.startsWith('remove-job-')) {
      logTooltip("TooltipManager", `Priority override: canceling pending tooltip for remove-job tooltip ${tooltipId}`);
      clearTimeout(showTimer);
      showTimer = null;
    }

    // If a tooltip is already visible, perform a short crossfade so the
    // tooltip fades out and the new one fades in instead of an abrupt swap.
    if (isAnyTooltipVisible.value) {
      if (showTimer) {
        logTooltip("TooltipManager", `Clearing show timer for ${tooltipId}`);
        clearTimeout(showTimer);
        showTimer = null;
      }
      // If we're already showing the requested tooltip, nothing to do.
      if (activeTooltipId.value === tooltipId) {
        logTooltip("TooltipManager", `Already showing ${tooltipId}, no action needed`);
        return;
      }
      if (crossfadeTimer) {
        logTooltip("TooltipManager", `Clearing crossfade timer for ${tooltipId}`);
        clearTimeout(crossfadeTimer);
        crossfadeTimer = null;
      }
      // Start fade-out immediately, then switch the target and fade back in.
      logTooltip("TooltipManager", `Starting crossfade from ${activeTooltipId.value} to ${tooltipId}`);
      isAnyTooltipVisible.value = false;
      crossfadeTimer = setTimeout(() => {
        logTooltip("TooltipManager", `Crossfade complete, setting active tooltip to ${tooltipId}`);
        activeTooltipId.value = tooltipId;
        isAnyTooltipVisible.value = true;
        crossfadeTimer = null;
      }, CROSSFade_DELAY);
      return;
    }
    // If no tooltip is visible, start a timer to show this one.
    if (!showTimer) {
      logTooltip("TooltipManager", `Starting show timer for ${tooltipId} (${SHOW_DELAY}ms delay)`);
      showTimer = setTimeout(() => {
        logTooltip("TooltipManager", `Show timer complete, setting active tooltip to ${tooltipId}`);
        activeTooltipId.value = tooltipId;
        isAnyTooltipVisible.value = true;
        showTimer = null;
      }, SHOW_DELAY);
    } else {
      logTooltip("TooltipManager", `Show timer already exists for ${tooltipId}, no action needed`);
    }
  };
  const hideTooltip = () => {
    logTooltip("TooltipManager", `hideTooltip called`, {
      currentActiveId: activeTooltipId.value,
      isAnyTooltipVisible: isAnyTooltipVisible.value,
      hasShowTimer: !!showTimer,
      hasHideTimer: !!hideTimer
    });

    // Clear any pending show timer
    if (showTimer) {
      logTooltip("TooltipManager", `Clearing show timer`);
      clearTimeout(showTimer);
      showTimer = null;
    }
    // Start a brief hide timer to see if the user moves to another tooltip
    if (!hideTimer) {
      logTooltip("TooltipManager", `Starting hide timer (${HIDE_DELAY}ms delay)`);
      hideTimer = setTimeout(() => {
        logTooltip("TooltipManager", `Hide timer complete, hiding all tooltips`);
        activeTooltipId.value = null;
        isAnyTooltipVisible.value = false;
        hideTimer = null;
      }, HIDE_DELAY);
    } else {
      logTooltip("TooltipManager", `Hide timer already exists, no action needed`);
    }
  };
  return {
    activeTooltipId,
    isAnyTooltipVisible,
    showTooltip,
    hideTooltip,
  };
}
