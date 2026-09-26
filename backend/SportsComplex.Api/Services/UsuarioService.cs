using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Services;

public class UsuarioService
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _tokenService;
    private readonly PasswordHasher<Usuario> _passwordHasher = new();

    private static readonly string[] RolesValidos = { "administrador", "empleado" };

    public UsuarioService(AppDbContext db, JwtTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (usuario is null || !usuario.Activo)
            throw new UnauthorizedException("Usuario o contraseña inválidos.");

        var result = _passwordHasher.VerifyHashedPassword(usuario, usuario.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            throw new UnauthorizedException("Usuario o contraseña inválidos.");

        var token = _tokenService.GenerateToken(usuario);
        return new LoginResponse(token, ToDto(usuario));
    }

    public async Task<List<UsuarioDto>> GetAllAsync()
    {
        return await _db.Usuarios.OrderBy(u => u.NombreCompleto)
            .Select(u => new UsuarioDto(u.IdUsuario, u.NombreCompleto, u.Username, u.Rol, u.Activo, u.FechaCreacion))
            .ToListAsync();
    }

    public async Task<UsuarioDto> CreateAsync(CrearUsuarioDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.NombreCompleto) || string.IsNullOrWhiteSpace(dto.Username))
            throw new BusinessRuleException("El nombre completo y el nombre de usuario son obligatorios.");
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
            throw new BusinessRuleException("La contraseña debe tener al menos 8 caracteres.");
        if (!RolesValidos.Contains(dto.Rol))
            throw new BusinessRuleException("El rol debe ser 'administrador' o 'empleado'.");

        if (await _db.Usuarios.AnyAsync(u => u.Username == dto.Username))
            throw new ConflictException("Ya existe un usuario con ese nombre de usuario.");

        var usuario = new Usuario
        {
            NombreCompleto = dto.NombreCompleto,
            Username = dto.Username,
            Rol = dto.Rol,
            Activo = true,
            FechaCreacion = Reloj.Ahora
        };
        usuario.PasswordHash = _passwordHasher.HashPassword(usuario, dto.Password);

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
        return ToDto(usuario);
    }

    public async Task<UsuarioDto> UpdateAsync(int id, ActualizarUsuarioDto dto, int idUsuarioActual)
    {
        if (string.IsNullOrWhiteSpace(dto.NombreCompleto))
            throw new BusinessRuleException("El nombre completo es obligatorio.");
        if (!RolesValidos.Contains(dto.Rol))
            throw new BusinessRuleException("El rol debe ser 'administrador' o 'empleado'.");

        // Evita que el sistema quede sin administrador: nadie puede quitarse a sí mismo ese rol.
        if (id == idUsuarioActual && dto.Rol != "administrador")
            throw new BusinessRuleException("El administrador no puede quitarse a sí mismo el rol de administrador.");

        var usuario = await _db.Usuarios.FindAsync(id)
            ?? throw new NotFoundException("Usuario no encontrado.");

        if (!string.IsNullOrEmpty(dto.NuevaPassword))
        {
            if (dto.NuevaPassword.Length < 8)
                throw new BusinessRuleException("La contraseña debe tener al menos 8 caracteres.");
            usuario.PasswordHash = _passwordHasher.HashPassword(usuario, dto.NuevaPassword);
        }

        usuario.NombreCompleto = dto.NombreCompleto;
        usuario.Rol = dto.Rol;
        await _db.SaveChangesAsync();
        return ToDto(usuario);
    }

    public async Task DesactivarAsync(int id, int idUsuarioActual)
    {
        if (id == idUsuarioActual)
            throw new BusinessRuleException("El administrador no puede desactivar su propia cuenta.");

        var usuario = await _db.Usuarios.FindAsync(id)
            ?? throw new NotFoundException("Usuario no encontrado.");

        usuario.Activo = false;
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id, int idUsuarioActual)
    {
        if (id == idUsuarioActual)
            throw new BusinessRuleException("El administrador no puede eliminar su propia cuenta.");

        var usuario = await _db.Usuarios.FindAsync(id)
            ?? throw new NotFoundException("Usuario no encontrado.");

        // Si ya operó en el sistema, borrarlo rompería la auditoría: se lo desactiva en su lugar.
        var tieneHistorial = await _db.Reservas.AnyAsync(r => r.IdUsuario == id)
            || await _db.Cancelaciones.AnyAsync(c => c.IdUsuario == id)
            || await _db.Pagos.AnyAsync(p => p.IdUsuario == id)
            || await _db.Devoluciones.AnyAsync(d => d.IdUsuario == id)
            || await _db.Auditorias.AnyAsync(a => a.IdUsuario == id);
        if (tieneHistorial)
            throw new BusinessRuleException("No se puede eliminar un usuario que ya registró operaciones en el sistema. Podés desactivarlo en su lugar.");

        var notificaciones = _db.Notificaciones.Where(n => n.IdUsuario == id);
        _db.Notificaciones.RemoveRange(notificaciones);
        _db.Usuarios.Remove(usuario);
        await _db.SaveChangesAsync();
    }

    private static UsuarioDto ToDto(Usuario u) =>
        new(u.IdUsuario, u.NombreCompleto, u.Username, u.Rol, u.Activo, u.FechaCreacion);
}
