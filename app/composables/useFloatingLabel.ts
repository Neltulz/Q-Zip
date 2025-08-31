// composables/useFloatingLabel.ts
import { computed, ref } from 'vue'

export interface FloatingLabelConfig {
  modelValue?: string | number | boolean
  placeholder?: string
  title?: string
}

export function useFloatingLabel(config: FloatingLabelConfig) {
  const isFocused = ref(false)
  const hasContent = ref(false)

  // Update content state when modelValue changes
  const updateContentState = (value: string | number | boolean | undefined) => {
    hasContent.value = value !== undefined && value !== null && String(value).trim() !== ''
  }

  // Check if label should be floating
  // If has content: always float
  // If empty: only float when focused
  const shouldFloat = computed(() => {
    let result: boolean

    if (hasContent.value) {
      // Has content: always float
      result = true
    } else if (isFocused.value) {
      // Empty and focused: float
      result = true
    } else {
      // Empty and not focused: don't float
      result = false
    }

    // Debug logging
    const debugInfo = {
      hasContent: hasContent.value,
      isFocused: isFocused.value,
      shouldFloat: result,
      case: hasContent.value ? 'has-content' : (isFocused.value ? 'empty-focused' : 'empty-not-focused'),
      classes: labelClasses.value,
      timestamp: Date.now()
    }
    console.log('FloatingLabel Debug:', debugInfo)

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
    console.log('Input focused - switching to floating state')
    isFocused.value = true
  }

  const handleBlur = () => {
    console.log('Input blurred:', {
      hasContent: hasContent.value,
      wasFocused: isFocused.value,
      shouldFloatAfterBlur: hasContent.value // will be true if has content, false if empty
    })
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
