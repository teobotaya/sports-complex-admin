/*
  Actualización de una base YA EXISTENTE creada con database/schema.sql (sin migraciones EF).
  Si la base la creó el propio backend (migraciones EF), no hace falta: se aplica sola al iniciar.

  Agrega lo que pide el Trabajo Acumulativo:
    - Pago.id_usuario y Devolucion.id_usuario ...... usuario responsable de cada cobro / devolución
    - Tabla Auditoria ............................... fecha, hora y usuario de cada operación
    - Reserva.asistencia ............................ registrar ausencias ("no se presentó")
    - Tabla Parametro ............................... minutos de inactividad configurables
    - Notificacion.id_referencia + índice único ..... no generar avisos duplicados
  Se puede ejecutar más de una vez.
*/
USE ComplejoDeportivoDB;
GO

IF COL_LENGTH('dbo.Reserva', 'asistencia') IS NULL
    ALTER TABLE dbo.Reserva ADD asistencia VARCHAR(10) NULL
        CONSTRAINT CK_Reserva_Asistencia CHECK (asistencia IS NULL OR asistencia IN ('Presente', 'Ausente'));
GO

IF COL_LENGTH('dbo.Pago', 'id_usuario') IS NULL
BEGIN
    ALTER TABLE dbo.Pago ADD id_usuario INT NULL
        CONSTRAINT FK_Pago_Usuario FOREIGN KEY REFERENCES dbo.Usuario(id_usuario);
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Pago_Usuario')
    CREATE INDEX IX_Pago_Usuario ON dbo.Pago(id_usuario);
GO

IF COL_LENGTH('dbo.Devolucion', 'id_usuario') IS NULL
BEGIN
    ALTER TABLE dbo.Devolucion ADD id_usuario INT NULL
        CONSTRAINT FK_Devolucion_Usuario FOREIGN KEY REFERENCES dbo.Usuario(id_usuario);
END
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Devolucion_Usuario')
    CREATE INDEX IX_Devolucion_Usuario ON dbo.Devolucion(id_usuario);
GO

IF COL_LENGTH('dbo.Notificacion', 'id_referencia') IS NULL
    ALTER TABLE dbo.Notificacion ADD id_referencia INT NULL;
GO
-- Avisos existentes: se toma el número del texto ("#12") y se borran los repetidos.
UPDATE dbo.Notificacion
SET id_referencia = TRY_CAST(SUBSTRING(mensaje, CHARINDEX('#', mensaje) + 1,
        CHARINDEX(' ', mensaje + ' ', CHARINDEX('#', mensaje)) - CHARINDEX('#', mensaje) - 1) AS INT)
WHERE id_referencia IS NULL AND CHARINDEX('#', mensaje) > 0;
GO
;WITH repetidas AS (
    SELECT ROW_NUMBER() OVER (PARTITION BY id_usuario, tipo, id_referencia ORDER BY id_notificacion) AS n
    FROM dbo.Notificacion WHERE id_referencia IS NOT NULL)
DELETE FROM repetidas WHERE n > 1;
GO
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notificacion_Usuario')
    DROP INDEX IX_Notificacion_Usuario ON dbo.Notificacion;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Notificacion_Usuario_Evento')
    CREATE UNIQUE INDEX UX_Notificacion_Usuario_Evento
        ON dbo.Notificacion (id_usuario, tipo, id_referencia) WHERE id_referencia IS NOT NULL;
GO

IF OBJECT_ID('dbo.Auditoria') IS NULL
BEGIN
    CREATE TABLE dbo.Auditoria (
        id_auditoria    INT IDENTITY(1,1) PRIMARY KEY,
        fecha_hora      DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
        id_usuario      INT           NULL,
        entidad         VARCHAR(30)   NOT NULL,
        id_registro     INT           NOT NULL,
        accion          NVARCHAR(20)  NOT NULL
            CONSTRAINT CK_Auditoria_Accion CHECK (accion IN (N'Alta', N'Modificación', N'Baja')),
        detalle         NVARCHAR(MAX) NULL,
        CONSTRAINT FK_Auditoria_Usuario FOREIGN KEY (id_usuario) REFERENCES dbo.Usuario(id_usuario)
    );
    CREATE INDEX IX_Auditoria_Entidad_Registro ON dbo.Auditoria(entidad, id_registro);
    CREATE INDEX IX_Auditoria_Usuario ON dbo.Auditoria(id_usuario);
END
GO

IF OBJECT_ID('dbo.Parametro') IS NULL
BEGIN
    CREATE TABLE dbo.Parametro (
        id_parametro    INT IDENTITY(1,1) PRIMARY KEY,
        clave           VARCHAR(50)   NOT NULL UNIQUE,
        valor           VARCHAR(100)  NOT NULL,
        descripcion     NVARCHAR(200) NULL
    );
END
GO
IF NOT EXISTS (SELECT 1 FROM dbo.Parametro WHERE clave = 'minutos_inactividad')
    INSERT INTO dbo.Parametro (clave, valor, descripcion)
    VALUES ('minutos_inactividad', '30', N'Minutos sin actividad antes de cerrar la sesión automáticamente');
GO
