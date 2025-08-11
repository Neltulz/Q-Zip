<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/NotificationContainer.vue @preserve -->
<!--
  Description:
  A global container that renders all active notifications from the uiStore.
  It uses <teleport> to move the notifications to the document body,
  avoiding any CSS stacking context or overflow issues from parent elements.
  Each notification is now a self-contained component that manages its own
  position and lifecycle.
-->
<template>
  <teleport to="body">
    <Transition
      name="notification-container-fade"
      appear
    >
      <div 
        v-if="hasAnyNotifications"
        data-component-name="NotificationContainer"
        class="has-notifications"
      >
        <TransitionGroup name="notification-list-fade" tag="div" class="notification-list">
          <NotificationDisplay v-for="notification in uiStore.notifications" :key="notification.id" :notification="notification" />
        </TransitionGroup>
        
        <!-- Queue indicator -->
        <div v-if="uiStore.notificationQueue.length > 0" class="notification-queue-indicator">
          <div class="queue-indicator-content">
            <Icon name="mdi:clock-outline" size="16" />
            <span>{{ uiStore.notificationQueue.length }} notification{{ uiStore.notificationQueue.length > 1 ? 's' : '' }} pending</span>
          </div>
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUiStore } from "@/stores/uiStore";
import NotificationDisplay from "./NotificationDisplay.vue";

const uiStore = useUiStore();

// Computed property to check if there are any notifications or queued notifications
const hasAnyNotifications = computed(() => {
  return uiStore.notifications.length > 0 || uiStore.notificationQueue.length > 0;
});
</script>

<style scoped>
.notification-list {
  /* This container is now just a virtual placeholder */
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 9999;
}

/* Container transition animations */
.notification-container-fade-enter-active,
.notification-container-fade-leave-active {
  transition: opacity 0.3s ease;
}

.notification-container-fade-enter-from,
.notification-container-fade-leave-to {
  opacity: 0;
}

/*
  Since the popovers handle their own appear/disappear transitions,
  this transition is for the list itself when items are added/removed
  from the DOM by Vue.
*/
.notification-list-fade-enter-active,
.notification-list-fade-leave-active {
  transition: opacity 0.8s ease;
}

.notification-list-fade-enter-from,
.notification-list-fade-leave-to {
  opacity: 0;
}

.notification-queue-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9998;
  background-color: hsla(var(--bg-hue), var(--bg-sat), calc(var(--bg-lum) * 2.2), 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid var(--brdr-clr-liter);
  border-radius: var(--brdr-rad-smal);
  padding: 8px 12px;
  box-shadow: 0 2px 15px hsla(0, 0%, 0%, 0.3);
  font-size: 0.9em;
  color: var(--txt-clr-liter);
  animation: queueIndicatorFadeIn 0.3s ease;
}

.queue-indicator-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

@keyframes queueIndicatorFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
