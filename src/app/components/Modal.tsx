import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  confirmClose?: boolean;
}

// Modal simple basado en clases de Bootstrap pero controlado por estado de React
// (no depende del bundle JS de Bootstrap). Suficiente para el prototipo.
const Modal: React.FC<ModalProps> = ({ title, onClose, children, footer, confirmClose }) => {
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
        <div className="sc-modal-body">{children}</div>
        {footer && <div className="sc-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
