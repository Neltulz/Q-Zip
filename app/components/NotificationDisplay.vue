<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/NotificationDisplay.vue @preserve -->
<template>
  <div
    ref="popoverRef"
    class="popover"
    :class="[{ 'is-visible': isVisible && !notification.isRemoving, 'is-clipped': isClipped }]"
    :style="popoverPositionStyle"
    data-component-name="NotificationDisplay"
    @mouseenter="handlePopoverMouseEnter"
    @mouseleave="handlePopoverMouseLeave"
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
          v-if="msg.details && msg.details.filePaths && msg.details.filePaths.length > 0"
          name="mdi:information-outline"
          class="info-icon"
          size="16"
          @mouseenter="handleIconMouseEnter(msg.details, $event)"
          @mouseleave="handleIconMouseLeave"
        />
      </div>
    </div>

    <div class="popover__triangle" :style="triangleTransformStyle"></div>

    <InfoTooltip
      :visible="tooltip.visible && !!tooltip.content"
      :content="tooltip.content || { text: '' }"
      :target="tooltip.targetElement"
      :interactive="true"
      placement="right"
      :fallback-placements="['right-start', 'right-end', 'bottom-start', 'bottom-end']"
      @mouseenter="handleTooltipMouseEnter"
      @mouseleave="handleTooltipMouseLeave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, type PropType, nextTick, type StyleValue, reactive } from "vue";
import { useUiStore, type Notification, type NotificationType, type NotificationMessageDetails } from "@/stores/uiStore";
import { useScrollContainer } from "@/composables/useScrollContainer";
import CustomButton from "./CustomButton.vue";
import InfoTooltip from "./InfoTooltipContainer.vue";
import { logUI, logNotification } from "@/utils/loggers";

const props = defineProps({
  notification: {
    type: Object as PropType<Notification>,
    required: true,
  },
});

console.log(`[NotificationDisplay] Mounting with notification:`, {
  id: props.notification.id,
  title: props.notification.title,
  messages: props.notification.messages,
  type: props.notification.type
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
  targetElement: HTMLElement | null;
}>({
  visible: false,
  content: null,
  targetElement: null,
});

// Track hover state for both notification and tooltip
const isHovering = reactive({
  notification: false,
  tooltip: false,
});

// Computed to check if user is hovering over either element
const isUserHovering = computed(() => isHovering.notification || isHovering.tooltip);

// --- FEAT: Improved tooltip hover logic ---
const handleIconMouseEnter = (details: NotificationMessageDetails, event: MouseEvent) => {
  logUI("NotificationDisplay", "Icon mouse enter", { details, target: event.target });
  
  if (hideTooltipTimeout) {
    logUI("NotificationDisplay", "Clearing existing hide timeout");
    clearTimeout(hideTooltipTimeout);
  }
  
  pauseTimeout(); // Pause main notification timer
  logUI("NotificationDisplay", "Paused notification timeout");

  // Only update content and target if they've changed to avoid re-renders
  if (tooltip.content !== details) {
    logUI("NotificationDisplay", "Updating tooltip content", { oldContent: tooltip.content, newContent: details });
    tooltip.content = details;
  }
  if (tooltip.targetElement !== event.target) {
    logUI("NotificationDisplay", "Updating tooltip target", { oldTarget: tooltip.targetElement, newTarget: event.target });
    tooltip.targetElement = event.target as HTMLElement;
  }

  tooltip.visible = true;
  logUI("NotificationDisplay", "Tooltip made visible", { visible: tooltip.visible, content: tooltip.content });
};

const handleIconMouseLeave = () => {
  logUI("NotificationDisplay", "Icon mouse leave - scheduling tooltip hide");
  // Give user time to move from icon to tooltip
  scheduleTooltipHide();
};

const scheduleTooltipHide = () => {
  logUI("NotificationDisplay", "Scheduling tooltip hide", { currentTimeout: hideTooltipTimeout });
  
  if (hideTooltipTimeout) {
    logUI("NotificationDisplay", "Clearing existing hide timeout");
    clearTimeout(hideTooltipTimeout);
  }
  
  hideTooltipTimeout = window.setTimeout(() => {
    logUI("NotificationDisplay", "Hide timeout fired - hiding tooltip");
    tooltip.visible = false;
    
    // Only resume timeout if user is not hovering over either element
    if (!isUserHovering.value) {
      logUI("NotificationDisplay", "Tooltip hidden, user not hovering - resuming notification timeout");
      resumeTimeout();
    } else {
      logUI("NotificationDisplay", "Tooltip hidden, but user still hovering over notification - keeping timeout paused");
    }
  }, 300); // Increased delay to give more time to move to tooltip
  
  logUI("NotificationDisplay", "Hide timeout scheduled", { timeoutId: hideTooltipTimeout });
};

const handleTooltipMouseEnter = () => {
  logUI("NotificationDisplay", "Tooltip mouse enter - canceling hide timeout");
  
  if (hideTooltipTimeout) {
    logUI("NotificationDisplay", "Clearing hide timeout");
    clearTimeout(hideTooltipTimeout);
  }
  
  isHovering.tooltip = true;
  logUI("NotificationDisplay", "User entered tooltip - pausing timeout");
  pauseTimeout(); // Ensure timeout is paused when entering tooltip
};

const handleTooltipMouseLeave = () => {
  logUI("NotificationDisplay", "Tooltip mouse leave - scheduling hide");
  isHovering.tooltip = false;
  
  // Schedule tooltip hide
  scheduleTooltipHide();
  
  // Don't resume timeout here - let the hide timeout handle it
  // This allows moving from tooltip to notification without resuming
  logUI("NotificationDisplay", "User left tooltip - keeping timeout paused until hide");
};
// --- End of tooltip hover logic ---

const closeNotification = () => {
  // Disabled logging for notifications
  // logNotification("NotificationDisplay", "Closing notification", { id: props.notification.id });
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
  if (!popoverRef.value || !props.notification.position) {
    console.log(`[NotificationDisplay] No position data for notification:`, props.notification.id);
    return null;
  }
  return {
    popoverWidth: popoverRef.value.offsetWidth,
    popoverHeight: popoverRef.value.offsetHeight,
    triggerRect: props.notification.position,
    containerRect: { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight },
  };
});

