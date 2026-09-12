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
      const [cancelaciones, devoluciones, reservasCanceladas] = await Promise.all([
        cancelacionesApi.getAll(),
        devolucionesApi.getAll(),
        reservasApi.getAll({ estado: 'Cancelada' }),
      ]);
      const filasConPagos = await Promise.all(
        cancelaciones.map(async (c) => {
          const reserva = reservasCanceladas.find((r) => r.idReserva === c.idReserva);
          const pagos = await pagosApi.getByReserva(c.idReserva);
          return {
            cancelacion: c,
            reserva,
            totalPagado: pagos.reduce((sum, p) => sum + p.monto, 0),
            devolucion: devoluciones.find((d) => d.idCancelacion === c.idCancelacion),
          };
        })
      );
      setFilas(filasConPagos.sort((a, b) => b.cancelacion.fechaCancelacion.localeCompare(a.cancelacion.fechaCancelacion)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar cancelaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const [devolviendo, setDevolviendo] = useState<Fila | null>(null);
  const [metodoDevolucion, setMetodoDevolucion] = useState('Efectivo');

  const abrirDevolucion = (fila: Fila) => {
    setMetodoDevolucion('Efectivo');
    setDevolviendo(fila);
  };

  const confirmarDevolucion = async () => {
    if (!devolviendo || !metodoDevolucion) return;
    setError(null);
    try {
      await devolucionesApi.create({
        idCancelacion: devolviendo.cancelacion.idCancelacion,
        montoDevuelto: devolviendo.totalPagado,
        metodo: metodoDevolucion,
        observaciones: null,
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
                {filas.map((f) => (
                  <tr key={f.cancelacion.idCancelacion}>
                    <td>#{f.cancelacion.idReserva}</td>
                    <td>{f.reserva?.clienteNombre ?? '—'}</td>
                    <td>{f.reserva?.canchaNombre ?? '—'}</td>
                    <td>{new Date(f.cancelacion.fechaCancelacion).toLocaleDateString('es-AR')}</td>
                    <td>{f.cancelacion.motivo ?? '—'}</td>
                    <td>{f.totalPagado > 0 ? `$${f.totalPagado.toLocaleString('es-AR')}` : 'Sin pago previo'}</td>
                    <td><StatusBadge label={f.devolucion ? 'Realizada' : f.totalPagado > 0 ? 'Pendiente' : 'No aplica'} /></td>
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
        <Modal
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
          <div className="detail-row"><span className="detail-row-label">Monto a devolver</span><span className="detail-row-value">${devolviendo.totalPagado.toLocaleString('es-AR')}</span></div>
          <div className="mb-2 mt-2">
            <label className="form-label small text-muted-sc mb-1">Método de devolución</label>
            <select className="form-select form-select-sm" value={metodoDevolucion} onChange={(e) => setMetodoDevolucion(e.target.value)}>
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

export default Cancelaciones;
