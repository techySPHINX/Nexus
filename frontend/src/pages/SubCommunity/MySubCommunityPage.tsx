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
  Pagination,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { subCommunityService } from '../../services/subCommunityService';
import { useAuth } from '../../contexts/AuthContext';
import { SubCommunityCard } from '../../components/SubCommunity/SubCommunityCard';
import { SubCommunity } from '../../types/subCommunity';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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

const MySubCommunitiesPage: React.FC = () => {
  const { user } = useAuth();
  const { loading } = useSubCommunity();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(0);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [filteredCommunities, setFilteredCommunities] = useState<{
    owned: SubCommunity[];
    moderated: SubCommunity[];
    member: SubCommunity[];
  }>({ owned: [], moderated: [], member: [] });

  // per-tab server pagination counts
  const [ownedPages, setOwnedPages] = useState(1);
  const [moderatedPages, setModeratedPages] = useState(1);
  const [memberPages, setMemberPages] = useState(1);

  // per-tab loading indicators to avoid global crash and improve UX
  const [loadingOwned, setLoadingOwned] = useState(false);
  const [loadingModerated, setLoadingModerated] = useState(false);
  const [loadingMember, setLoadingMember] = useState(false);

  // Pagination settings
  const PAGE_SIZE = 6;

  const getPageKeyForTab = (tabIndex: number) =>
    tabIndex === 0
      ? 'ownedPage'
      : tabIndex === 1
        ? 'moderatedPage'
        : 'memberPage';

  const getPageFromUrl = React.useCallback(
    (tabIndex: number) => {
      const key = getPageKeyForTab(tabIndex);
      const params = new URLSearchParams(location.search);
      const parsed = parseInt(params.get(key) || '1', 10);
      return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
    },
    [location.search]
  );

  const handlePageChange = (tabIndex: number, page: number) => {
    const key = getPageKeyForTab(tabIndex);
    const params = new URLSearchParams(location.search);
    // set new page for this tab and remove other tab page params
    params.set(key, String(page));
    ['ownedPage', 'moderatedPage', 'memberPage']
      .filter((k) => k !== key)
      .forEach((k) => params.delete(k));
    // navigate to the current tab route with updated query
    const base =
      tabIndex === 0
        ? '/subcommunities/my/owned'
        : tabIndex === 1
          ? '/subcommunities/my/moderated'
          : '/subcommunities/my/member';
    navigate(`${base}?${params.toString()}`);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAlum = user?.role === 'ALUM';

  // Fetch only the active tab category (one network call at a time)
  useEffect(() => {
    const page = getPageFromUrl(activeTab);
    if (!user) return;

    if (activeTab === 0) {
      setLoadingOwned(true);
      subCommunityService
        .getMyOwnedSubCommunities(page, PAGE_SIZE)
        .then((resp) => {
          setFilteredCommunities((prev) => ({ ...prev, owned: resp.data }));
          setOwnedPages(resp.pagination?.totalPages ?? 1);
        })
        .catch((e) => console.error('Failed to fetch owned communities', e))
        .finally(() => setLoadingOwned(false));
    } else if (activeTab === 1) {
      setLoadingModerated(true);
      subCommunityService
        .getMyModeratedSubCommunities(page, PAGE_SIZE)
        .then((resp) => {
          setFilteredCommunities((prev) => ({ ...prev, moderated: resp.data }));
          setModeratedPages(resp.pagination?.totalPages ?? 1);
        })
        .catch((e) => console.error('Failed to fetch moderated communities', e))
        .finally(() => setLoadingModerated(false));
    } else {
      setLoadingMember(true);
      subCommunityService
        .getMyMemberSubCommunities(page, PAGE_SIZE)
        .then((resp) => {
          setFilteredCommunities((prev) => ({ ...prev, member: resp.data }));
          setMemberPages(resp.pagination?.totalPages ?? 1);
        })
        .catch((e) => console.error('Failed to fetch member communities', e))
        .finally(() => setLoadingMember(false));
    }
  }, [location.search, activeTab, user, getPageFromUrl]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // navigate to the appropriate sub-route when tab clicked
    const base =
      newValue === 0
        ? '/subcommunities/my/owned'
        : newValue === 1
          ? '/subcommunities/my/moderated'
          : '/subcommunities/my/member';
    // preserve existing page param for that tab if present
    const params = new URLSearchParams(location.search);
    const key = getPageKeyForTab(newValue);
    const page = params.get(key) || '1';
    params.set(key, page);
    // remove other pages
    ['ownedPage', 'moderatedPage', 'memberPage']
      .filter((k) => k !== key)
      .forEach((k) => params.delete(k));
    navigate(`${base}?${params.toString()}`);
  };

  // Keep activeTab in sync with the current URL path. If user lands on
  // `/subcommunities/my` redirect to the default `owned` sub-route.
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname.endsWith('/owned')) setActiveTab(0);
    else if (pathname.endsWith('/moderated')) setActiveTab(1);
    else if (pathname.endsWith('/member')) setActiveTab(2);
    else if (pathname.endsWith('/my')) {
      navigate('/subcommunities/my/owned', { replace: true });
    }
  }, [location.pathname, navigate]);

  if (
    loading &&
    (filteredCommunities?.owned?.length ?? 0) === 0 &&
    (filteredCommunities?.moderated?.length ?? 0) === 0 &&
    (filteredCommunities?.member?.length ?? 0) === 0
  ) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalCommunities =
    (filteredCommunities?.owned?.length ?? 0) +
    (filteredCommunities?.moderated?.length ?? 0) +
    (filteredCommunities?.member?.length ?? 0);

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
                {(filteredCommunities?.owned?.length ?? 0) > 0 && (
                  <Chip
                    label={filteredCommunities?.owned?.length ?? 0}
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
                {(filteredCommunities?.moderated?.length ?? 0) > 0 && (
                  <Chip
                    label={filteredCommunities?.moderated?.length ?? 0}
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
                {(filteredCommunities?.member?.length ?? 0) > 0 && (
                  <Chip
                    label={filteredCommunities?.member?.length ?? 0}
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
        {loadingOwned ? (
          <div className="flex justify-center py-6">
            <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm w-full max-w-xl animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-emerald-100 rounded w-2/5" />
                <div className="w-20 h-4 bg-emerald-100 rounded" />
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-emerald-100 rounded w-3/4" />
                      <div className="h-3 bg-emerald-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (filteredCommunities?.owned?.length ?? 0) > 0 ? (
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
            {ownedPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={ownedPages}
                  page={getPageFromUrl(0)}
                  onChange={(_e, p) => handlePageChange(0, p)}
                />
              </Box>
            )}
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
        {loadingModerated ? (
          <div className="flex justify-center py-6">
            <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm w-full max-w-xl animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-emerald-100 rounded w-2/5" />
                <div className="w-20 h-4 bg-emerald-100 rounded" />
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-emerald-100 rounded w-3/4" />
                      <div className="h-3 bg-emerald-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (filteredCommunities?.moderated?.length ?? 0) > 0 ? (
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
            {moderatedPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={moderatedPages}
                  page={getPageFromUrl(1)}
                  onChange={(_e, p) => handlePageChange(1, p)}
                />
              </Box>
            )}
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
        {loadingMember ? (
          <div className="flex justify-center py-6">
            <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm w-full max-w-xl animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-emerald-100 rounded w-2/5" />
                <div className="w-20 h-4 bg-emerald-100 rounded" />
              </div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-emerald-100 rounded w-3/4" />
                      <div className="h-3 bg-emerald-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (filteredCommunities?.member?.length ?? 0) > 0 ? (
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
            {memberPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={memberPages}
                  page={getPageFromUrl(2)}
                  onChange={(_e, p) => handlePageChange(2, p)}
                />
              </Box>
            )}
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

export default MySubCommunitiesPage;
