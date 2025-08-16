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
  Supports built-in tooltip functionality with keyboard shortcut display.
-->
<!-- #endregion -->
<!-- #region template -->
<template>
  <button
    ref="buttonRef"
    :class="buttonClasses"
    :data-btn-theme="props.btnTheme"
    :data-justify="props.justify"
    :data-name="props.dataName"
    :style="buttonStyle"
    v-bind="otherAttrs"
    data-component-name="CustomButton"
    @contextmenu.prevent="(event) => emit('contextmenu', event)"
    @click="(event) => emit('click', event)"
    @dragover="(event) => emit('dragover', event)"
    @dragleave="(event) => emit('dragleave', event)"
    @drop="(event) => emit('drop', event)"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mouseleave="(event) => { handleMouseLeave(); emit('mouseleave', event); }"
    @mouseenter="(event) => { handleMouseEnter(); emit('mouseenter', event); }"
  >
    <div ref="visualStyleRef" class="visual-style" />
    <div v-if="props.firstIconName" class="icon-placeholder first-icon" :style="firstIconPlaceholderStyle">
      <Icon :name="props.firstIconName" :size="String(props.firstIconSize ?? 20)" />
    </div>
    <div class="button-content">
      <slot />
    </div>
    <!-- Keyboard shortcut text -->
    <div v-if="props.shortcutText" class="shortcut-text">
      {{ props.shortcutText }}
    </div>
    <div v-if="props.lastIconName" class="icon-placeholder last-icon" :style="lastIconPlaceholderStyle">
      <Icon :name="props.lastIconName" :size="String(props.lastIconSize ?? 20)" />
    </div>
  </button>
</template>
<!-- #endregion -->
<!-- #region script -->
<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, watch } from "vue";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logComponentAttributes, logVueWarning } from "@/utils/loggers";


const attrs = useAttrs();
const buttonRef = ref<HTMLElement | null>(null);
const visualStyleRef = ref<HTMLElement | null>(null); // Ref for the visual style div
const isPressed = ref(false); // Track if button is being pressed


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
    shortcutText?: string;
  }>(),
  {
    btnTheme: "default",
    buttonStyleClass: "",
    firstIconName: "",
    firstIconSize: undefined,
    justify: "auto",
    lastIconName: "",
    lastIconSize: undefined,
    shortcutText: "",
  }
);

// Define emits to handle event listeners properly
const emit = defineEmits<{
  click: [event: MouseEvent];
  contextmenu: [event: MouseEvent];
  dragover: [event: DragEvent];
  dragleave: [event: DragEvent];
  drop: [event: DragEvent];
  mouseenter: [event: MouseEvent];
  mouseleave: [event: MouseEvent];
}>();

// Mouse event handlers for flash control
const handleMouseDown = () => {
  isPressed.value = true;
};

const handleMouseUp = () => {
  isPressed.value = false;
};

const handleMouseLeave = () => {
  isPressed.value = false;
};

const handleMouseEnter = () => {
  // Tooltip logic moved to parent components
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
  
  // Log attribute inheritance for debugging
  if (DEBUG && debugConfig.logComponentAttributes) {
    const inheritedAttrs = Object.keys(rest);
    if (inheritedAttrs.length > 0) {
      logComponentAttributes("CustomButton", `Inheriting attributes: ${inheritedAttrs.join(', ')}`, {
        attributes: rest,
        dataName: props.dataName
      });
    }
  }
  
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
  
  // Log attribute inheritance details on mount
  if (DEBUG && debugConfig.logComponentAttributes) {
    const allAttrs = Object.keys(attrs);
    const inheritedAttrs = Object.keys(otherAttrs.value);
    
    logComponentAttributes("CustomButton", `Component mounted with attributes`, {
      dataName: props.dataName,
      allAttributes: allAttrs,
      inheritedAttributes: inheritedAttrs,
      hasClass: 'class' in attrs,
      hasDataJobId: 'data-job-id' in attrs,
      hasDataHasContextMenu: 'data-has-context-menu' in attrs,
      buttonElement: buttonRef.value,
      visualStyleElement: visualStyleRef.value
    });
  }
});

// Watch for attribute changes
watch(() => attrs, (newAttrs, oldAttrs) => {
  if (DEBUG && debugConfig.logComponentAttributes) {
    const newKeys = Object.keys(newAttrs);
    const oldKeys = Object.keys(oldAttrs || {});
    const addedKeys = newKeys.filter(key => !oldKeys.includes(key));
    const removedKeys = oldKeys.filter(key => !newKeys.includes(key));
    
    if (addedKeys.length > 0 || removedKeys.length > 0) {
      logComponentAttributes("CustomButton", `Attributes changed`, {
        dataName: props.dataName,
        added: addedKeys,
        removed: removedKeys,
        currentAttributes: newKeys,
        previousAttributes: oldKeys
      });
    }
  }
}, { deep: true });
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
