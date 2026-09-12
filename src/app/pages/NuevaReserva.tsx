import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { clientesApi, Cliente } from '../api/clientes';
import { canchasApi, Cancha } from '../api/canchas';
import { reservasApi } from '../api/reservas';
import { ApiError } from '../api/client';

const NuevaReserva: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const clientePreseleccionado = query.get('clienteId') ?? '';
  const canchaPreseleccionada = query.get('canchaId') ?? '';
  const fechaPreseleccionada = query.get('fecha') ?? '';
  const horaPreseleccionada = query.get('hora') ?? '';
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [clienteId, setClienteId] = useState(clientePreseleccionado);
  const [canchaId, setCanchaId] = useState(canchaPreseleccionada);
  const [fecha, setFecha] = useState(fechaPreseleccionada);
  const [horaInicio, setHoraInicio] = useState(horaPreseleccionada);
  const [horaFin, setHoraFin] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([clientesApi.getAll(), canchasApi.getAll()])
      .then(([c, ca]) => { setClientes(c); setCanchas(ca.filter((x) => x.activa)); })
      .catch(() => setError('Error al cargar clientes o canchas.'));
  }, []);

  const camposCompletos = clienteId && canchaId && fecha && horaInicio && horaFin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camposCompletos) return;
    setEnviando(true);
    setError(null);
    try {
      await reservasApi.create({
        idCliente: Number(clienteId),
        idCancha: Number(canchaId),
        fecha,
        horaInicio,
        horaFin,
        observaciones: observaciones || null,
      });
      history.push('/reservas', { successMessage: 'Reserva registrada correctamente.' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear la reserva.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <PageHeader title="Nueva Reserva" subtitle="Cargar un nuevo turno para un cliente" />

      <div className="row">
        <div className="col-lg-7">
          <div className="sc-card">
            <div className="sc-card-body">
                <form onSubmit={handleSubmit}>
                  {error && <div className="availability-msg availability-fail mb-3">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="reserva-cliente" className="form-label small text-muted-sc mb-1">Cliente</label>
                      <select id="reserva-cliente" className="form-select" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
                        <option value="">Seleccionar cliente…</option>
                        {clientes.map((c) => (
                          <option key={c.idCliente} value={c.idCliente}>{c.nombreCompleto}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="reserva-cancha" className="form-label small text-muted-sc mb-1">Cancha</label>
                      <select id="reserva-cancha" className="form-select" value={canchaId} onChange={(e) => setCanchaId(e.target.value)} required>
                        <option value="">Seleccionar cancha…</option>
                        {canchas.map((c) => (
                          <option key={c.idCancha} value={c.idCancha}>{c.nombre} — {c.tipoSuperficie}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="reserva-fecha" className="form-label small text-muted-sc mb-1">Fecha</label>
                      <input id="reserva-fecha" type="date" className="form-control" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="reserva-hora-inicio" className="form-label small text-muted-sc mb-1">Hora de inicio</label>
                      <input id="reserva-hora-inicio" type="time" className="form-control" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="reserva-hora-fin" className="form-label small text-muted-sc mb-1">Hora de finalización</label>
                      <input id="reserva-hora-fin" type="time" className="form-control" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
                    </div>
                    <div className="col-12">
                      <label htmlFor="reserva-obs" className="form-label small text-muted-sc mb-1">Observaciones</label>
                      <textarea id="reserva-obs" className="form-control" rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" />
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <button type="submit" className="btn btn-sc-primary text-white" disabled={!camposCompletos || enviando}>
                      {enviando ? 'Guardando…' : 'Confirmar reserva'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => history.push('/reservas')}>
                      Cancelar
                    </button>
                  </div>
                </form>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="sc-card">
            <div className="sc-card-header">
              <h2>Ayuda</h2>
            </div>
            <div className="sc-card-body">
              <p className="text-muted-sc" style={{ fontSize: 13 }}>
                Seleccioná cliente, cancha, fecha y horario. El servidor valida la disponibilidad
                real contra la base de datos e impide superposiciones de turnos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuevaReserva;
