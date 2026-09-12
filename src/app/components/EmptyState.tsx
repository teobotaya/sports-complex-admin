import React from 'react';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionLabel, onAction }) => (
  <div className="empty-state">
    <div className="empty-state-title">{title}</div>
    {message && <div className="empty-state-text">{message}</div>}
    {actionLabel && onAction && (
      <button type="button" className="btn btn-sm btn-sc-primary text-white mt-2" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
