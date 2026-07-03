import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.error('Service worker registration failed:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
