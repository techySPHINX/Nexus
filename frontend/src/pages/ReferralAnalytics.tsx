import { FC, useState, useEffect, useCallback, Suspense, lazy } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Stack,
} from '@mui/material';
import { Assessment } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import referralAnalyticsService, {
  type AlumniAnalytics,
  type StudentAnalytics,
  type PlatformAnalytics,
  type FunnelStage,
  type TrendBucket,
} from '../services/referralAnalyticsService';

// Lazy load dashboard components to split recharts into separate chunk
const AdminDashboard = lazy(() => import('./ReferralAnalytics/AdminDashboard'));
const AlumniDashboard = lazy(
  () => import('./ReferralAnalytics/AlumniDashboard')
);
const StudentDashboard = lazy(
  () => import('./ReferralAnalytics/StudentDashboard')
);

const ReferralAnalytics: FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // State for each role's data
  const [alumniData, setAlumniData] = useState<AlumniAnalytics | null>(null);
  const [studentData, setStudentData] = useState<StudentAnalytics | null>(null);
  const [platformData, setPlatformData] = useState<PlatformAnalytics | null>(
    null
  );
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [trendsData, setTrendsData] = useState<TrendBucket[]>([]);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const query = {
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    };

    try {
      if (user.role === 'ADMIN') {
        const [platform, funnel, trends] = await Promise.all([
          referralAnalyticsService.getPlatformAnalytics(query),
          referralAnalyticsService.getApplicationFunnel(query),
          referralAnalyticsService.getMonthlyTrends({ ...query, months: 6 }),
        ]);
        setPlatformData(platform.data);
        setFunnelData(funnel.data.funnel);
        setTrendsData(trends.data.trends);
      } else if (user.role === 'ALUM') {
        const alumni = await referralAnalyticsService.getAlumniAnalytics(query);
        setAlumniData(alumni.data);
      } else if (user.role === 'STUDENT') {
        const res = await referralAnalyticsService.getStudentAnalytics(query);
        setStudentData(res.data);
      }
    } catch (err) {
      setError('Failed to load analytics data. Please try again.');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, dateFrom, dateTo]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Please log in to view analytics.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          <Assessment sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Referral Analytics Dashboard
        </Typography>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Date Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="From Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <TextField
              label="To Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Admin View */}
      {user.role === 'ADMIN' && platformData && (
        <Suspense fallback={<CircularProgress />}>
          <AdminDashboard
            data={platformData}
            funnelData={funnelData}
            trendsData={trendsData}
          />
        </Suspense>
      )}

      {/* Alumni View */}
      {user.role === 'ALUM' && alumniData && (
        <Suspense fallback={<CircularProgress />}>
          <AlumniDashboard
            data={alumniData}
            funnelData={funnelData}
            trendsData={trendsData}
          />
        </Suspense>
      )}

      {/* Student View */}
      {user.role === 'STUDENT' && studentData && (
        <Suspense fallback={<CircularProgress />}>
          <StudentDashboard data={studentData} />
        </Suspense>
      )}
    </Container>
  );
};

export default ReferralAnalytics;
