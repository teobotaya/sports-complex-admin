import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { reservasApi, Reserva } from '../api/reservas';
import { pagosApi, Pago } from '../api/pagos';
import { canchasApi, Cancha } from '../api/canchas';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface PagoConReserva extends Pago {
  reserva?: Reserva;
}

function horasReserva(r: Reserva): number {
  return (new Date(`2000-01-01T${r.horaFin}`).getTime() - new Date(`2000-01-01T${r.horaInicio}`).getTime()) / 3600000;
}

const Pagos: React.FC = () => {
  const { usuario } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [pagos, setPagos] = useState<PagoConReserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<PagoConReserva | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [nuevo, setNuevo] = useState({ idReserva: '', monto: '', metodoPago: 'Efectivo' });
  const [vista, setVista] = useState<'historial' | 'pendientes'>('historial');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [canchaFiltro, setCanchaFiltro] = useState('todas');

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [todasReservas, todasCanchas, todosPagos] = await Promise.all([reservasApi.getAll(), canchasApi.getAll(), pagosApi.getAll()]);
      const porId = new Map(todasReservas.map((r) => [r.idReserva, r]));
      setReservas(todasReservas);
      setCanchas(todasCanchas);
      setPagos(todosPagos.map((p) => ({ ...p, reserva: porId.get(p.idReserva) })) as PagoConReserva[]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar pagos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const pendientes = useMemo(() => {
    return reservas
      .filter((r) => r.estadoReserva !== 'Cancelada' && r.estadoPago !== 'Abonado')
      .filter((r) => !fechaFiltro || r.fecha === fechaFiltro)
      .filter((r) => canchaFiltro === 'todas' || r.idCancha === Number(canchaFiltro))
      .map((r) => {
        const cancha = canchas.find((c) => c.idCancha === r.idCancha);
        const totalEsperado = (cancha?.precioPorHora ?? 0) * horasReserva(r);
        const totalPagado = pagos.filter((p) => p.idReserva === r.idReserva).reduce((s, p) => s + p.monto, 0);
        return { reserva: r, saldoPendiente: totalEsperado - totalPagado };
      })
      .sort((a, b) => b.saldoPendiente - a.saldoPendiente);
  }, [reservas, canchas, pagos, fechaFiltro, canchaFiltro]);

  const registrarPago = async () => {
    if (!nuevo.idReserva || !nuevo.monto || Number(nuevo.monto) <= 0) {
      setError('Seleccioná una reserva e ingresá un monto mayor a cero.');
      return;
    }
    setError(null);
    try {
      await pagosApi.create({
        idReserva: Number(nuevo.idReserva),
        monto: Number(nuevo.monto),
        metodoPago: nuevo.metodoPago,
        observaciones: null,
      });
      setRegistrando(false);
      setNuevo({ idReserva: '', monto: '', metodoPago: 'Efectivo' });
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al registrar el pago.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Pagos"
        subtitle="Registro y consulta de pagos realizados"
        action={
          <button type="button" className="btn btn-sc-primary text-white" onClick={() => setRegistrando(true)}>
            Registrar pago
          </button>
        }
      />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      {usuario?.rol === 'administrador' && (
        <div className="btn-group btn-group-sm mb-3" role="group">
          <button type="button" className={`btn btn-outline-secondary ${vista === 'historial' ? 'active' : ''}`} onClick={() => setVista('historial')}>Historial</button>
          <button type="button" className={`btn btn-outline-secondary ${vista === 'pendientes' ? 'active' : ''}`} onClick={() => setVista('pendientes')}>Pagos pendientes</button>
        </div>
      )}

      {vista === 'pendientes' && usuario?.rol === 'administrador' ? (
        <div className="sc-card">
          <div className="sc-card-body">
            <div className="row g-2 mb-3">
              <div className="col-6 col-md-3">
                <label className="form-label small text-muted-sc mb-1">Fecha</label>
                <input type="date" className="form-control form-control-sm" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label small text-muted-sc mb-1">Cancha</label>
                <select className="form-select form-select-sm" value={canchaFiltro} onChange={(e) => setCanchaFiltro(e.target.value)}>
                  <option value="todas">Todas</option>
                  {canchas.map((c) => <option key={c.idCancha} value={c.idCancha}>{c.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="table-responsive-sc">
              <table className="table-sc mb-0">
                <thead>
                  <tr><th>Cliente</th><th>Reserva</th><th>Cancha</th><th>Fecha</th><th>Estado pago</th><th>Saldo pendiente</th></tr>
                </thead>
                <tbody>
                  {pendientes.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        {(fechaFiltro || canchaFiltro !== 'todas') ? (
                          <EmptyState
                            title="Sin resultados"
                            message="No hay pagos pendientes con los filtros aplicados."
                            actionLabel="Limpiar filtros"
                            onAction={() => { setFechaFiltro(''); setCanchaFiltro('todas'); }}
                          />
                        ) : (
                          <EmptyState title="Sin pagos pendientes" message="No hay reservas con saldo pendiente." />
                        )}
                      </td>
                    </tr>
                  )}
                  {pendientes.map((p) => (
                    <tr key={p.reserva.idReserva}>
                      <td>{p.reserva.clienteNombre}</td>
                      <td>#{p.reserva.idReserva}</td>
                      <td>{p.reserva.canchaNombre}</td>
                      <td>{p.reserva.fecha}</td>
                      <td><StatusBadge label={p.reserva.estadoPago} /></td>
                      <td className="fw-600">${p.saldoPendiente.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
      <div className="sc-card">
        {loading ? (
          <div className="text-muted-sc p-3">Cargando pagos…</div>
        ) : (
          <div className="table-responsive-sc">
            <table className="table-sc mb-0">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Reserva</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Fecha</th>
                  <th>Estado reserva</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title="No hay pagos"
                        message="Todavía no se registraron pagos."
                        actionLabel="Registrar pago"
                        onAction={() => setRegistrando(true)}
                      />
                    </td>
                  </tr>
                )}
                {pagos.map((p) => (
                  <tr key={p.idPago}>
                    <td>{p.reserva?.clienteNombre ?? '—'}</td>
                    <td>Reserva #{p.idReserva}</td>
                    <td>${p.monto.toLocaleString('es-AR')}</td>
                    <td>{p.metodoPago}</td>
                    <td>{p.fechaPago}</td>
                    <td>{p.reserva && <StatusBadge label={p.reserva.estadoPago} />}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDetalle(p)}>Consultar detalle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {detalle && (
        <Modal title={`Pago #${detalle.idPago}`} onClose={() => setDetalle(null)}>
          <div className="detail-row"><span className="detail-row-label">Cliente</span><span className="detail-row-value">{detalle.reserva?.clienteNombre ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-row-label">Reserva</span><span className="detail-row-value">#{detalle.idReserva}</span></div>
          <div className="detail-row"><span className="detail-row-label">Monto</span><span className="detail-row-value">${detalle.monto.toLocaleString('es-AR')}</span></div>
          <div className="detail-row"><span className="detail-row-label">Método</span><span className="detail-row-value">{detalle.metodoPago}</span></div>
          <div className="detail-row"><span className="detail-row-label">Fecha</span><span className="detail-row-value">{detalle.fechaPago}</span></div>
          {detalle.reserva && <div className="detail-row"><span className="detail-row-label">Estado reserva</span><span className="detail-row-value"><StatusBadge label={detalle.reserva.estadoPago} /></span></div>}
        </Modal>
      )}

      {registrando && (
        <Modal
          title="Registrar pago"
          onClose={() => setRegistrando(false)}
          confirmClose={!!(nuevo.idReserva || nuevo.monto)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setRegistrando(false)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={registrarPago}>Registrar</button>
            </>
          }
        >
          <div className="mb-2">
            <label htmlFor="pago-reserva" className="form-label small text-muted-sc mb-1">Reserva</label>
            <select id="pago-reserva" className={`form-select form-select-sm ${error && !nuevo.idReserva ? 'is-invalid' : ''}`} value={nuevo.idReserva} onChange={(e) => setNuevo({ ...nuevo, idReserva: e.target.value })}>
              <option value="">Seleccionar…</option>
              {reservas.filter((r) => r.estadoReserva !== 'Cancelada' && r.estadoPago !== 'Abonado').map((r) => (
                <option key={r.idReserva} value={r.idReserva}>Reserva #{r.idReserva} — {r.clienteNombre} — {r.fecha} {r.horaInicio}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label htmlFor="pago-monto" className="form-label small text-muted-sc mb-1">Monto</label>
            <input id="pago-monto" type="number" className={`form-control form-control-sm ${error && Number(nuevo.monto) <= 0 ? 'is-invalid' : ''}`} value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} />
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Método de pago</label>
            <select className="form-select form-select-sm" value={nuevo.metodoPago} onChange={(e) => setNuevo({ ...nuevo, metodoPago: e.target.value })}>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Pagos;
