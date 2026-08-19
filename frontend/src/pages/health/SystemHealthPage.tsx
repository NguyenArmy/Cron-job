import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
  Server,
  HardDrive,
  Layers,
} from 'lucide-react';
import { healthApi, HealthCheckResponse } from '../../api/health.api';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      const res = await healthApi.check();
      setHealth(res);
      setLastCheckTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      setHealth(err.response?.data || { status: 'error', checks: {} });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Auto refresh every 15s
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    {
      key: 'postgres',
      name: 'PostgreSQL Database',
      description: 'Lưu trữ tài khoản, phân quyền RBAC và cấu hình Schedulers',
      icon: Database,
      port: '5432',
      check: health?.checks?.postgres,
    },
    {
      key: 'redis',
      name: 'Redis Queue Server',
      description: 'Điều phối hàng đợi tác vụ BullMQ & Scheduler execution trigger',
      icon: Layers,
      port: '6379',
      check: health?.checks?.redis,
    },
    {
      key: 'mariadb',
      name: 'MariaDB Instance',
      description: 'Cơ sở dữ liệu đích cho các tiến trình Backup & Checkpointing',
      icon: Server,
      port: '3306',
      check: health?.checks?.mariadb,
    },
    {
      key: 'minio',
      name: 'MinIO Object Storage',
      description: 'Lưu trữ tệp tin đính kèm và tài nguyên S3-compatible',
      icon: HardDrive,
      port: '9000 / 9001',
      check: health?.checks?.minio,
    },
  ];

  const allUp =
    health?.status === 'ok' &&
    Object.values(health.checks || {}).every((c) => c?.status === 'up');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">System Health & Services</h1>
          <p className="page-subtitle">Giám sát trạng thái kết nối trực tiếp của các dịch vụ hạ tầng trong hệ thống.</p>
        </div>
        <div className="page-actions">
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Kiểm tra lần cuối: <strong style={{ color: 'var(--text-main)' }}>{lastCheckTime || '—'}</strong>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchHealth} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
            <span>Kiểm tra lại</span>
          </button>
        </div>
      </div>

      {/* Overall Health Status Banner */}
      <div
        style={{
          backgroundColor: allUp ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${allUp ? '#a7f3d0' : '#fecaca'}`,
          borderRadius: 'var(--radius-md)',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: allUp ? '#059669' : '#dc2626',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {allUp ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: allUp ? '#065f46' : '#991b1b' }}>
              {allUp ? 'Hệ thống hoạt động hoàn hảo' : 'Phát hiện sự cố kết nối dịch vụ'}
            </h3>
            <p style={{ fontSize: '13px', color: allUp ? '#047857' : '#b91c1c', marginTop: '2px' }}>
              {allUp
                ? 'Tất cả 4 dịch vụ (PostgreSQL, Redis, MariaDB, MinIO) đều đang phản hồi bình thường.'
                : 'Một hoặc nhiều dịch vụ hạ tầng không phản hồi kết nối. Vui lòng kiểm tra Docker containers.'}
            </p>
          </div>
        </div>
        <div
          className="badge"
          style={{
            backgroundColor: allUp ? '#dcfce7' : '#fee2e2',
            color: allUp ? '#15803d' : '#b91c1c',
            fontSize: '13px',
            padding: '6px 14px',
          }}
        >
          {allUp ? 'HEALTHY' : 'DEGRADED'}
        </div>
      </div>

      {/* 4 Infrastructure Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {services.map((svc) => {
          const Icon = svc.icon;
          const isUp = svc.check?.status === 'up';

          return (
            <div
              key={svc.key}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                borderLeft: `4px solid ${isUp ? '#10b981' : '#ef4444'}`,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isUp ? '#ecfdf5' : '#fef2f2',
                        color: isUp ? '#059669' : '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {svc.name}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }} className="font-mono">
                        Port {svc.port}
                      </span>
                    </div>
                  </div>

                  <span
                    className="badge"
                    style={{
                      backgroundColor: isUp ? '#ecfdf5' : '#fef2f2',
                      color: isUp ? '#047857' : '#b91c1c',
                      fontSize: '12px',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isUp ? '#10b981' : '#ef4444',
                      }}
                    />
                    {isUp ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {svc.description}
                </p>
              </div>

              <div
                style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-light)',
                  fontSize: '12px',
                  color: isUp ? '#059669' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isUp ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Kết nối hoạt động ổn định</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    <span>{svc.check?.error || 'Mất kết nối với service'}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
