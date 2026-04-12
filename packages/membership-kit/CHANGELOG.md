# Changelog

All notable changes to `@cogbot/membership-kit` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
