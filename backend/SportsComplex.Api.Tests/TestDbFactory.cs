using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;

namespace SportsComplex.Api.Tests;

public static class TestDbFactory
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    /// <summary>Contexto que simula a un usuario logueado (para probar la auditoría automática).</summary>
    public static AppDbContext CreateComo(int idUsuario)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options, new UsuarioFijo(idUsuario));
    }

    private sealed class UsuarioFijo : IUsuarioActual
    {
        public UsuarioFijo(int id) { IdUsuario = id; }
        public int? IdUsuario { get; }
    }
}
