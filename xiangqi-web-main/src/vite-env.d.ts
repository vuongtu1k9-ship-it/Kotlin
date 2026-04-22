/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_NAME__: string;
declare const __BUILD_TIME__: string;
declare const __GOOGLE_CLIENT_ID__: string;

declare interface ImportMetaEnv {
  readonly VITE_SOCKET_URL?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
