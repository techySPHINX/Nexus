import api from './api';

const landingPageService = {
  getFeedback: async () => {
    console.log('Fetching landing page feedback...');
    const resp = await api.get('/landing/feedback');
    return resp.data;
  },

  getNews: async () => {
    console.log('Fetching landing page news...');
    const resp = await api.get('/news', {
      params: { take: 4 },
    });
    return resp.data;
  },
};

export default landingPageService;
