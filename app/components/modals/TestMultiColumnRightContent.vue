<!--
  TestMultiColumnRightContent.vue - Right column for test modal
-->
<template>
  <div class="demo-sidebar">
    <h3>Quick Actions</h3>
    <div class="action-buttons">
      <button class="action-btn" @click="showAlert('Action 1')">Action 1</button>
      <button class="action-btn" @click="showAlert('Action 2')">Action 2</button>
      <button class="action-btn" @click="showAlert('Action 3')">Action 3</button>
    </div>

    <h3>Status</h3>
    <div class="status-info">
      <p><strong>Status:</strong> <span class="status-active">Active</span></p>
      <p><strong>Last Login:</strong> Today</p>
      <p><strong>Version:</strong> 0.1.24</p>
    </div>

    <h4>Notifications</h4>
    <div class="notification-list">
      <p><small>🔥 New feature released!</small></p>
      <p><small>⚡ Performance improvements</small></p>
      <p><small>🔔 Reminder: Subscription expires</small></p>
    </div>

    <h4>Recent Files</h4>
    <div class="recent-files">
      <p><small>📄 document.pdf - 2.3 MB</small></p>
      <p><small>🖼️ image.jpg - 5.1 MB</small></p>
      <p><small>📊 data.xlsx - 1.8 MB</small></p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Component props
const props = defineProps<{
  modalsStore?: any;
  modalId?: string;
}>();

// Methods
const showAlert = (message: string) => {
  alert(`Clicked: ${message}`);
};
</script>

<style scoped>
.demo-sidebar {
  padding: 1rem;
  height: 100%;
}

.demo-sidebar h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--text-clr);
  border-bottom: 1px solid var(--brdr-clr);
  padding-bottom: 0.5rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  background: var(--primary-clr);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: var(--primary-clr-dark, var(--primary-clr));
}

.status-info p {
  margin: 0.5rem 0;
  color: var(--text-clr-muted);
}

.status-active {
  color: var(--success-clr, #28a745);
  font-weight: 600;
}

.activity-list p,
.notification-list p,
.recent-files p {
  margin: 0.5rem 0;
  color: var(--text-clr-muted);
}

.demo-sidebar h4 {
  margin: 1.5rem 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text-clr);
  border-bottom: 1px solid var(--brdr-clr);
  padding-bottom: 0.25rem;
}
</style>
