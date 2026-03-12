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
import { Work, CheckCircle } from '@mui/icons-material';
import type { StudentAnalytics } from '../../services/referralAnalyticsService';
import { motion } from 'framer-motion';

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

export default StudentDashboard;
