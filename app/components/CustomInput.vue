<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/CustomInput.vue @preserve -->
<template>
  <div :class="['custom-input', { 'can-be-reset': canBeReset }]" data-component-name="CustomInput">
    <div v-if="hasButtonsStart" class="btns-wrapper-start">
      <slot name="buttons-start" />
    </div>
    <div :class="['input-wrapper-deep', inputTypeClass]">
      <select
        v-if="inputType === 'select'"
        :id="inputId"
        :name="inputId"
        :value="modelValue"
        :disabled="disabled"
        class="native-select"
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
        class="native-input"
        @input="handleInput"
      />
      <textarea
        v-else-if="inputType === 'text-area'"
        :id="inputId"
        :name="inputId"
        :value="modelValue"
        :disabled="disabled"
        class="native-textarea"
        @input="handleInput"
      />
      <slot v-else :update-value="updateValue" name="custom-input" :value="modelValue" />
      <div v-if="inputType === 'select'" class="select-text">
        {{ selectedText }}
      </div>
      <div class="reset-btn-wrapper">
        <slot name="reset-button" />
      </div>
      <span v-if="inputType === 'select'" class="chevron">
        <Icon name="mdi:chevron-down" size="16" />
      </span>
    </div>
    <div v-if="hasButtonsEnd" class="btns-wrapper-end">
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
      return "input-type-select";
    case "input":
      return "input-type-input";
    case "text-area":
      return "input-type-text-area";
    case "custom":
      return "input-type-custom";
    default:
      return "select-custom"; // Fallback, though validator ensures valid input-type
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
.custom-input {
  align-items: stretch;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  min-height: var(--min-tch-tgt);
  border-radius: var(--brdr-rad-smal);
  position: relative;
  z-index: 0;

  &:has(.reset-btn) .custom-input .input-wrapper-deep.input-type-text-area .native-textarea {
    padding-inline-end: var(--min-tch-tgt);
  }

  &:has(.reset-btn) .input-wrapper-deep.input-type-input .native-input {
    padding-inline-end: var(--min-tch-tgt);
  }

  &:has(.btns-wrapper-start) {
    grid-template-columns: auto 1fr;
  }

  &:has(.btns-wrapper-end) {
    grid-template-columns: 1fr auto;
  }

  &:has(.btns-wrapper-start ~ .btns-wrapper-end) {
    grid-template-columns: auto 1fr auto;
  }

  > *:not(:first-child) {
    margin-inline-start: -1px;
  }

  /* Buttons before the input, remove border-radius from input div */
  .btns-wrapper-start + .input-wrapper-deep {
    &.input-type-select,
    &.input-type-input,
    &.input-type-text-area {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
    }
  }

  .input-wrapper-deep {
    min-height: var(--min-tch-tgt);
    overflow: hidden;
    position: relative;
    z-index: 100;

    &.input-type-select,
    &.input-type-input,
    &.input-type-text-area {
      --bg-alph: 0.5;
      --bg-clr-dark: hsla(var(--bg-hue), var(--bg-sat), calc(var(--bg-lum) * 0.8), var(--bg-alph));
      align-items: center;
      background-color: var(--bg-clr-dark);
      border: 1px solid var(--brdr-clr-lite);
      border-radius: var(--brdr-rad-smal);
      display: flex;

      /* Buttons after the input, remove border-radius from input div */
      &:has(+ .btns-wrapper-end) {
        border-start-end-radius: 0;
        border-end-end-radius: 0;
      }

      input,
      select,
      textarea {
        padding-inline: var(--pad-in);
        padding-block: 0;
        &:focus,
        &:focus-visible {
          outline: 0 !important;
          box-shadow: none !important;
        }
      }
    }

    &.input-type-select {
      .native-select {
        cursor: pointer;
        height: 100%;
        inset-block-start: 0;
        inset-inline-start: 0;
        opacity: 0;
        position: absolute;
        width: 100%;
        z-index: 1;

        &:disabled {
          cursor: not-allowed;
        }
      }

      .chevron {
        inset-inline-end: 8px;
        pointer-events: none;
        position: absolute;
      }

      .select-text {
        flex: 1;
        margin-inline-end: 24px;
        overflow: hidden;
        pointer-events: none;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-inline: var(--pad-in);
        color: var(--txt-clr-lite);
        min-height: var(--min-tch-tgt);
        align-items: center;
        display: flex;
      }

      .reset-btn-wrapper {
        inset-inline-end: 24px;
        position: absolute;
        z-index: 2;

        &:has(.reset-btn[disabled]) {
          pointer-events: none;
        }
      }
    }

    &.input-type-input {
      .native-input {
        background-color: transparent;
        border: none;
        color: inherit;
        flex: 1;
        outline: none;
        width: 100%;

        &:disabled {
          cursor: not-allowed;
        }
      }
    }

    &.input-type-text-area {
      .native-textarea {
        background-color: transparent;
        border: none;
        color: inherit;
        flex: 1;
        outline: none;
        width: 100%;
        resize: vertical;
        padding-block: var(--pad-blok);

        &:disabled {
          cursor: not-allowed;
        }
      }
    }

    .reset-btn-wrapper {
      inset-inline-end: 0;
      position: absolute;
      z-index: 2;

      &:has(.reset-btn[disabled]) {
        pointer-events: none;
      }
    }
  }

  &:has(.native-select:focus, .native-input:focus, .native-textarea:focus) {
    .input-wrapper-deep {
      border-color: var(--blu-lite);
      box-shadow: 0 0 0 2px hsla(210, 100%, 50%, 0.25);
    }
  }

  .btns-wrapper-start,
  .btns-wrapper-end {
    align-items: stretch;
    display: flex;

    &:deep(> button),
    &:deep(> .button) {
      background-color: var(--bg-clr-lite);
      border: 1px solid var(--brdr-clr-liter);
      border-radius: var(--brdr-rad-smal);
      box-shadow: none;

      &:after {
        border-radius: 0;
      }
    }
  }

  .btns-wrapper-start {
    &:deep(> button),
    &:deep(> .button) {
      border-end-end-radius: 0;
      border-start-end-radius: 0;

      &:not(:first-child) {
        border-end-start-radius: 0;
        border-start-start-radius: 0;
      }
    }
  }

  .btns-wrapper-end {
    &:deep(> button),
    &:deep(> .button) {
      border-end-start-radius: 0;
      border-start-start-radius: 0;

      &:not(:last-child) {
        border-end-end-radius: 0;
        border-start-end-radius: 0;
      }
    }
  }
}

.field:has(> .field-title) .input-wrapper-deep {
  padding-block-start: 24px;
}
</style>
