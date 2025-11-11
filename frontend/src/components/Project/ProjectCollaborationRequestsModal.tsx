import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Stack,
  CircularProgress,
} from '@mui/material';
import { Check, Close as CloseIcon } from '@mui/icons-material';
import { useShowcase } from '@/contexts/ShowcaseContext';
import { CollaborationStatus } from '@/types/ShowcaseType';
import { format } from 'date-fns';
import { useNotification } from '@/contexts/NotificationContext';
import Chip from '@mui/material/Chip';

interface Props {
  open: boolean;
  projectId: string;
  onClose: () => void;
}

const ProjectCollaborationRequestsModal: React.FC<Props> = ({
  open,
  projectId,
  onClose,
}) => {
  const {
    collaborationRequests,
    getCollaborationRequests,
    updateStatusCollaboration,
    loading,
  } = useShowcase();
  const { showNotification } = useNotification();

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (open && projectId) {
      getCollaborationRequests(projectId).catch(() => {});
    }
  }, [open, projectId, getCollaborationRequests]);

  const handleUpdate = async (
    requestId: string,
    status: CollaborationStatus
  ) => {
    setActionLoading((s) => ({ ...s, [requestId]: true }));
    try {
      await updateStatusCollaboration(requestId, projectId, status);
      showNotification?.('Request updated', 'success');
    } catch (err) {
      console.error('Failed to update collaboration status', err);
      showNotification?.(
        `Failed to update: ${err instanceof Error ? err.message : String(err)}`,
        'error'
      );
    } finally {
      setActionLoading((s) => ({ ...s, [requestId]: false }));
      // refresh list (context already refreshes, but ensure local refresh as well)
      await getCollaborationRequests(projectId).catch(() => {});
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Collaboration requests</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : collaborationRequests.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <Typography variant="body1">No collaboration requests</Typography>
          </Box>
        ) : (
          <List>
            {collaborationRequests.map((req) => (
              <ListItem
                key={req.id}
                alignItems="flex-start"
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      aria-label="approve"
                      size="small"
                      onClick={() =>
                        handleUpdate(req.id, CollaborationStatus.ACCEPTED)
                      }
                      disabled={actionLoading[req.id]}
                    >
                      {actionLoading[req.id] ? (
                        <CircularProgress size={18} />
                      ) : (
                        <Check color="success" />
                      )}
                    </IconButton>
                    <IconButton
                      aria-label="reject"
                      size="small"
                      onClick={() =>
                        handleUpdate(req.id, CollaborationStatus.REJECTED)
                      }
                      disabled={actionLoading[req.id]}
                    >
                      {actionLoading[req.id] ? (
                        <CircularProgress size={18} />
                      ) : (
                        <CloseIcon color="error" />
                      )}
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemAvatar>
                  <Avatar src={req.user?.profile?.avatarUrl}>
                    {req.user?.name?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {req.user?.name || 'User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {req.user?.role}
                      </Typography>
                      {(() => {
                        const chipColor: 'success' | 'error' | 'default' =
                          req.status === CollaborationStatus.ACCEPTED
                            ? 'success'
                            : req.status === CollaborationStatus.REJECTED
                              ? 'error'
                              : 'default';
                        return (
                          <Chip
                            label={req.status}
                            size="small"
                            color={chipColor}
                            sx={{ ml: 1 }}
                          />
                        );
                      })()}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="div"
                        variant="body2"
                        color="text.primary"
                        sx={{ whiteSpace: 'pre-wrap', mb: 1 }}
                      >
                        {req.message || 'No message provided.'}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        Requested{' '}
                        {req.createdAt
                          ? format(new Date(req.createdAt), 'PP p')
                          : 'unknown'}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectCollaborationRequestsModal;
