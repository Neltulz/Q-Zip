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
    <div data-component-name="NotificationContainer">
      <TransitionGroup name="notification-list-fade" tag="div" class="notification-list">
        <NotificationDisplay v-for="notification in uiStore.notifications" :key="notification.id" :notification="notification" />
      </TransitionGroup>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useUiStore } from "@/stores/uiStore";
import NotificationDisplay from "./NotificationDisplay.vue";

const uiStore = useUiStore();
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

/*
  Since the popovers handle their own appear/disappear transitions,
  this transition is for the list itself when items are added/removed
  from the DOM by Vue.
*/
.notification-list-fade-enter-active,
.notification-list-fade-leave-active {
  transition: opacity 0.3s ease;
}

.notification-list-fade-enter-from,
.notification-list-fade-leave-to {
  opacity: 0;
}
</style>
