import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import ConnectionCard from '../Connections/ConnectionCard';
import PendingRequestCard from '../Connections/PendingRequestCard';
import SuggestionCard from '../Connections/SuggestionCard';
import type {
  Connection,
  PendingRequest,
  ConnectionSuggestion,
} from '../../types/connections';

interface ConnectionsGridViewProps {
  paginatedData: (Connection | PendingRequest | ConnectionSuggestion)[];
  tabValue: number;
  onSendMessage: (userId: string) => void;
  onRemoveConnection: (connectionId: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onConnect: (userId: string) => void;
}

const ConnectionsGridView: React.FC<ConnectionsGridViewProps> = ({
  paginatedData,
  tabValue,
  onSendMessage,
  onRemoveConnection,
  onAcceptRequest,
  onRejectRequest,
  onConnect,
}) => {
  if (paginatedData.length === 0) {
    return (
      <Grid item xs={12}>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No connections found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search filters or connect with new people.
          </Typography>
        </Paper>
      </Grid>
    );
  }

  return (
    <>
      {paginatedData.map((item, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          {tabValue === 0 && (
            <ConnectionCard
              connection={item as Connection}
              index={index}
              onSendMessage={onSendMessage}
              onRemoveConnection={onRemoveConnection}
            />
          )}
          {tabValue === 1 && (
            <PendingRequestCard
              request={item as PendingRequest}
              index={index}
              type="received"
              onAcceptRequest={onAcceptRequest}
              onRejectRequest={onRejectRequest}
            />
          )}
          {tabValue === 2 && (
            <PendingRequestCard
              request={item as PendingRequest}
              index={index}
              type="sent"
            />
          )}
          {tabValue === 3 && (
            <SuggestionCard
              suggestion={item as ConnectionSuggestion}
              index={index}
              onConnect={onConnect}
            />
          )}
        </Grid>
      ))}
    </>
  );
};

export default ConnectionsGridView;
