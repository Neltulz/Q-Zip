// 
// app/composables/useTooltipManager.ts
import { ref, type Ref } from "vue";
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
    // If we are moving from one tooltip to another, cancel the hide timer
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    // If a tooltip is already visible, perform a short crossfade so the
    // tooltip fades out and the new one fades in instead of an abrupt swap.
    if (isAnyTooltipVisible.value) {
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
      }
      // If we're already showing the requested tooltip, nothing to do.
      if (activeTooltipId.value === tooltipId) return;
      if (crossfadeTimer) {
        clearTimeout(crossfadeTimer);
        crossfadeTimer = null;
      }
      // Start fade-out immediately, then switch the target and fade back in.
      isAnyTooltipVisible.value = false;
      crossfadeTimer = setTimeout(() => {
        activeTooltipId.value = tooltipId;
        isAnyTooltipVisible.value = true;
        crossfadeTimer = null;
      }, CROSSFade_DELAY);
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
    isAnyTooltipVisible,
    showTooltip,
    hideTooltip,
  };
}
