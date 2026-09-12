using Microsoft.EntityFrameworkCore;
using SportsComplex.Api.Entities;

namespace SportsComplex.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Cancha> Canchas => Set<Cancha>();
    public DbSet<Reserva> Reservas => Set<Reserva>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Cancelacion> Cancelaciones => Set<Cancelacion>();
    public DbSet<Devolucion> Devoluciones => Set<Devolucion>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();
    public DbSet<Torneo> Torneos => Set<Torneo>();
    public DbSet<Equipo> Equipos => Set<Equipo>();
    public DbSet<Integrante> Integrantes => Set<Integrante>();
    public DbSet<Partido> Partidos => Set<Partido>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cliente>(e =>
        {
            e.ToTable("Cliente");
            e.HasKey(x => x.IdCliente);
            e.Property(x => x.IdCliente).HasColumnName("id_cliente");
            e.Property(x => x.NombreCompleto).HasColumnName("nombre_completo").HasMaxLength(150).IsRequired();
            e.Property(x => x.Telefono).HasColumnName("telefono").HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.Telefono).IsUnique();
            e.Property(x => x.Observaciones).HasColumnName("observaciones");
            e.Property(x => x.FechaAlta).HasColumnName("fecha_alta");
        });

        modelBuilder.Entity<Usuario>(e =>
        {
            e.ToTable("Usuario");
            e.HasKey(x => x.IdUsuario);
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.NombreCompleto).HasColumnName("nombre_completo").HasMaxLength(150).IsRequired();
            e.Property(x => x.Username).HasColumnName("username").HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Username).IsUnique();
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
            e.Property(x => x.Rol).HasColumnName("rol").HasMaxLength(20).IsRequired();
            e.Property(x => x.Activo).HasColumnName("activo");
            e.Property(x => x.FechaCreacion).HasColumnName("fecha_creacion");
            e.ToTable(tb => tb.HasCheckConstraint("CK_Usuario_Rol", "rol IN ('administrador','empleado')"));
        });

        modelBuilder.Entity<Cancha>(e =>
        {
            e.ToTable("Cancha");
            e.HasKey(x => x.IdCancha);
            e.Property(x => x.IdCancha).HasColumnName("id_cancha");
            e.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            e.HasIndex(x => x.Nombre).IsUnique();
            e.Property(x => x.TipoSuperficie).HasColumnName("tipo_superficie").HasMaxLength(50);
            e.Property(x => x.PrecioPorHora).HasColumnName("precio_por_hora").HasColumnType("decimal(10,2)");
            e.Property(x => x.Activa).HasColumnName("activa");
            e.ToTable(tb => tb.HasCheckConstraint("CK_Cancha_Precio", "precio_por_hora > 0"));
        });

        modelBuilder.Entity<Reserva>(e =>
        {
            e.ToTable("Reserva");
            e.HasKey(x => x.IdReserva);
            e.Property(x => x.IdReserva).HasColumnName("id_reserva");
            e.Property(x => x.IdCliente).HasColumnName("id_cliente");
            e.Property(x => x.IdCancha).HasColumnName("id_cancha");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Fecha).HasColumnName("fecha");
            e.Property(x => x.HoraInicio).HasColumnName("hora_inicio");
            e.Property(x => x.HoraFin).HasColumnName("hora_fin");
            e.Property(x => x.EstadoReserva).HasColumnName("estado_reserva").HasMaxLength(20).IsRequired();
            e.Property(x => x.EstadoPago).HasColumnName("estado_pago").HasMaxLength(30).IsRequired();
            e.Property(x => x.Observaciones).HasColumnName("observaciones");
            e.Property(x => x.FechaCreacion).HasColumnName("fecha_creacion");

            e.HasOne(x => x.Cliente).WithMany(c => c.Reservas)
                .HasForeignKey(x => x.IdCliente).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Cancha).WithMany(c => c.Reservas)
                .HasForeignKey(x => x.IdCancha).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Usuario).WithMany(u => u.Reservas)
                .HasForeignKey(x => x.IdUsuario).OnDelete(DeleteBehavior.Restrict);

            e.ToTable(tb => tb.HasCheckConstraint("CK_Reserva_Horario", "hora_fin > hora_inicio"));
            e.ToTable(tb => tb.HasCheckConstraint("CK_Reserva_EstadoReserva", "estado_reserva IN ('Confirmada','Pendiente','Cancelada')"));
            e.ToTable(tb => tb.HasCheckConstraint("CK_Reserva_EstadoPago", "estado_pago IN ('Pendiente','Parcialmente abonado','Abonado')"));

            // Regla: no puede haber dos reservas activas en la misma cancha, fecha y horario.
            e.HasIndex(x => new { x.IdCancha, x.Fecha, x.HoraInicio })
                .IsUnique()
                .HasFilter("[estado_reserva] <> 'Cancelada'")
                .HasDatabaseName("UX_Reserva_Cancha_Fecha_Horario");
        });

        modelBuilder.Entity<Pago>(e =>
        {
            e.ToTable("Pago");
            e.HasKey(x => x.IdPago);
            e.Property(x => x.IdPago).HasColumnName("id_pago");
            e.Property(x => x.IdReserva).HasColumnName("id_reserva");
            e.Property(x => x.Monto).HasColumnName("monto").HasColumnType("decimal(10,2)");
            e.Property(x => x.MetodoPago).HasColumnName("metodo_pago").HasMaxLength(30).IsRequired();
            e.Property(x => x.FechaPago).HasColumnName("fecha_pago");
            e.Property(x => x.Observaciones).HasColumnName("observaciones");

            e.HasOne(x => x.Reserva).WithMany(r => r.Pagos)
                .HasForeignKey(x => x.IdReserva).OnDelete(DeleteBehavior.Restrict);

            e.ToTable(tb => tb.HasCheckConstraint("CK_Pago_Monto", "monto > 0"));
        });

        modelBuilder.Entity<Cancelacion>(e =>
        {
            e.ToTable("Cancelacion");
            e.HasKey(x => x.IdCancelacion);
            e.Property(x => x.IdCancelacion).HasColumnName("id_cancelacion");
            e.Property(x => x.IdReserva).HasColumnName("id_reserva");
            e.HasIndex(x => x.IdReserva).IsUnique();
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Motivo).HasColumnName("motivo");
            e.Property(x => x.FechaCancelacion).HasColumnName("fecha_cancelacion");

            e.HasOne(x => x.Reserva).WithOne(r => r.Cancelacion)
                .HasForeignKey<Cancelacion>(x => x.IdReserva).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Usuario).WithMany(u => u.Cancelaciones)
                .HasForeignKey(x => x.IdUsuario).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Devolucion>(e =>
        {
            e.ToTable("Devolucion");
            e.HasKey(x => x.IdDevolucion);
            e.Property(x => x.IdDevolucion).HasColumnName("id_devolucion");
            e.Property(x => x.IdCancelacion).HasColumnName("id_cancelacion");
            e.HasIndex(x => x.IdCancelacion).IsUnique();
            e.Property(x => x.MontoDevuelto).HasColumnName("monto_devuelto").HasColumnType("decimal(10,2)");
            e.Property(x => x.Metodo).HasColumnName("metodo").HasMaxLength(30).IsRequired();
            e.Property(x => x.Fecha).HasColumnName("fecha");
            e.Property(x => x.Observaciones).HasColumnName("observaciones");

            e.HasOne(x => x.Cancelacion).WithOne(c => c.Devolucion)
                .HasForeignKey<Devolucion>(x => x.IdCancelacion).OnDelete(DeleteBehavior.Restrict);

            e.ToTable(tb => tb.HasCheckConstraint("CK_Devolucion_Monto", "monto_devuelto > 0"));
        });

        modelBuilder.Entity<Notificacion>(e =>
        {
            e.ToTable("Notificacion");
            e.HasKey(x => x.IdNotificacion);
            e.Property(x => x.IdNotificacion).HasColumnName("id_notificacion");
            e.Property(x => x.IdUsuario).HasColumnName("id_usuario");
            e.Property(x => x.Tipo).HasColumnName("tipo").HasMaxLength(50).IsRequired();
            e.Property(x => x.Mensaje).HasColumnName("mensaje").IsRequired();
            e.Property(x => x.Leida).HasColumnName("leida");
            e.Property(x => x.FechaCreacion).HasColumnName("fecha_creacion");

            e.HasOne(x => x.Usuario).WithMany(u => u.Notificaciones)
                .HasForeignKey(x => x.IdUsuario).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Torneo>(e =>
        {
            e.ToTable("Torneo");
            e.HasKey(x => x.IdTorneo);
            e.Property(x => x.IdTorneo).HasColumnName("id_torneo");
            e.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(150).IsRequired();
            e.Property(x => x.FechaInicio).HasColumnName("fecha_inicio");
            e.Property(x => x.FechaFin).HasColumnName("fecha_fin");
            e.Property(x => x.Categoria).HasColumnName("categoria").HasMaxLength(50);
            e.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).IsRequired();

            e.ToTable(tb => tb.HasCheckConstraint("CK_Torneo_Fechas", "fecha_fin >= fecha_inicio"));
            e.ToTable(tb => tb.HasCheckConstraint("CK_Torneo_Estado", "estado IN ('Planificado','En curso','Finalizado')"));
        });

        modelBuilder.Entity<Equipo>(e =>
        {
            e.ToTable("Equipo");
            e.HasKey(x => x.IdEquipo);
            e.Property(x => x.IdEquipo).HasColumnName("id_equipo");
            e.Property(x => x.IdTorneo).HasColumnName("id_torneo");
            e.Property(x => x.Nombre).HasColumnName("nombre").HasMaxLength(150).IsRequired();
            e.Property(x => x.ContactoNombre).HasColumnName("contacto_nombre").HasMaxLength(150);
            e.Property(x => x.ContactoTelefono).HasColumnName("contacto_telefono").HasMaxLength(20);
            e.HasIndex(x => new { x.IdTorneo, x.Nombre }).IsUnique();

            e.HasOne(x => x.Torneo).WithMany(t => t.Equipos)
                .HasForeignKey(x => x.IdTorneo).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Integrante>(e =>
        {
            e.ToTable("Integrante");
            e.HasKey(x => x.IdIntegrante);
            e.Property(x => x.IdIntegrante).HasColumnName("id_integrante");
            e.Property(x => x.IdEquipo).HasColumnName("id_equipo");
            e.Property(x => x.NombreCompleto).HasColumnName("nombre_completo").HasMaxLength(150).IsRequired();
            e.Property(x => x.Dni).HasColumnName("dni").HasMaxLength(15).IsRequired();
            e.HasIndex(x => new { x.IdEquipo, x.Dni }).IsUnique();

            e.HasOne(x => x.Equipo).WithMany(eq => eq.Integrantes)
                .HasForeignKey(x => x.IdEquipo).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Partido>(e =>
        {
            e.ToTable("Partido");
            e.HasKey(x => x.IdPartido);
            e.Property(x => x.IdPartido).HasColumnName("id_partido");
            e.Property(x => x.IdTorneo).HasColumnName("id_torneo");
            e.Property(x => x.IdEquipoLocal).HasColumnName("id_equipo_local");
            e.Property(x => x.IdEquipoVisitante).HasColumnName("id_equipo_visitante");
            e.Property(x => x.IdCancha).HasColumnName("id_cancha");
            e.Property(x => x.Fecha).HasColumnName("fecha");
            e.Property(x => x.HoraInicio).HasColumnName("hora_inicio");
            e.Property(x => x.GolesLocal).HasColumnName("goles_local");
            e.Property(x => x.GolesVisitante).HasColumnName("goles_visitante");
            e.Property(x => x.Estado).HasColumnName("estado").HasMaxLength(20).IsRequired();
            e.HasIndex(x => new { x.IdCancha, x.Fecha, x.HoraInicio }).IsUnique();

            e.HasOne(x => x.Torneo).WithMany(t => t.Partidos)
                .HasForeignKey(x => x.IdTorneo).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.EquipoLocal).WithMany(eq => eq.PartidosLocal)
                .HasForeignKey(x => x.IdEquipoLocal).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.EquipoVisitante).WithMany(eq => eq.PartidosVisitante)
                .HasForeignKey(x => x.IdEquipoVisitante).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Cancha).WithMany(c => c.Partidos)
                .HasForeignKey(x => x.IdCancha).OnDelete(DeleteBehavior.Restrict);

            e.ToTable(tb => tb.HasCheckConstraint("CK_Partido_EquiposDistintos", "id_equipo_local <> id_equipo_visitante"));
            e.ToTable(tb => tb.HasCheckConstraint("CK_Partido_Estado", "estado IN ('Programado','Jugado')"));
            e.ToTable(tb => tb.HasCheckConstraint("CK_Partido_GolesLocal", "goles_local >= 0"));
            e.ToTable(tb => tb.HasCheckConstraint("CK_Partido_GolesVisitante", "goles_visitante >= 0"));
        });
    }
}
