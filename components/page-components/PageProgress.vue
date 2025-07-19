<!-- components/page-components/PageProgress.vue @preserve -->
<template>
  <div id="progress-page" class="page" data-component-name="PageProgress">
    <PageHeader>
      <template #icon>
        <Icon name="mdi:progress-clock" size="64" />
      </template>
      <template #big-text>Progress</template>
      <template #description>Monitoring job execution.</template>
    </PageHeader>

    <div class="main-content">
      <div class="progress-page-content">
        <div v-for="job in jobs" :key="job.id">
          <h2>Job {{ job.id }}</h2>
          <p>Status: In progress</p>
          <progress value="50" max="100" />
        </div>
      </div>
    </div>

    <BottomButtons div-id="progress-bottom-buttons">
      <CustomButton v-flash-on-click data-name="back-to-queue-btn" @click="navStore.setActivePage('JobQueue')"
        >Back to Queue</CustomButton
      >
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
