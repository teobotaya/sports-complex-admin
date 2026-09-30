#!/bin/bash
# Ejecuta database/limpiar_datos_qa.sql contra la base del contenedor "db" de docker compose.
set -e
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
# La base puede haberse levantado con docker compose o a mano: se busca el contenedor que publica el puerto 1433.
DB=$(docker ps -q --filter "publish=1433" | head -n 1)
[ -n "$DB" ] || DB=$(docker compose ps -q db 2>/dev/null)
if [ -z "$DB" ]; then
  echo "No hay ningún contenedor de SQL Server corriendo. Contenedores existentes:"
  docker ps -a --format '  {{.Names}}  ({{.Image}})  {{.Status}}'
  echo "Levantá la base con:  cd ~/Desktop/sports-complex-admin && docker compose up -d db   y volvé a ejecutar este script."
  exit 1
fi
echo "Usando el contenedor: $(docker ps --filter id=$DB --format '{{.Names}} ({{.Image}})')"
# El script se pasa como archivo (-i): leerlo por la entrada estándar hace que sqlcmd se corte.
docker run --rm --platform linux/amd64 --network "container:$DB" -v "$PWD/database:/scripts:ro" \
  mcr.microsoft.com/mssql-tools \
  /opt/mssql-tools/bin/sqlcmd -I -S localhost -U sa -P "$DB_PASSWORD" -b -W -s " | " -i /scripts/limpiar_datos_qa.sql
