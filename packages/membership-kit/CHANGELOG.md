# Changelog

All notable changes to `@cogbot/membership-kit` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-12

### Added

- **SSE streaming support** — chat responses now appear progressively, token by token, when streaming is enabled by the CAM service.
  - `sendMessageStream()` and `sendAuthenticatedMessageStream()` in `buddyApi` — SSE fetch with chunked parsing via `ReadableStream`.
  - `parseSseBlock()` utility for parsing raw SSE event blocks into `{ eventName, data }` objects.
  - `buildMessageBody()` helper to reduce duplication between message functions.
  - `streamingText` state and `streamingRef` in `useBuddyChat` — resolves streaming flag from `initCogbot()` response (`config.streaming`), dispatches `partial_object`/`object_ready`/`final_response` events, batches DOM updates via `requestAnimationFrame`.
  - Progressive rendering in `BuddyChat` — shows partial text as a live assistant bubble during streaming, falls back to loading dots when streaming is disabled.
  - `AbortController` support — in-flight streams are aborted on unmount or retry.

### Changed

- **CAM migration** — `buddyApi` now targets the **CAM** (CogBot Access Manager) service instead of the legacy widget BFF. API paths and request format are unchanged; the Vite proxy target defaults to `http://localhost:8085` (local CAM).
- `vite.config.js` proxy updated with SSE-specific headers (`cache-control: no-cache`, `x-accel-buffering: no`) to prevent response buffering during streaming.
- `.env.example` updated to reference CAM instead of the legacy widget server.
- `useBuddyChat` hook now exports `streamingText` alongside existing state.

## [0.1.0] - 2026-04-12

### Added

- Initial extraction from the monolithic template.
- `SiteConfigProvider` and `useSiteConfig` for centralized config via React Context.
- `AuthProvider`, `ProtectedRoute`, `RoleGate` for OIDC auth and role-based access.
- `BuddyChat`, `CogBotEmbed` chat components.
- `useBuddyChat` hook for chat session state.
- `buddyApi` service for anonymous and authenticated CogBot communication.
- All UI pages: `LandingPage`, `MembersPage`, `OnboardingPage`, `ProfilePage`, `LoginPage`, `AccessDenied`, `CallbackPage`.
- All UI components: `Header`, `Footer`, `Hero`, `Features`, `About`, `Testimonials`, `ProfileFormFields`, `OnboardingProgressIndicator`.
- `App` component with props-based page override system.
- `prepublishOnly` secret scanner.
- GitHub Actions publish workflow with provenance.
