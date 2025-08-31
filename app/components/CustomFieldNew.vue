<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/CustomFieldNew.vue @preserve -->
<!-- TODO: Create ==Technical Challenge== Create a Select with Input or Textarea built in. ... @preserve -->
<!-- TODO (continued): ... Would be useful for the "Output Location" field, or Compression Parameter Fields @preserve -->
<template>
  <div
    ref="fieldRef"
    data-component-name="CustomFieldNew"
    :class="['custom-field-new', extraClasses]"
    :data-field-context="isJobSettings ? 'job-specific' : 'global'"
    :data-field-name="dataFieldName"
    :data-field-empty="isFieldEmpty"
  >
    <template v-if="showWrapper">
      <div class="custom-field-new__lock-and-input-wrapper">
        <slot name="before-input" />
        <div class="custom-field-new__input-assembly">
          <div v-if="$slots['buttons-start']" class="custom-field-new__btns-wrapper-start">
            <slot name="buttons-start" />
          </div>
          <div :class="['custom-field-new__input-wrapper', inputWrapperClass, wrapperClasses]">
            <span v-if="title" :class="['custom-field-new__field-title', 'field-title', labelClasses]" @transitionend="onTransitionEnd">{{ title }}</span>
            <template v-if="inputType === 'custom'">
              <slot name="custom-content" />
            </template>
            <template v-else>
              <select
                v-if="inputType === 'select'"
                :id="generatedId"
                :name="generatedId"
                :disabled="disabled"
                :value="modelValue"
                autocomplete="off"
                class="custom-field-new__native-select"
                @change="handleChange"
                @focus="handleFocus"
                @blur="handleBlur"
                @mousedown="handleMouseDown"
                @mouseup="handleMouseUp"
              >
                <option v-for="option in options" :key="option.value" :value="option.value">
                  {{ option.text }}
                </option>
              </select>
              <input
                v-else-if="inputType === 'input'"
                :id="generatedId"
                :name="generatedId"
                :autocomplete="autocomplete || (title?.toLowerCase().includes('filename') || title?.toLowerCase().includes('output') ? 'off' : autocomplete)"
                :disabled="disabled"
                :placeholder="placeholder"
                :spellcheck="spellcheck"
                :type="type || 'text'"
                :value="modelValue != null ? String(modelValue) : ''"
                class="custom-field-new__native-input"
                @input="handleInput"
                @focus="handleFocus"
                @blur="handleBlur"
                @mousedown="handleMouseDown"
                @mouseup="handleMouseUp"
              />
              <input
                v-else-if="inputType === 'checkbox'"
                :id="generatedId"
                :name="generatedId"
                type="checkbox"
                :checked="modelValue === true"
                :disabled="disabled"
                @change="handleCheckboxChange"
                @mousedown="handleMouseDown"
                @mouseup="handleMouseUp"
              />
              <!-- Temporarily removed OverlayScrollbarsComponent to test clipboard functionality -->
              <textarea
                v-else-if="inputType === 'text-area'"
                :id="generatedId"
                :name="generatedId"
                :disabled="disabled"
                :placeholder="placeholder"
                :spellcheck="spellcheck"
                :value="modelValue != null ? String(modelValue) : ''"
                autocomplete="off"
                class="custom-field-new__native-textarea"
                @input="handleInput"
                @paste="handlePaste"
                @copy="handleCopy"
                @cut="handleCut"
                @focus="handleFocus"
                @blur="handleBlur"
                @mousedown="handleMouseDown"
                @mouseup="handleMouseUp"
              />
              <div v-if="inputType === 'select'" class="custom-field-new__select-text">
                <span>{{ selectedText }}</span>
              </div>
              <div class="custom-field-new__btns-and-chevron">
                <div v-if="showResetOptions" class="custom-field-new__reset-btn-wrapper">
                  <DropdownMenu
                    v-if="!showSingleButton"
                    button-style-class="trans-btn"
                    :dropdown-data-name="dropdownDataName"
                    placement="bottom-end"
                  >
                    <template #default="{ close }">
                      <CustomButton
                        v-if="isJobSettings && modelValueStr !== globalValueStr"
                        button-style-class="trans-btn"
                        data-name="reset-to-global-btn"
                        first-icon-name="mdi:arrow-u-left-top"
                        :first-icon-size="20"
                        @mouseup="
                          () => {
                            emit('reset-to-global', fieldId);
                            close();
                          }
                        "
                      >
                        Reset to Global Setting
                      </CustomButton>
                      <CustomButton
                        v-if="inputType === 'select' && modelValueStr !== defaultValueStr"
                        button-style-class="trans-btn"
                        data-name="unset-to-default-btn"
                        first-icon-name="mdi:close"
                        :first-icon-size="20"
                        @mouseup="
                          () => {
                            emit('unset-or-clear', fieldId);
                            close();
                          }
                        "
                      >
                        Unset to Original Default Setting
                      </CustomButton>
                      <CustomButton
                        v-else-if="(inputType === 'input' || inputType === 'text-area') && modelValueStr !== ''"
                        button-style-class="trans-btn"
                        data-name="clear-btn"
                        first-icon-name="mdi:close"
                        :first-icon-size="20"
                        @mouseup="
                          () => {
                            emit('unset-or-clear', fieldId);
                            close();
                          }
                        "
                      >
                        Clear
                      </CustomButton>
                    </template>
                  </DropdownMenu>
                  <template v-else>
                    <CustomButton
                      v-if="isJobSettings && modelValueStr !== globalValueStr"
                      button-style-class="trans-btn"
                      data-name="reset-to-global-btn"
                      first-icon-name="mdi:arrow-u-left-top"
                      :first-icon-size="20"
                      title="Reset to Global Setting"
                      @mouseup="emit('reset-to-global', fieldId)"
                    />
                    <CustomButton
                      v-else
                      button-style-class="trans-btn"
                      :data-name="inputType === 'select' ? 'unset-to-default-btn' : 'clear-btn'"
                      first-icon-name="mdi:close"
                      :first-icon-size="20"
                      :title="inputType === 'select' ? 'Unset to Original Default Setting' : 'Clear'"
                      @mouseup="emit('unset-or-clear', fieldId)"
                    />
                  </template>
                </div>
                <span v-if="inputType === 'select'" class="custom-field-new__chevron">
                  <Icon name="mdi:chevron-down" size="16" />
                </span>
              </div>
            </template>
          </div>
          <div v-if="$slots['buttons-end']" class="custom-field-new__btns-wrapper-end">
            <slot name="buttons-end" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logButtonPress, logButtonRelease, logInteraction } from "@/utils/loggers";
