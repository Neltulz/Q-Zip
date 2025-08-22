<!-- 
  FileTableLoadingOverlay.vue @preserve
  Full-featured loading overlay component for FileTable operations
  
  This component provides a complete loading experience with progress tracking,
  pause/resume functionality, and cancel options. It uses simplified loading
  animation components for the actual animations.
-->
<template>
  <div class="full-animation">
    <!-- Loading animation with fade transition -->
    <div class="animation-container">
      <component 
        :is="animationComponent" 
        key="loading-animation"
        :class="{ 'hidden': isPaused }"
      />
      <div class="pause-icon-container" :class="{ 'hidden': !isPaused }" key="pause-icon">
        <Icon 
          name="mdi:pause" 
          :size="48" 
          class="pause-icon"
        />
      </div>
    </div>
    
    <!-- Progress information -->
    <div v-if="showProgress" class="progress-info">
      <div class="scanning-label" :class="{ 'paused': isPaused }">
        {{ isPaused ? 'PAUSED' : 'SCANNING' }}
      </div>
      
      <!-- Overall progress bar for multiple folders -->
      <ProgressBar
        v-if="showOverallProgress"
        :current="overallCurrentFolder || 0"
        :total="overallTotalFolders || 0"
        :is-paused="isPaused"
        variant="overall"
        label="Overall Progress"
        section-class="overall-progress-section"
      />
      
      <!-- Current folder progress bar -->
      <ProgressBar
        v-if="totalItems && totalItems > 0"
        :current="currentItem || 0"
        :total="totalItems || 0"
        :is-paused="isPaused"
        variant="current"
        section-class="current-progress-section"
      />
      <div class="filename-text" :title="processedFilename" :class="{ 'paused': isPaused }">{{ processedFilename }}</div>
    </div>
    
    <!-- Loading message -->
    <div v-if="$slots.default" class="loading-message" :class="{ 'paused': isPaused }">
      <span v-if="isPaused">Click <span class="resume-highlight">Resume</span> to continue...</span>
      <span v-else>{{ loadingMessageText }}</span>
    </div>
    
    <!-- Control buttons -->
    <div class="button-group">
      <CustomButton
        ref="pauseButtonRef"
        button-style-class="default"
        data-name="pause-loading-btn"
        :first-icon-name="isPaused ? 'mdi:play' : 'mdi:pause'"
        @click="handlePauseClick"
        @mouseenter="(event) => handlePauseButtonMouseEnter(event)"
        @mouseleave="handlePauseButtonMouseLeave"
      >
        {{ isPaused ? 'Resume' : 'Pause' }}
      </CustomButton>
              <DropdownMenu
          ref="cancelDropdownRef"
          btn-theme="danger"
          button-style-class="default"
          data-name="cancel-dropdown"
          dropdown-data-name="cancel-dropdown"
          first-icon-name="mdi:cancel"
          placement="right-center"
          :show-cancel-button="false"
          last-icon-name=""
          @dropdown-opened="handleDropdownOpened"
          @dropdown-closed="handleDropdownClosed"
          @mouseenter="(event: MouseEvent) => handleCancelButtonMouseEnter(event)"
          @mouseleave="handleCancelButtonMouseLeave"
        >
        <template #button-content>
          Cancel
        </template>
        <template #default>
          <div class="cancel-confirmation">
            <!-- Close button positioned absolutely -->
            <CustomButton
              ref="closeButtonRef"
              class="close-button"
              btn-theme="liter"
              button-style-class="trans-btn"
              data-name="close-cancel-dialog-btn"
              first-icon-name="mdi:close"
              :first-icon-size="16"
              @click="cancelDropdownRef?.closeDropdown()"
                        @mouseenter="(event: MouseEvent) => handleCloseButtonMouseEnter(event)"
          @mouseleave="handleCloseButtonMouseLeave"
            />
            
            <!-- Main content -->
            <div class="confirmation-header">
              <div class="confirmation-icon">
                <Icon name="mdi:alert-outline" :size="32" />
              </div>
              <div class="confirmation-text">
                <h3 class="confirmation-title">Cancel Scan?</h3>
                <p class="confirmation-description">This will stop the current process.</p>
              </div>
              <div class="confirmation-spacer"></div>
            </div>
            
            <div class="confirmation-checkbox">
              <label 
                ref="checkboxLabelRef"
                class="checkbox-label"
                            @mouseenter="(event: MouseEvent) => handleCheckboxMouseEnter(event)"
            @mouseleave="handleCheckboxMouseLeave"
              >
                <input 
                  ref="checkboxRef"
                  type="checkbox" 
                  v-model="removeScannedItems"
                />
                <span class="checkbox-text">Also remove already scanned items</span>
              </label>
            </div>
            
            <div class="confirmation-actions">
              <CustomButton
                ref="confirmCancelButtonRef"
                button-style-class="default"
                btn-theme="danger"
                data-name="confirm-cancel-btn"
                first-icon-name="mdi:stop"
                @click="handleConfirmCancel"
                            @mouseenter="(event: MouseEvent) => handleConfirmCancelButtonMouseEnter(event)"
            @mouseleave="handleConfirmCancelButtonMouseLeave"
              >
                Cancel Process
              </CustomButton>
            </div>
          </div>
        </template>
      </DropdownMenu>
    </div>
    
    <!-- Tooltips -->
    <InfoTooltip
      :visible="tooltipManager.activeTooltipId.value === 'pause-loading-btn'"
      :content="{ text: isPaused ? 'Resume scanning' : 'Pause scanning' }"
      :target="pauseButtonRef?.visualStyleRef"
      placement="bottom"
      keyboardShortcut="Space"
    />
    <InfoTooltip
      :visible="tooltipManager.activeTooltipId.value === 'cancel-loading-dropdown'"
      :content="{ text: 'Cancel scanning' }"
      :target="cancelDropdownRef?.$el"
      placement="bottom"
      keyboardShortcut="Esc"
    />
    <InfoTooltip
      :visible="tooltipManager.activeTooltipId.value === 'close-cancel-dialog-btn'"
      :content="{ text: 'Close cancel dialog' }"
      :target="closeButtonRef?.visualStyleRef"
      placement="right"
      keyboardShortcut="Esc"
    />
    <InfoTooltip
      :visible="tooltipManager.activeTooltipId.value === 'remove-scanned-items-checkbox'"
      :content="{ text: 'Also remove already scanned items' }"
      :target="checkboxLabelRef"
      placement="right"
      keyboardShortcut="Space"
    />
    <InfoTooltip
      :visible="tooltipManager.activeTooltipId.value === 'confirm-cancel-btn'"
      :content="{ text: 'Confirm cancel process' }"
      :target="confirmCancelButtonRef?.visualStyleRef"
      placement="bottom"
      keyboardShortcut="Enter"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import CustomButton from "../CustomButton.vue";
