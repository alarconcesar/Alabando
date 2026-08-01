import { RefreshCw } from 'lucide-react';

interface DataErrorProps {
  onRetry: () => void;
  message?: string;
}

/** Estado de error de datos con botón de reintento — evita pantallas vacías engañosas */
export default function DataError({ onRetry, message }: DataErrorProps) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--outline)' }}>
      <p style={{ fontSize: '1rem', marginBottom: 8, fontWeight: 600, color: 'var(--on-background)' }}>
        No se pudieron cargar los himnos
      </p>
      <p style={{ fontSize: '0.9rem', marginBottom: 24 }}>
        {message ?? 'Revisa tu conexión e inténtalo de nuevo.'}
      </p>
      <button
        onClick={onRetry}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--primary)', color: 'var(--on-primary)',
          border: 'none', borderRadius: 100, padding: '12px 24px',
          fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
        }}
      >
        <RefreshCw size={18} />
        Reintentar
      </button>
    </div>
  );
}
