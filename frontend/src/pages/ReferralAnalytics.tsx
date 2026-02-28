import { FC, useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  Visibility,
  Work,
  CheckCircle,
  Assessment,
  People,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  Cell,
  LabelList,
} from 'recharts';
import referralAnalyticsService, {
  type AlumniAnalytics,
  type StudentAnalytics,
  type PlatformAnalytics,
  type FunnelStage,
  type TrendBucket,
} from '../services/referralAnalyticsService';

const FUNNEL_COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'];

const STATUS_CHIP_COLORS: Record<
  string,
  'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
  PENDING: 'warning',
  REVIEWED: 'info',
  SHORTLISTED: 'primary',
  OFFERED: 'secondary',
  ACCEPTED: 'success',
  REJECTED: 'error',
  APPROVED: 'success',
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: FC<MetricCardProps> = ({ title, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
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
        <AdminDashboard
          data={platformData}
          funnelData={funnelData}
          trendsData={trendsData}
        />
      )}

      {/* Alumni View */}
      {user.role === 'ALUM' && alumniData && (
        <AlumniDashboard
          data={alumniData}
          funnelData={funnelData}
          trendsData={trendsData}
        />
      )}

      {/* Student View */}
      {user.role === 'STUDENT' && studentData && (
        <StudentDashboard data={studentData} />
      )}
    </Container>
  );
};

// ─── Admin Dashboard ─────────────────────────────────────────────

const AdminDashboard: FC<{
  data: PlatformAnalytics;
  funnelData: FunnelStage[];
  trendsData: TrendBucket[];
}> = ({ data, funnelData, trendsData }) => (
  <>
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Referrals"
          value={data.overview.totalReferrals}
          icon={<Work />}
          color="#1976d2"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Applications"
          value={data.overview.totalApplications}
          icon={<People />}
          color="#9c27b0"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Views"
          value={data.overview.totalViews}
          icon={<Visibility />}
          color="#ed6c02"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Conversion Rate"
          value={`${data.overview.conversionRate}%`}
          icon={<TrendingUp />}
          color="#2e7d32"
        />
      </Grid>
    </Grid>

    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Application Funnel
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="count" data={funnelData} isAnimationActive>
                  {funnelData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                    />
                  ))}
                  <LabelList
                    position="right"
                    fill="#333"
                    stroke="none"
                    dataKey="stage"
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="referrals" fill="#8884d8" name="Referrals" />
                <Bar
                  dataKey="applications"
                  fill="#82ca9d"
                  name="Applications"
                />
                <Bar dataKey="accepted" fill="#ffc658" name="Accepted" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Status Breakdown */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Referrals by Status
            </Typography>
            <Stack spacing={1}>
              {Object.entries(data.referralsByStatus).map(([status, count]) => (
                <Box
                  key={status}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Chip
                    label={status}
                    color={STATUS_CHIP_COLORS[status] || 'default'}
                    size="small"
                  />
                  <Typography fontWeight="bold">{count}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Applications by Status
            </Typography>
            <Stack spacing={1}>
              {Object.entries(data.applicationsByStatus).map(
                ([status, count]) => (
                  <Box
                    key={status}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Chip
                      label={status}
                      color={STATUS_CHIP_COLORS[status] || 'default'}
                      size="small"
                    />
                    <Typography fontWeight="bold">{count}</Typography>
                  </Box>
                )
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Top Companies */}
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Top Companies
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell align="right">Referrals</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.topCompanies.map((row) => (
                <TableRow key={row.company}>
                  <TableCell>{row.company}</TableCell>
                  <TableCell align="right">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  </>
);

// ─── Alumni Dashboard ────────────────────────────────────────────

const AlumniDashboard: FC<{
  data: AlumniAnalytics;
  funnelData: FunnelStage[];
  trendsData: TrendBucket[];
}> = ({ data, funnelData, trendsData }) => (
  <>
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={4}>
        <MetricCard
          title="My Referrals"
          value={data.overview.totalReferrals}
          icon={<Work />}
          color="#1976d2"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <MetricCard
          title="Applications Received"
          value={data.overview.totalApplications}
          icon={<People />}
          color="#9c27b0"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <MetricCard
          title="Conversion Rate"
          value={`${data.overview.conversionRate}%`}
          icon={<TrendingUp />}
          color="#2e7d32"
        />
      </Grid>
    </Grid>

    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Application Funnel
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="count" data={funnelData} isAnimationActive>
                  {funnelData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                    />
                  ))}
                  <LabelList
                    position="right"
                    fill="#333"
                    stroke="none"
                    dataKey="stage"
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="referrals" fill="#8884d8" name="Referrals" />
                <Bar
                  dataKey="applications"
                  fill="#82ca9d"
                  name="Applications"
                />
                <Bar dataKey="accepted" fill="#ffc658" name="Accepted" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Top Referrals */}
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Top Performing Referrals
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Job Title</TableCell>
                <TableCell>Company</TableCell>
                <TableCell align="right">Views</TableCell>
                <TableCell align="right">Applications</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.topReferrals.map((ref) => (
                <TableRow key={ref.id}>
                  <TableCell>{ref.jobTitle}</TableCell>
                  <TableCell>{ref.company}</TableCell>
                  <TableCell align="right">{ref.viewCount}</TableCell>
                  <TableCell align="right">{ref.applicationCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>

    {/* Status Breakdown */}
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Applications by Status
        </Typography>
        <Stack spacing={1}>
          {Object.entries(data.applicationsByStatus).map(([status, count]) => (
            <Box
              key={status}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Chip
                label={status}
                color={STATUS_CHIP_COLORS[status] || 'default'}
                size="small"
              />
              <Typography fontWeight="bold">{count}</Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  </>
);

// ─── Student Dashboard ───────────────────────────────────────────

const StudentDashboard: FC<{ data: StudentAnalytics }> = ({ data }) => (
  <>
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6}>
        <MetricCard
          title="My Applications"
          value={data.overview.totalApplications}
          icon={<Work />}
          color="#1976d2"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <MetricCard
          title="Success Rate"
          value={`${data.overview.successRate}%`}
          icon={<CheckCircle />}
          color="#2e7d32"
        />
      </Grid>
    </Grid>

    {/* Status Breakdown */}
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Applications by Status
        </Typography>
        <Stack spacing={1}>
          {Object.entries(data.applicationsByStatus).map(([status, count]) => (
            <Box
              key={status}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Chip
                label={status}
                color={STATUS_CHIP_COLORS[status] || 'default'}
                size="small"
              />
              <Typography fontWeight="bold">{count}</Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>

    {/* Recent Applications */}
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Applications
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Job Title</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Applied On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recentApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.jobTitle}</TableCell>
                  <TableCell>{app.company}</TableCell>
                  <TableCell>
                    <Chip
                      label={app.status}
                      color={STATUS_CHIP_COLORS[app.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(app.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  </>
);

export default ReferralAnalytics;
