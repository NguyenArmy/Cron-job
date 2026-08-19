import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, Check } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0b1329',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-modal)',
          padding: '36px 32px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
            }}
          >
            C
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
            Đăng nhập CronMaster
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Hệ thống quản lý tác vụ định kỳ tự động hóa
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              color: '#b91c1c',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={17}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-subtle)',
                }}
              />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label required">Mật khẩu</label>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={17}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-subtle)',
                }}
              />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '14.5px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Quick Demo Login Preset Buttons */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Tài khoản mẫu nhanh để Demo:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px' }}
              onClick={() => fillDemoAccount('admin@example.com', 'admin123')}
            >
              Admin (admin@example.com)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '12px' }}
              onClick={() => fillDemoAccount('user@example.com', 'user123')}
            >
              User (user@example.com)
            </button>
          </div>
        </div>

        {/* Register Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
