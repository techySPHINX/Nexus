import {
  FC,
  useEffect,
  useState,
  useCallback,
  lazy,
  MouseEvent,
  ComponentType,
  LazyExoticComponent,
  Fragment,
  ReactNode,
  Suspense,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../contexts/PostContext';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Chip,
  Avatar,
  Container,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  People,
  Article,
  Public,
  Lock,
  ArrowBack,
  Add,
  MoreVert,
  AdminPanelSettings,
  Shield,
  Person,
  ExitToApp,
  Block,
  Edit,
  Delete,
  Group,
  Settings,
  Refresh,
} from '@mui/icons-material';
import { Post as PostType } from '@/types/post';
// Lazy-load heavy components so the page renders a skeleton first
type CreatePostFormProps = {
  subCommunityId?: string;
  subCommunityName?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
  profile?: { id?: string; avatarUrl?: string | null };
  userRole?: SubCommunityRole | null;
};

const CreatePostForm = lazy(() =>
  import('../../components/Post/CreatePostForm').then((mod) => {
    return {
      default: (
        mod as unknown as {
          CreatePostForm: ComponentType<CreatePostFormProps>;
        }
      ).CreatePostForm,
    };
  })
) as LazyExoticComponent<ComponentType<CreatePostFormProps>>;

type PostComponentProps = {
  post: PostType;
  onClick?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isAdminView?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
};

const Post = lazy(() =>
  import('../../components/Post/Post').then((mod) => {
    return {
      default: (
        mod as unknown as {
          Post: ComponentType<PostComponentProps>;
        }
      ).Post,
    };
  })
) as LazyExoticComponent<ComponentType<PostComponentProps>>;
import { getErrorMessage } from '@/utils/errorHandler';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  SubCommunityRole,
  SubCommunityMember,
  SubCommunity,
} from '../../types/subCommunity';
import { Role } from '@/types/profileType';
const SubCommunityEditBox = lazy(() =>
  import('@/components/SubCommunity/SubCommunityEditBox').then((mod) => {
    return {
      default: (
        mod as unknown as {
          SubCommunityEditBox: ComponentType<{
            community: SubCommunity;
            open: boolean;
            onClose: () => void;
            onSave: () => void;
          }>;
        }
      ).SubCommunityEditBox,
    };
  })
);
import { ProfileNameLink } from '@/utils/ProfileNameLink';

