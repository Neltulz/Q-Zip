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
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logComponentMounts"
                      @update:model-value="(value) => debugStore.updateDebugOption('logComponentMounts', value)"
                      label="Component Mounts"
                      size="sm"
                    />
                    <div
                      ref="logComponentMountsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logComponentMounts')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logRefUpdates"
                      @update:model-value="(value) => debugStore.updateDebugOption('logRefUpdates', value)"
                      label="Ref Updates"
                      size="sm"
                    />
                    <div
                      ref="logRefUpdatesInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logRefUpdates')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logRenderingEvents"
                      @update:model-value="(value) => debugStore.updateDebugOption('logRenderingEvents', value)"
                      label="Rendering Events"
                      size="sm"
                    />
                    <div
                      ref="logRenderingEventsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logRenderingEvents')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">User Interactions</h4>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logClicksAndInputs"
                      @update:model-value="(value) => debugStore.updateDebugOption('logClicksAndInputs', value)"
                      label="Clicks & Inputs"
                      size="sm"
                    />
                    <div
                      ref="logClicksAndInputsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logClicksAndInputs')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logHoverEvents"
                      @update:model-value="(value) => debugStore.updateDebugOption('logHoverEvents', value)"
                      label="Hover Events"
                      size="sm"
                    />
                    <div
                      ref="logHoverEventsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logHoverEvents')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logKeyboardEvents"
                      @update:model-value="(value) => debugStore.updateDebugOption('logKeyboardEvents', value)"
                      label="Keyboard Events"
                      size="sm"
                    />
                    <div
                      ref="logKeyboardEventsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logKeyboardEvents')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logUIInteractivity"
                      @update:model-value="(value) => debugStore.updateDebugOption('logUIInteractivity', value)"
                      label="UI Interactivity"
                      size="sm"
                    />
                    <div
                      ref="logUIInteractivityInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logUIInteractivity')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">UI & Components</h4>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logUIEvents"
                      @update:model-value="(value) => debugStore.updateDebugOption('logUIEvents', value)"
                      label="UI Events"
                      size="sm"
                    />
                    <div
                      ref="logUIEventsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logUIEvents')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logDropdownEvents"
                      @update:model-value="(value) => debugStore.updateDebugOption('logDropdownEvents', value)"
                      label="Dropdown Events"
                      size="sm"
                    />
                    <div
                      ref="logDropdownEventsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logDropdownEvents')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logTooltipEvents"
                      @update:model-value="(value) => debugStore.updateDebugOption('logTooltipEvents', value)"
                      label="Tooltip Events"
                      size="sm"
                    />
                    <div
                      ref="logTooltipEventsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logTooltipEvents')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logLoadingEvents"
                      @update:model-value="(value) => debugStore.updateDebugOption('logLoadingEvents', value)"
                      label="Loading Events"
                      size="sm"
                    />
                    <div
                      ref="logLoadingEventsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logLoadingEvents')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">File Operations</h4>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logFileSelection"
                      @update:model-value="(value) => debugStore.updateDebugOption('logFileSelection', value)"
                      label="File Selection"
                      size="sm"
                    />
                    <div
                      ref="logFileSelectionInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logFileSelection')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logDragAndDrop"
                      @update:model-value="(value) => debugStore.updateDebugOption('logDragAndDrop', value)"
                      label="Drag & Drop"
                      size="sm"
                    />
                    <div
                      ref="logDragAndDropInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logDragAndDrop')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logDragDropFailsafe"
                      @update:model-value="(value) => debugStore.updateDebugOption('logDragDropFailsafe', value)"
                      label="Drag & Drop Failsafe"
                      size="sm"
                    />
                    <div
                      ref="logDragDropFailsafeInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logDragDropFailsafe')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logDualProgress"
                      @update:model-value="(value) => debugStore.updateDebugOption('logDualProgress', value)"
                      label="Dual Progress Tracking"
                      size="sm"
                    />
                    <div
                      ref="logDualProgressInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logDualProgress')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">System & Management</h4>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logStoreActions"
                      @update:model-value="(value) => debugStore.updateDebugOption('logStoreActions', value)"
                      label="Store Actions"
                      size="sm"
                    />
                    <div
                      ref="logStoreActionsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logStoreActions')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logComposableManagerEvents"
                      @update:model-value="(value) => debugStore.updateDebugOption('logComposableManagerEvents', value)"
                      label="Composable Manager Events"
                      size="sm"
                    />
                    <div
                      ref="logComposableManagerEventsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logComposableManagerEvents')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logNotifications"
                      @update:model-value="(value) => debugStore.updateDebugOption('logNotifications', value)"
                      label="Notifications"
                      size="sm"
                    />
                    <div
                      ref="logNotificationsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logNotifications')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">Development & Warnings</h4>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logTraceEvents"
                      @update:model-value="(value) => debugStore.updateDebugOption('logTraceEvents', value)"
                      label="Trace Events"
                      size="sm"
                    />
                    <div
                      ref="logTraceEventsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logTraceEvents')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logMissingPropWarnings"
                      @update:model-value="(value) => debugStore.updateDebugOption('logMissingPropWarnings', value)"
                      label="Missing Prop Warnings"
                      size="sm"
                    />
                    <div
                      ref="logMissingPropWarningsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logMissingPropWarnings')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logComponentAttributes"
                      @update:model-value="(value) => debugStore.updateDebugOption('logComponentAttributes', value)"
                      label="Component Attributes"
                      size="sm"
                    />
                    <div
                      ref="logComponentAttributesInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logComponentAttributes')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logVueWarnings"
                      @update:model-value="(value) => debugStore.updateDebugOption('logVueWarnings', value)"
                      label="Vue Warnings"
                      size="sm"
                    />
                    <div
                      ref="logVueWarningsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logVueWarnings')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="debug-section">
                <h4 class="debug-section-title">System & Noise Control</h4>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.suppressDecorumLogs"
                      @update:model-value="(value) => debugStore.updateDebugOption('suppressDecorumLogs', value)"
                      label="Suppress DECORUM Messages"
                      size="sm"
                    />
                    <div
                      ref="suppressDecorumLogsInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('suppressDecorumLogs')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
                </div>
                <div class="debug-option">
                  <div class="debug-option-content">
                    <USwitch
                      :model-value="debugStore.debugOptions.logFileTableActivation"
                      @update:model-value="(value) => debugStore.updateDebugOption('logFileTableActivation', value)"
                      label="FileTable Activation Events"
                      size="sm"
                    />
                    <div
                      ref="logFileTableActivationInfoRef"
                      class="debug-info-icon-wrapper"
                      @mouseenter="handleInfoMouseEnter('logFileTableActivation')"
                      @mouseleave="handleInfoMouseLeave"
                    >
                      <Icon
                        name="mdi:information-outline"
                        class="debug-info-icon"
                      />
                    </div>
                  </div>
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

  <!-- InfoTooltips for debug options - placed outside OverlayScrollbarsComponent for proper positioning -->
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logComponentMounts'"
    :content="{ text: 'Logs when Vue components are mounted, updated, or unmounted. Useful for tracking component lifecycle events.' }"
    :target="logComponentMountsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logRefUpdates'"
    :content="{ text: 'Logs when template refs (like buttonRef) are updated. Helps track DOM element references.' }"
    :target="logRefUpdatesInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logRenderingEvents'"
    :content="{ text: 'Logs Vue rendering events like re-renders and template updates. Useful for performance debugging.' }"
    :target="logRenderingEventsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logClicksAndInputs'"
    :content="{ text: 'Logs user interaction events like clicks and input changes. Tracks user actions on buttons, inputs, and other interactive elements.' }"
    :target="logClicksAndInputsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logHoverEvents'"
    :content="{ text: 'Logs mouse hover events (mouseenter/mouseleave). Useful for debugging tooltip and hover interactions.' }"
    :target="logHoverEventsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logKeyboardEvents'"
    :content="{ text: 'Logs keyboard events like keydown, keyup, and keypress. Tracks user keyboard interactions.' }"
    :target="logKeyboardEventsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logUIInteractivity'"
    :content="{ text: 'For general UI interactions like scrolling or accordion transitions. Tracks non-click UI state changes.' }"
    :target="logUIInteractivityInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logUIEvents'"
    :content="{ text: 'For general UI interactions like scrolling or accordion transitions. Tracks UI state changes and transitions.' }"
    :target="logUIEventsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logDropdownEvents'"
    :content="{ text: 'Logs events specific to the DropdownMenu component. Tracks dropdown open/close events and interactions.' }"
    :target="logDropdownEventsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logTooltipEvents'"
    :content="{ text: 'Logs tooltip show/hide events and interactions. Useful for debugging tooltip behavior and positioning.' }"
    :target="logTooltipEventsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logLoadingEvents'"
    :content="{ text: 'Logs loading state changes and progress events. Tracks when components enter/exit loading states.' }"
    :target="logLoadingEventsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logFileSelection'"
    :content="{ text: 'Logs file selection events in the file table. Tracks when files are selected, deselected, or multi-selected.' }"
    :target="logFileSelectionInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logDragAndDrop'"
    :content="{ text: 'For handling Tauri\'s drag-and-drop events. Logs file drag operations and drop events.' }"
    :target="logDragAndDropInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logDragDropFailsafe'"
    :content="{ text: 'Logs drag-and-drop failsafe mechanisms and error handling. Tracks when drag operations fail or are interrupted.' }"
    :target="logDragDropFailsafeInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logDualProgress'"
    :content="{ text: 'Logs dual progress tracking for file operations. Tracks both individual file progress and overall job progress.' }"
    :target="logDualProgressInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logStoreActions'"
    :content="{ text: 'Logs actions and state changes within Pinia stores. Tracks when store state is modified and by which actions.' }"
    :target="logStoreActionsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logComposableManagerEvents'"
    :content="{ text: 'For events from composables that manage state (e.g., dropdownManager). Tracks composable lifecycle and state changes.' }"
    :target="logComposableManagerEventsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logNotifications'"
    :content="{ text: 'Logs notification events and state changes. Tracks when notifications are shown, hidden, or dismissed.' }"
    :target="logNotificationsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logMissingPropWarnings'"
    :content="{ text: 'For developer warnings about missing props or potential issues. Logs when components receive invalid or missing props.' }"
    :target="logMissingPropWarningsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logComponentAttributes'"
    :content="{ text: 'Logs component attribute changes and prop updates. Tracks when component props or attributes are modified.' }"
    :target="logComponentAttributesInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logVueWarnings'"
    :content="{ text: 'Logs Vue.js warnings and deprecation notices. Captures Vue framework warnings for debugging.' }"
    :target="logVueWarningsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logTraceEvents'"
    :content="{ text: 'Logs trace events with stack traces for detailed debugging. Useful for tracking function call chains and debugging complex issues.' }"
    :target="logTraceEventsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'suppressDecorumLogs'"
    :content="{ text: 'Suppresses DECORUM log messages from tauri-plugin-decorum. Reduces console noise from native window control messages.' }"
    :target="suppressDecorumLogsInfoRef"
    placement="right"
  />
  <InfoTooltip
    :visible="tooltipManager.activeTooltipId.value === 'logFileTableActivation'"
    :content="{ text: 'Logs FileTable activation/deactivation events. Tracks when file tables become active or inactive for focus management.' }"
    :target="logFileTableActivationInfoRef"
    placement="right"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDebugStore } from "@/stores/debugStore";
