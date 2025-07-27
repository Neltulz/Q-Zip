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
  >
    <template v-if="showWrapper">
      <div class="lock-and-input-wrapper">
        <slot name="before-input" />
        <div class="input-assembly">
          <div v-if="$slots['buttons-start']" class="btns-wrapper-start">
            <slot name="buttons-start" />
          </div>
          <div :class="['input-wrapper-deep', inputTypeClass]">
            <span v-if="title" :class="titleClasses" class="field-title">{{ title }}</span>
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
                class="native-select"
                @change="handleChange"
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
                :autocomplete="autocomplete"
                :disabled="disabled"
                :type="type || 'text'"
                :value="modelValue != null ? String(modelValue) : ''"
                class="native-input"
                @input="handleInput"
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
              <textarea
                v-else-if="inputType === 'text-area'"
                :id="generatedId"
                :name="generatedId"
                :disabled="disabled"
                :value="modelValue != null ? String(modelValue) : ''"
                class="native-textarea"
                @input="handleInput"
                @mousedown="handleMouseDown"
                @mouseup="handleMouseUp"
              />
              <div v-if="inputType === 'select'" class="select-text">
                <span>{{ selectedText }}</span>
              </div>
              <div class="btns-and-chevron">
                <div v-if="showResetOptions" class="reset-btn-wrapper">
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
                <span v-if="inputType === 'select'" class="chevron">
                  <Icon name="mdi:chevron-down" size="16" />
                </span>
              </div>
            </template>
          </div>
          <div v-if="$slots['buttons-end']" class="btns-wrapper-end">
            <slot name="buttons-end" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logButtonPress, logButtonRelease, logInteraction } from "@/utils/loggers";

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
    showWrapper?: boolean;
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
    showWrapper: true,
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

const inputTypeClass = computed((): string => {
  switch (props.inputType) {
    case "checkbox":
      return "input-type-checkbox";
    case "custom":
      return "input-type-custom";
    case "input":
      return "input-type-input";
    case "select":
      return "input-type-select";
    case "text-area":
      return "input-type-text-area";
    default:
      return "";
  }
});

const modelValueStr = computed((): string => String(props.modelValue ?? ""));
const globalValueStr = computed((): string => String(props.globalValue ?? ""));
const defaultValueStr = computed((): string => String(props.defaultValue ?? ""));

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
  logInteraction("CustomFieldNew", `INPUT: ${props.inputType} - "${props.title}" | Value: "${newValue}"`);
};

const handleCheckboxChange = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  emit("update:model-value", input.checked);
  logInteraction("CustomFieldNew", `CHANGE: ${props.inputType} - "${props.title}" | Checked: ${input.checked}`);
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
</style>
