import { useState, useEffect } from 'react';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@cogability/membership-kit/latest';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'cogbot_kit_update_check';
const DISMISS_KEY = 'cogbot_kit_update_dismissed';

function compareParts(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

function severity(installed, latest) {
  const [iMaj, iMin] = installed.split('.').map(Number);
  const [lMaj, lMin] = latest.split('.').map(Number);
  if (lMaj > iMaj) return { label: 'BREAKING', bg: '#fecaca', text: '#991b1b', border: '#f87171' };
  if (lMin > iMin) return { label: 'Feature', bg: '#fef08a', text: '#854d0e', border: '#facc15' };
  return { label: 'Patch', bg: '#bbf7d0', text: '#166534', border: '#4ade80' };
}

export default function KitUpdateBanner({ installedVersion }) {
  const [update, setUpdate] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (sessionStorage.getItem(DISMISS_KEY)) { setDismissed(true); return; }

    const lastCheck = localStorage.getItem(STORAGE_KEY);
    if (lastCheck && Date.now() - Number(lastCheck) < CHECK_INTERVAL_MS) {
      const cached = localStorage.getItem(STORAGE_KEY + '_version');
      if (cached && compareParts(installedVersion, cached) < 0) {
        setUpdate(cached);
      }
      return;
    }

    fetch(NPM_REGISTRY_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.version) return;
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        localStorage.setItem(STORAGE_KEY + '_version', data.version);
        if (compareParts(installedVersion, data.version) < 0) {
          setUpdate(data.version);
        }
      })
      .catch(() => {});
  }, [installedVersion]);

  if (!import.meta.env.DEV || !update || dismissed) return null;

  const sev = severity(installedVersion, update);

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 99999,
      background: '#1e293b', color: '#e2e8f0', borderRadius: 10,
      padding: '14px 18px', maxWidth: 370, fontFamily: 'system-ui, sans-serif',
      fontSize: 13, lineHeight: 1.5, boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ fontSize: 14 }}>Kit Update Available</strong>
        <button
          onClick={() => { setDismissed(true); sessionStorage.setItem(DISMISS_KEY, '1'); }}
          style={{
            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
            fontSize: 18, lineHeight: 1, padding: '0 0 0 8px',
          }}
          aria-label="Dismiss"
        >&times;</button>
      </div>
      <div style={{ marginBottom: 8 }}>
        <span style={{
          display: 'inline-block', padding: '1px 8px', borderRadius: 4, fontSize: 11,
          fontWeight: 600, background: sev.bg, color: sev.text, border: `1px solid ${sev.border}`,
          marginRight: 8,
        }}>{sev.label}</span>
        <code style={{ fontSize: 12 }}>{installedVersion}</code>
        <span style={{ margin: '0 6px', color: '#64748b' }}>&rarr;</span>
        <code style={{ fontSize: 12, color: '#38bdf8' }}>{update}</code>
      </div>
      <code style={{
        display: 'block', background: '#0f172a', padding: '8px 10px', borderRadius: 6,
        fontSize: 12, color: '#7dd3fc', userSelect: 'all', cursor: 'text',
      }}>npm update @cogability/membership-kit</code>
      <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>
        Dev-mode only &mdash; never shown to site visitors.
      </div>
    </div>
  );
}
