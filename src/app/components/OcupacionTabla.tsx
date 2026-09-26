import React from 'react';
import { ReporteOcupacion } from '../api/notificaciones';

// Horas utilizadas y disponibles por cancha en el período (horario de atención 08:00 a 22:00).
const OcupacionTabla: React.FC<{ data: ReporteOcupacion[] }> = ({ data }) => {
  if (data.length === 0) return <div className="text-muted-sc" style={{ fontSize: 13 }}>Sin canchas para mostrar.</div>;
  return (
    <div className="table-responsive-sc">
      <table className="table-sc mb-0">
        <thead>
          <tr><th>Cancha</th><th style={{ textAlign: "right" }}>Horas usadas</th><th style={{ textAlign: "right" }}>Horas disponibles</th><th style={{ textAlign: "right" }}>Ocupación</th></tr>
        </thead>
        <tbody>
          {data.map((o) => {
            const total = o.horasUtilizadas + o.horasDisponibles;
            const pct = total > 0 ? Math.round((o.horasUtilizadas / total) * 100) : 0;
            return (
              <tr key={o.idCancha}>
                <td>{o.cancha}</td>
                <td style={{ textAlign: "right" }}>{o.horasUtilizadas} hs</td>
                <td style={{ textAlign: "right" }}>{o.horasDisponibles} hs</td>
                <td style={{ textAlign: "right" }}>{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="text-muted-sc mt-2" style={{ fontSize: 12 }}>Horas disponibles: turnos libres entre las 08:00 y las 22:00 en el período elegido.</div>
    </div>
  );
};

export default OcupacionTabla;
