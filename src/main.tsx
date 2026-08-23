import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { DEMO_MODE } from './demo/config';
import { installNetworkGuard } from './demo/networkGuard';
import './index.css';

installNetworkGuard();

// Web Push relies on a real backend to store subscriptions against — skip
// service-worker registration entirely in DEMO_MODE (see pushApi.mock.ts).
if (!DEMO_MODE && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.error('Service worker registration failed:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
