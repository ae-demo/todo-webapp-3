# Security Design — Todo Webapp

## Roles → permissions

There is exactly one role: every signed-in individual is a "User" who only ever sees and manages their own tasks. No admin or shared-visibility role exists in this phase (Product Decision: personal todos only).

## Authentication (Thunder)

- Shared dependency name: **`user-auth`** — declared on both `todo-webapp` and `todo-api`'s `design.json`, pointing at the same Thunder `thunder-app` platform resource.
- Scopes: default `openid profile email`.
- Sign-in side: `todo-webapp` performs OIDC + PKCE sign-in in the browser and attaches the resulting access token as a bearer token on every `todo-api` call.
- Protected side: `todo-api` sits behind the API gateway, which validates the token against Thunder and injects the caller's identity (`X-User-Id`) before the request reaches the service.
- No component is publicly unauthenticated: every `todo-api` endpoint requires a valid token, and `todo-webapp` requires sign-in before showing any task data.

## Role resolution

`todo-api` derives `userId` solely from the gateway-injected `X-User-Id` header (sourced from the validated token's subject claim) — never from a request body or query parameter. A request with no valid identity is rejected with `401`. Because there is only one role, no further claim-to-role mapping is needed: an authenticated caller IS a User, scoped to their own data by `userId` alone.