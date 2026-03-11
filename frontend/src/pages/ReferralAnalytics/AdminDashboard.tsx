import { FC } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
} from '@mui/material';
import { Work, People, Visibility, TrendingUp } from '@mui/icons-material';
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
import type {
  PlatformAnalytics,
  FunnelStage,
  TrendBucket,
} from '../../services/referralAnalyticsService';
import { motion } from 'framer-motion';

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
        <Box sx={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '1rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Company</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Referrals</th>
              </tr>
            </thead>
            <tbody>
              {data.topCompanies.map((row, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: '1px solid #eee' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#f5f5f5')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  <td style={{ padding: '8px' }}>{row.company}</td>
                  <td style={{ padding: '8px' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </CardContent>
    </Card>
  </>
);

export default AdminDashboard;
