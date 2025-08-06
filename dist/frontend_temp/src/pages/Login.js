"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("../contexts/AuthContext");
const framer_motion_1 = require("framer-motion");
const Login = () => {
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const { login } = (0, AuthContext_1.useAuth)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<material_1.Container maxWidth="sm">
      <material_1.Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
        }}>
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%' }}>
          <material_1.Paper elevation={0} sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
        }}>
            <material_1.Box sx={{ textAlign: 'center', mb: 4 }}>
              <framer_motion_1.motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <material_1.Box sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
        }}>
                  <icons_material_1.School sx={{ color: 'white', fontSize: 30 }}/>
                </material_1.Box>
              </framer_motion_1.motion.div>
              
              <framer_motion_1.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <material_1.Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                  Welcome Back
                </material_1.Typography>
                <material_1.Typography variant="body1" color="text.secondary">
                  Sign in to your Nexus account
                </material_1.Typography>
              </framer_motion_1.motion.div>
            </material_1.Box>

            {error && (<framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <material_1.Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </material_1.Alert>
              </framer_motion_1.motion.div>)}

            <framer_motion_1.motion.form onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <material_1.TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required margin="normal" InputProps={{
            startAdornment: (<material_1.InputAdornment position="start">
                      <icons_material_1.Email color="action"/>
                    </material_1.InputAdornment>),
        }} sx={{ mb: 2 }}/>

              <material_1.TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required margin="normal" InputProps={{
            startAdornment: (<material_1.InputAdornment position="start">
                      <icons_material_1.Lock color="action"/>
                    </material_1.InputAdornment>),
            endAdornment: (<material_1.InputAdornment position="end">
                      <material_1.IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <icons_material_1.VisibilityOff /> : <icons_material_1.Visibility />}
                      </material_1.IconButton>
                    </material_1.InputAdornment>),
        }} sx={{ mb: 3 }}/>

              <framer_motion_1.motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <material_1.Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            mb: 3,
        }}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </material_1.Button>
              </framer_motion_1.motion.div>
            </framer_motion_1.motion.form>

            <material_1.Divider sx={{ my: 3 }}>
              <material_1.Typography variant="body2" color="text.secondary">
                or
              </material_1.Typography>
            </material_1.Divider>

            <framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }} style={{ textAlign: 'center' }}>
              <material_1.Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <material_1.Link component={react_router_dom_1.Link} to="/register" sx={{
            color: 'primary.main',
            textDecoration: 'none',
            fontWeight: 600,
            '&:hover': {
                textDecoration: 'underline',
            },
        }}>
                  Sign up
                </material_1.Link>
              </material_1.Typography>
            </framer_motion_1.motion.div>
          </material_1.Paper>
        </framer_motion_1.motion.div>
      </material_1.Box>
    </material_1.Container>);
};
exports.default = Login;
//# sourceMappingURL=Login.js.map