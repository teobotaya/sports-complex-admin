import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { clientesApi, Cliente } from '../api/clientes';
import { reservasApi, Reserva } from '../api/reservas';
import { cancelacionesApi, Cancelacion, pagosApi } from '../api/pagos';
import { canchasApi } from '../api/canchas';
import { ApiError } from '../api/client';
import { HistorialItem } from '../api/auditoria';
import HistorialCambios from '../components/HistorialCambios';

const pct = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100));

interface SaldoReserva {
  reserva: Reserva;
  saldoPendiente: number;
}

const ClienteDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<Reserva[]>([]);
  const [cancelacionesCliente, setCancelacionesCliente] = useState<Cancelacion[]>([]);
  const [saldosPendientes, setSaldosPendientes] = useState<SaldoReserva[]>([]);
  const [cambios, setCambios] = useState<HistorialItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const idCliente = Number(id);
    setLoading(true);
    Promise.all([
      clientesApi.getById(idCliente),
      reservasApi.getAll({ idCliente }),
      cancelacionesApi.getAll(),
      canchasApi.getAll(),
      pagosApi.getAll(),
    ])
      .then(([c, reservas, cancelaciones, canchas, pagos]) => {
        setCliente(c);
        setHistorial(reservas.sort((a, b) => b.fecha.localeCompare(a.fecha)));
        setCancelacionesCliente(cancelaciones.filter((cc) => reservas.some((r) => r.idReserva === cc.idReserva)));

        const conDeuda = reservas.filter((r) => r.estadoReserva !== 'Cancelada' && r.estadoPago !== 'Abonado');
        const saldos = conDeuda.map((r) => {
          const cancha = canchas.find((ca) => ca.idCancha === r.idCancha);
          const horas = (new Date(`2000-01-01T${r.horaFin}`).getTime() - new Date(`2000-01-01T${r.horaInicio}`).getTime()) / 3600000;
          const totalEsperado = (cancha?.precioPorHora ?? 0) * horas;
          const totalPagado = pagos.filter((p) => p.idReserva === r.idReserva).reduce((sum, p) => sum + p.monto, 0);
          return { reserva: r, saldoPendiente: totalEsperado - totalPagado };
        });
        setSaldosPendientes(saldos.filter((s) => s.saldoPendiente > 0));
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar el cliente.'))
      .finally(() => setLoading(false));
    clientesApi.getHistorial(idCliente).then(setCambios).catch(() => setCambios([]));
  }, [id]);

  if (loading) return <div className="text-muted-sc p-3">Cargando…</div>;

  if (error || !cliente) {
    return (
      <div>
        <PageHeader title="Cliente no encontrado" />
        {error && <div className="availability-msg availability-fail mb-3">{error}</div>}
        <button type="button" className="btn btn-outline-secondary" onClick={() => history.goBack()}>Volver a Clientes</button>
      </div>
    );
  }

  /* Comportamiento de asistencia: cumplidas (se presentó), ausencias (no se presentó),
     cancelaciones y turnos todavía por jugar. La asistencia la marca el empleado en cada reserva. */
  const hoy = new Date().toLocaleDateString('sv-SE');
  const total = historial.length;
  const canceladas = historial.filter((r) => r.estadoReserva === 'Cancelada').length;
  const vigentes = historial.filter((r) => r.estadoReserva !== 'Cancelada');
  const concretadas = vigentes.filter((r) => r.asistencia === 'Presente').length;
  const ausencias = vigentes.filter((r) => r.asistencia === 'Ausente').length;
  const agendadas = vigentes.filter((r) => r.fecha > hoy && !r.asistencia).length;
  const sinRegistrar = vigentes.filter((r) => r.fecha <= hoy && !r.asistencia).length;
  const activas = total - canceladas;
  const abonadas = historial.filter((r) => r.estadoReserva !== 'Cancelada' && r.estadoPago === 'Abonado').length;
  const parciales = historial.filter((r) => r.estadoReserva !== 'Cancelada' && r.estadoPago === 'Parcialmente abonado').length;
  const impagas = historial.filter((r) => r.estadoReserva !== 'Cancelada' && r.estadoPago === 'Pendiente').length;
  const inicial = cliente.nombreCompleto.trim().charAt(0).toUpperCase();

  return (
    <div>
      <PageHeader
        title={cliente.nombreCompleto}
        subtitle="Detalle del cliente"
        action={
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => history.goBack()}>Volver</button>
            <button type="button" className="btn btn-sc-primary text-white" onClick={() => history.push(`/nueva-reserva?clienteId=${cliente.idCliente}`)}>Nueva reserva</button>
          </div>
        }
      />

      <div className="client-hero mb-3">
        <span className="client-hero-avatar">{inicial}</span>
        <div className="client-hero-info">
          <h2 className="client-hero-name">{cliente.nombreCompleto}</h2>
          <div className="client-hero-meta">
            <span>Tel. {cliente.telefono}</span>
            <span>Alta: {cliente.fechaAlta}</span>
            <span>{total} reserva{total === 1 ? '' : 's'} registrada{total === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <StatusBadge label={(canceladas + ausencias) > 0 && pct(canceladas + ausencias, total) >= 40 ? 'Pendiente' : 'Activo'} />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-7">
          <div className="sc-card h-100">
            <div className="sc-card-header"><h2>Comportamiento de reservas</h2><span className="text-muted-sc small">Sobre {total} reserva{total === 1 ? '' : 's'}</span></div>
            <div className="sc-card-body">
              <div className="metric-grid mb-3">
                <div className="metric-item"><div className="metric-value metric-green">{pct(concretadas, total)}%</div><div className="metric-label">Cumplidas</div></div>
                <div className="metric-item"><div className="metric-value metric-orange">{pct(ausencias, total)}%</div><div className="metric-label">Ausencias</div></div>
                <div className="metric-item"><div className="metric-value metric-red">{pct(canceladas, total)}%</div><div className="metric-label">Canceladas</div></div>
                <div className="metric-item"><div className="metric-value metric-blue">{pct(agendadas, total)}%</div><div className="metric-label">Por jugar</div></div>
              </div>
              <div className="stacked-bar">
                <div className="stacked-seg stacked-seg-green" style={{ width: `${pct(concretadas, total)}%` }} />
                <div className="stacked-seg stacked-seg-orange" style={{ width: `${pct(ausencias, total)}%` }} />
                <div className="stacked-seg stacked-seg-red" style={{ width: `${pct(canceladas, total)}%` }} />
                <div className="stacked-seg stacked-seg-blue" style={{ width: `${pct(agendadas, total)}%` }} />
              </div>
              <div className="stack-legend">
                <span className="stack-legend-item"><i className="stack-dot stack-dot-green" />Cumplidas <b>{concretadas}</b></span>
                <span className="stack-legend-item"><i className="stack-dot stack-dot-orange" />Ausencias <b>{ausencias}</b></span>
                <span className="stack-legend-item"><i className="stack-dot stack-dot-red" />Canceladas <b>{canceladas}</b></span>
                <span className="stack-legend-item"><i className="stack-dot stack-dot-blue" />Por jugar <b>{agendadas}</b></span>
              </div>
              <p className="metric-note">
                La asistencia se marca en el detalle de cada reserva (Se presentó / No se presentó).
                {sinRegistrar > 0 && ` Hay ${sinRegistrar} turno${sinRegistrar === 1 ? '' : 's'} ya jugado${sinRegistrar === 1 ? '' : 's'} sin asistencia registrada.`}
              </p>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="sc-card h-100">
            <div className="sc-card-header"><h2>Cumplimiento de pagos</h2><span className="text-muted-sc small">Sobre {activas} reserva{activas === 1 ? '' : 's'} vigente{activas === 1 ? '' : 's'}</span></div>
            <div className="sc-card-body">
              <div className="metric-grid mb-3">
                <div className="metric-item"><div className="metric-value metric-green">{pct(abonadas, activas)}%</div><div className="metric-label">Abonadas</div></div>
                <div className="metric-item"><div className="metric-value metric-orange">{pct(parciales, activas)}%</div><div className="metric-label">Parciales</div></div>
                <div className="metric-item"><div className="metric-value metric-red">{pct(impagas, activas)}%</div><div className="metric-label">Impagas</div></div>
              </div>
              <div className="stacked-bar">
                <div className="stacked-seg stacked-seg-green" style={{ width: `${pct(abonadas, activas)}%` }} />
                <div className="stacked-seg stacked-seg-orange" style={{ width: `${pct(parciales, activas)}%` }} />
                <div className="stacked-seg stacked-seg-red" style={{ width: `${pct(impagas, activas)}%` }} />
              </div>
              <div className="detail-row mt-3"><span className="detail-row-label">Cancelaciones registradas</span><span className="detail-row-value">{cancelacionesCliente.length}</span></div>
              <div className="detail-row"><span className="detail-row-label">Última reserva</span><span className="detail-row-value">{historial[0]?.fecha ?? '—'}</span></div>
              <div className="detail-row"><span className="detail-row-label">Saldo pendiente total</span><span className="detail-row-value fw-600" style={{ color: saldosPendientes.length > 0 ? 'var(--sc-danger-text)' : undefined }}>${saldosPendientes.reduce((s, x) => s + x.saldoPendiente, 0).toLocaleString('es-AR')}</span></div>
              {saldosPendientes.length > 0 && (
                <div className="table-responsive-sc mt-2">
                  <table className="table-sc mb-0">
                    <thead><tr><th>Reserva</th><th>Fecha</th><th>Estado</th><th>Adeudado</th></tr></thead>
                    <tbody>
                      {saldosPendientes.map((s) => (
                        <tr key={s.reserva.idReserva}>
                          <td>#{s.reserva.idReserva}</td>
                          <td>{s.reserva.fecha}</td>
                          <td><StatusBadge label={s.reserva.estadoPago} /></td>
                          <td>${s.saldoPendiente.toLocaleString('es-AR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-12">
          <div className="sc-card">
            <div className="sc-card-header"><h2>Historial de reservas</h2></div>
            <div className="table-responsive-sc">
              <table className="table-sc mb-0">
                <thead>
                  <tr><th>Fecha</th><th>Cancha</th><th>Horario</th><th>Estado</th><th>Pago</th><th>Asistencia</th></tr>
                </thead>
                <tbody>
                  {historial.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          title="No hay reservas"
                          message="Este cliente todavía no tiene turnos cargados."
                          actionLabel="Nueva reserva"
                          onAction={() => history.push(`/nueva-reserva?clienteId=${cliente.idCliente}`)}
                        />
                      </td>
                    </tr>
                  )}
                  {historial.map((r) => (
                    <tr key={r.idReserva}>
                      <td className="fw-600">{r.fecha}</td>
                      <td>{r.canchaNombre}</td>
                      <td>{r.horaInicio} - {r.horaFin}</td>
                      <td><StatusBadge label={r.estadoReserva} /></td>
                      <td><StatusBadge label={r.estadoPago} /></td>
                      <td>{r.asistencia ? <StatusBadge label={r.asistencia === 'Presente' ? 'Se presentó' : 'No se presentó'} /> : <span className="text-muted-sc">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-12">
          <div className="sc-card">
            <div className="sc-card-header"><h2>Cancelaciones</h2></div>
            <div className="table-responsive-sc">
              <table className="table-sc mb-0">
                <thead><tr><th>Fecha</th><th>Motivo</th></tr></thead>
                <tbody>
                  {cancelacionesCliente.length === 0 && (
                    <tr>
                      <td colSpan={2}>
                        <EmptyState title="Sin cancelaciones" message="No se registraron cancelaciones para este cliente." />
                      </td>
                    </tr>
                  )}
                  {cancelacionesCliente.map((c) => (
                    <tr key={c.idCancelacion}>
                      <td className="fw-600">{new Date(c.fechaCancelacion).toLocaleDateString('es-AR')}</td>
                      <td>{c.motivo ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-0">
        <div className="col-lg-12">
          <div className="sc-card">
            <div className="sc-card-header"><h2>Historial de cambios de los datos</h2><span className="text-muted-sc small">Quién y cuándo modificó este cliente</span></div>
            <div className="sc-card-body">
              <HistorialCambios items={cambios} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteDetalle;
