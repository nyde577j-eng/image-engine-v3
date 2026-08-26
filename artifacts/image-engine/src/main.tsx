import { createRoot } from 'react-dom/client';
import { Router } from 'wouter';

import App from './App';

import './index.css';

// Register Service Worker for PWA install support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <Router>
    <App />
  </Router>
);
