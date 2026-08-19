import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Modal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, LifeBuoy, Server, Database, ShieldCheck, Zap } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Đang tải CronMaster...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar
        onOpenSupport={() => setShowSupportModal(true)}
        onOpenDocs={() => setShowDocsModal(true)}
      />
      <div className="app-main">
        <Topbar />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>

      {/* Support Modal */}
      <Modal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        title="Trung tâm Hỗ trợ & Thông tin Hệ thống"
        subtitle="Hệ thống quản lý tác vụ CronMaster"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <LifeBuoy size={24} color="#4f46e5" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '4px' }}>Hỗ trợ Kỹ thuật</h4>
              <p style={{ fontSize: '13px' }}>
                Hệ thống hỗ trợ chạy tác vụ định kỳ tự động bằng <strong>BullMQ + Redis</strong> và cơ sở dữ liệu <strong>PostgreSQL + MariaDB</strong>.
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            <div><strong>Backend API:</strong> <code>http://localhost:3001</code></div>
            <div><strong>MinIO Console:</strong> <code>http://localhost:9001</code></div>
            <div><strong>Múi giờ chuẩn:</strong> <code>Asia/Ho_Chi_Minh (UTC+7)</code></div>
          </div>

          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowSupportModal(false)}>
              Đã hiểu
            </button>
          </div>
        </div>
      </Modal>

      {/* Docs Modal */}
      <Modal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
        title="Tài liệu Hướng dẫn CronMaster"
        subtitle="Cú pháp Cron Expression và tính năng"
        maxWidth="640px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px' }}>
          <p>
            Cron Expression gồm 5 thành phần: <code>[phút] [giờ] [ngày trong tháng] [tháng] [thứ trong tuần]</code>
          </p>

          <table className="table" style={{ border: '1px solid var(--border-color)', borderRadius: '6px' }}>
            <thead>
              <tr>
                <th>Biểu thức Cron</th>
                <th>Ý nghĩa</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>0 8 * * *</code></td>
                <td>Chạy hàng ngày vào lúc 08:00 AM</td>
              </tr>
              <tr>
                <td><code>0 0 * * *</code></td>
                <td>Chạy lúc nửa đêm mỗi ngày (00:00)</td>
              </tr>
              <tr>
                <td><code>*/15 * * * *</code></td>
                <td>Chạy lặp lại mỗi 15 phút</td>
              </tr>
              <tr>
                <td><code>0 2 * * 1</code></td>
                <td>Chạy lúc 02:00 sáng Thứ Hai hàng tuần</td>
              </tr>
              <tr>
                <td><code>0 12 1 * *</code></td>
                <td>Chạy lúc 12:00 ngày đầu tiên mỗi tháng</td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowDocsModal(false)}>
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
