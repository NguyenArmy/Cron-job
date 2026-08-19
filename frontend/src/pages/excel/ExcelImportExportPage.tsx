import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  FolderUp,
  Database,
  ArrowRight,
} from 'lucide-react';
import { schedulersApi, ImportResult } from '../../api/schedulers.api';
import { filesApi } from '../../api/files.api';

export const ExcelImportExportPage: React.FC = () => {
  // Schedulers Import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importErrorBlob, setImportErrorBlob] = useState<Blob | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // MinIO File upload state
  const [minioFile, setMinioFile] = useState<File | null>(null);
  const [isUploadingMinio, setIsUploadingMinio] = useState(false);
  const [minioResult, setMinioResult] = useState<any | null>(null);
  const [minioError, setMinioError] = useState<string | null>(null);
  const minioInputRef = useRef<HTMLInputElement>(null);

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await schedulersApi.downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scheduler-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Không thể tải file mẫu. Vui lòng thử lại sau.');
    }
  };

  // Export schedulers
  const handleExportSchedulers = async () => {
    try {
      const blob = await schedulersApi.exportSchedulers();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedulers_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Không thể xuất danh sách. Vui lòng thử lại sau.');
    }
  };

  // Handle import execution
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsImporting(true);
      setImportResult(null);
      setImportErrorBlob(null);
      setImportErrorMsg(null);

      const result = await schedulersApi.importSchedulers(selectedFile);

      if (result instanceof Blob) {
        setImportErrorBlob(result);
        setImportErrorMsg('File import có lỗi dữ liệu. Vui lòng tải file lỗi bên dưới để xem chi tiết.');
      } else {
        setImportResult(result);
        if (result.failedCount > 0 && result.errorFile) {
          // Has some errors
        }
      }
    } catch (err: any) {
      setImportErrorMsg(err.response?.data?.message || 'Đã xảy ra lỗi khi nhập file Excel');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadErrorFile = () => {
    if (!importErrorBlob) return;
    const url = window.URL.createObjectURL(importErrorBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scheduler-import-errors.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // MinIO File upload
  const handleMinioUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minioFile) return;

    try {
      setIsUploadingMinio(true);
      setMinioResult(null);
      setMinioError(null);

      const res = await filesApi.upload(minioFile);
      setMinioResult(res);
    } catch (err: any) {
      setMinioError(err.response?.data?.message || 'Lỗi tải file lên MinIO');
    } finally {
      setIsUploadingMinio(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Import & Export Dữ liệu</h1>
          <p className="page-subtitle">Nhập hàng loạt Cron Job từ Excel, xuất dữ liệu và tải file lên MinIO Object Storage.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
            <Download size={16} />
            <span>Tải File Mẫu Excel</span>
          </button>
          <button className="btn btn-primary" onClick={handleExportSchedulers}>
            <Download size={16} />
            <span>Export Toàn Bộ Job</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Card 1: Import Excel Schedulers */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 className="card-title">Nhập Cron Job từ File Excel</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Chấp nhận định dạng chuẩn .xlsx</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleImportSubmit}>
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '32px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-subtle)',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <Upload size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px', marginBottom: '4px' }}>
                {selectedFile ? selectedFile.name : 'Nhấp để chọn hoặc kéo thả file Excel (.xlsx)'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {selectedFile
                  ? `Dung lượng: ${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'Tối đa 5MB mỗi lần tải lên'}
              </p>
            </div>

            {importErrorMsg && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  color: '#b91c1c',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{importErrorMsg}</span>
              </div>
            )}

            {importErrorBlob && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDownloadErrorFile}
                  style={{ color: '#dc2626', borderColor: '#fecaca', width: '100%' }}
                >
                  <Download size={14} />
                  <span>Tải File Báo Cáo Lỗi (.xlsx)</span>
                </button>
              </div>
            )}

            {importResult && (
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontWeight: 700, marginBottom: '6px' }}>
                  <CheckCircle2 size={18} />
                  <span>Kết quả Import:</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.6 }}>
                  <div>Tổng số dòng: <strong>{importResult.totalRows}</strong></div>
                  <div>Thành công: <strong style={{ color: '#059669' }}>{importResult.importedCount}</strong></div>
                  <div>Thất bại: <strong style={{ color: '#dc2626' }}>{importResult.failedCount}</strong></div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? 'Đang xử lý import...' : 'Bắt đầu Import'}
            </button>
          </form>
        </div>

        {/* Card 2: MinIO Storage File Upload */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FolderUp size={20} />
              </div>
              <div>
                <h3 className="card-title">Upload File lên MinIO S3</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Demo Object Storage (`/files/upload`)</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleMinioUpload}>
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '32px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-subtle)',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => minioInputRef.current?.click()}
            >
              <input
                ref={minioInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setMinioFile(e.target.files[0]);
                  }
                }}
              />
              <Upload size={32} color="#2563eb" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px', marginBottom: '4px' }}>
                {minioFile ? minioFile.name : 'Chọn file bất kỳ để upload lên MinIO'}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {minioFile
                  ? `Dung lượng: ${(minioFile.size / 1024).toFixed(1)} KB`
                  : 'Hỗ trợ ảnh, tài liệu PDF, zip (tối đa 10MB)'}
              </p>
            </div>

            {minioError && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  color: '#b91c1c',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{minioError}</span>
              </div>
            )}

            {minioResult && (
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontWeight: 700, marginBottom: '6px' }}>
                  <CheckCircle2 size={18} />
                  <span>Tải lên MinIO thành công!</span>
                </div>
                <pre style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '4px', fontSize: '12px', overflowX: 'auto' }}>
                  {JSON.stringify(minioResult, null, 2)}
                </pre>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              disabled={!minioFile || isUploadingMinio}
            >
              {isUploadingMinio ? 'Đang tải file lên...' : 'Tải lên MinIO'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
