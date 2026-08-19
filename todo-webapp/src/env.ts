// Typed read of the platform-mounted /env-config.js. Every other module reads
// runtime configuration through this file — never window._env_ directly, and
// never import.meta.env / process.env (those are build-time and unset here).

export type Env = {
  // component dependency `todo-api` -> <UPSTREAM>_URL
  TODO_API_URL: string;
  // platform-resource dependency `user-auth` (thunder-app) -> <DEP>_*
  USER_AUTH_CLIENT_ID: string;
  USER_AUTH_ISSUER: string;
  USER_AUTH_JWKS_URL: string;
  USER_AUTH_SCOPES: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
