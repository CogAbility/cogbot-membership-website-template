const installedVersion = '0.2.0';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@cogability/membership-kit/latest';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // once per day
const STORAGE_KEY = 'cogbot_kit_update_check';

/**
 * Checks npm for a newer version of @cogability/membership-kit and logs
 * a console message if one is available. Only runs once per day and
 * only in development mode.
 *
 * Call this from your app's entry point:
 *   import { checkForUpdates } from '@cogability/membership-kit';
 *   checkForUpdates();
 */
export async function checkForUpdates() {
  if (typeof import.meta?.env?.PROD !== 'undefined' && import.meta.env.PROD) {
    return;
  }

  try {
    const lastCheck = localStorage.getItem(STORAGE_KEY);
    if (lastCheck && Date.now() - Number(lastCheck) < CHECK_INTERVAL_MS) {
      return;
    }

    const res = await fetch(NPM_REGISTRY_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return;

    const { version: latestVersion } = await res.json();
    localStorage.setItem(STORAGE_KEY, String(Date.now()));

    if (latestVersion && latestVersion !== installedVersion) {
      const severity = getMajorVersion(latestVersion) > getMajorVersion(installedVersion)
        ? '🔴 BREAKING'
        : getMinorVersion(latestVersion) > getMinorVersion(installedVersion)
          ? '🟡 Feature'
          : '🟢 Patch';

      console.info(
        `%c@cogability/membership-kit update available: ${installedVersion} → ${latestVersion} (${severity})%c\n` +
        `Run: npm update @cogability/membership-kit`,
        'color: #2563eb; font-weight: bold',
        'color: inherit',
      );
    }
  } catch {
    // Network errors are silently ignored — this is a best-effort check
  }
}

function getMajorVersion(v) { return Number(v.split('.')[0]); }
function getMinorVersion(v) { return Number(v.split('.')[1]); }
