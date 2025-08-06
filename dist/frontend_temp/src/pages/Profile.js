"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const material_1 = require("@mui/material");
const framer_motion_1 = require("framer-motion");
const Profile = () => {
    return (<material_1.Container maxWidth="lg" sx={{ py: 4 }}>
      <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <material_1.Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Profile
        </material_1.Typography>
        <material_1.Typography variant="h6" color="text.secondary">
          Manage your profile information
        </material_1.Typography>
        <material_1.Box sx={{ mt: 4 }}>
          <material_1.Typography variant="body1">
            Profile page coming soon...
          </material_1.Typography>
        </material_1.Box>
      </framer_motion_1.motion.div>
    </material_1.Container>);
};
exports.default = Profile;
//# sourceMappingURL=Profile.js.map