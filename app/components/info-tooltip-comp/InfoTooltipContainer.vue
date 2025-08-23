<template>
  <teleport to="body">
    <div v-if="shouldShow" id="tooltip-container">
      <Transition name="tooltip-fade">
        <div ref="floatingRef" class="info-tooltip" :style="styles" :class="{
            interactive: descriptor?.props?.interactive,
            'simple-tooltip': !descriptor?.props?.interactive,
            'disabled-target': descriptor?.props?.disabled
          }" key="global-info-tooltip">
          <div class="tooltip-content">
            <component :is="descriptor?.component || 'div'" v-bind="descriptor?.props" />
            <div v-if="descriptor?.text && !descriptor?.component" class="info-line tooltip-text-content">{{ descriptor.text }}</div>
          </div>
          <svg ref="arrowRef" class="tooltip-arrow" :data-side="side" :style="arrowStyle" viewBox="0 0 16 9"><path d="M 0 0 L 8 8 L 16 0" /></svg>
        </div>
      </Transition>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useTooltipManager } from '@/composables/useTooltipManager';
import { useFloating, autoUpdate, offset, flip, shift, arrow } from '@floating-ui/vue';

const { activeTooltipId, getTooltipDescriptor, registerContainer } = useTooltipManager();

const descriptor = ref<any | null>(null);
// Keep last-known Element references per tooltip id to avoid losing the
// positioning reference when descriptors briefly re-register without a target
// during dropdown/open/close transitions.
const lastKnownTargetById = new Map<string, Element>();
const shouldShow = computed(() => !!activeTooltipId.value && !!descriptor.value);

// Floating refs
const floatingRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);

// Reactive floating reference used by useFloating. Prefer descriptor target;
// if missing, fall back to the last-known Element for the active tooltip id.
const reference = computed(() => {
  const rawTarget = descriptor.value?.target || null;
  if (rawTarget) {
    // Unwrap refs if necessary
    const unwrapped = rawTarget && (rawTarget.value !== undefined ? rawTarget.value : rawTarget);
    if (unwrapped instanceof Element) {
      // If the element has zero rect, try to find a visible ancestor and
      // prefer that as the reference so Floating UI can compute positions.
      try {
        const r = (unwrapped as Element).getBoundingClientRect();
        if ((r.width || r.height) === 0) {
          const fallback = findVisibleAncestor(unwrapped as Element);
          if (fallback) {
            // cache fallback for this tooltip id
            const id = descriptor.value?.id || activeTooltipId.value;
            if (id) lastKnownTargetById.set(id, fallback);
            return fallback;
          }
        }
      } catch (e) {
        /* ignore */
      }
      return unwrapped;
    }
    return rawTarget;
  }
  const id = activeTooltipId.value;
  if (id) {
    return lastKnownTargetById.get(id) || null;
  }
  return null;
});

const { floatingStyles, middlewareData, placement, update } = useFloating(reference, floatingRef, {
  whileElementsMounted: autoUpdate,
  placement: computed(() => descriptor.value?.props?.placement || 'bottom'),
  middleware: [
    offset(8),
    flip({ fallbackPlacements: ['bottom-start', 'bottom-end', 'right-start', 'right-end', 'left-start', 'left-end', 'top-start', 'top-end'] }),
    shift({ padding: 8 }),
    arrow({ element: arrowRef, padding: 8 }),
  ],
});

const side = computed(() => placement.value.split('-')[0]);

const arrowStyle = computed(() => {
  const data: any = (middlewareData as any).value?.arrow || {};
  const x = data.x;
  const y = data.y;
  const currentSide = side.value || 'bottom';

  // Measure arrow element dimensions when available
  const arrowDimensions = (() => {
    try {
      const el = arrowRef.value as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        return { width: rect.width || 16, height: rect.height || 9 };
      }
    } catch (e) {
      /* ignore */
    }
    return { width: 16, height: 9 };
  })();

  // Map logical side to static inset property used to offset arrow outside tooltip box
  const logicalSideMap: Record<string, string> = {
    top: 'insetBlockEnd',
    right: 'insetInlineStart',
    bottom: 'insetBlockStart',
    left: 'insetInlineEnd',
  };

  const staticSide = logicalSideMap[currentSide as keyof typeof logicalSideMap] || 'insetBlockStart';
  const offsetValue = `-${Math.round(arrowDimensions.height)}px`;

  const style: Record<string, any> = {};
  if (x != null) style.insetInlineStart = `${x}px`;
  if (y != null) style.insetBlockStart = `${y}px`;

  // Apply the static side offset so the arrow sits outside the tooltip edge
  style[staticSide] = offsetValue;

  return style;
});

