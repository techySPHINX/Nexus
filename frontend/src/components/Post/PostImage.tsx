import React from 'react';
import { Box } from '@mui/material';

interface PostImageProps {
  imageUrl: string;
}

export const PostImage: React.FC<PostImageProps> = ({ imageUrl }) => {
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <img
        src={imageUrl}
        alt="Post"
        style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
      />
    </Box>
  );
};
