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
          <div class="debug-tab-content">
            <!-- General Tab -->
            <div v-if="activeTab === 'general'" class="debug-tab-panel">
              <div class="debug-empty-content">
                <p>General tab content will be added here in the future</p>
              </div>
            </div>
            
            <!-- Logging Tab -->
            <div v-if="activeTab === 'logging'" class="debug-tab-panel" data-tab="logging">
              <div class="debug-logging-content">
                <!-- Enable/Disable All Buttons -->
                <div class="debug-logging-header">
                  <CustomButton
                    btn-theme="primary"
                    button-style-class="trans-btn"
                    data-name="enable-all-logging-btn"
                    first-icon-name="mdi:check-all"
                    :first-icon-size="20"
                    @click="checkAllLoggingOptions"
                  >
                    Enable All
                  </CustomButton>
                  <CustomButton
                    btn-theme="default"
                    button-style-class="trans-btn"
                    data-name="disable-all-logging-btn"
                    first-icon-name="mdi:close-box-multiple"
                    :first-icon-size="20"
                    @click="uncheckAllLoggingOptions"
                  >
                    Disable All
                  </CustomButton>
                </div>

                <!-- Scrollable Options Area -->
                <OverlayScrollbarsComponent
                  :options="{
                    scrollbars: {
                      visibility: 'auto',
                      autoHide: 'move',
                      autoHideSuspend: true,
                      theme: currentTheme,
                    },
                  }"
                  defer
                >
                  <div class="debug-logging-scrollable-content">
                    <!-- Logging Options Grid -->
                    <div class="debug-logging-options">
                      <!-- Component Mounts -->
                      <div class="debug-option-group">
                        <h3>Component & Rendering</h3>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logComponentMounts"
                            @update:model-value="(value) => debugStore.updateDebugOption('logComponentMounts', value)"
                          />
                          <span>Component Mounts</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logRefUpdates"
                            @update:model-value="(value) => debugStore.updateDebugOption('logRefUpdates', value)"
                          />
                          <span>Ref Updates</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logRenderingEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logRenderingEvents', value)"
                          />
                          <span>Rendering Events</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- User Interactions -->
                      <div class="debug-option-group">
                        <h3>User Interactions</h3>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logClicksAndInputs"
                            @update:model-value="(value) => debugStore.updateDebugOption('logClicksAndInputs', value)"
                          />
                          <span>Clicks & Inputs</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logHoverEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logHoverEvents', value)"
                          />
                          <span>Hover Events</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logKeyboardEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logKeyboardEvents', value)"
                          />
                          <span>Keyboard Events</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logUIInteractivity"
                            @update:model-value="(value) => debugStore.updateDebugOption('logUIInteractivity', value)"
                          />
                          <span>UI Interactivity</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- UI Events -->
                      <div class="debug-option-group">
                        <h3>UI Events</h3>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logUIEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logUIEvents', value)"
                          />
                          <span>UI Events</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDropdownEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDropdownEvents', value)"
                          />
                          <span>Dropdown Events</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTooltipEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTooltipEvents', value)"
                          />
                          <span>Tooltip Events</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- File Operations -->
                      <div class="debug-option-group">
                        <h3>File Operations</h3>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logFileSelection"
                            @update:model-value="(value) => debugStore.updateDebugOption('logFileSelection', value)"
                          />
                          <span>File Selection</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDragAndDrop"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDragAndDrop', value)"
                          />
                          <span>Drag & Drop</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDragDropFailsafe"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDragDropFailsafe', value)"
                          />
                          <span>Drag & Drop Failsafe</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- Store & State -->
                      <div class="debug-option-group">
                        <h3>Store & State</h3>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logStoreActions"
                            @update:model-value="(value) => debugStore.updateDebugOption('logStoreActions', value)"
                          />
                          <span>Store Actions</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logComposableManagerEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logComposableManagerEvents', value)"
                          />
                          <span>Composable Manager Events</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- System Events -->
                      <div class="debug-option-group">
                        <h3>System Events</h3>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logLoadingEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logLoadingEvents', value)"
                          />
                          <span>Loading Events</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDualProgress"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDualProgress', value)"
                          />
                          <span>Dual Progress</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logNotifications"
                            @update:model-value="(value) => debugStore.updateDebugOption('logNotifications', value)"
                          />
                          <span>Notifications</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTraceEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTraceEvents', value)"
                          />
                          <span>Trace Events</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- Warnings & Errors -->
                      <div class="debug-option-group">
                        <h3>Warnings & Errors</h3>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logMissingPropWarnings"
                            @update:model-value="(value) => debugStore.updateDebugOption('logMissingPropWarnings', value)"
                          />
                          <span>Missing Prop Warnings</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logComponentAttributes"
                            @update:model-value="(value) => debugStore.updateDebugOption('logComponentAttributes', value)"
                          />
                          <span>Component Attributes</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logVueWarnings"
                            @update:model-value="(value) => debugStore.updateDebugOption('logVueWarnings', value)"
                          />
                          <span>Vue Warnings</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- Special Options -->
                      <div class="debug-option-group">
                        <h3>Special Options</h3>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.decorumMessages"
                            @update:model-value="(value) => debugStore.updateDebugOption('decorumMessages', value)"
                          />
                          <span>Decorum Messages</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logFileTableActivation"
                            @update:model-value="(value) => debugStore.updateDebugOption('logFileTableActivation', value)"
                          />
                          <span>FileTable Activation</span>
                          <div class="debug-info-icon-wrapper">
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </OverlayScrollbarsComponent>

                <!-- Bottom Action Buttons -->
                <div class="debug-logging-actions">
                  <CustomButton
                    btn-theme="info"
                    button-style-class="trans-btn"
                    data-name="show-debug-status-btn"
                    first-icon-name="mdi:information"
                    :first-icon-size="20"
                    @click="showDebugStatus"
                  >
                    Show Status
                  </CustomButton>
                  <CustomButton
                    btn-theme="warning"
                    button-style-class="trans-btn"
                    data-name="refresh-debug-btn"
                    first-icon-name="mdi:refresh"
                    :first-icon-size="20"
                    @click="debugStore.forceRefresh"
                  >
                    Refresh
                  </CustomButton>
                  <CustomButton
                    btn-theme="danger"
                    button-style-class="trans-btn"
                    data-name="reset-debug-btn"
                    first-icon-name="mdi:restore"
                    :first-icon-size="20"
                    @click="debugStore.resetDebugOptions"
                  >
                    Reset
                  </CustomButton>
                  <CustomButton
                    btn-theme="default"
                    button-style-class="trans-btn"
                    data-name="reset-dimensions-btn"
                    first-icon-name="mdi:resize"
                    :first-icon-size="20"
                    @click="debugStore.resetDebugPopupDimensions"
                  >
                    Reset Size
                  </CustomButton>
                </div>
              </div>
            </div>
            
            <!-- InfoTooltips Tab -->
            <div v-if="activeTab === 'tooltips'" class="debug-tab-panel">
              <div class="debug-empty-content">
                <p>InfoTooltips tab content will be added here in the future</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDebugStore } from "@/stores/debugStore";
