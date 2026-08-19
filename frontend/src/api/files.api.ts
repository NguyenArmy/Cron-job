import { apiClient } from './client';

export interface FileUploadResponse {
  message?: string;
  url?: string;
  fileName?: string;
  [key: string]: any;
}

export const filesApi = {
  upload: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<FileUploadResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};