// Helper: climb up the DOM to find a visible ancestor (non-zero rect) or
// a likely trigger element (buttons / custom-button) to use as a fallback
const findVisibleAncestor = (el: Element | null): Element | null => {
  if (!el) return null;
  let current: Element | null = el;
  for (let i = 0; i < 6 && current; i++) {
    try {
      const r = current.getBoundingClientRect();
      if ((r.width || r.height) > 0) return current;
    } catch (e) {
      /* ignore */
    }
    // prefer obvious trigger elements
    if (current.tagName === 'BUTTON' || current.classList.contains('custom-button') || current.classList.contains('options-btn')) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

// Styles for floating element (map floatingStyles to inline style)
const styles = computed<any>(() => {
  // floatingStyles.value comes from @floating-ui/vue and may contain transform/left/top
  return Object.assign({ position: 'fixed' }, (floatingStyles.value as Record<string, any>) || {});
});

watch(activeTooltipId, (id) => {
  if (id) {
    descriptor.value = getTooltipDescriptor(id);
    // Preserve last-known target when descriptor provides one
    try {
      const maybeTarget = descriptor.value?.target;
      const unwrapped = maybeTarget && (maybeTarget.value !== undefined ? maybeTarget.value : maybeTarget);
      if (unwrapped instanceof Element) {
        lastKnownTargetById.set(id, unwrapped);
      }
    } catch (e) {
      /* ignore */
    }
    // Ensure floating updates when descriptor changes
    nextTick(async () => {
      // Force a position update in case the descriptor target changed
      try { await update(); } catch (e) { /* ignore */ }

      // Targeted debug log to diagnose positioning issues. Prints descriptor id,
      // whether the container has a concrete Element reference, its rect, and
      // floating styles/middleware arrow data after the update call.
      try {
        const desc = descriptor.value;
        const rawTarget = desc?.target;
        const unwrapped = rawTarget && (rawTarget.value !== undefined ? rawTarget.value : rawTarget);
        const isElement = unwrapped instanceof Element;
        let rect = isElement ? (unwrapped as Element).getBoundingClientRect() : null;
        let usedFallback = false;
        if (isElement && rect && rect.width === 0 && rect.height === 0) {
          const fallback = findVisibleAncestor(unwrapped as Element);
          if (fallback && fallback !== unwrapped) {
            usedFallback = true;
            rect = fallback.getBoundingClientRect();
          }
        }
        console.debug("[TooltipContainerDebug] update", {
          activeId: id,
          descriptorId: desc?.id ?? null,
          targetIsElement: isElement,
          target: isElement ? unwrapped : rawTarget,
          usedFallback,
          rect,
          floatingStyles: (floatingStyles as any).value,
          arrowMiddleware: (middlewareData as any).value?.arrow ?? null,
          placement: (placement as any).value,
        });
      } catch (e) {
        console.error("[TooltipContainerDebug] failed to log update details", e);
      }
    });
    // Floating debug logs removed.
    // If Floating didn't produce a useful position (0,0), apply a manual fallback
    // using the cached rect or visible ancestor we computed above.
    nextTick(() => {
      try {
        const fs = (floatingStyles as any).value || {};
        const transform = fs.transform || '';
        const isZeroTransform = (typeof fs.left === 'undefined' && typeof fs.top === 'undefined') && /translate\(0px, 0px\)/.test(transform);
        if (isZeroTransform) {
          const id2 = activeTooltipId.value;
          const desc2 = descriptor.value;
          const rawTarget2 = desc2?.target;
          const unwrapped2 = rawTarget2 && (rawTarget2.value !== undefined ? rawTarget2.value : rawTarget2);
          let anchor: Element | null = null;
          if (unwrapped2 instanceof Element) anchor = unwrapped2;
          if ((!anchor || (anchor.getBoundingClientRect().width === 0 && anchor.getBoundingClientRect().height === 0)) && id2) {
            anchor = lastKnownTargetById.get(id2) || findVisibleAncestor(anchor as Element);
          }
          if (anchor) {
            const r = anchor.getBoundingClientRect();
            const top = Math.round(r.bottom + 8);
            const left = Math.round(r.left + (r.width / 2));
            (floatingStyles as any).value = { position: 'fixed', left: `${left}px`, top: `${top}px`, transform: 'translate(-50%, 0)' };
            (middlewareData as any).value = (middlewareData as any).value || {};
            (middlewareData as any).value.arrow = { x: 0, y: 0 };
            console.debug('[TooltipContainerDebug] applied manual fallback position', { id: id2, left, top, anchor });
          }
        }
      } catch (e) {
        /* ignore fallback errors */
      }
    });
  } else {
    descriptor.value = null;
  }
});

// Register as the container
registerContainer();
</script>

<style scoped>
@import './info-tooltip.scoped.css';

.info-tooltip { position: fixed; z-index: 999999; }

.tooltip-arrow { position: absolute; }

/* Ensure SVG path inherits CSS fill/stroke */
.tooltip-arrow path { vector-effect: non-scaling-stroke; }
</style>
