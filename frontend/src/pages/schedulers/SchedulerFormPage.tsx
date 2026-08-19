import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Clock,
  Info,
  Save,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Users as UsersIcon,
} from 'lucide-react';
import { schedulersApi, CreateSchedulerDto } from '../../api/schedulers.api';
import { usersApi, UserItem } from '../../api/users.api';
import { useAuth } from '../../contexts/AuthContext';

export const SchedulerFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user: currentUser, isAdmin } = useAuth();
  const isEditMode = Boolean(id);

  // Form states
  const [inputMode, setInputMode] = useState<'cron' | 'schedule'>('cron');
  const [name, setName] = useState('');
  const [cron, setCron] = useState('0 8 * * *');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);

  // Friendly schedule states
  const [scheduleType, setScheduleType] = useState<'every_minutes' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [everyMinutes, setEveryMinutes] = useState<number>(15);
  const [hour, setHour] = useState<number>(8);
  const [minute, setMinute] = useState<number>(0);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);

  // Users list for assignment
  const [availableUsers, setAvailableUsers] = useState<UserItem[]>([]);

  // Cron validation & next run preview
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    nextRunTime?: string;
    descriptionText?: string;
    errorMessage?: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(isEditMode);

  // Load available users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        if (isAdmin) {
          const users = await usersApi.findAll();
          if (users && users.length > 0) {
            setAvailableUsers(users);
            if (assignedUserIds.length === 0 && currentUser) {
              setAssignedUserIds([currentUser.id]);
            }
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load users for assignment', err);
      }

      // Fallback to currentUser
      if (currentUser) {
        setAvailableUsers([
          {
            id: currentUser.id,
            name: currentUser.name,
            roleId: 1,
            createdAt: '',
            updatedAt: '',
            account: { email: currentUser.email },
          },
        ]);
        if (assignedUserIds.length === 0) {
          setAssignedUserIds([currentUser.id]);
        }
      }
    };
    loadUsers();
  }, [isAdmin, currentUser]);

  // Load initial data if editing
  useEffect(() => {
    if (isEditMode && id) {
      const loadScheduler = async () => {
        try {
          setIsLoadingInitial(true);
          const data = await schedulersApi.findOne(Number(id));
          setName(data.name);
          setCron(data.cron);
          setTimezone(data.timezone || 'Asia/Ho_Chi_Minh');
          setIsActive(data.isActive);
          setDescription(data.description || '');
          if (data.assignments && data.assignments.length > 0) {
            setAssignedUserIds(data.assignments.map((a) => a.userId));
          } else if (currentUser) {
            setAssignedUserIds([currentUser.id]);
          }
        } catch (err: any) {
          setFormError(err.response?.data?.message || 'Không thể tải thông tin Scheduler');
        } finally {
          setIsLoadingInitial(false);
        }
      };
      loadScheduler();
    } else if (currentUser && assignedUserIds.length === 0) {
      setAssignedUserIds([currentUser.id]);
    }
  }, [isEditMode, id, currentUser]);

  // Derive cron expression from friendly schedule
  const getCronFromFriendly = (): string => {
    switch (scheduleType) {
      case 'every_minutes':
        return `*/${everyMinutes || 1} * * * *`;
      case 'daily':
        return `${minute || 0} ${hour || 0} * * *`;
      case 'weekly':
        return `${minute || 0} ${hour || 0} * * ${dayOfWeek}`;
      case 'monthly':
        return `${minute || 0} ${hour || 0} ${dayOfMonth} * *`;
      default:
        return '0 8 * * *';
    }
  };

  const getHumanFriendlyDesc = (cronExpr: string): string => {
    if (inputMode === 'schedule') {
      if (scheduleType === 'every_minutes') return `Chạy lặp lại mỗi ${everyMinutes} phút`;
      if (scheduleType === 'daily') {
        const hh = String(hour).padStart(2, '0');
        const mm = String(minute).padStart(2, '0');
        return `Chạy hàng ngày vào lúc ${hh}:${mm}`;
      }
      if (scheduleType === 'weekly') {
        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const hh = String(hour).padStart(2, '0');
        const mm = String(minute).padStart(2, '0');
        return `Chạy vào ${dayNames[dayOfWeek]} hàng tuần lúc ${hh}:${mm}`;
      }
      if (scheduleType === 'monthly') {
        const hh = String(hour).padStart(2, '0');
        const mm = String(minute).padStart(2, '0');
        return `Chạy vào ngày ${dayOfMonth} hàng tháng lúc ${hh}:${mm}`;
      }
    }

    // Heuristics for direct cron expression
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length === 5) {
      const [m, h, dom, mon, dow] = parts;
      if (m.startsWith('*/') && h === '*' && dom === '*' && mon === '*' && dow === '*') {
        return `Chạy lặp lại mỗi ${m.slice(2)} phút`;
      }
      if (!isNaN(Number(m)) && !isNaN(Number(h)) && dom === '*' && mon === '*' && dow === '*') {
        return `Chạy hàng ngày vào lúc ${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
      }
      if (!isNaN(Number(m)) && !isNaN(Number(h)) && dom === '*' && mon === '*' && !isNaN(Number(dow))) {
        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return `Chạy vào ${dayNames[Number(dow)] || 'Thứ ' + dow} hàng tuần lúc ${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
      }
    }
    return `Chạy theo lịch biểu thức "${cronExpr}"`;
  };

  // Real-time backend validation
  useEffect(() => {
    const activeCron = inputMode === 'cron' ? cron : getCronFromFriendly();
    if (!activeCron.trim()) {
      setValidationResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsValidating(true);
        const res = await schedulersApi.validateCron(activeCron, timezone);
        setValidationResult({
          isValid: true,
          nextRunTime: res.nextRunTime,
          descriptionText: getHumanFriendlyDesc(activeCron),
        });
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Biểu thức Cron không hợp lệ';
        setValidationResult({
          isValid: false,
          errorMessage: typeof msg === 'string' ? msg : 'Biểu thức Cron không đúng định dạng 5 trường chuẩn',
        });
      } finally {
        setIsValidating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cron, timezone, inputMode, scheduleType, everyMinutes, hour, minute, dayOfWeek, dayOfMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Vui lòng nhập tên cho Cron Job');
      return;
    }

    const assigned = assignedUserIds.length > 0
      ? assignedUserIds
      : currentUser ? [currentUser.id] : [];

    if (assigned.length === 0) {
      setFormError('Vui lòng chọn ít nhất một người dùng được giao việc');
      return;
    }

    const activeCron = inputMode === 'cron' ? cron.trim() : getCronFromFriendly();

    try {
      setIsSubmitting(true);

      const dto: CreateSchedulerDto = {
        inputMode,
        name: name.trim(),
        timezone,
        isActive,
        description: description.trim() || undefined,
        assignedUserIds: assigned,
        ...(inputMode === 'cron'
          ? { cron: activeCron }
          : {
              scheduleType,
              everyMinutes: scheduleType === 'every_minutes' ? Number(everyMinutes) : undefined,
              minute: scheduleType !== 'every_minutes' ? Number(minute) : undefined,
              hour: scheduleType !== 'every_minutes' ? Number(hour) : undefined,
              dayOfWeek: scheduleType === 'weekly' ? Number(dayOfWeek) : undefined,
              dayOfMonth: scheduleType === 'monthly' ? Number(dayOfMonth) : undefined,
            }),
      };

      if (isEditMode && id) {
        await schedulersApi.update(Number(id), dto);
      } else {
        await schedulersApi.create(dto);
      }

      navigate('/schedulers');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Đã xảy ra lỗi khi lưu Cron Job. Vui lòng kiểm tra lại thông tin.';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNextRunTimeDisplay = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  if (isLoadingInitial) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Đang tải thông tin cấu hình Cron Job...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Breadcrumb Navigation Matching Image 2 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px' }}>
        <Link to="/schedulers" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
          Cron Job
        </Link>
        <ChevronRight size={14} color="var(--text-subtle)" />
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
          {isEditMode ? 'Chỉnh sửa' : 'Tạo Mới'}
        </span>
      </div>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">{isEditMode ? 'Chỉnh sửa Cron Job' : 'Tạo Cron Job Mới'}</h1>
          <p className="page-subtitle">Cấu hình chi tiết cho tác vụ tự động mới của bạn.</p>
        </div>
      </div>

      {/* Form Error Alert */}
      {formError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '13.5px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Form Card Matching Image 2 */}
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ maxWidth: '820px', padding: '28px' }}>
          {/* Tên Job */}
          <div className="form-group">
            <label className="form-label required">Tên Job</label>
            <input
              type="text"
              className="form-control"
              placeholder="Nhập tên gợi nhớ cho job này"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Section: Cấu hình lịch trình */}
          <div style={{ marginTop: '28px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
              Cấu hình lịch trình
            </h3>

            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '10px',
              }}
            >
              <button
                type="button"
                className={`btn btn-sm ${inputMode === 'cron' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setInputMode('cron')}
              >
                Biểu thức Cron
              </button>
              <button
                type="button"
                className={`btn btn-sm ${inputMode === 'schedule' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setInputMode('schedule')}
              >
                Lịch dễ dùng (Wizard)
              </button>
            </div>

            {inputMode === 'cron' ? (
              /* Direct Cron Expression Input Matching Image 2 */
              <div className="form-group">
                <label className="form-label required">Cron Expression</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control font-mono"
                    placeholder="0 8 * * *"
                    value={cron}
                    onChange={(e) => setCron(e.target.value)}
                    required
                  />
                  <Clock
                    size={17}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-subtle)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                <span className="form-hint" style={{ marginTop: '4px' }}>
                  Định dạng 5 trường chuẩn: [phút] [giờ] [ngày] [tháng] [thứ trong tuần] (ví dụ: <code>0 8 * * *</code> hoặc <code>*/15 * * * *</code>)
                </span>
              </div>
            ) : (
              /* Friendly Schedule Selector */
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '160px' }}>
                    <label className="form-label">Tần suất lặp</label>
                    <select
                      className="form-control"
                      value={scheduleType}
                      onChange={(e) => setScheduleType(e.target.value as any)}
                    >
                      <option value="every_minutes">Mỗi X phút</option>
                      <option value="daily">Hàng ngày</option>
                      <option value="weekly">Hàng tuần</option>
                      <option value="monthly">Hàng tháng</option>
                    </select>
                  </div>

                  {scheduleType === 'every_minutes' && (
                    <div style={{ width: '140px' }}>
                      <label className="form-label">Số phút</label>
                      <input
                        type="number"
                        min={1}
                        max={59}
                        className="form-control"
                        value={everyMinutes}
                        onChange={(e) => setEveryMinutes(Number(e.target.value))}
                      />
                    </div>
                  )}

                  {scheduleType !== 'every_minutes' && (
                    <>
                      <div style={{ width: '100px' }}>
                        <label className="form-label">Giờ (0-23)</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          className="form-control"
                          value={hour}
                          onChange={(e) => setHour(Number(e.target.value))}
                        />
                      </div>
                      <div style={{ width: '100px' }}>
                        <label className="form-label">Phút (0-59)</label>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          className="form-control"
                          value={minute}
                          onChange={(e) => setMinute(Number(e.target.value))}
                        />
                      </div>
                    </>
                  )}

                  {scheduleType === 'weekly' && (
                    <div style={{ flex: 1, minWidth: '140px' }}>
                      <label className="form-label">Vào ngày trong tuần</label>
                      <select
                        className="form-control"
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(Number(e.target.value))}
                      >
                        <option value={1}>Thứ Hai</option>
                        <option value={2}>Thứ Ba</option>
                        <option value={3}>Thứ Tư</option>
                        <option value={4}>Thứ Năm</option>
                        <option value={5}>Thứ Sáu</option>
                        <option value={6}>Thứ Bảy</option>
                        <option value={0}>Chủ Nhật</option>
                      </select>
                    </div>
                  )}

                  {scheduleType === 'monthly' && (
                    <div style={{ width: '120px' }}>
                      <label className="form-label">Ngày trong tháng</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        className="form-control"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Real-time Validation / Preview Banner Matching Image 2 */}
            {validationResult?.isValid && (
              <div className="alert-info-box" style={{ marginBottom: '18px' }}>
                <div className="alert-info-left">
                  <div className="alert-info-icon">
                    <Info size={18} />
                  </div>
                  <div>
                    <div className="alert-info-title">
                      {validationResult.descriptionText}
                    </div>
                  </div>
                </div>
                <div className="alert-info-right">
                  <div className="alert-info-sub">Lần chạy tiếp theo:</div>
                  <div className="alert-info-val">
                    {formatNextRunTimeDisplay(validationResult.nextRunTime)}
                  </div>
                </div>
              </div>
            )}

            {validationResult && !validationResult.isValid && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#b91c1c',
                  fontSize: '13px',
                  marginBottom: '18px',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{validationResult.errorMessage}</span>
              </div>
            )}

            {/* Múi giờ */}
            <div className="form-group">
              <label className="form-label">Múi giờ</label>
              <select
                className="form-control"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+7)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
              </select>
            </div>
          </div>

          {/* Giao việc cho User (Task Assignment) */}
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">
              <UsersIcon size={15} />
              <span>Giao việc cho người dùng</span>
            </label>
            {availableUsers.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {availableUsers.map((u) => {
                  const isSelected = assignedUserIds.includes(u.id);
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        if (isSelected) {
                          setAssignedUserIds(assignedUserIds.filter((uid) => uid !== u.id));
                        } else {
                          setAssignedUserIds([...assignedUserIds, u.id]);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'var(--primary-light)' : '#ffffff',
                        color: isSelected ? 'var(--primary)' : 'var(--text-body)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {isSelected && <CheckCircle2 size={13} color="var(--primary)" />}
                      <span>{u.name || u.account?.email || `User #${u.id}`}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Tác vụ sẽ được gán mặc định cho bạn ({currentUser?.email}).
              </span>
            )}
          </div>

          {/* Mô tả */}
          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label">Mô tả tác vụ (Tùy chọn)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Ghi chú chi tiết mục đích và hoạt động của tác vụ này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Trạng thái Kích hoạt Switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              marginTop: '18px',
              marginBottom: '28px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-main)' }}>
                Kích hoạt lịch chạy ngay
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Tác vụ sẽ được đưa vào hàng đợi thực thi tự động theo biểu thức lịch đã cấu hình
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>

          {/* Footer Action Buttons Matching Image 2 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '20px',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/schedulers')}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || (validationResult !== null && !validationResult.isValid)}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Job'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
