// @ts-check

// We changed this import line because the previous one was trying to
// directly import from a file inside the `.nuxt` build output directory:
// import withNuxt from '.nuxt/eslint.config.mjs'

// This caused an error (ERR_INVALID_MODULE_SPECIFIER) because Node.js/ESLint
// doesn't recognize files in build output directories like `.nuxt/` as
// standard, importable ES modules or packages.

// The correct way is to import 'withNuxt' directly from the installed
// '@nuxt/eslint-config' npm package, which is designed to provide Nuxt's
// ESLint configuration to your project's main ESLint config.9
import withNuxt from "@nuxt/eslint-config";

export default withNuxt();
// Your custom configs here
