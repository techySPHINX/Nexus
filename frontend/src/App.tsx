import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useNavbar } from './contexts/NavbarContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './route/AdminRoute';
import './App.css';

// Lazy load all pages for better code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const EnhancedRegister = lazy(
  () => import('./components/Auth/EnhancedRegister')
);
const RegistrationSuccess = lazy(() => import('./pages/RegistrationSuccess'));
const AdminDocumentVerification = lazy(
  () => import('./pages/AdminDocumentVerification')
);
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Connections = lazy(() => import('./pages/Connections'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const Profile = lazy(() => import('./pages/Profile'));
const Referrals = lazy(() => import('./pages/Referrals'));
const Files = lazy(() => import('./pages/Files'));
// const Landing = lazy(() => import('./pages/Landing'));
const Notification = lazy(() => import('./pages/Notification'));
const FeedPage = lazy(() => import('./pages/Posts/FeedPage'));
const PostDetailPage = lazy(() => import('./pages/Posts/PostDetailPage'));
const UserPostsPage = lazy(() => import('./pages/Posts/UserPostsPage'));
const SubCommunitiesPage = lazy(
  () => import('./pages/SubCommunity/SubCommunityPage')
);
const SearchResultsPage = lazy(() => import('./pages/Posts/SearchResultsPage'));
const SubCommunityFeedPage = lazy(
  () => import('./pages/SubCommunity/SubCommunityFeedPage')
);
const AdminModerationPage = lazy(
  () => import('./pages/Posts/AdminModerationPage')
);
const AdminSubCommunityModerationPage = lazy(
  () => import('./pages/SubCommunity/AdminSubCommunityModerationPage')
);

const RouteUnavailable = lazy(() => import('./pages/RouteUnavailable'));

const SubCommunityJoinRequestModeration = lazy(
  () => import('./pages/SubCommunity/SubCommunityJoinRequestModeration')
);
const MySubCommunitiesPage = lazy(
  () => import('./pages/SubCommunity/MySubCommunityPage')
);
const ProjectsMainPage = lazy(() => import('./pages/Project/ProjectMainPage'));
const StartupsMainPage = lazy(() => import('./pages/Startup/StartupMainPage'));
const ProjectIdPage = lazy(() => import('./pages/Project/ProjectIdPage'));
const UserProjectPage = lazy(() => import('./pages/Project/UserProjectPage'));

// Import context providers
const ProfileProvider = lazy(() => import('./contexts/ProfileContext'));
const PostProvider = lazy(() => import('./contexts/PostContext'));
const SubCommunityProvider = lazy(
  () => import('./contexts/SubCommunityContext')
);
const DashboardProvider = lazy(() => import('./contexts/DashBoardContext'));
const ShowcaseProvider = lazy(() => import('./contexts/ShowcaseContext'));
const StartupProvider = lazy(() => import('./contexts/StartupContext'));
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NavbarProvider } from './contexts/NavbarContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { EngagementProvider } from './contexts/engagementContext';
import { EngagementService } from './services/engagementService';
import LandingPage2 from './pages/LandingPage2';

// Loading component for Suspense fallback
const LoadingSpinner: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
    }}
  >
    <CircularProgress />
  </Box>
);

