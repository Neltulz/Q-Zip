<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/NotificationDisplay.vue @preserve -->
<template>
  <div
    ref="popoverRef"
    class="popover"
    :class="[{ 'is-visible': isVisible, 'is-clipped': isClipped }]"
    :style="popoverPositionStyle"
    data-component-name="NotificationDisplay"
    @mouseenter="pauseTimeout"
    @mouseleave="resumeTimeout"
  >
    <div class="popover__indicator-container">
      <div ref="indicatorRef" class="popover__indicator"></div>
    </div>

    <CustomButton
      button-style-class="trans-btn"
      class="close-button"
      data-name="close-notification-btn"
      first-icon-name="mdi:close"
      :first-icon-size="18"
      @click="closeNotification"
    />
    <div class="popover__content">
      <h1>{{ notification.title }}</h1>
      <div v-for="(msg, index) in notification.messages" :key="index" class="message-line">
        <Icon :name="getIconForType(msg.type)" :class="`icon-${msg.type}`" size="18" />
        <p :class="`text-${msg.type}`">{{ msg.text }}</p>
        <Icon
          v-if="msg.details && msg.details.filePaths.length > 0"
          name="mdi:information-outline"
          class="info-icon"
          size="16"
          @mouseenter="handleIconMouseEnter(msg.details, $event)"
          @mouseleave="scheduleTooltipHide"
        />
      </div>
    </div>

    <div class="popover__triangle" :style="triangleTransformStyle"></div>

    <InfoTooltip
      v-if="tooltip.content"
      :visible="tooltip.visible"
      :content="tooltip.content"
      :target-rect="tooltip.targetRect"
      @mouseenter="cancelTooltipHide"
      @mouseleave="scheduleTooltipHide"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, type PropType, nextTick, type StyleValue, reactive } from "vue";
import { useUiStore, type Notification, type NotificationType, type NotificationMessageDetails } from "@/stores/uiStore";
import { useScrollContainer } from "@/composables/useScrollContainer";
import CustomButton from "./CustomButton.vue";
import InfoTooltip from "./InfoTooltip.vue";

const props = defineProps({
  notification: {
    type: Object as PropType<Notification>,
    required: true,
  },
});

const uiStore = useUiStore();
const { scrollContainer } = useScrollContainer();

const popoverRef = ref<HTMLElement | null>(null);
const indicatorRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const isClipped = ref(false);
const scrollLeft = ref(0);
const scrollTop = ref(0);
let isUpdateThrottled = false;
let remainingScaleX = 1;
let hideTooltipTimeout: number | null = null;

const tooltip = reactive<{
  visible: boolean;
  content: NotificationMessageDetails | null;
  targetRect: DOMRect | null;
}>({
  visible: false,
  content: null,
  targetRect: null,
});

// --- FEAT: Improved tooltip hover logic ---
const handleIconMouseEnter = (details: NotificationMessageDetails, event: MouseEvent) => {
  if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
  pauseTimeout(); // Pause main notification timer
  tooltip.content = details;
  tooltip.targetRect = (event.target as HTMLElement).getBoundingClientRect();
  tooltip.visible = true;
};

const scheduleTooltipHide = () => {
  if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
  hideTooltipTimeout = window.setTimeout(() => {
    tooltip.visible = false;
    resumeTimeout(); // Resume main notification timer only when tooltip is confirmed to hide
  }, 200);
};

const cancelTooltipHide = () => {
  if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
  pauseTimeout(); // Keep main notification paused
};
// --- End of tooltip hover logic ---

const closeNotification = () => {
  uiStore.removeNotification(props.notification.id);
};

const getIconForType = (type: NotificationType): string => {
  switch (type) {
    case "success":
      return "mdi:check-circle-outline";
    case "warning":
      return "mdi:alert-circle-outline";
    case "error":
      return "mdi:close-circle-outline";
    default:
      return "mdi:information-outline";
  }
};

const popoverMetrics = computed(() => {
  if (!popoverRef.value || !scrollContainer.value || !props.notification.position) return null;
  return {
    popoverWidth: popoverRef.value.offsetWidth,
    popoverHeight: popoverRef.value.offsetHeight,
    triggerRect: props.notification.position,
    containerRect: scrollContainer.value.getBoundingClientRect(),
  };
});

const popoverPositionStyle = computed((): StyleValue => {
  const metrics = popoverMetrics.value;
  if (!metrics) return { visibility: "hidden" as const };
  const { popoverWidth, popoverHeight, triggerRect, containerRect } = metrics;
  const triggerLeftInsideContainer = triggerRect.left - scrollLeft.value;
  const triggerTopInsideContainer = triggerRect.top - scrollTop.value;
  const currentTriggerLeft = containerRect.left + triggerLeftInsideContainer;
  const currentTriggerTop = containerRect.top + triggerTopInsideContainer;
  const idealLeft = currentTriggerLeft + triggerRect.width / 2 - popoverWidth / 2;
  let clampedLeft = idealLeft;
  if (clampedLeft < containerRect.left) clampedLeft = containerRect.left;
  if (clampedLeft + popoverWidth > containerRect.right) clampedLeft = containerRect.right - popoverWidth;
  const finalTop = currentTriggerTop - popoverHeight - 8;
  return {
    visibility: "visible" as const,
    top: `${finalTop}px`,
    left: `${clampedLeft}px`,
    maxWidth: `${containerRect.width}px`,
  };
});

