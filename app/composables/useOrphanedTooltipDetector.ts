// 
// app/composables/useOrphanedTooltipDetector.ts
import { onMounted, onUnmounted, type Ref } from "vue";
import { useTooltipManager } from "./useTooltipManager";
import { logTooltip } from "@/utils/loggers";

/**
 * A composable that provides utilities for detecting and handling orphaned tooltips.
 * This helps prevent tooltips from remaining visible when their target elements
 * are removed from the DOM or hidden (e.g., when dropdowns close unexpectedly).
 */
export function useOrphanedTooltipDetector() {
  const tooltipManager = useTooltipManager();

  /**
   * Check if a tooltip's target element is still valid and visible.
   * If not, hide the tooltip to prevent orphaned tooltips.
   * @param targetElement The element that the tooltip should be attached to
   * @param tooltipName Optional name for logging purposes
   * @returns true if the tooltip was hidden due to invalid target, false otherwise
   */
  const checkAndHideOrphanedTooltip = (targetElement: HTMLElement | null, tooltipName?: string): boolean => {
    return tooltipManager.checkAndHideOrphanedTooltip(targetElement);
  };

  /**
   * Check multiple tooltip targets at once and hide any orphaned tooltips.
   * Useful when a container (like a dropdown) closes and multiple tooltips might be orphaned.
   * @param targets Array of objects with target elements and optional names
   */
  const checkMultipleTooltipTargets = (targets: Array<{ element: HTMLElement | null; name?: string }>) => {
    targets.forEach(({ element, name }) => {
      if (element) {
        const wasHidden = tooltipManager.checkAndHideOrphanedTooltip(element);
        if (wasHidden) {
          logTooltip("OrphanedTooltipDetector", `Hidden orphaned tooltip for ${name || 'unknown target'}`);
        }
      }
    });
  };

  /**
   * Set up automatic orphaned tooltip detection for a component.
   * This will periodically check if the current active tooltip's target is still valid.
   * @param checkIntervalMs How often to check for orphaned tooltips (default: 1000ms)
   * @returns Functions to start and stop the automatic detection
   */
  const setupAutomaticDetection = (checkIntervalMs: number = 1000) => {
    let detectionInterval: number | null = null;

    const startDetection = () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }

      detectionInterval = window.setInterval(() => {
        // This is a basic check - components can implement more specific checks
        // by calling checkAndHideOrphanedTooltip with their specific target elements
        if (tooltipManager.isAnyTooltipVisible.value) {
          logTooltip("OrphanedTooltipDetector", "Automatic detection: tooltip is visible, consider checking targets");
        }
      }, checkIntervalMs);
    };

    const stopDetection = () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
      }
    };

    return {
      startDetection,
      stopDetection
    };
  };

  /**
   * Create a cleanup function for a specific tooltip target.
   * This is useful for components that want to ensure their tooltips are cleaned up
   * when the component unmounts or when certain events occur.
   * @param targetRef A ref to the target element
   * @param tooltipName Optional name for logging
   * @returns A cleanup function that should be called when the target is no longer valid
   */
  const createTargetCleanup = (targetRef: Ref<HTMLElement | null>, tooltipName?: string) => {
    return () => {
      const element = targetRef.value;
      if (element) {
        const wasHidden = tooltipManager.checkAndHideOrphanedTooltip(element);
        if (wasHidden) {
          logTooltip("OrphanedTooltipDetector", `Cleanup: Hidden orphaned tooltip for ${tooltipName || 'target'}`);
        }
      }
    };
  };

  return {
    checkAndHideOrphanedTooltip,
    checkMultipleTooltipTargets,
    setupAutomaticDetection,
    createTargetCleanup
  };
}
