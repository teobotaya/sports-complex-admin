import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <div className="page-header">
    <div>
      <h2>{title}</h2>
      {subtitle && <div className="page-subtitle">{subtitle}</div>}
    </div>
    {action}
  </div>
);

export default PageHeader;
