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
  <teleport to="body">
    <Transition name="debug-popup-fade" appear>
              <div
          v-if="debugStore.isDebugPopupVisible"
          ref="popupRef"
          class="debug-popup"
          :style="{ ...popupStyle, ...borderStyle }"
          data-component-name="DebugPopup"
          @mousedown="handlePopupMouseDown"
          @focus="handlePopupFocus"
          @blur="handlePopupBlur"
          tabindex="0"
        >
              <div
          class="debug-popup__header"
          :style="headerStyle"
          @mousedown="startDrag"
        >
        <h3 class="debug-popup__title">
          <Icon name="mdi:bug" class="debug-popup__icon" />
          Debug Options
        </h3>
        <CustomButton
          button-style-class="trans-btn"
          class="debug-popup__close-button"
          data-name="close-debug-popup-btn"
          first-icon-name="mdi:close"
          :first-icon-size="16"
          @click="debugStore.toggleDebugPopup"
        />
      </div>

      <div class="debug-popup__content" :style="contentStyle">
                  <div class="debug-popup__tabs">
            <!-- Tab Navigation -->
            <div class="debug-popup__tab-nav" :style="tabNavStyle">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="debug-popup__tab-button"
              :class="{ 'debug-popup__tab-button--active': activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              <Icon :name="tab.icon" class="debug-popup__tab-icon" />
              <span class="debug-popup__tab-text">{{ tab.label }}</span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="debug-popup__tab-content">
            <!-- General Tab -->
            <div v-if="activeTab === 'general'" class="debug-popup__tab-panel">
              <div class="debug-popup__general-content">
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
                  class="debug-popup__scrollbar--stretch"
                >
                  <div class="debug-popup__general-scrollable-content">
                    <div class="debug-popup__general-options">
                      <!-- Opacity Controls -->
                      <div class="debug-popup__option-group">
                        <h3>Opacity Controls</h3>

                        <!-- Primary Opacity Slider -->
                        <div class="debug-popup__opacity-control">
                          <label class="debug-popup__opacity-label">
                            <span>Primary Opacity</span>
                            <span class="debug-popup__opacity-value">{{ Math.round(debugStore.debugOptions.debugPopupOpacity * 100) }}%</span>
                          </label>
                          <USlider
                            :model-value="debugStore.debugOptions.debugPopupOpacity"
                            :min="0.05"
                            :max="1"
                            :step="0.05"
                            @update:model-value="(value) => debugStore.updateDebugOption('debugPopupOpacity', value)"
                          />
                        </div>

                        <!-- Secondary Opacity Slider -->
                        <div class="debug-popup__opacity-control">
                          <label class="debug-popup__opacity-label">
                            <span>Secondary Opacity</span>
                            <span class="debug-popup__opacity-value">{{ Math.round(debugStore.debugOptions.debugPopupInteriorOpacity * 100) }}%</span>
                          </label>
                          <USlider
                            :model-value="debugStore.debugOptions.debugPopupInteriorOpacity"
                            :min="0.05"
                            :max="1"
                            :step="0.05"
                            @update:model-value="(value) => debugStore.updateDebugOption('debugPopupInteriorOpacity', value)"
                          />
                        </div>

                        <!-- Drag Opacity Slider -->
                        <div class="debug-popup__opacity-control">
                          <label class="debug-popup__opacity-label">
                            <span>Drag Opacity</span>
                            <span class="debug-popup__opacity-value">{{ Math.round(debugStore.debugOptions.debugPopupSecondaryOpacity * 100) }}%</span>
                          </label>
                          <USlider
                            :model-value="debugStore.debugOptions.debugPopupSecondaryOpacity"
                            :min="0.05"
                            :max="1"
                            :step="0.05"
                            @update:model-value="(value) => debugStore.updateDebugOption('debugPopupSecondaryOpacity', value)"
                          />
                          <div class="debug-popup__opacity-preview">
                            <span>Preview: {{ Math.round(debugStore.secondaryOpacity * 100) }}% while moving</span>
                          </div>
                        </div>
                      </div>

                      <!-- Backdrop Blur Controls -->
                      <div class="debug-popup__option-group">
                        <h3>Backdrop Blur</h3>
                        
                        <!-- Backdrop Blur Slider -->
                        <div class="debug-popup__opacity-control">
                          <label class="debug-popup__opacity-label">
                            <span>Backdrop Blur</span>
                            <span class="debug-popup__opacity-value">{{ Math.round(debugStore.debugOptions.backdropBlur) }}px</span>
                            <div
                              :ref="(el) => infoIconRefs['debugButtonBackdropBlur'] = el as HTMLElement"
                              class="debug-popup__info-icon-wrapper"
                              title="Controls the backdrop blur intensity behind the debug button. Higher values create more blur effect."
                              @mouseenter="(event) => handleInfoIconMouseEnter('debugButtonBackdropBlur', event)"
                              @mouseleave="handleInfoIconMouseLeave"
                            >
                              <Icon name="mdi:information" class="debug-popup__info-icon" />
                            </div>
                          </label>
                          <USlider
                            :model-value="debugStore.debugOptions.backdropBlur"
                            :min="0"
                            :max="20"
                            :step="1"
                            @update:model-value="(value) => debugStore.updateDebugOption('backdropBlur', value)"
                          />
                        </div>

                        <!-- Disable Backdrop Blur During Drag Switch -->
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.disableBackdropBlurOnDrag"
                            @update:model-value="(value) => debugStore.updateDebugOption('disableBackdropBlurOnDrag', value)"
                          />
                          <span>Disable Blur During Drag</span>
                          <div
                            :ref="(el) => infoIconRefs['disableBackdropBlurOnDrag'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('disableBackdropBlurOnDrag', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>

                      </div>

                      <!-- Other General Options -->
                      <div class="debug-popup__option-group">
                        <h3>Other Options</h3>

                        <!-- Windows Long Paths Override -->
                        <div class="debug-popup__option-group">
                          <h4>Windows Long Paths Detection</h4>
                          <div class="debug-popup__option">
                            <CustomButtonGroup>
                              <CustomButton
                                btn-theme="liter"
                                button-style-class="trans-btn can-become-active active-line-block-end"
                                data-name="windows-long-paths-auto-detect-btn"
                                :class="{ active: activeLongPathsMode === 'auto' }"
                                @click="handleLongPathsModeChange('auto')"
                              >
                                Auto Detect
                              </CustomButton>
                              
                              <CustomButton
                                btn-theme="liter"
                                button-style-class="trans-btn can-become-active active-line-block-end"
                                data-name="windows-long-paths-force-long-btn"
                                :class="{ active: activeLongPathsMode === 'force-long' }"
                                @click="handleLongPathsModeChange('force-long')"
                              >
                                Force Long Paths
                              </CustomButton>
                              
                              <CustomButton
                                btn-theme="liter"
                                button-style-class="trans-btn can-become-active active-line-block-end"
                                data-name="windows-long-paths-force-short-btn"
                                :class="{ active: activeLongPathsMode === 'force-short' }"
                                @click="handleLongPathsModeChange('force-short')"
                              >
                                Force Short Paths
                              </CustomButton>
                            </CustomButtonGroup>
                            <div
                              :ref="(el) => infoIconRefs['windowsLongPathsOverride'] = el as HTMLElement"
                              class="debug-popup__info-icon-wrapper"
                              @mouseenter="(event) => handleInfoIconMouseEnter('windowsLongPathsOverride', event)"
                              @mouseleave="handleInfoIconMouseLeave"
                            >
                              <Icon name="mdi:information" class="debug-popup__info-icon" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Vue Compilation Debugging -->
                      <div class="debug-popup__option-group">
                        <h3>Vue Compilation Debugging</h3>
                        <div class="debug-popup__option">
                          <CustomButton
                            btn-theme="warning"
                            button-style-class="trans-btn"
                            data-name="vue-compilation-debug-btn"
                            first-icon-name="mdi:vuejs"
                            :first-icon-size="16"
                            @click="runVueCompilationDebug"
                          >
                            Debug Vue Compilation
                          </CustomButton>
                          <div
                            :ref="(el) => infoIconRefs['vueCompilationDebug'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('vueCompilationDebug', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </div>
                        <div class="debug-popup__option">
                          <CustomButton
                            btn-theme="danger"
                            button-style-class="trans-btn"
                            data-name="check-template-errors-btn"
                            first-icon-name="mdi:alert-circle"
                            :first-icon-size="16"
                            @click="checkForTemplateErrors"
                          >
                            Check Template Errors
                          </CustomButton>
                          <div
                            :ref="(el) => infoIconRefs['checkTemplateErrors'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('checkTemplateErrors', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </OverlayScrollbarsComponent>
              </div>
            </div>

            <!-- Logging Tab -->
            <div v-if="activeTab === 'logging'" class="debug-popup__tab-panel" data-tab="logging">
              <div class="debug-popup__logging-content">
                <!-- Enable/Disable All Buttons -->
                <div class="debug-popup__logging-header">
                  <CustomButton
                    btn-theme="primary"
                    button-style-class="trans-btn"
                    data-name="enable-all-logging-btn"
                    first-icon-name="mdi:check-all"
                    :first-icon-size="16"
                    @click="checkAllLoggingOptions"
                  >
                    Enable All
                  </CustomButton>
                  <CustomButton
                    btn-theme="default"
                    button-style-class="trans-btn"
                    data-name="disable-all-logging-btn"
                    first-icon-name="mdi:close-box-multiple"
                    :first-icon-size="16"
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
                  class="debug-popup__scrollbar--stretch"
                >
                  <div class="debug-popup__logging-scrollable-content">
                    <!-- Logging Options Grid -->
                    <div class="debug-popup__logging-options">
                      <!-- Component Mounts -->
                      <div class="debug-popup__option-group">
                        <h3>Component & Rendering</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logComponentMounts"
                            @update:model-value="(value) => debugStore.updateDebugOption('logComponentMounts', value)"
                          />
                          <span>Component Mounts</span>
                          <div 
                            :ref="(el) => infoIconRefs['logComponentMounts'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logComponentMounts', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logRefUpdates"
                            @update:model-value="(value) => debugStore.updateDebugOption('logRefUpdates', value)"
                          />
                          <span>Ref Updates</span>
                          <div 
                            :ref="(el) => infoIconRefs['logRefUpdates'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logRefUpdates', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logRenderingEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logRenderingEvents', value)"
                          />
                          <span>Rendering Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logRenderingEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logRenderingEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- User Interactions -->
                      <div class="debug-popup__option-group">
                        <h3>User Interactions</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logClicksAndInputs"
                            @update:model-value="(value) => debugStore.updateDebugOption('logClicksAndInputs', value)"
                          />
                          <span>Clicks & Inputs</span>
                          <div 
                            :ref="(el) => infoIconRefs['logClicksAndInputs'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logClicksAndInputs', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logHoverEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logHoverEvents', value)"
                          />
                          <span>Hover Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logHoverEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logHoverEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logKeyboardEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logKeyboardEvents', value)"
                          />
                          <span>Keyboard Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logKeyboardEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logKeyboardEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logUIInteractivity"
                            @update:model-value="(value) => debugStore.updateDebugOption('logUIInteractivity', value)"
                          />
                          <span>UI Interactivity</span>
                          <div 
                            :ref="(el) => infoIconRefs['logUIInteractivity'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logUIInteractivity', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- UI Events -->
                      <div class="debug-popup__option-group">
                        <h3>UI Events</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logUIEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logUIEvents', value)"
                          />
                          <span>UI Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logUIEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logUIEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDropdownEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDropdownEvents', value)"
                          />
                          <span>Dropdown Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logDropdownEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logDropdownEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTooltipEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTooltipEvents', value)"
                          />
                          <span>Tooltip Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logTooltipEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logTooltipEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- File Operations -->
                      <div class="debug-popup__option-group">
                        <h3>File Operations</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logFileSelection"
                            @update:model-value="(value) => debugStore.updateDebugOption('logFileSelection', value)"
                          />
                          <span>File Selection</span>
                          <div 
                            :ref="(el) => infoIconRefs['logFileSelection'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logFileSelection', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDragAndDrop"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDragAndDrop', value)"
                          />
                          <span>Drag & Drop</span>
                          <div 
                            :ref="(el) => infoIconRefs['logDragAndDrop'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logDragAndDrop', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDragDropFailsafe"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDragDropFailsafe', value)"
                          />
                          <span>Drag & Drop Failsafe</span>
                          <div 
                            :ref="(el) => infoIconRefs['logDragDropFailsafe'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logDragDropFailsafe', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- Store & State -->
                      <div class="debug-popup__option-group">
                        <h3>Store & State</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logStoreActions"
                            @update:model-value="(value) => debugStore.updateDebugOption('logStoreActions', value)"
                          />
                          <span>Store Actions</span>
                          <div 
                            :ref="(el) => infoIconRefs['logStoreActions'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logStoreActions', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logComposableManagerEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logComposableManagerEvents', value)"
                          />
                          <span>Composable Manager Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logComposableManagerEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logComposableManagerEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- System Events -->
                      <div class="debug-popup__option-group">
                        <h3>System Events</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logLoadingEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logLoadingEvents', value)"
                          />
                          <span>Loading Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logLoadingEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logLoadingEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDualProgress"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDualProgress', value)"
                          />
                          <span>Dual Progress</span>
                          <div 
                            :ref="(el) => infoIconRefs['logDualProgress'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logDualProgress', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logNotifications"
                            @update:model-value="(value) => debugStore.updateDebugOption('logNotifications', value)"
                          />
                          <span>Notifications</span>
                          <div 
                            :ref="(el) => infoIconRefs['logNotifications'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logNotifications', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTraceEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTraceEvents', value)"
                          />
                          <span>Trace Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logTraceEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logTraceEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logDebugButtonPositions"
                            @update:model-value="(value) => debugStore.updateDebugOption('logDebugButtonPositions', value)"
                          />
                          <span>Debug Button Positions</span>
                          <div
                            :ref="(el) => infoIconRefs['logDebugButtonPositions'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logDebugButtonPositions', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- Warnings & Errors -->
                      <div class="debug-popup__option-group">
                        <h3>Warnings & Errors</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logMissingPropWarnings"
                            @update:model-value="(value) => debugStore.updateDebugOption('logMissingPropWarnings', value)"
                          />
                          <span>Missing Prop Warnings</span>
                          <div 
                            :ref="(el) => infoIconRefs['logMissingPropWarnings'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logMissingPropWarnings', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logComponentAttributes"
                            @update:model-value="(value) => debugStore.updateDebugOption('logComponentAttributes', value)"
                          />
                          <span>Component Attributes</span>
                          <div 
                            :ref="(el) => infoIconRefs['logComponentAttributes'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logComponentAttributes', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logVueWarnings"
                            @update:model-value="(value) => debugStore.updateDebugOption('logVueWarnings', value)"
                          />
                          <span>Vue Warnings</span>
                          <div 
                            :ref="(el) => infoIconRefs['logVueWarnings'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logVueWarnings', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- Special Options -->
                      <div class="debug-popup__option-group">
                        <h3>Special Options</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.decorumMessages"
                            @update:model-value="(value) => debugStore.updateDebugOption('decorumMessages', value)"
                          />
                          <span>Decorum Messages</span>
                          <div 
                            :ref="(el) => infoIconRefs['decorumMessages'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('decorumMessages', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logFileTableActivation"
                            @update:model-value="(value) => debugStore.updateDebugOption('logFileTableActivation', value)"
                          />
                          <span>FileTable Activation</span>
                          <div 
                            :ref="(el) => infoIconRefs['logFileTableActivation'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logFileTableActivation', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>

                      <!-- Tooltip Debugging -->
                      <div class="debug-popup__option-group">
                        <h3>Tooltip Debugging</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTooltipCreation"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTooltipCreation', value)"
                          />
                          <span>Tooltip Creation</span>
                          <div 
                            :ref="(el) => infoIconRefs['logTooltipCreation'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logTooltipCreation', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTooltipTargetResolution"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTooltipTargetResolution', value)"
                          />
                          <span>Tooltip Target Resolution</span>
                          <div 
                            :ref="(el) => infoIconRefs['logTooltipTargetResolution'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logTooltipTargetResolution', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTooltipVisibilityChanges"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTooltipVisibilityChanges', value)"
                          />
                          <span>Tooltip Visibility Changes</span>
                          <div 
                            :ref="(el) => infoIconRefs['logTooltipVisibilityChanges'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logTooltipVisibilityChanges', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTitleBarEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTitleBarEvents', value)"
                          />
                          <span>TitleBar events</span>
                          <div 
                            :ref="(el) => infoIconRefs['logTitleBarEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logTitleBarEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.logTooltipOrphanedDetection"
                            @update:model-value="(value) => debugStore.updateDebugOption('logTooltipOrphanedDetection', value)"
                          />
                          <span>Tooltip Orphaned Detection</span>
                          <div 
                            :ref="(el) => infoIconRefs['logTooltipOrphanedDetection'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('logTooltipOrphanedDetection', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </OverlayScrollbarsComponent>

                <!-- Bottom Action Buttons -->
                <div class="debug-popup__logging-actions">
                  <div class="button-pair">
                    <CustomButton
                      btn-theme="info"
                      button-style-class="trans-btn"
                      data-name="show-debug-status-btn"
                      first-icon-name="mdi:information"
                      :first-icon-size="16"
                      @click="showDebugStatus"
                    >
                      Show Status
                    </CustomButton>
                    <CustomButton
                      btn-theme="warning"
                      button-style-class="trans-btn"
                      data-name="refresh-debug-btn"
                      first-icon-name="mdi:refresh"
                      :first-icon-size="16"
                      @click="debugStore.forceRefresh"
                    >
                      Refresh
                    </CustomButton>
                  </div>
                  <div class="button-pair">
                    <CustomButton
                      btn-theme="danger"
                      button-style-class="trans-btn"
                      data-name="reset-debug-btn"
                      first-icon-name="mdi:restore"
                      :first-icon-size="16"
                      @click="debugStore.resetDebugOptions"
                    >
                      Reset
                    </CustomButton>
                    <CustomButton
                      btn-theme="default"
                      button-style-class="trans-btn"
                      data-name="reset-dimensions-btn"
                      first-icon-name="mdi:resize"
                      :first-icon-size="16"
                      @click="debugStore.resetDebugPopupDimensions"
                    >
                      Reset Size
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- InfoTooltips Tab -->
            <div v-if="activeTab === 'tooltips'" class="debug-popup__tab-panel">
              <div class="debug-popup__tooltips-content">
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
                  class="debug-popup__scrollbar--stretch"
                >
                  <div class="debug-popup__tooltips-scrollable-content">
                    <div class="debug-popup__tooltips-options">
                      <div class="debug-popup__option-group">
                        <h3>Tooltip Behavior</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.preventTooltipClosing"
                            @update:model-value="(value) => debugStore.updateDebugOption('preventTooltipClosing', value)"
                          />
                          <span>Prevent Tooltip Closing</span>
                          <HotKey :keys="['CTRL', 'ALT', 'SHIFT', 'T']" size="small" :show-icon="false" />
                          <div 
                            :ref="(el) => infoIconRefs['preventTooltipClosing'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('preventTooltipClosing', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>

                      <div class="debug-popup__option-group">
                        <h3>Tooltip Debugging</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.disableDropdownPointerEvents"
                            @update:model-value="(value) => debugStore.updateDebugOption('disableDropdownPointerEvents', value)"
                          />
                          <span>Disable Dropdown Pointer Events</span>
                          <div 
                            :ref="(el) => infoIconRefs['disableDropdownPointerEvents'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('disableDropdownPointerEvents', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.increaseTooltipZIndex"
                            @update:model-value="(value) => debugStore.updateDebugOption('increaseTooltipZIndex', value)"
                          />
                          <span>Increase Tooltip Z-Index</span>
                          <div 
                            :ref="(el) => infoIconRefs['increaseTooltipZIndex'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('increaseTooltipZIndex', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.forceTooltipInteractive"
                            @update:model-value="(value) => debugStore.updateDebugOption('forceTooltipInteractive', value)"
                          />
                          <span>Force Tooltip Interactive</span>
                          <div 
                            :ref="(el) => infoIconRefs['forceTooltipInteractive'] = el as HTMLElement"
                            class="debug-popup__info-icon-wrapper"
                            @mouseenter="(event) => handleInfoIconMouseEnter('forceTooltipInteractive', event)"
                            @mouseleave="handleInfoIconMouseLeave"
                          >
                            <Icon name="mdi:information" class="debug-popup__info-icon" />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </OverlayScrollbarsComponent>
              </div>
            </div>

            <!-- DebugButton Tab -->
            <div v-if="activeTab === 'debugbutton'" class="debug-tab-panel debug-popup__tab-panel--grid">
              <div class="debug-popup__general-content">
                <!-- Scrollable content area -->
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
                  class="debug-popup__scrollbar--stretch"
                >
                  <div class="debug-popup__general-scrollable-content">
                    <div class="debug-popup__general-options">
                      <!-- Button Size Controls -->
                      <div class="debug-popup__option-group">
                        <h3>Button Size</h3>

                        <!-- Button Size Slider -->
                        <div class="debug-popup__opacity-control">
                          <label class="debug-popup__opacity-label">
                            <span>Button Size</span>
                            <span class="debug-popup__opacity-value">{{ debugStore.debugOptions.debugButtonSize ?? 34 }}px</span>
                            <div
                              :ref="(el) => infoIconRefs['debugButtonSize'] = el as HTMLElement"
                              class="debug-popup__info-icon-wrapper"
                              title="Controls the overall size of the debug button. Larger values make the button bigger and easier to click."
                              @mouseenter="(event) => handleInfoIconMouseEnter('debugButtonSize', event)"
                              @mouseleave="handleInfoIconMouseLeave"
                            >
                              <Icon name="mdi:information" class="debug-popup__info-icon" />
                            </div>
                          </label>
                          <USlider
                            :model-value="debugStore.debugOptions.debugButtonSize"
                            :min="20"
                            :max="60"
                            :step="2"
                            @update:model-value="(value) => debugStore.updateDebugOption('debugButtonSize', value)"
                          />
                        </div>

                        <!-- Icon Size Slider -->
                        <div class="debug-popup__opacity-control">
                          <label class="debug-popup__opacity-label">
                            <span>Icon Size</span>
                            <span class="debug-popup__opacity-value">{{ debugStore.debugOptions.debugButtonIconSize ?? 20 }}px</span>
                            <div
                              :ref="(el) => infoIconRefs['debugButtonIconSize'] = el as HTMLElement"
                              class="debug-popup__info-icon-wrapper"
                              title="Controls the size of the icon inside the debug button. This is independent of the button size."
                              @mouseenter="(event) => handleInfoIconMouseEnter('debugButtonIconSize', event)"
                              @mouseleave="handleInfoIconMouseLeave"
                            >
                              <Icon name="mdi:information" class="debug-popup__info-icon" />
                            </div>
                          </label>
                          <USlider
                            :model-value="debugStore.debugOptions.debugButtonIconSize"
                            :min="12"
                            :max="32"
                            :step="1"
                            @update:model-value="(value) => debugStore.updateDebugOption('debugButtonIconSize', value)"
                          />
                        </div>
                      </div>

                      <!-- Visual Effects -->
                      <div class="debug-popup__option-group">
                        <h3>Visual Effects</h3>

                        <!-- Backdrop Blur Slider -->
                        <div class="debug-popup__opacity-control">
                          <label class="debug-popup__opacity-label">
                            <span>Backdrop Blur</span>
                            <span class="debug-popup__opacity-value">{{ debugStore.debugOptions.debugButtonBackdropBlur ?? 0 }}px</span>
                            <div
                              :ref="(el) => infoIconRefs['debugButtonBackdropBlur'] = el as HTMLElement"
                              class="debug-popup__info-icon-wrapper"
                              title="Controls the backdrop blur intensity behind the debug button. Higher values create more blur effect."
                              @mouseenter="(event) => handleInfoIconMouseEnter('debugButtonBackdropBlur', event)"
                              @mouseleave="handleInfoIconMouseLeave"
                            >
                              <Icon name="mdi:information" class="debug-popup__info-icon" />
                            </div>
                          </label>
                          <USlider
                            :model-value="debugStore.debugOptions.debugButtonBackdropBlur"
                            :min="0"
                            :max="20"
                            :step="1"
                            @update:model-value="(value) => debugStore.updateDebugOption('debugButtonBackdropBlur', value)"
                          />
                        </div>

                        <!-- Background & Border Colors Section -->
                        <div class="debug-popup__colors-section">
                          <h3 class="debug-popup__section-header">Background & Border Colors</h3>
                          <div class="debug-popup__colors-grid">
                            <!-- Background Color Picker -->
                            <div class="debug-popup__color-item">
                              <ColorPickerInput
                                v-model="debugStore.debugOptions.debugButtonBackgroundColor"
                                label="Background Color"
                                title="Click to open color picker for the debug button background color and transparency."
                                info-text="Controls the background color and transparency of the debug button."
                                icon-name="mdi:palette"
                                @info-mouse-enter="(event) => handleInfoIconMouseEnter('debugButtonBackgroundColor', event)"
                                @info-mouse-leave="handleInfoIconMouseLeave"
                              />
                            </div>

                            <!-- Border Color Picker -->
                            <div class="debug-popup__color-item">
                              <ColorPickerInput
                                v-model="debugStore.debugOptions.debugButtonBorderColor"
                                label="Border Color"
                                title="Click to open color picker for the debug button border color and transparency."
                                info-text="Controls the border color and transparency of the debug button."
                                icon-name="mdi:palette"
                                preview-mode="border"
                                @info-mouse-enter="(event) => handleInfoIconMouseEnter('debugButtonBorderColor', event)"
                                @info-mouse-leave="handleInfoIconMouseLeave"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </OverlayScrollbarsComponent>

                <!-- Fixed reset button at bottom -->
                <div class="debug-popup__tab-panel-footer">
                  <CustomButton
                    btn-theme="warning"
                    button-style-class="trans-btn"
                    data-name="reset-debug-button-options-btn"
                    first-icon-name="mdi:restore"
                    :first-icon-size="16"
                    @click="resetDebugButtonOptions"
                  >
                    Reset DebugButton Options
                  </CustomButton>
                </div>
              </div>
            </div>

            <!-- TitleBar Tab -->
            <div v-if="activeTab === 'titlebar'" class="debug-popup__tab-panel">
              <div class="debug-popup__general-content">
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
                  class="debug-popup__scrollbar--stretch"
                >
                  <div class="debug-popup__general-scrollable-content">
                    <div class="debug-popup__general-options">
                      <div class="debug-popup__option-group">
                        <h3>TitleBar Debug</h3>
                        <label class="debug-popup__option">
                          <USwitch
                            :model-value="debugStore.debugOptions.showTitlebarHighlight"
                            @update:model-value="(value) => debugStore.updateDebugOption('showTitlebarHighlight', value)"
                          />
                          <span>Show drag-region highlight</span>
                        </label>
                        <!-- TitleBar logging moved to the Logging tab -->

                        <div class="debug-popup__opacity-control">
                          <label class="debug-popup__opacity-label">
                            <span>Highlight opacity</span>
                            <span class="debug-popup__opacity-value">{{ Math.round((debugStore.debugOptions.titlebarHighlightOpacity || 0) * 100) }}%</span>
                          </label>
                          <USlider
                            :model-value="debugStore.debugOptions.titlebarHighlightOpacity"
                            :min="0"
                            :max="1"
                            :step="0.05"
                            @update:model-value="(value) => debugStore.updateDebugOption('titlebarHighlightOpacity', value)"
                          />
                        </div>

                        <div class="debug-popup__opacity-control">
                          <label class="debug-popup__opacity-label">
                            <span>Highlight color</span>
                          </label>
                          <input type="color" :value="colorToHex(debugStore.debugOptions.titlebarHighlightColor)" @input="(e) => updateTitlebarColor((e.target as HTMLInputElement)?.value || '')" />
                        </div>
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
  </teleport>



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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import type { DropdownMenuItem } from "@nuxt/ui";
import { useDebugStore } from "@/stores/debugStore";
import { useThemeStore } from "@/stores/themeStore";
import { useTooltipManager } from "@/composables/useTooltipManager";
import { DEBUG, debugConfig } from "@/utils/debugConfig";
import { logColorPicker } from "@/utils/loggers";
import CustomButton from "./CustomButton.vue";
import CustomButtonGroup from "./CustomButtonGroup.vue";
import InfoTooltip from "./InfoTooltip.vue";
import HotKey from "./HotKey.vue";
import ColorPickerInput from "./ColorPickerInput.vue";
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
  },
  {
    id: 'debugbutton',
    label: 'DebugButton',
    icon: 'mdi:bug'
  },
  {
    id: 'titlebar',
    label: 'TitleBar',
    icon: 'mdi:window-maximize'
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
  logDebugButtonPositions: {
    text: "Logs mouse position and debug button position every 25ms during dragging for debugging button behavior.",
    example: "🔧 Debug Button - Mouse: (123, 456) | Button: (100, 400) | Distance: 57px"
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
  logTooltipCreation: {
    text: "Logs when InfoTooltip components are created, mounted, and unmounted. Helps track duplicate tooltip instances.",
    example: "🔧 [InfoTooltip] Component created for tooltip-id"
  },
  logTooltipTargetResolution: {
    text: "Logs detailed information about how tooltip targets are resolved and validated.",
    example: "🔧 [InfoTooltip] Target resolved: element details"
  },
  logTooltipVisibilityChanges: {
    text: "Logs all tooltip visibility state changes including show/hide transitions.",
    example: "🔧 [InfoTooltip] Visibility changed: true/false"
  },
  logTitleBarEvents: {
    text: "Logs TitleBar interactions such as tooltip shows, theme changes, nav clicks, and dblclick maximize toggles.",
    example: "🔧 [TitleBar] dblclick toggle maximize"
  },
  logTooltipOrphanedDetection: {
    text: "Logs orphaned tooltip detection and cleanup operations.",
    example: "🔧 [InfoTooltip] Orphaned tooltip detected: cleanup details"
  },
  preventTooltipClosing: {
    text: "Prevents tooltips from closing once they become active. Useful for debugging tooltip positioning and behavior.",
    example: "Tooltips will stay visible until this option is disabled"
  },
  debugPopupSecondaryOpacity: {
    text: "Controls the opacity level that applies while dragging the debug popup window. This allows you to see through the popup while moving it.",
    example: "50% drag opacity while moving the popup"
  },
  debugPopupInteriorOpacity: {
    text: "Controls the opacity of all interior elements (buttons, sliders, text, etc.) within the debug popup. This affects the overall visibility of the content.",
    example: "80% makes interior elements slightly transparent"
  },
  disableDropdownPointerEvents: {
    text: "Disables pointer events on dropdown overlays to allow element selection in dev tools. This prevents dropdowns from blocking tooltip interaction.",
    example: "Dropdown overlays become transparent to mouse events"
  },
  increaseTooltipZIndex: {
    text: "Increases the z-index of tooltip containers and tooltips to appear above dropdown overlays and other UI elements.",
    example: "Tooltips appear above dropdown menus and modals"
  },
  forceTooltipInteractive: {
    text: "Forces tooltips to become interactive by disabling pointer-events: none. This allows tooltips to be selected in dev tools element picker.",
    example: "Tooltips can be clicked and selected in dev tools"
  },
  backdropBlur: {
    text: "Controls the backdrop blur intensity of the debug popup window. Higher values create more blur effect behind the popup.",
    example: "10px blur creates a moderate blur effect"
  },
  disableBackdropBlurOnDrag: {
    text: "Disables backdrop blur while dragging the debug popup window. This allows you to easily see what's behind the popup while moving it.",
    example: "Blur is temporarily disabled while moving the popup"
  },
  debugButtonSize: {
    text: "Controls the overall size of the debug button. Larger values make the button bigger and easier to click.",
    example: "40px creates a comfortably sized debug button"
  },
  debugButtonIconSize: {
    text: "Controls the size of the icon inside the debug button. This is independent of the button size.",
    example: "24px makes the bug icon clearly visible"
  },
  debugButtonBackdropBlur: {
    text: "Controls the backdrop blur intensity behind the debug button. Higher values create more blur effect.",
    example: "5px blur creates a subtle glass effect"
  },
  debugButtonBackgroundColor: {
    text: "Controls the background color and transparency of the debug button.",
    example: "hsla(0, 0%, 0%, 0.5) creates a semi-transparent black background"
  },
  debugButtonBorderColor: {
    text: "Controls the border color and transparency of the debug button.",
    example: "hsla(255, 255, 255, 0.8) creates a semi-transparent white border"
  },
  windowsLongPathsOverride: {
    text: "Control Windows long paths detection. 'Auto Detect' checks the registry to determine if long paths are enabled. 'Use Long Paths' tells the app long paths are enabled. 'Long Paths Disabled' tells the app long paths are disabled. This affects path length warnings.",
    example: "Use 'Auto Detect' for automatic registry checking, or manually set based on your system configuration"
  },
  vueCompilationDebug: {
    text: "Runs a comprehensive Vue compilation debugging inspection. This checks for Vue components, template patterns that might cause compilation errors, and provides debugging tips.",
    example: "Use when encountering 'codegen node is missing' errors"
  },
  checkTemplateErrors: {
    text: "Scans the DOM for Vue template errors and problematic patterns. This helps identify components with nested template structures that might cause compilation issues.",
    example: "Helps debug Vue compilation errors and template structure issues"
  }
};

// Refs for info icon wrappers
const infoIconRefs = ref<Record<string, HTMLElement | null>>({});

// Drag state
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragStartPosition = ref({ x: 0, y: 0 });

// Active state for the popup
const isActive = ref(false);

// Color Picker Debugging Functions
const inspectColorPickerDOM = () => {
  if (DEBUG && debugConfig.logTooltipEvents) {
    // Find all color picker related elements
    const colorPickerElements = [
      ...document.querySelectorAll('[class*="color-picker"]'),
      ...document.querySelectorAll('.color-picker'),
      ...document.querySelectorAll('.color-picker-panel'),
      ...document.querySelectorAll('.color-picker-overlay'),
      ...document.querySelectorAll('.color-picker-dropdown'),
      ...document.querySelectorAll('.color-picker-popup'),
      // Sandbox elements (most important for z-index issues)
      ...document.querySelectorAll('#nuxt-color-picker\\:sandbox'),
      ...document.querySelectorAll('.CP-sandbox'),
      ...document.querySelectorAll('[id*="color-picker"][id*="sandbox"]'),
      ...document.querySelectorAll('[class*="color-picker"][class*="sandbox"]'),
      ...document.querySelectorAll('[class*="CP"][class*="sandbox"]')
    ];

    logColorPicker('DebugPopup', `Found ${colorPickerElements.length} color picker elements`, colorPickerElements);

    colorPickerElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const zIndex = computedStyle.zIndex;
      const position = computedStyle.position;
      const display = computedStyle.display;
      const visibility = computedStyle.visibility;

      logColorPicker('DebugPopup', `Element ${index + 1}:`, {
        tagName: element.tagName,
        className: element.className,
        zIndex,
        position,
        display,
        visibility,
        boundingRect: element.getBoundingClientRect(),
        element
      });

      // Add temporary visual debugging
      if (element instanceof HTMLElement) {
        element.style.border = '2px solid red !important';
        element.style.backgroundColor = 'rgba(255, 0, 0, 0.1) !important';
        setTimeout(() => {
          element.style.border = '';
          element.style.backgroundColor = '';
        }, 3000);
      }
    });
  }
};

