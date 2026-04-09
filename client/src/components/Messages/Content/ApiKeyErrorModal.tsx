import { useState, useEffect } from 'react';
import { KeyRound, AlertTriangle, ExternalLink, X, GraduationCap } from 'lucide-react';

const TRAINING_URL = 'https://wappy-ia.com/training/69a5efb4780d73647a1961fe';

interface ApiKeyErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyErrorModal = ({ isOpen, onClose }: ApiKeyErrorModalProps) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  const handleClose = () => {
    setAnimating(false);
    setTimeout(onClose, 300);
  };

  const handleGoToTraining = () => {
    window.open(TRAINING_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="api-key-modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: animating ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
          backdropFilter: animating ? 'blur(4px)' : 'blur(0px)',
          transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        {/* Modal Card */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-key-modal-title"
          style={{
            position: 'relative',
            zIndex: 9999,
            width: '100%',
            maxWidth: '480px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            transform: animating ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
            opacity: animating ? 1 : 0,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
            background: 'var(--surface-dialog)',
            border: '1px solid var(--border-medium)',
          }}
        >
          {/* Header gradient strip */}
          <div
            style={{
              height: '4px',
              background: 'linear-gradient(90deg, #f59e0b, #ef4444, #dc2626)',
            }}
          />

          {/* Icon area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem 2rem 1rem',
              textAlign: 'center',
            }}
          >
            {/* Pulsing warning icon */}
            <div
              style={{
                position: 'relative',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '-8px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  animation: 'api-key-pulse 2s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <AlertTriangle
                  style={{ width: '28px', height: '28px', color: '#d97706', strokeWidth: 2.5 }}
                />
              </div>
            </div>

            {/* Title */}
            <h2
              id="api-key-modal-title"
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
                lineHeight: 1.3,
              }}
            >
              🔑 Claves de API no configuradas
            </h2>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#dc2626',
                marginBottom: '1.25rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
              }}
            >
              ⚠️ Sin estas claves, el sistema no podrá funcionar
            </p>

            {/* Description */}
            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '380px',
                marginBottom: '0.75rem',
              }}
            >
              Para que los agentes de inteligencia artificial funcionen correctamente,
              debes ingresar tus <strong style={{ color: 'var(--text-primary)' }}>claves de API</strong> de los
              proveedores de IA (como Google Gemini, OpenAI, Claude, etc.).
            </p>

            {/* Info box */}
            <div
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '10px',
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border-light)',
                textAlign: 'left',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                }}
              >
                <KeyRound
                  style={{
                    width: '18px',
                    height: '18px',
                    color: '#10b981',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                />
                <div>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    ¿Cómo obtener mis claves de API?
                  </p>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Accede al curso de capacitación de WAPPY IA y sigue las instrucciones
                    paso a paso para crear y configurar tus claves de forma segura.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
                width: '100%',
              }}
            >
              {/* Primary CTA */}
              <button
                onClick={handleGoToTraining}
                id="api-key-training-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(5, 150, 105, 0.35)';
                }}
              >
                <GraduationCap style={{ width: '18px', height: '18px' }} />
                Ir a la capacitación
                <ExternalLink style={{ width: '14px', height: '14px', opacity: 0.8 }} />
              </button>

              {/* Secondary close */}
              <button
                onClick={handleClose}
                id="api-key-modal-close-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.625rem 1.5rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Entendido, cerrar
              </button>
            </div>
          </div>

          {/* Close X button */}
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: '1px solid var(--border-light)',
              background: 'var(--surface-secondary)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-active)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--surface-secondary)';
            }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes api-key-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ApiKeyErrorModal;
