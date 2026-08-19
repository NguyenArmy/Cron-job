import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, Key, LogOut, Info, Lock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, token, logout } = useAuth();

  return (
    <div className="page-container" style={{ maxWidth: '840px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cài đặt & Tài khoản</h1>
          <p className="page-subtitle">Thông tin tài khoản đăng nhập, phiên xác thực JWT và quyền hạn hệ thống.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* User Info Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} color="var(--primary)" />
              <h3 className="card-title">Thông tin Tài khoản</h3>
            </div>
            <span className="badge badge-active">Đang hoạt động</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tên hiển thị</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                {user?.name || 'Chưa đặt tên'}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email đăng nhập</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                {user?.email}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã người dùng (User ID)</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }} className="font-mono">
                #{user?.id}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vai trò (Role)</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#4f46e5', marginTop: '2px' }}>
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={20} color="#059669" />
              <h3 className="card-title">Danh sách quyền hạn của bạn</h3>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Các quyền được cấp từ Role <strong>{user?.role}</strong> được gửi kèm theo Access Token:
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {user?.role === 'ADMIN' ? (
              <span
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                ★ FULL ADMIN PRIVILEGES (Tất cả mọi quyền)
              </span>
            ) : user?.permissions && user.permissions.length > 0 ? (
              user.permissions.map((p, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'var(--text-main)',
                  }}
                >
                  {p.permission?.name || (p as any).name}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Chưa có quyền tùy chỉnh nào</span>
            )}
          </div>
        </div>

        {/* Security & Logout */}
        <div className="card" style={{ borderColor: '#fecaca' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={20} color="#dc2626" />
              <h3 className="card-title" style={{ color: '#b91c1c' }}>Phiên đăng nhập & Bảo mật</h3>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Đăng xuất sẽ hủy Access Token hiện tại và xóa Refresh Token cookie trên máy chủ.
          </p>

          <button
            className="btn btn-danger"
            onClick={logout}
          >
            <LogOut size={16} />
            <span>Đăng xuất khỏi hệ thống</span>
          </button>
        </div>
      </div>
    </div>
  );
};