import { useFloatingLabel } from "@/composables/useFloatingLabel";
// Temporarily removed OverlayScrollbarsComponent import
interface Option {
  value: string | number;
  text: string;
}
const props = withDefaults(
  defineProps<{
    autocomplete?: string;
    canBeReset?: boolean;
    dataFieldName?: string;
    disabled?: boolean;
    extraClasses?: string | string[] | Record<string, boolean>;
    fieldId?: string;
    globalValue?: string | number | boolean;
    defaultValue?: string | number | boolean | undefined;
    inputType: "select" | "input" | "text-area" | "custom" | "checkbox";
    isJobSettings?: boolean;
    isLocked?: boolean;
    modelValue?: string | number | boolean | undefined;
    options?: Option[];
    placeholder?: string;
    showWrapper?: boolean;
    spellcheck?: boolean;
    title?: string;
    titleClasses?: string | string[] | Record<string, boolean>;
    type?: string;
  }>(),
  {
    autocomplete: undefined,
    canBeReset: false,
    dataFieldName: undefined,
    disabled: false,
    extraClasses: () => [],
    fieldId: "",
    globalValue: undefined,
    defaultValue: undefined,
    isJobSettings: false,
    isLocked: false,
    modelValue: undefined,
    options: () => [],
    placeholder: undefined,
    showWrapper: true,
    spellcheck: undefined,
    title: undefined,
    titleClasses: () => [],
    type: "text",
  }
);
const emit = defineEmits<{
  (e: "reset-to-global" | "unset-or-clear", fieldId: string): void;
  (e: "update:model-value", value: string | number | boolean): void;
}>();
const fieldRef = ref<HTMLElement | null>(null);

// Initialize floating label composable

const {
  shouldFloat,
  labelClasses,
  wrapperClasses,
  handleFocus,
  handleBlur,
  updateContentState
} = useFloatingLabel({
  modelValue: props.modelValue,
  placeholder: props.placeholder,
  title: props.title,
  inputType: props.inputType
});

// Watch for external modelValue changes (like from clear button)
watch(() => props.modelValue, (newValue) => {
  updateContentState(newValue)

  // If modelValue becomes empty externally (not from user typing), ensure input is blurred
  // Only blur if the input is not currently focused (meaning it was cleared externally)
  if (String(newValue || '').trim() === '') {
    // Find the input element and blur it only if it's not currently focused
    const inputElement = fieldRef.value?.querySelector('.custom-field-new__native-input, .custom-field-new__native-textarea, .custom-field-new__native-select') as HTMLElement
    if (inputElement && document.activeElement !== inputElement) {
      inputElement.blur()
    }
  }
}, { immediate: true })

