import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App, checkForUpdates } from '@cogability/membership-kit';
import config from '@/site.config';

checkForUpdates();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App config={config} />
  </StrictMode>,
);
