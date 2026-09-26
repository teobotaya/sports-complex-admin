import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { torneosApi, equiposApi, Equipo, Integrante } from '../api/torneos';
import { ApiError } from '../api/client';

const Equipos: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const torneoIdFiltro = new URLSearchParams(location.search).get('torneoId');
  const equipoIdInicial = new URLSearchParams(location.search).get('equipoId');

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verIntegrantesDe, setVerIntegrantesDe] = useState<Equipo | null>(null);
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [nuevoIntegrante, setNuevoIntegrante] = useState({ nombreCompleto: '', dni: '' });

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const torneos = await torneosApi.getAll();
      const torneosFiltrados = torneoIdFiltro ? torneos.filter((t) => t.idTorneo === Number(torneoIdFiltro)) : torneos;
      const listas = await Promise.all(torneosFiltrados.map((t) => torneosApi.getEquipos(t.idTorneo)));
      const todos = listas.flat();
      setEquipos(todos);
      if (equipoIdInicial) {
        const e = todos.find((x) => x.idEquipo === Number(equipoIdInicial));
        if (e) abrirIntegrantes(e);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar equipos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [torneoIdFiltro]);

  const abrirIntegrantes = async (e: Equipo) => {
    setVerIntegrantesDe(e);
    try {
      setIntegrantes(await equiposApi.getIntegrantes(e.idEquipo));
    } catch {
      setIntegrantes([]);
    }
  };

  const agregarIntegrante = async () => {
    if (!verIntegrantesDe) return;
    if (!nuevoIntegrante.nombreCompleto || !nuevoIntegrante.dni) {
      setError('Nombre completo y DNI son obligatorios.');
      return;
    }
    setError(null);
    try {
      await equiposApi.agregarIntegrante(verIntegrantesDe.idEquipo, nuevoIntegrante);
      setNuevoIntegrante({ nombreCompleto: '', dni: '' });
      setIntegrantes(await equiposApi.getIntegrantes(verIntegrantesDe.idEquipo));
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al agregar el integrante.');
    }
  };

  const quitarIntegrante = async (idIntegrante: number) => {
    if (!verIntegrantesDe) return;
    setError(null);
    try {
      await equiposApi.quitarIntegrante(idIntegrante);
      setIntegrantes(await equiposApi.getIntegrantes(verIntegrantesDe.idEquipo));
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al quitar el integrante.');
    }
  };

  return (
    <div>
      <PageHeader title="Equipos" subtitle="Equipos registrados en los torneos del complejo" />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="sc-card">
        {loading ? (
          <div className="text-muted-sc p-3">Cargando equipos…</div>
        ) : (
          <div className="table-responsive-sc">
            <table className="table-sc mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Integrantes</th>
                  <th>Torneo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equipos.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title="No hay equipos"
                        message="Los equipos se inscriben desde el detalle de un torneo."
                        actionLabel="Ir a Torneos"
                        onAction={() => history.push('/torneos')}
                      />
                    </td>
                  </tr>
                )}
                {equipos.map((e) => (
                  <tr key={e.idEquipo}>
                    <td>{e.nombre}</td>
                    <td>{e.contactoNombre ?? '—'}</td>
                    <td>{e.contactoTelefono ?? '—'}</td>
                    <td>{e.cantidadIntegrantes}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => history.push(`/torneos/${e.idTorneo}`)}>
                        {e.torneoNombre}
                      </button>
                    </td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => abrirIntegrantes(e)}>
                        Ver integrantes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {verIntegrantesDe && (
        <Modal error={error} title={`Integrantes de ${verIntegrantesDe.nombre}`} onClose={() => setVerIntegrantesDe(null)}>
          <ul className="mb-3" style={{ paddingLeft: 0, listStyle: 'none' }}>
            {integrantes.length === 0 && (
              <li style={{ listStyle: 'none' }}>
                <EmptyState title="Sin integrantes" message="Agregalos con el formulario de abajo." />
              </li>
            )}
            {integrantes.map((i) => (
              <li key={i.idIntegrante} className="d-flex justify-content-between align-items-center" style={{ padding: '4px 0', fontSize: 13 }}>
                <span>{i.nombreCompleto} — DNI {i.dni}</span>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => quitarIntegrante(i.idIntegrante)}>Quitar</button>
              </li>
            ))}
          </ul>
          <div className="row g-2 align-items-end">
            <div className="col-6">
              <label className="form-label small text-muted-sc mb-1">Nombre</label>
              <input type="text" className="form-control form-control-sm" value={nuevoIntegrante.nombreCompleto} onChange={(e) => setNuevoIntegrante({ ...nuevoIntegrante, nombreCompleto: e.target.value })} />
            </div>
            <div className="col-4">
              <label className="form-label small text-muted-sc mb-1">DNI</label>
              <input type="text" className="form-control form-control-sm" value={nuevoIntegrante.dni} onChange={(e) => setNuevoIntegrante({ ...nuevoIntegrante, dni: e.target.value })} />
            </div>
            <div className="col-2">
              <button type="button" className="btn btn-sm btn-sc-primary text-white w-100" onClick={agregarIntegrante}>Agregar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Equipos;
