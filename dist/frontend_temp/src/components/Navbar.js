"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("../contexts/AuthContext");
const framer_motion_1 = require("framer-motion");
const Navbar = () => {
    const { user, logout } = (0, AuthContext_1.useAuth)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const location = (0, react_router_dom_1.useLocation)();
    const theme = (0, material_1.useTheme)();
    const [anchorEl, setAnchorEl] = (0, react_1.useState)(null);
    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleLogout = () => {
        logout();
        navigate('/login');
        handleClose();
    };
    const getRoleIcon = (role) => {
        switch (role) {
            case 'STUDENT':
                return <icons_material_1.School fontSize="small"/>;
            case 'ALUM':
                return <icons_material_1.Work fontSize="small"/>;
            case 'ADMIN':
                return <icons_material_1.AccountCircle fontSize="small"/>;
            default:
                return <icons_material_1.Person fontSize="small"/>;
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
    if (!user) {
        return (<material_1.AppBar position="fixed" elevation={0} sx={{ backgroundColor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <material_1.Toolbar>
          <framer_motion_1.motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <material_1.Typography variant="h6" component="div" sx={{
                flexGrow: 1,
                color: 'primary.main',
                fontWeight: 700,
                cursor: 'pointer',
            }} onClick={() => navigate('/')}>
              Nexus
            </material_1.Typography>
          </framer_motion_1.motion.div>
          <material_1.Box sx={{ flexGrow: 1 }}/>
          <framer_motion_1.motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <material_1.Button color="inherit" sx={{ color: 'text.primary', mr: 2 }} onClick={() => navigate('/login')}>
              Login
            </material_1.Button>
            <material_1.Button variant="contained" sx={{ borderRadius: 2 }} onClick={() => navigate('/register')}>
              Register
            </material_1.Button>
          </framer_motion_1.motion.div>
        </material_1.Toolbar>
      </material_1.AppBar>);
    }
    return (<material_1.AppBar position="fixed" elevation={0} sx={{ backgroundColor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
      <material_1.Toolbar>
        <framer_motion_1.motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <material_1.Typography variant="h6" component="div" sx={{
            flexGrow: 1,
            color: 'primary.main',
            fontWeight: 700,
            cursor: 'pointer',
        }} onClick={() => navigate('/dashboard')}>
            Nexus
          </material_1.Typography>
        </framer_motion_1.motion.div>
        
        <material_1.Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <material_1.Button startIcon={<icons_material_1.Dashboard />} sx={{
            color: location.pathname === '/dashboard' ? 'primary.main' : 'text.secondary',
            '&:hover': { backgroundColor: 'primary.50' },
        }} onClick={() => navigate('/dashboard')}>
              Dashboard
            </material_1.Button>
          </framer_motion_1.motion.div>
          
          <framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <material_1.Button startIcon={<icons_material_1.People />} sx={{
            color: location.pathname === '/connections' ? 'primary.main' : 'text.secondary',
            '&:hover': { backgroundColor: 'primary.50' },
        }} onClick={() => navigate('/connections')}>
              Connections
            </material_1.Button>
          </framer_motion_1.motion.div>
          
          <framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <material_1.Button startIcon={<icons_material_1.Message />} sx={{
            color: location.pathname === '/messages' ? 'primary.main' : 'text.secondary',
            '&:hover': { backgroundColor: 'primary.50' },
        }} onClick={() => navigate('/messages')}>
              Messages
            </material_1.Button>
          </framer_motion_1.motion.div>
          
          <framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <material_1.Button startIcon={<icons_material_1.Person />} sx={{
            color: location.pathname === '/profile' ? 'primary.main' : 'text.secondary',
            '&:hover': { backgroundColor: 'primary.50' },
        }} onClick={() => navigate('/profile')}>
              Profile
            </material_1.Button>
          </framer_motion_1.motion.div>
        </material_1.Box>

        <framer_motion_1.motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
          <material_1.Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <material_1.Chip icon={getRoleIcon(user.role)} label={user.role} color={getRoleColor(user.role)} size="small" variant="outlined"/>
            <material_1.IconButton size="large" aria-label="account of current user" aria-controls="menu-appbar" aria-haspopup="true" onClick={handleMenu} sx={{ color: 'text.primary' }}>
              <material_1.Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user.email.charAt(0).toUpperCase()}
              </material_1.Avatar>
            </material_1.IconButton>
            <material_1.Menu id="menu-appbar" anchorEl={anchorEl} anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }} keepMounted transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }} open={Boolean(anchorEl)} onClose={handleClose}>
              <material_1.MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                <icons_material_1.Person sx={{ mr: 1 }}/>
                Profile
              </material_1.MenuItem>
              <material_1.MenuItem onClick={handleLogout}>
                <icons_material_1.Logout sx={{ mr: 1 }}/>
                Logout
              </material_1.MenuItem>
            </material_1.Menu>
          </material_1.Box>
        </framer_motion_1.motion.div>
      </material_1.Toolbar>
    </material_1.AppBar>);
};
exports.default = Navbar;
//# sourceMappingURL=Navbar.js.map