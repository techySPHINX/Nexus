"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const material_1 = require("@mui/material");
const icons_material_1 = require("@mui/icons-material");
const AuthContext_1 = require("../contexts/AuthContext");
const framer_motion_1 = require("framer-motion");
const Dashboard = () => {
    const { user } = (0, AuthContext_1.useAuth)();
    const [stats, setStats] = (0, react_1.useState)({
        connections: 0,
        messages: 0,
        pendingRequests: 0,
        profileCompletion: 0,
    });
    const getRoleIcon = (role) => {
        switch (role) {
            case 'STUDENT':
                return <icons_material_1.School />;
            case 'ALUM':
                return <icons_material_1.Work />;
            case 'ADMIN':
                return <icons_material_1.AdminPanelSettings />;
            default:
                return <icons_material_1.School />;
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
    const recentActivities = [
        {
            id: 1,
            type: 'connection',
            message: 'John Doe accepted your connection request',
            time: '2 hours ago',
            avatar: 'J',
        },
        {
            id: 2,
            type: 'message',
            message: 'New message from Jane Smith',
            time: '4 hours ago',
            avatar: 'J',
        },
        {
            id: 3,
            type: 'profile',
            message: 'Profile updated successfully',
            time: '1 day ago',
            avatar: 'P',
        },
    ];
    const quickActions = [
        {
            title: 'Send Connection Request',
            description: 'Connect with other students and alumni',
            icon: <icons_material_1.People />,
            color: 'primary',
        },
        {
            title: 'Send Message',
            description: 'Start a conversation with your connections',
            icon: <icons_material_1.Message />,
            color: 'secondary',
        },
        {
            title: 'Update Profile',
            description: 'Keep your profile information current',
            icon: <icons_material_1.Add />,
            color: 'success',
        },
    ];
    return (<material_1.Container maxWidth="lg" sx={{ py: 4 }}>
      <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        
        <material_1.Box sx={{ mb: 4 }}>
          <material_1.Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Welcome back, {user?.email.split('@')[0]}!
          </material_1.Typography>
          <material_1.Typography variant="h6" color="text.secondary">
            Here's what's happening in your Nexus network
          </material_1.Typography>
        </material_1.Box>

        
        <material_1.Grid container spacing={3} sx={{ mb: 4 }}>
          <material_1.Grid item xs={12} sm={6} md={3}>
            <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <material_1.Card sx={{ height: '100%' }}>
                <material_1.CardContent>
                  <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <material_1.Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <icons_material_1.People />
                    </material_1.Avatar>
                    <material_1.Box>
                      <material_1.Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {stats.connections}
                      </material_1.Typography>
                      <material_1.Typography color="text.secondary">Connections</material_1.Typography>
                    </material_1.Box>
                  </material_1.Box>
                  <material_1.LinearProgress variant="determinate" value={70} sx={{ height: 6, borderRadius: 3 }}/>
                </material_1.CardContent>
              </material_1.Card>
            </framer_motion_1.motion.div>
          </material_1.Grid>

          <material_1.Grid item xs={12} sm={6} md={3}>
            <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <material_1.Card sx={{ height: '100%' }}>
                <material_1.CardContent>
                  <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <material_1.Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <icons_material_1.Message />
                    </material_1.Avatar>
                    <material_1.Box>
                      <material_1.Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {stats.messages}
                      </material_1.Typography>
                      <material_1.Typography color="text.secondary">Messages</material_1.Typography>
                    </material_1.Box>
                  </material_1.Box>
                  <material_1.LinearProgress variant="determinate" value={45} sx={{ height: 6, borderRadius: 3, bgcolor: 'secondary.light' }} color="secondary"/>
                </material_1.CardContent>
              </material_1.Card>
            </framer_motion_1.motion.div>
          </material_1.Grid>

          <material_1.Grid item xs={12} sm={6} md={3}>
            <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <material_1.Card sx={{ height: '100%' }}>
                <material_1.CardContent>
                  <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <material_1.Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <icons_material_1.Notifications />
                    </material_1.Avatar>
                    <material_1.Box>
                      <material_1.Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {stats.pendingRequests}
                      </material_1.Typography>
                      <material_1.Typography color="text.secondary">Pending Requests</material_1.Typography>
                    </material_1.Box>
                  </material_1.Box>
                  <material_1.LinearProgress variant="determinate" value={30} sx={{ height: 6, borderRadius: 3, bgcolor: 'warning.light' }} color="warning"/>
                </material_1.CardContent>
              </material_1.Card>
            </framer_motion_1.motion.div>
          </material_1.Grid>

          <material_1.Grid item xs={12} sm={6} md={3}>
            <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <material_1.Card sx={{ height: '100%' }}>
                <material_1.CardContent>
                  <material_1.Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <material_1.Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <icons_material_1.TrendingUp />
                    </material_1.Avatar>
                    <material_1.Box>
                      <material_1.Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {stats.profileCompletion}%
                      </material_1.Typography>
                      <material_1.Typography color="text.secondary">Profile Complete</material_1.Typography>
                    </material_1.Box>
                  </material_1.Box>
                  <material_1.LinearProgress variant="determinate" value={stats.profileCompletion} sx={{ height: 6, borderRadius: 3, bgcolor: 'success.light' }} color="success"/>
                </material_1.CardContent>
              </material_1.Card>
            </framer_motion_1.motion.div>
          </material_1.Grid>
        </material_1.Grid>

        
        <material_1.Grid container spacing={3}>
          
          <material_1.Grid item xs={12} md={4}>
            <framer_motion_1.motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
              <material_1.Card>
                <material_1.CardContent>
                  <material_1.Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Quick Actions
                  </material_1.Typography>
                  <material_1.Box sx={{ mt: 2 }}>
                    {quickActions.map((action, index) => (<framer_motion_1.motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <material_1.Button fullWidth variant="outlined" startIcon={action.icon} sx={{
                mb: 2,
                justifyContent: 'flex-start',
                textAlign: 'left',
                py: 1.5,
                borderColor: `${action.color}.main`,
                color: `${action.color}.main`,
                '&:hover': {
                    borderColor: `${action.color}.dark`,
                    backgroundColor: `${action.color}.50`,
                },
            }}>
                          <material_1.Box sx={{ textAlign: 'left' }}>
                            <material_1.Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {action.title}
                            </material_1.Typography>
                            <material_1.Typography variant="caption" color="text.secondary">
                              {action.description}
                            </material_1.Typography>
                          </material_1.Box>
                        </material_1.Button>
                      </framer_motion_1.motion.div>))}
                  </material_1.Box>
                </material_1.CardContent>
              </material_1.Card>
            </framer_motion_1.motion.div>
          </material_1.Grid>

          
          <material_1.Grid item xs={12} md={8}>
            <framer_motion_1.motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
              <material_1.Card>
                <material_1.CardContent>
                  <material_1.Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Recent Activity
                  </material_1.Typography>
                  <material_1.List>
                    {recentActivities.map((activity, index) => (<react_1.default.Fragment key={activity.id}>
                        <material_1.ListItem alignItems="flex-start">
                          <material_1.ListItemAvatar>
                            <material_1.Avatar sx={{ bgcolor: 'primary.main' }}>
                              {activity.avatar}
                            </material_1.Avatar>
                          </material_1.ListItemAvatar>
                          <material_1.ListItemText primary={activity.message} secondary={<material_1.Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <icons_material_1.CalendarToday sx={{ fontSize: 14, mr: 0.5 }}/>
                                {activity.time}
                              </material_1.Box>}/>
                        </material_1.ListItem>
                        {index < recentActivities.length - 1 && <material_1.Divider variant="inset" component="li"/>}
                      </react_1.default.Fragment>))}
                  </material_1.List>
                </material_1.CardContent>
              </material_1.Card>
            </framer_motion_1.motion.div>
          </material_1.Grid>
        </material_1.Grid>
      </framer_motion_1.motion.div>
    </material_1.Container>);
};
exports.default = Dashboard;
//# sourceMappingURL=Dashboard.js.map