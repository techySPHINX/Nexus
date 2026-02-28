import axios from 'axios';

const landingPageService = {
  getFeedback: async () => {
    console.log('Fetching landing page feedback...');
    const resp = await axios.get('/landing/feedback');
    return resp.data;
  },

  getNews: async () => {
    console.log('Fetching landing page news...');
    const resp = await axios.get('/news', {
      params: { take: 4 },
    });
    return resp.data;
  },
};

export default landingPageService;