const popoverPositionStyle = computed((): StyleValue => {
  const metrics = popoverMetrics.value;
  if (!metrics) {
    // Fallback positioning for notifications without position data
    console.log(`[NotificationDisplay] Using fallback positioning for notification:`, props.notification.id);
    return {
      visibility: "visible" as const,
      position: "fixed" as const,
      top: "20px",
      right: "20px",
      maxWidth: "400px",
      zIndex: 10000,
    };
  }
  
  const { popoverWidth, popoverHeight, triggerRect } = metrics;
  
  // Simplified positioning logic - position above the trigger element
  const idealLeft = triggerRect.left + (triggerRect.width / 2) - (popoverWidth / 2);
  let clampedLeft = idealLeft;
  
  // Ensure notification doesn't go off-screen
  if (clampedLeft < 20) clampedLeft = 20;
  if (clampedLeft + popoverWidth > window.innerWidth - 20) {
    clampedLeft = window.innerWidth - popoverWidth - 20;
  }
  
  const finalTop = triggerRect.top - popoverHeight - 8;
  
  console.log(`[NotificationDisplay] Positioning notification:`, {
    id: props.notification.id,
    triggerRect,
    popoverWidth,
    popoverHeight,
    idealLeft,
    clampedLeft,
    finalTop
  });
  
  return {
    visibility: "visible" as const,
    position: "fixed" as const,
    top: `${finalTop}px`,
    left: `${clampedLeft}px`,
    maxWidth: "400px",
    zIndex: 10000,
  };
});

const triangleTransformStyle = computed((): StyleValue => {
  const metrics = popoverMetrics.value;
  const style = popoverPositionStyle.value;
  if (!metrics || !style || typeof style !== "object" || !("left" in style) || typeof style.left !== "string") {
    return { left: "50%", transform: "translateX(-50%)" };
  }
  
  const popoverLeft = parseFloat(style.left);
  const { popoverWidth, triggerRect } = metrics;
  
  // Simplified triangle positioning - point to the center of the trigger element
  const triggerCenterX = triggerRect.left + (triggerRect.width / 2);
  const triangleLeft = triggerCenterX - popoverLeft;
  
  // Ensure triangle stays within the popover bounds
  const triangleHalfWidth = 6;
  const popoverBorderRadius = 8;
  const minTriangleClamp = popoverBorderRadius + triangleHalfWidth;
  const maxTriangleClamp = popoverWidth - popoverBorderRadius - triangleHalfWidth;
  const clampedTriangleLeft = Math.max(minTriangleClamp, Math.min(triangleLeft, maxTriangleClamp));
  
  return {
    left: `${clampedTriangleLeft}px`,
    transform: "translateX(-50%)",
  };
});

