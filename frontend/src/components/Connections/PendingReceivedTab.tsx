import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  Chip,
  CardActions,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Block as BlockIcon,
} from '@mui/icons-material';

interface Profile {
  bio?: string;
  location?: string;
  interests?: string;
  avatarUrl?: string;
  skills: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN';
  profile?: Profile;
}

interface PendingRequest {
  id: string;
  createdAt: string;
  requester?: User;
  recipient?: User;
}

interface PendingReceivedTabProps {
  pendingReceived: PendingRequest[];
  respondToRequest: (
    id: string,
    action: 'ACCEPTED' | 'REJECTED' | 'BLOCKED'
  ) => void;
  getRoleColor: (
    role: string
  ) =>
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  actionLoading?: string | null;
}

const PendingReceivedTab: React.FC<PendingReceivedTabProps> = ({
  pendingReceived,
  respondToRequest,
  getRoleColor,
  actionLoading,
}) => {
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [requestToBlock, setRequestToBlock] = useState<string | null>(null);

  const handleBlockClick = (requestId: string) => {
    setRequestToBlock(requestId);
    setBlockDialogOpen(true);
  };

  const handleConfirmBlock = () => {
    if (requestToBlock) {
      respondToRequest(requestToBlock, 'BLOCKED');
    }
    setBlockDialogOpen(false);
    setRequestToBlock(null);
  };

  const handleCancelBlock = () => {
    setBlockDialogOpen(false);
    setRequestToBlock(null);
  };

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          margin: '16px 0',
        }}
      >
        {pendingReceived.map((request) => (
          <Card
            key={request.id}
            sx={{
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(145deg, rgba(40,30,50,0.8) 0%, rgba(30,20,40,0.9) 100%)'
                  : 'linear-gradient(145deg, rgba(255,245,250,0.9) 0%, rgba(245,240,255,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: (theme) =>
                theme.palette.mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.1)'
                  : '1px solid rgba(0,0,0,0.05)',
              borderRadius: '16px',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    mr: 2,
                    width: 48,
                    height: 48,
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                        : 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
                  }}
                >
                  {request.requester?.name?.charAt(0).toUpperCase() || '?'}
                </Avatar>
                <Box>
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'white'
                          : 'text.primary',
                    }}
                  >
                    {request.requester?.name || 'Unknown User'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.6)'
                          : 'text.secondary',
                    }}
                  >
                    {request.requester?.email || 'No email'}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={request.requester?.role || 'Unknown'}
                color={getRoleColor(request.requester?.role || '')}
                size="small"
                sx={{
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.05)',
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                  border: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '1px solid rgba(255,255,255,0.2)'
                      : '1px solid rgba(0,0,0,0.1)',
                }}
              />
            </CardContent>
            <CardActions
              sx={{
                borderTop: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(0,0,0,0.05)',
                padding: '12px 16px',
                justifyContent: 'space-between',
              }}
            >
              <Button
                size="medium"
                startIcon={<CheckIcon />}
                onClick={() => respondToRequest(request.id, 'ACCEPTED')}
                disabled={actionLoading === `accept-${request.id}`}
                sx={{
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(56, 239, 125, 0.2) 0%, rgba(17, 153, 142, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(56, 239, 125, 0.1) 0%, rgba(17, 153, 142, 0.1) 100%)',
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? '#38ef7d' : '#28a745',
                  '&:hover': {
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(56, 239, 125, 0.3) 0%, rgba(17, 153, 142, 0.3) 100%)'
                        : 'linear-gradient(135deg, rgba(56, 239, 125, 0.2) 0%, rgba(17, 153, 142, 0.2) 100%)',
                  },
                  '&.Mui-disabled': {
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.03)',
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(0,0,0,0.2)',
                  },
                }}
              >
                Accept
              </Button>
              <Button
                size="medium"
                startIcon={<CloseIcon />}
                onClick={() => respondToRequest(request.id, 'REJECTED')}
                disabled={actionLoading === `reject-${request.id}`}
                sx={{
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(239, 56, 56, 0.2) 0%, rgba(153, 17, 17, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(239, 56, 56, 0.1) 0%, rgba(153, 17, 17, 0.1) 100%)',
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? '#ef3838' : '#dc3545',
                  '&:hover': {
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(239, 56, 56, 0.3) 0%, rgba(153, 17, 17, 0.3) 100%)'
                        : 'linear-gradient(135deg, rgba(239, 56, 56, 0.2) 0%, rgba(153, 17, 17, 0.2) 100%)',
                  },
                  '&.Mui-disabled': {
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.03)',
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(0,0,0,0.2)',
                  },
                }}
              >
                Reject
              </Button>
              <Button
                size="medium"
                startIcon={<BlockIcon />}
                onClick={() => handleBlockClick(request.id)}
                disabled={actionLoading === `block-${request.id}`}
                sx={{
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(128, 0, 128, 0.2) 0%, rgba(75, 0, 130, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(128, 0, 128, 0.1) 0%, rgba(75, 0, 130, 0.1) 100%)',
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? '#9370DB' : '#800080',
                  '&:hover': {
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(128, 0, 128, 0.3) 0%, rgba(75, 0, 130, 0.3) 100%)'
                        : 'linear-gradient(135deg, rgba(128, 0, 128, 0.2) 0%, rgba(75, 0, 130, 0.2) 100%)',
                  },
                  '&.Mui-disabled': {
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.03)',
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(0,0,0,0.2)',
                  },
                }}
              >
                Block
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* Block Confirmation Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={handleCancelBlock}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {'Confirm Block Action'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to block this user? This action cannot be
            undone. The user will not be able to send you connection requests in
            the future.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelBlock} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBlock}
            color="error"
            startIcon={<BlockIcon />}
          >
            Confirm Block
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PendingReceivedTab;
