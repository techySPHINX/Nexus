import { Paper, Box, Typography } from "@mui/material";

// components/StatsCard.tsx
interface StatsCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

export const StatsCard = ({ icon, value, label }: StatsCardProps) => (
  <Paper sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1, borderRadius: 2 }}>
    {icon}
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  </Paper>
);