const triangleTransformStyle = computed((): StyleValue => {
  const metrics = popoverMetrics.value;
  const style = popoverPositionStyle.value;
  if (!metrics || !style || typeof style !== "object" || !("left" in style) || typeof style.left !== "string") {
    return { left: "50%", transform: "translateX(-50%)" };
  }
  const popoverLeft = parseFloat(style.left);
  const { popoverWidth, triggerRect, containerRect } = metrics;
  const triggerVisual = {
    left: containerRect.left + (triggerRect.left - scrollLeft.value),
    width: triggerRect.width,
    borderRadius: 6,
  };
  const idealLeft = triggerVisual.left + triggerVisual.width / 2 - popoverWidth / 2;
  const isClamped = Math.abs(popoverLeft - idealLeft) > 1;
  let newTriangleLeft;
  let skewAngle = 0;
  const triangleHalfWidth = 6;
  const popoverBorderRadius = 8;
  const minTriangleClamp = popoverBorderRadius + triangleHalfWidth;
  const maxTriangleClamp = popoverWidth - popoverBorderRadius - triangleHalfWidth;
  if (!isClamped) {
    const triggerCenterX = triggerVisual.left + triggerVisual.width / 2;
    newTriangleLeft = triggerCenterX - popoverLeft;
  } else {
    const totalScrollableDistance = triggerVisual.width / 2 + popoverWidth / 2 - 2 * minTriangleClamp;
    const currentScrollDistance = Math.abs(idealLeft - popoverLeft);
    const scrollPercent = totalScrollableDistance > 0 ? Math.min(1, currentScrollDistance / totalScrollableDistance) : 0;
    const maxSkew = 45;
    skewAngle = scrollPercent * maxSkew;
    if (popoverLeft > idealLeft) skewAngle = -skewAngle;
    const startPosOnTrigger = triggerVisual.width / 2;
    let triangleXOnTrigger;
    if (popoverLeft > idealLeft) {
      const endPosOnTrigger = triggerVisual.width - triggerVisual.borderRadius - triangleHalfWidth;
      triangleXOnTrigger = startPosOnTrigger + (endPosOnTrigger - startPosOnTrigger) * scrollPercent;
    } else {
      const endPosOnTrigger = triggerVisual.borderRadius + triangleHalfWidth;
      triangleXOnTrigger = startPosOnTrigger - (startPosOnTrigger - endPosOnTrigger) * scrollPercent;
    }
    newTriangleLeft = triggerVisual.left - popoverLeft + triangleXOnTrigger;
  }
  newTriangleLeft = Math.max(minTriangleClamp, Math.min(newTriangleLeft, maxTriangleClamp));
  return {
    left: `${newTriangleLeft}px`,
    transform: `translateX(-50%) skewX(${skewAngle}deg)`,
  };
});

watch(
  () => [popoverMetrics.value, popoverPositionStyle.value, triangleTransformStyle.value],
  ([metrics, style, triangleStyle]) => {
    if (
      !metrics ||
      typeof metrics !== "object" ||
      !("triggerRect" in metrics) ||
      !("containerRect" in metrics) ||
      !style ||
      typeof style !== "object" ||
      !("left" in style) ||
      typeof style.left !== "string" ||
      !triangleStyle ||
      typeof triangleStyle !== "object" ||
      !("left" in triangleStyle) ||
      typeof triangleStyle.left !== "string"
    ) {
      isClipped.value = false;
      return;
    }
    const popoverLeft = parseFloat(style.left);
    const triggerVisual = {
      left: metrics.containerRect.left + (metrics.triggerRect.left - scrollLeft.value),
      width: metrics.triggerRect.width,
      borderRadius: 6,
    };
    const triangleAbsoluteX = popoverLeft + parseFloat(triangleStyle.left);
    const triggerSafeZoneLeft = triggerVisual.left + triggerVisual.borderRadius;
    const triggerSafeZoneRight = triggerVisual.left + triggerVisual.width - triggerVisual.borderRadius;
    isClipped.value = triangleAbsoluteX < triggerSafeZoneLeft || triangleAbsoluteX > triggerSafeZoneRight;
  },
  { deep: true, flush: "post" }
);

