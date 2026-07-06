/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_REMOTE_DASHBOARD?: string;
  readonly VITE_REMOTE_TASKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}