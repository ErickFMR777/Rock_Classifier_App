/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the deployed FastAPI backend, e.g. https://rock-classifier-api.onrender.com
   * The `/api` suffix is added automatically by the API client, so both
   * `https://host` and `https://host/api` are accepted.
   * When unset, the classifier degrades gracefully and the rest of the app still works.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
