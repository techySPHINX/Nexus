import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NavbarProvider } from './contexts/NavbarContext';
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
const Landing = lazy(() => import('./pages/Landing'));
const Notification = lazy(() => import('./pages/Notification'));
import { NotificationProvider } from './contexts/NotificationContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { EngagementProvider } from './contexts/engagementContext';
import { EngagementService } from './services/engagementService';
import { PostProvider } from './contexts/PostContext';
import { SubCommunityProvider } from './contexts/SubCommunityContext';
import { ShowcaseProvider } from './contexts/ShowcaseContext';

// Import components that use named exports (not default exports)
import { FeedPage } from './pages/Posts/FeedPage';
import { PostDetailPage } from './pages/Posts/PostDetailPage';
import { UserPostsPage } from './pages/Posts/UserPostsPage';
import { SubCommunitiesPage } from './pages/Posts/SubCommunityPage';
import { SearchResultsPage } from './pages/Posts/SearchResultsPage';
import { SubCommunityFeedPage } from './pages/Posts/SubCommunityFeedPage';
import { AdminModerationPage } from './pages/Posts/AdminModerationPage';
import { MySubCommunitiesPage } from './pages/SubCommunity/MySubCommunityPage';
import ProjectsMainPage from './pages/Project/ProjectMainPage';

const AdminSubCommunityModerationPage = lazy(
  () => import('./pages/Posts/AdminSubCommunityModerationPage')
);

const SubCommunityJoinRequestModeration = lazy(
  () => import('./pages/Posts/SubCommunityJoinRequestModeration')
);

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
  const { position } = useNavbar();

  return (
    <div className="App">
      <Navbar />
      <Box
        sx={{
          pt: position === 'top' ? 8 : 0,
          pl: position === 'left' ? '280px' : 0,
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
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-enhanced" element={<EnhancedRegister />} />
              <Route
                path="/registration-success"
                element={<RegistrationSuccess />}
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
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
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <Profile />
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
                    <Suspense fallback={<LoadingSpinner />}>
                      <FeedPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/posts/:id"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <PostDetailPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:userId/posts"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <UserPostsPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subcommunities"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <SubCommunitiesPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subcommunities/:id"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <SubCommunityFeedPage />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subcommunities/my"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <MySubCommunitiesPage />
                    </Suspense>
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
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminModerationPage />
                    </Suspense>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/moderation/subcommunities"
                element={
                  <AdminRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminSubCommunityModerationPage />
                    </Suspense>
                  </AdminRoute>
                }
              />
              <Route
                path="/moderation/subcommunities/:id/join-requests"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <SubCommunityJoinRequestModeration />
                  </Suspense>
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
            <ProfileProvider>
              <SubCommunityProvider>
                <PostProvider>
                  <EngagementProvider engagementService={engagementService}>
                    <Router>
                      <Layout />
                    </Router>
                  </EngagementProvider>
                </PostProvider>
              </SubCommunityProvider>
            </ProfileProvider>
          </NotificationProvider>
        </NavbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
