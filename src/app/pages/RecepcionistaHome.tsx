import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { isoDate } from '../../data/mock';
import { reservasApi, Reserva } from '../api/reservas';
import { canchasApi, Cancha } from '../api/canchas';
import { cancelacionesApi } from '../api/pagos';
import { ApiError } from '../api/client';

function horaActual(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const RecepcionistaHome: React.FC = () => {
  const history = useHistory();
  const hoy = isoDate(0);
  const [reservasHoy, setReservasHoy] = useState<Reserva[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [cancelacionesHoy, setCancelacionesHoy] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([reservasApi.getAll({ fecha: hoy }), canchasApi.getAll(), cancelacionesApi.getAll()])
      .then(([r, c, cancelaciones]) => {
        setReservasHoy(r);
        setCanchas(c);
        setCancelacionesHoy(cancelaciones.filter((cc) => cc.fechaCancelacion.slice(0, 10) === hoy).length);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar la agenda de hoy.'))
      .finally(() => setLoading(false));
  }, [hoy]);

  const activas = reservasHoy.filter((r) => r.estadoReserva !== 'Cancelada');
  const ahora = horaActual();
  const canchasOcupadasAhora = new Set(
    activas.filter((r) => r.horaInicio <= ahora && r.horaFin > ahora).map((r) => r.idCancha)
  );
  const canchasLibresAhora = canchas.filter((c) => c.activa && !canchasOcupadasAhora.has(c.idCancha));
  const pagosPendientes = activas.filter((r) => r.estadoPago !== 'Abonado').length;
  const proximasReservas = [...activas].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  if (loading) return <div className="text-muted-sc p-3">Cargando…</div>;

  return (
    <div>
      <PageHeader title="Hoy" subtitle="Vista operativa del día para recepción" />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard label="Reservas de hoy" value={activas.length} hint={`${reservasHoy.length - activas.length} canceladas`} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Canchas libres ahora" value={`${canchasLibresAhora.length}/${canchas.length}`} hint="Disponibles en este momento" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Pagos pendientes" value={pagosPendientes} hint="Reservas de hoy sin abonar" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Cancelaciones de hoy" value={cancelacionesHoy} hint="Turnos cancelados hoy" />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="sc-card h-100">
            <div className="sc-card-header">
              <h2>Próximas reservas de hoy</h2>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={() => history.push('/agenda')}>
                Ver agenda
              </button>
            </div>
            <div className="table-responsive-sc">
              <table className="table-sc mb-0">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Cancha</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proximasReservas.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          title="No hay reservas hoy"
                          message="Todavía no se cargaron turnos para la fecha de hoy."
                          actionLabel="Nueva reserva"
                          onAction={() => history.push('/nueva-reserva')}
                        />
                      </td>
                    </tr>
                  )}
                  {proximasReservas.map((r) => (
                    <tr key={r.idReserva}>
                      <td>{r.horaInicio} - {r.horaFin}</td>
                      <td>{r.clienteNombre}</td>
                      <td>{r.canchaNombre}</td>
                      <td><StatusBadge label={r.estadoReserva} /></td>
                      <td><StatusBadge label={r.estadoPago} /></td>
                      <td>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => history.push('/reservas')}>
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="sc-card h-100">
            <div className="sc-card-header">
              <h2>Canchas</h2>
            </div>
            <div className="sc-card-body">
              {canchas.map((c) => {
                const ocupada = canchasOcupadasAhora.has(c.idCancha);
                const estado = !c.activa ? 'Mantenimiento' : ocupada ? 'Ocupada' : 'Disponible';
                const dot = !c.activa ? 'mantenimiento' : ocupada ? 'ocupada' : 'disponible';
                return (
                  <div className="court-tile mb-2" key={c.idCancha}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className={`court-tile-status status-dot-${dot}`} />
                        <span className="fw-600">{c.nombre}</span>
                      </div>
                      <StatusBadge label={estado} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecepcionistaHome;
