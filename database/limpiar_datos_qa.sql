/*
  Borra los datos de prueba (QA) de ComplejoDeportivoDB:
  - clientes con "QA" en el nombre, con todas sus reservas, pagos, cancelaciones y devoluciones
  - canchas con "QA" en el nombre, con sus reservas y partidos
  - torneos de prueba (QA, debug, regresión, warning) con sus equipos, integrantes y partidos
  - equipos de prueba sueltos (Equipo A, B, X, Y, A debug, Reg A, Reg B)
  - avisos y registros de auditoría que apuntaban a esos datos
  Muestra primero qué va a borrar y todo corre en una transacción: si algo falla, no se borra nada.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
-- Obligatorio para borrar en tablas con índices filtrados (Reserva, Notificacion).
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
USE ComplejoDeportivoDB;

BEGIN TRANSACTION;

SELECT id_cliente INTO #cli FROM dbo.Cliente WHERE nombre_completo LIKE '%QA%';
SELECT id_cancha  INTO #can FROM dbo.Cancha  WHERE nombre LIKE '%QA%';
SELECT id_torneo  INTO #tor FROM dbo.Torneo
 WHERE nombre LIKE '%QA%' OR nombre LIKE '%regresi%' OR nombre LIKE '%warning%' OR nombre LIKE '%debug%';
SELECT id_equipo  INTO #eq  FROM dbo.Equipo
 WHERE id_torneo IN (SELECT id_torneo FROM #tor)
    OR nombre IN ('Equipo A','Equipo B','Equipo A debug','Equipo X','Equipo Y') OR nombre LIKE 'Equipo Reg%' OR nombre LIKE 'EquipoReg%';
SELECT id_partido INTO #par FROM dbo.Partido
 WHERE id_torneo IN (SELECT id_torneo FROM #tor) OR id_cancha IN (SELECT id_cancha FROM #can)
    OR id_equipo_local IN (SELECT id_equipo FROM #eq) OR id_equipo_visitante IN (SELECT id_equipo FROM #eq);
SELECT id_reserva INTO #res FROM dbo.Reserva
 WHERE id_cliente IN (SELECT id_cliente FROM #cli) OR id_cancha IN (SELECT id_cancha FROM #can);
SELECT id_cancelacion INTO #canc FROM dbo.Cancelacion WHERE id_reserva IN (SELECT id_reserva FROM #res);
SELECT id_pago INTO #pag FROM dbo.Pago WHERE id_reserva IN (SELECT id_reserva FROM #res);
SELECT id_devolucion INTO #dev FROM dbo.Devolucion WHERE id_cancelacion IN (SELECT id_cancelacion FROM #canc);

PRINT '--- Se van a borrar ---';
SELECT 'Cliente' AS tabla, nombre_completo AS nombre FROM dbo.Cliente WHERE id_cliente IN (SELECT id_cliente FROM #cli)
UNION ALL SELECT 'Cancha', nombre FROM dbo.Cancha WHERE id_cancha IN (SELECT id_cancha FROM #can)
UNION ALL SELECT 'Torneo', nombre FROM dbo.Torneo WHERE id_torneo IN (SELECT id_torneo FROM #tor)
UNION ALL SELECT 'Equipo', nombre FROM dbo.Equipo WHERE id_equipo IN (SELECT id_equipo FROM #eq);
SELECT (SELECT COUNT(*) FROM #res) AS reservas, (SELECT COUNT(*) FROM #pag) AS pagos,
       (SELECT COUNT(*) FROM #canc) AS cancelaciones, (SELECT COUNT(*) FROM #dev) AS devoluciones,
       (SELECT COUNT(*) FROM #par) AS partidos;

-- Avisos generados por esos registros (el número figura en el texto: "La reserva #12 ...")
DELETE n FROM dbo.Notificacion n
 WHERE EXISTS (SELECT 1 FROM #res r WHERE n.mensaje LIKE 'La reserva #' + CAST(r.id_reserva AS varchar(12)) + ' %')
    OR EXISTS (SELECT 1 FROM #par p WHERE n.mensaje LIKE 'El partido #' + CAST(p.id_partido AS varchar(12)) + ' %')
    OR EXISTS (SELECT 1 FROM #canc c WHERE n.mensaje LIKE 'La cancelación #' + CAST(c.id_cancelacion AS varchar(12)) + ' %');

DELETE FROM dbo.Devolucion  WHERE id_devolucion  IN (SELECT id_devolucion  FROM #dev);
DELETE FROM dbo.Cancelacion WHERE id_cancelacion IN (SELECT id_cancelacion FROM #canc);
DELETE FROM dbo.Pago        WHERE id_pago        IN (SELECT id_pago        FROM #pag);
DELETE FROM dbo.Reserva     WHERE id_reserva     IN (SELECT id_reserva     FROM #res);
DELETE FROM dbo.Partido     WHERE id_partido     IN (SELECT id_partido     FROM #par);
DELETE FROM dbo.Integrante  WHERE id_equipo      IN (SELECT id_equipo      FROM #eq);
DELETE FROM dbo.Equipo      WHERE id_equipo      IN (SELECT id_equipo      FROM #eq);
DELETE FROM dbo.Torneo      WHERE id_torneo      IN (SELECT id_torneo      FROM #tor);
DELETE FROM dbo.Cancha      WHERE id_cancha      IN (SELECT id_cancha      FROM #can);
DELETE FROM dbo.Cliente     WHERE id_cliente     IN (SELECT id_cliente     FROM #cli);

-- Auditoría (solo si la base ya tiene la tabla nueva)
IF OBJECT_ID('dbo.Auditoria') IS NOT NULL
    EXEC(N'DELETE a FROM dbo.Auditoria a WHERE
          (a.entidad = ''Cliente''     AND a.id_registro IN (SELECT id_cliente FROM #cli))
       OR (a.entidad = ''Cancha''      AND a.id_registro IN (SELECT id_cancha FROM #can))
       OR (a.entidad = ''Torneo''      AND a.id_registro IN (SELECT id_torneo FROM #tor))
       OR (a.entidad = ''Equipo''      AND a.id_registro IN (SELECT id_equipo FROM #eq))
       OR (a.entidad = ''Partido''     AND a.id_registro IN (SELECT id_partido FROM #par))
       OR (a.entidad = ''Reserva''     AND a.id_registro IN (SELECT id_reserva FROM #res))
       OR (a.entidad = ''Pago''        AND a.id_registro IN (SELECT id_pago FROM #pag))
       OR (a.entidad = ''Cancelacion'' AND a.id_registro IN (SELECT id_cancelacion FROM #canc))
       OR (a.entidad = ''Devolucion''  AND a.id_registro IN (SELECT id_devolucion FROM #dev))');

COMMIT;
PRINT '--- Listo: datos de prueba borrados ---';
