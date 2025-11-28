import axios from 'axios';

const gamificationService = {
  getLeaderboard: async (period = 'all', limit = 10) => {
    console.log('Fetching leaderboard for period:', period, 'limit:', limit);
    const resp = await axios.get(
      `/gamification/leaderboard?period=${period}&limit=${limit}`
    );
    return resp.data;
  },

  getUserPoints: async (userId: string) => {
    console.log('Fetching points for userId:', userId);
    const resp = await axios.get(`/gamification/points/${userId}`);
    return resp.data;
  },

  getTransactions: async (userId: string, limit = 10) => {
    console.log('Fetching transactions for userId:', userId, 'limit:', limit);
    const resp = await axios.get(
      `/gamification/transactions/${userId}?limit=${limit}`
    );
    return resp.data;
  },

  awardPoints: async (payload: {
    userId: string;
    points: number;
    type: string;
    entityId?: string;
  }) => {
    console.log('Awarding points with payload:', payload);
    const resp = await axios.post('/gamification/award', payload);
    return resp.data;
  },
};

export default gamificationService;
