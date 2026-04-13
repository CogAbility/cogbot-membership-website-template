# Migration Guide

This guide covers migrating from the monolithic template (all code in `src/`) to the `@cogbot/membership-kit` package architecture.

## Who needs to migrate?

If you created your site **before** the `@cogbot/membership-kit` extraction, your project has application code directly in `src/`. This guide walks you through switching to the package-based architecture so you can receive updates via `npm update` instead of git merges.

If you created your site **after** the extraction, you're already on the new architecture — no migration needed.

## What changed?

| Before | After |
|---|---|
| All components, auth, hooks, and services live in `src/` | All reusable code lives in `packages/membership-kit/` (published as `@cogbot/membership-kit`) |
| Updates via `git merge` from the template remote | Updates via `npm update @cogbot/membership-kit` |
| Components import config with `import config from '@/site.config'` | Components use `useSiteConfig()` React hook |
| Hardcoded English strings scattered across components | All user-facing strings centralized in `site.config.js` |
| No page override mechanism | Pages are overridable via the `overrides` prop on `<App>` |

## Step-by-step migration

### 1. Update `site.config.js`

The config file has been expanded with new sections for every page and component. Add these new sections to your existing config:

```js
export default {
  // ... your existing siteName, botName, meta, images, etc.

  // NEW: Login page strings
  login: {
    logoInitial: 'B',
    heading: 'Join Your Org',
    subheading: "Sign in or create an account...",
    errorPrefix: 'Sign-in error:',
    loadingLabel: 'Signing in...',
    buttonLabel: 'Sign in with IBM App ID',
    footerText: 'New here? No problem...',
  },

  // NEW: Access denied page
  accessDenied: {
    heading: 'Access Restricted',
    notMemberReason: "You don't have access...",
    geofencedReason: 'This service is not available in your area.',
    backLabel: 'Back to Home',
    signOutLabel: 'Sign Out',
  },

  // NEW: Callback page
  callback: {
    loadingLabel: 'Completing sign-in...',
  },

  // NEW: Role gate messages
  roleGate: {
    loadingMessage: 'Checking access...',
    defaultGeofenceMessage: 'This content is not available in your region.',
    roleRequiredTemplate: 'You need the "{role}" role to access this page.',
  },

  // EXPANDED: header, hero, members, onboarding, profile sections
  // now include ALL user-facing strings — see site.config.js for the full schema
};
```

The easiest approach: copy the entire `site.config.js` from the updated template and replace the sample content with your branding.

### 2. Install the package

```bash
npm install @cogbot/membership-kit
```

### 3. Replace `src/main.jsx`

Replace the contents of `src/main.jsx`:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from '@cogbot/membership-kit';
import config from '@/site.config';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App config={config} />
  </StrictMode>,
);
```

### 4. Delete moved source files

Remove the directories and files that are now provided by the package:

```bash
rm -rf src/auth/
rm -rf src/config/
rm -rf src/services/
rm -rf src/hooks/
rm -rf src/components/
rm -rf src/pages/
rm -f src/App.jsx
```

After this, `src/` should contain only `main.jsx`, `index.css`, and `assets/`.

### 5. Update `vite.config.js`

Add the package alias for local development (if using the monorepo layout with `packages/membership-kit/`):

```js
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@cogbot/membership-kit': path.resolve(__dirname, 'packages/membership-kit/src'),
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/cogbot-api': {
          target: env.VITE_COGBOT_HOST || 'http://localhost:8085',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/cogbot-api/, ''),
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes) => {
              if ((proxyRes.headers['content-type'] || '').includes('text/event-stream')) {
                proxyRes.headers['cache-control'] = 'no-cache';
                proxyRes.headers['x-accel-buffering'] = 'no';
              }
            });
          },
        },
      },
    },
    // ... rest of your config
  };
});
```

The `/cogbot-api` proxy forwards chat API requests to the **CAM** (CogBot Access Manager) service. The `configure` callback sets SSE-specific headers to prevent response buffering during streaming. In local development, leave `VITE_COGBOT_HOST` unset in `.env` so the proxy defaults to `http://localhost:8085`.

If you installed from npm (not using local packages), you can skip the `@cogbot/membership-kit` alias — Vite will resolve it from `node_modules` automatically.

### 6. Update `tailwind.config.js`

Add the package directory to the content scan paths:

```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./packages/membership-kit/src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
};
```

If you installed from npm, use the `node_modules` path instead:

```js
"./node_modules/@cogbot/membership-kit/src/**/*.{js,ts,jsx,tsx}",
```

### 7. Verify the build

```bash
npm run build
```

The output should be similar in size to before. If Tailwind reports "No utility classes detected", double-check the content paths in step 6.

## Custom page overrides

If you had customized any pages beyond what `site.config.js` supports, you can keep your custom versions using the override system:

```jsx
import { App } from '@cogbot/membership-kit';
import config from '@/site.config';
import MyMembersPage from './pages/MyMembersPage';

createRoot(document.getElementById('root')).render(
  <App config={config} overrides={{ MembersPage: MyMembersPage }} />,
);
```

Move your custom page files to `src/pages/` (or anywhere in `src/`) and import them in `main.jsx`.

## Using kit exports in custom pages

Custom pages can use any export from the package:

```jsx
import { useAuth, useSiteConfig, CogBotEmbed, useBuddyChat } from '@cogbot/membership-kit';

export default function MyMembersPage() {
  const { user } = useAuth();
  const config = useSiteConfig();
  // ...
}
```

See `packages/membership-kit/src/index.js` for the full list of exports.
