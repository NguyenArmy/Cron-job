import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Calendar,
  RefreshCw,
  Rocket,
  FileText,
  Clock,
  ArrowRight,
  Database,
  Activity,
  Layers,
} from 'lucide-react';
import { schedulersApi, Scheduler } from '../../api/schedulers.api';
import { healthApi, HealthCheckResponse } from '../../api/health.api';
import { StatusBadge } from '../../components/common/StatusBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [schedulers, setSchedulers] = useState<Scheduler[]>([]);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('Vừa xong');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [schedulersData, healthData] = await Promise.all([
        schedulersApi.findAll().catch(() => []),
        healthApi.check().catch(() => null),
      ]);
      setSchedulers(schedulersData);
      setHealth(healthData);
      setLastUpdated('Vừa xong');
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalJobs = schedulers.length;
  const activeJobs = schedulers.filter((s) => s.isActive).length;
  const pausedJobs = schedulers.filter((s) => !s.isActive).length;

  const isAllSystemsHealthy =
    health?.status === 'ok' &&
    Object.values(health.checks || {}).every((c) => c?.status === 'up');

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Chưa chạy';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN');
  };

  const getTimeUntil = (nextRunStr?: string | null) => {
    if (!nextRunStr) return 'Chưa lên lịch';
    const now = new Date().getTime();
    const target = new Date(nextRunStr).getTime();
    const diffMs = target - now;

    if (diffMs <= 0) return 'Đang xử lý...';
    const diffMins = Math.round(diffMs / (1000 * 60));
    if (diffMins < 60) return `trong ${diffMins} phút`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `trong ${diffHours} giờ`;
    const diffDays = Math.round(diffHours / 24);
    return `trong ${diffDays} ngày`;
  };

  // Recent jobs (sorted by lastRunTime or createdAt)
  const recentJobs = [...schedulers]
    .sort((a, b) => {
      const timeA = a.lastRunTime ? new Date(a.lastRunTime).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastRunTime ? new Date(b.lastRunTime).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    })
    .slice(0, 5);

  // Upcoming jobs (active with nextRunTime)
  const upcomingJobs = [...schedulers]
    .filter((s) => s.isActive && s.nextRunTime)
    .sort((a, b) => new Date(a.nextRunTime!).getTime() - new Date(b.nextRunTime!).getTime())
    .slice(0, 4);

  // Simulated 7-day activity bar heights
  const weekData = [
    { day: 'T2', success: 42, fail: 0 },
    { day: 'T3', success: 60, fail: 0 },
    { day: 'T4', success: 56, fail: 2 },
    { day: 'T5', success: 70, fail: 0 },
    { day: 'T6', success: 48, fail: 0 },
    { day: 'T7', success: 65, fail: 3 },
    { day: 'CN', success: 78, fail: 0 },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tổng quan</h1>
          <p className="page-subtitle">Trạng thái hệ thống và hoạt động gần đây.</p>
        </div>
        <div className="page-actions">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-main)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <Calendar size={15} color="var(--text-muted)" />
            <span>Hôm nay, 19 Tháng 8, 2026</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchData}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="stats-grid">
        {/* Card 1: Tổng số Job */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">TỔNG SỐ JOB</span>
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}
            >
              <BookOpen size={16} />
            </div>
          </div>
          <div className="stat-value">{totalJobs}</div>
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">ĐANG HOẠT ĐỘNG</span>
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: '#ecfdf5', color: '#059669' }}
            >
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="stat-value">{activeJobs}</div>
        </div>

        {/* Card 3: Đã tạm dừng */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">ĐÃ TẠM DỪNG</span>
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}
            >
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="stat-value">{pausedJobs}</div>
        </div>
      </div>

      {/* Middle Section: 7-Day Activity Chart & System Status Card */}
      <div className="middle-grid">
        {/* 7-Day Activity Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Thống kê hoạt động (7 ngày qua)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4f46e5' }} />
                <span style={{ color: 'var(--text-muted)' }}>Thành công</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <span style={{ color: 'var(--text-muted)' }}>Thất bại</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div
            style={{
              height: '210px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              paddingTop: '20px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            {weekData.map((item, idx) => {
              const maxVal = 100;
              const successHeight = (item.success / maxVal) * 160;
              const failHeight = (item.fail / maxVal) * 160;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    {item.fail > 0 && (
                      <div
                        style={{
                          width: '100%',
                          height: `${failHeight}px`,
                          backgroundColor: '#ef4444',
                          borderTopLeftRadius: '3px',
                          borderTopRightRadius: '3px',
                        }}
                        title={`Thất bại: ${item.fail}`}
                      />
                    )}
                    <div
                      style={{
                        width: '100%',
                        height: `${successHeight}px`,
                        backgroundColor: '#4f46e5',
                        borderRadius: item.fail > 0 ? '0 0 3px 3px' : '3px 3px 0 0',
                      }}
                      title={`Thành công: ${item.success}`}
                    />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Health Status Card */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '32px 24px',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: isAllSystemsHealthy ? '#dcfce7' : '#fee2e2',
              color: isAllSystemsHealthy ? '#16a34a' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            {isAllSystemsHealthy ? <CheckCircle2 size={38} /> : <AlertCircle size={38} />}
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Tất cả hệ thống
          </h3>

          <div
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              backgroundColor: isAllSystemsHealthy ? '#ecfdf5' : '#fef2f2',
              color: isAllSystemsHealthy ? '#047857' : '#b91c1c',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              fontSize: '13px',
              marginBottom: '28px',
            }}
          >
            {isAllSystemsHealthy ? 'Đang hoạt động bình thường' : 'Có dịch vụ gặp sự cố kết nối'}
          </div>

          <div
            style={{
              width: '100%',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12.5px',
              color: 'var(--text-muted)',
            }}
          >
            <span>Cập nhật lần cuối:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Job vừa thực thi & Job sắp chạy */}
      <div className="bottom-grid">
        {/* Left: Job vừa thực thi Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Job vừa thực thi</h3>
            <Link
              to="/schedulers"
              style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Chưa có tác vụ nào trong hệ thống.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>TÊN JOB</th>
                    <th>THỜI GIAN</th>
                    <th>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => (
                    <tr key={job.id}>
                      <td style={{ fontWeight: 600 }}>{job.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
                        {formatDate(job.lastRunTime || job.createdAt)}
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

        {/* Right: Job sắp chạy List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Job sắp chạy</h3>
            <button
              className="btn-icon"
              onClick={fetchData}
              title="Cập nhật danh sách sắp chạy"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {upcomingJobs.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Không có tác vụ nào đang hoạt động có lịch sắp chạy.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                        flexShrink: 0,
                      }}
                    >
                      <Rocket size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>
                        {job.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }} className="font-mono">
                        {job.cron} ({job.timezone})
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#4f46e5' }}>
                      {getTimeUntil(job.nextRunTime)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                      {job.nextRunTime ? new Date(job.nextRunTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
