using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsComplex.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Cancha",
                columns: table => new
                {
                    id_cancha = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    tipo_superficie = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    precio_por_hora = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    activa = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cancha", x => x.id_cancha);
                    table.CheckConstraint("CK_Cancha_Precio", "precio_por_hora > 0");
                });

            migrationBuilder.CreateTable(
                name: "Cliente",
                columns: table => new
                {
                    id_cliente = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    nombre_completo = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    fecha_alta = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cliente", x => x.id_cliente);
                });

            migrationBuilder.CreateTable(
                name: "Torneo",
                columns: table => new
                {
                    id_torneo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    nombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    fecha_inicio = table.Column<DateOnly>(type: "date", nullable: false),
                    fecha_fin = table.Column<DateOnly>(type: "date", nullable: false),
                    categoria = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Torneo", x => x.id_torneo);
                    table.CheckConstraint("CK_Torneo_Estado", "estado IN ('Planificado','En curso','Finalizado')");
                    table.CheckConstraint("CK_Torneo_Fechas", "fecha_fin >= fecha_inicio");
                });

            migrationBuilder.CreateTable(
                name: "Usuario",
                columns: table => new
                {
                    id_usuario = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    nombre_completo = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    username = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    password_hash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    rol = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    activo = table.Column<bool>(type: "bit", nullable: false),
                    fecha_creacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuario", x => x.id_usuario);
                    table.CheckConstraint("CK_Usuario_Rol", "rol IN ('administrador','empleado')");
                });

            migrationBuilder.CreateTable(
                name: "Equipo",
                columns: table => new
                {
                    id_equipo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_torneo = table.Column<int>(type: "int", nullable: false),
                    nombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    contacto_nombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    contacto_telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipo", x => x.id_equipo);
                    table.ForeignKey(
                        name: "FK_Equipo_Torneo_id_torneo",
                        column: x => x.id_torneo,
                        principalTable: "Torneo",
                        principalColumn: "id_torneo",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notificacion",
                columns: table => new
                {
                    id_notificacion = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_usuario = table.Column<int>(type: "int", nullable: false),
                    tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    mensaje = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    leida = table.Column<bool>(type: "bit", nullable: false),
                    fecha_creacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificacion", x => x.id_notificacion);
                    table.ForeignKey(
                        name: "FK_Notificacion_Usuario_id_usuario",
                        column: x => x.id_usuario,
                        principalTable: "Usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Reserva",
                columns: table => new
                {
                    id_reserva = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_cliente = table.Column<int>(type: "int", nullable: false),
                    id_cancha = table.Column<int>(type: "int", nullable: false),
                    id_usuario = table.Column<int>(type: "int", nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    hora_inicio = table.Column<TimeOnly>(type: "time", nullable: false),
                    hora_fin = table.Column<TimeOnly>(type: "time", nullable: false),
                    estado_reserva = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    estado_pago = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    fecha_creacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reserva", x => x.id_reserva);
                    table.CheckConstraint("CK_Reserva_EstadoPago", "estado_pago IN ('Pendiente','Parcialmente abonado','Abonado')");
                    table.CheckConstraint("CK_Reserva_EstadoReserva", "estado_reserva IN ('Confirmada','Pendiente','Cancelada')");
                    table.CheckConstraint("CK_Reserva_Horario", "hora_fin > hora_inicio");
                    table.ForeignKey(
                        name: "FK_Reserva_Cancha_id_cancha",
                        column: x => x.id_cancha,
                        principalTable: "Cancha",
                        principalColumn: "id_cancha",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reserva_Cliente_id_cliente",
                        column: x => x.id_cliente,
                        principalTable: "Cliente",
                        principalColumn: "id_cliente",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reserva_Usuario_id_usuario",
                        column: x => x.id_usuario,
                        principalTable: "Usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Integrante",
                columns: table => new
                {
                    id_integrante = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_equipo = table.Column<int>(type: "int", nullable: false),
                    nombre_completo = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    dni = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Integrante", x => x.id_integrante);
                    table.ForeignKey(
                        name: "FK_Integrante_Equipo_id_equipo",
                        column: x => x.id_equipo,
                        principalTable: "Equipo",
                        principalColumn: "id_equipo",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Partido",
                columns: table => new
                {
                    id_partido = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_torneo = table.Column<int>(type: "int", nullable: false),
                    id_equipo_local = table.Column<int>(type: "int", nullable: false),
                    id_equipo_visitante = table.Column<int>(type: "int", nullable: false),
                    id_cancha = table.Column<int>(type: "int", nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    hora_inicio = table.Column<TimeOnly>(type: "time", nullable: false),
                    goles_local = table.Column<int>(type: "int", nullable: true),
                    goles_visitante = table.Column<int>(type: "int", nullable: true),
                    estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Partido", x => x.id_partido);
                    table.CheckConstraint("CK_Partido_EquiposDistintos", "id_equipo_local <> id_equipo_visitante");
                    table.CheckConstraint("CK_Partido_Estado", "estado IN ('Programado','Jugado')");
                    table.CheckConstraint("CK_Partido_GolesLocal", "goles_local >= 0");
                    table.CheckConstraint("CK_Partido_GolesVisitante", "goles_visitante >= 0");
                    table.ForeignKey(
                        name: "FK_Partido_Cancha_id_cancha",
                        column: x => x.id_cancha,
                        principalTable: "Cancha",
                        principalColumn: "id_cancha",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Partido_Equipo_id_equipo_local",
                        column: x => x.id_equipo_local,
                        principalTable: "Equipo",
                        principalColumn: "id_equipo",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Partido_Equipo_id_equipo_visitante",
                        column: x => x.id_equipo_visitante,
                        principalTable: "Equipo",
                        principalColumn: "id_equipo",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Partido_Torneo_id_torneo",
                        column: x => x.id_torneo,
                        principalTable: "Torneo",
                        principalColumn: "id_torneo",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Cancelacion",
                columns: table => new
                {
                    id_cancelacion = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_reserva = table.Column<int>(type: "int", nullable: false),
                    id_usuario = table.Column<int>(type: "int", nullable: false),
                    motivo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    fecha_cancelacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cancelacion", x => x.id_cancelacion);
                    table.ForeignKey(
                        name: "FK_Cancelacion_Reserva_id_reserva",
                        column: x => x.id_reserva,
                        principalTable: "Reserva",
                        principalColumn: "id_reserva",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Cancelacion_Usuario_id_usuario",
                        column: x => x.id_usuario,
                        principalTable: "Usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Pago",
                columns: table => new
                {
                    id_pago = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_reserva = table.Column<int>(type: "int", nullable: false),
                    monto = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    metodo_pago = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    fecha_pago = table.Column<DateOnly>(type: "date", nullable: false),
                    observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pago", x => x.id_pago);
                    table.CheckConstraint("CK_Pago_Monto", "monto > 0");
                    table.ForeignKey(
                        name: "FK_Pago_Reserva_id_reserva",
                        column: x => x.id_reserva,
                        principalTable: "Reserva",
                        principalColumn: "id_reserva",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Devolucion",
                columns: table => new
                {
                    id_devolucion = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    id_cancelacion = table.Column<int>(type: "int", nullable: false),
                    monto_devuelto = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    metodo = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Devolucion", x => x.id_devolucion);
                    table.CheckConstraint("CK_Devolucion_Monto", "monto_devuelto > 0");
                    table.ForeignKey(
                        name: "FK_Devolucion_Cancelacion_id_cancelacion",
                        column: x => x.id_cancelacion,
                        principalTable: "Cancelacion",
                        principalColumn: "id_cancelacion",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cancelacion_id_reserva",
                table: "Cancelacion",
                column: "id_reserva",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cancelacion_id_usuario",
                table: "Cancelacion",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "IX_Cancha_nombre",
                table: "Cancha",
                column: "nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cliente_telefono",
                table: "Cliente",
                column: "telefono",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Devolucion_id_cancelacion",
                table: "Devolucion",
                column: "id_cancelacion",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Equipo_id_torneo_nombre",
                table: "Equipo",
                columns: new[] { "id_torneo", "nombre" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Integrante_id_equipo_dni",
                table: "Integrante",
                columns: new[] { "id_equipo", "dni" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notificacion_id_usuario",
                table: "Notificacion",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "IX_Pago_id_reserva",
                table: "Pago",
                column: "id_reserva");

            migrationBuilder.CreateIndex(
                name: "IX_Partido_id_cancha_fecha_hora_inicio",
                table: "Partido",
                columns: new[] { "id_cancha", "fecha", "hora_inicio" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Partido_id_equipo_local",
                table: "Partido",
                column: "id_equipo_local");

            migrationBuilder.CreateIndex(
                name: "IX_Partido_id_equipo_visitante",
                table: "Partido",
                column: "id_equipo_visitante");

            migrationBuilder.CreateIndex(
                name: "IX_Partido_id_torneo",
                table: "Partido",
                column: "id_torneo");

            migrationBuilder.CreateIndex(
                name: "IX_Reserva_id_cliente",
                table: "Reserva",
                column: "id_cliente");

            migrationBuilder.CreateIndex(
                name: "IX_Reserva_id_usuario",
                table: "Reserva",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "UX_Reserva_Cancha_Fecha_Horario",
                table: "Reserva",
                columns: new[] { "id_cancha", "fecha", "hora_inicio" },
                unique: true,
                filter: "[estado_reserva] <> 'Cancelada'");

            migrationBuilder.CreateIndex(
                name: "IX_Usuario_username",
                table: "Usuario",
                column: "username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Devolucion");

            migrationBuilder.DropTable(
                name: "Integrante");

            migrationBuilder.DropTable(
                name: "Notificacion");

            migrationBuilder.DropTable(
                name: "Pago");

            migrationBuilder.DropTable(
                name: "Partido");

            migrationBuilder.DropTable(
                name: "Cancelacion");

            migrationBuilder.DropTable(
                name: "Equipo");

            migrationBuilder.DropTable(
                name: "Reserva");

            migrationBuilder.DropTable(
                name: "Torneo");

            migrationBuilder.DropTable(
                name: "Cancha");

            migrationBuilder.DropTable(
                name: "Cliente");

            migrationBuilder.DropTable(
                name: "Usuario");
        }
    }
}
