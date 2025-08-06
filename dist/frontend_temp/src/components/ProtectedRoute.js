"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("../contexts/AuthContext");
const material_1 = require("@mui/material");
const ProtectedRoute = ({ children }) => {
    const { user, loading } = (0, AuthContext_1.useAuth)();
    if (loading) {
        return (<material_1.Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <material_1.CircularProgress />
      </material_1.Box>);
    }
    if (!user) {
        return <react_router_dom_1.Navigate to="/login" replace/>;
    }
    return <>{children}</>;
};
exports.default = ProtectedRoute;
//# sourceMappingURL=ProtectedRoute.js.map