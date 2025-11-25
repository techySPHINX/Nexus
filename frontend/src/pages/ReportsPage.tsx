import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { useReportContext } from '@/contexts/reportContext';
import { Link } from 'react-router-dom';

const ReportsPage: React.FC = () => {
  const { reports, loading, fetchReports } = useReportContext();

  useEffect(() => {
    fetchReports().catch(() => {});
  }, [fetchReports]);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Reports
      </Typography>

      {loading && <Typography>Loading...</Typography>}

      {!loading && reports.length === 0 && (
        <Typography>No reports found.</Typography>
      )}

      <Grid container spacing={2}>
        {reports.map((r) => (
          <Grid item xs={12} key={r.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2">Type: {r.type}</Typography>
                    <Typography variant="body2">Reason: {r.reason}</Typography>
                    <Typography variant="caption">
                      Reporter: {r.reporterId}
                    </Typography>
                    <br />
                    <Typography variant="caption">
                      Created: {new Date(r.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    {r.postId && (
                      <Button
                        component={Link}
                        to={`/posts/${r.postId}`}
                        size="small"
                      >
                        View Post
                      </Button>
                    )}
                    {r.commentId && (
                      <Button
                        component={Link}
                        to={`/posts/${r.postId}#comment-${r.commentId}`}
                        size="small"
                      >
                        View Comment
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ReportsPage;
