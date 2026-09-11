import { api } from './api';

export const documentService = {
  async myDocuments() {
    const { data } = await api.get('/documents');
    return data.data;
  },
  async upload(docType: 'governmentId' | 'drivingLicense' | 'selfie', file: File) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post(`/documents/${docType}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};
