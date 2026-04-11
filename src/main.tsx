import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silently swallow errors that originate from browser extensions (MetaMask,
// React DevTools, ad-blockers, etc.). These errors appear in the console but
// have nothing to do with the app itself and cannot be caught by the app code.
const isExtensionError = (msg: string): boolean => {
  return (
    msg.includes('Extension context invalidated') ||
    msg.includes('message channel closed') ||
    msg.includes('chrome-extension') ||
    msg.includes('SES_UNCAUGHT_EXCEPTION') ||
    msg.includes('ChromeTransport') ||
    msg.includes('inpage.js') ||
    msg.includes('lockdown-install') ||
    msg.includes('runtime.lastError')
  );
};

window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e.reason?.message ?? e.reason ?? '');
  if (isExtensionError(msg)) {
    e.preventDefault();
  }
});

window.addEventListener('error', (e) => {
  if (e.message && isExtensionError(e.message)) {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
