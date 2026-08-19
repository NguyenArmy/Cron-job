import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Key,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { usersApi, UserItem } from '../../api/users.api';
import { rolesApi, permissionsApi, RoleItem, PermissionItem } from '../../api/roles.api';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';

export const UsersRolesPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');

  // Users State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRoleId, setEditUserRoleId] = useState<number>(1);
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Role Create/Edit Modal
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [selectedRolePerms, setSelectedRolePerms] = useState<string[]>([]);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Permission Create Modal
  const [isCreatingPerm, setIsCreatingPerm] = useState(false);
  const [newPermName, setNewPermName] = useState('');
  const [isSavingPerm, setIsSavingPerm] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setMessage(null);

      const [usersData, rolesData, permsData] = await Promise.all([
        usersApi.findAll().catch((e) => {
          console.error('Failed to load users:', e);
          return [];
        }),
        rolesApi.findAll().catch((e) => {
          console.error('Failed to load roles:', e);
          return [];
        }),
        permissionsApi.findAll().catch((e) => {
          console.error('Failed to load permissions:', e);
          return [];
        }),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Không thể tải dữ liệu Người dùng & Phân quyền',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Edit User
  const handleOpenEditUser = (user: UserItem) => {
    setEditingUser(user);
    setEditUserName(user.name || '');
    setEditUserRoleId(user.roleId);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsSavingUser(true);
      await usersApi.update(editingUser.id, {
        name: editUserName.trim() || undefined,
        roleId: editUserRoleId,
      });
      setMessage({ type: 'success', text: `Cập nhật người dùng #${editingUser.id} thành công!` });
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi cập nhật người dùng' });
    } finally {
      setIsSavingUser(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user: UserItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user.account?.email || user.name}"?`)) return;

    try {
      await usersApi.remove(user.id);
      setMessage({ type: 'success', text: 'Đã xóa người dùng thành công' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi xóa người dùng' });
    }
  };

  // Handle Open Create Role
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleName('');
    setSelectedRolePerms([]);
    setIsCreatingRole(true);
  };

  // Handle Open Edit Role
  const handleOpenEditRole = (role: RoleItem) => {
    setEditingRole(role);
    setRoleName(role.name);
    setSelectedRolePerms(role.permissions?.map((p) => p.permission.name) || []);
    setIsCreatingRole(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    try {
      setIsSavingRole(true);
      if (editingRole) {
        await rolesApi.update(editingRole.id, {
          name: roleName.trim(),
          permissions: selectedRolePerms,
        });
        setMessage({ type: 'success', text: `Đã cập nhật role "${roleName}"` });
      } else {
        await rolesApi.create({
          name: roleName.trim(),
          permissions: selectedRolePerms,
        });
        setMessage({ type: 'success', text: `Đã tạo role "${roleName}" mới thành công` });
      }
      setIsCreatingRole(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi lưu role' });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Role "${role.name}"?`)) return;

    try {
      await rolesApi.remove(role.id);
      setMessage({ type: 'success', text: `Đã xóa Role "${role.name}"` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể xóa Role này' });
    }
  };

  // Handle Create Permission
  const handleSavePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermName.trim()) return;

    try {
      setIsSavingPerm(true);
      await permissionsApi.create(newPermName.trim());
      setMessage({ type: 'success', text: `Đã tạo permission "${newPermName}"` });
      setNewPermName('');
      setIsCreatingPerm(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi tạo quyền mới' });
    } finally {
      setIsSavingPerm(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Người dùng & Phân quyền</h1>
          <p className="page-subtitle">Quản trị danh sách người dùng, vai trò (Roles) và ma trận quyền hạn (Permissions).</p>
        </div>
        <div className="page-actions">
          {activeTab === 'roles' && (
            <button className="btn btn-primary" onClick={handleOpenCreateRole}>
              <Plus size={16} />
              <span>Tạo Role Mới</span>
            </button>
          )}
          {activeTab === 'permissions' && (
            <button className="btn btn-primary" onClick={() => setIsCreatingPerm(true)}>
              <Plus size={16} />
              <span>Tạo Quyền Mới</span>
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: message.type === 'success' ? '#047857' : '#b91c1c',
            fontSize: '13.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button className="btn-ghost" style={{ padding: '2px 6px' }} onClick={() => setMessage(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '10px',
        }}
      >
        <button
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={15} />
          <span>Người dùng ({users.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'roles' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={15} />
          <span>Vai trò / Roles ({roles.length})</span>
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'permissions' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('permissions')}
        >
          <Key size={15} />
          <span>Quyền hạn / Permissions ({permissions.length})</span>
        </button>
      </div>

      {/* Tab 1: Users List */}
      {activeTab === 'users' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>TÊN NGƯỜI DÙNG</th>
                <th>EMAIL ĐĂNG NHẬP</th>
                <th>VAI TRÒ (ROLE)</th>
                <th>JOB ĐÃ TẠO / ĐƯỢC GIAO</th>
                <th>NGÀY THAM GIA</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-mono">#{u.id}</td>
                  <td style={{ fontWeight: 700 }}>{u.name || '—'}</td>
                  <td style={{ color: 'var(--text-body)' }}>{u.account?.email || '—'}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: u.role?.name === 'ADMIN' ? '#eff6ff' : '#f1f5f9',
                        color: u.role?.name === 'ADMIN' ? '#1d4ed8' : '#334155',
                        fontWeight: 700,
                      }}
                    >
                      {u.role?.name || 'USER'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Tạo: <strong>{u._count?.createdSchedules || 0}</strong> | Giao: <strong>{u._count?.assignedSchedules || 0}</strong>
                  </td>
                  <td style={{ color: 'var(--text-subtle)', fontSize: '12.5px' }}>
                    {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenEditUser(u)}
                        title="Chỉnh sửa người dùng"
                        style={{ color: '#4f46e5', backgroundColor: '#eef2ff' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      {currentUser?.id !== u.id && (
                        <button
                          className="btn-icon"
                          onClick={() => handleDeleteUser(u)}
                          title="Xóa người dùng"
                          style={{ color: '#dc2626', backgroundColor: '#fef2f2' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Roles List */}
      {activeTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {roles.map((role) => (
            <div key={role.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={18} color="#4f46e5" />
                    <h3 style={{ fontSize: '16px', fontWeight: 800 }}>{role.name}</h3>
                  </div>
                  <span className="badge badge-info">{role._count?.users || 0} thành viên</span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    QUYỀN HẠN ĐƯỢC CẤP ({role.permissions?.length || 0}):
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.map((rp) => (
                        <span
                          key={rp.permission.id}
                          style={{
                            padding: '3px 8px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '11.5px',
                            fontFamily: 'JetBrains Mono, monospace',
                            color: '#334155',
                          }}
                        >
                          {rp.permission.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>Chưa gán quyền nào</span>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '12px',
                }}
              >
                <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditRole(role)}>
                  <Edit2 size={13} />
                  <span>Sửa quyền</span>
                </button>
                {role.name !== 'USER' && role.name !== 'ADMIN' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRole(role)}>
                    <Trash2 size={13} />
                    <span>Xóa</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Permissions List */}
      {activeTab === 'permissions' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Danh sách quyền hệ thống</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {permissions.map((perm) => (
              <div
                key={perm.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Key size={16} color="#4f46e5" />
                <span className="font-mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {perm.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Chỉnh sửa Người dùng"
        subtitle={editingUser?.account?.email || ''}
      >
        <form onSubmit={handleSaveUser}>
          <div className="form-group">
            <label className="form-label">Tên người dùng</label>
            <input
              type="text"
              className="form-control"
              value={editUserName}
              onChange={(e) => setEditUserName(e.target.value)}
              placeholder="Nhập tên hiển thị"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label required">Gán Vai trò (Role)</label>
            <select
              className="form-control"
              value={editUserRoleId}
              onChange={(e) => setEditUserRoleId(Number(e.target.value))}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSavingUser}>
              {isSavingUser ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create / Edit Role Modal */}
      <Modal
        isOpen={isCreatingRole}
        onClose={() => setIsCreatingRole(false)}
        title={editingRole ? `Chỉnh sửa Role: ${editingRole.name}` : 'Tạo Role Mới'}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveRole}>
          <div className="form-group">
            <label className="form-label required">Tên Role</label>
            <input
              type="text"
              className="form-control"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Ví dụ: OPERATOR, MANAGER"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Phân quyền cho Role này</label>
            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '8px',
              }}
            >
              {permissions.map((p) => {
                const isChecked = selectedRolePerms.includes(p.name);
                return (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRolePerms([...selectedRolePerms, p.name]);
                        } else {
                          setSelectedRolePerms(selectedRolePerms.filter((name) => name !== p.name));
                        }
                      }}
                    />
                    <span className="font-mono">{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreatingRole(false)}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSavingRole}>
              {isSavingRole ? 'Đang lưu...' : 'Lưu Role'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Permission Modal */}
      <Modal
        isOpen={isCreatingPerm}
        onClose={() => setIsCreatingPerm(false)}
        title="Tạo Quyền (Permission) Mới"
      >
        <form onSubmit={handleSavePermission}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label required">Tên Permission</label>
            <input
              type="text"
              className="form-control font-mono"
              value={newPermName}
              onChange={(e) => setNewPermName(e.target.value)}
              placeholder="ví dụ: report:export"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreatingPerm(false)}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSavingPerm}>
              {isSavingPerm ? 'Đang tạo...' : 'Tạo Quyền'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