const startTimeout = () => {
  const durationInMs = props.notification.duration ?? 5000;
  if (indicatorRef.value) {
    const indicator = indicatorRef.value;
    const durationInSec = durationInMs / 1000;
    indicator.style.transition = "none";
    indicator.style.transform = "scaleX(1)";
    const onTransitionEnd = () => {
      uiStore.removeNotification(props.notification.id);
      indicator.removeEventListener("transitionend", onTransitionEnd);
    };
    indicator.addEventListener("transitionend", onTransitionEnd);
    void indicator.offsetWidth;
    indicator.style.transition = `transform ${durationInSec}s linear`;
    indicator.style.transform = "scaleX(0)";
  }
};

const pauseTimeout = () => {
  if (indicatorRef.value) {
    const computedStyle = window.getComputedStyle(indicatorRef.value);
    const matrix = new DOMMatrix(computedStyle.transform);
    remainingScaleX = matrix.m11;
    indicatorRef.value.style.transform = `scaleX(${remainingScaleX})`;
    indicatorRef.value.style.transition = "none";
    uiStore.pauseNotificationTimeout(props.notification.id);
  }
};

const resumeTimeout = () => {
  const durationInMs = props.notification.duration ?? 5000;
  if (indicatorRef.value) {
    const fullDuration = durationInMs / 1000;
    const remainingDuration = fullDuration * remainingScaleX;
    indicatorRef.value.style.transition = `transform ${remainingDuration}s linear`;
    indicatorRef.value.style.transform = "scaleX(0)";
    uiStore.resumeNotificationTimeout(props.notification.id);
  }
};

const handleScroll = () => {
  if (isUpdateThrottled) return;
  isUpdateThrottled = true;
  requestAnimationFrame(() => {
    if (scrollContainer.value) {
      scrollLeft.value = scrollContainer.value.scrollLeft;
      scrollTop.value = scrollContainer.value.scrollTop;
    }
    isUpdateThrottled = false;
  });
};

onMounted(() => {
  if (scrollContainer.value) {
    scrollLeft.value = scrollContainer.value.scrollLeft;
    scrollTop.value = scrollContainer.value.scrollTop;
    scrollContainer.value.addEventListener("scroll", handleScroll, { passive: true });
  }
  nextTick(() => {
    isVisible.value = true;
    startTimeout();
  });
});

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener("scroll", handleScroll);
  }
  if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
});

watch(scrollContainer, (newContainer, oldContainer) => {
  if (oldContainer) oldContainer.removeEventListener("scroll", handleScroll);
  if (newContainer) newContainer.addEventListener("scroll", handleScroll, { passive: true });
});
</script>

<style scoped>
.popover {
  position: absolute;
  background-color: var(--bg-clr-liter);
  color: var(--txt-clr);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: max-content;
  min-width: 220px;
  z-index: 10000;
  opacity: 0;
  transform-origin: bottom center;
  transform: scale(0.95);
  transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
  pointer-events: none;
  box-sizing: border-box;
}

.popover.is-visible {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.popover.is-visible.is-clipped {
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
}

.popover__triangle {
  position: absolute;
  top: 100%;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid var(--bg-clr-liter);
  transition: transform 0.15s ease-in-out;
}

.popover h1 {
  display: block;
  margin: 0 0 4px 0;
  padding-right: 24px; /* Space for close button */
  font-size: inherit;
  font-weight: 600;
  text-wrap: balance;
  text-align: left;
}

.popover__indicator-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8px;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.popover__indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  transform: scaleX(1);
  transform-origin: left center;
  background-color: hsl(0deg 0% 70%);
}

.popover__content {
  margin-top: 3px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-line {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.message-line p {
  margin: 0;
  flex-grow: 1;
}

.message-line .icon {
  flex-shrink: 0;
}

.close-button {
  position: absolute;
  top: 4px;
  right: 4px;
  --btn-bg-hvr-clr: var(--bg-clr-lite);
}

.info-icon {
  color: var(--txt-clr-dark);
  cursor: help;
  margin-left: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}
.info-icon:hover {
  opacity: 1;
}

.text-success {
  color: hsla(var(--success-hue, 145), var(--success-sat, 63%), 45%, 1);
}
.text-warning {
  color: hsla(var(--warning-hue, 45), var(--warning-sat, 100%), 50%, 1);
}
.text-error {
  color: hsla(var(--danger-hue, 0), var(--danger-sat, 65%), 55%, 1);
}
.text-info {
  color: hsla(var(--blu-hue, 204), var(--blu-sat, 100%), 50%, 1);
}

.icon-success {
  color: hsla(var(--success-hue, 145), var(--success-sat, 63%), 45%, 1);
}
.icon-warning {
  color: hsla(var(--warning-hue, 45), var(--warning-sat, 100%), 50%, 1);
}
.icon-error {
  color: hsla(var(--danger-hue, 0), var(--danger-sat, 65%), 55%, 1);
}
.icon-info {
  color: hsla(var(--blu-hue, 204), var(--blu-sat, 100%), 50%, 1);
}
</style>