import DropdownMenu from "../DropdownMenu.vue";
import ProgressBar from "../ProgressBar.vue";
import InfoTooltip from "../InfoTooltip.vue";
import CircleLoadingAnim from "../loading-anim-comp/CircleLoadingAnim.vue";
import SpinnerLoadingAnim from "../loading-anim-comp/SpinnerLoadingAnim.vue";
import DoubleBounceLoadingAnim from "../loading-anim-comp/DoubleBounceLoadingAnim.vue";
import { logLoading, logDualProgress } from "@/utils/loggers";
import { useOrphanedTooltipDetector } from "@/composables/useOrphanedTooltipDetector";
import { useDropdownManager } from "@/composables/dropdownManager";
import { useTooltipManager } from "@/composables/useTooltipManager";

const props = defineProps<{
  currentItem?: number;
  totalItems?: number;
  progressMessage?: string;
  isPaused: boolean;
  animationType?: 'circle' | 'spinner' | 'double-bounce';
  // New props for dual progress tracking
  overallCurrentFolder?: number;
  overallTotalFolders?: number;
  overallProgressMessage?: string;
}>();

const emit = defineEmits<{
  pause: [isPaused: boolean];
  cancel: [removeScannedItems?: boolean];
}>();

const cancelDropdownRef = ref<InstanceType<typeof DropdownMenu> | null>(null);

// Orphaned tooltip detector for handling tooltips when dropdown closes unexpectedly
const { checkMultipleTooltipTargets } = useOrphanedTooltipDetector();

// Tooltip manager for consistent tooltip behavior
const tooltipManager = useTooltipManager();

// Tooltip state management
const pauseButtonRef = ref<InstanceType<typeof CustomButton> | null>(null);
// Remove local tooltip visibility state - use tooltipManager instead
// const pauseTooltipVisible = ref(false);
// const cancelTooltipVisible = ref(false);

