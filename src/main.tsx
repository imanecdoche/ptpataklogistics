import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DialogProvider } from '@/context/DialogContext';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// PWA Service Worker Auto-Update Registration
registerSW({
  immediate: true,
  onRegistered(registration) {
    if (registration) {
      // Periodically check for SW updates (every 1 hour)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('PWA service worker registration error:', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </React.StrictMode>
);
