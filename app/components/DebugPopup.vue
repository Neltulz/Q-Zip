<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  DebugPopup.vue @preserve
-->
<!-- components/DebugPopup.vue @preserve -->
<!--
  DebugPopup.vue
  What it is:
  - A secret debug popup that can be opened with Ctrl+Alt+Shift+D
  - Contains debug options for development and testing
  - Positioned in the top-right corner of the screen
-->
<template>
  <Transition name="debug-popup-fade" appear>
    <div
      v-if="debugStore.isDebugPopupVisible"
      ref="popupRef"
      class="debug-popup"
      :style="popupStyle"
      data-component-name="DebugPopup"
    >
      <div 
        class="debug-popup-header"
        @mousedown="startDrag"
      >
        <h3 class="debug-popup-title">
          <Icon name="mdi:bug" class="debug-icon" />
          Debug Options
        </h3>
        <CustomButton
          button-style-class="trans-btn"
          class="close-button"
          data-name="close-debug-popup-btn"
          first-icon-name="mdi:close"
          :first-icon-size="18"
          @click="debugStore.toggleDebugPopup"
        />
      </div>
      
      <div class="debug-popup-content">
        <div class="debug-tabs">
          <!-- Tab Navigation -->
          <div class="debug-tab-nav">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="debug-tab-button"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              <Icon :name="tab.icon" class="debug-tab-icon" />
              <span class="debug-tab-text">{{ tab.label }}</span>
            </button>
          </div>
          
          <!-- Tab Content -->
          <OverlayScrollbarsComponent
            class="debug-tab-content"
            defer
            :options="{
              scrollbars: {
                visibility: 'auto',
                autoHide: 'move',
                autoHideSuspend: true,
                theme: currentTheme,
              },
            }"
          >
            <!-- General Tab -->
            <div v-if="activeTab === 'general'" class="debug-tab-panel">
              <!-- General tab content will be added here in the future -->
            </div>
            
            <!-- Logging Tab -->
            <div v-if="activeTab === 'logging'" class="debug-tab-panel">
              <!-- Logging Control Buttons -->
              <div class="debug-logging-controls">
                <CustomButton
                  button-style-class="trans-btn btn-lite"
                  data-name="enable-all-logging-btn"
                  first-icon-name="mdi:check-all"
                  :first-icon-size="16"
                  @click="checkAllLoggingOptions"
                >
                  Enable All
                </CustomButton>
                <CustomButton
                  button-style-class="trans-btn btn-lite"
                  data-name="disable-all-logging-btn"
                  first-icon-name="mdi:close-box-multiple"
                  :first-icon-size="16"
                  @click="uncheckAllLoggingOptions"
                >
                  Disable All
                </CustomButton>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">Component & Lifecycle</h4>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logComponentMounts"
                    @update:model-value="(value) => debugStore.updateDebugOption('logComponentMounts', value)"
                    label="Component Mounts"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logRefUpdates"
                    @update:model-value="(value) => debugStore.updateDebugOption('logRefUpdates', value)"
                    label="Ref Updates"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logRenderingEvents"
                    @update:model-value="(value) => debugStore.updateDebugOption('logRenderingEvents', value)"
                    label="Rendering Events"
                    size="sm"
                  />
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">User Interactions</h4>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logClicksAndInputs"
                    @update:model-value="(value) => debugStore.updateDebugOption('logClicksAndInputs', value)"
                    label="Clicks & Inputs"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logHoverEvents"
                    @update:model-value="(value) => debugStore.updateDebugOption('logHoverEvents', value)"
                    label="Hover Events"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logKeyboardEvents"
                    @update:model-value="(value) => debugStore.updateDebugOption('logKeyboardEvents', value)"
                    label="Keyboard Events"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logUIInteractivity"
                    @update:model-value="(value) => debugStore.updateDebugOption('logUIInteractivity', value)"
                    label="UI Interactivity"
                    size="sm"
                  />
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">UI & Components</h4>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logUIEvents"
                    @update:model-value="(value) => debugStore.updateDebugOption('logUIEvents', value)"
                    label="UI Events"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logDropdownEvents"
                    @update:model-value="(value) => debugStore.updateDebugOption('logDropdownEvents', value)"
                    label="Dropdown Events"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logTooltipEvents"
                    @update:model-value="(value) => debugStore.updateDebugOption('logTooltipEvents', value)"
                    label="Tooltip Events"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logLoadingEvents"
                    @update:model-value="(value) => debugStore.updateDebugOption('logLoadingEvents', value)"
                    label="Loading Events"
                    size="sm"
                  />
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">File Operations</h4>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logFileSelection"
                    @update:model-value="(value) => debugStore.updateDebugOption('logFileSelection', value)"
                    label="File Selection"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logDragAndDrop"
                    @update:model-value="(value) => debugStore.updateDebugOption('logDragAndDrop', value)"
                    label="Drag & Drop"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logDragDropFailsafe"
                    @update:model-value="(value) => debugStore.updateDebugOption('logDragDropFailsafe', value)"
                    label="Drag & Drop Failsafe"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logDualProgress"
                    @update:model-value="(value) => debugStore.updateDebugOption('logDualProgress', value)"
                    label="Dual Progress Tracking"
                    size="sm"
                  />
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">System & Management</h4>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logStoreActions"
                    @update:model-value="(value) => debugStore.updateDebugOption('logStoreActions', value)"
                    label="Store Actions"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logComposableManagerEvents"
                    @update:model-value="(value) => debugStore.updateDebugOption('logComposableManagerEvents', value)"
                    label="Composable Manager Events"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logNotifications"
                    @update:model-value="(value) => debugStore.updateDebugOption('logNotifications', value)"
                    label="Notifications"
                    size="sm"
                  />
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">Development & Warnings</h4>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logMissingPropWarnings"
                    @update:model-value="(value) => debugStore.updateDebugOption('logMissingPropWarnings', value)"
                    label="Missing Prop Warnings"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logComponentAttributes"
                    @update:model-value="(value) => debugStore.updateDebugOption('logComponentAttributes', value)"
                    label="Component Attributes"
                    size="sm"
                  />
                </div>
                <div class="debug-option">
                  <USwitch
                    :model-value="debugStore.debugOptions.logVueWarnings"
                    @update:model-value="(value) => debugStore.updateDebugOption('logVueWarnings', value)"
                    label="Vue Warnings"
                    size="sm"
                  />
                </div>
              </div>
            </div>
            
            <!-- InfoTooltips Tab -->
            <div v-if="activeTab === 'tooltips'" class="debug-tab-panel">
              <!-- InfoTooltips tab content will be added here in the future -->
            </div>
          </OverlayScrollbarsComponent>
        </div>
        
        <hr class="debug-divider" />
        
        <div class="debug-actions">
          <CustomButton
            button-style-class="trans-btn btn-lite"
            data-name="reset-debug-options-btn"
            first-icon-name="mdi:refresh"
            :first-icon-size="16"
            @click="debugStore.resetDebugOptions"
          >
            Reset All Options
          </CustomButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDebugStore } from "@/stores/debugStore";