const checkZIndexHierarchy = () => {
  if (DEBUG && debugConfig.logTooltipEvents) {
    const debugPopup = document.querySelector('.debug-popup');
    const body = document.body;

    if (debugPopup) {
      const popupStyle = window.getComputedStyle(debugPopup);
      logColorPicker('DebugPopup', 'DebugPopup z-index:', {
        zIndex: popupStyle.zIndex,
        position: popupStyle.position,
        display: popupStyle.display
      });
    }

    logColorPicker('DebugPopup', 'Body z-index check:', {
      bodyZIndex: window.getComputedStyle(body).zIndex || 'auto',
      bodyPosition: window.getComputedStyle(body).position
    });
  }
};

const handleColorPickerClick = (event: Event) => {
  if (DEBUG && debugConfig.logTooltipEvents) {
    const target = event.target as HTMLElement;
    logColorPicker('DebugPopup', 'Color picker clicked:', {
      target: target,
      targetTagName: target?.tagName,
      targetClassName: target?.className,
      eventType: event.type,
      timestamp: Date.now()
    });

    // Inspect DOM after a short delay to let the picker render
    setTimeout(() => {
      inspectColorPickerDOM();
      checkZIndexHierarchy();
    }, 100);
  }
};

const addColorPickerDebugListeners = () => {
  if (DEBUG && debugConfig.logTooltipEvents) {
    // Add listeners to the color picker area
    const colorPickerArea = document.querySelector('.debug-popup__border-color-section');
    if (colorPickerArea) {
      colorPickerArea.addEventListener('click', handleColorPickerClick, true);
      logColorPicker('DebugPopup', 'Added color picker debug listeners');
    }

    // Also listen for any color picker elements that might be added dynamically
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains('color-picker') ||
                node.classList.contains('color-picker-panel') ||
                node.classList.contains('color-picker-overlay')) {
              logColorPicker('DebugPopup', 'Color picker element added to DOM:', {
                tagName: node.tagName,
                className: node.className,
                boundingRect: node.getBoundingClientRect()
              });
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Store observer for cleanup
    (window as any).__colorPickerObserver = observer;
  }
};

