import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { reservasApi, Reserva } from '../api/reservas';
import { cancelacionesApi, Cancelacion, devolucionesApi, Devolucion } from '../api/pagos';
import { pagosApi } from '../api/pagos';
import { ApiError } from '../api/client';
import { fechaLocalIso } from '../../data/mock';

// Fecha AAAA-MM-DD de la cancelación en hora local (la API la envía con hora).
function fechaLocal(valor: string): string {
  return fechaLocalIso(new Date(valor));
}

interface Fila {
  cancelacion: Cancelacion;
  reserva?: Reserva;
  totalPagado: number;
  devolucion?: Devolucion;
}

// Las cancelaciones se muestran como registros propios (no se elimina la reserva original),
// preservando la trazabilidad tal como exige el proceso real del complejo.
const Cancelaciones: React.FC = () => {
  const history = useHistory();
  const [filas, setFilas] = useState<Fila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cancelaciones, devoluciones, reservasCanceladas, pagos] = await Promise.all([
        cancelacionesApi.getAll(),
        devolucionesApi.getAll(),
        reservasApi.getAll({ estado: 'Cancelada' }),
        pagosApi.getAll(),
      ]);
      const filasConPagos = cancelaciones.map((c) => ({
        cancelacion: c,
        reserva: reservasCanceladas.find((r) => r.idReserva === c.idReserva),
        totalPagado: pagos.filter((p) => p.idReserva === c.idReserva).reduce((sum, p) => sum + p.monto, 0),
        devolucion: devoluciones.find((d) => d.idCancelacion === c.idCancelacion),
      }));
      setFilas(filasConPagos.sort((a, b) => b.cancelacion.fechaCancelacion.localeCompare(a.cancelacion.fechaCancelacion)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar cancelaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // Filtros del historial: por fecha de cancelación y por cliente.
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const filtradas = filas.filter((f) => {
    const fecha = fechaLocal(f.cancelacion.fechaCancelacion);
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;
    const q = busqueda.trim().toLowerCase();
    if (q && !(f.reserva?.clienteNombre ?? '').toLowerCase().includes(q)) return false;
    return true;
  });

  const [devolviendo, setDevolviendo] = useState<Fila | null>(null);
  const [metodoDevolucion, setMetodoDevolucion] = useState('Efectivo');
  const [montoDevolucion, setMontoDevolucion] = useState('');
  const [obsDevolucion, setObsDevolucion] = useState('');

  const abrirDevolucion = (fila: Fila) => {
    setMetodoDevolucion('Efectivo');
    // Por defecto se propone devolver todo lo abonado; se puede bajar (devolución parcial).
    setMontoDevolucion(String(fila.totalPagado));
    setObsDevolucion('');
    setDevolviendo(fila);
  };

  const confirmarDevolucion = async () => {
    if (!devolviendo || !metodoDevolucion) return;
    const monto = Number(montoDevolucion);
    if (!monto || monto <= 0) {
      setError('Ingresá un monto a devolver mayor a cero.');
      return;
    }
    if (monto > devolviendo.totalPagado) {
      setError(`El monto no puede superar lo abonado ($${devolviendo.totalPagado.toLocaleString('es-AR')}).`);
      return;
    }
    setError(null);
    try {
      await devolucionesApi.create({
        idCancelacion: devolviendo.cancelacion.idCancelacion,
        montoDevuelto: monto,
        metodo: metodoDevolucion,
        observaciones: obsDevolucion.trim() || null,
      });
      setDevolviendo(null);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al registrar la devolución.');
    }
  };

  return (
    <div>
      <PageHeader title="Cancelaciones y Devoluciones" subtitle="Reservas canceladas y su devolución asociada" />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="sc-card mb-3">
        <div className="sc-card-body">
          <div className="row g-2 align-items-end">
            <div className="col-6 col-md-3">
              <label htmlFor="canc-desde" className="form-label small text-muted-sc mb-1">Cancelada desde</label>
              <input id="canc-desde" type="date" className="form-control form-control-sm" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="col-6 col-md-3">
              <label htmlFor="canc-hasta" className="form-label small text-muted-sc mb-1">Hasta</label>
              <input id="canc-hasta" type="date" className="form-control form-control-sm" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div className="col-12 col-md-4">
              <label htmlFor="canc-cliente" className="form-label small text-muted-sc mb-1">Buscar cliente</label>
              <input id="canc-cliente" type="text" className="form-control form-control-sm" placeholder="Nombre del cliente" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="sc-card">
        {loading ? (
          <div className="text-muted-sc p-3">Cargando…</div>
        ) : (
          <div className="table-responsive-sc">
            <table className="table-sc mb-0">
              <thead>
                <tr>
                  <th>Reserva</th>
                  <th>Cliente</th>
                  <th>Cancha</th>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th>Pago asociado</th>
                  <th>Devolución</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filas.length > 0 && filtradas.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState title="Sin resultados" message="Ninguna cancelación coincide con los filtros." />
                    </td>
                  </tr>
                )}
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        title="No hay cancelaciones"
                        message="Todavía no se registraron cancelaciones de turnos."
                        actionLabel="Ir a Reservas"
                        onAction={() => history.push('/reservas')}
                      />
                    </td>
                  </tr>
                )}
                {filtradas.map((f) => (
                  <tr key={f.cancelacion.idCancelacion}>
                    <td>#{f.cancelacion.idReserva}</td>
                    <td>{f.reserva?.clienteNombre ?? '—'}</td>
                    <td>{f.reserva?.canchaNombre ?? '—'}</td>
                    <td>{new Date(f.cancelacion.fechaCancelacion).toLocaleDateString('es-AR')}</td>
                    <td>{f.cancelacion.motivo ?? '—'}</td>
                    <td>{f.totalPagado > 0 ? `$${f.totalPagado.toLocaleString('es-AR')}` : 'Sin pago previo'}</td>
                    <td>
                      <StatusBadge label={f.devolucion ? 'Realizada' : f.totalPagado > 0 ? 'Pendiente' : 'No aplica'} />
                      {f.devolucion && (
                        <div className="text-muted-sc" style={{ fontSize: 12 }}>
                          ${f.devolucion.montoDevuelto.toLocaleString('es-AR')} · {f.devolucion.metodo}
                          {f.devolucion.registradoPor ? ` · ${f.devolucion.registradoPor}` : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      {!f.devolucion && f.totalPagado > 0 ? (
                        <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={() => abrirDevolucion(f)}>
                          Registrar devolución
                        </button>
                      ) : (
                        <span className="text-muted-sc" style={{ fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {devolviendo && (
        <Modal error={error}
          title="Registrar devolución"
          onClose={() => setDevolviendo(null)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDevolviendo(null)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={confirmarDevolucion}>Confirmar devolución</button>
            </>
          }
        >
          <div className="detail-row"><span className="detail-row-label">Cliente</span><span className="detail-row-value">{devolviendo.reserva?.clienteNombre ?? '—'}</span></div>
          <div className="detail-row"><span className="detail-row-label">Total abonado</span><span className="detail-row-value">${devolviendo.totalPagado.toLocaleString('es-AR')}</span></div>
          <div className="mb-2 mt-2">
            <label htmlFor="dev-monto" className="form-label small text-muted-sc mb-1">Monto a devolver</label>
            <input id="dev-monto" type="number" min={1} max={devolviendo.totalPagado} className="form-control form-control-sm" value={montoDevolucion} onChange={(e) => setMontoDevolucion(e.target.value)} />
            <div className="text-muted-sc mt-1" style={{ fontSize: 12 }}>Podés devolver una parte (por ejemplo, si se retiene la seña) o el total.</div>
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Método de devolución</label>
            <select className="form-select form-select-sm" value={metodoDevolucion} onChange={(e) => setMetodoDevolucion(e.target.value)}>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
          <div className="mb-2">
            <label htmlFor="dev-obs" className="form-label small text-muted-sc mb-1">Observaciones (opcional)</label>
            <textarea id="dev-obs" className="form-control form-control-sm" rows={2} placeholder="Ej: se retiene la seña por cancelar con menos de 24 hs" value={obsDevolucion} onChange={(e) => setObsDevolucion(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Cancelaciones;
