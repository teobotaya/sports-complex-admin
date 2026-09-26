import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { IconBell } from '../components/Icons';
import { notificacionesApi, Notificacion, avisarCambioNotificaciones } from '../api/notificaciones';
import { ApiError } from '../api/client';

const Notificaciones: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = () => {
    setLoading(true);
    notificacionesApi.getMias()
      .then(setNotificaciones)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar notificaciones.'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

  const marcarLeida = async (id: number) => {
    try {
      await notificacionesApi.marcarLeida(id);
      avisarCambioNotificaciones();
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al marcar como leída.');
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await notificacionesApi.marcarTodasLeidas();
      avisarCambioNotificaciones();
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al marcar todas como leídas.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        subtitle="Bandeja de notificaciones internas del sistema"
        action={
          <button type="button" className="btn btn-outline-secondary" onClick={marcarTodasLeidas}>
            Marcar todas como leídas
          </button>
        }
      />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="sc-card">
        <div className="sc-card-body p-0">
          {loading ? (
            <div className="text-muted-sc p-3">Cargando notificaciones…</div>
          ) : notificaciones.length === 0 ? (
            <EmptyState title="Sin notificaciones" message="No tenés notificaciones pendientes." />
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.idNotificacion}
                className="d-flex align-items-start gap-3 p-3"
                style={{ borderBottom: '1px solid var(--sc-border)', background: n.leida ? 'transparent' : 'var(--sc-primary-soft)' }}
              >
                <div className="text-muted-sc pt-1"><IconBell size={16} /></div>
                <div className="flex-fill">
                  <div style={{ fontSize: 13 }}>{n.mensaje}</div>
                  <div className="text-muted-sc" style={{ fontSize: 11.5 }}>{n.tipo} · {new Date(n.fechaCreacion).toLocaleString('es-AR', { hourCycle: 'h23' })}</div>
                </div>
                {!n.leida && (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => marcarLeida(n.idNotificacion)}>
                    Marcar leída
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notificaciones;
