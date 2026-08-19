import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  History,
  FileSpreadsheet,
  Activity,
  Users,
  Settings,
  HelpCircle,
  FileText,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onOpenSupport?: () => void;
  onOpenDocs?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSupport, onOpenDocs }) => {
  const navigate = useNavigate();
  const { hasPermission, isAdmin } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'Cron Job',
      path: '/schedulers',
      icon: Clock,
      show: true,
    },
    {
      label: 'Lịch sử thực thi',
      path: '/history',
      icon: History,
      show: true,
    },
    {
      label: 'Import Excel',
      path: '/excel',
      icon: FileSpreadsheet,
      show: true,
    },
    {
      label: 'System Health',
      path: '/health',
      icon: Activity,
      show: true,
    },
    {
      label: 'Người dùng & Phân quyền',
      path: '/users-roles',
      icon: Users,
      show: isAdmin || hasPermission('user:read') || hasPermission('role:read'),
    },
    {
      label: 'Cài đặt',
      path: '/settings',
      icon: Settings,
      show: true,
    },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="logo-icon">C</div>
        <div className="logo-info">
          <span className="logo-title">CronMaster</span>
          <span className="logo-sub">Task Management System</span>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="sidebar-action">
        <button
          className="btn-sidebar-create"
          onClick={() => navigate('/schedulers/new')}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Tạo Task Mới</span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="nav-icon" size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* Footer Navigation */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-footer-link"
          style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
          onClick={onOpenSupport}
        >
          <HelpCircle className="nav-icon" size={18} />
          <span>Hỗ trợ</span>
        </button>
        <button
          type="button"
          className="sidebar-footer-link"
          style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
          onClick={onOpenDocs}
        >
          <FileText className="nav-icon" size={18} />
          <span>Tài liệu</span>
        </button>
      </div>
    </aside>
  );
};
