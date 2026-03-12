import { FC } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from '@mui/material';
import { Work, People, TrendingUp } from '@mui/icons-material';
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
  AlumniAnalytics,
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

export default AlumniDashboard;
