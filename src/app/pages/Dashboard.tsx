import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import BarChart from '../components/BarChart';
import EmptyState from '../components/EmptyState';
import RecepcionistaHome from './RecepcionistaHome';
import { isoDate } from '../../data/mock';
import { reservasApi, Reserva } from '../api/reservas';
import { canchasApi, Cancha } from '../api/canchas';
import { clientesApi, Cliente } from '../api/clientes';
import { pagosApi } from '../api/pagos';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { HORA_APERTURA, HORA_CIERRE } from '../components/horarios';

// El empleado ve la vista operativa del día; el administrador, el resumen general.
// (Antes se decidía después de declarar algunos hooks y antes de otros, algo que React no permite.)
const Dashboard: React.FC = () => {
  const { usuario } = useAuth();
  if (usuario && usuario.rol !== 'administrador') return <RecepcionistaHome />;
  return <DashboardAdmin />;
};

const DashboardAdmin: React.FC = () => {
  const history = useHistory();
  const hoy = isoDate(0);

  const [reservasHoy, setReservasHoy] = useState<Reserva[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ingresosHoy, setIngresosHoy] = useState(0);
  const [reservasTotales, setReservasTotales] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([reservasApi.getAll({ fecha: hoy }), canchasApi.getAll(), clientesApi.getAll(), reservasApi.getAll()])
      .then(async ([hoyRes, ca, cl, todas]) => {
        setReservasHoy(hoyRes.filter((r) => r.estadoReserva !== 'Cancelada'));
        setCanchas(ca);
        setClientes(cl);
        setReservasTotales(todas);
        // Todos los pagos cobrados hoy (también señas de reservas de otros días).
        const pagosHoy = await pagosApi.getAll(hoy, hoy);
        setIngresosHoy(pagosHoy.reduce((acc, p) => acc + p.monto, 0));
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar el dashboard.'))
      .finally(() => setLoading(false));
  }, [hoy]);

  const pagosPendientes = reservasHoy.filter((r) => r.estadoPago !== 'Abonado').length;
  const proximasReservas = [...reservasHoy].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)).slice(0, 6);

  // Franjas de 2 horas que cubren todo el horario de atención (08 a 22).
  const demandaHoraria = Array.from({ length: (HORA_CIERRE - HORA_APERTURA) / 2 }, (_, i) => {
    const desde = HORA_APERTURA + i * 2;
    const hasta = desde + 2;
    const cantidad = reservasHoy.filter((r) => {
      const h = Number(r.horaInicio.slice(0, 2));
      return h >= desde && h < hasta;
    }).length;
    return { label: `${String(desde).padStart(2, '0')}-${String(hasta).padStart(2, '0')} hs`, value: cantidad };
  });

  if (loading) return <div className="text-muted-sc p-3">Cargando dashboard…</div>;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen general del complejo deportivo" />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard label="Reservas de hoy" value={reservasHoy.length} hint={`${canchas.filter((c) => c.activa).length} canchas activas`} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Canchas activas" value={`${canchas.filter((c) => c.activa).length}/${canchas.length}`} hint="Habilitadas para reservar" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Pagos pendientes hoy" value={pagosPendientes} hint="Pendientes o parciales" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label="Ingresos del día" value={`$${ingresosHoy.toLocaleString('es-AR')}`} hint="Pagos confirmados" />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <div className="sc-card h-100">
            <div className="sc-card-header">
              <h2>Próximas reservas</h2>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={() => history.push('/reservas')}>
                Ver todas
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
              <h2>Canchas del complejo</h2>
            </div>
            <div className="sc-card-body">
              {canchas.map((c) => (
                <div className="court-tile mb-2" key={c.idCancha}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className={`court-tile-status status-dot-${c.activa ? 'disponible' : 'mantenimiento'}`} />
                      <span className="fw-600">{c.nombre}</span>
                    </div>
                    <StatusBadge label={c.activa ? 'Disponible' : 'Mantenimiento'} />
                  </div>
                  <div className="text-muted-sc mt-1" style={{ fontSize: 12 }}>{c.tipoSuperficie}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="sc-card">
            <div className="sc-card-header">
              <h2>Horarios de mayor demanda (hoy)</h2>
            </div>
            <div className="sc-card-body">
              <BarChart data={demandaHoraria} formatValue={(v) => `${v} res.`} />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="sc-card">
            <div className="sc-card-header">
              <h2>Indicadores rápidos</h2>
            </div>
            <div className="sc-card-body">
              <div className="detail-row">
                <span className="detail-row-label">Clientes registrados</span>
                <span className="detail-row-value">{clientes.length}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">Reservas confirmadas (total)</span>
                <span className="detail-row-value">{reservasTotales.filter((r) => r.estadoReserva === 'Confirmada').length}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">Reservas canceladas (total)</span>
                <span className="detail-row-value">{reservasTotales.filter((r) => r.estadoReserva === 'Cancelada').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
