<!-- components/OutputControls.vue @preserve -->
<template>
  <section class="output-controls" data-component-name="OutputControls">
    <CustomFieldNew
      field-id="output-location"
      input-type="text-area"
      :model-value="outputLocation"
      :spellcheck="false"
      title="Output Location"
      @update:model-value="updateOutputLocation"
      @unset-or-clear="clearOutputLocation"
    >
      <template #buttons-start>
        <CustomButton
          button-style-class="trans-btn btn-lite"
          data-name="auto-determine-output-location-btn"
          first-icon-name="mdi:auto-fix"
          :first-icon-size="16"
          @click="autoSetLocationFromActiveJob"
          title="Auto-determine output location from current files"
        >
          Auto-Set
        </CustomButton>
      </template>
      <template #buttons-end>
        <CustomButton
          button-style-class="trans-btn btn-lite"
          data-name="browse-output-location-btn"
          first-icon-name="mdi:folder"
          :first-icon-size="20"
          @click="browseTopLevelOutputFolder"
        >
          Browse
        </CustomButton>
      </template>
    </CustomFieldNew>

    <CustomFieldNew
      field-id="output-filename"
      input-type="input"
      :model-value="outputFilename"
      :spellcheck="false"
      title="Output Filename"
      placeholder="Enter filename..."
      @update:model-value="updateOutputFilename"
      @unset-or-clear="clearOutputFilename"
    >
      <template #buttons-start>
        <CustomButton
          button-style-class="trans-btn btn-lite"
          data-name="auto-determine-output-filename-btn"
          first-icon-name="mdi:auto-fix"
          :first-icon-size="16"
          @click="autoSetFilenameFromActiveJob"
          title="Auto-determine output filename from current files"
        >
          Auto-Set
        </CustomButton>
      </template>
    </CustomFieldNew>
  </section>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import CustomFieldNew from '@/components/CustomFieldNew.vue';
import CustomButton from '@/components/CustomButton.vue';
import { open } from '@tauri-apps/plugin-dialog';
import { basename, dirname } from '@tauri-apps/api/path';
import { useJobsStore } from '@/stores/jobsStore';
import compressConfigJson from '@/assets/config/compressSettingsConfig.json';

// No external emits needed anymore; autoset is handled internally based on active job

const outputLocation = ref<string>('');
const outputFilename = ref<string>('');

const jobsStore = useJobsStore();
const selectedJob = computed(() => jobsStore.jobs.find((job) => job.id === jobsStore.selectedJobId) || null);
const globalSettings = computed(() => jobsStore.globalSettings);

const getCurrentArchiveFormat = (): string => {
  return selectedJob.value?.settings.archiveFormat || globalSettings.value.archiveFormat;
};

const getArchiveExtension = (format?: string): string => {
  const cfg = compressConfigJson as any;
  const archiveFormat = format || getCurrentArchiveFormat();
  return cfg.compress?.defaultExtensions?.[archiveFormat] || '.7z';
};

const determineOutputFromInput = async (inputPath: string): Promise<{ location: string; filename: string }> => {
  try {
    const parentDir = await dirname(inputPath);
    const baseName = await basename(inputPath);
    if (!parentDir || !baseName) return { location: '', filename: '' };
    const hasExtension = baseName.includes('.') && baseName.lastIndexOf('.') > 0;
    let filename = baseName;
    if (hasExtension) {
      filename = baseName.substring(0, baseName.lastIndexOf('.'));
    }
    return { location: parentDir, filename };
  } catch (_e) {
    return { location: '', filename: '' };
  }
};

const autoSetLocationFromActiveJob = async (): Promise<void> => {
  const job = selectedJob.value;
  const firstPath = job?.files?.[0]?.path;
  if (!firstPath) return;
  const { location } = await determineOutputFromInput(firstPath);
  if (location) outputLocation.value = location;
};

const autoSetFilenameFromActiveJob = async (): Promise<void> => {
  const job = selectedJob.value;
  const firstPath = job?.files?.[0]?.path;
  if (!firstPath) return;
  const { filename } = await determineOutputFromInput(firstPath);
  const ext = getArchiveExtension();
  const finalFilename = filename ? filename + ext : '';
  if (finalFilename) outputFilename.value = finalFilename;
};

const updateOutputLocation = (value: string | number | boolean): void => {
  outputLocation.value = String(value);
};
const clearOutputLocation = (_fieldId: string): void => {
  outputLocation.value = '';
};
const updateOutputFilename = (value: string | number | boolean): void => {
  outputFilename.value = String(value);
};
const clearOutputFilename = (_fieldId: string): void => {
  outputFilename.value = '';
};
const browseTopLevelOutputFolder = async (): Promise<void> => {
  try {
    const selected: string | null = await open({ directory: true, multiple: false });
    if (selected && typeof selected === 'string') {
      outputLocation.value = selected;
    }
  } catch (error) {
    console.error('Error selecting output folder:', error);
  }
};

defineExpose({
  setOutputLocation: (location: string) => (outputLocation.value = location),
  setOutputFilename: (filename: string) => (outputFilename.value = filename),
  getValues: () => ({ location: outputLocation.value, filename: outputFilename.value }),
});
</script>
<style scoped>
.output-controls {
  display: grid;
  gap: var(--pad-blok);
  padding: var(--pad-in);
  background: var(--btn-bg-activ-clr-dark, var(--bg-clr-lite));
  border: 1px solid var(--brdr-clr);
}
</style>


