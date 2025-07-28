<!-- #region top-comments -->
<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/CustomButton.vue @preserve -->
<!--
  Description:
  A reusable button component with optional icons, customizable via props.
  The anchor-name prop has been removed as it is no longer needed for the
  notification system.
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

const attrs = useAttrs();
const buttonRef = ref<HTMLElement | null>(null);

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

<!-- Global button styles -->
<style>
@import "./custom-button-comp/custom-button.global.css";
</style>

<!-- Scoped component styles -->
<style scoped>
@import "./custom-button-comp/custom-button.scoped.css";
</style>
<!-- #endregion -->
