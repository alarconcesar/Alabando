import { useState, useEffect, useCallback } from 'react';
import { X, Share } from 'lucide-react';
import {
  useInstallPrompt,
  isStandalone,
  isMarkedInstalled,
  getDismissCount,
  isIOS,
} from '../hooks/useInstallPrompt';

const MAX_DISMISSALS = 3;

// ── Component ───────────────────────────────────────────────────────────────
export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const { canInstall, triggerInstall } = useInstallPrompt();

  // Decide visibility whenever module state changes
  /* eslint-disable react-hooks/set-state-in-effect -- sincroniza `visible` con el store externo del módulo (beforeinstallprompt/appinstalled) */
  useEffect(() => {
    if (isStandalone() || isMarkedInstalled() || getDismissCount() >= MAX_DISMISSALS) {
      setVisible(false);
      return;
    }

    if (canInstall) {
      setVisible(true);
      setShowIOSGuide(false);
    } else if (isIOS()) {
      setVisible(true);
      setShowIOSGuide(true);
    }
  }, [canInstall]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const dismiss = useCallback(() => {
    setAnimateOut(true);
    const count = getDismissCount() + 1;
    localStorage.setItem('pwa-dismiss-count', String(count));
    // Wait for exit animation before unmounting
    setTimeout(() => {
      setVisible(false);
      setAnimateOut(false);
    }, 300);
  }, []);

  if (!visible) return null;

  // ── Inline styles using CSS vars ──────────────────────────────────────────
  const overlay: React.CSSProperties = {
    position: 'fixed',
    bottom: 80, // above the 80px nav bar
    left: 0,
    right: 0,
    zIndex: 999,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  const banner: React.CSSProperties = {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 480,
    margin: '0 8px',
    backgroundColor: 'var(--surface)',
    borderRadius: '20px 20px 0 0',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
    borderTop: '1px solid var(--barra)',
    padding: '16px 16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    animation: animateOut
      ? 'installSlideDown 0.3s cubic-bezier(0.4, 0, 1, 1) forwards'
      : 'installSlideUp 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
  };

  const iconImg: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 12,
    flexShrink: 0,
    objectFit: 'cover',
  };

  const textBlock: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const title: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--on-surface)',
    lineHeight: 1.3,
  };

  const subtitle: React.CSSProperties = {
    fontSize: 13,
    color: 'var(--outline)',
    marginTop: 2,
    lineHeight: 1.3,
  };

  const installBtn: React.CSSProperties = {
    backgroundColor: 'var(--primary)',
    color: 'var(--on-primary)',
    border: 'none',
    borderRadius: 100,
    padding: '8px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'transform 0.15s',
    fontFamily: 'inherit',
  };

  const closeBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--outline)',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const iosInstructions: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const iosStep: React.CSSProperties = {
    fontSize: 13,
    color: 'var(--outline)',
    marginTop: 4,
    lineHeight: 1.4,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  };

  return (
    <>
      {/* Keyframe injection (only once) */}
      <style>{`
        @keyframes installSlideUp {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes installSlideDown {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
      `}</style>

      <div style={overlay}>
        <div style={banner}>
          <img
            src="/pwa-192x192.png"
            alt="Himnario EAV"
            style={iconImg}
          />

          {showIOSGuide ? (
            <div style={iosInstructions}>
              <div style={title}>Instalar Himnario EAV</div>
              <div style={iosStep}>
                Pulsa <Share size={14} style={{ color: 'var(--primary)', margin: '0 2px' }} /> y luego
                &quot;Agregar a Inicio&quot;
              </div>
            </div>
          ) : (
            <div style={textBlock}>
              <div style={title}>Instalar Himnario EAV</div>
              <div style={subtitle}>Accede rápido y sin conexión</div>
            </div>
          )}

          {!showIOSGuide && (
            <button
              style={installBtn}
              onClick={triggerInstall}
              onMouseDown={(e) => ((e.currentTarget.style.transform = 'scale(0.95)'))}
              onMouseUp={(e) => ((e.currentTarget.style.transform = 'scale(1)'))}
              onMouseLeave={(e) => ((e.currentTarget.style.transform = 'scale(1)'))}
            >
              Instalar
            </button>
          )}

          <button style={closeBtn} onClick={dismiss} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
      </div>
    </>
  );
}
