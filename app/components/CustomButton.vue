<!-- #region top-comments -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  CustomButton.vue @preserve
-->
<!-- components/CustomButton.vue @preserve -->
<!--
  Description:
  A reusable button component with optional icons, customizable via props.
  Now exposes a ref to its internal `.visual-style` div for precise
  positioning of other elements like tooltips.
-->
<!-- #endregion -->
<!-- #region template -->
<template>
  <div class="custom-button-wrapper" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    <button
      ref="buttonRef"
      :class="buttonClasses"
      :data-btn-theme="props.btnTheme"
      :data-justify="props.justify"
      :data-name="props.dataName"
      :style="buttonStyle"
      v-bind="otherAttrs"
      data-component-name="CustomButton"
      @contextmenu.prevent
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
    >
      <div ref="visualStyleRef" class="visual-style" />
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
    <InfoTooltip
      v-if="props.tooltipText || $slots['tooltip-content']"
      :visible="isTooltipVisible"
      :target="buttonRef"
      :placement="props.tooltipPlacement"
      :content="tooltipContent"
    >
      <slot name="tooltip-content"></slot>
    </InfoTooltip>
  </div>
</template>
<!-- #endregion -->
<!-- #region script -->
<script setup lang="ts">
import { computed, onMounted, ref, useAttrs } from "vue";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import InfoTooltip from "./InfoTooltip.vue";

const attrs = useAttrs();
const buttonRef = ref<HTMLElement | null>(null);
const visualStyleRef = ref<HTMLElement | null>(null); // Ref for the visual style div
const isPressed = ref(false); // Track if button is being pressed
const isTooltipVisible = ref(false);

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
    tooltipText?: string;
    tooltipShortcut?: string;
    tooltipPlacement?: "top" | "bottom" | "left" | "right" | "top-start" | "top-end" | "bottom-start" | "bottom-end" | "left-start" | "left-end" | "right-start" | "right-end";
  }>(),
  {
    btnTheme: "default",
    buttonStyleClass: "",
    firstIconName: "",
    firstIconSize: undefined,
    justify: "auto",
    lastIconName: "",
    lastIconSize: undefined,
    tooltipText: "",
    tooltipShortcut: "",
    tooltipPlacement: "top",
  }
);

const onMouseEnter = () => {
  if (props.tooltipText || props.tooltipShortcut) {
    isTooltipVisible.value = true;
  }
};

const onMouseLeave = () => {
  isTooltipVisible.value = false;
};

const tooltipContent = computed(() => {
  let text = props.tooltipText;
  if (props.tooltipShortcut) {
    text = `${text} (${props.tooltipShortcut})`;
  }
  return { text };
});

// Mouse event handlers for flash control
const handleMouseDown = () => {
  isPressed.value = true;
};
const handleMouseUp = () => {
  isPressed.value = false;
};

// Computed style to control flash state
const buttonStyle = computed(() => ({
  '--flash-active': isPressed.value ? '1' : '0'
}));
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
const buttonClasses = computed(() => {
  const classes: string[] = ["custom-button"];
  if (props.buttonStyleClass) {
    classes.push(props.buttonStyleClass);
  }
  if (typeof attrs.class === "string") {
    classes.push(attrs.class);
  } else if (Array.isArray(attrs.class)) {
    classes.push(...(attrs.class as string[]));
  }
  return classes.filter(Boolean).join(" ");
});
const otherAttrs = computed(() => {
  const { class: _, ...rest } = attrs;
  return rest;
});
defineExpose({
  buttonRef,
  visualStyleRef, // Expose the new ref
});
onMounted((): void => {
  if (DEBUG && debugConfig.logComponentMounts) {
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
<style scoped>
.custom-button-wrapper {
  display: contents;
}
</style>
<!-- Global button styles -->
<style>
@import "./custom-button-comp/custom-button.global.css";
</style>
<!-- Scoped component styles -->
<style scoped>
@import "./custom-button-comp/custom-button.scoped.css";
</style>
<!-- #endregion -->
