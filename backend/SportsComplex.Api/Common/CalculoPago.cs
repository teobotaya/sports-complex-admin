namespace SportsComplex.Api.Common;

/// <summary>
/// Cálculo del importe de una reserva y de su estado de pago.
/// Se usa al registrar un pago, al editar la reserva y al cambiar el precio de la cancha,
/// para que el estado de pago siempre coincida con lo que realmente se debe.
/// </summary>
public static class CalculoPago
{
    public static decimal ImporteTotal(TimeOnly inicio, TimeOnly fin, decimal precioPorHora) =>
        precioPorHora * (decimal)(fin.ToTimeSpan() - inicio.ToTimeSpan()).TotalHours;

    public static string Estado(decimal totalPagado, decimal importeTotal) =>
        totalPagado <= 0 ? "Pendiente"
        : totalPagado < importeTotal ? "Parcialmente abonado"
        : "Abonado";
}
