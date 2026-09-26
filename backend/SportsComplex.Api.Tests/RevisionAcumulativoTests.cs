using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Common;
using SportsComplex.Api.Data;
using SportsComplex.Api.Dtos;
using SportsComplex.Api.Entities;
using SportsComplex.Api.Services;
using Xunit;

namespace SportsComplex.Api.Tests;

/// <summary>Pruebas de las correcciones hechas al revisar el sistema contra el Trabajo Acumulativo.</summary>
public class RevisionAcumulativoTests
{
    private static readonly DateOnly Pasado = new(2026, 9, 20);
    private static readonly DateOnly Futuro = new(2030, 10, 1);

    private static async Task<(AppDbContext db, Cancha cancha, Cliente cliente)> BaseAsync(AppDbContext? db = null, decimal precio = 10000)
    {
        db ??= TestDbFactory.Create();
        var cancha = new Cancha { Nombre = "Cancha 1", TipoSuperficie = "Sintetico", PrecioPorHora = precio, Activa = true };
        var cliente = new Cliente { NombreCompleto = "Juan Perez", Telefono = "1122334455", FechaAlta = Pasado };
        db.Canchas.Add(cancha);
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync();
        return (db, cancha, cliente);
    }

    private static Reserva NuevaReserva(Cancha cancha, Cliente cliente, DateOnly fecha, int desde, int hasta, string estado = "Confirmada") => new()
    {
        IdCancha = cancha.IdCancha, IdCliente = cliente.IdCliente, IdUsuario = 1, Fecha = fecha,
        HoraInicio = new TimeOnly(desde, 0), HoraFin = new TimeOnly(hasta, 0),
        EstadoReserva = estado, EstadoPago = "Pendiente", FechaCreacion = DateTime.UtcNow
    };

    // ---------- 1. Estado de pago al editar la reserva ----------

    [Fact]
    public async Task Extender_Reserva_Abonada_La_Pasa_A_Parcialmente_Abonada()
    {
        var (db, cancha, cliente) = await BaseAsync();
        var reservas = new ReservaService(db, new DisponibilidadService(db));
        var r = await reservas.CreateAsync(new CrearReservaDto(cliente.IdCliente, cancha.IdCancha, Futuro, new(18, 0), new(19, 0), null), 1);
        await new PagoService(db).RegistrarAsync(new CrearPagoDto(r.IdReserva, 10000, "Efectivo", null), 1);

        var editada = await reservas.UpdateAsync(r.IdReserva, new ActualizarReservaDto(cancha.IdCancha, Futuro, new(18, 0), new(21, 0), null));

        Assert.Equal("Parcialmente abonado", editada.EstadoPago);
    }

    [Fact]
    public async Task Cambio_De_Precio_Recalcula_Estado_De_Reservas_Futuras()
    {
        var (db, cancha, cliente) = await BaseAsync();
        var r = NuevaReserva(cancha, cliente, Futuro, 18, 19);
        db.Reservas.Add(r);
        await db.SaveChangesAsync();
        await new PagoService(db).RegistrarAsync(new CrearPagoDto(r.IdReserva, 10000, "Efectivo", null), 1);

        await new CanchaService(db).UpdateAsync(cancha.IdCancha, new ActualizarCanchaDto("Cancha 1", "Sintetico", 12000, true));

        Assert.Equal("Parcialmente abonado", (await db.Reservas.FindAsync(r.IdReserva))!.EstadoPago);
    }

