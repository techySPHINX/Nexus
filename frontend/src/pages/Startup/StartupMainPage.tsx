// StartupMainPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  Chip,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add, TrendingUp, People, Rocket } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useStartup } from '@/contexts/StartupContext';
import {
  StartupComment,
  StartupSummary,
  StartupDetail,
  CreateStartupSummary,
} from '@/types/StartupType';
import { useAuth } from '@/contexts/AuthContext';
import CreateStartupModal from '@/components/Startup/CreateStartupModal';
import EditStartupModal from '@/components/Startup/EditStartupModal';
import StartupDetailComponent from '@/components/Startup/StartupDetail';
import FilterBar from '@/components/Startup/FilterBar';
import StartupGrid from '@/components/Startup/StartupGrid';
import { getErrorMessage } from '@/utils/errorHandler';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`startup-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const StartupMainPage: React.FC = () => {
  const {
    all,
    mine,
    followed,
    getComments,
    getStartups,
    getMyStartups,
    getFollowedStartups,
    getStartupById,
    followStartup,
    unfollowStartup,
    createComment,
    createStartup,
    updateStartup,
    deleteStartup,
    refreshTab,
  } = useStartup();

  const { user } = useAuth();
  const [selectedStartup, setSelectedStartup] = useState<StartupDetail | null>(
    null
  );
  const [comment, setComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<StartupComment[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pageSize] = useState<number>(12);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity?: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [startupToEdit, setStartupToEdit] = useState<StartupSummary | null>(
    null
  );
  const [showFullDescription, setShowFullDescription] = useState(false);

  // helper to pick current list state per active tab
  const currentList = activeTab === 0 ? all : activeTab === 1 ? followed : mine;

  const handleFollowToggle = async (startup: StartupSummary) => {
    try {
      if (startup.isFollowing) {
        await unfollowStartup(startup.id);
        setSnackbar({
          open: true,
          message: `Unfollowed ${startup.name}`,
          severity: 'success',
        });
      } else {
        await followStartup(startup.id);
        setSnackbar({
          open: true,
          message: `Following ${startup.name}`,
          severity: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to toggle follow', err);
      setSnackbar({
        open: true,
        message: 'Failed to update follow status: ' + getErrorMessage(err),
        severity: 'error',
      });
    }
  };

  const openDetails = async (startup: StartupSummary) => {
    // fetch full startup details (includes founder) before opening
    setCommentsLoading(true);
    try {
      const detail = await getStartupById(startup.id);
      setSelectedStartup(detail || (startup as StartupDetail));
      const res = await getComments(startup.id);
      setComments(res?.comments || []);
    } catch (err) {
      console.error('Failed to load details or comments', err);
      // fallback to summary
      setSelectedStartup(startup as StartupDetail);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedStartup(null);
    setComments([]);
    setComment('');
  };

  const submitComment = async () => {
    if (!selectedStartup || !comment.trim()) return;

    const text = comment.trim();
    const tempId = `tmp-${Date.now()}`;
    const tempComment: StartupComment = {
      id: tempId,
      comment: text,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id || 'me',
        name: user?.name || 'You',
        profile: { avatarUrl: user?.profile?.avatarUrl },
      },
      pending: true,
    };

    // Optimistic update
    setComments((prev) => [tempComment, ...prev]);
    setComment('');

    try {
      const created: StartupComment = await createComment(
        selectedStartup.id,
        text
      );
      // Replace temp comment with server response
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...created, pending: false } : c))
      );
      setSnackbar({
        open: true,
        message: 'Comment posted successfully',
        severity: 'success',
      });
    } catch (error) {
      // Remove temp comment on error
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setSnackbar({
        open: true,
        message: 'Failed to post comment: ' + getErrorMessage(error),
        severity: 'error',
      });
    }
  };

  const handleCreateStartup = async (data: Partial<StartupSummary>) => {
    try {
      await createStartup(data);
      setCreateModalOpen(false);
      setSnackbar({
        open: true,
        message: 'Startup created successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to create startup: ' + getErrorMessage(error),
        severity: 'error',
      });
    }
  };

  const handleEditStartup = async (data: Partial<CreateStartupSummary>) => {
    if (!startupToEdit) return;

    try {
      await updateStartup(startupToEdit.id, data);
      setEditModalOpen(false);
      setStartupToEdit(null);
      setSnackbar({
        open: true,
        message: 'Startup updated successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update startup: ' + getErrorMessage(error),
        severity: 'error',
      });
    }
  };

  const handleDeleteStartup = async (startupId: string) => {
    try {
      await deleteStartup(startupId);
      setSnackbar({
        open: true,
        message: 'Startup deleted successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete startup: ' + getErrorMessage(error),
        severity: 'error',
      });
    }
  };

  const openEditModal = (startup: StartupSummary) => {
    setStartupToEdit(startup);
    setEditModalOpen(true);
  };

  // fetch startups when search/status/active tab change (debounced)
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if (activeTab === 0) {
          await getStartups({
            search: searchQuery || undefined,
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            pageSize,
          });
        } else if (activeTab === 1) {
          await getFollowedStartups({
            search: searchQuery || undefined,
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            pageSize,
          });
        } else {
          await getMyStartups({
            search: searchQuery || undefined,
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            pageSize,
          });
        }
      } catch (e) {
        // ignore
        console.error('Failed loading startups', e);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [
    searchQuery,
    statusFilter,
    activeTab,
    getStartups,
    getFollowedStartups,
    getMyStartups,
    pageSize,
  ]);

  // when switching tabs, we can optionally scroll to top of list
  React.useEffect(() => {
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <Container maxWidth="xl" sx={{ py: 4, position: 'relative' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                color: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'text.primary'
                    : 'text.primary',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, #00C9FF, #92FE9D)'
                    : 'linear-gradient(90deg, #12720bff 0%, #0cb009ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Startup Ecosystem
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontWeight: 400 }}
            >
              Discover and support the next generation of innovative startups
            </Typography>
          </Box>
          <div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ display: 'inline-block', marginRight: 10 }}
            >
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateModalOpen(true)}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  background: 'primary.main',
                }}
                size="large"
              >
                Startup
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              style={{ display: 'inline-block', marginLeft: 1 }}
            >
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    await refreshTab(activeTab);
                    setSnackbar({
                      open: true,
                      message: 'Refreshed',
                      severity: 'success',
                    });
                  } catch (err) {
                    console.error('Refresh failed', err);
                    setSnackbar({
                      open: true,
                      message: 'Failed to refresh: ' + getErrorMessage(err),
                      severity: 'error',
                    });
                  }
                }}
                disabled={currentList.loading}
                sx={{ borderRadius: 3, px: 2, py: 1.2, fontWeight: 600 }}
                size="large"
              >
                Refresh
              </Button>
            </motion.div>
          </div>
        </Box>

        {/* Stats Summary */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            icon={<Rocket />}
            label={`${currentList.data.length} Startups`}
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<People />}
            label={`${currentList.data.reduce((acc, s) => acc + (s.followersCount || 0), 0)} Total Followers`}
            color="secondary"
            variant="outlined"
          />
          <Chip
            icon={<TrendingUp />}
            label={`${currentList.data.filter((s) => s.status === 'LAUNCHED').length} Launched`}
            color="success"
            variant="outlined"
          />
        </Box>

        {/* Search and Filter Bar */}
        <FilterBar
          search={searchQuery}
          setSearch={setSearchQuery}
          status={statusFilter}
          setStatus={setStatusFilter}
        />

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab label="All Startups" />
            <Tab label="Following" />
            <Tab label="My Startups" />
          </Tabs>
        </Box>

        {/* Startup Grid
        {currentList.loading && currentList.data.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <> */}
        <TabPanel value={activeTab} index={0}>
          <StartupGrid
            startups={currentList.data}
            loading={currentList.loading}
            onFollowToggle={handleFollowToggle}
            onView={openDetails}
            onEdit={openEditModal}
            onDelete={handleDeleteStartup}
            tab={0}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <StartupGrid
            startups={currentList.data}
            loading={currentList.loading}
            onFollowToggle={handleFollowToggle}
            onView={openDetails}
            onEdit={openEditModal}
            onDelete={handleDeleteStartup}
            tab={1}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <StartupGrid
            startups={currentList.data}
            loading={currentList.loading}
            onFollowToggle={handleFollowToggle}
            onView={openDetails}
            onEdit={openEditModal}
            onDelete={handleDeleteStartup}
            tab={2}
          />
        </TabPanel>

        {currentList.data.length === 0 && !currentList.loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No startups found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 0
                ? 'Try adjusting your search or filters'
                : activeTab === 1
                  ? "You're not following any startups yet"
                  : "You haven't created any startups yet"}
            </Typography>
            {activeTab === 2 && (
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => setCreateModalOpen(true)}
              >
                Create Your First Startup
              </Button>
            )}
          </Box>
        )}
        {/* </> */}
        {/* )} */}

        {/* Load more (cursor-based) */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          {currentList.hasNext ? (
            <Button
              variant="outlined"
              onClick={async () => {
                const cursor = currentList.nextCursor;
                try {
                  if (activeTab === 0) {
                    await getStartups({ cursor, pageSize }, true);
                  } else if (activeTab === 1) {
                    await getFollowedStartups({ cursor, pageSize }, true);
                  } else {
                    await getMyStartups({ cursor, pageSize }, true);
                  }
                  window.scrollTo({ top: 200, behavior: 'smooth' });
                } catch (e) {
                  console.error('Failed to load more', e);
                }
              }}
            >
              Load more
            </Button>
          ) : null}
        </Box>

        {/* Startup Detail Dialog */}
        <Dialog
          open={!!selectedStartup}
          onClose={closeDetails}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: 4,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,247,250,0.9))',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden',
            },
          }}
        >
          <StartupDetailComponent
            startup={selectedStartup}
            comments={comments}
            commentsLoading={commentsLoading}
            showFullDescription={showFullDescription}
            setShowFullDescription={setShowFullDescription}
            commentValue={comment}
            setCommentValue={setComment}
            onPostComment={submitComment}
            onClose={closeDetails}
            // onFollowToggle={async () => {
            //   if (!selectedStartup) return;
            //   try {
            //     if (selectedStartup.isFollowing) {
            //       await unfollowStartup(selectedStartup.id);
            //     } else {
            //       await followStartup(selectedStartup.id);
            //     }
            //   } catch (err) {
            //     console.error('Follow toggle failed', err);
            //   }
            // }}
          />
        </Dialog>

        {/* Create Startup Modal */}
        <CreateStartupModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateStartup}
          loading={false}
        />

        {/* Edit Startup Modal */}
        {startupToEdit && (
          <EditStartupModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setStartupToEdit(null);
            }}
            onSubmit={handleEditStartup}
            startup={startupToEdit}
            loading={false}
          />
        )}

        {/* Snackbar for notifications */}
        {snackbar && (
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={() => setSnackbar(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => setSnackbar(null)}
              severity={snackbar.severity || 'success'}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        )}
      </motion.div>
    </Container>
  );
};

export default StartupMainPage;