// New refs for cancel confirmation elements
const closeButtonRef = ref<InstanceType<typeof CustomButton> | null>(null);
const checkboxRef = ref<HTMLInputElement | null>(null);
const checkboxLabelRef = ref<HTMLLabelElement | null>(null);
const confirmCancelButtonRef = ref<InstanceType<typeof CustomButton> | null>(null);

// Remove local tooltip visibility state - use tooltipManager instead
// const closeButtonTooltipVisible = ref(false);
// const checkboxTooltipVisible = ref(false);
// const confirmCancelButtonTooltipVisible = ref(false);

// Debug: Watch for when the dropdown ref is set
watch(cancelDropdownRef, (newRef) => {
  logLoading("FileTableLoadingOverlay", `Dropdown ref changed`, newRef);
  if (newRef) {
    logLoading("FileTableLoadingOverlay", `Dropdown ref set`, !!newRef);
  } else {
    // Dropdown ref is null, but don't call resetAllTooltipState() to avoid circular dependency
    // The resetAllTooltipState() function itself sets the ref to null
    logLoading("FileTableLoadingOverlay", `Dropdown ref is null`);
  }
});
const removeScannedItems = ref(true); // Default to true to maintain current behavior
const wasPausedBeforeCancel = ref(false); // Track if we were already paused before opening cancel dialog

// Determine which animation component to use
const animationComponent = computed(() => {
  switch (props.animationType) {
    case 'spinner':
      return SpinnerLoadingAnim;
    case 'double-bounce':
      return DoubleBounceLoadingAnim;
    case 'circle':
    default:
      return CircleLoadingAnim;
  }
});

const showProgress = computed(() => {
  return props.totalItems !== undefined && props.totalItems > 0;
});

const showOverallProgress = computed(() => {
  const shouldShow = props.overallTotalFolders !== undefined && props.overallTotalFolders > 0;
  
  // Log when overall progress values change (for debugging dual progress)
  logDualProgress("FileTableLoadingOverlay", `Overall progress check`, {
    shouldShow,
    overallTotalFolders: props.overallTotalFolders,
    overallCurrentFolder: props.overallCurrentFolder,
    overallProgressMessage: props.overallProgressMessage
  });
  
  return shouldShow;
});



const processedFilename = computed(() => {
  if (!props.progressMessage) return '';
  // Remove "Scanning file: " prefix if it exists
  return props.progressMessage.replace(/^Scanning file:\s*/, '');
});

const loadingMessageText = computed(() => {
  if (props.isPaused) {
    return 'Click "Resume" to continue...';
  }
  return 'Adding items, please wait...';
});

// Watch for progress updates (reduced logging to avoid spam)
watch(
  () => [props.currentItem, props.totalItems, props.progressMessage],
  ([newCurrent, newTotal, newMessage], [oldCurrent, oldTotal, oldMessage]) => {
    // Only log significant progress changes (every 10% or when total changes)
    const oldTotalNum = Number(oldTotal) || 0;
    const newTotalNum = Number(newTotal) || 0;
    const oldPercentage = oldTotalNum > 0 ? Math.round((Number(oldCurrent) || 0) / oldTotalNum * 10) : 0;
    const newPercentage = newTotalNum > 0 ? Math.round((Number(newCurrent) || 0) / newTotalNum * 10) : 0;
    
    if (newTotalNum !== oldTotalNum || newPercentage !== oldPercentage) {
      logLoading("FileTableLoadingOverlay", `Progress update: ${newCurrent}/${newTotal} (${newPercentage * 10}%) - "${newMessage}"`);
    }
  },
  { deep: true }
);

// Watch for pause state changes
watch(
  () => props.isPaused,
  (newPausedState, oldPausedState) => {
    if (newPausedState !== oldPausedState) {
      logLoading("FileTableLoadingOverlay", `Pause state changed: ${oldPausedState} -> ${newPausedState} at ${performance.now().toFixed(2)}ms`);
    }
  }
);

// Removed the watcher approach since it wasn't working reliably
// Now using DOM-based monitoring instead

