/**
 * Federation entry for the admin MFE. The shell lazy-loads this default export
 * and renders it with the active workspace id. Providers (auth, query) come from
 * the host tree — do not add them here.
 */
export { default } from "./AdminApp.js";
