<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/CustomInput.vue @preserve -->
<template>
  <div :class="['custom-input-comp', { 'custom-input-comp--can-be-reset': canBeReset }]" data-component-name="CustomInput">
    <div v-if="hasButtonsStart" class="custom-input-comp__btns-wrapper custom-input-comp__btns-wrapper--start">
      <slot name="buttons-start" />
    </div>
    <div :class="['custom-input-comp__input-wrapper', inputTypeClass]">
      <select
        v-if="inputType === 'select'"
        :id="inputId"
        :name="inputId"
        :value="modelValue"
        :disabled="disabled"
        class="custom-input-comp__native-select"
        @change="handleChange"
      >
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.text }}
        </option>
      </select>
      <input
        v-else-if="inputType === 'input'"
        :id="inputId"
        :name="inputId"
        :value="modelValue"
        :type="type || 'text'"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :spellcheck="spellcheck"
        class="custom-input-comp__native-input"
        @input="handleInput"
      />
      <textarea
        v-else-if="inputType === 'text-area'"
        :id="inputId"
        :name="inputId"
        :value="modelValue"
        :disabled="disabled"
        :spellcheck="spellcheck"
        class="custom-input-comp__native-textarea"
        @input="handleInput"
      />
      <slot v-else :update-value="updateValue" name="custom-input" :value="modelValue" />
      <div v-if="inputType === 'select'" class="custom-input-comp__select-text">
        {{ selectedText }}
      </div>
      <div class="custom-input-comp__reset-btn-wrapper">
        <slot name="reset-button" />
      </div>
      <span v-if="inputType === 'select'" class="custom-input-comp__chevron">
        <Icon name="mdi:chevron-down" size="16" />
      </span>
    </div>
    <div v-if="hasButtonsEnd" class="custom-input-comp__btns-wrapper custom-input-comp__btns-wrapper--end">
      <slot name="buttons-end" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, useSlots } from "vue";
// Define the Option interface for type safety
interface Option {
  value: string | number;
  text: string;
}
// Define props with explicit types
const props = defineProps<{
  inputId?: string;
  inputType: "select" | "input" | "text-area" | "custom";
  modelValue: string | number | undefined;
  options?: Option[];
  canBeReset?: boolean;
  disabled?: boolean;
  spellcheck?: boolean;
  type?: string; // For inputType="input", default "text"
  autocomplete?: string; // For inputType="input"
}>();
// Define emits with explicit event type
const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
}>();
// Get the slots object to check slot content
const slots = useSlots();
// Computed properties to check if slots have content
const hasButtonsStart = computed((): boolean => !!slots["buttons-start"] && slots["buttons-start"]().length > 0);
const hasButtonsEnd = computed((): boolean => !!slots["buttons-end"] && slots["buttons-end"]().length > 0);
// Computed property for dynamic wrapper class based on input-type
const inputTypeClass = computed((): string => {
  switch (props.inputType) {
    case "select":
      return "custom-input-comp__input-wrapper--select";
    case "input":
      return "custom-input-comp__input-wrapper--input";
    case "text-area":
      return "custom-input-comp__input-wrapper--text-area";
    case "custom":
      return "custom-input-comp__input-wrapper--custom";
    default:
      return "custom-input-comp__input-wrapper--select"; // Fallback, though validator ensures valid input-type
  }
});
// Handle select change event
const handleChange = (event: Event): void => {
  if (props.inputType === "select") {
    const select = event.target as HTMLSelectElement;
    const selectedValue = select.value;
    const selectedOption = props.options?.find((opt) => opt.value.toString() === selectedValue);
    if (selectedOption) {
      emit("update:modelValue", selectedOption.value);
    }
  }
};
// Handle input and textarea input events
const handleInput = (event: Event): void => {
  const input = event.target as HTMLInputElement | HTMLTextAreaElement;
  emit("update:modelValue", input.value);
};
// Function for custom slot to update modelValue
const updateValue = (newValue: string | number): void => {
  emit("update:modelValue", newValue);
};
// Compute the selected text for display (only for select)
const selectedText = computed((): string => {
  if (props.inputType !== "select") return "";
  const selectedOption = props.options?.find((opt) => opt.value === props.modelValue);
  return selectedOption ? selectedOption.text : "";
});
</script>
<style scoped>
@import "./custom-input-comp/custom-input-comp.scoped.css";
</style>