// Layout component that handles navbar positioning
const Layout: React.FC = () => {
  const { position, collapsed } = useNavbar();

  return (
    <div className="App">
      <Navbar />
      <Box
        sx={{
          pt: position === 'top' ? { xs: 7, sm: 8 } : 0,
          pl:
            position === 'left'
              ? { xs: 0, md: collapsed ? '80px' : '160px' }
              : 0,
          minHeight: '100vh',
          bgcolor: 'background.default',
          position: 'relative',
        }}
      >
        {/* Main Content */}
        <Box
          sx={{
            pr: position === 'left' ? 0 : 0,
            transition: 'all 0.3s ease',
          }}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '50vh',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <CircularProgress size={40} />
                <Box sx={{ color: 'text.secondary' }}>Loading...</Box>
              </Box>
            }
          >
            <Routes>
              <Route path="/" element={<LandingPage2 />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<EnhancedRegister />} />
              <Route path="/register-enhanced" element={<Register />} />
              <Route
                path="/registration-success"
                element={<RegistrationSuccess />}
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardProvider>
                      <Dashboard />
                    </DashboardProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/document-verification"
                element={
                  <AdminRoute>
                    <AdminDocumentVerification />
                  </AdminRoute>
                }
              />
              <Route
                path="/connections"
                element={
                  <ProtectedRoute>
                    <Connections />
                  </ProtectedRoute>
                }
              />
              <Route path="/messages" element={<ChatPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileProvider>
                      <Profile />
                    </ProfileProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <ProfileProvider>
                      <Profile />
                    </ProfileProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/referrals"
                element={
                  <ProtectedRoute>
                    <Referrals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/files"
                element={
                  <ProtectedRoute>
                    <Files />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notification />
                  </ProtectedRoute>
                }
              />

              {/* Post-related routes with lazy loading */}
              <Route
                path="/feed"
                element={
                  <ProtectedRoute>
                    <PostProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <FeedPage />
                      </Suspense>
                    </PostProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/posts/:id"
                element={
                  <ProtectedRoute>
                    <PostProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <PostDetailPage />
                      </Suspense>
                    </PostProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:userId/posts"
                element={
                  <ProtectedRoute>
                    <PostProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <UserPostsPage />
                      </Suspense>
                    </PostProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subcommunities"
                element={
                  <ProtectedRoute>
                    <SubCommunityProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <SubCommunitiesPage />
                      </Suspense>
                    </SubCommunityProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subcommunities/:id"
                element={
                  <ProtectedRoute>
                    <SubCommunityProvider>
                      <PostProvider>
                        <Suspense fallback={<LoadingSpinner />}>
                          <SubCommunityFeedPage />
                        </Suspense>
                      </PostProvider>
                    </SubCommunityProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subcommunities/my"
                element={
                  <ProtectedRoute>
                    <SubCommunityProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <MySubCommunitiesPage />
                      </Suspense>
                    </SubCommunityProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subcommunities/my/owned"
                element={
                  <ProtectedRoute>
                    <SubCommunityProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <MySubCommunitiesPage />
                      </Suspense>
                    </SubCommunityProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subcommunities/my/moderated"
                element={
                  <ProtectedRoute>
                    <SubCommunityProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <MySubCommunitiesPage />
                      </Suspense>
                    </SubCommunityProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subcommunities/my/member"
                element={
                  <ProtectedRoute>
                    <SubCommunityProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <MySubCommunitiesPage />
                      </Suspense>
                    </SubCommunityProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ShowcaseProvider>
                      <ProjectsMainPage />
                    </ShowcaseProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <ShowcaseProvider>
                      <ProjectIdPage />
                    </ShowcaseProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:userId/projects"
                element={
                  <ProtectedRoute>
                    <ShowcaseProvider>
                      <UserProjectPage />
                    </ShowcaseProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/startups"
                element={
                  <ProtectedRoute>
                    <StartupProvider>
                      <StartupsMainPage />
                    </StartupProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <SearchResultsPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Admin-only routes with lazy loading */}
              <Route
                path="/admin/moderation"
                element={
                  <AdminRoute>
                    <PostProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminModerationPage />
                      </Suspense>
                    </PostProvider>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/moderation/subcommunities"
                element={
                  <AdminRoute>
                    <SubCommunityProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminSubCommunityModerationPage />
                      </Suspense>
                    </SubCommunityProvider>
                  </AdminRoute>
                }
              />
              <Route
                path="/moderation/subcommunities/:id/join-requests"
                element={
                  <SubCommunityProvider>
                    <Suspense fallback={<LoadingSpinner />}>
                      <SubCommunityJoinRequestModeration />
                    </Suspense>
                  </SubCommunityProvider>
                }
              />

              {/* Add more admin routes here with lazy loading as needed */}
              {/* <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <AdminAnalyticsPage />
                  </Suspense>
                </AdminRoute>
              }
            /> */}
              <Route path="*" element={<RouteUnavailable />} />
            </Routes>
          </Suspense>
        </Box>
      </Box>
    </div>
  );
};

const engagementService = new EngagementService();

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavbarProvider>
          <NotificationProvider>
            <EngagementProvider engagementService={engagementService}>
              <Router>
                <Layout />
              </Router>
            </EngagementProvider>
          </NotificationProvider>
        </NavbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
