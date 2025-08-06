"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("../contexts/AuthContext");
const framer_motion_1 = require("framer-motion");
const Register = () => {
    const [formData, setFormData] = (0, react_1.useState)({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'STUDENT',
    });
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [showConfirmPassword, setShowConfirmPassword] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const { register } = (0, AuthContext_1.useAuth)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const handleChange = (field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value,
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        if (!formData.email.endsWith('@kiit.ac.in')) {
            setError('Email must be from kiit.ac.in domain');
            return;
        }
        setLoading(true);
        try {
            await register(formData.email, formData.password, formData.name, formData.role);
            navigate('/dashboard');
        }
        catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const getRoleIcon = (role) => {
        switch (role) {
            case 'STUDENT':
                return <icons_material_1.School />;
            case 'ALUM':
                return <icons_material_1.Work />;
            case 'ADMIN':
                return <icons_material_1.AdminPanelSettings />;
            default:
                return <icons_material_1.Person />;
        }
    };
    const getRoleColor = (role) => {
        switch (role) {
            case 'STUDENT':
                return 'primary';
            case 'ALUM':
                return 'secondary';
            case 'ADMIN':
                return 'error';
            default:
                return 'default';
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
                  Join Nexus
                </material_1.Typography>
                <material_1.Typography variant="body1" color="text.secondary">
                  Create your account to get started
                </material_1.Typography>
              </framer_motion_1.motion.div>
            </material_1.Box>

            {error && (<framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <material_1.Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </material_1.Alert>
              </framer_motion_1.motion.div>)}

            <framer_motion_1.motion.form onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <material_1.TextField fullWidth label="Full Name" value={formData.name} onChange={handleChange('name')} required margin="normal" InputProps={{
            startAdornment: (<material_1.InputAdornment position="start">
                      <icons_material_1.Person color="action"/>
                    </material_1.InputAdornment>),
        }} sx={{ mb: 2 }}/>

              <material_1.TextField fullWidth label="Email" type="email" value={formData.email} onChange={handleChange('email')} required margin="normal" helperText="Must be from kiit.ac.in domain" InputProps={{
            startAdornment: (<material_1.InputAdornment position="start">
                      <icons_material_1.Email color="action"/>
                    </material_1.InputAdornment>),
        }} sx={{ mb: 2 }}/>

              <material_1.FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                <material_1.InputLabel>Role</material_1.InputLabel>
                <material_1.Select value={formData.role} label="Role" onChange={handleChange('role')} startAdornment={<material_1.InputAdornment position="start">
                      {getRoleIcon(formData.role)}
                    </material_1.InputAdornment>}>
                  <material_1.MenuItem value="STUDENT">
                    <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <icons_material_1.School />
                      Student
                    </material_1.Box>
                  </material_1.MenuItem>
                  <material_1.MenuItem value="ALUM">
                    <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <icons_material_1.Work />
                      Alumni
                    </material_1.Box>
                  </material_1.MenuItem>
                  <material_1.MenuItem value="ADMIN">
                    <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <icons_material_1.AdminPanelSettings />
                      Admin
                    </material_1.Box>
                  </material_1.MenuItem>
                </material_1.Select>
              </material_1.FormControl>

              <material_1.TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange('password')} required margin="normal" helperText="Minimum 6 characters" InputProps={{
            startAdornment: (<material_1.InputAdornment position="start">
                      <icons_material_1.Lock color="action"/>
                    </material_1.InputAdornment>),
            endAdornment: (<material_1.InputAdornment position="end">
                      <material_1.IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <icons_material_1.VisibilityOff /> : <icons_material_1.Visibility />}
                      </material_1.IconButton>
                    </material_1.InputAdornment>),
        }} sx={{ mb: 2 }}/>

              <material_1.TextField fullWidth label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange('confirmPassword')} required margin="normal" InputProps={{
            startAdornment: (<material_1.InputAdornment position="start">
                      <icons_material_1.Lock color="action"/>
                    </material_1.InputAdornment>),
            endAdornment: (<material_1.InputAdornment position="end">
                      <material_1.IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <icons_material_1.VisibilityOff /> : <icons_material_1.Visibility />}
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
                  {loading ? 'Creating Account...' : 'Create Account'}
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
                Already have an account?{' '}
                <material_1.Link component={react_router_dom_1.Link} to="/login" sx={{
            color: 'primary.main',
            textDecoration: 'none',
            fontWeight: 600,
            '&:hover': {
                textDecoration: 'underline',
            },
        }}>
                  Sign in
                </material_1.Link>
              </material_1.Typography>
            </framer_motion_1.motion.div>
          </material_1.Paper>
        </framer_motion_1.motion.div>
      </material_1.Box>
    </material_1.Container>);
};
exports.default = Register;
//# sourceMappingURL=Register.js.map