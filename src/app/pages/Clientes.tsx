import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { clientesApi, Cliente } from '../api/clientes';
import { ApiError } from '../api/client';

const vacio = { nombreCompleto: '', telefono: '', observaciones: '' };

const Clientes: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState(() => new URLSearchParams(location.search).get('q') ?? '');
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState(vacio);

  const cargar = (q?: string) => {
    setLoading(true);
    clientesApi.getAll(q)
      .then(setClientes)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar clientes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => cargar(), []);

  useEffect(() => {
    const t = setTimeout(() => {
      cargar(busqueda || undefined);
      history.replace({ pathname: location.pathname, search: busqueda ? `?q=${encodeURIComponent(busqueda)}` : '' });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  const guardarEdicion = async () => {
    if (!editando) return;
    setError(null);
    try {
      await clientesApi.update(editando.idCliente, {
        nombreCompleto: editando.nombreCompleto,
        telefono: editando.telefono,
        observaciones: editando.observaciones,
      });
      setEditando(null);
      cargar(busqueda || undefined);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar el cliente.');
    }
  };

  const eliminarCliente = async (cliente: Cliente) => {
    if (!window.confirm(`¿Confirma eliminar a ${cliente.nombreCompleto}? Esta acción no se puede deshacer.`)) return;
    setError(null);
    try {
      await clientesApi.delete(cliente.idCliente);
      cargar(busqueda || undefined);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al eliminar el cliente.');
    }
  };

  const crearCliente = async () => {
    if (!nuevo.nombreCompleto || !nuevo.telefono) {
      setError('El nombre y el teléfono son obligatorios.');
      return;
    }
    setError(null);
    try {
      await clientesApi.create(nuevo);
      setNuevo(vacio);
      setCreando(false);
      cargar(busqueda || undefined);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al crear el cliente.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Listado de clientes registrados en el complejo"
        action={
          <button type="button" className="btn btn-sc-primary text-white" onClick={() => setCreando(true)}>
            Nuevo cliente
          </button>
        }
      />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="sc-card mb-3">
        <div className="sc-card-body py-2">
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ maxWidth: 320 }}
            placeholder="Buscar por nombre o teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="sc-card">
        {loading ? (
          <div className="text-muted-sc p-3">Cargando clientes…</div>
        ) : (
          <div className="table-responsive-sc">
            <table className="table-sc mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Fecha de alta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      {busqueda ? (
                        <EmptyState
                          title="No hay coincidencias"
                          message="No se encontraron clientes con ese criterio de búsqueda."
                          actionLabel="Limpiar búsqueda"
                          onAction={() => setBusqueda('')}
                        />
                      ) : (
                        <EmptyState
                          title="No hay clientes"
                          message="Todavía no hay clientes registrados."
                          actionLabel="Nuevo cliente"
                          onAction={() => setCreando(true)}
                        />
                      )}
                    </td>
                  </tr>
                )}
                {clientes.map((c) => (
                  <tr key={c.idCliente}>
                    <td>{c.nombreCompleto}</td>
                    <td>{c.telefono}</td>
                    <td>{c.fechaAlta}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => history.push(`/clientes/${c.idCliente}`)}>Ver</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditando({ ...c })}>Editar</button>
                        <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={() => history.push(`/nueva-reserva?clienteId=${c.idCliente}`)}>Nueva reserva</button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarCliente(c)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editando && (
        <Modal
          title="Editar cliente"
          onClose={() => setEditando(null)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditando(null)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={guardarEdicion}>Guardar cambios</button>
            </>
          }
        >
          <div className="mb-2">
            <label htmlFor="cliente-editar-nombre" className="form-label small text-muted-sc mb-1">Nombre</label>
            <input id="cliente-editar-nombre" type="text" className="form-control form-control-sm" value={editando.nombreCompleto} onChange={(e) => setEditando({ ...editando, nombreCompleto: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="cliente-editar-telefono" className="form-label small text-muted-sc mb-1">Teléfono</label>
            <input id="cliente-editar-telefono" type="text" className="form-control form-control-sm" value={editando.telefono} onChange={(e) => setEditando({ ...editando, telefono: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="cliente-editar-obs" className="form-label small text-muted-sc mb-1">Observaciones</label>
            <textarea id="cliente-editar-obs" className="form-control form-control-sm" value={editando.observaciones ?? ''} onChange={(e) => setEditando({ ...editando, observaciones: e.target.value })} />
          </div>
        </Modal>
      )}

      {creando && (
        <Modal
          title="Nuevo cliente"
          onClose={() => setCreando(false)}
          confirmClose={!!(nuevo.nombreCompleto || nuevo.telefono || nuevo.observaciones)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCreando(false)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={crearCliente}>Crear</button>
            </>
          }
        >
          <div className="mb-2">
            <label htmlFor="cliente-nuevo-nombre" className="form-label small text-muted-sc mb-1">Nombre</label>
            <input id="cliente-nuevo-nombre" type="text" className={`form-control form-control-sm ${error && !nuevo.nombreCompleto ? 'is-invalid' : ''}`} value={nuevo.nombreCompleto} onChange={(e) => setNuevo({ ...nuevo, nombreCompleto: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="cliente-nuevo-telefono" className="form-label small text-muted-sc mb-1">Teléfono</label>
            <input id="cliente-nuevo-telefono" type="text" className={`form-control form-control-sm ${error && !nuevo.telefono ? 'is-invalid' : ''}`} value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="cliente-nuevo-obs" className="form-label small text-muted-sc mb-1">Observaciones</label>
            <textarea id="cliente-nuevo-obs" className="form-control form-control-sm" value={nuevo.observaciones} onChange={(e) => setNuevo({ ...nuevo, observaciones: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Clientes;