watch(
  () => [popoverMetrics.value, popoverPositionStyle.value, triangleTransformStyle.value],
  ([metrics, style, triangleStyle]) => {
    if (
      !metrics ||
      typeof metrics !== "object" ||
      !("triggerRect" in metrics) ||
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
    const triangleLeft = parseFloat(triangleStyle.left);
    const triangleAbsoluteX = popoverLeft + triangleLeft;
    const triggerCenterX = metrics.triggerRect.left + (metrics.triggerRect.width / 2);
    
    // Check if triangle is pointing to the trigger element
    const triangleOffset = Math.abs(triangleAbsoluteX - triggerCenterX);
    isClipped.value = triangleOffset > 20; // Allow some tolerance
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
  logUI("NotificationDisplay", "Pausing notification timeout");
  if (indicatorRef.value) {
    const computedStyle = window.getComputedStyle(indicatorRef.value);
    const matrix = new DOMMatrix(computedStyle.transform);
    remainingScaleX = matrix.m11;
    indicatorRef.value.style.transform = `scaleX(${remainingScaleX})`;
    indicatorRef.value.style.transition = "none";
    uiStore.pauseNotificationTimeout(props.notification.id);
    logUI("NotificationDisplay", "Timeout paused", { remainingScaleX });
  }
};

const resumeTimeout = () => {
  logUI("NotificationDisplay", "Resuming notification timeout");
  const durationInMs = props.notification.duration ?? 5000;
  if (indicatorRef.value) {
    const fullDuration = durationInMs / 1000;
    const remainingDuration = fullDuration * remainingScaleX;
    indicatorRef.value.style.transition = `transform ${remainingDuration}s linear`;
    indicatorRef.value.style.transform = "scaleX(0)";
    uiStore.resumeNotificationTimeout(props.notification.id);
    logUI("NotificationDisplay", "Timeout resumed", { remainingDuration });
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

const handlePopoverMouseEnter = () => {
  logUI("NotificationDisplay", "Popover mouse enter");
  isHovering.notification = true;
  
  // Always pause timeout when entering notification
  logUI("NotificationDisplay", "User entered notification - pausing timeout");
  pauseTimeout();
};

const handlePopoverMouseLeave = () => {
  logUI("NotificationDisplay", "Popover mouse leave", { 
    tooltipVisible: tooltip.visible,
    isHoveringTooltip: isHovering.tooltip 
  });
  
  isHovering.notification = false;
  
  // Only resume timeout if user is not hovering over either element
  if (!isUserHovering.value) {
    logUI("NotificationDisplay", "User left both elements - resuming timeout");
    resumeTimeout();
  } else {
    logUI("NotificationDisplay", "User still hovering over tooltip - keeping timeout paused");
  }
};

onMounted(() => {
  console.log(`[NotificationDisplay] Component mounted for notification:`, props.notification.id);
  
  if (scrollContainer.value) {
    scrollLeft.value = scrollContainer.value.scrollLeft;
    scrollTop.value = scrollContainer.value.scrollTop;
    scrollContainer.value.addEventListener("scroll", handleScroll, { passive: true });
  }
  nextTick(() => {
    console.log(`[NotificationDisplay] Setting notification visible:`, props.notification.id);
    isVisible.value = true;
    startTimeout();
  });
});

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener("scroll", handleScroll);
  }
  if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
  // Clean up tooltip state
  tooltip.visible = false;
  tooltip.content = null;
  tooltip.targetElement = null;
  // Reset hover state
  isHovering.notification = false;
  isHovering.tooltip = false;
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
  transition: opacity 0.6s ease-in-out, transform 0.6s ease-in-out;
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
  transition: transform 0.6s ease-in-out;
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
