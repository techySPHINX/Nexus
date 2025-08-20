import React from 'react';
import { Chip } from '@mui/material';
import { Link } from 'react-router-dom';

interface SubCommunityBadgeProps {
  subCommunity: {
    id: string;
    name: string;
    description: string;
  };
}

export const SubCommunityBadge: React.FC<SubCommunityBadgeProps> = ({ subCommunity }) => {
  return (
    <Chip
      label={subCommunity.name}
      component={Link}
      to={`/subcommunities/${subCommunity.id}`}
      clickable
      sx={{ mb: 1 }}
    />
  );
};