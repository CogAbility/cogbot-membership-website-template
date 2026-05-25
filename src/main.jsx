import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from '@cogability/membership-kit';
import config from '@/site.config';
import MembersPage from './MembersPage';
import OnboardingPage from './OnboardingPage';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App config={config} overrides={{ MembersPage, OnboardingPage }} />
  </StrictMode>,
);
