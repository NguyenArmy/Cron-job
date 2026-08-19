import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Play,
  Pause,
  Edit2,
  Trash2,
  Clock,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { schedulersApi, Scheduler } from '../../api/schedulers.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';

export const SchedulersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission, isAdmin } = useAuth();

  const [schedulers, setSchedulers] = useState<Scheduler[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Action states & modals
  const [deleteTarget, setDeleteTarget] = useState<Scheduler | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState<boolean>(false);

  const fetchSchedulers = async () => {
    try {
      setIsLoading(true);
      let data: Scheduler[];
      if (statusFilter === 'active') {
        data = await schedulersApi.findActive();
      } else if (statusFilter === 'paused') {
        data = await schedulersApi.findPaused();
      } else {
        data = await schedulersApi.findAll();
      }
      setSchedulers(data);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Không thể tải danh sách Cron Job',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulers();
  }, [statusFilter]);

  const handleToggleStatus = async (scheduler: Scheduler) => {
    try {
      if (scheduler.isActive) {
        await schedulersApi.pauseOne(scheduler.id);
        setActionMessage({ type: 'success', text: `Đã tạm dừng job "${scheduler.name}"` });
      } else {
        await schedulersApi.resumeOne(scheduler.id);
        setActionMessage({ type: 'success', text: `Đã kích hoạt job "${scheduler.name}"` });
      }
      fetchSchedulers();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Không thể thay đổi trạng thái job',
      });
    }
  };

  const handlePauseAll = async () => {
    try {
      setIsProcessingBulk(true);
      const res = await schedulersApi.pauseAll();
      setActionMessage({ type: 'success', text: res.message || 'Đã tạm dừng tất cả Job' });
      fetchSchedulers();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Lỗi khi tạm dừng tất cả',
      });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleResumeAll = async () => {
    try {
      setIsProcessingBulk(true);
      const res = await schedulersApi.resumeAll();
      setActionMessage({ type: 'success', text: res.message || 'Đã kích hoạt tất cả Job' });
      fetchSchedulers();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Lỗi khi kích hoạt tất cả',
      });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await schedulersApi.remove(deleteTarget.id);
      setActionMessage({ type: 'success', text: `Đã xóa job "${deleteTarget.name}" thành công` });
      setDeleteTarget(null);
      fetchSchedulers();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Không thể xóa job này',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await schedulersApi.exportSchedulers();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedulers_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setActionMessage({ type: 'success', text: 'Xuất file Excel thành công' });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: 'Lỗi khi xuất file Excel',
      });
    }
  };

  // Filtered by search
  const filteredSchedulers = schedulers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cron.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Danh sách Cron Job</h1>
          <p className="page-subtitle">Quản lý và theo dõi các tác vụ định kỳ trong hệ thống.</p>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handlePauseAll}
                disabled={isProcessingBulk}
              >
                <Pause size={14} />
                <span>Tạm dừng tất cả</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleResumeAll}
                disabled={isProcessingBulk}
              >
                <Play size={14} />
                <span>Tiếp tục tất cả</span>
              </button>
            </>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleExportExcel}
            title="Xuất danh sách ra file Excel"
          >
            <Download size={14} />
            <span>Export Excel</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => navigate('/schedulers/new')}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Tạo Cron Job Mới</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: actionMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${actionMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: actionMessage.type === 'success' ? '#047857' : '#b91c1c',
            fontSize: '13.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{actionMessage.text}</span>
          </div>
          <button
            className="btn-ghost"
            style={{ padding: '2px 8px', fontSize: '12px' }}
            onClick={() => setActionMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search input matching Image 3 */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-subtle)',
            }}
          />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '38px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)' }}
            placeholder="Tìm kiếm tên job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#ffffff',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            gap: '4px',
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả ({schedulers.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter('active')}
          >
            Đang hoạt động
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'paused' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter('paused')}
          >
            Đang tạm dừng
          </button>
        </div>
      </div>

      {/* Main Table Matching Image 3 & 4 */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px' }} />
            <p>Đang tải dữ liệu Cron Job...</p>
          </div>
        ) : filteredSchedulers.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Clock size={40} color="var(--text-subtle)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Không tìm thấy Cron Job nào
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {searchTerm
                ? `Không có kết quả khớp với từ khóa "${searchTerm}".`
                : 'Chưa có tác vụ nào trong danh sách. Hãy tạo mới hoặc import từ file Excel.'}
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/schedulers/new')}
            >
              <Plus size={15} />
              <span>Tạo Cron Job đầu tiên</span>
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>TÊN JOB</th>
                <th style={{ width: '22%' }}>CRON EXPRESSION</th>
                <th style={{ width: '18%' }}>LẦN CHẠY TIẾP THEO</th>
                <th style={{ width: '16%' }}>TRẠNG THÁI</th>
                <th style={{ width: '16%', textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedulers.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14px' }}>
                      {job.name}
                    </div>
                    {job.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {job.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: 'var(--radius-xs)',
                        color: '#4338ca',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                      className="font-mono"
                    >
                      {job.cron}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                      {job.timezone}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: job.isActive ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                      {formatDateTime(job.nextRunTime)}
                    </div>
                    {job.lastRunTime && (
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                        Chạy gần nhất: {formatDateTime(job.lastRunTime)}
                      </div>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={job.isActive} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {/* Play/Pause Button */}
                      <button
                        className="btn-icon"
                        onClick={() => handleToggleStatus(job)}
                        title={job.isActive ? 'Tạm dừng job này' : 'Kích hoạt job này'}
                        style={{
                          color: job.isActive ? '#d97706' : '#16a34a',
                          backgroundColor: job.isActive ? '#fffbeb' : '#ecfdf5',
                        }}
                      >
                        {job.isActive ? <Pause size={15} /> : <Play size={15} />}
                      </button>

                      {/* Edit Button */}
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/schedulers/edit/${job.id}`)}
                        title="Chỉnh sửa cấu hình"
                        style={{ color: '#4f46e5', backgroundColor: '#eef2ff' }}
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* Delete Button */}
                      <button
                        className="btn-icon"
                        onClick={() => setDeleteTarget(job)}
                        title="Xóa job"
                        style={{ color: '#dc2626', backgroundColor: '#fef2f2' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa Cron Job"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-body)' }}>
            Bạn có chắc chắn muốn xóa tác vụ <strong>"{deleteTarget?.name}"</strong>?
            Hành động này sẽ hủy lập lịch trong hàng đợi BullMQ và không thể hoàn tác.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
