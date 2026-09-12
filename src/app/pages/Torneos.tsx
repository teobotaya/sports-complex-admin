import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { torneosApi, Torneo } from '../api/torneos';
import { ApiError } from '../api/client';

const vacio = { nombre: '', fechaInicio: '', fechaFin: '', categoria: '' };

const Torneos: React.FC = () => {
  const history = useHistory();
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState(vacio);

  const cargar = () => {
    setLoading(true);
    torneosApi.getAll()
      .then(setTorneos)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar torneos.'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

  const crearTorneo = async () => {
    if (!nuevo.nombre || !nuevo.fechaInicio || !nuevo.fechaFin) {
      setError('Nombre, fecha de inicio y fecha de fin son obligatorios.');
      return;
    }
    setError(null);
    try {
      const creado = await torneosApi.create({ ...nuevo, categoria: nuevo.categoria || null });
      setNuevo(vacio);
      setCreando(false);
      history.push(`/torneos/${creado.idTorneo}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al crear el torneo.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Torneos"
        subtitle="Torneos organizados por el complejo"
        action={
          <button type="button" className="btn btn-sc-primary text-white" onClick={() => setCreando(true)}>
            Crear torneo
          </button>
        }
      />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="row g-3">
        {loading ? (
          <div className="text-muted-sc p-3">Cargando torneos…</div>
        ) : (
          torneos.map((t) => (
            <div className="col-md-6 col-xl-4" key={t.idTorneo}>
              <div className="sc-card h-100">
                <div className="sc-card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{t.nombre}</h3>
                    <StatusBadge label={t.estado} />
                  </div>
                  <div className="text-muted-sc mb-3" style={{ fontSize: 12.5 }}>{t.categoria}</div>
                  <div className="detail-row"><span className="detail-row-label">Inicio</span><span className="detail-row-value">{t.fechaInicio}</span></div>
                  <div className="detail-row"><span className="detail-row-label">Fin</span><span className="detail-row-value">{t.fechaFin}</span></div>
                  <div className="detail-row"><span className="detail-row-label">Equipos</span><span className="detail-row-value">{t.cantidadEquipos}</span></div>
                  <div className="detail-row"><span className="detail-row-label">Partidos</span><span className="detail-row-value">{t.cantidadPartidos}</span></div>
                  <button type="button" className="btn btn-sm btn-sc-primary text-white w-100 mt-3" onClick={() => history.push(`/torneos/${t.idTorneo}`)}>
                    Ver detalle
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {creando && (
        <Modal
          title="Crear torneo"
          onClose={() => setCreando(false)}
          confirmClose={!!(nuevo.nombre || nuevo.categoria || nuevo.fechaInicio || nuevo.fechaFin)}
          footer={
            <>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCreando(false)}>Cancelar</button>
              <button type="button" className="btn btn-sm btn-sc-primary text-white" onClick={crearTorneo}>Crear</button>
            </>
          }
        >
          <div className="mb-2">
            <label htmlFor="torneo-nombre" className="form-label small text-muted-sc mb-1">Nombre</label>
            <input id="torneo-nombre" type="text" className={`form-control form-control-sm ${error && !nuevo.nombre ? 'is-invalid' : ''}`} value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="torneo-categoria" className="form-label small text-muted-sc mb-1">Categoría</label>
            <input id="torneo-categoria" type="text" className="form-control form-control-sm" value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="torneo-fecha-inicio" className="form-label small text-muted-sc mb-1">Fecha inicio</label>
            <input id="torneo-fecha-inicio" type="date" className={`form-control form-control-sm ${error && !nuevo.fechaInicio ? 'is-invalid' : ''}`} value={nuevo.fechaInicio} onChange={(e) => setNuevo({ ...nuevo, fechaInicio: e.target.value })} />
          </div>
          <div className="mb-2">
            <label htmlFor="torneo-fecha-fin" className="form-label small text-muted-sc mb-1">Fecha fin</label>
            <input id="torneo-fecha-fin" type="date" className={`form-control form-control-sm ${error && !nuevo.fechaFin ? 'is-invalid' : ''}`} value={nuevo.fechaFin} onChange={(e) => setNuevo({ ...nuevo, fechaFin: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Torneos;
