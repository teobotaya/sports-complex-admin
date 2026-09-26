using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportsComplex.Api.Migrations
{
    /// <inheritdoc />
    public partial class AuditoriaAsistenciaParametros : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notificacion_id_usuario",
                table: "Notificacion");

            migrationBuilder.AddColumn<string>(
                name: "asistencia",
                table: "Reserva",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "id_usuario",
                table: "Pago",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "id_referencia",
                table: "Notificacion",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "id_usuario",
                table: "Devolucion",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Auditoria",
                columns: table => new
                {
                    id_auditoria = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    fecha_hora = table.Column<DateTime>(type: "datetime2", nullable: false),
                    id_usuario = table.Column<int>(type: "int", nullable: true),
                    entidad = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    id_registro = table.Column<int>(type: "int", nullable: false),
                    accion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    detalle = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Auditoria", x => x.id_auditoria);
                    table.CheckConstraint("CK_Auditoria_Accion", "accion IN ('Alta','Modificación','Baja')");
                    table.ForeignKey(
                        name: "FK_Auditoria_Usuario_id_usuario",
                        column: x => x.id_usuario,
                        principalTable: "Usuario",
                        principalColumn: "id_usuario",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Parametro",
                columns: table => new
                {
                    id_parametro = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    clave = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    valor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parametro", x => x.id_parametro);
                });

            migrationBuilder.InsertData(
                table: "Parametro",
                columns: new[] { "id_parametro", "clave", "descripcion", "valor" },
                values: new object[] { 1, "minutos_inactividad", "Minutos sin actividad antes de cerrar la sesión automáticamente", "30" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Reserva_Asistencia",
                table: "Reserva",
                sql: "asistencia IS NULL OR asistencia IN ('Presente','Ausente')");

            migrationBuilder.CreateIndex(
                name: "IX_Pago_id_usuario",
                table: "Pago",
                column: "id_usuario");

            // Avisos ya existentes: se toma el número de reserva/partido/cancelación del texto ("#12")
            // y se borran los repetidos, para poder crear la restricción única sin errores.
            migrationBuilder.Sql(@"
UPDATE Notificacion
SET id_referencia = TRY_CAST(SUBSTRING(mensaje, CHARINDEX('#', mensaje) + 1,
        CHARINDEX(' ', mensaje + ' ', CHARINDEX('#', mensaje)) - CHARINDEX('#', mensaje) - 1) AS INT)
WHERE CHARINDEX('#', mensaje) > 0;");
            migrationBuilder.Sql(@"
;WITH repetidas AS (
    SELECT ROW_NUMBER() OVER (PARTITION BY id_usuario, tipo, id_referencia ORDER BY id_notificacion) AS n
    FROM Notificacion WHERE id_referencia IS NOT NULL)
DELETE FROM repetidas WHERE n > 1;");

            migrationBuilder.CreateIndex(
                name: "UX_Notificacion_Usuario_Evento",
                table: "Notificacion",
                columns: new[] { "id_usuario", "tipo", "id_referencia" },
                unique: true,
                filter: "[id_referencia] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Devolucion_id_usuario",
                table: "Devolucion",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "IX_Auditoria_Entidad_Registro",
                table: "Auditoria",
                columns: new[] { "entidad", "id_registro" });

            migrationBuilder.CreateIndex(
                name: "IX_Auditoria_id_usuario",
                table: "Auditoria",
                column: "id_usuario");

            migrationBuilder.CreateIndex(
                name: "IX_Parametro_clave",
                table: "Parametro",
                column: "clave",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Devolucion_Usuario_id_usuario",
                table: "Devolucion",
                column: "id_usuario",
                principalTable: "Usuario",
                principalColumn: "id_usuario",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Pago_Usuario_id_usuario",
                table: "Pago",
                column: "id_usuario",
                principalTable: "Usuario",
                principalColumn: "id_usuario",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Devolucion_Usuario_id_usuario",
                table: "Devolucion");

            migrationBuilder.DropForeignKey(
                name: "FK_Pago_Usuario_id_usuario",
                table: "Pago");

            migrationBuilder.DropTable(
                name: "Auditoria");

            migrationBuilder.DropTable(
                name: "Parametro");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Reserva_Asistencia",
                table: "Reserva");

            migrationBuilder.DropIndex(
                name: "IX_Pago_id_usuario",
                table: "Pago");

            migrationBuilder.DropIndex(
                name: "UX_Notificacion_Usuario_Evento",
                table: "Notificacion");

            migrationBuilder.DropIndex(
                name: "IX_Devolucion_id_usuario",
                table: "Devolucion");

            migrationBuilder.DropColumn(
                name: "asistencia",
                table: "Reserva");

            migrationBuilder.DropColumn(
                name: "id_usuario",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "id_referencia",
                table: "Notificacion");

            migrationBuilder.DropColumn(
                name: "id_usuario",
                table: "Devolucion");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacion_id_usuario",
                table: "Notificacion",
                column: "id_usuario");
        }
    }
}