import { useThemeStore } from "@/stores/themeStore";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import CustomButton from "./CustomButton.vue";

const debugStore = useDebugStore();
const themeStore = useThemeStore();
const popupRef = ref<HTMLElement | null>(null);

// Tab state
const activeTab = ref('general');

// Tab definitions
const tabs = [
  {
    id: 'general',
    label: 'General',
    icon: 'mdi:cog'
  },
  {
    id: 'logging',
    label: 'Logging',
    icon: 'mdi:console'
  },
  {
    id: 'tooltips',
    label: 'InfoTooltips',
    icon: 'mdi:tooltip-text'
  }
];

// Theme-aware scrollbar configuration
const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));

// Drag state
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragStartPosition = ref({ x: 0, y: 0 });

// Computed popup style
const popupStyle = computed(() => ({
  transform: `translate(${debugStore.debugPopupPosition.x}px, ${debugStore.debugPopupPosition.y}px)`,
}));

// Start drag operation
const startDrag = (event: MouseEvent) => {
  event.preventDefault();
  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  dragStartPosition.value = {
    x: debugStore.debugPopupPosition.x,
    y: debugStore.debugPopupPosition.y,
  };
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
};

// Handle drag movement
const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;
  
  const deltaX = event.clientX - dragStartX.value;
  const deltaY = event.clientY - dragStartY.value;
  
  const newX = Math.max(0, Math.min(window.innerWidth - 500, dragStartPosition.value.x + deltaX));
  const newY = Math.max(0, Math.min(window.innerHeight - 200, dragStartPosition.value.y + deltaY));
  
  debugStore.updateDebugPopupPosition({
    x: newX,
    y: newY,
  });
};

