import { CreateReportDto } from '@/types/Report';
import api from './api';

const reportServices = {
  createReport: async (data: CreateReportDto) => {
    console.log('Creating report with data:', data);
    try {
      // Basic client-side validation
      if (!data.type || !data.reason) {
        throw new Error('Type and reason are required to create a report.');
      }
      if (data.type === 'POST' && !data.postId) {
        throw new Error('postId must be provided for POST reports.');
      }
      if (data.type === 'COMMENT' && !data.commentId) {
        throw new Error('commentId must be provided for COMMENT reports.');
      }
      const response = await api.post('/reports', data);
      return response.data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },

  getReports: async (opts?: { pageSize?: number; cursor?: string }) => {
    const params: Record<string, unknown> = {};
    if (opts?.pageSize) params.pageSize = opts.pageSize;
    if (opts?.cursor) params.cursor = opts.cursor;
    try {
      console.log('Fetching reports with params:', params);
      const response = await api.get('/reports', { params });
      // backend returns { items, nextCursor }
      const payload = response.data || {};
      console.log('Fetched reports:', payload);
      return {
        items: payload.items || [],
        nextCursor: payload.nextCursor || null,
      };
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },
};

export default reportServices;
