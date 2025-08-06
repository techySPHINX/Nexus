"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = exports.useAuth = void 0;
const react_1 = require("react");
const axios_1 = require("axios");
const AuthContext = (0, react_1.createContext)(undefined);
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
const AuthProvider = ({ children }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [token, setToken] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    axios_1.default.defaults.baseURL = 'http://localhost:3000';
    (0, react_1.useEffect)(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                axios_1.default.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
            catch (error) {
                console.error('Error parsing stored user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);
    const login = async (email, password) => {
        try {
            const response = await axios_1.default.post('/auth/login', {
                email,
                password,
            });
            const { accessToken, user } = response.data;
            setToken(accessToken);
            setUser(user);
            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(user));
            axios_1.default.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
        catch (error) {
            console.error('Login error:', error);
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Login failed. Please try again.');
        }
    };
    const register = async (email, password, name, role) => {
        try {
            const response = await axios_1.default.post('/auth/register', {
                email,
                password,
                name,
                role,
            });
            const { accessToken, user } = response.data;
            setToken(accessToken);
            setUser(user);
            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(user));
            axios_1.default.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
        catch (error) {
            console.error('Register error:', error);
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Registration failed. Please try again.');
        }
    };
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios_1.default.defaults.headers.common['Authorization'];
    };
    const value = {
        user,
        token,
        login,
        register,
        logout,
        loading,
    };
    return (<AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>);
};
exports.AuthProvider = AuthProvider;
//# sourceMappingURL=AuthContext.js.map