import { useThemeStore } from "@/stores/themeStore";
import { useTooltipManager } from "@/composables/useTooltipManager";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";
import CustomButton from "./CustomButton.vue";
import InfoTooltip from "./InfoTooltip.vue";

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

// Info icon refs for tooltips
const logComponentMountsInfoRef = ref<HTMLElement | null>(null);
const logRefUpdatesInfoRef = ref<HTMLElement | null>(null);
const logRenderingEventsInfoRef = ref<HTMLElement | null>(null);
const logClicksAndInputsInfoRef = ref<HTMLElement | null>(null);
const logHoverEventsInfoRef = ref<HTMLElement | null>(null);
const logKeyboardEventsInfoRef = ref<HTMLElement | null>(null);
const logUIInteractivityInfoRef = ref<HTMLElement | null>(null);
const logUIEventsInfoRef = ref<HTMLElement | null>(null);
const logDropdownEventsInfoRef = ref<HTMLElement | null>(null);
const logTooltipEventsInfoRef = ref<HTMLElement | null>(null);
const logLoadingEventsInfoRef = ref<HTMLElement | null>(null);
const logFileSelectionInfoRef = ref<HTMLElement | null>(null);
const logDragAndDropInfoRef = ref<HTMLElement | null>(null);
const logDragDropFailsafeInfoRef = ref<HTMLElement | null>(null);
const logDualProgressInfoRef = ref<HTMLElement | null>(null);
const logStoreActionsInfoRef = ref<HTMLElement | null>(null);
const logComposableManagerEventsInfoRef = ref<HTMLElement | null>(null);
const logNotificationsInfoRef = ref<HTMLElement | null>(null);
const logMissingPropWarningsInfoRef = ref<HTMLElement | null>(null);
const logComponentAttributesInfoRef = ref<HTMLElement | null>(null);
const logVueWarningsInfoRef = ref<HTMLElement | null>(null);
const logTraceEventsInfoRef = ref<HTMLElement | null>(null);
const suppressDecorumLogsInfoRef = ref<HTMLElement | null>(null);
const logFileTableActivationInfoRef = ref<HTMLElement | null>(null);

