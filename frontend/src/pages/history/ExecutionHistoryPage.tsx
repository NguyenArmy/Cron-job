import React, { useState, useEffect } from 'react';
import {
  History,
  Database,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { backupsApi, BackupStatusResponse } from '../../api/backups.api';
import { schedulersApi, Scheduler } from '../../api/schedulers.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';

export const ExecutionHistoryPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [schedulers, setSchedulers] = useState<Scheduler[]>([]);
  const [activeBackupId, setActiveBackupId] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatusResponse | null>(null);
  const [isRequestingBackup, setIsRequestingBackup] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [backupError, setBackupError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const list = await schedulersApi.findAll();
      setSchedulers(list);
    } catch (err) {
      console.error('Failed to load scheduler execution history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Poll backup status if active
  useEffect(() => {
    if (!activeBackupId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await backupsApi.getBackupStatus(activeBackupId);
        setBackupStatus(res);

        if (res.status === 'COMPLETED' || res.status === 'FAILED') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Error polling backup status', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [activeBackupId]);

  const handleTriggerBackup = async () => {
    try {
      setIsRequestingBackup(true);
      setBackupError(null);
      const res = await backupsApi.requestBackup();
      setActiveBackupId(res.backupId);

      // Fetch initial status
      const statusRes = await backupsApi.getBackupStatus(res.backupId);
      setBackupStatus(statusRes);
    } catch (err: any) {
      setBackupError(err.response?.data?.message || 'Không thể yêu cầu backup. Chỉ Admin mới có quyền thực hiện.');
    } finally {
      setIsRequestingBackup(false);
    }
  };

  const executedSchedulers = schedulers.filter((s) => s.lastRunTime);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Lịch sử Thực thi & Sao lưu</h1>
          <p className="page-subtitle">Nhật ký các lần chạy Scheduler và tiến trình sao lưu cơ sở dữ liệu MariaDB.</p>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={handleTriggerBackup}
              disabled={isRequestingBackup}
            >
              <Database size={16} />
              <span>{isRequestingBackup ? 'Đang gửi yêu cầu...' : 'Kích hoạt Backup MariaDB'}</span>
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={fetchHistory}>
            <RefreshCw size={14} className={isLoadingHistory ? 'spin-icon' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {backupError && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#b91c1c',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{backupError}</span>
        </div>
      )}

      {/* Live Backup Run Monitor Card */}
      {backupStatus && (
        <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--primary)' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#eef2ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={18} />
              </div>
              <div>
                <h3 className="card-title">Tiến trình Backup MariaDB</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }} className="font-mono">
                  ID: {backupStatus.backupId}
                </span>
              </div>
            </div>

            <StatusBadge status={backupStatus.status} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bảng đang xử lý</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                {backupStatus.currentTable || 'Chưa bắt đầu'}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Thời gian yêu cầu</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                {new Date(backupStatus.requestedAt).toLocaleTimeString('vi-VN')}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bắt đầu / Kết thúc</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                {backupStatus.completedAt
                  ? `Hoàn thành lúc ${new Date(backupStatus.completedAt).toLocaleTimeString('vi-VN')}`
                  : backupStatus.startedAt
                  ? `Bắt đầu lúc ${new Date(backupStatus.startedAt).toLocaleTimeString('vi-VN')}`
                  : 'Đang chờ hàng đợi...'}
              </div>
            </div>
          </div>

          {/* Checkpoints table */}
          {backupStatus.checkpoints && backupStatus.checkpoints.length > 0 && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                Checkpoints các bảng đã sao lưu ({backupStatus.checkpoints.length}):
              </h4>
              <div className="table-container">
                <table className="table" style={{ fontSize: '12.5px' }}>
                  <thead>
                    <tr>
                      <th>BẢNG DỮ LIỆU</th>
                      <th>LAST PROCESSED ID</th>
                      <th>SỐ DÒNG ĐÃ XỬ LÝ</th>
                      <th>CẬP NHẬT LÚC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupStatus.checkpoints.map((cp) => (
                      <tr key={cp.sourceTable}>
                        <td style={{ fontWeight: 600 }}>{cp.sourceTable}</td>
                        <td className="font-mono">{cp.lastProcessedId}</td>
                        <td>
                          <span className="badge badge-active">{cp.processedCount} records</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {new Date(cp.updatedAt).toLocaleTimeString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedulers Execution Logs Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Nhật ký chạy Scheduler gần đây</h3>
        </div>

        {executedSchedulers.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Clock size={36} color="var(--text-subtle)" style={{ margin: '0 auto 10px' }} />
            <p>Chưa có lượt chạy Scheduler nào được ghi nhận gần đây.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>TÊN SCHEDULER</th>
                  <th>CRON EXPRESSION</th>
                  <th>MÚI GIỜ</th>
                  <th>CHẠY GẦN NHẤT</th>
                  <th>LẦN CHẠY TIẾP THEO</th>
                  <th>TRẠNG THÁI HIỆN TẠI</th>
                </tr>
              </thead>
              <tbody>
                {executedSchedulers.map((job) => (
                  <tr key={job.id}>
                    <td style={{ fontWeight: 700 }}>{job.name}</td>
                    <td>
                      <code style={{ color: '#4338ca', fontWeight: 600 }}>{job.cron}</code>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{job.timezone}</td>
                    <td style={{ fontWeight: 600 }}>
                      {new Date(job.lastRunTime!).toLocaleString('vi-VN')}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {job.nextRunTime ? new Date(job.nextRunTime).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td>
                      <StatusBadge status={job.isActive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
