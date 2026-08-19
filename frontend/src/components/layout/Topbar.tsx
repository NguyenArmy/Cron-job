import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, LogOut, Settings, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface TopbarProps {
  onSearch?: (term: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/schedulers?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const notifications = [
    { id: 1, title: 'Hệ thống vừa backup cơ sở dữ liệu', time: '10 phút trước', type: 'success' },
    { id: 2, title: 'Scheduler "Backup Database" đã hoàn thành', time: '1 giờ trước', type: 'success' },
    { id: 3, title: 'Hệ thống sẵn sàng cho demo', time: 'Hôm nay', type: 'info' },
  ];

  return (
    <header className="app-topbar">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="topbar-search">
        <div className="search-wrapper">
          <Search className="search-icon" size={17} />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm jobs, logs..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </form>

      {/* Right Actions */}
      <div className="topbar-actions">
        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Thông báo"
          >
            <Bell size={18} />
            <span className="notification-dot" />
          </button>

          {showNotifications && (
            <div className="dropdown-menu" style={{ width: '320px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Thông báo gần đây</span>
                <span style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }}>Đã đọc tất cả</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle2 size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>{n.title}</p>
                      <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div ref={userMenuRef} className="user-profile-menu">
          <button
            type="button"
            className="user-profile-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="avatar-circle">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="user-profile-name">{user?.name || user?.email?.split('@')[0] || 'User'}</div>
              <div className="user-profile-role">{user?.role || 'USER'}</div>
            </div>
          </button>

          {showUserMenu && (
            <div className="dropdown-menu">
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
                  {user?.name || 'Tài khoản'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</div>
                <span className="badge badge-info" style={{ marginTop: '6px', fontSize: '11px' }}>
                  Vai trò: {user?.role}
                </span>
              </div>

              <button
                className="dropdown-item"
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
              >
                <Settings size={16} />
                <span>Cài đặt tài khoản</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/users-roles');
                }}
              >
                <UserIcon size={16} />
                <span>Người dùng & Phân quyền</span>
              </button>

              <div className="dropdown-divider" />

              <button
                className="dropdown-item danger"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
              >
                <LogOut size={16} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
