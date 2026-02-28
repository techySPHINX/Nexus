import api from './api';

export interface AnalyticsQuery {
  dateFrom?: string;
  dateTo?: string;
  months?: number;
}

export interface AlumniAnalytics {
  overview: {
    totalReferrals: number;
    totalApplications: number;
    conversionRate: number;
  };
  referralsByStatus: Record<string, number>;
  applicationsByStatus: Record<string, number>;
  topReferrals: Array<{
    id: string;
    jobTitle: string;
    company: string;
    viewCount: number;
    applicationCount: number;
  }>;
}

export interface StudentAnalytics {
  overview: {
    totalApplications: number;
    successRate: number;
  };
  applicationsByStatus: Record<string, number>;
  recentApplications: Array<{
    id: string;
    status: string;
    createdAt: string;
    jobTitle: string;
    company: string;
  }>;
}

export interface PlatformAnalytics {
  overview: {
    totalReferrals: number;
    totalApplications: number;
    totalViews: number;
    conversionRate: number;
  };
  referralsByStatus: Record<string, number>;
  applicationsByStatus: Record<string, number>;
  topCompanies: Array<{ company: string; count: number }>;
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface FunnelData {
  funnel: FunnelStage[];
}

export interface TrendBucket {
  month: string;
  referrals: number;
  applications: number;
  accepted: number;
}

export interface TrendsData {
  trends: TrendBucket[];
}

const referralAnalyticsService = {
  getAlumniAnalytics: (query?: AnalyticsQuery) =>
    api.get<AlumniAnalytics>('/referral-analytics/alumni', {
      params: query,
    }),

  getAlumniAnalyticsById: (id: string, query?: AnalyticsQuery) =>
    api.get<AlumniAnalytics>(`/referral-analytics/alumni/${id}`, {
      params: query,
    }),

  getStudentAnalytics: (query?: AnalyticsQuery) =>
    api.get<StudentAnalytics>('/referral-analytics/student', {
      params: query,
    }),

  getStudentAnalyticsById: (id: string, query?: AnalyticsQuery) =>
    api.get<StudentAnalytics>(`/referral-analytics/student/${id}`, {
      params: query,
    }),

  getPlatformAnalytics: (query?: AnalyticsQuery) =>
    api.get<PlatformAnalytics>('/referral-analytics/platform', {
      params: query,
    }),

  getApplicationFunnel: (query?: AnalyticsQuery) =>
    api.get<FunnelData>('/referral-analytics/funnel', {
      params: query,
    }),

  getMonthlyTrends: (query?: AnalyticsQuery) =>
    api.get<TrendsData>('/referral-analytics/trends', {
      params: query,
    }),
};

export default referralAnalyticsService;
