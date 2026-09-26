import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { IconPlus } from '../components/Icons';
import { isoDate, fechaLocalIso } from '../../data/mock';
import { reservasApi, Reserva } from '../api/reservas';
import { canchasApi, Cancha } from '../api/canchas';
import { ApiError } from '../api/client';
import { pagosApi, Pago } from '../api/pagos';
import { partidosApi, Partido } from '../api/torneos';
import { HistorialItem } from '../api/auditoria';
import HistorialCambios from '../components/HistorialCambios';
import { HORAS_GRILLA, opcionesInicio, opcionesFin, ajustarFin, ocupaFranja, partidoEnFranja } from '../components/horarios';
import { descargarCsv } from '../components/exportarCsv';

const HORAS = HORAS_GRILLA;
const POR_PAGINA = 10;

type ModalMode = 'ver' | 'editar' | 'cancelar' | null;

function addDias(fechaIso: string, dias: number): string {
  const d = new Date(`${fechaIso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return fechaLocalIso(d);
}

function lunesDeLaSemana(fechaIso: string): string[] {
  const base = new Date(`${fechaIso}T00:00:00`);
  const dia = base.getDay();
  const diffALunes = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(base);
  lunes.setDate(base.getDate() + diffALunes);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return fechaLocalIso(d);
  });
}

const NOMBRES_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** La asistencia se marca el día del turno o después, y nunca en una reserva cancelada. */
export const puedeMarcarAsistencia = (r: Reserva, hoy: string): boolean =>
  r.estadoReserva !== 'Cancelada' && r.fecha <= hoy;

const Reservas: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [items, setItems] = useState<Reserva[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<'tabla' | 'agenda' | 'semana'>('tabla');
  const [fecha, setFecha] = useState(isoDate(0));
  // Vista de tabla: rango de fechas (vacío = sin límite) para buscar en todo el historial.
  const [desde, setDesde] = useState(isoDate(0));
  const [hasta, setHasta] = useState(isoDate(0));
  const [partidosDia, setPartidosDia] = useState<Partido[]>([]);
  const [historialSeleccion, setHistorialSeleccion] = useState<HistorialItem[] | null>(null);
  const [canchaFiltro, setCanchaFiltro] = useState<string>(params.get('cancha') ?? 'todas');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [seleccion, setSeleccion] = useState<Reserva | null>(null);
  const [pagosSeleccion, setPagosSeleccion] = useState<Pago[] | null>(null);
  const [motivo, setMotivo] = useState('');
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [semanaItems, setSemanaItems] = useState<Reserva[]>([]);
  const [cargandoSemana, setCargandoSemana] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(
    () => (history.location.state as { successMessage?: string } | undefined)?.successMessage ?? null
  );

  useEffect(() => {
    if (!mensajeExito) return;
    history.replace({ pathname: location.pathname, search: location.search });
    const t = setTimeout(() => setMensajeExito(null), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargar = () => {
    if (vista === 'tabla' && desde && hasta && hasta < desde) {
      setError('La fecha "Desde" debe ser anterior o igual a "Hasta".');
      return;
    }
    setLoading(true);
    setError(null);
    const pedidoReservas = vista === 'tabla'
      ? reservasApi.getAll({ desde: desde || undefined, hasta: hasta || undefined })
      : reservasApi.getAll({ fecha });
    const pedidoPartidos = vista === 'agenda' ? partidosApi.getByFecha(fecha) : Promise.resolve([] as Partido[]);
    Promise.all([pedidoReservas, canchasApi.getAll(), pedidoPartidos])
      .then(([r, c, p]) => { setItems(r); setCanchas(c); setPartidosDia(p); })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar reservas.'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(cargar, [fecha, desde, hasta, vista]);

  useEffect(() => setPagina(1), [canchaFiltro, estadoFiltro, busqueda, fecha, desde, hasta]);

  const diasSemana = useMemo(() => lunesDeLaSemana(fecha), [fecha]);

  useEffect(() => {
    if (vista !== 'semana') return;
    setCargandoSemana(true);
    Promise.all(diasSemana.map((d) => reservasApi.getAll({ fecha: d })))
      .then((porDia) => setSemanaItems(porDia.flat()))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar la semana.'))
      .finally(() => setCargandoSemana(false));
  }, [vista, diasSemana]);

  const aplicarFiltros = (lista: Reserva[]) =>
    lista
      .filter((r) => canchaFiltro === 'todas' || r.idCancha === Number(canchaFiltro))
      .filter((r) => estadoFiltro === 'todos' || r.estadoReserva === estadoFiltro)
      .filter((r) => r.clienteNombre.toLowerCase().includes(busqueda.toLowerCase()));

  const filtradas = useMemo(
    () => aplicarFiltros(items).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, canchaFiltro, estadoFiltro, busqueda]
  );

  const semanaFiltradas = useMemo(
    () => aplicarFiltros(semanaItems),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [semanaItems, canchaFiltro, estadoFiltro, busqueda]
  );

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginadas = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  const abrirVer = (r: Reserva) => {
    setSeleccion(r); setModalMode('ver'); setPagosSeleccion(null); setHistorialSeleccion(null); setErrorModal(null);
    pagosApi.getByReserva(r.idReserva).then(setPagosSeleccion).catch(() => setPagosSeleccion([]));
    reservasApi.getHistorial(r.idReserva).then(setHistorialSeleccion).catch(() => setHistorialSeleccion([]));
  };

  const marcarAsistencia = async (asistencia: 'Presente' | 'Ausente') => {
    if (!seleccion) return;
    setErrorModal(null);
    try {
      const actualizada = await reservasApi.registrarAsistencia(seleccion.idReserva, asistencia);
      setSeleccion(actualizada);
      setItems((lista) => lista.map((x) => (x.idReserva === actualizada.idReserva ? actualizada : x)));
      reservasApi.getHistorial(actualizada.idReserva).then(setHistorialSeleccion).catch(() => undefined);
    } catch (e) {
      setErrorModal(e instanceof ApiError ? e.message : 'No se pudo registrar la asistencia.');
    }
  };

  const exportarListado = () => {
    const nombre = `reservas_${desde || 'inicio'}_a_${hasta || 'hoy'}.csv`;
    descargarCsv(nombre,
      ['N.º', 'Cliente', 'Cancha', 'Fecha', 'Inicio', 'Fin', 'Estado', 'Pago', 'Asistencia', 'Observaciones'],
      filtradas.map((r) => [r.idReserva, r.clienteNombre, r.canchaNombre, r.fecha, r.horaInicio, r.horaFin,
        r.estadoReserva, r.estadoPago, r.asistencia ?? 'Sin registrar', r.observaciones ?? '']));
  };
  const abrirEditar = (r: Reserva) => { setSeleccion({ ...r }); setErrorModal(null); setModalMode('editar'); };
  const abrirCancelar = (r: Reserva) => { setSeleccion(r); setMotivo(''); setErrorModal(null); setModalMode('cancelar'); };
  const cerrarModal = () => { setModalMode(null); setSeleccion(null); setErrorModal(null); };

  const guardarEdicion = async () => {
    if (!seleccion) return;
    setErrorModal(null);
    try {
      await reservasApi.update(seleccion.idReserva, {
        idCancha: seleccion.idCancha,
        fecha: seleccion.fecha,
        horaInicio: seleccion.horaInicio,
        horaFin: seleccion.horaFin,
        observaciones: seleccion.observaciones,
      });
      cerrarModal();
      cargar();
    } catch (e) {
      setErrorModal(e instanceof ApiError ? e.message : 'Error al guardar la reserva.');
    }
  };

  const confirmarCancelacion = async () => {
    if (!seleccion) return;
    setErrorModal(null);
    try {
      await reservasApi.cancelar(seleccion.idReserva, motivo.trim() || null);
      cerrarModal();
      cargar();
    } catch (e) {
      setErrorModal(e instanceof ApiError ? e.message : 'Error al cancelar la reserva.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Reservas"
        subtitle="Visualización y gestión de turnos del complejo"
        action={
          <div className="d-flex gap-2">
            {vista === 'tabla' && (
              <button type="button" className="btn btn-outline-secondary no-print" onClick={exportarListado} disabled={filtradas.length === 0}>
                Exportar listado
              </button>
            )}
            <button type="button" className="btn btn-outline-secondary no-print" onClick={() => window.print()}>
              Imprimir
            </button>
            <button type="button" className="btn btn-sc-primary text-white d-flex align-items-center gap-2" onClick={() => history.push('/nueva-reserva')}>
              <IconPlus /> Nueva Reserva
            </button>
          </div>
        }
      />

      {mensajeExito && <div className="availability-msg availability-ok mb-3">{mensajeExito}</div>}
      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="sc-card mb-3 no-print">
        <div className="sc-card-body">
          <div className="row g-2 align-items-end">
            {vista === 'tabla' ? (
              <>
                <div className="col-6 col-md-2">
                  <label className="form-label small text-muted-sc mb-1">Desde</label>
                  <input type="date" className="form-control form-control-sm" value={desde} onChange={(e) => setDesde(e.target.value)} />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label small text-muted-sc mb-1">Hasta</label>
                  <input type="date" className="form-control form-control-sm" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                </div>
              </>
            ) : (
              <div className="col-6 col-md-2">
                <label className="form-label small text-muted-sc mb-1">Fecha</label>
                <input type="date" className="form-control form-control-sm" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            )}
            <div className="col-6 col-md-2">
              <label className="form-label small text-muted-sc mb-1">Cancha</label>
              <select className="form-select form-select-sm" value={canchaFiltro} onChange={(e) => setCanchaFiltro(e.target.value)}>
                <option value="todas">Todas</option>
                {canchas.map((c) => (
                  <option key={c.idCancha} value={c.idCancha}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small text-muted-sc mb-1">Estado</label>
              <select className="form-select form-select-sm" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
            <div className={`col-6 ${vista === 'tabla' ? 'col-md-2' : 'col-md-3'}`}>
              <label className="form-label small text-muted-sc mb-1">Buscar cliente</label>
              <input type="text" className="form-control form-control-sm" placeholder="Nombre del cliente" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div className={`col-12 ${vista === 'tabla' ? 'col-md-2' : 'col-md-3'} d-flex justify-content-md-end gap-2 mt-2 mt-md-0`}>
              <div className="btn-group btn-group-sm" role="group">
                <button type="button" className={`btn btn-outline-secondary ${vista === 'tabla' ? 'active' : ''}`} onClick={() => setVista('tabla')}>Tabla</button>
                <button type="button" className={`btn btn-outline-secondary ${vista === 'agenda' ? 'active' : ''}`} onClick={() => setVista('agenda')}>Agenda</button>
                <button type="button" className={`btn btn-outline-secondary ${vista === 'semana' ? 'active' : ''}`} onClick={() => setVista('semana')}>Semana</button>
              </div>
            </div>
          </div>
          {vista === 'tabla' && (
            <div className="d-flex gap-2 align-items-center mt-2" style={{ fontSize: 12.5 }}>
              <span className="text-muted-sc">Atajos:</span>
              <button type="button" className="btn btn-sm btn-link p-0" onClick={() => { setDesde(isoDate(0)); setHasta(isoDate(0)); }}>Hoy</button>
              <span className="text-muted-sc">·</span>
              <button type="button" className="btn btn-sm btn-link p-0" onClick={() => { setDesde(''); setHasta(''); }}>Todo el historial</button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-muted-sc p-3">Cargando reservas…</div>
      ) : vista === 'tabla' ? (
        <div className="sc-card">
          <div className="table-responsive-sc">
            <table className="table-sc mb-0">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Cancha</th>
                  <th>Fecha</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        title="No hay reservas"
                        message="No se encontraron reservas con los filtros aplicados."
                        actionLabel="Limpiar filtros"
                        onAction={() => { setCanchaFiltro('todas'); setEstadoFiltro('todos'); setBusqueda(''); }}
                      />
                    </td>
                  </tr>
                )}
                {paginadas.map((r) => (
                  <tr key={r.idReserva}>
                    <td>{r.clienteNombre}</td>
                    <td>{r.canchaNombre}</td>
                    <td>{r.fecha}</td>
                    <td>{r.horaInicio}</td>
                    <td>{r.horaFin}</td>
                    <td><StatusBadge label={r.estadoReserva} /></td>
                    <td><StatusBadge label={r.estadoPago} /></td>
                    <td>
                      <div className="d-flex gap-1">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => abrirVer(r)}>Ver</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => abrirEditar(r)} disabled={r.estadoReserva === 'Cancelada'}>Editar</button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => abrirCancelar(r)} disabled={r.estadoReserva === 'Cancelada'}>Cancelar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtradas.length > POR_PAGINA && (
            <div className="d-flex justify-content-between align-items-center p-2 no-print" style={{ borderTop: '1px solid var(--sc-border)' }}>
              <span className="text-muted-sc" style={{ fontSize: 12.5 }}>Página {paginaActual} de {totalPaginas} · {filtradas.length} reservas</span>
              <div className="d-flex gap-1">
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={paginaActual <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={paginaActual >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
              </div>
            </div>
          )}
        </div>
      ) : vista === 'agenda' ? (
        <div className="sc-card">
          <div className="sc-card-body">
            <div className="table-responsive-sc">
              <table className="table-sc mb-0">
                <thead>
                  <tr>
                    <th>Hora</th>
                    {canchas.map((c) => <th key={c.idCancha}>{c.nombre}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {HORAS.map((h) => {
                    const hora = `${String(h).padStart(2, '0')}:00`;
                    return (
                      <tr key={h}>
                        <td className="text-muted-sc">{hora}</td>
                        {canchas.map((c) => {
                          const r = filtradas.find((x) => x.idCancha === c.idCancha && ocupaFranja(x, hora));
                          const p = r ? undefined : partidosDia.find((x) => x.idCancha === c.idCancha && partidoEnFranja(x, hora));
                          return (
                            <td key={c.idCancha}>
                              {r ? (
                                <button type="button" className="btn btn-sm w-100 text-start btn-outline-secondary" onClick={() => abrirVer(r)}>
                                  {r.clienteNombre}
                                </button>
                              ) : p ? (
                                <span className="badge-sc badge-info" title={p.torneoNombre} style={{ fontSize: 12 }}>
                                  Partido: {p.equipoLocalNombre} vs {p.equipoVisitanteNombre}
                                </span>
                              ) : (
                                <span className="text-muted-sc" style={{ fontSize: 12 }}>—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="sc-card">
          <div className="sc-card-header d-flex justify-content-between align-items-center">
            <h2>Semana del {diasSemana[0]} al {diasSemana[6]}</h2>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setFecha(addDias(fecha, -7))}>◀ Semana anterior</button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setFecha(addDias(fecha, 7))}>Semana siguiente ▶</button>
            </div>
          </div>
          <div className="table-responsive-sc">
            {cargandoSemana ? (
              <div className="text-muted-sc p-3">Cargando semana…</div>
            ) : (
              <table className="table-sc mb-0">
                <thead>
                  <tr>
                    <th>Hora</th>
                    {diasSemana.map((d, i) => <th key={d}>{NOMBRES_DIA[i]} {d.slice(8, 10)}/{d.slice(5, 7)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {HORAS.map((h) => {
                    const hora = `${String(h).padStart(2, '0')}:00`;
                    return (
                      <tr key={h}>
                        <td className="text-muted-sc">{hora}</td>
                        {diasSemana.map((d) => {
                          const delDia = semanaFiltradas.filter((x) => x.fecha === d && ocupaFranja(x, hora));
                          return (
                            <td key={d}>
                              {delDia.length === 0 ? (
                                <span className="text-muted-sc" style={{ fontSize: 12 }}>—</span>
                              ) : (
                                <div className="d-flex flex-column gap-1">
                                  {delDia.map((r) => (
                                    <button
                                      key={r.idReserva}
                                      type="button"
                                      className="btn btn-sm w-100 text-start btn-outline-secondary"
                                      onClick={() => abrirVer(r)}
                                      style={{ fontSize: 12 }}
                                    >
                                      {r.clienteNombre} · {r.canchaNombre}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {modalMode === 'ver' && seleccion && (
        <Modal
          title="Detalle de la reserva"
          onClose={cerrarModal}
          error={errorModal}
          footer={
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>Imprimir</button>
          }
        >
          <div className="detail-row"><span className="detail-row-label">Cliente</span><span className="detail-row-value">{seleccion.clienteNombre}</span></div>
          <div className="detail-row"><span className="detail-row-label">Cancha</span><span className="detail-row-value">{seleccion.canchaNombre}</span></div>
          <div className="detail-row"><span className="detail-row-label">Fecha</span><span className="detail-row-value">{seleccion.fecha}</span></div>
          <div className="detail-row"><span className="detail-row-label">Horario</span><span className="detail-row-value">{seleccion.horaInicio} - {seleccion.horaFin}</span></div>
          <div className="detail-row"><span className="detail-row-label">Estado</span><span className="detail-row-value"><StatusBadge label={seleccion.estadoReserva} /></span></div>
          <div className="detail-row"><span className="detail-row-label">Pago</span><span className="detail-row-value"><StatusBadge label={seleccion.estadoPago} /></span></div>
          <div className="detail-row">
            <span className="detail-row-label">Asistencia</span>
            <span className="detail-row-value d-flex gap-1 align-items-center flex-wrap justify-content-end">
              {seleccion.asistencia ? <StatusBadge label={seleccion.asistencia === 'Presente' ? 'Se presentó' : 'No se presentó'} /> : <span className="text-muted-sc">Sin registrar</span>}
              {puedeMarcarAsistencia(seleccion, isoDate(0)) && (
                <>
                  <button type="button" className="btn btn-sm btn-outline-success no-print" disabled={seleccion.asistencia === 'Presente'} onClick={() => marcarAsistencia('Presente')}>Se presentó</button>
                  <button type="button" className="btn btn-sm btn-outline-danger no-print" disabled={seleccion.asistencia === 'Ausente'} onClick={() => marcarAsistencia('Ausente')}>No se presentó</button>
                </>
              )}
            </span>
          </div>
          {seleccion.observaciones && (
            <div className="detail-row"><span className="detail-row-label">Observaciones</span><span className="detail-row-value">{seleccion.observaciones}</span></div>
          )}
          <div className="detail-row"><span className="detail-row-label">Registrada el</span><span className="detail-row-value">{seleccion.fechaCreacion.slice(0, 16).replace('T', ' ')}</span></div>
          <h4 className="mt-3 mb-2" style={{ fontSize: 14 }}>Pagos registrados</h4>
          {pagosSeleccion === null && <div className="text-muted-sc" style={{ fontSize: 13 }}>Cargando pagos…</div>}
          {pagosSeleccion && pagosSeleccion.length === 0 && <div className="text-muted-sc" style={{ fontSize: 13 }}>Todavía no se registraron pagos.</div>}
          {pagosSeleccion && pagosSeleccion.map((p) => (
            <div className="detail-row" key={p.idPago}>
              <span className="detail-row-label">{p.fechaPago} · {p.metodoPago}{p.registradoPor ? ` · cobró ${p.registradoPor}` : ''}</span>
              <span className="detail-row-value">${p.monto.toLocaleString('es-AR')}</span>
            </div>
          ))}
          <h4 className="mt-3 mb-2" style={{ fontSize: 14 }}>Historial de cambios</h4>
          <HistorialCambios items={historialSeleccion} />
        </Modal>
      )}

      {modalMode === 'cancelar' && seleccion && (
        <Modal
          title="Cancelar reserva"
          onClose={cerrarModal}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cerrarModal}>Volver</button>
              <button type="button" className="btn btn-sm btn-danger" onClick={confirmarCancelacion}>Confirmar cancelación</button>
            </>
          }
        >
          {errorModal && <div className="availability-msg availability-fail mb-2">{errorModal}</div>}
          <p style={{ fontSize: 13.5 }}>
            Vas a cancelar la reserva de <strong>{seleccion.clienteNombre}</strong> en {seleccion.canchaNombre}, el {seleccion.fecha} de {seleccion.horaInicio} a {seleccion.horaFin}. El horario queda libre y la cancelación no se puede deshacer.
          </p>
          <label className="form-label small text-muted-sc mb-1">Motivo (opcional)</label>
          <textarea className="form-control form-control-sm" rows={3} placeholder="Ej: lluvia, el cliente avisó que no viene" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Modal>
      )}

      {modalMode === 'editar' && seleccion && (
        <Modal
          title="Editar reserva"
          onClose={cerrarModal}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cerrarModal}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={guardarEdicion}>Guardar cambios</button>
            </>
          }
        >
          {errorModal && <div className="availability-msg availability-fail mb-2">{errorModal}</div>}
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Cancha</label>
            <select className="form-select form-select-sm" value={seleccion.idCancha} onChange={(e) => setSeleccion({ ...seleccion, idCancha: Number(e.target.value) })}>
              {canchas.map((c) => (
                <option key={c.idCancha} value={c.idCancha} disabled={!c.activa && c.idCancha !== seleccion.idCancha}>
                  {c.nombre}{c.activa ? '' : ' (en mantenimiento)'}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Fecha</label>
            <input type="date" className="form-control form-control-sm" value={seleccion.fecha} onChange={(e) => setSeleccion({ ...seleccion, fecha: e.target.value })} />
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Hora inicio</label>
            <select className="form-select form-select-sm" value={seleccion.horaInicio} onChange={(e) => setSeleccion({ ...seleccion, horaInicio: e.target.value, horaFin: ajustarFin(e.target.value, seleccion.horaFin) })}>
              {!opcionesInicio().includes(seleccion.horaInicio) && <option value={seleccion.horaInicio}>{seleccion.horaInicio} (corregir)</option>}
              {opcionesInicio().map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Hora fin</label>
            <select className="form-select form-select-sm" value={seleccion.horaFin} onChange={(e) => setSeleccion({ ...seleccion, horaFin: e.target.value })}>
              {!opcionesFin(seleccion.horaInicio).includes(seleccion.horaFin) && <option value={seleccion.horaFin}>{seleccion.horaFin} (corregir)</option>}
              {opcionesFin(seleccion.horaInicio).map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Observaciones</label>
            <textarea className="form-control form-control-sm" rows={3} placeholder="Ej: llegó 5 minutos tarde" value={seleccion.observaciones ?? ''} onChange={(e) => setSeleccion({ ...seleccion, observaciones: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Reservas;
