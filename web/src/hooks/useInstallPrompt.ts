import { useState, useEffect, useCallback } from 'react';

// ── Module-level state shared between component & hook ──────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

// Capture the event as early as possible (runs once on module load)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    localStorage.removeItem('pwa-installed'); // Reset local state if browser allows installation again
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    localStorage.setItem('pwa-installed', 'true');
    notify();
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const DISMISS_KEY = 'pwa-dismiss-count';
const INSTALLED_KEY = 'pwa-installed';

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true
  );
}

export function getDismissCount(): number {
  return parseInt(localStorage.getItem(DISMISS_KEY) ?? '0', 10);
}

export function isMarkedInstalled(): boolean {
  return localStorage.getItem(INSTALLED_KEY) === 'true';
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// ── Hook for Settings page & InstallPrompt component ────────────────────────
export function useInstallPrompt(): {
  canInstall: boolean;
  triggerInstall: () => Promise<void>;
  isInstalled: boolean;
} {
  const [, rerender] = useState(0);

  useEffect(() => {
    const bump = () => rerender((n) => n + 1);
    listeners.add(bump);
    return () => {
      listeners.delete(bump);
    };
  }, []);

  const installed = isStandalone() || isMarkedInstalled();
  const canInstall =
    deferredPrompt !== null && !isStandalone() && !isMarkedInstalled();

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALLED_KEY, 'true');
    }
    deferredPrompt = null;
    notify();
  }, []);

  return { canInstall, triggerInstall, isInstalled: installed };
}
