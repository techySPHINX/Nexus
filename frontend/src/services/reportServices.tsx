import { CreateReportDto } from '@/types/Report';
import api from './api';

const reportServices = {
  createReport: async (data: CreateReportDto) => {
    const response = await api.post('/reports', data);
    console.log('Created report:', response.data);
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/reports');
    console.log('Fetched reports:', response.data);
    return response.data;
  },
};

export default reportServices;