const handlePauseClick = () => {
  const startTime = performance.now();
  logLoading("FileTableLoadingOverlay", `PAUSE BUTTON CLICKED at ${startTime.toFixed(2)}ms - current state: ${props.isPaused ? 'paused' : 'playing'}`);
  
  // Immediate response for better UX
  emit("pause", !props.isPaused);
  
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  logLoading("FileTableLoadingOverlay", `Pause event emitted in ${responseTime.toFixed(2)}ms - new state: ${!props.isPaused ? 'paused' : 'playing'}`);
};

const handleDropdownOpened = () => {
  logLoading("FileTableLoadingOverlay", `Dropdown opened event received at ${performance.now().toFixed(2)}ms`);
  
  // Pause the scanning when dropdown opens
  wasPausedBeforeCancel.value = props.isPaused;
  if (!props.isPaused) {
    logLoading("FileTableLoadingOverlay", `Auto-pausing scanning for cancel confirmation at ${performance.now().toFixed(2)}ms`);
    emit("pause", true);
  }
  
  // Start monitoring for dropdown close
  startDropdownCloseMonitoring();
};

const handleDropdownClosed = () => {
  logLoading("FileTableLoadingOverlay", `Dropdown closed event received at ${performance.now().toFixed(2)}ms`);
  
  // Stop monitoring since the dropdown is now fully closed
  // This will also handle tooltip cleanup and resuming scanning
  stopDropdownCloseMonitoring();
};

let dropdownCloseMonitorInterval: number | null = null;

const startDropdownCloseMonitoring = () => {
  // Clear any existing monitor
  if (dropdownCloseMonitorInterval) {
    clearInterval(dropdownCloseMonitorInterval);
  }
  
  // Check every 100ms if the dropdown is still open
  dropdownCloseMonitorInterval = window.setInterval(() => {
    const dropdown = cancelDropdownRef.value;
    if (!dropdown) {
      // Dropdown ref is gone, assume it's closed
      stopDropdownCloseMonitoring();
      return;
    }
    
    // Try to check if dropdown is open by looking for the dropdown content in the DOM
    const dropdownContent = document.querySelector('[data-belongs-to="cancel-dropdown"]');
    if (!dropdownContent) {
      // Dropdown content is not in DOM, assume it's closed
      logLoading("FileTableLoadingOverlay", `Dropdown content not found in DOM, assuming closed`);
      stopDropdownCloseMonitoring();
      return;
    }
    
    logLoading("FileTableLoadingOverlay", `Dropdown still open, content found`, !!dropdownContent);
  }, 100);
};

const stopDropdownCloseMonitoring = () => {
  if (dropdownCloseMonitorInterval) {
    clearInterval(dropdownCloseMonitorInterval);
    dropdownCloseMonitorInterval = null;
    
    // Complete cleanup of tooltip state when dropdown closes
    resetAllTooltipState();
    
    // Check for orphaned tooltips when dropdown closes
    checkForOrphanedTooltips();
    
    // Resume scanning if we weren't paused before
    logLoading("FileTableLoadingOverlay", `Was paused before`, wasPausedBeforeCancel.value);
    if (!wasPausedBeforeCancel.value) {
      logLoading("FileTableLoadingOverlay", `Auto-resuming scanning after cancel dialog closed at ${performance.now().toFixed(2)}ms`);
      emit("pause", false);
    }
  }
};

// Hide all tooltips to prevent orphaned tooltips when dropdown closes
const hideAllTooltips = () => {
  tooltipManager.hideTooltipImmediately();
  
  // Reset tooltip refs to prevent orphaned tooltips
  resetTooltipRefs();
};

// Reset tooltip refs to prevent orphaned tooltips
const resetTooltipRefs = () => {
  closeButtonRef.value = null;
  checkboxRef.value = null;
  checkboxLabelRef.value = null;
  confirmCancelButtonRef.value = null;
};

// Complete tooltip state reset
const resetAllTooltipState = () => {
  hideAllTooltips();
  resetTooltipRefs();
  
  // Don't reset the dropdown ref here to avoid circular dependency with the watcher
  // The dropdown ref will be managed by Vue's reactivity system
};

// Check if tooltip refs are still valid (elements still in DOM)
const areTooltipRefsValid = () => {
  const refs = [
    closeButtonRef.value?.visualStyleRef,
    checkboxLabelRef.value,
    confirmCancelButtonRef.value?.visualStyleRef
  ];
  
  return refs.every(ref => {
    if (!ref) return false;
    if (ref instanceof Element) {
      return document.contains(ref);
    }
    // Check if it's a ref with a value property
    if (typeof ref === 'object' && ref !== null && 'value' in ref) {
      const refValue = (ref as any).value;
      if (refValue instanceof Element) {
        return document.contains(refValue);
      }
    }
    return false;
  });
};

