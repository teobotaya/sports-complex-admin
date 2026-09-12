import React from 'react';

export interface BarChartItem {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartItem[];
  formatValue?: (value: number) => string;
}

// Gráfico de barras minimalista construido con CSS puro, sin librerías de charts.
// Suficiente para el prototipo visual de Estadísticas/Reportes.
const BarChart: React.FC<BarChartProps> = ({ data, formatValue }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      {data.map((item) => (
        <div className="bar-chart-row" key={item.label}>
          <div className="bar-chart-label">{item.label}</div>
          <div className="bar-chart-track">
            <div className="bar-chart-fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <div className="bar-chart-value">{formatValue ? formatValue(item.value) : item.value}</div>
        </div>
      ))}
    </div>
  );
};

export default BarChart;
