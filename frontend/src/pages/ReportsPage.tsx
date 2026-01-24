import { FC, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from '@mui/material';
import { useReportContext } from '@/contexts/reportContext';
import { Link } from 'react-router-dom';

const ReportsPage: FC = () => {
  const { reports, loading, fetchReports, nextCursor } = useReportContext();

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
                      Reporter:{' '}
                      {r.reporter?.name || r.reporter?.email || r.reporterId}
                    </Typography>
                    <br />
                    <Typography variant="caption">
                      Created: {new Date(r.createdAt).toLocaleString()}
                    </Typography>
                    {r.post && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Post: {r.post.subject}
                      </Typography>
                    )}
                    {r.comment && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Comment: {r.comment.content}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    {(r.post?.id || r.postId) && (
                      <Button
                        component={Link}
                        to={`/posts/${r.post?.id || r.postId}`}
                        size="small"
                      >
                        View Post
                      </Button>
                    )}
                    {(r.comment?.id || r.commentId) &&
                      (r.comment?.postId || r.post?.id || r.postId) && (
                        <Button
                          component={Link}
                          to={`/posts/${r.comment?.postId || r.post?.id || r.postId}#comment-${r.comment?.id || r.commentId}`}
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        {loading && <CircularProgress size={24} />}
        {!loading && nextCursor && (
          <Button
            variant="contained"
            onClick={() => fetchReports({ cursor: nextCursor }).catch(() => {})}
          >
            Load more
          </Button>
        )}
        {!loading && !nextCursor && reports.length > 0 && (
          <Typography variant="caption" sx={{ mt: 1 }}>
            No more reports
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ReportsPage;
