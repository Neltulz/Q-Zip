<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/NotificationContainer.vue @preserve -->
<!--
  Description:
  A global container that renders all active notifications from the uiStore.
  It uses <teleport> to move the notifications to the document body,
  avoiding any CSS stacking context or overflow issues from parent elements.
  It now reactively listens for the scroll container to get its position
  and move/hide notifications as the user scrolls.
-->
<template>
  <teleport to="body">
    <div data-component-name="NotificationContainer">
      <TransitionGroup name="notification-fade" tag="div" class="notification-list">
        <NotificationDisplay
          v-for="notification in uiStore.notifications"
          :key="notification.id"
          :notification="notification"
          :style="getNotificationStyle(notification)"
          @close="uiStore.removeNotification(notification.id)"
        />
      </TransitionGroup>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useUiStore, type Notification, type NotificationPosition } from "@/stores/uiStore";
import NotificationDisplay from "./NotificationDisplay.vue";
import { logNotification } from "@/utils/loggers";
import { useScrollContainer } from "@/composables/useScrollContainer";

const { scrollContainer } = useScrollContainer();
const uiStore = useUiStore();
const scrollLeft = ref(0);

const handleScroll = (event: Event) => {
  scrollLeft.value = (event.target as HTMLElement).scrollLeft;
};

watchEffect((onCleanup) => {
  const container = scrollContainer.value;

  if (container) {
    container.addEventListener("scroll", handleScroll);
    logNotification("NotificationContainer", "Scroll listener attached via provide/inject.", container);

    onCleanup(() => {
      container.removeEventListener("scroll", handleScroll);
      logNotification("NotificationContainer", "Scroll listener removed.", container);
    });
  }
});

const getNotificationStyle = (notification: Notification) => {
  if (!notification.position || !scrollContainer.value) {
    return { display: "none" };
  }

  const pos: NotificationPosition = { ...notification.position };
  const notificationWidth = 250; // Max-width of notification
  const viewportPadding = 8;
  const scrollRect = scrollContainer.value.getBoundingClientRect();

  if (!scrollRect) {
    return { display: "none" };
  }

  const targetLeftEdge = pos.left - scrollLeft.value;
  const targetRightEdge = pos.left + pos.width - scrollLeft.value;

  const isOutOfView = targetRightEdge < scrollRect.left || targetLeftEdge > scrollRect.right;

  let boxLeft = pos.left + pos.width / 2 - scrollLeft.value;
  let boxTransform = "translateX(-50%)";

  if (boxLeft - notificationWidth / 2 < viewportPadding) {
    boxLeft = viewportPadding;
    boxTransform = "translateX(0)";
  }

  if (boxLeft + notificationWidth / 2 > window.innerWidth - viewportPadding) {
    boxLeft = window.innerWidth - viewportPadding;
    boxTransform = "translateX(-100%)";
  }

  const targetCenter = pos.left + pos.width / 2 - scrollLeft.value;
  let triangleLeftOffset = targetCenter - boxLeft;

  // --- FIX START ---
  // Clamp the triangle's position to stay within the notification box bounds.
  // The triangle itself is 16px wide, so we use an 8px offset from each edge.
  triangleLeftOffset = Math.max(8, Math.min(triangleLeftOffset, notificationWidth - 8));
  // --- FIX END ---

  return {
    top: `${pos.top}px`,
    left: `${boxLeft}px`,
    transform: `translateY(calc(-100% - 3px)) ${boxTransform}`,
    "--triangle-left": `${triangleLeftOffset}px`,
    opacity: isOutOfView ? 0 : 1,
    pointerEvents: isOutOfView ? "none" : "auto",
    transition: "opacity 0.2s ease-in-out",
  };
};
</script>

<style scoped>
.notification-list {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 9999;
}

.notification-fade-enter-active,
.notification-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.notification-fade-enter-from,
.notification-fade-leave-to {
  opacity: 0;
  transform: translateY(-90%) scale(0.9);
}
</style>
