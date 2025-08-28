<template>
  <div class="color-picker-input">
    <ColorPicker
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :with-alpha="true"
      class="color-picker-input__picker"
    >
      <template #default="{ show, color }">
        <div
          class="color-picker-input__preview"
          @click="show"
          :style="previewStyle"
          :title="title"
        >
          <div class="color-picker-input__header-row">
            <div class="color-picker-input__header">{{ label }}</div>
            <div
              v-if="infoText"
              class="color-picker-input__info-icon-wrapper"
              :title="infoText"
              @mouseenter="(event) => $emit('infoMouseEnter', event)"
              @mouseleave="$emit('infoMouseLeave')"
            >
              <Icon name="mdi:information" class="color-picker-input__info-icon" />
            </div>
          </div>
          <div class="color-picker-input__content-row">
            <Icon :name="iconName" class="color-picker-input__color-icon" :size="20" />
            <span class="color-picker-input__color-text">{{ unref(color) || 'hsla(0, 0%, 0%, 0.5)' }}</span>
          </div>
        </div>
      </template>
    </ColorPicker>
  </div>
</template>

<script setup lang="ts">
import { unref, computed } from 'vue'

interface Props {
  modelValue: string
  label: string
  title: string
  infoText?: string
  iconName: string
  previewMode?: 'background' | 'border'
}

const props = withDefaults(defineProps<Props>(), {
  infoText: undefined,
  previewMode: 'background'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'infoMouseEnter': [event: MouseEvent]
  'infoMouseLeave': []
}>()

// The color variable comes from the ColorPicker slot props
const previewStyle = computed(() => {
  const currentColor = props.modelValue || 'hsla(0, 0%, 0%, 0.5)'

  if (props.previewMode === 'border') {
    // For border color picker, show alpha on background, not border
    return {
      backgroundColor: currentColor,
      borderColor: '#d0d0d0'
    }
  }

  // Default behavior: show color on background
  return {
    backgroundColor: currentColor
  }
})
</script>

<style scoped>
.color-picker-input {
  width: 100%;
}

.color-picker-input__picker {
  width: 100%;
}

.color-picker-input__preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 48px;
  /* Fallback background for better text visibility when no color is selected */
  background: rgba(255, 255, 255, 0.08);
  position: relative;
}

.color-picker-input__preview:after {
  content: '';
  display: block;
  position: absolute;
  inset: 0;
  border: 1px solid hsla(0, 0%, 100%, 0.125);
  border-radius: 6px;
  pointer-events: none;
  z-index: 100;
  mix-blend-mode: overlay;
}

.color-picker-input__header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.color-picker-input__content-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-picker-input__header {
  font-size: 11px;
  font-weight: 600;
  color: #f0f0f0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

.color-picker-input__preview:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.12);
}

.color-picker-input__color-icon {
  color: #f0f0f0;
  transition: color 0.2s ease;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
}

.color-picker-input__preview:hover .color-picker-input__color-icon {
  color: rgba(255, 255, 255, 0.8);
}

.color-picker-input__color-text {
  color: #f0f0f0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: 500;
  flex: 1;
  user-select: all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

.color-picker-input__info-icon-wrapper {
  color: #f0f0f0;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  cursor: pointer;
  transition: color 0.2s ease;
}

.color-picker-input__info-icon-wrapper:hover {
  color: rgba(255, 255, 255, 0.8);
}

.color-picker-input__info-icon {
  font-size: 14px;
}
</style>
