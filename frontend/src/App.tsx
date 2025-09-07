import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NavbarProvider } from './contexts/NavbarContext';
import { useNavbar } from './contexts/NavbarContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './route/ProtectedRoute';
import AdminRoute from './route/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Connections from './pages/Connections';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Referrals from './pages/Referrals';
import Files from './pages/Files';
import Landing from './pages/Landing';
import './App.css';
import Notification from './pages/Notification';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { EngagementProvider } from './contexts/engagementContext';
import { EngagementService } from './services/engagementService';
import { PostProvider } from './contexts/PostContext';
import { SubCommunityProvider } from './contexts/SubCommunityContext';
import { FeedPage } from './pages/Posts/FeedPage';
import { PostDetailPage } from './pages/Posts/PostDetailPage';
import { UserPostsPage } from './pages/Posts/UserPostsPage';
import { SubCommunitiesPage } from './pages/Posts/SubCommunityPage';
import { SearchResultsPage } from './pages/Posts/SearchResultsPage';
import { SubCommunityFeedPage } from './pages/Posts/SubCommunityFeedPage';
import { AdminModerationPage } from './pages/Posts/AdminModerationPage';
import EmailVerify from './pages/EmailVerify';

// Lazy load components for better performance
// const FeedPage = lazy(() => import('./pages/Posts/FeedPage'));
// const PostDetailPage = lazy(() => import('./pages/Posts/PostDetailPage'));
// const UserPostsPage = lazy(() => import('./pages/Posts/UserPostsPage'));
// const SubCommunitiesPage = lazy(() => import('./pages/Posts/SubCommunityPage'));
// const SearchResultsPage = lazy(() => import('./pages/Posts/SearchResultsPage'));
// const SubCommunityFeedPage = lazy(
//   () => import('./pages/Posts/SubCommunityFeedPage')
// );
// const AdminModerationPage = lazy(
//   () => import('./pages/Posts/AdminModerationPage')
// );

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
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<EmailVerify />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
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
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
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
        </Box>
      </Box>
    </div>
  );
};

const engagementService = new EngagementService();

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <NavbarProvider>
            <NotificationProvider>
              <ProfileProvider>
                <SubCommunityProvider>
                  <PostProvider>
                    <EngagementProvider engagementService={engagementService}>
                      <Layout />
                    </EngagementProvider>
                  </PostProvider>
                </SubCommunityProvider>
              </ProfileProvider>
            </NotificationProvider>
          </NavbarProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
