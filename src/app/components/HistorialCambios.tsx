import React from 'react';
import { HistorialItem } from '../api/auditoria';

const ALTA: Record<string, string> = {
  Reserva: 'Reserva creada',
  Pago: 'Pago registrado',
  Cancelacion: 'Reserva cancelada',
  Devolucion: 'Devolución registrada',
  Cliente: 'Cliente dado de alta',
};

const MODIFICACION: Record<string, string> = {
  Reserva: 'Reserva modificada',
  Pago: 'Pago modificado',
  Cancelacion: 'Cancelación modificada',
  Devolucion: 'Devolución modificada',
  Cliente: 'Datos del cliente modificados',
};

const describir = (h: HistorialItem): string => {
  if (h.accion === 'Alta') return ALTA[h.entidad] ?? `${h.entidad}: alta`;
  if (h.accion === 'Baja') return `${h.entidad}: eliminado`;
  const titulo = MODIFICACION[h.entidad] ?? `${h.entidad}: modificación`;
  return h.detalle ? `${titulo} — ${h.detalle}` : titulo;
};

/** Lista del registro de auditoría: cuándo, quién y qué cambió. */
const HistorialCambios: React.FC<{ items: HistorialItem[] | null }> = ({ items }) => {
  if (items === null) return <div className="text-muted-sc" style={{ fontSize: 13 }}>Cargando historial…</div>;
  if (items.length === 0) return <div className="text-muted-sc" style={{ fontSize: 13 }}>Sin cambios registrados.</div>;
  return (
    <div>
      {items.map((h) => (
        <div className="detail-row" key={h.idAuditoria} style={{ alignItems: 'flex-start' }}>
          <span className="detail-row-label" style={{ minWidth: 150 }}>
            {h.fechaHora.slice(0, 16).replace('T', ' ')}
            <br />
            <span style={{ fontSize: 12 }}>{h.usuario}</span>
          </span>
          <span className="detail-row-value" style={{ textAlign: 'right', fontSize: 13 }}>{describir(h)}</span>
        </div>
      ))}
    </div>
  );
};

export default HistorialCambios;
