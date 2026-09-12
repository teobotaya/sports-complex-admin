import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';
import { isoDate } from '../../data/mock';
import { estadisticasApi, EstadisticasResumen } from '../api/notificaciones';
import { ApiError } from '../api/client';

const Estadisticas: React.FC = () => {
  const [desde, setDesde] = useState(isoDate(-30));
  const [hasta, setHasta] = useState(isoDate(0));
  const [resumen, setResumen] = useState<EstadisticasResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    estadisticasApi.getResumen(desde, hasta)
      .then(setResumen)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar estadísticas.'))
      .finally(() => setLoading(false));
  }, [desde, hasta]);

  return (
    <div>
      <PageHeader title="Estadísticas" subtitle="Indicadores para la toma de decisiones del complejo" />

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
          </div>
        </div>
      </div>

      {loading || !resumen ? (
        <div className="text-muted-sc p-3">Cargando estadísticas…</div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <StatCard label="Tasa de cancelaciones" value={`${resumen.tasaCancelaciones}%`} hint="Sobre el período seleccionado" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label="Horario pico" value={resumen.horariosPico[0] ? `${resumen.horariosPico[0].hora}:00 hs` : '—'} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label="Cliente más frecuente" value={resumen.clientesFrecuentes[0]?.cliente ?? '—'} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label="Ingresos del período" value={`$${resumen.ingresos.reduce((s, i) => s + i.total, 0).toLocaleString('es-AR')}`} />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-lg-6">
              <div className="sc-card h-100">
                <div className="sc-card-header"><h2>Ocupación de canchas</h2></div>
                <div className="sc-card-body">
                  <BarChart data={resumen.ocupacion.map((o) => ({ label: o.cancha, value: o.horasUtilizadas }))} formatValue={(v) => `${v} hs`} />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="sc-card h-100">
                <div className="sc-card-header"><h2>Ingresos por método de pago</h2></div>
                <div className="sc-card-body">
                  <BarChart data={resumen.ingresos.map((i) => ({ label: i.metodoPago, value: i.total }))} formatValue={(v) => `$${v.toLocaleString('es-AR')}`} />
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-lg-6">
              <div className="sc-card h-100">
                <div className="sc-card-header"><h2>Horarios de mayor demanda</h2></div>
                <div className="sc-card-body">
                  <BarChart data={resumen.horariosPico.map((h) => ({ label: `${h.hora}:00 hs`, value: h.cantidadReservas }))} formatValue={(v) => `${v} res.`} />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="sc-card h-100">
                <div className="sc-card-header"><h2>Clientes frecuentes</h2></div>
                <div className="sc-card-body">
                  <BarChart data={resumen.clientesFrecuentes.map((c) => ({ label: c.cliente, value: c.cantidadReservas }))} formatValue={(v) => `${v} res.`} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Estadisticas;