// Check for orphaned tooltips when dropdown closes unexpectedly
const checkForOrphanedTooltips = () => {
  // Check all tooltip targets that might be orphaned
  const tooltipTargets = [
    { element: closeButtonRef.value?.visualStyleRef || null, name: 'close button' },
    { element: checkboxLabelRef.value || null, name: 'checkbox' },
    { element: confirmCancelButtonRef.value?.visualStyleRef || null, name: 'confirm cancel button' }
  ];

  // If any tooltip targets are null or invalid, complete cleanup of tooltip state
  const hasNullTargets = tooltipTargets.some(target => target.element === null);
  const hasInvalidRefs = !areTooltipRefsValid();
  
  if (hasNullTargets || hasInvalidRefs) {
    logLoading("FileTableLoadingOverlay", `Invalid tooltip targets detected, resetting all tooltip state`);
    resetAllTooltipState();
  }

  checkMultipleTooltipTargets(tooltipTargets);
};

const handleConfirmCancel = () => {
  const startTime = performance.now();
  logLoading("FileTableLoadingOverlay", `Cancel confirmed at ${startTime.toFixed(2)}ms`);
  
  // Stop monitoring immediately since we're confirming the cancel
  stopDropdownCloseMonitoring();
  
  // Close the dropdown properly
  if (cancelDropdownRef.value) {
    cancelDropdownRef.value.closeDropdown();
  }
  
  // Complete cleanup of tooltip state when cancel is confirmed
  resetAllTooltipState();
  
  emit("cancel", removeScannedItems.value);
  
  const endTime = performance.now();
  const responseTime = endTime - startTime;
  logLoading("FileTableLoadingOverlay", `Cancel event emitted in ${responseTime.toFixed(2)}ms`);
};

// Tooltip event handlers - Updated to use tooltipManager with origin element
const handlePauseButtonMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('pause-loading-btn', originElement);
};

const handlePauseButtonMouseLeave = () => {
  tooltipManager.hideTooltip();
};

const handleCancelButtonMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('cancel-loading-dropdown', originElement);
};

const handleCancelButtonMouseLeave = () => {
  tooltipManager.hideTooltip();
};

const handleCloseButtonMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('close-cancel-dialog-btn', originElement);
};

const handleCloseButtonMouseLeave = () => {
  tooltipManager.hideTooltip();
};

const handleConfirmCancelButtonMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('confirm-cancel-btn', originElement);
};

const handleConfirmCancelButtonMouseLeave = () => {
  tooltipManager.hideTooltip();
};

const handleCheckboxMouseEnter = (event: MouseEvent) => {
  const originElement = event.currentTarget as HTMLElement;
  tooltipManager.showTooltip('remove-scanned-items-checkbox', originElement);
};

const handleCheckboxMouseLeave = () => {
  tooltipManager.hideTooltip();
};

// Get dropdown manager to check for other open dropdowns
const { openDropdowns } = useDropdownManager();

// Flag to track if global dropdown manager is processing ESC
let isGlobalEscProcessing = false;

