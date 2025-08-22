// 
// app/composables/useTooltipManager.ts
import { ref, type Ref } from "vue";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logTooltip } from "@/utils/loggers";
import { useDebugStore } from "@/stores/debugStore";
// Shared state for all tooltips using this manager
const isAnyTooltipVisible = ref(false);
const activeTooltipId: Ref<string | null> = ref(null);
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let crossfadeTimer: ReturnType<typeof setTimeout> | null = null;
let preventClosingCheckTimer: ReturnType<typeof setInterval> | null = null;
// Store the origin element for the active tooltip to handle Vue re-renders
let activeOriginElement: HTMLElement | null = null;
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
  const debugStore = useDebugStore();

  // Start periodic check for preventTooltipClosing setting changes
  const startPreventClosingCheck = () => {
    if (preventClosingCheckTimer) {
      clearInterval(preventClosingCheckTimer);
    }

    preventClosingCheckTimer = setInterval(() => {
      // Only check if preventTooltipClosing is disabled and we have an active tooltip
      if (isAnyTooltipVisible.value && !debugStore.debugOptions.preventTooltipClosing) {
        // Find the origin element that should have the tooltip-active class
        const originElement = document.querySelector(`[data-tooltip-active="${activeTooltipId.value}"]`);

        // If the origin element doesn't have the tooltip-active marker, try to re-add it first
        if (!originElement && !showTimer) {
          // Try to re-add the marker if the element was recreated
          const markerReAdded = reAddTooltipActiveMarker();

          if (!markerReAdded) {
            logTooltip("TooltipManager", `Origin element missing tooltip-active marker, closing tooltip`, {
              activeTooltipId: activeTooltipId.value,
              preventTooltipClosing: debugStore.debugOptions.preventTooltipClosing,
              hasShowTimer: !!showTimer,
              activeOriginElement: !!activeOriginElement
            });

            // Clear any pending timers
            if (showTimer) {
              clearTimeout(showTimer);
              showTimer = null;
            }
            if (hideTimer) {
              clearTimeout(hideTimer);
              hideTimer = null;
            }
            if (crossfadeTimer) {
              clearTimeout(crossfadeTimer);
              crossfadeTimer = null;
            }

            // Remove tooltip-active marker from origin element
            removeTooltipActiveMarker(activeTooltipId.value);

            // Hide the tooltip immediately
            activeTooltipId.value = null;
            isAnyTooltipVisible.value = false;

            // Stop periodic check since no tooltips are visible
            stopPreventClosingCheck();
          }
        }
      }
    }, 100); // Check every 100ms
  };

  // Stop periodic check
  const stopPreventClosingCheck = () => {
    if (preventClosingCheckTimer) {
      clearInterval(preventClosingCheckTimer);
      preventClosingCheckTimer = null;
    }
  };

  // Add tooltip-active marker to origin element
  const addTooltipActiveMarker = (tooltipId: string, originElement: HTMLElement) => {
    originElement.setAttribute('data-tooltip-active', tooltipId);
    activeOriginElement = originElement;
    logTooltip("TooltipManager", `Added tooltip-active marker to origin element`, {
      tooltipId,
      originElement: originElement.tagName,
      originElementClassName: originElement.className
    });
  };

  // Remove tooltip-active marker from origin element
  const removeTooltipActiveMarker = (tooltipId: string) => {
    const originElement = document.querySelector(`[data-tooltip-active="${tooltipId}"]`);
    if (originElement) {
      originElement.removeAttribute('data-tooltip-active');
      logTooltip("TooltipManager", `Removed tooltip-active marker from origin element`, {
        tooltipId,
        originElement: originElement.tagName,
        originElementClassName: originElement.className
      });
    }
    activeOriginElement = null;
  };

  // Re-add tooltip-active marker if element was recreated
  const reAddTooltipActiveMarker = () => {
    if (activeTooltipId.value && activeOriginElement) {
      // Check if the element still exists in the DOM
      if (document.contains(activeOriginElement)) {
        // Element still exists, re-add the marker
        activeOriginElement.setAttribute('data-tooltip-active', activeTooltipId.value);
        logTooltip("TooltipManager", `Re-added tooltip-active marker to origin element`, {
          tooltipId: activeTooltipId.value,
          originElement: activeOriginElement.tagName,
          originElementClassName: activeOriginElement.className
        });
        return true;
      } else {
        // Element was removed from DOM, clear the reference
        logTooltip("TooltipManager", `Origin element was removed from DOM, clearing reference`, {
          tooltipId: activeTooltipId.value
        });
        activeOriginElement = null;
        return false;
      }
    }
    logTooltip("TooltipManager", `Cannot re-add marker: no active tooltip or origin element`, {
      activeTooltipId: activeTooltipId.value,
      hasActiveOriginElement: !!activeOriginElement
    });
    return false;
  };

  const showTooltip = (tooltipId: string, originElement?: HTMLElement) => {
    logTooltip("TooltipManager", `showTooltip called for ${tooltipId}`, {
      tooltipId,
      currentActiveId: activeTooltipId.value,
      isAnyTooltipVisible: isAnyTooltipVisible.value,
      hasHideTimer: !!hideTimer,
      hasShowTimer: !!showTimer,
      hasCrossfadeTimer: !!crossfadeTimer,
      hasOriginElement: !!originElement
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

        // Add tooltip-active marker to origin element if provided
        if (originElement) {
          addTooltipActiveMarker(tooltipId, originElement);
        }

        // Start periodic check for preventTooltipClosing setting changes
        startPreventClosingCheck();
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

        // Add tooltip-active marker to origin element if provided
        if (originElement) {
          addTooltipActiveMarker(tooltipId, originElement);
        }

        // Start periodic check for preventTooltipClosing setting changes
        startPreventClosingCheck();
      }, SHOW_DELAY);
    } else {
      logTooltip("TooltipManager", `Show timer already exists for ${tooltipId}, no action needed`);
    }
  };
  const hideTooltip = () => {
    const debugStore = useDebugStore();

    // Check if tooltip closing is prevented by debug setting
    if (debugStore.debugOptions.preventTooltipClosing && isAnyTooltipVisible.value) {
      logTooltip("TooltipManager", `hideTooltip prevented by debug setting`, {
        currentActiveId: activeTooltipId.value,
        isAnyTooltipVisible: isAnyTooltipVisible.value,
        preventTooltipClosing: debugStore.debugOptions.preventTooltipClosing
      });
      return; // Don't hide the tooltip
    }

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

        // Remove tooltip-active marker from origin element
        if (activeTooltipId.value) {
          removeTooltipActiveMarker(activeTooltipId.value);
        }

        activeTooltipId.value = null;
        isAnyTooltipVisible.value = false;
        hideTimer = null;

        // Stop periodic check since no tooltips are visible
        stopPreventClosingCheck();
      }, HIDE_DELAY);
    } else {
      logTooltip("TooltipManager", `Hide timer already exists, no action needed`);
    }
  };

  const hideTooltipImmediately = () => {
    const debugStore = useDebugStore();

    // Check if tooltip closing is prevented by debug setting
    if (debugStore.debugOptions.preventTooltipClosing && isAnyTooltipVisible.value) {
      logTooltip("TooltipManager", `hideTooltipImmediately prevented by debug setting`, {
        currentActiveId: activeTooltipId.value,
        isAnyTooltipVisible: isAnyTooltipVisible.value,
        preventTooltipClosing: debugStore.debugOptions.preventTooltipClosing,
        stackTrace: new Error().stack
      });
      return; // Don't hide the tooltip
    }

    logTooltip("TooltipManager", `hideTooltipImmediately called`, {
      currentActiveId: activeTooltipId.value,
      isAnyTooltipVisible: isAnyTooltipVisible.value,
      hasShowTimer: !!showTimer,
      hasHideTimer: !!hideTimer,
      stackTrace: new Error().stack // Add stack trace to see where this is called from
    });

    // Clear any pending timers
    if (showTimer) {
      logTooltip("TooltipManager", `Clearing show timer for immediate hide`);
      clearTimeout(showTimer);
      showTimer = null;
    }
    if (hideTimer) {
      logTooltip("TooltipManager", `Clearing hide timer for immediate hide`);
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (crossfadeTimer) {
      logTooltip("TooltipManager", `Clearing crossfade timer for immediate hide`);
      clearTimeout(crossfadeTimer);
      crossfadeTimer = null;
    }

    // Hide immediately without any delay
    logTooltip("TooltipManager", `Hiding tooltip immediately`);

    // Remove tooltip-active marker from origin element
    if (activeTooltipId.value) {
      removeTooltipActiveMarker(activeTooltipId.value);
    }

    activeTooltipId.value = null;
    isAnyTooltipVisible.value = false;

    // Stop periodic check since no tooltips are visible
    stopPreventClosingCheck();
  };

  /**
   * Check if the current active tooltip's target element still exists in the DOM.
   * If not, hide the tooltip to prevent orphaned tooltips.
   * @param targetElement The element that the tooltip should be attached to
   * @returns true if the tooltip was hidden due to missing target, false otherwise
   */
  const checkAndHideOrphanedTooltip = (targetElement: HTMLElement | null): boolean => {
    const debugStore = useDebugStore();

    logTooltip("TooltipManager", `checkAndHideOrphanedTooltip called`, {
      isAnyTooltipVisible: isAnyTooltipVisible.value,
      activeTooltipId: activeTooltipId.value,
      hasTargetElement: !!targetElement,
      targetElementTagName: targetElement?.tagName,
      stackTrace: new Error().stack
    });

    if (!isAnyTooltipVisible.value || !targetElement) {
      logTooltip("TooltipManager", `checkAndHideOrphanedTooltip: No action needed`, {
        isAnyTooltipVisible: isAnyTooltipVisible.value,
        hasTargetElement: !!targetElement
      });
      return false;
    }

    // Check if the target element is still in the DOM
    if (!document.contains(targetElement)) {
      logTooltip("TooltipManager", `Target element no longer in DOM, hiding orphaned tooltip`, {
        activeTooltipId: activeTooltipId.value,
        targetElement: targetElement.tagName,
        targetElementClassName: targetElement.className
      });
      hideTooltipImmediately();
      return true;
    }

    // Check if the target element is hidden or has zero dimensions
    const rect = targetElement.getBoundingClientRect();
    const isHidden = rect.width === 0 || rect.height === 0 ||
      targetElement.style.display === 'none' ||
      targetElement.style.visibility === 'hidden' ||
      targetElement.offsetParent === null;

    if (isHidden) {
      logTooltip("TooltipManager", `Target element is hidden, hiding orphaned tooltip`, {
        activeTooltipId: activeTooltipId.value,
        targetElement: targetElement.tagName,
        targetElementClassName: targetElement.className,
        rect: { width: rect.width, height: rect.height },
        display: targetElement.style.display,
        visibility: targetElement.style.visibility,
        offsetParent: targetElement.offsetParent
      });
      hideTooltipImmediately();
      return true;
    }

    // Check if the target element is inside a dropdown that's closing
    // (dropdown content has pointer-events: none and opacity: 0 during transition)
    const dropdownContent = targetElement.closest('.dropdown-content');
    if (dropdownContent) {
      const computedStyle = window.getComputedStyle(dropdownContent);
      const hasPointerEvents = computedStyle.pointerEvents !== 'none';
      const hasOpacity = parseFloat(computedStyle.opacity) > 0;
      const hasContentReadyClass = dropdownContent.classList.contains('content-ready');

      logTooltip("TooltipManager", `Target element is inside dropdown, checking state`, {
        targetElement: targetElement.tagName,
        dropdownContent: dropdownContent.getAttribute('data-belongs-to'),
        pointerEvents: computedStyle.pointerEvents,
        opacity: computedStyle.opacity,
        hasContentReadyClass,
        isClosing: !hasPointerEvents || !hasOpacity || !hasContentReadyClass
      });

      // If dropdown content is not interactive or not visible, hide the tooltip
      if (!hasPointerEvents || !hasOpacity || !hasContentReadyClass) {
        logTooltip("TooltipManager", `Target element is in closing dropdown, hiding orphaned tooltip`, {
          activeTooltipId: activeTooltipId.value,
          targetElement: targetElement.tagName,
          dropdownContent: dropdownContent.getAttribute('data-belongs-to'),
          pointerEvents: computedStyle.pointerEvents,
          opacity: computedStyle.opacity,
          hasContentReadyClass
        });
        hideTooltipImmediately();
        return true;
      }
    } else {
      logTooltip("TooltipManager", `Target element is not inside any dropdown`, {
        targetElement: targetElement.tagName
      });
    }

    logTooltip("TooltipManager", `checkAndHideOrphanedTooltip: No orphaned tooltip detected`);
    return false;
  };

  return {
    activeTooltipId,
    isAnyTooltipVisible,
    showTooltip,
    hideTooltip,
    hideTooltipImmediately,
    checkAndHideOrphanedTooltip,
    startPreventClosingCheck,
    stopPreventClosingCheck,
    addTooltipActiveMarker,
    removeTooltipActiveMarker,
  };
}
