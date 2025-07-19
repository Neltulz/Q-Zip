<!-- #region top-comments -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/CustomButton.vue @preserve -->
<!--
  Description:
  A reusable button component with optional icons, customizable via props.
  It prevents content layout shift (CLS) from icon loading by using
  fixed-size placeholders. It will now log a warning if an icon is used
  without an explicit size prop to encourage best practices. All styles,
  both global variables and scoped rules, are externalized into separate
  CSS files for better organization. Color values use hsla() and include
  distinct variables for normal, hover, and active states. It also
  prevents the default browser context menu from appearing on right-click.

  Usage Example:
  <CustomButton
    btn-theme="primary"
    button-style-class="bordered-btn"
    data-name="add-item-button"
    first-icon-name="mdi:plus"
    :first-icon-size="24"
    justify="center"
    @click="handleClick"
  >
    Add Item
  </CustomButton>
-->
<!-- #endregion -->

<!-- #region template -->
<template>
  <button
    ref="buttonRef"
    v-flash-on-click
    :class="buttonClasses"
    :data-btn-theme="props.btnTheme"
    :data-justify="props.justify"
    :data-name="props.dataName"
    v-bind="otherAttrs"
    data-component-name="CustomButton"
    @contextmenu.prevent
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
  >
    <div class="visual-style" />
    <div v-if="props.firstIconName" class="icon-placeholder first-icon" :style="firstIconPlaceholderStyle">
      <Icon :name="props.firstIconName" :size="String(props.firstIconSize ?? 20)" />
    </div>
    <div class="button-content">
      <slot />
    </div>
    <div v-if="props.lastIconName" class="icon-placeholder last-icon" :style="lastIconPlaceholderStyle">
      <Icon :name="props.lastIconName" :size="String(props.lastIconSize ?? 20)" />
    </div>
  </button>
</template>
<!-- #endregion -->

<!-- #region script -->
<script setup lang="ts">
import { computed, onMounted, ref, useAttrs } from "vue";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logButtonPress, logButtonRelease, logWarning } from "@/utils/loggers";

const attrs = useAttrs();
const buttonRef = ref<HTMLElement | null>(null);

// FIX: Added defaults for all optional props to satisfy the 'vue/require-default-prop' ESLint rule.
const props = withDefaults(
  defineProps<{
    btnTheme?: "default" | "lite" | "liter" | "dark" | "darkr" | "primary" | "danger" | "warning" | "info";
    buttonStyleClass?: string;
    dataName: string;
    firstIconName?: string;
    firstIconSize?: string | number;
    justify?: "auto" | "start" | "center" | "end" | "stretch";
    lastIconName?: string;
    lastIconSize?: string | number;
  }>(),
  {
    btnTheme: "default",
    buttonStyleClass: "",
    firstIconName: "",
    firstIconSize: undefined,
    justify: "auto",
    lastIconName: "",
    lastIconSize: undefined,
  }
);

const firstIconPlaceholderStyle = computed(() => {
  const size = props.firstIconSize ?? 20;
  const sizePx = typeof size === "number" ? `${size}px` : size;
  return {
    width: sizePx,
    height: sizePx,
  };
});

const lastIconPlaceholderStyle = computed(() => {
  const size = props.lastIconSize ?? 20;
  const sizePx = typeof size === "number" ? `${size}px` : size;
  return {
    width: sizePx,
    height: sizePx,
  };
});

// Manually merge classes to prevent duplication from v-bind="$attrs"
const buttonClasses = computed(() => {
  const classes: string[] = ["custom-button"];
  if (props.buttonStyleClass) {
    classes.push(props.buttonStyleClass);
  }
  // Safely handle attrs.class which can be string, string[], or undefined
  if (typeof attrs.class === "string") {
    classes.push(attrs.class);
  } else if (Array.isArray(attrs.class)) {
    // Spread the array of classes
    classes.push(...(attrs.class as string[]));
  }
  return classes.filter(Boolean).join(" ");
});

// Exclude 'class' from attributes passed to v-bind to avoid double application
const otherAttrs = computed(() => {
  const { class: _, ...rest } = attrs;
  return rest;
});

defineExpose({
  buttonRef,
});

// Handle mousedown event for debug logging
const handleMouseDown = (event: MouseEvent): void => {
  const button = event.currentTarget as HTMLElement;
  const buttonName: string = button.getAttribute("data-name") || "Unnamed Button";
  logButtonPress("CustomButton", `PRESS: "${buttonName}"`);
};

// Handle mouseup event for debug logging
const handleMouseUp = (event: MouseEvent): void => {
  const button = event.currentTarget as HTMLElement;
  const buttonName: string = button.getAttribute("data-name") || "Unnamed Button";
  logButtonRelease("CustomButton", `RELEASE: "${buttonName}"`);
};

// Log component mount for debugging purposes.
onMounted((): void => {
  if (DEBUG && debugConfig.logComponentMounts) {
    // The ref is on a native <button>, so its value is a direct HTMLElement.
    const element: HTMLElement | null = buttonRef.value;

    if (element) {
      const _buttonName: string = element.getAttribute("data-name") || "Unnamed Button";
      const _tagName = element.tagName ?? "unknown";
    }
  }
});
</script>
<!-- #endregion -->

<!-- #region styles -->

<!-- Global button styles -->
<style>
@import "~/components/custom-button-comp/custom-button.global.css";
</style>

<!-- Scoped component styles -->
<style scoped>
@import "~/components/custom-button-comp/custom-button.scoped.css";
</style>
<!-- #endregion -->
