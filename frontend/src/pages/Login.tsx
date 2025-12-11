import { FC, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '@/utils/errorHandler';

const Login: FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const backgrounds = useMemo(
    () => ({
      page: isDark
        ? 'radial-gradient(circle at 10% 20%, rgba(34,197,94,0.08), transparent 25%), radial-gradient(circle at 90% 10%, rgba(16,185,129,0.06), transparent 25%), linear-gradient(135deg, #020617 0%, #0f172a 45%, #052e16 100%)'
        : 'radial-gradient(circle at 10% 20%, rgba(22,163,74,0.12), transparent 25%), radial-gradient(circle at 90% 10%, rgba(56,189,248,0.12), transparent 25%), linear-gradient(135deg, #f8fafc 0%, #ecfdf3 50%, #e0f2fe 100%)',
      panel: isDark
        ? 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(17,24,39,0.92))'
        : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(236,248,243,0.9))',
      left: isDark
        ? 'radial-gradient(circle at 20% 20%, rgba(52,211,153,0.18), transparent 35%), radial-gradient(circle at 80% 0%, rgba(34,197,94,0.12), transparent 30%), linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))'
        : 'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.2), transparent 35%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.18), transparent 30%), linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))',
    }),
    [isDark]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setLoading(false);
  };

  return (
    <div
      className={`w-full min-h-screen overflow-x-hidden bg-gradient-to-br transition-all duration-500 ${
        isDark
          ? 'from-gray-900 via-emerald-900 to-green-900'
          : 'from-emerald-50 via-green-50 to-teal-50'
      }`}
    >
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: '20px',
          pb: 8,
          px: { xs: 2.5, md: 4 },
          width: '100%',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 1100,
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            background: backgrounds.panel,
            boxShadow:
              '0 25px 80px rgba(16,185,129,0.12), 0 10px 30px rgba(0,0,0,0.35)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
            }}
          >
            {/* Left showcase */}
            <Box
              sx={{
                position: 'relative',
                p: { xs: 3, md: 5 },
                background: backgrounds.left,
                borderRight: { md: '1px solid rgba(255,255,255,0.06)' },
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 30px rgba(16,185,129,0.35)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(16,185,129,0.08)',
                  }}
                >
                  <img
                    src="/nexus.png"
                    alt="Nexus"
                    style={{
                      width: '70%',
                      height: '70%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: isDark ? 'rgba(167,243,208,0.9)' : '#047857',
                      letterSpacing: 1.5,
                      fontWeight: 700,
                    }}
                  >
                    Nexus Platform
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: isDark ? 'white' : '#0f172a',
                      textShadow: isDark
                        ? '0 10px 30px rgba(16,185,129,0.35)'
                        : '0 6px 18px rgba(16,185,129,0.15)',
                    }}
                  >
                    Welcome back
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: isDark ? 'rgba(226,232,240,0.85)' : '#0f172a',
                      mt: 0.5,
                    }}
                  >
                    Continue building your network, faster.
                  </Typography>
                </Box>
              </motion.div>

              <Box sx={{ display: 'grid', gap: 1.5, mt: 3 }}>
                {[
                  'Secure authentication and session management',
                  'One inbox for messages, referrals, and events',
                  'Unified profile across projects and startups',
                ].map((text, idx) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 * idx }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(226,232,240,0.9)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background:
                          idx === 0
                            ? '#22c55e'
                            : idx === 1
                              ? '#38bdf8'
                              : '#a78bfa',
                        boxShadow: '0 0 0 6px rgba(255,255,255,0.03)',
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {text}
                    </Typography>
                  </motion.div>
                ))}
              </Box>

              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    border: '1px solid rgba(34,197,94,0.35)',
                    background: isDark
                      ? 'rgba(16,185,129,0.08)'
                      : 'rgba(16,185,129,0.12)',
                    color: isDark ? '#bbf7d0' : '#065f46',
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  Verified Users Only
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    border: '1px solid rgba(59,130,246,0.25)',
                    background: isDark
                      ? 'rgba(59,130,246,0.08)'
                      : 'rgba(59,130,246,0.12)',
                    color: isDark ? '#c7d2fe' : '#1e3a8a',
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  SSO Ready
                </Box>
              </Box>
            </Box>

            {/* Right form */}
            <Box
              sx={{
                p: { xs: 3, md: 4 },
                backdropFilter: 'blur(12px)',
                backgroundColor: isDark
                  ? 'transparent'
                  : 'rgba(255,255,255,0.65)',
              }}
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                </motion.div>
              )}

              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    mb: 2,
                    color: isDark ? 'white' : '#0f172a',
                  }}
                >
                  Sign in
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark
                      ? 'rgba(226,232,240,0.7)'
                      : 'rgba(15,23,42,0.7)',
                    mb: 3,
                  }}
                >
                  Access your dashboard with secure credentials.
                </Typography>

                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.4,
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      mb: 2,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      boxShadow: isDark
                        ? '0 12px 35px rgba(34,197,94,0.35)'
                        : '0 8px 24px rgba(34,197,94,0.25)',
                    }}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </motion.div>

                <Divider
                  sx={{
                    my: 3,
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(15,23,42,0.08)',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDark
                        ? 'rgba(226,232,240,0.7)'
                        : 'rgba(15,23,42,0.6)',
                    }}
                  >
                    or
                  </Typography>
                </Divider>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{ textAlign: 'center' }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: isDark ? 'rgba(226,232,240,0.8)' : '#0f172a' }}
                  >
                    Don&apos;t have an account?{' '}
                    <Link
                      component={RouterLink}
                      to="/register"
                      sx={{
                        color: '#22c55e',
                        textDecoration: 'none',
                        fontWeight: 700,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Sign up
                    </Link>
                  </Typography>
                </motion.div>
              </motion.form>
            </Box>
          </Box>
        </Paper>
      </Box>
    </div>
  );
};

export default Login;
