// 
// app/composables/useDropdownTooltipManager.ts
import { useTooltipManager } from "@/composables/useTooltipManager";
import { logTooltip } from "@/utils/loggers";

/**
 * A composable that automatically manages the relationship between dropdowns and their associated tooltips.
 * When a dropdown opens, it immediately hides any associated tooltip to prevent the tooltip from appearing
 * on top of the dropdown content.
 */
export function useDropdownTooltipManager() {
  const tooltipManager = useTooltipManager();

  /**
   * Creates a dropdown opened event handler that immediately hides the associated tooltip.
   * This should be used as the @dropdown-opened event handler for any dropdown that has an associated tooltip.
   * 
   * @param tooltipId - The ID of the tooltip to hide (optional, if not provided will hide any active tooltip)
   * @returns A function that can be used as the @dropdown-opened event handler
   */
  const createDropdownOpenedHandler = (tooltipId?: string) => {
    return () => {
      logTooltip("DropdownTooltipManager", `Dropdown opened, hiding tooltip`, {
        tooltipId: tooltipId || 'any active tooltip',
        activeTooltipId: tooltipManager.activeTooltipId.value
      });

      if (tooltipId) {
        // If a specific tooltip ID is provided, only hide that tooltip
        if (tooltipManager.activeTooltipId.value === tooltipId) {
          tooltipManager.hideTooltipImmediately();
        }
      } else {
        // If no specific tooltip ID is provided, hide any active tooltip
        tooltipManager.hideTooltipImmediately();
      }
    };
  };

  return {
    tooltipManager,
    createDropdownOpenedHandler,
  };
}
