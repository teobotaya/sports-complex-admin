using Microsoft.AspNetCore.Mvc;

namespace SportsComplex.Api.Common;

/// <summary>
/// Reemplaza la respuesta automática de ASP.NET ("One or more validation errors occurred")
/// por un mensaje en español que indica qué dato revisar.
/// </summary>
public static class ValidacionEnEspanol
{
    private static readonly Dictionary<string, string> Nombres = new(StringComparer.OrdinalIgnoreCase)
    {
        ["desde"] = "Desde",
        ["hasta"] = "Hasta",
        ["fecha"] = "Fecha",
        ["horaInicio"] = "Hora de inicio",
        ["horaFin"] = "Hora de fin",
        ["monto"] = "Monto",
        ["montoDevuelto"] = "Monto a devolver",
        ["precioPorHora"] = "Precio por hora",
        ["fechaInicio"] = "Fecha de inicio",
        ["fechaFin"] = "Fecha de fin",
        ["idCliente"] = "Cliente",
        ["idCancha"] = "Cancha",
        ["golesLocal"] = "Goles del local",
        ["golesVisitante"] = "Goles del visitante",
    };

    public static IActionResult Respuesta(ActionContext context)
    {
        var campos = context.ModelState
            .Where(e => e.Value?.Errors.Count > 0)
            .Select(e => Nombre(e.Key))
            .Where(n => n.Length > 0)
            .Distinct()
            .ToList();

        var mensaje = campos.Count == 0
            ? "Los datos enviados no son válidos. Revisá el formulario."
            : $"Revisá los datos ingresados: {string.Join(", ", campos)}.";

        return new BadRequestObjectResult(new { error = mensaje });
    }

    private static string Nombre(string clave)
    {
        // Claves posibles: "desde", "dto", "$.horaInicio", "dto.HoraInicio"
        var limpio = clave.TrimStart('$', '.');
        var ultimo = limpio.Contains('.') ? limpio[(limpio.LastIndexOf('.') + 1)..] : limpio;
        if (ultimo.Equals("dto", StringComparison.OrdinalIgnoreCase)) return string.Empty;
        return Nombres.TryGetValue(ultimo, out var nombre) ? nombre : ultimo;
    }
}
