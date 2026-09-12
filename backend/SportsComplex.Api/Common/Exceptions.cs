namespace SportsComplex.Api.Common;

/// <summary>Entidad solicitada no existe (HTTP 404).</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

/// <summary>Violación de regla de negocio o dato inválido (HTTP 400).</summary>
public class BusinessRuleException : Exception
{
    public BusinessRuleException(string message) : base(message) { }
}

/// <summary>Conflicto con el estado actual del recurso, ej. duplicados (HTTP 409).</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>Credenciales inválidas o cuenta inactiva (HTTP 401).</summary>
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message) { }
}
