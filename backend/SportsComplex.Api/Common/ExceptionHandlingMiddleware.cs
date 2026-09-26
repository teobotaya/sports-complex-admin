using System.Net;
using System.Text.Json;

namespace SportsComplex.Api.Common;

/// <summary>Traduce excepciones de negocio a respuestas HTTP consistentes en JSON.</summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var status = ex switch
            {
                NotFoundException => HttpStatusCode.NotFound,
                BusinessRuleException => HttpStatusCode.BadRequest,
                ConflictException => HttpStatusCode.Conflict,
                UnauthorizedException => HttpStatusCode.Unauthorized,
                // Dos personas guardando lo mismo a la vez (ej. el mismo turno): lo frena la base.
                Microsoft.EntityFrameworkCore.DbUpdateException => HttpStatusCode.Conflict,
                _ => HttpStatusCode.InternalServerError
            };

            if (status == HttpStatusCode.InternalServerError)
                _logger.LogError(ex, "Error no controlado procesando {Path}", context.Request.Path);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)status;

            var payload = JsonSerializer.Serialize(new
            {
                error = status switch
                {
                    HttpStatusCode.InternalServerError => "Ocurrió un error interno.",
                    _ when ex is Microsoft.EntityFrameworkCore.DbUpdateException =>
                        "No se pudo guardar porque otro usuario acaba de registrar un dato igual (por ejemplo, el mismo turno). Actualizá la pantalla e intentá de nuevo.",
                    _ => ex.Message
                }
            });

            await context.Response.WriteAsync(payload);
        }
    }
}
