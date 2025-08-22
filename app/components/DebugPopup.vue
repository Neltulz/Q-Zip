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
                  :events="{ scroll: handleScroll }"
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
                          <div 
                            :ref="(el) => infoIconRefs['logComponentMounts'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logComponentMounts', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logRefUpdates"
                            @update:model-value="(value) => debugStore.updateDebugOption('logRefUpdates', value)"
                          />
                          <span>Ref Updates</span>
                          <div 
                            :ref="(el) => infoIconRefs['logRefUpdates'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logRefUpdates', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logRenderingEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logRenderingEvents', value)"
                          />
                          <span>Rendering Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logRenderingEvents'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logRenderingEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
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
                          <div 
                            :ref="(el) => infoIconRefs['logClicksAndInputs'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logClicksAndInputs', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logHoverEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logHoverEvents', value)"
                          />
                          <span>Hover Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logHoverEvents'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logHoverEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logKeyboardEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logKeyboardEvents', value)"
                          />
                          <span>Keyboard Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logKeyboardEvents'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logKeyboardEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logUIInteractivity"
                            @update:model-value="(value) => debugStore.updateDebugOption('logUIInteractivity', value)"
                          />
                          <span>UI Interactivity</span>
                          <div 
                            :ref="(el) => infoIconRefs['logUIInteractivity'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logUIInteractivity', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
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
                          <div 
                            :ref="(el) => infoIconRefs['logUIEvents'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logUIEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDropdownEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDropdownEvents', value)"
                          />
                          <span>Dropdown Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logDropdownEvents'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logDropdownEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTooltipEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTooltipEvents', value)"
                          />
                          <span>Tooltip Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logTooltipEvents'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logTooltipEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
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
                          <div 
                            :ref="(el) => infoIconRefs['logFileSelection'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logFileSelection', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDragAndDrop"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDragAndDrop', value)"
                          />
                          <span>Drag & Drop</span>
                          <div 
                            :ref="(el) => infoIconRefs['logDragAndDrop'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logDragAndDrop', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDragDropFailsafe"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDragDropFailsafe', value)"
                          />
                          <span>Drag & Drop Failsafe</span>
                          <div 
                            :ref="(el) => infoIconRefs['logDragDropFailsafe'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logDragDropFailsafe', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
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
                          <div 
                            :ref="(el) => infoIconRefs['logStoreActions'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logStoreActions', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logComposableManagerEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logComposableManagerEvents', value)"
                          />
                          <span>Composable Manager Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logComposableManagerEvents'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logComposableManagerEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
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
                          <div 
                            :ref="(el) => infoIconRefs['logLoadingEvents'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logLoadingEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDualProgress"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDualProgress', value)"
                          />
                          <span>Dual Progress</span>
                          <div 
                            :ref="(el) => infoIconRefs['logDualProgress'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logDualProgress', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logNotifications"
                            @update:model-value="(value) => debugStore.updateDebugOption('logNotifications', value)"
                          />
                          <span>Notifications</span>
                          <div 
                            :ref="(el) => infoIconRefs['logNotifications'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logNotifications', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTraceEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTraceEvents', value)"
                          />
                          <span>Trace Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logTraceEvents'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logTraceEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
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
                          <div 
                            :ref="(el) => infoIconRefs['logMissingPropWarnings'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logMissingPropWarnings', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logComponentAttributes"
                            @update:model-value="(value) => debugStore.updateDebugOption('logComponentAttributes', value)"
                          />
                          <span>Component Attributes</span>
                          <div 
                            :ref="(el) => infoIconRefs['logComponentAttributes'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logComponentAttributes', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logVueWarnings"
                            @update:model-value="(value) => debugStore.updateDebugOption('logVueWarnings', value)"
                          />
                          <span>Vue Warnings</span>
                          <div 
                            :ref="(el) => infoIconRefs['logVueWarnings'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logVueWarnings', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
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
                          <div 
                            :ref="(el) => infoIconRefs['decorumMessages'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('decorumMessages', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logFileTableActivation"
                            @update:model-value="(value) => debugStore.updateDebugOption('logFileTableActivation', value)"
                          />
                          <span>FileTable Activation</span>
                          <div 
                            :ref="(el) => infoIconRefs['logFileTableActivation'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logFileTableActivation', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
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
              <div class="debug-tooltips-content">
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
                  <div class="debug-tooltips-scrollable-content">
                    <div class="debug-tooltips-options">
                      <div class="debug-option-group">
                        <h3>Tooltip Behavior</h3>
                        <label class="debug-option">
                          <USwitch
                            :model-value="debugStore.debugOptions.preventTooltipClosing"
                            @update:model-value="(value) => debugStore.updateDebugOption('preventTooltipClosing', value)"
                          />
                          <span>Prevent Tooltip Closing</span>
                          <HotKey :keys="['CTRL', 'ALT', 'SHIFT', 'T']" size="small" :show-icon="false" />
                          <div 
                            :ref="(el) => infoIconRefs['preventTooltipClosing'] = el as HTMLElement"
                            class="debug-info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('preventTooltipClosing', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-info-icon" />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </OverlayScrollbarsComponent>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- InfoTooltip components for debug options -->
  <InfoTooltip
    v-for="(tooltip, optionKey) in debugOptionTooltips"
    :key="`debug-option-${optionKey}`"
    :visible="tooltipManager.activeTooltipId.value === `debug-option-${optionKey}`"
    :content="{ 
      text: `${tooltip.text}\n\nExample: ${tooltip.example}` 
    }"
    :target="infoIconRefs[optionKey]"
    placement="right"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDebugStore } from "@/stores/debugStore";