// Tooltip event handlers
const handleInfoMouseEnter = (tooltipId: string) => {
  tooltipManager.showTooltip(tooltipId);
};

const handleInfoMouseLeave = () => {
  tooltipManager.hideTooltip();
};

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
  const options = debugStore.debugOptions;
  const changedOptions: string[] = [];
  
  // Check which options need to be enabled
  if (!options.logComponentMounts) { debugStore.updateDebugOption('logComponentMounts', true); changedOptions.push('logComponentMounts'); }
  if (!options.logRefUpdates) { debugStore.updateDebugOption('logRefUpdates', true); changedOptions.push('logRefUpdates'); }
  if (!options.logRenderingEvents) { debugStore.updateDebugOption('logRenderingEvents', true); changedOptions.push('logRenderingEvents'); }
  if (!options.logClicksAndInputs) { debugStore.updateDebugOption('logClicksAndInputs', true); changedOptions.push('logClicksAndInputs'); }
  if (!options.logHoverEvents) { debugStore.updateDebugOption('logHoverEvents', true); changedOptions.push('logHoverEvents'); }
  if (!options.logKeyboardEvents) { debugStore.updateDebugOption('logKeyboardEvents', true); changedOptions.push('logKeyboardEvents'); }
  if (!options.logUIInteractivity) { debugStore.updateDebugOption('logUIInteractivity', true); changedOptions.push('logUIInteractivity'); }
  if (!options.logUIEvents) { debugStore.updateDebugOption('logUIEvents', true); changedOptions.push('logUIEvents'); }
  if (!options.logDropdownEvents) { debugStore.updateDebugOption('logDropdownEvents', true); changedOptions.push('logDropdownEvents'); }
  if (!options.logTooltipEvents) { debugStore.updateDebugOption('logTooltipEvents', true); changedOptions.push('logTooltipEvents'); }
  if (!options.logLoadingEvents) { debugStore.updateDebugOption('logLoadingEvents', true); changedOptions.push('logLoadingEvents'); }
  if (!options.logFileSelection) { debugStore.updateDebugOption('logFileSelection', true); changedOptions.push('logFileSelection'); }
  if (!options.logDragAndDrop) { debugStore.updateDebugOption('logDragAndDrop', true); changedOptions.push('logDragAndDrop'); }
  if (!options.logDragDropFailsafe) { debugStore.updateDebugOption('logDragDropFailsafe', true); changedOptions.push('logDragDropFailsafe'); }
  if (!options.logDualProgress) { debugStore.updateDebugOption('logDualProgress', true); changedOptions.push('logDualProgress'); }
  if (!options.logStoreActions) { debugStore.updateDebugOption('logStoreActions', true); changedOptions.push('logStoreActions'); }
  if (!options.logComposableManagerEvents) { debugStore.updateDebugOption('logComposableManagerEvents', true); changedOptions.push('logComposableManagerEvents'); }
  if (!options.logNotifications) { debugStore.updateDebugOption('logNotifications', true); changedOptions.push('logNotifications'); }
  if (!options.logMissingPropWarnings) { debugStore.updateDebugOption('logMissingPropWarnings', true); changedOptions.push('logMissingPropWarnings'); }
  if (!options.logComponentAttributes) { debugStore.updateDebugOption('logComponentAttributes', true); changedOptions.push('logComponentAttributes'); }
  if (!options.logVueWarnings) { debugStore.updateDebugOption('logVueWarnings', true); changedOptions.push('logVueWarnings'); }
  if (!options.logTraceEvents) { debugStore.updateDebugOption('logTraceEvents', true); changedOptions.push('logTraceEvents'); }
  if (!options.suppressDecorumLogs) { debugStore.updateDebugOption('suppressDecorumLogs', true); changedOptions.push('suppressDecorumLogs'); }
  if (!options.logFileTableActivation) { debugStore.updateDebugOption('logFileTableActivation', true); changedOptions.push('logFileTableActivation'); }
  
  // Log summary of changes
  if (changedOptions.length > 0) {
    console.log(`%c🔧 Enabled ${changedOptions.length} debug options: ${changedOptions.join(', ')}`, 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;');
  } else {
    console.log('%c🔧 All debug options already enabled', 'background: #9e9e9e; color: white; padding: 2px 4px; border-radius: 3px;');
  }
};

