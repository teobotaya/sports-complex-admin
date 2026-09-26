namespace SportsComplex.Api.Common;

/// <summary>
/// Fecha y hora del complejo (Argentina, UTC-3). Se usa para todas las fechas que ve el personal
/// (fecha de pago, alta de cliente, devolución, "hoy" de las notificaciones). Con la hora UTC, un
/// pago registrado después de las 21:00 quedaba con la fecha del día siguiente.
/// </summary>
public static class Reloj
{
    private static readonly TimeZoneInfo Zona = ObtenerZona();

    private static TimeZoneInfo ObtenerZona()
    {
        foreach (var id in new[] { "America/Argentina/Buenos_Aires", "Argentina Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }
        return TimeZoneInfo.CreateCustomTimeZone("UTC-3", TimeSpan.FromHours(-3), "UTC-3", "UTC-3");
    }

    public static DateTime Ahora => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Zona);
    public static DateOnly Hoy => DateOnly.FromDateTime(Ahora);
}