import { useThemeStore } from "@/stores/themeStore";
import { useTooltipManager } from "@/composables/useTooltipManager";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import CustomButton from "./CustomButton.vue";
import InfoTooltip from "./InfoTooltip.vue";
import HotKey from "./HotKey.vue";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";

// Initialize stores and composables
const debugStore = useDebugStore();
const themeStore = useThemeStore();
const tooltipManager = useTooltipManager();
const popupRef = ref<HTMLElement | null>(null);

// Tab state - use store for persistence across hot reloads
const activeTab = computed({
  get: () => debugStore.activeDebugTab,
  set: (value: string) => debugStore.updateActiveDebugTab(value)
});

// Current theme for scrollbars
const currentTheme = computed(() => (themeStore.isEffectiveDark ? "os-theme-light" : "os-theme-dark"));

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

// Tooltip content for debug options
const debugOptionTooltips = {
  logComponentMounts: {
    text: "Logs when Vue components are mounted and unmounted. Useful for tracking component lifecycle.",
    example: "🔧 [ComponentName] Component mounted"
  },
  logRefUpdates: {
    text: "Logs when template refs are updated or changed. Helps debug ref-related issues.",
    example: "🔧 [ComponentName] Ref updated: refName"
  },
  logRenderingEvents: {
    text: "Logs rendering-related events like template updates and re-renders.",
    example: "🔧 [ComponentName] Component re-rendered"
  },
  logClicksAndInputs: {
    text: "Logs user clicks, button presses, and input interactions.",
    example: "🔧 [ComponentName] Button clicked: action"
  },
  logHoverEvents: {
    text: "Logs mouse hover events (mouseenter/mouseleave) on interactive elements.",
    example: "🔧 [ComponentName] Hover event: mouseenter"
  },
  logKeyboardEvents: {
    text: "Logs keyboard events like key presses and shortcuts.",
    example: "🔧 [ComponentName] Keyboard event: keydown"
  },
  logUIInteractivity: {
    text: "Logs UI interaction events like focus changes and selection updates.",
    example: "🔧 [ComponentName] UI interaction: focus"
  },
  logUIEvents: {
    text: "Logs general UI events and transitions.",
    example: "🔧 [ComponentName] UI event: transition"
  },
  logDropdownEvents: {
    text: "Logs dropdown menu open/close events and interactions.",
    example: "🔧 [ComponentName] Dropdown opened"
  },
  logTooltipEvents: {
    text: "Logs tooltip show/hide events and positioning updates.",
    example: "🔧 [ComponentName] Tooltip shown"
  },
  logFileSelection: {
    text: "Logs file selection changes and multi-select operations.",
    example: "🔧 [ComponentName] File selected: filename"
  },
  logDragAndDrop: {
    text: "Logs drag and drop operations including drag start, drop, and cancel events.",
    example: "🔧 [ComponentName] Drag started: files"
  },
  logDragDropFailsafe: {
    text: "Logs drag and drop failsafe operations and error handling.",
    example: "🔧 [ComponentName] Drag failsafe: timeout"
  },
  logStoreActions: {
    text: "Logs Pinia store actions and state changes.",
    example: "🔧 [StoreName] Action called: actionName"
  },
  logComposableManagerEvents: {
    text: "Logs composable manager events and lifecycle operations.",
    example: "🔧 [ManagerName] Manager event: eventType"
  },
  logLoadingEvents: {
    text: "Logs loading states, progress updates, and async operations.",
    example: "🔧 [ComponentName] Loading started"
  },
  logDualProgress: {
    text: "Logs dual progress tracking for operations with multiple progress indicators.",
    example: "🔧 [ComponentName] Dual progress: 50% / 75%"
  },
  logNotifications: {
    text: "Logs notification events and user feedback messages.",
    example: "🔧 [ComponentName] Notification shown: message"
  },
  logTraceEvents: {
    text: "Logs detailed trace events with stack traces for debugging complex issues.",
    example: "🔧 [ComponentName] Trace event with stack"
  },
  logMissingPropWarnings: {
    text: "Logs warnings when required props are missing from components.",
    example: "⚠️ [ComponentName] Missing prop: propName"
  },
  logComponentAttributes: {
    text: "Logs component attribute issues and validation problems.",
    example: "🔧 [ComponentName] Attribute issue: attrName"
  },
  logVueWarnings: {
    text: "Logs Vue.js warnings and deprecation notices.",
    example: "⚠️ [Vue] Warning: message"
  },
  decorumMessages: {
    text: "Shows DECORUM framework messages and internal communications.",
    example: "🔧 [Decorum] Message: content"
  },
  logFileTableActivation: {
    text: "Logs FileTable activation events and focus management.",
    example: "🔧 [FileTable] Activated: jobId"
  },
  preventTooltipClosing: {
    text: "Prevents tooltips from closing once they become active. Useful for debugging tooltip positioning and behavior.",
    example: "Tooltips will stay visible until this option is disabled"
  }
};

