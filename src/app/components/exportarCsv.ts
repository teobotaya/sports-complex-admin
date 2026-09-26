/**
 * Descarga un listado como archivo CSV que Excel abre directamente
 * (separador ";" y marca UTF-8 para que se vean bien las tildes).
 */
export function aCsv(encabezados: string[], filas: (string | number)[][]): string {
  const celda = (v: string | number) => {
    const t = String(v ?? '');
    return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return [encabezados, ...filas].map((f) => f.map(celda).join(';')).join('\r\n');
}

export function descargarCsv(nombreArchivo: string, encabezados: string[], filas: (string | number)[][]): void {
  const blob = new Blob(['﻿' + aCsv(encabezados, filas)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
