namespace SportsComplex.Api.Common;

/// <summary>Usuario que está haciendo el pedido actual; lo usa la auditoría automática.</summary>
public interface IUsuarioActual
{
    int? IdUsuario { get; }
}

public class UsuarioActualHttp : IUsuarioActual
{
    private readonly IHttpContextAccessor _accessor;

    public UsuarioActualHttp(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public int? IdUsuario
    {
        get
        {
            var user = _accessor.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated != true) return null;
            var id = user.GetUserId();
            return id > 0 ? id : null;
        }
    }
}
