import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'paused' | 'failed' | 'queued' | 'running' | 'completed' | boolean | string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  let badgeClass = 'badge-active';
  let displayLabel = label;

  if (typeof status === 'boolean') {
    if (status) {
      badgeClass = 'badge-active';
      displayLabel = displayLabel || 'Đang hoạt động';
    } else {
      badgeClass = 'badge-paused';
      displayLabel = displayLabel || 'Đang tạm dừng';
    }
  } else {
    const s = String(status).toLowerCase();
    if (s === 'active' || s === 'true' || s === 'completed' || s === 'success' || s === 'thành công') {
      badgeClass = 'badge-active';
      displayLabel = displayLabel || (s === 'completed' ? 'Hoàn thành' : 'Đang hoạt động');
    } else if (s === 'paused' || s === 'false' || s === 'queued' || s === 'đang tạm dừng') {
      badgeClass = 'badge-paused';
      displayLabel = displayLabel || (s === 'queued' ? 'Đang chờ' : 'Đang tạm dừng');
    } else if (s === 'failed' || s === 'error' || s === 'thất bại') {
      badgeClass = 'badge-failed';
      displayLabel = displayLabel || 'Thất bại';
    } else if (s === 'running') {
      badgeClass = 'badge-info';
      displayLabel = displayLabel || 'Đang chạy';
    }
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      {displayLabel}
    </span>
  );
};
