// composables/useFloatingLabel.ts
import { computed, ref } from 'vue'

export interface FloatingLabelConfig {
  modelValue?: string | number | boolean
  placeholder?: string
  title?: string
  inputType?: string
}

export function useFloatingLabel(config: FloatingLabelConfig) {
  const isFocused = ref(false)
  const hasContent = ref(false)

  // Update content state when modelValue changes
  const updateContentState = (value: string | number | boolean | undefined) => {
    hasContent.value = value !== undefined && value !== null && String(value).trim() !== ''
  }

  // Check if label should be floating
  // For selects: always float (they typically always have a value)
  // For other inputs: if has content: always float, if empty: only float when focused
  const shouldFloat = computed(() => {
    let result: boolean

    if (config.inputType === 'select') {
      // Select elements always float their labels
      result = true
    } else if (hasContent.value) {
      // Has content: always float
      result = true
    } else if (isFocused.value) {
      // Empty and focused: float
      result = true
    } else {
      // Empty and not focused: don't float
      result = false
    }



    // Force CSS update by ensuring classes are applied
    return result
  })

  // CSS classes for floating label states
  const labelClasses = computed(() => ({
    'field-title--floating': shouldFloat.value,
    'field-title--placeholder': !shouldFloat.value,
    'field-title--focused': isFocused.value,
    'field-title--has-content': hasContent.value
  }))

  // CSS classes for input wrapper
  const wrapperClasses = computed(() => ({
    'input-wrapper--has-floating-label': true,
    'input-wrapper--label-floating': shouldFloat.value,
    'input-wrapper--label-placeholder': !shouldFloat.value,
    'input-wrapper--focused': isFocused.value
  }))

  // Handle focus events
  const handleFocus = () => {
    isFocused.value = true
  }

  const handleBlur = () => {
    isFocused.value = false
  }

  // Initialize content state
  updateContentState(config.modelValue)

  return {
    isFocused,
    hasContent,
    shouldFloat,
    labelClasses,
    wrapperClasses,
    handleFocus,
    handleBlur,
    updateContentState
  }
}
