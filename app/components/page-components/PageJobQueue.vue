<!-- components/page-components/PageJobQueue.vue @preserve -->
<template>
  <div id="job-queue-page" class="page" data-component-name="PageJobQueue">
    <PageHeader>
      <template #icon>
        <Icon name="mdi:view-list" size="64" />
      </template>
      <template #big-text>Job Queue</template>
      <template #description>Review your configured jobs before processing.</template>
    </PageHeader>

    <div class="main-content">
      <div v-for="job in jobs" :key="job.id">
        <h2>Job {{ job.id }}</h2>
        <p>Files: {{ job.files.length }}</p>
        <ul>
          <li v-for="file in job.files" :key="file.path">{{ file.name }} ({{ file.size }} bytes)</li>
        </ul>
        <p>Compression Level: {{ job.settings.compressionLevel }}</p>
        <p>Password: {{ job.settings.password || "None" }}</p>
      </div>
    </div>

    <BottomButtons div-id="job-queue-bottom-buttons">
      <CustomButton v-flash-on-click data-name="back-btn" @click="navStore.setActivePage('JobSetup')">Back</CustomButton>
      <CustomButton v-flash-on-click data-name="begin-btn" @click="navStore.setActivePage('Progress')">
        Begin Creating Archive(s)
      </CustomButton>
    </BottomButtons>
  </div>
</template>

<script setup lang="ts">
import { useJobsStore } from "@/stores/jobsStore";
import { useNavigationStore } from "@/stores/navigationStore";

const jobsStore = useJobsStore();
const navStore = useNavigationStore();
const jobs = jobsStore.jobs;
</script>
