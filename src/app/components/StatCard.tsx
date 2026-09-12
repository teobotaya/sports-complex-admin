import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, hint }) => (
  <div className="stat-card">
    <div className="stat-card-label">{label}</div>
    <div className="stat-card-value">{value}</div>
    {hint && <div className="stat-card-hint">{hint}</div>}
  </div>
);

export default StatCard;
