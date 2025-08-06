"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const styles_1 = require("@mui/material/styles");
const material_1 = require("@mui/material");
const AuthContext_1 = require("./contexts/AuthContext");
const Login_1 = require("./pages/Login");
const Register_1 = require("./pages/Register");
const Dashboard_1 = require("./pages/Dashboard");
const Profile_1 = require("./pages/Profile");
const Connections_1 = require("./pages/Connections");
const Messages_1 = require("./pages/Messages");
const ProtectedRoute_1 = require("./components/ProtectedRoute");
const Navbar_1 = require("./components/Navbar");
const theme = (0, styles_1.createTheme)({
    palette: {
        mode: 'light',
        primary: {
            main: '#6366f1',
            light: '#818cf8',
            dark: '#4f46e5',
        },
        secondary: {
            main: '#ec4899',
            light: '#f472b6',
            dark: '#db2777',
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
        text: {
            primary: '#1e293b',
            secondary: '#64748b',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
        },
        h2: {
            fontWeight: 600,
            fontSize: '2rem',
        },
        h3: {
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        h4: {
            fontWeight: 500,
            fontSize: '1.25rem',
        },
        h5: {
            fontWeight: 500,
            fontSize: '1.125rem',
        },
        h6: {
            fontWeight: 500,
            fontSize: '1rem',
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                    fontWeight: 500,
                    padding: '10px 24px',
                },
                contained: {
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    '&:hover': {
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    borderRadius: 12,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
    },
});
function App() {
    return (<styles_1.ThemeProvider theme={theme}>
      <material_1.CssBaseline />
      <AuthContext_1.AuthProvider>
        <react_router_dom_1.BrowserRouter>
          <material_1.Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
            <Navbar_1.default />
            <material_1.Box sx={{ pt: 8 }}>
              <react_router_dom_1.Routes>
                <react_router_dom_1.Route path="/login" element={<Login_1.default />}/>
                <react_router_dom_1.Route path="/register" element={<Register_1.default />}/>
                <react_router_dom_1.Route path="/dashboard" element={<ProtectedRoute_1.default>
                      <Dashboard_1.default />
                    </ProtectedRoute_1.default>}/>
                <react_router_dom_1.Route path="/profile" element={<ProtectedRoute_1.default>
                      <Profile_1.default />
                    </ProtectedRoute_1.default>}/>
                <react_router_dom_1.Route path="/connections" element={<ProtectedRoute_1.default>
                      <Connections_1.default />
                    </ProtectedRoute_1.default>}/>
                <react_router_dom_1.Route path="/messages" element={<ProtectedRoute_1.default>
                      <Messages_1.default />
                    </ProtectedRoute_1.default>}/>
                <react_router_dom_1.Route path="/" element={<react_router_dom_1.Navigate to="/dashboard" replace/>}/>
              </react_router_dom_1.Routes>
            </material_1.Box>
          </material_1.Box>
        </react_router_dom_1.BrowserRouter>
      </AuthContext_1.AuthProvider>
    </styles_1.ThemeProvider>);
}
exports.default = App;
//# sourceMappingURL=App.js.map