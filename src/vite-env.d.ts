/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do backend real (Socket.IO). Se ausente, usa o MockGameClient. */
  readonly VITE_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
