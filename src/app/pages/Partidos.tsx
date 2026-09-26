import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { torneosApi, partidosApi, Partido } from '../api/torneos';
import { ApiError } from '../api/client';

const Partidos: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const torneoIdFiltro = new URLSearchParams(location.search).get('torneoId');

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<Partido | null>(null);
  const [golesLocal, setGolesLocal] = useState('');
  const [golesVisitante, setGolesVisitante] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const torneos = await torneosApi.getAll();
      const torneosFiltrados = torneoIdFiltro ? torneos.filter((t) => t.idTorneo === Number(torneoIdFiltro)) : torneos;
      const listas = await Promise.all(torneosFiltrados.map((t) => torneosApi.getPartidos(t.idTorneo)));
      setPartidos(listas.flat().sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar partidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [torneoIdFiltro]);

  const abrirCarga = (p: Partido) => {
    setCargando(p);
    setGolesLocal('');
    setGolesVisitante('');
  };

  const guardarResultado = async () => {
    if (!cargando) return;
    if (golesLocal === '' || golesVisitante === '') {
      setError('Ingresá los goles de ambos equipos.');
      return;
    }
    setError(null);
    try {
      await partidosApi.registrarResultado(cargando.idPartido, Number(golesLocal), Number(golesVisitante));
      setCargando(null);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al registrar el resultado.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Partidos"
        subtitle={torneoIdFiltro ? `Partidos del torneo #${torneoIdFiltro}` : 'Partidos programados en el complejo'}
      />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="sc-card">
        {loading ? (
          <div className="text-muted-sc p-3">Cargando partidos…</div>
        ) : (
          <div className="table-responsive-sc">
            <table className="table-sc mb-0">
              <thead>
                <tr>
                  <th>Torneo</th>
                  <th>Local</th>
                  <th>Visitante</th>
                  <th>Cancha</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Resultado</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {partidos.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        title="No hay partidos"
                        message="Los partidos se programan desde el detalle de un torneo."
                        actionLabel="Ir a Torneos"
                        onAction={() => history.push('/torneos')}
                      />
                    </td>
                  </tr>
                )}
                {partidos.map((p) => (
                  <tr key={p.idPartido}>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => history.push(`/torneos/${p.idTorneo}`)}>
                        {p.torneoNombre}
                      </button>
                    </td>
                    <td>{p.equipoLocalNombre}</td>
                    <td>{p.equipoVisitanteNombre}</td>
                    <td>{p.canchaNombre}</td>
                    <td>{p.fecha}</td>
                    <td>{p.horaInicio}</td>
                    <td className="fw-600">{p.estado === 'Jugado' ? `${p.golesLocal} - ${p.golesVisitante}` : '—'}</td>
                    <td><StatusBadge label={p.estado} /></td>
                    <td>
                      {p.estado !== 'Jugado' ? (
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => abrirCarga(p)}>Cargar resultado</button>
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

      {cargando && (
        <Modal error={error}
          title={`Cargar resultado: ${cargando.equipoLocalNombre} vs ${cargando.equipoVisitanteNombre}`}
          onClose={() => setCargando(null)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCargando(null)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={guardarResultado}>Guardar resultado</button>
            </>
          }
        >
          <div className="row g-3 align-items-center">
            <div className="col-5">
              <label className="form-label small text-muted-sc mb-1">{cargando.equipoLocalNombre}</label>
              <input type="number" min={0} className="form-control" value={golesLocal} onChange={(e) => setGolesLocal(e.target.value)} />
            </div>
            <div className="col-2 text-center fw-600 pt-4">vs</div>
            <div className="col-5">
              <label className="form-label small text-muted-sc mb-1">{cargando.equipoVisitanteNombre}</label>
              <input type="number" min={0} className="form-control" value={golesVisitante} onChange={(e) => setGolesVisitante(e.target.value)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Partidos;
