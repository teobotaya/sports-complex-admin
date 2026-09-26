import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { torneosApi, equiposApi, partidosApi, Torneo, Equipo, Partido, Posicion, ActualizarTorneoInput } from '../api/torneos';
import { useAuth } from '../context/AuthContext';
import { canchasApi, Cancha } from '../api/canchas';
import { ApiError } from '../api/client';
import { opcionesInicio } from '../components/horarios';

const TorneoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const idTorneo = Number(id);
  const history = useHistory();

  const [torneo, setTorneo] = useState<Torneo | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [agregandoEquipo, setAgregandoEquipo] = useState(false);
  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: '', contactoNombre: '', contactoTelefono: '' });
  const [programando, setProgramando] = useState(false);
  const [nuevoPartido, setNuevoPartido] = useState({ idEquipoLocal: '', idEquipoVisitante: '', idCancha: '', fecha: '', horaInicio: '' });
  const [cargandoResultado, setCargandoResultado] = useState<Partido | null>(null);
  const [golesLocal, setGolesLocal] = useState('');
  const [golesVisitante, setGolesVisitante] = useState('');
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'administrador';
  const [editandoTorneo, setEditandoTorneo] = useState<ActualizarTorneoInput | null>(null);

  // Solo el administrador edita el torneo; es la forma de pasarlo a «En curso» o «Finalizado».
  const abrirEdicionTorneo = () => {
    if (!torneo) return;
    setError(null);
    setEditandoTorneo({ nombre: torneo.nombre, categoria: torneo.categoria, fechaInicio: torneo.fechaInicio, fechaFin: torneo.fechaFin, estado: torneo.estado });
  };
  const guardarTorneo = async () => {
    if (!editandoTorneo) return;
    if (!editandoTorneo.nombre.trim()) { setError('El nombre del torneo es obligatorio.'); return; }
    try {
      await torneosApi.update(idTorneo, { ...editandoTorneo, nombre: editandoTorneo.nombre.trim(), categoria: editandoTorneo.categoria?.trim() || null });
      setEditandoTorneo(null);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar el torneo.');
    }
  };

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, eq, pa, pos, ca] = await Promise.all([
        torneosApi.getById(idTorneo),
        torneosApi.getEquipos(idTorneo),
        torneosApi.getPartidos(idTorneo),
        torneosApi.getPosiciones(idTorneo),
        canchasApi.getAll(),
      ]);
      setTorneo(t);
      setEquipos(eq);
      setPartidos(pa);
      setPosiciones(pos);
      setCanchas(ca.filter((c) => c.activa));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar el torneo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [idTorneo]);

  const agregarEquipo = async () => {
    if (!nuevoEquipo.nombre) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }
    setError(null);
    try {
      await torneosApi.agregarEquipo(idTorneo, {
        nombre: nuevoEquipo.nombre,
        contactoNombre: nuevoEquipo.contactoNombre || null,
        contactoTelefono: nuevoEquipo.contactoTelefono || null,
      });
      setNuevoEquipo({ nombre: '', contactoNombre: '', contactoTelefono: '' });
      setAgregandoEquipo(false);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al agregar el equipo.');
    }
  };

  const quitarEquipo = async (idEquipo: number) => {
    if (!window.confirm('¿Confirma quitar este equipo del torneo?')) return;
    setError(null);
    try {
      await equiposApi.quitar(idEquipo);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al quitar el equipo.');
    }
  };

  const programarPartido = async () => {
    const { idEquipoLocal, idEquipoVisitante, idCancha, fecha, horaInicio } = nuevoPartido;
    if (!idEquipoLocal || !idEquipoVisitante || !idCancha || !fecha || !horaInicio) {
      setError('Completá equipo local, visitante, cancha, fecha y hora para programar el partido.');
      return;
    }
    setError(null);
    try {
      await torneosApi.programarPartido(idTorneo, {
        idEquipoLocal: Number(idEquipoLocal),
        idEquipoVisitante: Number(idEquipoVisitante),
        idCancha: Number(idCancha),
        fecha,
        horaInicio,
      });
      setNuevoPartido({ idEquipoLocal: '', idEquipoVisitante: '', idCancha: '', fecha: '', horaInicio: '' });
      setProgramando(false);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al programar el partido.');
    }
  };

  const guardarResultado = async () => {
    if (!cargandoResultado) return;
    if (golesLocal === '' || golesVisitante === '') {
      setError('Ingresá los goles de ambos equipos.');
      return;
    }
    setError(null);
    try {
      await partidosApi.registrarResultado(cargandoResultado.idPartido, Number(golesLocal), Number(golesVisitante));
      setCargandoResultado(null);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al registrar el resultado.');
    }
  };

  if (loading) return <div className="text-muted-sc p-3">Cargando…</div>;

  if (!torneo) {
    return (
      <div>
        <PageHeader title="Torneo no encontrado" />
        {error && <div className="availability-msg availability-fail mb-3">{error}</div>}
        <button type="button" className="btn btn-outline-secondary" onClick={() => history.push('/torneos')}>Volver a Torneos</button>
      </div>
    );
  }

  const proximos = partidos.filter((p) => p.estado === 'Programado');
  const resultados = partidos.filter((p) => p.estado === 'Jugado');

  return (
    <div>
      <PageHeader
        title={torneo.nombre}
        subtitle={torneo.categoria ?? undefined}
        action={
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => history.push('/torneos')}>Volver</button>
            {esAdmin && <button type="button" className="btn btn-outline-secondary" onClick={abrirEdicionTorneo}>Editar torneo</button>}
            <button type="button" className="btn btn-sc-primary text-white" onClick={() => setProgramando(true)}>Programar partido</button>
          </div>
        }
      />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="row g-3 mb-3">
        <div className="col-lg-4">
          <div className="sc-card h-100">
            <div className="sc-card-header"><h2>Información general</h2></div>
            <div className="sc-card-body">
              <div className="detail-row"><span className="detail-row-label">Categoría</span><span className="detail-row-value">{torneo.categoria ?? '—'}</span></div>
              <div className="detail-row"><span className="detail-row-label">Inicio</span><span className="detail-row-value">{torneo.fechaInicio}</span></div>
              <div className="detail-row"><span className="detail-row-label">Fin</span><span className="detail-row-value">{torneo.fechaFin}</span></div>
              <div className="detail-row"><span className="detail-row-label">Equipos</span><span className="detail-row-value">{equipos.length}</span></div>
              <div className="detail-row"><span className="detail-row-label">Estado</span><span className="detail-row-value"><StatusBadge label={torneo.estado} /></span></div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="sc-card h-100">
            <div className="sc-card-header d-flex justify-content-between align-items-center">
              <h2>Equipos participantes</h2>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={() => setAgregandoEquipo(true)}>Agregar equipo</button>
            </div>
            <div className="table-responsive-sc">
              <table className="table-sc mb-0">
                <thead><tr><th>Equipo</th><th>Contacto</th><th>Integrantes</th><th>Acciones</th></tr></thead>
                <tbody>
                  {equipos.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState
                          title="Sin equipos"
                          message="Todavía no se inscribieron equipos en este torneo."
                          actionLabel="Agregar equipo"
                          onAction={() => setAgregandoEquipo(true)}
                        />
                      </td>
                    </tr>
                  )}
                  {equipos.map((e) => (
                    <tr key={e.idEquipo}>
                      <td>{e.nombre}</td>
                      <td>{e.contactoNombre ?? '—'}</td>
                      <td>{e.cantidadIntegrantes}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => history.push(`/equipos?equipoId=${e.idEquipo}`)}>Ver integrantes</button>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => quitarEquipo(e.idEquipo)}>Quitar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <div className="sc-card h-100">
            <div className="sc-card-header"><h2>Próximos partidos</h2></div>
            <div className="table-responsive-sc">
              <table className="table-sc mb-0">
                <thead><tr><th>Fecha</th><th>Partido</th><th>Cancha</th><th>Acciones</th></tr></thead>
                <tbody>
                  {proximos.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState
                          title="Sin partidos programados"
                          message="Programá el primer partido de este torneo."
                          actionLabel="Programar partido"
                          onAction={() => setProgramando(true)}
                        />
                      </td>
                    </tr>
                  )}
                  {proximos.map((p) => (
                    <tr key={p.idPartido}>
                      <td>{p.fecha} {p.horaInicio}</td>
                      <td>{p.equipoLocalNombre} vs {p.equipoVisitanteNombre}</td>
                      <td>{p.canchaNombre}</td>
                      <td>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setCargandoResultado(p); setGolesLocal(''); setGolesVisitante(''); }}>
                          Cargar resultado
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="sc-card h-100">
            <div className="sc-card-header"><h2>Resultados</h2></div>
            <div className="table-responsive-sc">
              <table className="table-sc mb-0">
                <thead><tr><th>Fecha</th><th>Partido</th><th>Resultado</th></tr></thead>
                <tbody>
                  {resultados.length === 0 && (
                    <tr>
                      <td colSpan={3}>
                        <EmptyState title="Sin resultados" message="Los resultados aparecerán cuando se carguen partidos jugados." />
                      </td>
                    </tr>
                  )}
                  {resultados.map((p) => (
                    <tr key={p.idPartido}>
                      <td>{p.fecha}</td>
                      <td>{p.equipoLocalNombre} vs {p.equipoVisitanteNombre}</td>
                      <td className="fw-600">{p.golesLocal} - {p.golesVisitante}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="sc-card">
        <div className="sc-card-header"><h2>Tabla de posiciones</h2></div>
        <div className="table-responsive-sc">
          <table className="table-sc mb-0">
            <thead><tr><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th></tr></thead>
            <tbody>
              {posiciones.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title="Sin partidos jugados" message="La tabla se generará automáticamente con los resultados cargados." />
                  </td>
                </tr>
              )}
              {posiciones.map((p) => (
                <tr key={p.idEquipo}>
                  <td>{p.equipo}</td>
                  <td>{p.pj}</td><td>{p.pg}</td><td>{p.pe}</td><td>{p.pp}</td>
                  <td>{p.gf}</td><td>{p.gc}</td><td>{p.dg}</td>
                  <td className="fw-600">{p.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editandoTorneo && (
        <Modal error={error}
          title="Editar torneo"
          onClose={() => setEditandoTorneo(null)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditandoTorneo(null)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={guardarTorneo}>Guardar cambios</button>
            </>
          }
        >
          {error && <div className="availability-msg availability-fail mb-2">{error}</div>}
          <div className="mb-2">
            <label htmlFor="torneo-edit-nombre" className="form-label small text-muted-sc mb-1">Nombre</label>
            <input id="torneo-edit-nombre" type="text" className="form-control form-control-sm" value={editandoTorneo.nombre} onChange={(e) => setEditandoTorneo({ ...editandoTorneo, nombre: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="torneo-edit-categoria" className="form-label small text-muted-sc mb-1">Categoría</label>
            <input id="torneo-edit-categoria" type="text" className="form-control form-control-sm" value={editandoTorneo.categoria ?? ''} onChange={(e) => setEditandoTorneo({ ...editandoTorneo, categoria: e.target.value })} />
          </div>
          <div className="row g-2 mb-2">
            <div className="col-6">
              <label htmlFor="torneo-edit-inicio" className="form-label small text-muted-sc mb-1">Fecha de inicio</label>
              <input id="torneo-edit-inicio" type="date" className="form-control form-control-sm" value={editandoTorneo.fechaInicio} onChange={(e) => setEditandoTorneo({ ...editandoTorneo, fechaInicio: e.target.value })} />
            </div>
            <div className="col-6">
              <label htmlFor="torneo-edit-fin" className="form-label small text-muted-sc mb-1">Fecha de fin</label>
              <input id="torneo-edit-fin" type="date" className="form-control form-control-sm" value={editandoTorneo.fechaFin} onChange={(e) => setEditandoTorneo({ ...editandoTorneo, fechaFin: e.target.value })} />
            </div>
          </div>
          <div className="mb-2">
            <label htmlFor="torneo-edit-estado" className="form-label small text-muted-sc mb-1">Estado</label>
            <select id="torneo-edit-estado" className="form-select form-select-sm" value={editandoTorneo.estado} onChange={(e) => setEditandoTorneo({ ...editandoTorneo, estado: e.target.value as ActualizarTorneoInput['estado'] })}>
              <option value="Planificado">Planificado</option>
              <option value="En curso">En curso</option>
              <option value="Finalizado">Finalizado</option>
            </select>
            <div className="text-muted-sc mt-1" style={{ fontSize: 12 }}>Un torneo finalizado ya no permite programar partidos, cargar resultados ni cambiar equipos.</div>
          </div>
        </Modal>
      )}

      {agregandoEquipo && (
        <Modal error={error}
          title="Agregar equipo al torneo"
          onClose={() => setAgregandoEquipo(false)}
          confirmClose={!!(nuevoEquipo.nombre || nuevoEquipo.contactoNombre || nuevoEquipo.contactoTelefono)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAgregandoEquipo(false)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={agregarEquipo}>Agregar</button>
            </>
          }
        >
          <div className="mb-2">
            <label htmlFor="equipo-nuevo-nombre" className="form-label small text-muted-sc mb-1">Nombre del equipo</label>
            <input id="equipo-nuevo-nombre" type="text" className={`form-control form-control-sm ${error && !nuevoEquipo.nombre ? 'is-invalid' : ''}`} value={nuevoEquipo.nombre} onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, nombre: e.target.value })} />
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Contacto</label>
            <input type="text" className="form-control form-control-sm" value={nuevoEquipo.contactoNombre} onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, contactoNombre: e.target.value })} />
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Teléfono de contacto</label>
            <input type="text" className="form-control form-control-sm" value={nuevoEquipo.contactoTelefono} onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, contactoTelefono: e.target.value })} />
          </div>
        </Modal>
      )}

      {programando && (
        <Modal error={error}
          title="Programar partido"
          onClose={() => setProgramando(false)}
          confirmClose={!!(nuevoPartido.idEquipoLocal || nuevoPartido.idEquipoVisitante || nuevoPartido.idCancha || nuevoPartido.fecha || nuevoPartido.horaInicio)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setProgramando(false)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={programarPartido}>Programar</button>
            </>
          }
        >
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Equipo local</label>
            <select className="form-select form-select-sm" value={nuevoPartido.idEquipoLocal} onChange={(e) => setNuevoPartido({ ...nuevoPartido, idEquipoLocal: e.target.value })}>
              <option value="">Seleccionar…</option>
              {equipos.map((e) => <option key={e.idEquipo} value={e.idEquipo}>{e.nombre}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Equipo visitante</label>
            <select className="form-select form-select-sm" value={nuevoPartido.idEquipoVisitante} onChange={(e) => setNuevoPartido({ ...nuevoPartido, idEquipoVisitante: e.target.value })}>
              <option value="">Seleccionar…</option>
              {equipos.map((e) => <option key={e.idEquipo} value={e.idEquipo}>{e.nombre}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Cancha</label>
            <select className="form-select form-select-sm" value={nuevoPartido.idCancha} onChange={(e) => setNuevoPartido({ ...nuevoPartido, idCancha: e.target.value })}>
              <option value="">Seleccionar…</option>
              {canchas.map((c) => <option key={c.idCancha} value={c.idCancha}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Fecha</label>
            <input type="date" className="form-control form-control-sm" value={nuevoPartido.fecha} onChange={(e) => setNuevoPartido({ ...nuevoPartido, fecha: e.target.value })} />
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Hora</label>
            <select className="form-select form-select-sm" value={nuevoPartido.horaInicio} onChange={(e) => setNuevoPartido({ ...nuevoPartido, horaInicio: e.target.value })}>
              <option value="">Elegir…</option>
              {opcionesInicio().map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {cargandoResultado && (
        <Modal error={error}
          title={`Cargar resultado: ${cargandoResultado.equipoLocalNombre} vs ${cargandoResultado.equipoVisitanteNombre}`}
          onClose={() => setCargandoResultado(null)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCargandoResultado(null)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={guardarResultado}>Guardar resultado</button>
            </>
          }
        >
          <div className="row g-3 align-items-center">
            <div className="col-5">
              <label htmlFor="partido-goles-local" className="form-label small text-muted-sc mb-1">{cargandoResultado.equipoLocalNombre}</label>
              <input id="partido-goles-local" type="number" min={0} className={`form-control ${error && golesLocal === '' ? 'is-invalid' : ''}`} value={golesLocal} onChange={(e) => setGolesLocal(e.target.value)} />
            </div>
            <div className="col-2 text-center fw-600 pt-4">vs</div>
            <div className="col-5">
              <label htmlFor="partido-goles-visitante" className="form-label small text-muted-sc mb-1">{cargandoResultado.equipoVisitanteNombre}</label>
              <input id="partido-goles-visitante" type="number" min={0} className={`form-control ${error && golesVisitante === '' ? 'is-invalid' : ''}`} value={golesVisitante} onChange={(e) => setGolesVisitante(e.target.value)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TorneoDetalle;
