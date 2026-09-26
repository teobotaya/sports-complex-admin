using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Data;

namespace SportsComplex.Api.Common;

/// <summary>
/// En cada pedido autenticado verifica que el usuario del token siga activo y con el mismo rol.
/// Así, desactivar a un empleado o cambiarle el rol corta su sesión de inmediato,
/// sin esperar a que venza el token.
/// </summary>
public static class SesionVigente
{
    public static async Task ValidarAsync(TokenValidatedContext context)
    {
        var principal = context.Principal;
        if (principal is null) { context.Fail("Sesión inválida."); return; }

        var idUsuario = principal.GetUserId();
        var rolToken = principal.FindFirstValue(ClaimTypes.Role);

        var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
        var usuario = await db.Usuarios.AsNoTracking()
            .Where(u => u.IdUsuario == idUsuario)
            .Select(u => new { u.Activo, u.Rol })
            .FirstOrDefaultAsync();

        if (usuario is null || !usuario.Activo || usuario.Rol != rolToken)
            context.Fail("La sesión ya no es válida. Iniciá sesión nuevamente.");
    }
}
