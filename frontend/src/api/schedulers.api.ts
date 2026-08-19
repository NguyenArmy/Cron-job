import { apiClient } from './client';

export interface TaskAssignment {
  id: number;
  scheduleId: number;
  userId: number;
  assignedAt: string;
  user?: {
    id: number;
    name: string | null;
    email?: string;
  };
}

export interface Scheduler {
  id: number;
  name: string;
  cron: string;
  timezone: string;
  isActive: boolean;
  nextRunTime: string | null;
  lastRunTime: string | null;
  description?: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  assignments?: TaskAssignment[];
  createdBy?: {
    id: number;
    name: string | null;
    account?: { email: string };
  };
}

export interface CreateSchedulerDto {
  inputMode: 'cron' | 'schedule';
  name: string;
  cron?: string;
  timezone?: string;
  isActive?: boolean;
  description?: string;
  scheduleType?: 'every_minutes' | 'daily' | 'weekly' | 'monthly';
  everyMinutes?: number;
  minute?: number;
  hour?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  assignedUserIds: number[];
}

export interface UpdateSchedulerDto extends Partial<CreateSchedulerDto> {}

export interface ValidateCronResponse {
  isValid: boolean;
  cron: string;
  timezone: string;
  nextRunTime: string;
  message?: string;
}

export interface ImportResult {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  imported: Array<{ row: number; schedulerId: number }>;
  errors: Array<{ row: number; messages: string[] }>;
  errorFile?: any;
}

export const schedulersApi = {
  findAll: async (): Promise<Scheduler[]> => {
    const res = await apiClient.get<Scheduler[]>('/schedulers');
    return res.data;
  },

  findActive: async (): Promise<Scheduler[]> => {
    const res = await apiClient.get<Scheduler[]>('/schedulers/active');
    return res.data;
  },

  findPaused: async (): Promise<Scheduler[]> => {
    const res = await apiClient.get<Scheduler[]>('/schedulers/paused');
    return res.data;
  },

  findOne: async (id: number): Promise<Scheduler> => {
    const res = await apiClient.get<Scheduler>(`/schedulers/${id}`);
    return res.data;
  },

  create: async (dto: CreateSchedulerDto): Promise<Scheduler> => {
    const res = await apiClient.post<Scheduler>('/schedulers', dto);
    return res.data;
  },

  update: async (id: number, dto: UpdateSchedulerDto): Promise<Scheduler> => {
    const res = await apiClient.patch<Scheduler>(`/schedulers/${id}`, dto);
    return res.data;
  },

  pauseOne: async (id: number): Promise<Scheduler> => {
    const res = await apiClient.patch<Scheduler>(`/schedulers/${id}/pause`);
    return res.data;
  },

  resumeOne: async (id: number): Promise<Scheduler> => {
    const res = await apiClient.patch<Scheduler>(`/schedulers/${id}/resume`);
    return res.data;
  },

  pauseAll: async (): Promise<{ message: string; count: number }> => {
    const res = await apiClient.patch<{ message: string; count: number }>('/schedulers/pause-all');
    return res.data;
  },

  resumeAll: async (): Promise<{ message: string; count: number }> => {
    const res = await apiClient.patch<{ message: string; count: number }>('/schedulers/resume-all');
    return res.data;
  },

  remove: async (id: number): Promise<Scheduler> => {
    const res = await apiClient.delete<Scheduler>(`/schedulers/${id}`);
    return res.data;
  },

  removeAll: async () => {
    const res = await apiClient.delete('/schedulers');
    return res.data;
  },

  validateCron: async (cron: string, timezone?: string): Promise<ValidateCronResponse> => {
    const res = await apiClient.post<ValidateCronResponse>('/schedulers/validate-cron', {
      cron,
      timezone: timezone || 'Asia/Ho_Chi_Minh',
    });
    return res.data;
  },

  downloadImportTemplate: async (): Promise<Blob> => {
    const res = await apiClient.get('/schedulers/import-template', {
      responseType: 'blob',
    });
    return res.data;
  },

  exportSchedulers: async (): Promise<Blob> => {
    const res = await apiClient.get('/schedulers/export', {
      responseType: 'blob',
    });
    return res.data;
  },

  importSchedulers: async (file: File): Promise<ImportResult | Blob> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post('/schedulers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'arraybuffer', // Handle both json or error excel blob
    });

    const contentType = String(res.headers['content-type'] || '');
    if (contentType.includes('application/json')) {
      const text = new TextDecoder().decode(res.data);
      return JSON.parse(text) as ImportResult;
    } else {
      // Returns error excel file as Blob
      return new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }
  },
};
