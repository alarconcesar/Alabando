import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { getJSON } from './lib/storage.ts'
import { STORAGE_KEYS } from './lib/constants.ts'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

// Pre-apply theme from localStorage BEFORE first render to avoid flash
const savedTheme = getJSON<string>(STORAGE_KEYS.THEME, 'naranja');
const isDark = savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
