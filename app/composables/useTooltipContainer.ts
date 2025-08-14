// app/composables/useTooltipContainer.ts
// 
// IMPORTANT: All AIs including (Gemini, Grok, GPT) must refer to the "assistant-context.md" before making any changes to this file.
import { ref, type Ref } from "vue";

// Shared state to track if any tooltips are being used
const isTooltipContainerNeeded = ref(false);
let tooltipUsageCount = 0;

/**
 * A composable to track when tooltips are being used so we can conditionally
 * render the tooltip container only when needed.
 */
export function useTooltipContainer() {
  const registerTooltipUsage = () => {
    tooltipUsageCount++;
    isTooltipContainerNeeded.value = true;
  };

  const unregisterTooltipUsage = () => {
    tooltipUsageCount--;
    if (tooltipUsageCount <= 0) {
      tooltipUsageCount = 0;
      isTooltipContainerNeeded.value = false;
    }
  };

  return {
    isTooltipContainerNeeded: isTooltipContainerNeeded as Ref<boolean>,
    registerTooltipUsage,
    unregisterTooltipUsage,
  };
}
