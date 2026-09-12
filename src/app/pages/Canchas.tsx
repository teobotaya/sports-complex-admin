import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { canchasApi, Cancha } from '../api/canchas';
import { ApiError } from '../api/client';

const vacio = { nombre: '', tipoSuperficie: '', precioPorHora: 0 };

const Canchas: React.FC = () => {
  const history = useHistory();
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Cancha | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState(vacio);

  const cargar = () => {
    setLoading(true);
    canchasApi.getAll()
      .then(setCanchas)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar canchas.'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

  const guardarEdicion = async () => {
    if (!editando) return;
    try {
      await canchasApi.update(editando.idCancha, {
        nombre: editando.nombre,
        tipoSuperficie: editando.tipoSuperficie,
        precioPorHora: editando.precioPorHora,
        activa: editando.activa,
      });
      setEditando(null);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar la cancha.');
    }
  };

  const crearCancha = async () => {
    if (!nuevo.nombre || nuevo.precioPorHora <= 0) {
      setError('El nombre es obligatorio y el precio por hora debe ser mayor a cero.');
      return;
    }
    setError(null);
    try {
      await canchasApi.create(nuevo);
      setNuevo(vacio);
      setCreando(false);
      cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al crear la cancha.');
    }
  };

  if (loading) return <div className="text-muted-sc p-3">Cargando canchas…</div>;

  return (
    <div>
      <PageHeader
        title="Canchas"
        subtitle="Canchas disponibles en el complejo"
        action={
          <button type="button" className="btn btn-sc-primary text-white" onClick={() => setCreando(true)}>
            Agregar cancha
          </button>
        }
      />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="row g-3">
        {canchas.map((c) => (
          <div className="col-md-6 col-xl-3" key={c.idCancha}>
            <div className="sc-card h-100">
              <div className="sc-card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{c.nombre}</h3>
                  <StatusBadge label={c.activa ? 'Disponible' : 'Mantenimiento'} />
                </div>
                <div className="text-muted-sc mb-3" style={{ fontSize: 12.5 }}>{c.tipoSuperficie}</div>
                <div className="detail-row"><span className="detail-row-label">Precio/hora</span><span className="detail-row-value">${c.precioPorHora.toLocaleString('es-AR')}</span></div>
                <div className="d-flex gap-2 mt-3">
                  <button type="button" className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => history.push(`/reservas?cancha=${c.idCancha}`)}>Ver agenda</button>
                  <button type="button" className="btn btn-sm btn-sc-primary text-white flex-fill" onClick={() => setEditando({ ...c })}>Editar</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <Modal
          title="Editar cancha"
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
            <input type="text" className="form-control form-control-sm" value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} />
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Tipo / Superficie</label>
            <input type="text" className="form-control form-control-sm" value={editando.tipoSuperficie ?? ''} onChange={(e) => setEditando({ ...editando, tipoSuperficie: e.target.value })} />
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Precio por hora</label>
            <input type="number" className="form-control form-control-sm" value={editando.precioPorHora} onChange={(e) => setEditando({ ...editando, precioPorHora: Number(e.target.value) })} />
          </div>
          <div className="mb-2">
            <label className="form-label small text-muted-sc mb-1">Estado</label>
            <select className="form-select form-select-sm" value={editando.activa ? '1' : '0'} onChange={(e) => setEditando({ ...editando, activa: e.target.value === '1' })}>
              <option value="1">Activa</option>
              <option value="0">Inactiva</option>
            </select>
          </div>
        </Modal>
      )}

      {creando && (
        <Modal
          title="Agregar cancha"
          onClose={() => setCreando(false)}
          confirmClose={!!(nuevo.nombre || nuevo.tipoSuperficie || nuevo.precioPorHora > 0)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCreando(false)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={crearCancha}>Crear</button>
            </>
          }
        >
          <div className="mb-2">
            <label htmlFor="cancha-nueva-nombre" className="form-label small text-muted-sc mb-1">Nombre</label>
            <input id="cancha-nueva-nombre" type="text" className={`form-control form-control-sm ${error && !nuevo.nombre ? 'is-invalid' : ''}`} value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="cancha-nueva-tipo" className="form-label small text-muted-sc mb-1">Tipo / Superficie</label>
            <input id="cancha-nueva-tipo" type="text" className="form-control form-control-sm" value={nuevo.tipoSuperficie} onChange={(e) => setNuevo({ ...nuevo, tipoSuperficie: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="cancha-nueva-precio" className="form-label small text-muted-sc mb-1">Precio por hora</label>
            <input id="cancha-nueva-precio" type="number" className={`form-control form-control-sm ${error && nuevo.precioPorHora <= 0 ? 'is-invalid' : ''}`} value={nuevo.precioPorHora} onChange={(e) => setNuevo({ ...nuevo, precioPorHora: Number(e.target.value) })} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Canchas;
