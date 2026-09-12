import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { usuariosApi, Usuario } from '../api/usuarios';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

const vacio = { nombreCompleto: '', username: '', password: '', rol: 'empleado' as Usuario['rol'] };

const Usuarios: React.FC = () => {
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState(vacio);

  const cargar = () => {
    setLoading(true);
    usuariosApi.getAll()
      .then(setUsuarios)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar usuarios.'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

  const toggleEstado = async (u: Usuario) => {
    setError(null);
    try {
      if (u.activo) await usuariosApi.desactivar(u.idUsuario);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cambiar el estado.');
    }
  };

  const eliminarUsuario = async (u: Usuario) => {
    if (!window.confirm(`¿Confirma eliminar a ${u.nombreCompleto}? Esta acción no se puede deshacer.`)) return;
    setError(null);
    try {
      await usuariosApi.delete(u.idUsuario);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al eliminar el usuario.');
    }
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    setError(null);
    try {
      await usuariosApi.update(editando.idUsuario, { nombreCompleto: editando.nombreCompleto, rol: editando.rol });
      setEditando(null);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar el usuario.');
    }
  };

  const crearUsuario = async () => {
    if (!nuevo.nombreCompleto || !nuevo.username || !nuevo.password) {
      setError('Nombre, username y contraseña son obligatorios.');
      return;
    }
    setError(null);
    try {
      await usuariosApi.create(nuevo);
      setNuevo(vacio);
      setCreando(false);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al crear el usuario.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Administración de usuarios del sistema"
        action={
          <button type="button" className="btn btn-sc-primary text-white" onClick={() => setCreando(true)}>
            Crear usuario
          </button>
        }
      />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="sc-card">
        {loading ? (
          <div className="text-muted-sc p-3">Cargando usuarios…</div>
        ) : (
          <div className="table-responsive-sc">
            <table className="table-sc mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Username</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha de creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.idUsuario}>
                    <td>{u.nombreCompleto}</td>
                    <td>{u.username}</td>
                    <td>{u.rol === 'administrador' ? 'Administrador' : 'Empleado'}</td>
                    <td><StatusBadge label={u.activo ? 'Activo' : 'Inactivo'} /></td>
                    <td>{new Date(u.fechaCreacion).toLocaleDateString('es-AR')}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditando({ ...u })}>Editar</button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => toggleEstado(u)}
                          disabled={!u.activo || u.idUsuario === usuarioActual?.idUsuario}
                          title={u.idUsuario === usuarioActual?.idUsuario ? 'No podés desactivar tu propia cuenta' : ''}
                        >
                          {u.activo ? 'Desactivar' : 'Inactivo'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminarUsuario(u)}
                          disabled={u.idUsuario === usuarioActual?.idUsuario}
                          title={u.idUsuario === usuarioActual?.idUsuario ? 'No podés eliminar tu propia cuenta' : ''}
                        >
                          Eliminar
                        </button>
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
          title="Editar usuario"
          onClose={() => setEditando(null)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditando(null)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={guardarEdicion}>Guardar cambios</button>
            </>
          }
        >
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Nombre</label>
            <input type="text" className="form-control form-control-sm" value={editando.nombreCompleto} onChange={(e) => setEditando({ ...editando, nombreCompleto: e.target.value })} />
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Rol</label>
            <select className="form-select form-select-sm" value={editando.rol} onChange={(e) => setEditando({ ...editando, rol: e.target.value as Usuario['rol'] })}>
              <option value="administrador">Administrador</option>
              <option value="empleado">Empleado</option>
            </select>
          </div>
        </Modal>
      )}

      {creando && (
        <Modal
          title="Crear usuario"
          onClose={() => setCreando(false)}
          confirmClose={!!(nuevo.nombreCompleto || nuevo.username || nuevo.password)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCreando(false)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={crearUsuario}>Crear</button>
            </>
          }
        >
          <div className="mb-2">
            <label htmlFor="usuario-nuevo-nombre" className="form-label small text-muted-sc mb-1">Nombre</label>
            <input id="usuario-nuevo-nombre" type="text" className={`form-control form-control-sm ${error && !nuevo.nombreCompleto ? 'is-invalid' : ''}`} value={nuevo.nombreCompleto} onChange={(e) => setNuevo({ ...nuevo, nombreCompleto: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="usuario-nuevo-username" className="form-label small text-muted-sc mb-1">Username</label>
            <input id="usuario-nuevo-username" type="text" className={`form-control form-control-sm ${error && !nuevo.username ? 'is-invalid' : ''}`} value={nuevo.username} onChange={(e) => setNuevo({ ...nuevo, username: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="usuario-nuevo-password" className="form-label small text-muted-sc mb-1">Contraseña</label>
            <input id="usuario-nuevo-password" type="password" className={`form-control form-control-sm ${error && !nuevo.password ? 'is-invalid' : ''}`} value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="usuario-nuevo-rol" className="form-label small text-muted-sc mb-1">Rol</label>
            <select id="usuario-nuevo-rol" className="form-select form-select-sm" value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value as Usuario['rol'] })}>
              <option value="administrador">Administrador</option>
              <option value="empleado">Empleado</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Usuarios;