const generatedId = computed(() => {
  const baseId = props.title
    ? props.title
        .toLowerCase()
        .replace(/[\s/]+/g, "-") // Replace spaces and slashes with a hyphen
        .replace(/[^a-z0-9-]/g, "") // Remove invalid characters
        .replace(/-$/, "") // Remove trailing hyphen
    : props.fieldId;
  const prefix = props.isJobSettings ? "job" : "global";
  return `${prefix}-${baseId}`;
});
const dropdownDataName = computed(() => `reset-options-for-${props.fieldId}`);
const inputWrapperClass = computed((): string => {
  switch (props.inputType) {
    case "checkbox":
      return "custom-field-new__input-wrapper--checkbox";
    case "input":
      return "custom-field-new__input-wrapper--input";
    case "select":
      return "custom-field-new__input-wrapper--select";
    case "text-area":
      return "custom-field-new__input-wrapper--text-area";
    case "custom":
      return "custom-field-new__input-wrapper--custom";
    default:
      return "custom-field-new__input-wrapper--input";
  }
});
const modelValueStr = computed((): string => String(props.modelValue ?? ""));
const globalValueStr = computed((): string => String(props.globalValue ?? ""));
const defaultValueStr = computed((): string => String(props.defaultValue ?? ""));
const isFieldEmpty = computed((): boolean => modelValueStr.value === "");
const showResetOptions = computed((): boolean => {
  if (props.inputType === "custom") return false;
  if (props.isJobSettings) {
    if (props.isLocked) return false;
    const showResetToGlobal: boolean = modelValueStr.value !== globalValueStr.value;
    const showUnsetOrClear: boolean =
      (props.inputType === "select" && modelValueStr.value !== defaultValueStr.value) ||
      ((props.inputType === "input" || props.inputType === "text-area") && modelValueStr.value !== "");
    return showResetToGlobal || showUnsetOrClear;
  } else {
    return (
      (props.inputType === "select" && modelValueStr.value !== defaultValueStr.value) ||
      ((props.inputType === "input" || props.inputType === "text-area") && modelValueStr.value !== "")
    );
  }
});
const showSingleButton = computed((): boolean => {
  if (!showResetOptions.value) return false;
  const showResetToGlobal: boolean = props.isJobSettings && modelValueStr.value !== globalValueStr.value;
  const showUnsetOrClear: boolean =
    (props.inputType === "select" && modelValueStr.value !== defaultValueStr.value) ||
    ((props.inputType === "input" || props.inputType === "text-area") && modelValueStr.value !== "");
  return (showResetToGlobal && !showUnsetOrClear) || (!showResetToGlobal && showUnsetOrClear);
});
const handleMouseDown = (_event: MouseEvent): void => {
  logButtonPress("CustomFieldNew", `PRESS: ${props.inputType} - "${props.title}"`);
};
const handleMouseUp = (_event: MouseEvent): void => {
  logButtonRelease("CustomFieldNew", `RELEASE: ${props.inputType} - "${props.title}"`);
};
const handleChange = (event: Event): void => {
  if (props.inputType === "select") {
    const select = event.target as HTMLSelectElement;
    const selectedValue: string = select.value;
    const selectedOption = props.options?.find((opt) => opt.value.toString() === selectedValue);
    if (selectedOption) {
      emit("update:model-value", selectedOption.value);
      updateContentState(selectedOption.value); // Update floating label content state
      logInteraction("CustomFieldNew", `CHANGE: ${props.inputType} - "${props.title}" | Value: "${selectedOption.value}"`);
    }
  }
};
const handleInput = (event: Event): void => {
  const input = event.target as HTMLInputElement | HTMLTextAreaElement;
  let newValue: string | number = input.value;
  if (typeof props.modelValue === "number") {
    const parsed = Number(input.value);
    if (!isNaN(parsed)) {
      newValue = parsed;
    }
  }
  emit("update:model-value", newValue);
  updateContentState(newValue); // Update floating label content state

  logInteraction("CustomFieldNew", `INPUT: ${props.inputType} - "${props.title}" | Value: "${newValue}"`);
};
const handleCheckboxChange = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  emit("update:model-value", input.checked);
  logInteraction("CustomFieldNew", `CHANGE: ${props.inputType} - "${props.title}" | Checked: ${input.checked}`);
};

const onTransitionEnd = (event: TransitionEvent): void => {
  // Transition completed - no action needed
};

const handlePaste = (event: ClipboardEvent): void => {
  // Ensure paste events are properly handled
  event.stopPropagation();
  // The input event will handle the actual value update
};

const handleCopy = (event: ClipboardEvent): void => {
  // Ensure copy events work properly
  event.stopPropagation();
};

const handleCut = (event: ClipboardEvent): void => {
  // Ensure cut events work properly
  event.stopPropagation();
  // The input event will handle the value update after cutting
};
const selectedText = computed((): string => {
  if (props.inputType !== "select") return "";
  if (props.modelValue === undefined) return "";
  const selectedOption = props.options?.find((opt) => opt.value === props.modelValue);
  return selectedOption ? selectedOption.text : "";
});
onMounted((): void => {
  if (DEBUG && debugConfig.logComponentMounts) {
    // const fieldName: string =
    //   fieldRef.value?.getAttribute("data-field-name") || "Unnamed Field";
    // Removed console.log to reduce console noise
    // logTrace("CustomFieldNew:Mount", `Mounted field: "${fieldName}"`);
    if (!fieldRef.value?.getAttribute("data-field-name")) {
      // Removed console.warn to reduce console noise
      // logTrace(
      //   "CustomFieldNew:Warning",
      //   "Field lacks a data-field-name attribute. Consider adding one for debugging."
      // );
    }
  }
});
</script>
<style scoped>
@import "./custom-field-comp/custom-field.scoped.css";
@import "./custom-field-comp/floating-label.scoped.css";
</style>