// Uncheck all logging options
const uncheckAllLoggingOptions = () => {
  const options = debugStore.debugOptions;
  const changedOptions: string[] = [];
  
  // Check which options need to be disabled
  if (options.logComponentMounts) { debugStore.updateDebugOption('logComponentMounts', false); changedOptions.push('logComponentMounts'); }
  if (options.logRefUpdates) { debugStore.updateDebugOption('logRefUpdates', false); changedOptions.push('logRefUpdates'); }
  if (options.logRenderingEvents) { debugStore.updateDebugOption('logRenderingEvents', false); changedOptions.push('logRenderingEvents'); }
  if (options.logClicksAndInputs) { debugStore.updateDebugOption('logClicksAndInputs', false); changedOptions.push('logClicksAndInputs'); }
  if (options.logHoverEvents) { debugStore.updateDebugOption('logHoverEvents', false); changedOptions.push('logHoverEvents'); }
  if (options.logKeyboardEvents) { debugStore.updateDebugOption('logKeyboardEvents', false); changedOptions.push('logKeyboardEvents'); }
  if (options.logUIInteractivity) { debugStore.updateDebugOption('logUIInteractivity', false); changedOptions.push('logUIInteractivity'); }
  if (options.logUIEvents) { debugStore.updateDebugOption('logUIEvents', false); changedOptions.push('logUIEvents'); }
  if (options.logDropdownEvents) { debugStore.updateDebugOption('logDropdownEvents', false); changedOptions.push('logDropdownEvents'); }
  if (options.logTooltipEvents) { debugStore.updateDebugOption('logTooltipEvents', false); changedOptions.push('logTooltipEvents'); }
  if (options.logLoadingEvents) { debugStore.updateDebugOption('logLoadingEvents', false); changedOptions.push('logLoadingEvents'); }
  if (options.logFileSelection) { debugStore.updateDebugOption('logFileSelection', false); changedOptions.push('logFileSelection'); }
  if (options.logDragAndDrop) { debugStore.updateDebugOption('logDragAndDrop', false); changedOptions.push('logDragAndDrop'); }
  if (options.logDragDropFailsafe) { debugStore.updateDebugOption('logDragDropFailsafe', false); changedOptions.push('logDragDropFailsafe'); }
  if (options.logDualProgress) { debugStore.updateDebugOption('logDualProgress', false); changedOptions.push('logDualProgress'); }
  if (options.logStoreActions) { debugStore.updateDebugOption('logStoreActions', false); changedOptions.push('logStoreActions'); }
  if (options.logComposableManagerEvents) { debugStore.updateDebugOption('logComposableManagerEvents', false); changedOptions.push('logComposableManagerEvents'); }
  if (options.logNotifications) { debugStore.updateDebugOption('logNotifications', false); changedOptions.push('logNotifications'); }
  if (options.logMissingPropWarnings) { debugStore.updateDebugOption('logMissingPropWarnings', false); changedOptions.push('logMissingPropWarnings'); }
  if (options.logComponentAttributes) { debugStore.updateDebugOption('logComponentAttributes', false); changedOptions.push('logComponentAttributes'); }
  if (options.logVueWarnings) { debugStore.updateDebugOption('logVueWarnings', false); changedOptions.push('logVueWarnings'); }
  if (options.logTraceEvents) { debugStore.updateDebugOption('logTraceEvents', false); changedOptions.push('logTraceEvents'); }
  if (options.suppressDecorumLogs) { debugStore.updateDebugOption('suppressDecorumLogs', false); changedOptions.push('suppressDecorumLogs'); }
  if (options.logFileTableActivation) { debugStore.updateDebugOption('logFileTableActivation', false); changedOptions.push('logFileTableActivation'); }
  
  // Log summary of changes
  if (changedOptions.length > 0) {
    console.log(`%c🔧 Disabled ${changedOptions.length} debug options: ${changedOptions.join(', ')}`, 'background: #f44336; color: white; padding: 2px 4px; border-radius: 3px;');
  } else {
    console.log('%c🔧 All debug options already disabled', 'background: #9e9e9e; color: white; padding: 2px 4px; border-radius: 3px;');
  }
};
</script>

<style scoped>
@import "./DebugPopup.scoped.css";
</style>