import { useThemeStore } from "@/stores/themeStore";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import CustomButton from "./CustomButton.vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";

// Initialize stores and composables
const debugStore = useDebugStore();
const themeStore = useThemeStore();
const popupRef = ref<HTMLElement | null>(null);

// Tab state - use store for persistence across hot reloads
const activeTab = computed({
  get: () => debugStore.activeDebugTab,
  set: (value: string) => debugStore.updateActiveDebugTab(value)
});

// Current theme for scrollbars
const currentTheme = computed(() => themeStore.isEffectiveDark ? 'os-theme-dark' : 'os-theme-light');

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

// Drag state
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragStartPosition = ref({ x: 0, y: 0 });

// Debug functions
const checkAllLoggingOptions = () => {
  Object.keys(debugStore.debugOptions).forEach(key => {
    if (key.startsWith('log') || key === 'decorumMessages') {
      debugStore.updateDebugOption(key as keyof typeof debugStore.debugOptions, true);
    }
  });
};

const uncheckAllLoggingOptions = () => {
  Object.keys(debugStore.debugOptions).forEach(key => {
    if (key.startsWith('log') || key === 'decorumMessages') {
      debugStore.updateDebugOption(key as keyof typeof debugStore.debugOptions, false);
    }
  });
};

const showDebugStatus = () => {
  debugStore.showDebugStatus();
};

// Computed popup style
const popupStyle = computed(() => ({
  transform: `translate(${debugStore.debugPopupPosition.x}px, ${debugStore.debugPopupPosition.y}px)`,
  width: `${debugStore.debugPopupDimensions.width}px`,
  height: `${debugStore.debugPopupDimensions.height}px`,
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

// Handle resize events
const handleResize = () => {
  if (popupRef.value) {
    const rect = popupRef.value.getBoundingClientRect();
    const newWidth = Math.max(320, Math.min(800, rect.width));
    const newHeight = Math.max(300, Math.min(window.innerHeight * 0.8, rect.height));
    
    // Only update if dimensions actually changed
    if (newWidth !== debugStore.debugPopupDimensions.width || 
        newHeight !== debugStore.debugPopupDimensions.height) {
      debugStore.updateDebugPopupDimensions({
        width: newWidth,
        height: newHeight,
      });
      
      // Log the resize for debugging
      if (DEBUG && debugConfig.logUIEvents) {
        console.log(`%c🔧 Debug popup resized: ${newWidth}x${newHeight}`, 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');
      }
    }
  }
};

// Setup resize observer
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (popupRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(popupRef.value);
  }
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<style scoped>
@import "./DebugPopup.scoped.css";
</style>