// Stop drag operation
const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
});

// Check all logging options
const checkAllLoggingOptions = () => {
  debugStore.updateDebugOption('logComponentMounts', true);
  debugStore.updateDebugOption('logRefUpdates', true);
  debugStore.updateDebugOption('logRenderingEvents', true);
  debugStore.updateDebugOption('logClicksAndInputs', true);
  debugStore.updateDebugOption('logHoverEvents', true);
  debugStore.updateDebugOption('logKeyboardEvents', true);
  debugStore.updateDebugOption('logUIInteractivity', true);
  debugStore.updateDebugOption('logUIEvents', true);
  debugStore.updateDebugOption('logDropdownEvents', true);
  debugStore.updateDebugOption('logTooltipEvents', true);
  debugStore.updateDebugOption('logLoadingEvents', true);
  debugStore.updateDebugOption('logFileSelection', true);
  debugStore.updateDebugOption('logDragAndDrop', true);
  debugStore.updateDebugOption('logDragDropFailsafe', true);
  debugStore.updateDebugOption('logDualProgress', true);
  debugStore.updateDebugOption('logStoreActions', true);
  debugStore.updateDebugOption('logComposableManagerEvents', true);
  debugStore.updateDebugOption('logNotifications', true);
  debugStore.updateDebugOption('logMissingPropWarnings', true);
  debugStore.updateDebugOption('logComponentAttributes', true);
  debugStore.updateDebugOption('logVueWarnings', true);
};

// Uncheck all logging options
const uncheckAllLoggingOptions = () => {
  debugStore.updateDebugOption('logComponentMounts', false);
  debugStore.updateDebugOption('logRefUpdates', false);
  debugStore.updateDebugOption('logRenderingEvents', false);
  debugStore.updateDebugOption('logClicksAndInputs', false);
  debugStore.updateDebugOption('logHoverEvents', false);
  debugStore.updateDebugOption('logKeyboardEvents', false);
  debugStore.updateDebugOption('logUIInteractivity', false);
  debugStore.updateDebugOption('logUIEvents', false);
  debugStore.updateDebugOption('logDropdownEvents', false);
  debugStore.updateDebugOption('logTooltipEvents', false);
  debugStore.updateDebugOption('logLoadingEvents', false);
  debugStore.updateDebugOption('logFileSelection', false);
  debugStore.updateDebugOption('logDragAndDrop', false);
  debugStore.updateDebugOption('logDragDropFailsafe', false);
  debugStore.updateDebugOption('logDualProgress', false);
  debugStore.updateDebugOption('logStoreActions', false);
  debugStore.updateDebugOption('logComposableManagerEvents', false);
  debugStore.updateDebugOption('logNotifications', false);
  debugStore.updateDebugOption('logMissingPropWarnings', false);
  debugStore.updateDebugOption('logComponentAttributes', false);
  debugStore.updateDebugOption('logVueWarnings', false);
};
</script>

<style scoped>
@import "./DebugPopup.scoped.css";
</style>
