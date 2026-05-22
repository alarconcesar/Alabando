import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'naranja';
document.documentElement.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
