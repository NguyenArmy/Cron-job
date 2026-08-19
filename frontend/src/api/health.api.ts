import { apiClient } from './client';

export interface CheckItem {
  status: 'up' | 'down';
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  checks: {
    postgres?: CheckItem;
    redis?: CheckItem;
    mariadb?: CheckItem;
    minio?: CheckItem;
  };
}

export const healthApi = {
  check: async (): Promise<HealthCheckResponse> => {
    try {
      const res = await apiClient.get<HealthCheckResponse>('/health');
      return res.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data as HealthCheckResponse;
      }
      return {
        status: 'error',
        checks: {
          postgres: { status: 'down', error: 'Không thể kết nối đến máy chủ backend' },
          redis: { status: 'down' },
          mariadb: { status: 'down' },
          minio: { status: 'down' },
        },
      };
    }
  },

  pingMariaDb: async () => {
    const res = await apiClient.get<{ status: string; database: string }>('/mariadb/ping');
    return res.data;
  },
};