const removeColorPickerDebugListeners = () => {
  const colorPickerArea = document.querySelector('.debug-popup__border-color-section');
  if (colorPickerArea) {
    colorPickerArea.removeEventListener('click', handleColorPickerClick, true);
  }

  // Clean up observer
  if ((window as any).__colorPickerObserver) {
    (window as any).__colorPickerObserver.disconnect();
    delete (window as any).__colorPickerObserver;
  }
};

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

const resetDebugButtonOptions = () => {
  debugStore.updateDebugOption('debugButtonSize', 34);
  debugStore.updateDebugOption('debugButtonIconSize', 20);
  debugStore.updateDebugOption('debugButtonBackdropBlur', 5);
  debugStore.updateDebugOption('debugButtonBackgroundColor', 'hsla(0, 0%, 0%, 0.5)');
};

// Windows Long Paths Methods
const setLongPathsEnabled = (enabled: boolean) => {
  debugStore.updateDebugOption('longPathsEnabled', enabled);
  console.log(`%c🔧 Long paths ${enabled ? 'enabled' : 'disabled'}`, 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');
};

const performAutoDetect = async () => {
  try {
    console.log('%c🔍 Performing auto-detection of long paths...', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');

    const { checkLongPathsEnabled } = await import('@/utils/platformUtils');
    const result = await checkLongPathsEnabled();

    debugStore.updateDebugOption('longPathsEnabled', result);
    console.log(`%c✅ Auto-detection complete: long paths ${result ? 'enabled' : 'disabled'}`, 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;');
  } catch (error) {
    console.warn('Failed to perform auto-detection:', error);
    // Default to enabled for safety
    debugStore.updateDebugOption('longPathsEnabled', true);
  }
};

// Track the last selected long paths mode
const lastSelectedLongPathsMode = ref<'auto' | 'force-long' | 'force-short'>('auto');

// Active long paths mode based on current state
const activeLongPathsMode = computed<'auto' | 'force-long' | 'force-short'>(() => {
  // Return the last selected mode, which includes 'auto'
  return lastSelectedLongPathsMode.value;
});

// Handle long paths mode change
const handleLongPathsModeChange = async (mode: 'auto' | 'force-long' | 'force-short') => {
  // Update the last selected mode
  lastSelectedLongPathsMode.value = mode;

  if (mode === 'auto') {
    await performAutoDetect();
  } else if (mode === 'force-long') {
    setLongPathsEnabled(true);
  } else if (mode === 'force-short') {
    setLongPathsEnabled(false);
  }
};

// Vue compilation debugging functions
const runVueCompilationDebug = () => {
  if ((window as any).__QZIP_DEBUG_VUE_COMPILATION) {
    (window as any).__QZIP_DEBUG_VUE_COMPILATION();
  } else {
    console.warn('%c⚠️ Vue compilation debug function not available', 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
  }
};

const checkForTemplateErrors = () => {
  console.log('%c🔍 Checking for Vue template errors...', 'background: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');

  // Look for common problematic patterns
  const problematicPatterns = [
    { selector: 'template[v-if]', description: 'Template with v-if' },
    { selector: 'template[v-for]', description: 'Template with v-for' },
    { selector: 'template[v-if] template[v-if]', description: 'Nested templates with v-if' },
    { selector: 'template[v-for] template[v-if]', description: 'Nested v-for + v-if templates' }
  ];

  problematicPatterns.forEach(pattern => {
    const elements = document.querySelectorAll(pattern.selector);
    if (elements.length > 0) {
      console.warn(`%c⚠️ Found ${elements.length} ${pattern.description} elements:`, 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;', elements);
      elements.forEach((element, index) => {
        console.warn(`  ${index + 1}.`, element);
      });
    } else {
      console.log(`%c✓ No ${pattern.description} elements found`, 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;');
    }
  });

  // Check for Vue compilation errors in console
  console.log('%c💡 Tips to fix "codegen node is missing":', 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');
  console.log('  1. Replace <template v-if> with <div v-if>');
  console.log('  2. Check for nested templates with v-if/v-for');
  console.log('  3. Ensure proper template structure');
  console.log('  4. Clear browser cache and restart dev server');
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

// Handle popup mouse down to activate
const handlePopupMouseDown = () => {
  isActive.value = true;
};

// Handle popup focus
const handlePopupFocus = () => {
  isActive.value = true;
};

// Handle popup blur
const handlePopupBlur = () => {
  isActive.value = false;
};

// Handle global click to deactivate popup when clicking outside
const handleGlobalClick = (event: MouseEvent) => {
  if (popupRef.value && !popupRef.value.contains(event.target as Node)) {
    isActive.value = false;
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
const popupStyle = computed(() => {
  // Calculate backdrop blur based on drag state and settings
  let backdropBlurValue = debugStore.debugOptions.backdropBlur;
  
  // Disable blur during drag if the option is enabled
  if (isDragging.value && debugStore.debugOptions.disableBackdropBlurOnDrag) {
    backdropBlurValue = 0;
  }
  
  // Calculate box shadow opacity and size based on drag state and focus
  const primaryOpacity = debugStore.currentOpacity;
  const dragOpacity = isDragging.value ? debugStore.debugOptions.debugPopupSecondaryOpacity : primaryOpacity;
  const shadowOpacity = isDragging.value ? dragOpacity * 0.6 : 0.8; // 60% of drag opacity, or 80% when not dragging
  
  // Smaller shadow when not focused, larger when focused
  const shadowBlur = isActive.value ? 48 : 24; // 48px when active, 24px when inactive
  const shadowSpread = isActive.value ? 0 : 0; // Keep spread at 0 for both states
  
  const style = {
    transform: `translate(${debugStore.debugPopupPosition.x}px, ${debugStore.debugPopupPosition.y}px)`,
    width: `${debugStore.debugPopupDimensions.width}px`,
    height: `${debugStore.debugPopupDimensions.height}px`,
    backdropFilter: `blur(${backdropBlurValue}px)`,
    boxShadow: `0 12px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity})`,
  };
  
  // Debug logging for backdrop blur
  if (DEBUG && debugConfig.logUIEvents) {
    console.log(`%c🔧 Debug popup backdrop blur: ${backdropBlurValue}px`, 'background: #2196f3; color: white; padding: 2px 4px; border-radius: 3px;');
  }
  
  return style;
});

// Computed header style with opacity
const headerStyle = computed(() => {
  const primaryOpacity = debugStore.currentOpacity;
  const interiorOpacity = debugStore.debugOptions.debugPopupInteriorOpacity;
  const dragOpacity = isDragging.value ? debugStore.debugOptions.debugPopupSecondaryOpacity : primaryOpacity;
  
  return {
    backgroundColor: `hsla(0, 0%, ${themeStore.isEffectiveDark ? '25%' : '70%'}, ${dragOpacity})`,
    borderBottomColor: `hsla(0, 0%, ${themeStore.isEffectiveDark ? '25%' : '70%'}, ${dragOpacity})`,
    opacity: isDragging.value ? dragOpacity : interiorOpacity,
  };
});

// Computed content style with opacity
const contentStyle = computed(() => {
  const primaryOpacity = debugStore.currentOpacity;
  const interiorOpacity = debugStore.debugOptions.debugPopupInteriorOpacity;
  const dragOpacity = isDragging.value ? debugStore.debugOptions.debugPopupSecondaryOpacity : primaryOpacity;
  
  return {
    backgroundColor: `hsla(0, 0%, ${themeStore.isEffectiveDark ? '9%' : '91%'}, ${dragOpacity})`,
    opacity: isDragging.value ? dragOpacity : interiorOpacity,
  };
});

// Computed tab navigation style with opacity
const tabNavStyle = computed(() => {
  const primaryOpacity = debugStore.currentOpacity;
  const dragOpacity = isDragging.value ? debugStore.debugOptions.debugPopupSecondaryOpacity : primaryOpacity;
  
  return {
    borderRightColor: `hsla(0, 0%, ${themeStore.isEffectiveDark ? '25%' : '70%'}, ${dragOpacity})`,
  };
});

// Computed border style with opacity
const borderStyle = computed(() => {
  const primaryOpacity = debugStore.currentOpacity;
  const dragOpacity = isDragging.value ? debugStore.debugOptions.debugPopupSecondaryOpacity : primaryOpacity;
  
  // Apply stronger drag opacity effect to border
  const borderOpacity = isDragging.value ? dragOpacity * 0.5 : primaryOpacity;
  
  // Choose border color based on active state
  let borderColor;
  if (isActive.value) {
    // Nice blue color when active
    borderColor = `hsla(210, 100%, 60%, ${borderOpacity})`;
  } else {
    // Same gray as titlebar when inactive
    borderColor = `hsla(0, 0%, ${themeStore.isEffectiveDark ? '25%' : '70%'}, ${borderOpacity})`;
  }
  
  return {
    borderColor: borderColor,
  };
});

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
  
  // Temporarily disconnect the ResizeObserver during drag to prevent interference
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  
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
  
  // Reconnect the ResizeObserver after drag is complete
  nextTick(() => {
    if (popupRef.value && resizeObserver) {
      try {
        resizeObserver.observe(popupRef.value);
        if (DEBUG && debugConfig.logUIEvents) {
          console.log(`%c🔧 ResizeObserver reconnected after drag`, 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
        }
      } catch (error) {
        if (DEBUG && debugConfig.logUIEvents) {
          console.log(`%c🔧 Error reconnecting ResizeObserver:`, 'background: #f44336; color: white; padding: 2px 4px; border-radius: 3px;', error);
        }
      }
    }
  });
  
  // Capture the current dimensions immediately after drag ends
  // This ensures any resize that happened during drag is saved
  nextTick(() => {
    if (popupRef.value) {
      const rect = popupRef.value.getBoundingClientRect();
      const currentWidth = Math.max(320, Math.min(800, rect.width));
      const currentHeight = Math.max(300, Math.min(window.innerHeight * 0.8, rect.height));
      
      // Only update if dimensions are different from stored values
      if (currentWidth !== debugStore.debugPopupDimensions.width || 
          currentHeight !== debugStore.debugPopupDimensions.height) {
        
        debugStore.updateDebugPopupDimensions({
          width: currentWidth,
          height: currentHeight,
        });
        
        if (DEBUG && debugConfig.logUIEvents) {
          console.log(`%c🔧 Debug popup dimensions captured after drag: ${currentWidth}x${currentHeight}`, 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;');
        }
      }
    }
  });
};

// Handle mouse up events to capture final dimensions after resize
const handleMouseUp = () => {
  // Small delay to ensure the resize operation is complete
  setTimeout(() => {
    if (popupRef.value && !isDragging.value) {
      const rect = popupRef.value.getBoundingClientRect();
      const currentWidth = Math.max(320, Math.min(800, rect.width));
      const currentHeight = Math.max(300, Math.min(window.innerHeight * 0.8, rect.height));
      
      // Only update if dimensions are different from stored values
      if (currentWidth !== debugStore.debugPopupDimensions.width || 
          currentHeight !== debugStore.debugPopupDimensions.height) {
        
        debugStore.updateDebugPopupDimensions({
          width: currentWidth,
          height: currentHeight,
        });
        
        if (DEBUG && debugConfig.logUIEvents) {
          console.log(`%c🔧 Debug popup dimensions captured after mouse up: ${currentWidth}x${currentHeight}`, 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;');
        }
      }
    }
  }, 50); // 50ms delay to ensure resize is complete
};

// Setup resize observer
let resizeObserver: ResizeObserver | null = null;
let isInitialResize = true; // Flag to prevent initial resize from overwriting persisted dimensions
let resizeTimeout: NodeJS.Timeout | null = null; // For debouncing resize events

// Handle resize events
const handleResize = () => {
  // Skip the initial resize event to prevent overwriting persisted dimensions
  if (isInitialResize) {
    return;
  }
  
  if (popupRef.value) {
    const rect = popupRef.value.getBoundingClientRect();
    const newWidth = Math.max(320, Math.min(800, rect.width));
    const newHeight = Math.max(300, Math.min(window.innerHeight * 0.8, rect.height));
    
    // Only update if dimensions actually changed AND they're different from the stored values
    // This prevents the initial resize event from overwriting persisted dimensions
    if (newWidth !== debugStore.debugPopupDimensions.width || 
        newHeight !== debugStore.debugPopupDimensions.height) {
      
      // Check if this is a significant change (more than 1px difference)
      // This helps prevent minor rounding differences from triggering updates
      const widthDiff = Math.abs(newWidth - debugStore.debugPopupDimensions.width);
      const heightDiff = Math.abs(newHeight - debugStore.debugPopupDimensions.height);
      
      if (widthDiff > 1 || heightDiff > 1) {
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
    
    // Clear any existing timeout and set a new one to capture final dimensions
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    
    // Debounce the final dimension capture to ensure we get the last resize event
    resizeTimeout = setTimeout(() => {
      if (popupRef.value) {
        const finalRect = popupRef.value.getBoundingClientRect();
        const finalWidth = Math.max(320, Math.min(800, finalRect.width));
        const finalHeight = Math.max(300, Math.min(window.innerHeight * 0.8, finalRect.height));
        
        // Update with final dimensions to ensure accuracy
        if (finalWidth !== debugStore.debugPopupDimensions.width || 
            finalHeight !== debugStore.debugPopupDimensions.height) {
          
          debugStore.updateDebugPopupDimensions({
            width: finalWidth,
            height: finalHeight,
          });
          
          if (DEBUG && debugConfig.logUIEvents) {
            console.log(`%c🔧 Debug popup final dimensions captured: ${finalWidth}x${finalHeight}`, 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;');
          }
        }
      }
      resizeTimeout = null;
    }, 100); // 100ms debounce
  }
};

// Watch for popup visibility changes to reset the initial resize flag
watch(() => debugStore.isDebugPopupVisible, (isVisible) => {
  if (isVisible) {
    // Reset the flag when popup becomes visible
    isInitialResize = true;
    
    // Log the persisted dimensions being applied
    if (DEBUG && debugConfig.logUIEvents) {
      console.log(`%c🔧 Debug popup opening with persisted dimensions: ${debugStore.debugPopupDimensions.width}x${debugStore.debugPopupDimensions.height}`, 'background: #4caf50; color: white; padding: 2px 4px; border-radius: 3px;');
    }
    
    // Set up the ResizeObserver after the popup is rendered
    nextTick(() => {
      if (popupRef.value && !resizeObserver) {
        resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(popupRef.value);
      }
      
      // Reset the initial resize flag after a short delay
      setTimeout(() => {
        isInitialResize = false;
        if (DEBUG && debugConfig.logUIEvents) {
          console.log(`%c🔧 Debug popup initial resize protection disabled`, 'background: #ff9800; color: black; padding: 2px 4px; border-radius: 3px;');
        }
      }, 100);
    });
  }
});

onMounted(() => {
  // Add keyboard event listener for debug shortcuts
  window.addEventListener('keydown', handleKeyDown);

  // Add mouse event listener to capture final dimensions after resize
  document.addEventListener('mouseup', handleMouseUp);

  // Add global click handler to deactivate popup when clicking outside
  document.addEventListener('click', handleGlobalClick);

  // Initialize color picker debugging
  addColorPickerDebugListeners();
});

// Helpers for TitleBar debug tab
const colorToHex = (colorStr: string) => {
  // Accepts hsl(...) or hex; try to convert HSL to hex simply when necessary
  if (!colorStr) return '#1976d2';
  if (colorStr.startsWith('#')) return colorStr;
  try {
    // crude HSL -> HEX conversion for values like 'hsl(h, s%, l%)'
    const m = colorStr.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
    if (!m) return '#1976d2';
    const h = Number(m[1]) / 360;
    const s = Number(m[2]) / 100;
    const l = Number(m[3]) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch (e) {
    return '#1976d2';
  }
};

const updateTitlebarColor = (hex: string) => {
  // Convert hex to HSL-ish css string and update store
  // Simple convert: use hex directly for CSS and store as hex for now
  debugStore.updateDebugOption('titlebarHighlightColor', hex);
};

// Legacy helper functions - kept for potential future use
// These are no longer needed since we switched to Nuxt ColorPicker with alpha support
/*
const extractColorOnly = (colorString: string): string => {
  // Extract just the color part from HSLA/RGBA, return as hex for color picker
  try {
    if (colorString.startsWith('hsla(')) {
      // Parse HSLA: hsla(h, s%, l%, a)
      const match = colorString.match(/hsla\((\d+),\s*(\d+)%?,\s*(\d+)%?,\s*[\d.]+\)/);
      if (match && match[1] && match[2] && match[3]) {
        const h = parseInt(match[1], 10);
        const s = parseInt(match[2], 10);
        const l = parseInt(match[3], 10);
        return hslToHex(h, s, l);
      }
    } else if (colorString.startsWith('rgba(')) {
      // Parse RGBA: rgba(r, g, b, a)
      const match = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
      if (match && match[1] && match[2] && match[3]) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        return rgbToHex(r, g, b);
      }
    }
    // Fallback: try to parse as hex or return default
    return colorString.startsWith('#') ? colorString : '#000000';
  } catch (e) {
    return '#000000';
  }
};

const extractAlpha = (colorString: string): number => {
  // Extract alpha value from HSLA/RGBA, return as 0-1
  try {
    if (colorString.startsWith('hsla(')) {
      const match = colorString.match(/hsla\([^,]+,\s*[^,]+,\s*[^,]+,\s*([\d.]+)\)/);
      return match && match[1] ? parseFloat(match[1]) : 0.5;
    } else if (colorString.startsWith('rgba(')) {
      const match = colorString.match(/rgba\([^,]+,\s*[^,]+,\s*[^,]+,\s*([\d.]+)\)/);
      return match && match[1] ? parseFloat(match[1]) : 0.5;
    }
    return 0.5; // Default alpha
  } catch (e) {
    return 0.5;
  }
};
*/

const hslToHex = (h: number, s: number, l: number): string => {
  // Convert HSL to hex
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lDecimal - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return rgbToHex(r, g, b);
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Helper functions for displaying multiple color formats
// Helper function to parse HSL string
const parseHsl = (hslString: string): { h: number; s: number; l: number; a: number } => {
  const match = hslString.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?(?:,\s*([\d.]+))?\)/);
  if (match && match[1] && match[2] && match[3]) {
    return {
      h: parseInt(match[1], 10),
      s: parseInt(match[2], 10),
      l: parseInt(match[3], 10),
      a: match[4] ? parseFloat(match[4]) : 1
    };
  }
  return { h: 0, s: 0, l: 0, a: 1 };
};

/*
const hslToRgbString = (hslString: string): string => {
  try {
    const { h, s, l, a } = parseHsl(hslString);
    const sDecimal = s / 100;
    const lDecimal = l / 100;

    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lDecimal - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } catch (e) {
    return 'rgba(0, 0, 0, 0.5)';
  }
};
*/

/*
const hslToHexString = (hslString: string): string => {
  try {
    const { h, s, l } = parseHsl(hslString);
    return hslToHex(h, s, l);
  } catch (e) {
    return '#000000';
  }
};
*/

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Handle both 3-digit and 6-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return { r, g, b };
};

/*
const updateDebugButtonColor = (hexColor: string) => {
  // Get current alpha from existing color
  const currentColor = debugStore.debugOptions.debugButtonBackgroundColor ?? 'hsla(0, 0%, 0%, 0.5)';
  const currentAlpha = extractAlpha(currentColor);

  // Convert hex to HSLA
  const rgb = hexToRgb(hexColor);
  const hslaColor = `hsla(${rgbToHsl(rgb.r, rgb.g, rgb.b)}, ${currentAlpha})`;

  debugStore.updateDebugOption('debugButtonBackgroundColor', hslaColor);
};
*/

/*
const updateDebugButtonAlpha = (alpha: number) => {
  // Get current color part from existing color
  const currentColor = debugStore.debugOptions.debugButtonBackgroundColor ?? 'hsla(0, 0%, 0%, 0.5)';
  const colorOnly = extractColorOnly(currentColor);

  // If current color is hex, convert to HSL first
  let hslString = '0, 0%, 0%';
  if (colorOnly.startsWith('#')) {
    const rgb = hexToRgb(colorOnly);
    hslString = rgbToHsl(rgb.r, rgb.g, rgb.b);
  } else if (currentColor.includes('hsla')) {
    // Extract HSL part from existing HSLA
    const match = currentColor.match(/hsla\(([^,]+),\s*([^,]+),\s*([^,]+),\s*[\d.]+\)/);
    if (match) {
      hslString = `${match[1]}, ${match[2]}, ${match[3]}`;
    }
  }

  const hslaColor = `hsla(${hslString}, ${alpha})`;
  debugStore.updateDebugOption('debugButtonBackgroundColor', hslaColor);
};

const updateDebugButtonColorFromText = (colorValue: string) => {
  // For text input, validate and use the value directly
  debugStore.updateDebugOption('debugButtonBackgroundColor', colorValue);
};
*/

/*
const rgbToHsl = (r: number, g: number, b: number): string => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
};
*/

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('click', handleGlobalClick);

  // Remove keyboard event listener
  window.removeEventListener('keydown', handleKeyDown);

  // Clean up color picker debug listeners
  removeColorPickerDebugListeners();

  // Clean up the ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // Clean up the resize timeout
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }
});
</script>

<style scoped>
/* Import all DebugPopup CSS modules */
@import "./debug-popup-comp/DebugPopup.base.css";
@import "./debug-popup-comp/DebugPopup.header.css";
@import "./debug-popup-comp/DebugPopup.navigation.css";
@import "./debug-popup-comp/DebugPopup.content.css";
@import "./debug-popup-comp/DebugPopup.controls.css";
@import "./debug-popup-comp/DebugPopup.color.css";
@import "./debug-popup-comp/DebugPopup.utilities.css";
</style>
