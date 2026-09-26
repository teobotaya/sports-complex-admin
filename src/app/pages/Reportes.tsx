import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import BarChart from '../components/BarChart';
import EmptyState from '../components/EmptyState';
import { isoDate } from '../../data/mock';
import { reportesApi, ReporteOcupacion, ReporteIngresos, ReporteDeudor } from '../api/notificaciones';
import { canchasApi, Cancha } from '../api/canchas';
import { ApiError } from '../api/client';
import OcupacionTabla from '../components/OcupacionTabla';

const Reportes: React.FC = () => {
  const [desde, setDesde] = useState(isoDate(-30));
  const [hasta, setHasta] = useState(isoDate(0));
  const [canchaFiltro, setCanchaFiltro] = useState('todas');
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [ocupacion, setOcupacion] = useState<ReporteOcupacion[]>([]);
  const [ingresos, setIngresos] = useState<ReporteIngresos[]>([]);
  const [deudores, setDeudores] = useState<ReporteDeudor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { canchasApi.getAll().then(setCanchas); }, []);

  const cargar = () => {
    setLoading(true);
    setError(null);
    const idCancha = canchaFiltro === 'todas' ? undefined : Number(canchaFiltro);
    Promise.all([
      reportesApi.getOcupacion(desde, hasta, idCancha),
      reportesApi.getIngresos(desde, hasta, idCancha),
      reportesApi.getDeudores(idCancha, desde, hasta),
    ])
      .then(([o, i, d]) => { setOcupacion(o); setIngresos(i); setDeudores(d); })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar reportes.'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, [desde, hasta, canchaFiltro]);

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Ocupación, ingresos y deudores del complejo" />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="sc-card mb-3">
        <div className="sc-card-body">
          <div className="row g-2">
            <div className="col-6 col-md-3">
              <label className="form-label small text-muted-sc mb-1">Desde</label>
              <input type="date" className="form-control form-control-sm" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small text-muted-sc mb-1">Hasta</label>
              <input type="date" className="form-control form-control-sm" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small text-muted-sc mb-1">Cancha</label>
              <select className="form-select form-select-sm" value={canchaFiltro} onChange={(e) => setCanchaFiltro(e.target.value)}>
                <option value="todas">Todas</option>
                {canchas.map((c) => <option key={c.idCancha} value={c.idCancha}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-sc p-3">Cargando reportes…</div>
      ) : (
        <>
          <div className="row g-3 mb-3">
            <div className="col-lg-6">
              <div className="sc-card h-100">
                <div className="sc-card-header"><h2>Ocupación por cancha</h2></div>
                <div className="sc-card-body">
                  <OcupacionTabla data={ocupacion} />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="sc-card h-100">
                <div className="sc-card-header"><h2>Ingresos por método de pago</h2></div>
                <div className="sc-card-body">
                  <BarChart data={ingresos.map((i) => ({ label: i.metodoPago, value: i.total }))} formatValue={(v) => `$${v.toLocaleString('es-AR')}`} />
                  {ingresos.length > 0 && (
                    <table className="table-sc mb-0 mt-3">
                      <thead><tr><th>Método</th><th>Cobrado</th><th>Devuelto</th><th>Neto</th></tr></thead>
                      <tbody>
                        {ingresos.map((i) => (
                          <tr key={i.metodoPago}>
                            <td>{i.metodoPago}</td>
                            <td>${i.cobrado.toLocaleString('es-AR')}</td>
                            <td>{i.devuelto > 0 ? `−$${i.devuelto.toLocaleString('es-AR')}` : '—'}</td>
                            <td className="fw-600">${i.total.toLocaleString('es-AR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="sc-card">
            <div className="sc-card-header"><h2>Clientes con saldo pendiente</h2><span className="text-muted-sc small">Turnos del período y cancha seleccionados</span></div>
            <div className="table-responsive-sc">
              <table className="table-sc mb-0">
                <thead><tr><th>Cliente</th><th>Reserva</th><th>Fecha</th><th>Saldo pendiente</th></tr></thead>
                <tbody>
                  {deudores.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState title="Sin deudas" message="No hay clientes con saldo pendiente en el período seleccionado." />
                      </td>
                    </tr>
                  )}
                  {deudores.map((d) => (
                    <tr key={d.idReserva}>
                      <td>{d.cliente}</td>
                      <td>#{d.idReserva}</td>
                      <td>{d.fecha}</td>
                      <td className="fw-600">${d.saldoPendiente.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reportes;
