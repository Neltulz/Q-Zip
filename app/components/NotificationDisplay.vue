<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/NotificationDisplay.vue @preserve -->
<!--
  Description:
  A component to display a temporary notification message. It is designed
  to show success or warning states and includes a close button on hover.
  Text readability is improved, and it features a styled triangle pointer
  that is positioned independently via a CSS variable.
-->
<template>
  <div
    class="notification-display"
    :class="[`notification-${notification.type}`]"
    data-component-name="NotificationDisplay"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="notification-content">
      <Icon :name="iconName" class="notification-icon" size="16" />
      <span>{{ notification.message }}</span>
    </div>
    <Transition name="fade">
      <CustomButton
        v-if="isHovered"
        button-style-class="minimal-trans-btn"
        class="close-button"
        data-name="close-notification-btn"
        first-icon-name="mdi:close"
        :first-icon-size="16"
        @click.stop="emit('close')"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from "vue";
import { useUiStore, type Notification } from "@/stores/uiStore";

const uiStore = useUiStore();

const props = defineProps({
  notification: {
    type: Object as PropType<Notification>,
    required: true,
  },
});

const emit = defineEmits(["close"]);

const isHovered = ref(false);

const handleMouseEnter = () => {
  isHovered.value = true;
  uiStore.pauseNotificationTimeout(props.notification.id);
};

const handleMouseLeave = () => {
  isHovered.value = false;
  uiStore.resumeNotificationTimeout(props.notification.id);
};

const iconName = computed(() => {
  switch (props.notification.type) {
    case "success":
      return "mdi:check-circle-outline";
    case "warning":
      return "mdi:alert-circle-outline";
    case "error":
      return "mdi:close-circle-outline";
    default:
      return "mdi:information-outline";
  }
});
</script>

<style scoped>
.notification-display {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-radius: var(--brdr-rad-smal);
  font-size: 0.85rem;
  line-height: 1.2;
  width: max-content;
  max-width: 250px;
  box-shadow: var(--shdw-dp-2);
  white-space: nowrap;
  color: var(--txt-clr-liter);
  text-shadow: 1px 1px 2px hsla(0, 0%, 0%, 0.5);
  margin-bottom: 8px;
}

/* Triangle Styles */
.notification-display::after,
.notification-display::before {
  content: "";
  position: absolute;
  bottom: -8px;
  /* Position horizontally using the CSS variable from the container */
  left: var(--triangle-left, 50%);
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top-width: 8px;
  border-top-style: solid;
}

.notification-display::before {
  bottom: -9px;
  border-top-width: 9px;
  border-left-width: 9px;
  border-right-width: 9px;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-icon {
  flex-shrink: 0;
}

/* Notification Types & Triangle Colors */
.notification-success {
  background-color: hsla(var(--success-hue), var(--success-sat), 30%, var(--success-alph));
  border: 1px solid hsla(var(--success-hue), var(--success-sat), 40%, var(--success-alph));
}
.notification-success::after {
  border-top-color: hsla(var(--success-hue), var(--success-sat), 30%, var(--success-alph));
}
.notification-success::before {
  border-top-color: hsla(var(--success-hue), var(--success-sat), 40%, var(--success-alph));
}

.notification-warning {
  background-color: hsla(45, 100%, 51%, 0.95);
  border: 1px solid hsla(45, 100%, 61%, 0.95);
  color: var(--txt-clr-darkr);
}
.notification-warning::after {
  border-top-color: hsla(45, 100%, 51%, 0.95);
}
.notification-warning::before {
  border-top-color: hsla(45, 100%, 61%, 0.95);
}

.notification-error {
  background-color: var(--danger-clr);
  border: 1px solid hsla(var(--danger-hue), var(--danger-sat), calc(var(--danger-lum) + 10%), var(--danger-alph));
}
.notification-error::after {
  border-top-color: var(--danger-clr);
}
.notification-error::before {
  border-top-color: hsla(var(--danger-hue), var(--danger-sat), calc(var(--danger-lum) + 10%), var(--danger-alph));
}

.close-button {
  --btn-pad-in: 2px;
  --btn-pad-blok: 2px;
  margin-left: 8px;
  color: inherit;
}

.close-button :deep(.visual-style) {
  background-color: hsla(0, 0%, 100%, 0.15);
}
.close-button:hover :deep(.visual-style) {
  background-color: hsla(0, 0%, 100%, 0.25);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
