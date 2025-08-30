import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
} from '@mui/material';
import { People, Public, Lock } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { SubCommunity } from '../../types/subCommunity';

interface SubCommunityCardProps {
  subCommunity: SubCommunity;
}

export const SubCommunityCard: React.FC<SubCommunityCardProps> = ({
  subCommunity,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out',
        },
      }}
    >
      <CardContent
        sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              component="h3"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              {subCommunity.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {subCommunity.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                icon={subCommunity.isPrivate ? <Lock /> : <Public />}
                label={subCommunity.isPrivate ? 'Private' : 'Public'}
                size="small"
                color={subCommunity.isPrivate ? 'default' : 'primary'}
                variant="outlined"
              />
              <Chip
                icon={<People />}
                label={`${subCommunity._count?.members || 0} members`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        {subCommunity.owner && (
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}
          >
            <Avatar sx={{ width: 24, height: 24 }} />
            <Typography variant="caption" color="text.secondary">
              Created by {subCommunity.owner.name}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          component={Link}
          to={`/sub-communities/${subCommunity.id}`}
          variant="contained"
          size="small"
          fullWidth
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Join
        </Button>
      </Box>
    </Card>
  );
};
