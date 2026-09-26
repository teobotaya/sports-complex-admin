import React, { useEffect, useRef, useState } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  confirmClose?: boolean;
  /** Error de la pantalla: si aparece mientras la ventana está abierta, se muestra dentro de ella
   *  (antes quedaba escondido detrás de la ventana y parecía que el botón no hacía nada). */
  error?: string | null;
}

// Modal simple basado en clases de Bootstrap pero controlado por estado de React
// (no depende del bundle JS de Bootstrap). Suficiente para el prototipo.
const Modal: React.FC<ModalProps> = ({ title, onClose, children, footer, confirmClose, error }) => {
  // Solo se muestran los errores producidos con la ventana abierta (no uno viejo de la pantalla).
  const [errorVisible, setErrorVisible] = useState<string | null>(null);
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    setErrorVisible(error ?? null);
  }, [error]);

  const handleBackdropClose = () => {
    if (confirmClose && !window.confirm('Hay datos sin guardar. ¿Descartar los cambios?')) return;
    onClose();
  };

  return (
    <div className="sc-modal-backdrop" onClick={handleBackdropClose}>
      <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sc-modal-header">
          <h3>{title}</h3>
          <button type="button" className="sc-modal-close" onClick={handleBackdropClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="sc-modal-body">
          {errorVisible && (
            <div className="availability-msg availability-fail mb-2" role="alert">
              {errorVisible}
            </div>
          )}
          {children}
        </div>
        {footer && <div className="sc-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
