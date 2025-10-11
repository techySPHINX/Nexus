import React from 'react';
import { Card, CardContent, Box, Typography, Badge } from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  Schedule as TimeIcon,
  School as SchoolIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface StatsCardsProps {
  stats: {
    total: number;
    pendingReceived: number;
    byRole?: {
      students: number;
      alumni: number;
    };
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
            color: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            flex: 1,
            minWidth: 200,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Badge
                badgeContent={<TrendingIcon sx={{ fontSize: 12 }} />}
                color="warning"
                sx={{ mr: 2 }}
              >
                <PeopleIcon sx={{ fontSize: 32 }} />
              </Badge>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Connections
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
            color: 'white',
            borderRadius: 3,
            flex: 1,
            minWidth: 200,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TimeIcon sx={{ fontSize: 32, mr: 2 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.pendingReceived}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Pending Requests
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
            color: 'white',
            borderRadius: 3,
            flex: 1,
            minWidth: 200,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SchoolIcon sx={{ fontSize: 32, mr: 2 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.byRole?.students || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Students
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
            color: 'white',
            borderRadius: 3,
            flex: 1,
            minWidth: 200,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WorkIcon sx={{ fontSize: 32, mr: 2 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {stats.byRole?.alumni || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Alumni
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </motion.div>
  );
};

export default StatsCards;
