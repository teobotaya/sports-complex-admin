IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Cancha] (
        [id_cancha] int NOT NULL IDENTITY,
        [nombre] nvarchar(100) NOT NULL,
        [tipo_superficie] nvarchar(50) NULL,
        [precio_por_hora] decimal(10,2) NOT NULL,
        [activa] bit NOT NULL,
        CONSTRAINT [PK_Cancha] PRIMARY KEY ([id_cancha]),
        CONSTRAINT [CK_Cancha_Precio] CHECK (precio_por_hora > 0)
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Cliente] (
        [id_cliente] int NOT NULL IDENTITY,
        [nombre_completo] nvarchar(150) NOT NULL,
        [telefono] nvarchar(20) NOT NULL,
        [observaciones] nvarchar(max) NULL,
        [fecha_alta] date NOT NULL,
        CONSTRAINT [PK_Cliente] PRIMARY KEY ([id_cliente])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Torneo] (
        [id_torneo] int NOT NULL IDENTITY,
        [nombre] nvarchar(150) NOT NULL,
        [fecha_inicio] date NOT NULL,
        [fecha_fin] date NOT NULL,
        [categoria] nvarchar(50) NULL,
        [estado] nvarchar(20) NOT NULL,
        CONSTRAINT [PK_Torneo] PRIMARY KEY ([id_torneo]),
        CONSTRAINT [CK_Torneo_Estado] CHECK (estado IN ('Planificado','En curso','Finalizado')),
        CONSTRAINT [CK_Torneo_Fechas] CHECK (fecha_fin >= fecha_inicio)
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Usuario] (
        [id_usuario] int NOT NULL IDENTITY,
        [nombre_completo] nvarchar(150) NOT NULL,
        [username] nvarchar(50) NOT NULL,
        [password_hash] nvarchar(255) NOT NULL,
        [rol] nvarchar(20) NOT NULL,
        [activo] bit NOT NULL,
        [fecha_creacion] datetime2 NOT NULL,
        CONSTRAINT [PK_Usuario] PRIMARY KEY ([id_usuario]),
        CONSTRAINT [CK_Usuario_Rol] CHECK (rol IN ('administrador','empleado'))
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Equipo] (
        [id_equipo] int NOT NULL IDENTITY,
        [id_torneo] int NOT NULL,
        [nombre] nvarchar(150) NOT NULL,
        [contacto_nombre] nvarchar(150) NULL,
        [contacto_telefono] nvarchar(20) NULL,
        CONSTRAINT [PK_Equipo] PRIMARY KEY ([id_equipo]),
        CONSTRAINT [FK_Equipo_Torneo_id_torneo] FOREIGN KEY ([id_torneo]) REFERENCES [Torneo] ([id_torneo]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Notificacion] (
        [id_notificacion] int NOT NULL IDENTITY,
        [id_usuario] int NOT NULL,
        [tipo] nvarchar(50) NOT NULL,
        [mensaje] nvarchar(max) NOT NULL,
        [leida] bit NOT NULL,
        [fecha_creacion] datetime2 NOT NULL,
        CONSTRAINT [PK_Notificacion] PRIMARY KEY ([id_notificacion]),
        CONSTRAINT [FK_Notificacion_Usuario_id_usuario] FOREIGN KEY ([id_usuario]) REFERENCES [Usuario] ([id_usuario]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Reserva] (
        [id_reserva] int NOT NULL IDENTITY,
        [id_cliente] int NOT NULL,
        [id_cancha] int NOT NULL,
        [id_usuario] int NOT NULL,
        [fecha] date NOT NULL,
        [hora_inicio] time NOT NULL,
        [hora_fin] time NOT NULL,
        [estado_reserva] nvarchar(20) NOT NULL,
        [estado_pago] nvarchar(30) NOT NULL,
        [observaciones] nvarchar(max) NULL,
        [fecha_creacion] datetime2 NOT NULL,
        CONSTRAINT [PK_Reserva] PRIMARY KEY ([id_reserva]),
        CONSTRAINT [CK_Reserva_EstadoPago] CHECK (estado_pago IN ('Pendiente','Parcialmente abonado','Abonado')),
        CONSTRAINT [CK_Reserva_EstadoReserva] CHECK (estado_reserva IN ('Confirmada','Pendiente','Cancelada')),
        CONSTRAINT [CK_Reserva_Horario] CHECK (hora_fin > hora_inicio),
        CONSTRAINT [FK_Reserva_Cancha_id_cancha] FOREIGN KEY ([id_cancha]) REFERENCES [Cancha] ([id_cancha]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Reserva_Cliente_id_cliente] FOREIGN KEY ([id_cliente]) REFERENCES [Cliente] ([id_cliente]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Reserva_Usuario_id_usuario] FOREIGN KEY ([id_usuario]) REFERENCES [Usuario] ([id_usuario]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Integrante] (
        [id_integrante] int NOT NULL IDENTITY,
        [id_equipo] int NOT NULL,
        [nombre_completo] nvarchar(150) NOT NULL,
        [dni] nvarchar(15) NOT NULL,
        CONSTRAINT [PK_Integrante] PRIMARY KEY ([id_integrante]),
        CONSTRAINT [FK_Integrante_Equipo_id_equipo] FOREIGN KEY ([id_equipo]) REFERENCES [Equipo] ([id_equipo]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Partido] (
        [id_partido] int NOT NULL IDENTITY,
        [id_torneo] int NOT NULL,
        [id_equipo_local] int NOT NULL,
        [id_equipo_visitante] int NOT NULL,
        [id_cancha] int NOT NULL,
        [fecha] date NOT NULL,
        [hora_inicio] time NOT NULL,
        [goles_local] int NULL,
        [goles_visitante] int NULL,
        [estado] nvarchar(20) NOT NULL,
        CONSTRAINT [PK_Partido] PRIMARY KEY ([id_partido]),
        CONSTRAINT [CK_Partido_EquiposDistintos] CHECK (id_equipo_local <> id_equipo_visitante),
        CONSTRAINT [CK_Partido_Estado] CHECK (estado IN ('Programado','Jugado')),
        CONSTRAINT [CK_Partido_GolesLocal] CHECK (goles_local >= 0),
        CONSTRAINT [CK_Partido_GolesVisitante] CHECK (goles_visitante >= 0),
        CONSTRAINT [FK_Partido_Cancha_id_cancha] FOREIGN KEY ([id_cancha]) REFERENCES [Cancha] ([id_cancha]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Partido_Equipo_id_equipo_local] FOREIGN KEY ([id_equipo_local]) REFERENCES [Equipo] ([id_equipo]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Partido_Equipo_id_equipo_visitante] FOREIGN KEY ([id_equipo_visitante]) REFERENCES [Equipo] ([id_equipo]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Partido_Torneo_id_torneo] FOREIGN KEY ([id_torneo]) REFERENCES [Torneo] ([id_torneo]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Cancelacion] (
        [id_cancelacion] int NOT NULL IDENTITY,
        [id_reserva] int NOT NULL,
        [id_usuario] int NOT NULL,
        [motivo] nvarchar(max) NULL,
        [fecha_cancelacion] datetime2 NOT NULL,
        CONSTRAINT [PK_Cancelacion] PRIMARY KEY ([id_cancelacion]),
        CONSTRAINT [FK_Cancelacion_Reserva_id_reserva] FOREIGN KEY ([id_reserva]) REFERENCES [Reserva] ([id_reserva]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Cancelacion_Usuario_id_usuario] FOREIGN KEY ([id_usuario]) REFERENCES [Usuario] ([id_usuario]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Pago] (
        [id_pago] int NOT NULL IDENTITY,
        [id_reserva] int NOT NULL,
        [monto] decimal(10,2) NOT NULL,
        [metodo_pago] nvarchar(30) NOT NULL,
        [fecha_pago] date NOT NULL,
        [observaciones] nvarchar(max) NULL,
        CONSTRAINT [PK_Pago] PRIMARY KEY ([id_pago]),
        CONSTRAINT [CK_Pago_Monto] CHECK (monto > 0),
        CONSTRAINT [FK_Pago_Reserva_id_reserva] FOREIGN KEY ([id_reserva]) REFERENCES [Reserva] ([id_reserva]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE TABLE [Devolucion] (
        [id_devolucion] int NOT NULL IDENTITY,
        [id_cancelacion] int NOT NULL,
        [monto_devuelto] decimal(10,2) NOT NULL,
        [metodo] nvarchar(30) NOT NULL,
        [fecha] date NOT NULL,
        [observaciones] nvarchar(max) NULL,
        CONSTRAINT [PK_Devolucion] PRIMARY KEY ([id_devolucion]),
        CONSTRAINT [CK_Devolucion_Monto] CHECK (monto_devuelto > 0),
        CONSTRAINT [FK_Devolucion_Cancelacion_id_cancelacion] FOREIGN KEY ([id_cancelacion]) REFERENCES [Cancelacion] ([id_cancelacion]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Cancelacion_id_reserva] ON [Cancelacion] ([id_reserva]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Cancelacion_id_usuario] ON [Cancelacion] ([id_usuario]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Cancha_nombre] ON [Cancha] ([nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Cliente_telefono] ON [Cliente] ([telefono]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Devolucion_id_cancelacion] ON [Devolucion] ([id_cancelacion]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Equipo_id_torneo_nombre] ON [Equipo] ([id_torneo], [nombre]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Integrante_id_equipo_dni] ON [Integrante] ([id_equipo], [dni]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Notificacion_id_usuario] ON [Notificacion] ([id_usuario]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Pago_id_reserva] ON [Pago] ([id_reserva]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Partido_id_cancha_fecha_hora_inicio] ON [Partido] ([id_cancha], [fecha], [hora_inicio]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Partido_id_equipo_local] ON [Partido] ([id_equipo_local]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Partido_id_equipo_visitante] ON [Partido] ([id_equipo_visitante]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Partido_id_torneo] ON [Partido] ([id_torneo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Reserva_id_cliente] ON [Reserva] ([id_cliente]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Reserva_id_usuario] ON [Reserva] ([id_usuario]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Reserva_Cancha_Fecha_Horario] ON [Reserva] ([id_cancha], [fecha], [hora_inicio]) WHERE [estado_reserva] <> ''Cancelada''');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Usuario_username] ON [Usuario] ([username]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813003649_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260813003649_InitialCreate', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    DROP INDEX [IX_Notificacion_id_usuario] ON [Notificacion];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    ALTER TABLE [Reserva] ADD [asistencia] nvarchar(10) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    ALTER TABLE [Pago] ADD [id_usuario] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    ALTER TABLE [Notificacion] ADD [id_referencia] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    ALTER TABLE [Devolucion] ADD [id_usuario] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    CREATE TABLE [Auditoria] (
        [id_auditoria] int NOT NULL IDENTITY,
        [fecha_hora] datetime2 NOT NULL,
        [id_usuario] int NULL,
        [entidad] nvarchar(30) NOT NULL,
        [id_registro] int NOT NULL,
        [accion] nvarchar(20) NOT NULL,
        [detalle] nvarchar(max) NULL,
        CONSTRAINT [PK_Auditoria] PRIMARY KEY ([id_auditoria]),
        CONSTRAINT [CK_Auditoria_Accion] CHECK (accion IN ('Alta','Modificación','Baja')),
        CONSTRAINT [FK_Auditoria_Usuario_id_usuario] FOREIGN KEY ([id_usuario]) REFERENCES [Usuario] ([id_usuario]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    CREATE TABLE [Parametro] (
        [id_parametro] int NOT NULL IDENTITY,
        [clave] nvarchar(50) NOT NULL,
        [valor] nvarchar(100) NOT NULL,
        [descripcion] nvarchar(200) NULL,
        CONSTRAINT [PK_Parametro] PRIMARY KEY ([id_parametro])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'id_parametro', N'clave', N'descripcion', N'valor') AND [object_id] = OBJECT_ID(N'[Parametro]'))
        SET IDENTITY_INSERT [Parametro] ON;
    EXEC(N'INSERT INTO [Parametro] ([id_parametro], [clave], [descripcion], [valor])
    VALUES (1, N''minutos_inactividad'', N''Minutos sin actividad antes de cerrar la sesión automáticamente'', N''30'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'id_parametro', N'clave', N'descripcion', N'valor') AND [object_id] = OBJECT_ID(N'[Parametro]'))
        SET IDENTITY_INSERT [Parametro] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    EXEC(N'ALTER TABLE [Reserva] ADD CONSTRAINT [CK_Reserva_Asistencia] CHECK (asistencia IS NULL OR asistencia IN (''Presente'',''Ausente''))');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    CREATE INDEX [IX_Pago_id_usuario] ON [Pago] ([id_usuario]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN

    UPDATE Notificacion
    SET id_referencia = TRY_CAST(SUBSTRING(mensaje, CHARINDEX('#', mensaje) + 1,
            CHARINDEX(' ', mensaje + ' ', CHARINDEX('#', mensaje)) - CHARINDEX('#', mensaje) - 1) AS INT)
    WHERE CHARINDEX('#', mensaje) > 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN

    ;WITH repetidas AS (
        SELECT ROW_NUMBER() OVER (PARTITION BY id_usuario, tipo, id_referencia ORDER BY id_notificacion) AS n
        FROM Notificacion WHERE id_referencia IS NOT NULL)
    DELETE FROM repetidas WHERE n > 1;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UX_Notificacion_Usuario_Evento] ON [Notificacion] ([id_usuario], [tipo], [id_referencia]) WHERE [id_referencia] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    CREATE INDEX [IX_Devolucion_id_usuario] ON [Devolucion] ([id_usuario]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    CREATE INDEX [IX_Auditoria_Entidad_Registro] ON [Auditoria] ([entidad], [id_registro]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    CREATE INDEX [IX_Auditoria_id_usuario] ON [Auditoria] ([id_usuario]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Parametro_clave] ON [Parametro] ([clave]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    ALTER TABLE [Devolucion] ADD CONSTRAINT [FK_Devolucion_Usuario_id_usuario] FOREIGN KEY ([id_usuario]) REFERENCES [Usuario] ([id_usuario]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    ALTER TABLE [Pago] ADD CONSTRAINT [FK_Pago_Usuario_id_usuario] FOREIGN KEY ([id_usuario]) REFERENCES [Usuario] ([id_usuario]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260926203834_AuditoriaAsistenciaParametros'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260926203834_AuditoriaAsistenciaParametros', N'8.0.10');
END;
GO

COMMIT;
GO

