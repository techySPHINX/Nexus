// File: src/pages/SubCommunity/MySubCommunitiesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Button,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { useAuth } from '../../contexts/AuthContext';
import { SubCommunityCard } from '../../components/SubCommunity/SubCommunityCard';
import { SubCommunity } from '../../types/subCommunity';
import { Link } from 'react-router-dom';
import { SubCommunityRequestDialog } from '@/components/SubCommunity/SubCommunityRequestDialog';

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
      id={`my-communities-tabpanel-${index}`}
      aria-labelledby={`my-communities-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const MySubCommunitiesPage: React.FC = () => {
  const { user } = useAuth();
  const { subCommunities, loading, getAllSubCommunities } = useSubCommunity();

  const [activeTab, setActiveTab] = useState(0);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [filteredCommunities, setFilteredCommunities] = useState<{
    owned: SubCommunity[];
    moderated: SubCommunity[];
    member: SubCommunity[];
  }>({ owned: [], moderated: [], member: [] });

  const isAdmin = user?.role === 'ADMIN';
  const isAlum = user?.role === 'ALUM';

  useEffect(() => {
    getAllSubCommunities();
  }, [getAllSubCommunities]);

  useEffect(() => {
    if (subCommunities.length > 0 && user) {
      // Filter communities based on user's role in each community
      const owned: SubCommunity[] = [];
      const moderated: SubCommunity[] = [];
      const member: SubCommunity[] = [];

      subCommunities.forEach((subCom) => {
        // Check if user is a member of this community
        const isMember = subCom.members?.some((m) => m.userId === user.id);

        if (isMember) {
          const membership = subCom.members?.find((m) => m.userId === user.id);

          if (membership?.role === 'OWNER') {
            owned.push(subCom);
          } else if (membership?.role === 'MODERATOR') {
            moderated.push(subCom);
          } else if (membership?.role === 'MEMBER') {
            member.push(subCom);
          }
        }
      });

      setFilteredCommunities({ owned, moderated, member });
    }
  }, [subCommunities, user]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading && subCommunities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalCommunities =
    filteredCommunities.owned.length +
    filteredCommunities.moderated.length +
    filteredCommunities.member.length;

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, mb: 1 }}
          >
            My Communities
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage communities where you're an owner, moderator, or member
          </Typography>
        </Box>

        {(isAdmin || isAlum) && (
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setRequestDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Request New Community
          </Button>
        )}
      </Box>

      {/* Back to All Communities */}
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          to="/subcommunities"
          variant="outlined"
          sx={{ mb: 2 }}
        >
          ← Back to All Communities
        </Button>
      </Box>

      {/* Summary Stats */}
      {totalCommunities > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            label={`${filteredCommunities.owned.length} Owned`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${filteredCommunities.moderated.length} Moderated`}
            color="secondary"
            variant="outlined"
          />
          <Chip
            label={`${filteredCommunities.member.length} Member`}
            color="default"
            variant="outlined"
          />
        </Box>
      )}

      {/* Tabs for different roles */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Owned
                {filteredCommunities.owned.length > 0 && (
                  <Chip
                    label={filteredCommunities.owned.length}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Moderated
                {filteredCommunities.moderated.length > 0 && (
                  <Chip
                    label={filteredCommunities.moderated.length}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Member
                {filteredCommunities.member.length > 0 && (
                  <Chip
                    label={filteredCommunities.member.length}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Owned Communities Tab */}
      <TabPanel value={activeTab} index={0}>
        {filteredCommunities.owned.length > 0 ? (
          <>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Communities You Own
            </Typography>
            <Grid container spacing={3}>
              {filteredCommunities.owned.map((subCom) => (
                <Grid item xs={12} sm={6} md={6} key={subCom.id}>
                  <SubCommunityCard subCommunity={subCom} />
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              You don't own any communities yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {isAdmin || isAlum
                ? 'Create a community to get started as an owner'
                : 'Only Alumni and Admins can own communities'}
            </Typography>
            {(isAdmin || isAlum) && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setRequestDialogOpen(true)}
              >
                Create Your First Community
              </Button>
            )}
          </Box>
        )}
      </TabPanel>

      {/* Moderated Communities Tab */}
      <TabPanel value={activeTab} index={1}>
        {filteredCommunities.moderated.length > 0 ? (
          <>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Communities You Moderate
            </Typography>
            <Grid container spacing={3}>
              {filteredCommunities.moderated.map((subCom) => (
                <Grid item xs={12} sm={6} md={6} key={subCom.id}>
                  <SubCommunityCard subCommunity={subCom} />
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              You're not moderating any communities
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Community owners can assign you as a moderator
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Member Communities Tab */}
      <TabPanel value={activeTab} index={2}>
        {filteredCommunities.member.length > 0 ? (
          <>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Communities You're a Member Of
            </Typography>
            <Grid container spacing={3}>
              {filteredCommunities.member.map((subCom) => (
                <Grid item xs={12} sm={6} md={6} key={subCom.id}>
                  <SubCommunityCard subCommunity={subCom} />
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              You're not a member of any communities yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Join communities to connect with others who share your interests
            </Typography>
            <Button component={Link} to="/subcommunities" variant="contained">
              Browse All Communities
            </Button>
          </Box>
        )}
      </TabPanel>

      {/* Create Community Dialog */}
      <SubCommunityRequestDialog
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
      />
    </Box>
  );
};
