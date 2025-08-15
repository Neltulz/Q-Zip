<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- 
  InfoCard.vue @preserve
-->
<!-- components/InfoCard.vue @preserve -->
<!-- 
  InfoCard.vue @preserve
-->

<template>
  <div 
    class="info-card"
    :class="[`info-card--${theme}`, { 'info-card--with-icon': $slots.icon }]"
  >
    <div class="info-card__content">
      <div v-if="$slots.icon" class="info-card__icon">
        <slot name="icon" />
      </div>
      <div class="info-card__text">
        <div v-if="$slots.header" class="info-card__header">
          <slot name="header" />
        </div>
        <div v-if="$slots.default" class="info-card__body">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  theme?: 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'default';
}

withDefaults(defineProps<Props>(), {
  theme: 'default'
});
</script>

<style scoped>
.info-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: linear-gradient(135deg, hsla(220, 15%, 15%, 0.8), hsla(220, 15%, 12%, 0.9));
  border: 1px solid hsla(220, 15%, 25%, 0.6);
  border-radius: 8px;
  padding: 12px 16px;
  backdrop-filter: blur(8px);
  box-shadow: 
    0 2px 8px hsla(0, 0%, 0%, 0.3),
    inset 0 1px 0 hsla(220, 15%, 30%, 0.4),
    0 0 0 1px hsla(220, 15%, 20%, 0.2);
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, hsla(220, 15%, 40%, 0.6), transparent);
}

.info-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, hsla(220, 80%, 60%, 0.8), hsla(220, 80%, 40%, 0.6));
  border-radius: 2px 0 0 2px;
}

.info-card__content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.info-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--txt-clr-liter);
}

.info-card__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.info-card__header {
  font-size: 12px;
  font-weight: 700;
  color: hsla(220, 80%, 70%, 1);
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px hsla(0, 0%, 0%, 0.3);
}

.info-card__body {
  font-size: 13px;
  color: hsla(220, 15%, 85%, 1);
  line-height: 1.5;
}

/* Theme Variations */
.info-card--primary::after {
  background: linear-gradient(180deg, var(--blu-lite), hsla(204, 100%, 40%, 0.8));
}

.info-card--primary .info-card__header {
  color: var(--blu-lite);
}

.info-card--success::after {
  background: linear-gradient(180deg, var(--success-clr), hsla(145, 63%, 30%, 0.8));
}

.info-card--success .info-card__header {
  color: var(--success-clr);
}

.info-card--danger::after {
  background: linear-gradient(180deg, var(--danger-clr), hsla(0, 65%, 35%, 0.8));
}

.info-card--danger .info-card__header {
  color: var(--danger-clr);
}

.info-card--warning::after {
  background: linear-gradient(180deg, var(--warning-clr), hsla(45, 100%, 40%, 0.8));
}

.info-card--warning .info-card__header {
  color: var(--warning-clr);
}

.info-card--info::after {
  background: linear-gradient(180deg, hsla(200, 80%, 60%, 0.8), hsla(200, 80%, 40%, 0.6));
}

.info-card--info .info-card__header {
  color: hsla(200, 80%, 70%, 1);
}

/* Icon-specific styling */
.info-card--with-icon .info-card__icon {
  color: inherit;
}

.info-card--primary .info-card__icon {
  color: var(--blu-lite);
}

.info-card--success .info-card__icon {
  color: var(--success-clr);
}

.info-card--danger .info-card__icon {
  color: var(--danger-clr);
}

.info-card--warning .info-card__icon {
  color: var(--warning-clr);
}

.info-card--info .info-card__icon {
  color: hsla(200, 80%, 70%, 1);
}
</style>
