
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NavbarProvider } from './contexts/NavbarContext';
import { useNavbar } from './contexts/NavbarContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
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
          position: 'relative'
        }}
      >
        {/* Main Content */}
        <Box sx={{ 
          pr: position === 'left' ? 0 : 0, // No right padding for notifications
          transition: 'all 0.3s ease'
        }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
          </Routes>
        </Box>
      </Box>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavbarProvider>
          <Router>
            <Layout />
          </Router>
        </NavbarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