    [Fact]
    public async Task Se_Pueden_Editar_Observaciones_Con_La_Cancha_En_Mantenimiento()
    {
        var (db, cancha, cliente) = await BaseAsync();
        var r = NuevaReserva(cancha, cliente, Futuro, 18, 19);
        db.Reservas.Add(r);
        cancha.Activa = false;
        await db.SaveChangesAsync();
        var reservas = new ReservaService(db, new DisponibilidadService(db));

        var editada = await reservas.UpdateAsync(r.IdReserva, new ActualizarReservaDto(cancha.IdCancha, Futuro, new(18, 0), new(19, 0), "Llegó 10 minutos tarde"));
        Assert.Equal("Llegó 10 minutos tarde", editada.Observaciones);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            reservas.UpdateAsync(r.IdReserva, new ActualizarReservaDto(cancha.IdCancha, Futuro, new(19, 0), new(20, 0), null)));
    }

    // ---------- 4. Horario de atención ----------

    [Theory]
    [InlineData(2, 4)]
    [InlineData(7, 9)]
    [InlineData(21, 23)]
    public void Turno_Fuera_Del_Horario_De_Atencion_Es_Rechazado(int desde, int hasta)
    {
        Assert.Throws<BusinessRuleException>(() => ReglasHorario.ValidarTurno(new TimeOnly(desde, 0), new TimeOnly(hasta, 0)));
    }

    [Fact]
    public void Primer_Y_Ultimo_Turno_Del_Dia_Son_Validos()
    {
        ReglasHorario.ValidarTurno(new TimeOnly(8, 0), new TimeOnly(9, 0));
        ReglasHorario.ValidarTurno(new TimeOnly(21, 0), new TimeOnly(22, 0));
        ReglasHorario.ValidarInicioPartido(new TimeOnly(21, 0));
        Assert.Throws<BusinessRuleException>(() => ReglasHorario.ValidarInicioPartido(new TimeOnly(22, 0)));
    }

    // ---------- 6. Torneo finalizado y fechas de partidos ----------

    [Fact]
    public async Task Torneo_Finalizado_No_Puede_Reabrirse()
    {
        await using var db = TestDbFactory.Create();
        var torneo = new Torneo { Nombre = "Apertura", FechaInicio = Pasado, FechaFin = Pasado.AddDays(10), Estado = "Finalizado" };
        db.Torneos.Add(torneo);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() => new TorneoService(db).UpdateAsync(torneo.IdTorneo,
            new ActualizarTorneoDto("Apertura", Pasado, Pasado.AddDays(10), null, "Planificado")));
    }

    [Fact]
    public async Task Partido_Fuera_De_Las_Fechas_Del_Torneo_Es_Rechazado()
    {
        var (db, cancha, _) = await BaseAsync();
        var torneo = new Torneo { Nombre = "Apertura", FechaInicio = Futuro, FechaFin = Futuro.AddDays(30), Estado = "Planificado" };
        var a = new Equipo { Torneo = torneo, Nombre = "A" };
        var b = new Equipo { Torneo = torneo, Nombre = "B" };
        db.AddRange(torneo, a, b);
        await db.SaveChangesAsync();
        var partidos = new PartidoService(db, new DisponibilidadService(db));

        await Assert.ThrowsAsync<BusinessRuleException>(() => partidos.ProgramarAsync(torneo.IdTorneo,
            new CrearPartidoDto(a.IdEquipo, b.IdEquipo, cancha.IdCancha, Futuro.AddDays(60), new TimeOnly(20, 0))));

        var ok = await partidos.ProgramarAsync(torneo.IdTorneo,
            new CrearPartidoDto(a.IdEquipo, b.IdEquipo, cancha.IdCancha, Futuro.AddDays(5), new TimeOnly(20, 0)));
        Assert.Equal("Programado", ok.Estado);
    }

    [Fact]
    public async Task Integrantes_De_Torneo_Finalizado_No_Se_Modifican()
    {
        await using var db = TestDbFactory.Create();
        var torneo = new Torneo { Nombre = "Apertura", FechaInicio = Pasado, FechaFin = Pasado, Estado = "Finalizado" };
        var equipo = new Equipo { Torneo = torneo, Nombre = "A" };
        db.AddRange(torneo, equipo);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            new IntegranteService(db).AgregarAsync(equipo.IdEquipo, new CrearIntegranteDto("Pedro Gomez", "30111222")));
    }

    // ---------- 7. Ingresos netos ----------

    [Fact]
    public async Task Reporte_De_Ingresos_Descuenta_Devoluciones()
    {
        var (db, cancha, cliente) = await BaseAsync();
        var r = NuevaReserva(cancha, cliente, Pasado, 18, 19, "Cancelada");
        db.Reservas.Add(r);
        await db.SaveChangesAsync();
        db.Pagos.Add(new Pago { IdReserva = r.IdReserva, Monto = 10000, MetodoPago = "Efectivo", FechaPago = Pasado });
        var canc = new Cancelacion { IdReserva = r.IdReserva, IdUsuario = 1, FechaCancelacion = DateTime.UtcNow };
        db.Cancelaciones.Add(canc);
        await db.SaveChangesAsync();
        db.Devoluciones.Add(new Devolucion { IdCancelacion = canc.IdCancelacion, MontoDevuelto = 4000, Metodo = "Efectivo", Fecha = Pasado });
        await db.SaveChangesAsync();

        var ingresos = await new ReportesService(db).GetIngresosAsync(Pasado, Pasado);

        var efectivo = Assert.Single(ingresos);
        Assert.Equal(10000, efectivo.Cobrado);
        Assert.Equal(4000, efectivo.Devuelto);
        Assert.Equal(6000, efectivo.Total);
    }

    // ---------- 8. Pagos mayores al saldo ----------

    [Fact]
    public async Task Pago_Mayor_Al_Saldo_Es_Rechazado()
    {
        var (db, cancha, cliente) = await BaseAsync();
        var r = NuevaReserva(cancha, cliente, Futuro, 18, 19);
        db.Reservas.Add(r);
        await db.SaveChangesAsync();
        var pagos = new PagoService(db);

        await Assert.ThrowsAsync<BusinessRuleException>(() => pagos.RegistrarAsync(new CrearPagoDto(r.IdReserva, 1000000, "Efectivo", null), 1));
        await pagos.RegistrarAsync(new CrearPagoDto(r.IdReserva, 10000, "Efectivo", null), 1);
        await Assert.ThrowsAsync<BusinessRuleException>(() => pagos.RegistrarAsync(new CrearPagoDto(r.IdReserva, 1, "Efectivo", null), 1));
    }

    // ---------- 10. Estadísticas sin canceladas ----------

    [Fact]
    public async Task Clientes_Frecuentes_No_Cuentan_Reservas_Canceladas()
    {
        var (db, cancha, cliente) = await BaseAsync();
        var otro = new Cliente { NombreCompleto = "Ana Diaz", Telefono = "1199887766", FechaAlta = Pasado };
        db.Clientes.Add(otro);
        await db.SaveChangesAsync();
        for (var h = 8; h < 13; h++) db.Reservas.Add(NuevaReserva(cancha, cliente, Pasado, h, h + 1, "Cancelada"));
        db.Reservas.Add(NuevaReserva(cancha, otro, Pasado, 18, 19));
        await db.SaveChangesAsync();

        var resumen = await new EstadisticasService(db, new ReportesService(db)).GetResumenAsync(Pasado, Pasado);

        var frecuente = Assert.Single(resumen.ClientesFrecuentes);
        Assert.Equal("Ana Diaz", frecuente.Cliente);
    }

    // ---------- 11. Usuarios ----------

    [Fact]
    public async Task Administrador_No_Puede_Quitarse_El_Rol()
    {
        await using var db = TestDbFactory.Create();
        var admin = new Usuario { NombreCompleto = "Admin", Username = "admin", PasswordHash = "x", Rol = "administrador", Activo = true };
        db.Usuarios.Add(admin);
        await db.SaveChangesAsync();
        var servicio = new UsuarioService(db, null!);

        await Assert.ThrowsAsync<BusinessRuleException>(() =>
            servicio.UpdateAsync(admin.IdUsuario, new ActualizarUsuarioDto("Admin", "empleado"), admin.IdUsuario));
    }

    // ---------- Asistencia (ausencias) ----------

    [Fact]
    public async Task Asistencia_Solo_En_Turnos_Pasados_Y_No_Cancelados()
    {
        var (db, cancha, cliente) = await BaseAsync();
        var pasada = NuevaReserva(cancha, cliente, Pasado, 18, 19);
        var futura = NuevaReserva(cancha, cliente, Futuro, 18, 19);
        var cancelada = NuevaReserva(cancha, cliente, Pasado, 20, 21, "Cancelada");
        db.Reservas.AddRange(pasada, futura, cancelada);
        await db.SaveChangesAsync();
        var reservas = new ReservaService(db, new DisponibilidadService(db));

        var r = await reservas.RegistrarAsistenciaAsync(pasada.IdReserva, new RegistrarAsistenciaDto("Ausente"));
        Assert.Equal("Ausente", r.Asistencia);
        await Assert.ThrowsAsync<BusinessRuleException>(() => reservas.RegistrarAsistenciaAsync(futura.IdReserva, new RegistrarAsistenciaDto("Presente")));
        await Assert.ThrowsAsync<BusinessRuleException>(() => reservas.RegistrarAsistenciaAsync(cancelada.IdReserva, new RegistrarAsistenciaDto("Presente")));
        await Assert.ThrowsAsync<BusinessRuleException>(() => reservas.RegistrarAsistenciaAsync(pasada.IdReserva, new RegistrarAsistenciaDto("Tarde")));
    }

    // ---------- Auditoría ----------

    [Fact]
    public async Task Auditoria_Registra_Usuario_Y_Campos_Modificados()
    {
        var db = TestDbFactory.CreateComo(7);
        var empleado = new Usuario { IdUsuario = 7, NombreCompleto = "Laura Fernandez", Username = "lfernandez", PasswordHash = "x", Rol = "empleado", Activo = true };
        db.Usuarios.Add(empleado);
        var (_, cancha, cliente) = await BaseAsync(db);
        var reservas = new ReservaService(db, new DisponibilidadService(db));

        var r = await reservas.CreateAsync(new CrearReservaDto(cliente.IdCliente, cancha.IdCancha, Futuro, new(18, 0), new(19, 0), null), 7);
        await reservas.UpdateAsync(r.IdReserva, new ActualizarReservaDto(cancha.IdCancha, Futuro, new(18, 0), new(20, 0), null));
        var pago = await new PagoService(db).RegistrarAsync(new CrearPagoDto(r.IdReserva, 5000, "Efectivo", null), 7);

        var historial = await new AuditoriaService(db).GetHistorialReservaAsync(r.IdReserva);

        Assert.Contains(historial, h => h.Entidad == "Reserva" && h.Accion == "Alta");
        Assert.Contains(historial, h => h.Entidad == "Reserva" && h.Accion == "Modificación" && h.Detalle!.Contains("Hora de fin: 19:00 → 20:00"));
        Assert.Contains(historial, h => h.Entidad == "Pago" && h.Accion == "Alta");
        Assert.All(historial, h => Assert.Equal("Laura Fernandez", h.Usuario));
        Assert.Equal("Laura Fernandez", pago.RegistradoPor);
    }

    [Fact]
    public async Task Auditoria_Registra_Cambios_En_Datos_Del_Cliente()
    {
        var db = TestDbFactory.CreateComo(3);
        var clientes = new ClienteService(db);
        var c = await clientes.CreateAsync(new CrearClienteDto("Juan Perez", "1122334455", null));
        await clientes.UpdateAsync(c.IdCliente, new ActualizarClienteDto("Juan Perez", "1155554444", null));

        var historial = await new AuditoriaService(db).GetHistorialClienteAsync(c.IdCliente);

        Assert.Equal(2, historial.Count);
        Assert.Contains(historial, h => h.Detalle == "Teléfono: 1122334455 → 1155554444");
        Assert.Equal(3, await db.Auditorias.Select(a => a.IdUsuario).FirstAsync());
    }

    // ---------- Notificaciones sin duplicados ----------

    [Fact]
    public async Task Notificaciones_No_Se_Duplican_Para_El_Mismo_Evento()
    {
        var (db, cancha, cliente) = await BaseAsync();
        db.Reservas.Add(NuevaReserva(cancha, cliente, Pasado, 18, 19));
        await db.SaveChangesAsync();
        var servicio = new NotificacionService(db);

        await servicio.GetByUsuarioAsync(1);
        var segunda = await servicio.GetByUsuarioAsync(1);

        Assert.Single(segunda, n => n.Tipo == "pago");
    }

    // ---------- Parámetro de inactividad ----------

    [Fact]
    public async Task Minutos_De_Inactividad_Tienen_Limites()
    {
        await using var db = TestDbFactory.Create();
        var servicio = new ParametroService(db);

        Assert.Equal("30", (await servicio.GetAllAsync()).Single(p => p.Clave == Parametro.MinutosInactividad).Valor);
        await Assert.ThrowsAsync<BusinessRuleException>(() => servicio.ActualizarAsync(Parametro.MinutosInactividad, new ActualizarParametroDto("2")));
        var ok = await servicio.ActualizarAsync(Parametro.MinutosInactividad, new ActualizarParametroDto("45"));
        Assert.Equal("45", ok.Valor);
    }
}
