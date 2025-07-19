<!-- eslint-disable vue/html-self-closing @preserve -->
<!-- components/modals/DebugButtonTestModalContent.vue @preserve -->
<!--
  Description:
  The content for the button test modal. Displays various button styles.
  This content was moved from the old DebugButtonTest.vue component.
-->
<template>
  <div class="button-test-grid" data-component-name="DebugButtonTestModalContent">
    <div class="column">
      <h3>Flat</h3>
      <CustomButton data-name="test-default"> Default </CustomButton>
      <CustomButton btn-theme="lite" data-name="test-lite"> Lite </CustomButton>
      <CustomButton btn-theme="liter" data-name="test-liter"> Liter </CustomButton>
      <CustomButton btn-theme="dark" data-name="test-dark"> Dark </CustomButton>
      <CustomButton btn-theme="darkr" data-name="test-darkr"> Darkr </CustomButton>
      <CustomButton btn-theme="primary" data-name="test-primary"> Primary </CustomButton>
      <CustomButton btn-theme="danger" data-name="test-danger"> Danger </CustomButton>
      <CustomButton btn-theme="warning" data-name="test-warning"> Warning </CustomButton>
      <CustomButton btn-theme="info" data-name="test-info"> Info </CustomButton>
    </div>
    <div class="column">
      <h3>Bordered</h3>
      <CustomButton button-style-class="bordered-btn" data-name="test-bordered-default"> Default </CustomButton>
      <CustomButton btn-theme="lite" button-style-class="bordered-btn" data-name="test-bordered-lite"> Lite </CustomButton>
      <CustomButton btn-theme="liter" button-style-class="bordered-btn" data-name="test-bordered-liter"> Liter </CustomButton>
      <CustomButton btn-theme="dark" button-style-class="bordered-btn" data-name="test-bordered-dark"> Dark </CustomButton>
      <CustomButton btn-theme="darkr" button-style-class="bordered-btn" data-name="test-bordered-darkr"> Darkr </CustomButton>
      <CustomButton btn-theme="primary" button-style-class="bordered-btn" data-name="test-bordered-primary">
        Primary
      </CustomButton>
      <CustomButton btn-theme="danger" button-style-class="bordered-btn" data-name="test-bordered-danger"> Danger </CustomButton>
      <CustomButton btn-theme="warning" button-style-class="bordered-btn" data-name="test-bordered-warning">
        Warning
      </CustomButton>
      <CustomButton btn-theme="info" button-style-class="bordered-btn" data-name="test-bordered-info"> Info </CustomButton>
    </div>
    <div class="column">
      <h3>Transparent</h3>
      <CustomButton button-style-class="trans-btn" data-name="test-trans-default"> Default </CustomButton>
      <CustomButton btn-theme="lite" button-style-class="trans-btn" data-name="test-trans-lite"> Lite </CustomButton>
      <CustomButton btn-theme="liter" button-style-class="trans-btn" data-name="test-trans-liter"> Liter </CustomButton>
      <CustomButton btn-theme="dark" button-style-class="trans-btn" data-name="test-trans-dark"> Dark </CustomButton>
      <CustomButton btn-theme="darkr" button-style-class="trans-btn" data-name="test-trans-darkr"> Darkr </CustomButton>
      <CustomButton btn-theme="primary" button-style-class="trans-btn" data-name="test-trans-primary"> Primary </CustomButton>
      <CustomButton btn-theme="danger" button-style-class="trans-btn" data-name="test-trans-danger"> Danger </CustomButton>
      <CustomButton btn-theme="warning" button-style-class="trans-btn" data-name="test-trans-warning"> Warning </CustomButton>
      <CustomButton btn-theme="info" button-style-class="trans-btn" data-name="test-trans-info"> Info </CustomButton>
    </div>
    <div class="column">
      <h3>Justification</h3>
      <CustomButton button-style-class="bordered-btn" data-name="test-justify-auto-no-icon" justify="auto">
        Auto (No Icon)
      </CustomButton>
      <CustomButton
        button-style-class="bordered-btn"
        data-name="test-justify-auto-icon"
        first-icon-name="mdi:auto-fix"
        justify="auto"
      >
        Auto (Icon)
      </CustomButton>
      <CustomButton
        button-style-class="bordered-btn"
        data-name="test-justify-start"
        first-icon-name="mdi:align-horizontal-left"
        justify="start"
      >
        Start
      </CustomButton>
      <CustomButton
        button-style-class="bordered-btn"
        data-name="test-justify-center"
        first-icon-name="mdi:align-horizontal-center"
        justify="center"
      >
        Center
      </CustomButton>
      <CustomButton
        button-style-class="bordered-btn"
        data-name="test-justify-end"
        first-icon-name="mdi:align-horizontal-right"
        justify="end"
      >
        End
      </CustomButton>
      <CustomButton
        button-style-class="bordered-btn"
        data-name="test-justify-stretch"
        first-icon-name="mdi:arrow-expand-horizontal"
        justify="stretch"
      >
        Stretch
      </CustomButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// No script needed, this is just for display.
</script>

<style>
/* This style must be global because the modal is teleported.
      Using CSS Grid for a more robust column layout. */
.button-test-grid {
  display: grid;
  gap: var(--pad-in);
  /* Arrange items in columns, giving each a width of 180px */
  grid-auto-columns: 180px;
  grid-auto-flow: column;
  overflow-x: auto; /* Allows horizontal scrolling if needed */
  padding-bottom: 1rem; /* Adds some space for the scrollbar */
}
</style>