// Tab panel component
function TabPanel(props: {
  children?: ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`subcommunity-tabpanel-${index}`}
      aria-labelledby={`subcommunity-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SubCommunityFeedPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentSubCommunity,
    getSubCommunity,
    loading: subCommunityLoading,
    error: subCommunityError,
    clearError,
    requestToJoin,
    joinRequests,
    getPendingJoinRequests,
    // members,
    leaveSubCommunity,
    removeMember,
    updateMemberRole,
    // banSubCommunity,
    deleteSubCommunity,
  } = useSubCommunity();

  const {
    subCommunityFeed,
    getSubCommunityFeed,
    pagination,
    loading: feedLoading,
    error: feedError,
  } = usePosts();
  const { user } = useAuth();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [openForm, setOpenForm] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<SubCommunityRole | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [memberMenuAnchor, setMemberMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [selectedMember, setSelectedMember] =
    useState<SubCommunityMember | null>(null);
  const [communityMenuAnchor, setCommunityMenuAnchor] =
    useState<null | HTMLElement>(null);

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error') => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    },
    []
  );

  const isAdmin = user?.role === Role.ADMIN;

  // Load sub-community data
  useEffect(() => {
    if (id) {
      getSubCommunity(id);
      getSubCommunityFeed(id);
    }
  }, [id, getSubCommunity, getSubCommunityFeed]);

  // Check if user is a member and has pending requests
  useEffect(() => {
    if (user && currentSubCommunity) {
      const member = currentSubCommunity.members?.find(
        (m) => m.userId === user.id
      );
      setIsMember(!!member);
      setUserRole(member?.role || null);

      if (currentSubCommunity.isPrivate && !member) {
        getPendingJoinRequests(id!);
      }
    }
  }, [user, currentSubCommunity, id, getPendingJoinRequests]);

  // Check for pending join requests
  useEffect(() => {
    if (user && joinRequests.length > 0) {
      const userRequest = joinRequests.find((req) => req.userId === user.id);
      setHasPendingRequest(!!userRequest);
    }
  }, [user, joinRequests]);

  // Handle errors
  useEffect(() => {
    if (subCommunityError) {
      showSnackbar(subCommunityError, 'error');
      clearError();
    }

    if (feedError) {
      showSnackbar(feedError, 'error');
    }
  }, [subCommunityError, feedError, showSnackbar, clearError]);

  const handleLoadMore = () => {
    if (id && pagination.hasNext) {
      getSubCommunityFeed(id, pagination.page + 1);
    }
  };

  const handleCreatePostSuccess = useCallback(() => {
    setOpenForm(false);
    showSnackbar('Post created successfully and sent for approval!', 'success');
    if (id) {
      getSubCommunityFeed(id, 1); // Refresh feed
    }
  }, [getSubCommunityFeed, id, showSnackbar]);

  const handleCreatePostError = useCallback(
    (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    },
    [showSnackbar]
  );

  const handleJoinRequest = async () => {
    if (!id || !user) return;

    try {
      await requestToJoin(id);
      setHasPendingRequest(true);
      showSnackbar('Join request sent successfully!', 'success');
      // Refresh pending requests
      getPendingJoinRequests(id);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    } finally {
      // Avoid re-fetching the entire community and feed to keep UX snappy.
      // We already updated local state and refreshed pending requests above.
    }
  };

  const handleLeaveCommunity = async () => {
    if (!id || !user) return;

    try {
      await leaveSubCommunity(id);
      showSnackbar('You have left the community', 'success');
      setIsMember(false);
      setUserRole(null);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;

    try {
      await removeMember(id, memberId);
      showSnackbar('Member removed successfully', 'success');
      setMemberMenuAnchor(null);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: SubCommunityRole
  ) => {
    if (!id) return;

    try {
      await updateMemberRole(id, memberId, newRole);
      showSnackbar('Member role updated successfully', 'success');
      setMemberMenuAnchor(null);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleBanCommunity = async () => {
    if (!isAdmin) {
      showSnackbar('You do not have permission to ban this community', 'error');
      return;
    }
    if (!id) return;

    try {
      // await banSubCommunity(id);
      showSnackbar(
        'Community banned successfully but not functional',
        'success'
      );
      setCommunityMenuAnchor(null);
      navigate('/subcommunities');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDeleteCommunity = async () => {
    if (userRole !== SubCommunityRole.OWNER || isAdmin) {
      showSnackbar(
        'You do not have permission to delete this community',
        'error'
      );
      return;
    }
    if (!id) return;

    try {
      await deleteSubCommunity(id);
      showSnackbar('Community deleted successfully', 'success');
      setCommunityMenuAnchor(null);
      navigate('/subcommunities');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    }
  };

  const openMemberMenu = (
    event: MouseEvent<HTMLElement>,
    member: SubCommunityMember
  ) => {
    setSelectedMember(member);
    setMemberMenuAnchor(event.currentTarget);
  };

  const closeMemberMenu = () => {
    setMemberMenuAnchor(null);
    setSelectedMember(null);
  };

  const openCommunityMenu = (event: MouseEvent<HTMLElement>) => {
    setCommunityMenuAnchor(event.currentTarget);
  };

  const closeCommunityMenu = () => {
    setCommunityMenuAnchor(null);
  };

  const renderRoleIcon = (role: SubCommunityRole) => {
    switch (role) {
      case SubCommunityRole.OWNER:
        return <AdminPanelSettings color="primary" />;
      case SubCommunityRole.MODERATOR:
        return <Shield color="secondary" />;
      default:
        return <Person color="action" />;
    }
  };

  const renderPosts = () => {
    // Show skeleton loading UI for first page (tailwind/emerald style)
    if (feedLoading && pagination.page === 1) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            p: 3,
            mt: 4,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
            }}
          >
            <Typography variant="h6">Posts</Typography>
            <Skeleton
              variant="rectangular"
              width={80}
              height={24}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {[...Array(3)].map((_, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Skeleton
                  variant="circular"
                  width={80}
                  height={80}
                  animation="wave"
                />
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Skeleton
                      variant="text"
                      width="70%"
                      height={24}
                      animation="wave"
                    />
                    <Skeleton
                      variant="rectangular"
                      width={64}
                      height={24}
                      sx={{ borderRadius: 1 }}
                      animation="wave"
                    />
                  </Box>
                  <Skeleton
                    variant="text"
                    width="100%"
                    height={16}
                    animation="wave"
                  />
                  <Skeleton
                    variant="text"
                    width="66%"
                    height={16}
                    animation="wave"
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={32}
                      sx={{ borderRadius: 1 }}
                      animation="wave"
                    />
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={32}
                      sx={{ borderRadius: 1 }}
                      animation="wave"
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      );
    }

    if (!subCommunityFeed || subCommunityFeed.length === 0) {
      return (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <Article sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Be the first to share something in this community!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenForm(true)}
          >
            Create First Post
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {subCommunityFeed.map((post) => (
          <Suspense
            key={post.id}
            fallback={
              <Card sx={{ mb: 3 }}>
                <Box
                  sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2 }}
                >
                  <Skeleton
                    variant="circular"
                    width={48}
                    height={48}
                    animation="wave"
                  />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton
                      variant="text"
                      width="40%"
                      height={20}
                      animation="wave"
                      sx={{ mb: 0.5 }}
                    />
                    <Skeleton
                      variant="text"
                      width="30%"
                      height={16}
                      animation="wave"
                    />
                  </Box>
                  <Skeleton
                    variant="circular"
                    width={32}
                    height={32}
                    animation="wave"
                  />
                </Box>

                <Box sx={{ px: 2 }}>
                  <Skeleton
                    variant="rectangular"
                    width={120}
                    height={28}
                    sx={{ borderRadius: 1, my: 1 }}
                    animation="wave"
                  />
                </Box>

                <CardContent>
                  <Skeleton
                    variant="text"
                    width="100%"
                    height={16}
                    animation="wave"
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    width="80%"
                    height={16}
                    animation="wave"
                    sx={{ mb: 1 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={192}
                    sx={{ borderRadius: 1 }}
                    animation="wave"
                  />
                </CardContent>

                <Box sx={{ px: 2, pb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={32}
                      sx={{ borderRadius: 1 }}
                      animation="wave"
                    />
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={32}
                      sx={{ borderRadius: 1 }}
                      animation="wave"
                    />
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={32}
                      sx={{ borderRadius: 1 }}
                      animation="wave"
                    />
                  </Box>
                </Box>
              </Card>
            }
          >
            <Post
              post={post}
              onClick={() =>
                navigate(`/posts/${post.id}`, {
                  state: { from: `/subcommunities/${id}` },
                })
              }
            />
          </Suspense>
        ))}
      </Box>
    );
  };

  const renderMembersTab = () => {
    if (subCommunityLoading) {
      // show skeletons while community data is loading (theme-aware)
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            p: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="h6">Members</Typography>
            <Skeleton
              variant="rectangular"
              width={64}
              height={16}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {[1, 2, 3, 4].map((i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Skeleton
                  variant="circular"
                  width={40}
                  height={40}
                  animation="wave"
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant="text"
                    width="35%"
                    height={16}
                    animation="wave"
                    sx={{ mb: 0.5 }}
                  />
                  <Skeleton
                    variant="text"
                    width="25%"
                    height={14}
                    animation="wave"
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      );
    }

    if (
      !currentSubCommunity?.members ||
      currentSubCommunity.members.length === 0
    ) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Group sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No members yet
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {currentSubCommunity.members.map((member) => (
          <Fragment key={member.id}>
            <ListItem
              secondaryAction={
                (userRole === SubCommunityRole.OWNER ||
                  (userRole === SubCommunityRole.MODERATOR &&
                    member.role === SubCommunityRole.MEMBER)) &&
                member.userId !== user?.id && (
                  <IconButton
                    edge="end"
                    aria-label="member actions"
                    onClick={(e) => openMemberMenu(e, member)}
                  >
                    <MoreVert />
                  </IconButton>
                )
              }
            >
              <ListItemAvatar>
                <Avatar src={member.user?.profile?.avatarUrl || undefined}>
                  {member.user.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ProfileNameLink
                      user={{
                        id: member.user.id,
                        name: member.user.name,
                        role: member.user.role,
                        profile: {
                          avatarUrl:
                            member.user?.profile?.avatarUrl || undefined,
                        },
                      }}
                      showRoleBadge={true}
                      linkToProfile={true}
                    />
                    {renderRoleIcon(member.role)}
                  </Box>
                }
                secondary={member.role}
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </Fragment>
        ))}
      </List>
    );
  };

  if (subCommunityLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            rounded: 2,
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            p: 4,
            width: '100%',
            maxWidth: '880px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Skeleton variant="text" width="30%" height={24} animation="wave" />
            <Skeleton
              variant="rectangular"
              width={80}
              height={24}
              sx={{ borderRadius: 1 }}
              animation="wave"
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {[...Array(3)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Skeleton
                  variant="rectangular"
                  width={80}
                  height={80}
                  sx={{ borderRadius: 1 }}
                  animation="wave"
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant="text"
                    width="75%"
                    height={16}
                    animation="wave"
                  />
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={14}
                    animation="wave"
                  />
                  <Skeleton
                    variant="text"
                    width="50%"
                    height={14}
                    animation="wave"
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  if (!currentSubCommunity) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Community not found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You are not a member of this community or the community you&apos;re
            looking for doesn&apos;t exist or may have been removed.
          </Typography>
          <Button
            component={Link}
            to="/subcommunities"
            variant="contained"
            startIcon={<ArrowBack />}
            size="large"
          >
            Back to Communities
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: { xs: 1, sm: 2 } }}>
        {/*  Navigation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          {/* Back Button (left side) */}
          <Button
            component={Link}
            to="/subcommunities"
            startIcon={<ArrowBack />}
            sx={{ mt: 2, mb: 2, mr: 2 }}
          >
            Back to Communities
          </Button>

          {/* Refresh Button with Tooltip (right side) */}
          <Tooltip title="Refresh community">
            <IconButton
              onClick={() => {
                if (id) {
                  getSubCommunity(id);
                  getSubCommunityFeed(id, 1);
                  showSnackbar('Community refreshed!', 'success');
                }
              }}
              size="large"
              sx={{
                borderRadius: '50%',
                bgcolor: 'background.green',
                boxShadow: 1,
                '&:hover': { bgcolor: 'primary.light' },
              }}
              aria-label="Refresh Community"
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Community Header with Banner */}
        <Box
          sx={{
            mb: 4,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: 2,
            position: 'relative',
          }}
        >
          {/* Banner Image */}
          <Box
            sx={{
              height: { xs: 120, md: 160 },
              backgroundImage: currentSubCommunity.bannerUrl
                ? `url(${currentSubCommunity.bannerUrl}), linear-gradient(to bottom, rgba(27,228,9,0.3), rgba(149,240,129,0.7))`
                : 'linear-gradient(to bottom, rgba(27,228,9,0.3), rgba(149,240,129,0.7))',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
          />

          {/* Community Info Overlay */}
          <Box
            sx={{
              p: 3,
              bgcolor: 'background.paper',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2,
              }}
            >
              {/* Left Side - Community Info */}
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <Avatar
                    src={currentSubCommunity?.iconUrl ?? undefined}
                    sx={{
                      width: 64,
                      height: 64,
                      border: `3px solid ${theme.palette.background.paper}`,
                      boxShadow: 2,
                    }}
                  />
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="h3"
                        component="h1"
                        sx={{ fontWeight: 700, mb: 1 }}
                      >
                        r/{currentSubCommunity.name}
                      </Typography>
                      {(userRole === SubCommunityRole.OWNER ||
                        userRole === SubCommunityRole.MODERATOR) && (
                        <IconButton onClick={openCommunityMenu} size="small">
                          <Settings />
                        </IconButton>
                      )}
                    </Box>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {currentSubCommunity.description}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={currentSubCommunity.isPrivate ? <Lock /> : <Public />}
                    label={
                      currentSubCommunity.isPrivate
                        ? 'Private Community'
                        : 'Public Community'
                    }
                    size="medium"
                    color={
                      currentSubCommunity.isPrivate ? 'default' : 'primary'
                    }
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip
                    icon={<People />}
                    label={`${currentSubCommunity._count?.members?.toLocaleString() || 0} members`}
                    size="medium"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Article />}
                    label={`${currentSubCommunity._count?.posts?.toLocaleString() || 0} posts`}
                    size="medium"
                    variant="outlined"
                  />
                  {userRole === SubCommunityRole.OWNER && (
                    <Button
                      variant="outlined"
                      onClick={() =>
                        navigate(
                          `/moderation/subcommunities/${currentSubCommunity.id}/join-requests`
                        )
                      }
                      size="medium"
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                      Moderation
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Right Side - Actions */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  minWidth: '200px',
                }}
              >
                {currentSubCommunity.owner && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32 }} />
                    <Typography variant="body2" color="text.secondary">
                      Owned by
                      <ProfileNameLink
                        user={{
                          id: currentSubCommunity.owner.id,
                          name: currentSubCommunity.owner.name,
                        }}
                        onlyFirstName={true}
                      />
                    </Typography>
                  </Box>
                )}

                {/* Join/Request to Join Buttons */}
                {!isMember && currentSubCommunity.isPrivate && (
                  <Button
                    variant="contained"
                    onClick={handleJoinRequest}
                    disabled={hasPendingRequest}
                    size="large"
                    startIcon={<Lock />}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    {hasPendingRequest ? 'Request Pending' : 'Request to Join'}
                  </Button>
                )}

                {!isMember && !currentSubCommunity.isPrivate && (
                  <Button
                    variant="contained"
                    onClick={handleJoinRequest}
                    disabled={hasPendingRequest}
                    size="large"
                    startIcon={<People />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      minHeight: '48px', // Fixed height for uniform appearance
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Join Community
                  </Button>
                )}

                {/* Create Post Button (for members) */}
                {isMember && (
                  <Button
                    variant="contained"
                    onClick={() => setOpenForm(true)}
                    size="large"
                    startIcon={<Add />}
                    sx={{
                      background: 'primary.main',
                      borderRadius: 2,
                      fontWeight: 600,
                      minHeight: '48px', // Fixed height for uniform appearance
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Create Post
                  </Button>
                )}

                {/* Leave Community Button (for members) */}
                {isMember && userRole !== SubCommunityRole.OWNER && (
                  <Button
                    variant="outlined"
                    onClick={handleLeaveCommunity}
                    size="small"
                    startIcon={<ExitToApp />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      mt: 1,
                      minHeight: '48px', // Fixed height for uniform appearance
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Leave Community
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Tabs for different views */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_e, newValue) => setActiveTab(newValue)}
          >
            <Tab label="Posts" />
            <Tab label="Members" />
            <Tab label="About" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          {isMember || !currentSubCommunity.isPrivate ? (
            <>
              {renderPosts()}

              {pagination.hasNext && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 4,
                    py: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleLoadMore}
                    disabled={feedLoading}
                    size="large"
                    sx={{ borderRadius: 2, minWidth: '200px' }}
                  >
                    {feedLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Load More Posts'
                    )}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                p: 6,
                bgcolor: 'background.paper',
                borderRadius: 3,
                boxShadow: 1,
              }}
            >
              <Lock sx={{ fontSize: 64, color: 'text.secondary', mb: 3 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Private Community
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: '400px', mx: 'auto' }}
              >
                This community is private. You need to be an approved member to
                view and participate in discussions.
              </Typography>
              <Button
                variant="contained"
                onClick={handleJoinRequest}
                disabled={hasPendingRequest}
                size="large"
                startIcon={<Lock />}
                sx={{ borderRadius: 2, fontWeight: 600, px: 4 }}
              >
                {hasPendingRequest ? 'Request Pending' : 'Request to Join'}
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderMembersTab()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                About r/{currentSubCommunity.name}
              </Typography>
              <Typography variant="body1" paragraph>
                {currentSubCommunity.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created on{' '}
                {new Date(currentSubCommunity.createdAt).toLocaleDateString()}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip
                  icon={currentSubCommunity.isPrivate ? <Lock /> : <Public />}
                  label={currentSubCommunity.isPrivate ? 'Private' : 'Public'}
                  sx={{ mr: 1 }}
                />
                <Chip
                  icon={<People />}
                  label={`${currentSubCommunity._count?.members || 0} members`}
                  sx={{ mr: 1 }}
                />
                <Chip
                  icon={<Article />}
                  label={`${currentSubCommunity._count?.posts || 0} posts`}
                />
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Create Post Dialog */}
        <Dialog
          open={openForm}
          onClose={() => setOpenForm(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '1.2rem',
            }}
          >
            Create Post in r/{currentSubCommunity.name}
          </DialogTitle>
          <DialogContent sx={{ p: 3, minHeight: '400px' }}>
            <Suspense
              fallback={
                <Box sx={{ py: 4, display: 'grid', gap: 2 }}>
                  <Skeleton
                    variant="text"
                    width="75%"
                    height={40}
                    animation="wave"
                  />
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={160}
                    sx={{ borderRadius: 1 }}
                    animation="wave"
                  />
                </Box>
              }
            >
              <CreatePostForm
                subCommunityId={currentSubCommunity.id}
                subCommunityName={currentSubCommunity.name}
                onSuccess={handleCreatePostSuccess}
                onError={handleCreatePostError}
                onCancel={() => setOpenForm(false)}
                userRole={userRole}
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      </Box>

      {/* Member Actions Menu */}
      <Menu
        anchorEl={memberMenuAnchor}
        open={Boolean(memberMenuAnchor)}
        onClose={closeMemberMenu}
      >
        <MenuItem
          onClick={() => {
            handleUpdateMemberRole(
              selectedMember!.id,
              SubCommunityRole.MODERATOR
            );
            closeMemberMenu();
          }}
          disabled={selectedMember?.role === SubCommunityRole.MODERATOR}
        >
          <Shield sx={{ mr: 1 }} /> Make Moderator
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleUpdateMemberRole(selectedMember!.id, SubCommunityRole.MEMBER);
            closeMemberMenu();
          }}
          disabled={selectedMember?.role === SubCommunityRole.MEMBER}
        >
          <Person sx={{ mr: 1 }} /> Make Member
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleRemoveMember(selectedMember!.user.id);
            closeMemberMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <Block sx={{ mr: 1 }} /> Remove Member
        </MenuItem>
      </Menu>

      {/* Community Actions Menu */}
      <Menu
        anchorEl={communityMenuAnchor}
        open={Boolean(communityMenuAnchor)}
        onClose={closeCommunityMenu}
      >
        <MenuItem
          onClick={() => {
            setEditDialogOpen(true);
            closeCommunityMenu();
          }}
        >
          <Edit sx={{ mr: 1 }} /> Edit Community
        </MenuItem>
        {isAdmin && (
          <MenuItem
            onClick={() => {
              handleBanCommunity();
              closeCommunityMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            <Block sx={{ mr: 1 }} /> Ban Community
          </MenuItem>
        )}
        {(userRole == SubCommunityRole.OWNER || isAdmin) && (
          <MenuItem
            onClick={() => {
              handleDeleteCommunity();
              closeCommunityMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 1 }} /> Delete Community
          </MenuItem>
        )}
      </Menu>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            borderRadius: 2,
            fontWeight: 500,
          }}
          elevation={6}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Suspense
        fallback={
          <Dialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
          >
            <DialogTitle>
              <Skeleton
                variant="text"
                width="33%"
                height={24}
                animation="wave"
              />
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'grid', gap: 2, py: 2 }}>
                <Skeleton
                  variant="text"
                  width="100%"
                  height={36}
                  animation="wave"
                />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={160}
                  sx={{ borderRadius: 1 }}
                  animation="wave"
                />
              </Box>
            </DialogContent>
          </Dialog>
        }
      >
        {currentSubCommunity && (
          <SubCommunityEditBox
            community={currentSubCommunity}
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            onSave={() => {
              showSnackbar('Community updated successfully!', 'success');
              getSubCommunity(id!); // Refresh community data
            }}
          />
        )}
      </Suspense>
    </>
  );
};

export default SubCommunityFeedPage;