// Keyboard event handling
const handleKeydown = (event: KeyboardEvent) => {
  // Handle ESC key globally
  if (event.code === 'Escape') {
    // Check if any dropdowns are open (highest priority)
    const anyDropdownsOpen = openDropdowns.value.length > 0;
    
    if (anyDropdownsOpen) {
      // Let the global dropdown manager handle closing dropdowns
      return;
    }
    
    // Add a small delay to allow global dropdown manager to finish processing
    // This prevents the cancel dropdown from opening immediately after other dropdowns are closed
    setTimeout(() => {
      // Check again after the delay
      const currentDropdownsOpen = openDropdowns.value.length > 0;
      if (currentDropdownsOpen) {
        return;
      }
      
      // Check if this component is active by looking for the overlay in the DOM
      const overlayElement = document.querySelector('.full-animation') as HTMLElement | null;
      const isOverlayActive = overlayElement && overlayElement.offsetParent !== null;
      
      if (isOverlayActive) {
        // Handle ESC for FileTableLoadingOverlay
        const dropdownContent = document.querySelector('[data-belongs-to="cancel-dropdown"]');
        const isDropdownOpen = !!dropdownContent;
        
        if (isDropdownOpen) {
          // Close dropdown if open
          if (cancelDropdownRef.value) {
            cancelDropdownRef.value.closeDropdown();
          }
        } else {
          // Open dropdown if closed
          if (cancelDropdownRef.value) {
            cancelDropdownRef.value.openDropdown();
          }
        }
        return;
      }
      
      // Default behavior: make FileTable inactive if it's active
      const activeFileTable = document.querySelector('.file-table-comp.is-active');
      if (activeFileTable) {
        // Dispatch a custom event to deactivate the FileTable
        window.dispatchEvent(new CustomEvent('app:deactivate-filetable'));
        return;
      }
    }, 10); // 10ms delay to allow global dropdown manager to finish
    
    // Return early to prevent immediate execution
    return;
  }
  
  // Handle other keys only if overlay is active
  const overlayElement = document.querySelector('.full-animation') as HTMLElement | null;
  const isOverlayActive = overlayElement && overlayElement.offsetParent !== null;
  
  if (!isOverlayActive) {
    return;
  }
  
  // Check if dropdown is open
  const dropdownContent = document.querySelector('[data-belongs-to="cancel-dropdown"]');
  const isDropdownOpen = !!dropdownContent;
  
  switch (event.code) {
    case 'Space':
      if (isDropdownOpen) {
        // When dropdown is open, Space should toggle the checkbox
        event.preventDefault();
        removeScannedItems.value = !removeScannedItems.value;
      } else {
        // When dropdown is closed, Space pauses/resumes scanning
        event.preventDefault();
        if (!props.isPaused) {
          emit("pause", true);
        } else {
          emit("pause", false);
        }
      }
      break;
    case 'Enter':
      if (isDropdownOpen) {
        // When dropdown is open, Enter should trigger the Cancel Process button
        event.preventDefault();
        handleConfirmCancel();
      } else {
        // When dropdown is closed, Enter pauses/resumes scanning
        event.preventDefault();
        if (!props.isPaused) {
          emit("pause", true);
        } else {
          emit("pause", false);
        }
      }
      break;
  }
};

// Set up keyboard event listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  
  // Complete cleanup of all tooltip state when component is destroyed
  resetAllTooltipState();
  
  // Stop any ongoing monitoring
  if (dropdownCloseMonitorInterval) {
    clearInterval(dropdownCloseMonitorInterval);
    dropdownCloseMonitorInterval = null;
  }
  
  // Reset remaining refs to prevent memory leaks
  pauseButtonRef.value = null;
});
</script>

<style scoped>
/* Full animation container - <div class="full-animation"> */
.full-animation {
  align-items: center;
  display: flex;
  flex-direction: column;
  max-width: 320px;
  width: 100%;
  /* Avoid using gap here - use individual margins instead for better control */
}

/* Progress information container - <div class="progress-info"> */
.progress-info {
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-block-end: var(--loading-container-pad);
  max-width: 100%;
  padding: 0 var(--loading-container-pad);
  width: 100%;
}

/* Scanning label text - <div class="scanning-label"> */
.scanning-label {
  color: var(--txt-clr-liter);
  font-size: 16px;
  font-weight: 500;
  margin-block-end: 16px;
  max-width: 100%;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
  transition: opacity 0.2s ease;
  white-space: nowrap;
  width: 100%;
}

.scanning-label.paused {
  opacity: 0.5;
}

/* Filename text display - <div class="filename-text"> */
.filename-text {
  color: var(--txt-clr-liter);
  font-size: 12px;
  max-width: 100%;
  overflow: hidden;
  text-align: start;
  text-overflow: ellipsis;
  transition: opacity 0.2s ease;
  white-space: nowrap;
  width: 100%;
}

.filename-text.paused {
  opacity: 0.5;
}

/* Overall progress section - <div class="overall-progress-section"> */
.overall-progress-section {
  margin-block-end: 16px;
}

/* Loading message container - <div class="loading-message"> */
.loading-message {
  color: var(--txt-clr-liter);
  font-size: 14px;
  margin-block-end: var(--loading-container-pad);
  max-width: 100%;
  overflow: hidden;
  padding: 0 var(--loading-container-pad);
  text-align: center;
  text-overflow: ellipsis;
  transition: opacity 0.2s ease;
  white-space: nowrap;
  width: 100%;
}

