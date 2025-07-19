// plugins/bounceDirective.ts @preserve

// * Usage Example: @preserve
//   Apply the `v-bounce-on-click` directive to a button or link element that contains an icon with the class `bounce-icon-on-click`. @preserve
//   When the element is clicked, the icon will have the `bounce` class added for 250ms, triggering a CSS animation. @preserve
// ! Important: Ensure the icon has the class "bounce-icon-on-click" @preserve
/*
 * Example in a template:
   <NuxtLink
   v-bounce-on-click
   to="/"
  °class="nav-button button trans-btn can-become-active"
   >
     <Icon name="mdi:cog" size="32" class="bounce-icon-on-click" />
   </NuxtLink>
   @preserve
 */

   import { defineNuxtPlugin } from "nuxt/app";
   import type { NuxtApp } from "nuxt/app";
   
   export default defineNuxtPlugin((nuxtApp: NuxtApp) => {
     nuxtApp.vueApp.directive("bounce-on-click", {
       mounted(el: HTMLElement) {
         el.addEventListener("click", () => {
           const icon = el.querySelector(".bounce-icon-on-click") as HTMLElement | null;
           if (icon) {
             icon.classList.add("bounce");
             setTimeout(() => icon.classList.remove("bounce"), 250);
           }
         });
       },
     });
   });