// Refs for info icon wrappers
const infoIconRefs = ref<Record<string, HTMLElement | null>>({});

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

// Tooltip event handlers
const handleInfoIconMouseEnter = (optionKey: string, event?: MouseEvent) => {
  const originElement = event?.currentTarget as HTMLElement;
  tooltipManager.showTooltip(`debug-option-${optionKey}`, originElement);
};

const handleInfoIconMouseLeave = () => {
  tooltipManager.hideTooltip();
};

// Handle scroll events to hide tooltips when scrolling
const handleScroll = () => {
  // Hide tooltips when scrolling to prevent positioning issues
  // But respect the preventTooltipClosing debug setting
  if (tooltipManager.activeTooltipId.value && !debugStore.debugOptions.preventTooltipClosing) {
    tooltipManager.hideTooltipImmediately();
  }
};

// Handle keyboard events for debug shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  // Ctrl+Alt+Shift+T to toggle Prevent Tooltip Closing
  if (event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === 't') {
    event.preventDefault();
    const currentValue = debugStore.debugOptions.preventTooltipClosing;
    debugStore.updateDebugOption('preventTooltipClosing', !currentValue);
    
    if (DEBUG && debugConfig.logUIInteractivity) {
      console.log(`%c🔧 Prevent Tooltip Closing toggled: ${!currentValue}`, 'background: #ff9800; color: white; padding: 2px 4px; border-radius: 3px;');
    }
  }
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
  
  // Add keyboard event listener for debug shortcuts
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  
  // Remove keyboard event listener
  window.removeEventListener('keydown', handleKeyDown);
  
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<style scoped>
@import "./DebugPopup.scoped.css";
</style>
