import { apiClient } from './client';

export interface BackupCheckpoint {
  sourceTable: string;
  lastProcessedId: number;
  processedCount: number;
  updatedAt: string;
}

export interface BackupStatusResponse {
  backupId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  currentTable: string | null;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  checkpoints: BackupCheckpoint[];
}

export interface RequestBackupResponse {
  backupId: string;
  status: string;
}

export const backupsApi = {
  requestBackup: async (): Promise<RequestBackupResponse> => {
    const res = await apiClient.post<RequestBackupResponse>('/backups');
    return res.data;
  },

  getBackupStatus: async (backupId: string): Promise<BackupStatusResponse> => {
    const res = await apiClient.get<BackupStatusResponse>(`/backups/${backupId}`);
    return res.data;
  },
};
