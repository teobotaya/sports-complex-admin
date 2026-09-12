import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { isoDate } from '../../data/mock';
import { reservasApi, Reserva } from '../api/reservas';
import { canchasApi, Cancha } from '../api/canchas';
import { ApiError } from '../api/client';

const HORAS = Array.from({ length: 14 }, (_, i) => 8 + i); // 08 a 21 hs

const toneClass: Record<Reserva['estadoReserva'], string> = {
  Confirmada: 'agenda-slot-confirmada',
  Pendiente: 'agenda-slot-pendiente',
  Cancelada: 'agenda-slot-cancelada',
};

const Agenda: React.FC = () => {
  const history = useHistory();
  const [fecha, setFecha] = useState(isoDate(0));
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([canchasApi.getAll(), reservasApi.getAll({ fecha })])
      .then(([c, r]) => { setCanchas(c.filter((x) => x.activa)); setReservas(r); })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error al cargar la agenda.'))
      .finally(() => setLoading(false));
  }, [fecha]);

  const reservaEn = (idCancha: number, hora: string) =>
    reservas.find((r) => r.idCancha === idCancha && r.horaInicio <= hora && r.horaFin > hora);

  const irANuevaReserva = (idCancha: number, hora: string) =>
    history.push(`/nueva-reserva?canchaId=${idCancha}&fecha=${fecha}&hora=${hora}`);

  return (
    <div>
      <PageHeader
        title="Agenda del día"
        subtitle="Ocupación de canchas por franja horaria"
        action={
          <div className="d-flex gap-2 align-items-end no-print">
            <div className="btn-group btn-group-sm">
              <button type="button" className={`btn btn-outline-secondary ${fecha === isoDate(0) ? 'active' : ''}`} onClick={() => setFecha(isoDate(0))}>Hoy</button>
              <button type="button" className={`btn btn-outline-secondary ${fecha === isoDate(1) ? 'active' : ''}`} onClick={() => setFecha(isoDate(1))}>Mañana</button>
            </div>
            <input type="date" className="form-control form-control-sm" style={{ width: 150 }} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        }
      />

      {error && <div className="availability-msg availability-fail mb-3">{error}</div>}

      <div className="d-flex gap-3 mb-3 no-print" style={{ fontSize: 12.5 }}>
        <span className="d-flex align-items-center gap-1"><span className="status-dot-disponible" style={{ width: 9, height: 9, borderRadius: '50%', display: 'inline-block' }} /> Confirmada</span>
        <span className="d-flex align-items-center gap-1"><span className="status-dot-mantenimiento" style={{ width: 9, height: 9, borderRadius: '50%', display: 'inline-block' }} /> Pendiente</span>
        <span className="d-flex align-items-center gap-1"><span className="status-dot-ocupada" style={{ width: 9, height: 9, borderRadius: '50%', display: 'inline-block' }} /> Cancelada</span>
        <span className="text-muted-sc">Hacé clic en un horario libre para reservarlo</span>
      </div>

      <div className="sc-card">
        {loading ? (
          <div className="text-muted-sc p-3">Cargando agenda…</div>
        ) : canchas.length === 0 ? (
          <div className="text-muted-sc p-3">No hay canchas activas para mostrar.</div>
        ) : (
          <div className="agenda-grid-wrap">
            <div className="agenda-grid" style={{ gridTemplateColumns: `140px repeat(${HORAS.length}, minmax(96px, 1fr))` }}>
              <div className="agenda-cell agenda-corner">Cancha</div>
              {HORAS.map((h) => (
                <div key={h} className="agenda-cell agenda-hour-head">{String(h).padStart(2, '0')}:00</div>
              ))}
              {canchas.map((c) => (
                <React.Fragment key={c.idCancha}>
                  <div className="agenda-cell agenda-court-label">{c.nombre}</div>
                  {HORAS.map((h) => {
                    const hora = `${String(h).padStart(2, '0')}:00`;
                    const r = reservaEn(c.idCancha, hora);
                    return (
                      <div key={h} className="agenda-cell agenda-slot-wrap">
                        {r ? (
                          <div className={`agenda-slot ${toneClass[r.estadoReserva]}`} title={`${r.clienteNombre} · ${r.horaInicio}-${r.horaFin}`}>
                            {r.clienteNombre}
                          </div>
                        ) : (
                          <button type="button" className="agenda-slot agenda-slot-free" onClick={() => irANuevaReserva(c.idCancha, hora)}>
                            +
                          </button>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agenda;