.loading-message.paused {
  opacity: 0.8;
}

/* Resume highlight styling - <span class="resume-highlight"> */
.resume-highlight {
  color: var(--txt-clr-liter);
  font-weight: 600;
}

/* Button group container - <div class="button-group"> */
.button-group {
  border-top: 1px solid var(--brdr-clr-lite);
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  padding: var(--loading-container-pad);
  width: 100%;
}

/* Ensure buttons have consistent width */
.button-group :deep(.custom-button) {
  flex-grow: 0;
  flex-shrink: 0;
  max-width: none;
  width: auto;
}



/* Cancel confirmation container - <div class="cancel-confirmation"> */
.cancel-confirmation {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 100px;
  position: relative;
}

/* Close button - <CustomButton class="close-button"> */
.close-button {
  position: absolute;
  right: 6px;
  top: 6px;
  z-index: 10;
}



.close-button :deep(.iconify) {
  align-items: center;
  display: flex;
  justify-content: center;
}

/* Confirmation header - <div class="confirmation-header"> */
.confirmation-header {
  display: flex;
  gap: 12px;
  padding: 10px 10px 0 10px;
}

/* Confirmation icon - <div class="confirmation-icon"> */
.confirmation-icon {
  color: var(--txt-clr-liter);
  flex-shrink: 0;
  margin-block-start: 2px;
}

/* Confirmation text container - <div class="confirmation-text"> */
.confirmation-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

/* Confirmation spacer - <div class="confirmation-spacer"> */
.confirmation-spacer {
  flex-shrink: 0;
  inline-size: 32px;
}

/* Confirmation title - <h3 class="confirmation-title"> */
.confirmation-title {
  color: var(--txt-clr-liter);
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  text-align: start;
}

/* Confirmation description - <p class="confirmation-description"> */
.confirmation-description {
  color: var(--txt-clr-lite);
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
  text-align: start;
  max-width: 13ch;
  text-wrap: balance;
}

/* Confirmation checkbox - <div class="confirmation-checkbox"> */
.confirmation-checkbox {
  align-items: center;
  display: flex;
  justify-content: center;
  padding: 0 10px;
}

/* Checkbox label - <label class="checkbox-label"> */
.checkbox-label {
  align-items: center;
  color: var(--txt-clr-lite);
  cursor: pointer;
  display: flex;
  font-size: 13px;
  gap: 8px;
  user-select: none;
}

/* Checkbox text - <span class="checkbox-text"> */
.checkbox-text {
  line-height: 1.25;
  max-width: 16ch;
  text-wrap: balance;
  user-select: none;
}

/* Confirmation actions container - <div class="confirmation-actions"> */
.confirmation-actions {
  border-top: 1px solid var(--brdr-clr-lite);
  display: flex;
  justify-content: center;
  padding: 12px 10px 10px 10px;
}

.confirmation-actions :deep(.custom-button) {
  flex-grow: 0;
  width: auto;
}



/* Animation container to maintain consistent height */
.animation-container {
  --animation-height: 68px;
  
  align-items: center;
  block-size: var(--animation-height);
  display: flex;
  justify-content: center;
  margin-block-end: 8px;
  margin-block-start: var(--loading-container-pad);
  padding-inline: var(--loading-container-pad);
  position: relative;
}

/* Loading animation and pause icon positioning */
.animation-container > * {
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease;
}

/* Hidden state for smooth transitions */
.animation-container > *.hidden {
  opacity: 0;
  pointer-events: none;
}

/* Pause icon container - <div class="pause-icon-container"> */
.pause-icon-container {
  align-items: center;
  background-color: var(--bg-clr-lite);
  block-size: var(--animation-height);
  border-radius: 50%;
  box-shadow: 0 2px 8px hsla(0, 0%, 0%, 0.1);
  display: flex;
  inline-size: var(--animation-height);
  justify-content: center;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

/* Pause icon styling - <Icon class="pause-icon"> */
.pause-icon {
  color: var(--txt-clr-darkr);
  opacity: 1;
}

/* Ensure the iconify span has the correct height */
.pause-icon :deep(.iconify) {
  block-size: 48px;
  inline-size: 48px;
}
</style>
