namespace SportsComplex.Api.Common;

/// <summary>
/// Los turnos de cancha se asignan solo en horas enteras (18:00 a 19:00, 19:00 a 20:00…).
/// No se permiten fracciones (18:01, 18:15, 18:30): cualquier llegada tarde o temprana
/// se deja asentada a mano en el campo Observaciones de la reserva.
/// </summary>
public static class ReglasHorario
{
    /// <summary>Horario de atención del complejo: primer turno 08:00, último turno termina 22:00.</summary>
    public const int HoraApertura = 8;
    public const int HoraCierre = 22;
    public const int HorasPorDia = HoraCierre - HoraApertura;

    public static bool EsHoraEntera(TimeOnly hora) =>
        hora.Minute == 0 && hora.Second == 0 && hora.Millisecond == 0;

    public static void ValidarTurno(TimeOnly inicio, TimeOnly fin)
    {
        if (!EsHoraEntera(inicio) || !EsHoraEntera(fin))
            throw new BusinessRuleException(
                "Los turnos solo pueden empezar y terminar en horas enteras (por ejemplo 18:00 a 19:00). " +
                "Si el cliente llegó antes o después, anotalo en Observaciones.");

        if (fin <= inicio)
            throw new BusinessRuleException("La hora de fin debe ser posterior a la hora de inicio.");
    }

    public static void ValidarInicioPartido(TimeOnly inicio)
    {
        if (!EsHoraEntera(inicio))
            throw new BusinessRuleException("Los partidos solo pueden programarse en horas enteras (por ejemplo 20:00).");
    }
}
