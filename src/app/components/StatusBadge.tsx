import React from 'react';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

// Traduce los estados de texto utilizados en los datos ficticios a un tono visual.
// Solo es una ayuda de presentación para el prototipo.
const defaultToneMap: Record<string, BadgeTone> = {
  Confirmada: 'success',
  Pagado: 'success',
  Activo: 'success',
  Disponible: 'success',
  Finalizado: 'neutral',
  Realizada: 'success',
  Pendiente: 'warning',
  Parcial: 'warning',
  Abonado: 'success',
  'Parcialmente abonado': 'warning',
  Jugado: 'success',
  Planificado: 'info',
  'Próximo': 'info',
  Programado: 'info',
  Ocupada: 'danger',
  Cancelada: 'danger',
  Inactivo: 'neutral',
  Mantenimiento: 'neutral',
  'No aplica': 'neutral',
  'En curso': 'info',
  'Se presentó': 'success',
  'No se presentó': 'danger',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone }) => {
  const resolvedTone = tone ?? defaultToneMap[label] ?? 'neutral';
  return <span className={`badge-sc badge-${resolvedTone}`}>{label}</span>;
};

export default StatusBadge;
