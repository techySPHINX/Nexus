// EditStartupModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { StartupSummary } from '@/types/StartupType';
import { StartupStatus } from '@/types/profileType';

interface EditStartupPayload {
  name?: string;
  description?: string;
  websiteUrl?: string;
  imageUrl?: string;
  status?: StartupStatus;
  fundingGoal?: number;
  fundingRaised?: number;
  monetizationModel?: string[];
}

interface EditStartupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EditStartupPayload) => Promise<void>;
  startup: StartupSummary;
  loading?: boolean;
}

const EditStartupModal: React.FC<EditStartupModalProps> = ({
  open,
  onClose,
  onSubmit,
  startup,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    websiteUrl: '',
    imageUrl: '',
    status: StartupStatus.IDEA,
    fundingGoal: '',
    fundingRaised: '',
    monetizationModel: '', // comma-separated editor
  });

  useEffect(() => {
    if (startup) {
      setFormData({
        name: startup.name || '',
        description: '', //startup.description || '',
        websiteUrl: startup.websiteUrl || '',
        imageUrl: startup.imageUrl || '',
        status: startup.status || StartupStatus.IDEA,
        fundingGoal: startup.fundingGoal?.toString() || '',
        fundingRaised: startup.fundingRaised?.toString() || '',
        monetizationModel: Array.isArray(startup.monetizationModel)
          ? startup.monetizationModel.join(', ')
          : String(startup.monetizationModel || ''),
      });
    }
  }, [startup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      fundingGoal: formData.fundingGoal
        ? Number(formData.fundingGoal)
        : undefined,
      fundingRaised: formData.fundingRaised
        ? Number(formData.fundingRaised)
        : undefined,
      monetizationModel: formData.monetizationModel
        ? formData.monetizationModel
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Typography variant="h5" fontWeight="600">
            Edit Startup
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Startup Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              fullWidth
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              required
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Website URL"
              value={formData.websiteUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))
              }
              type="url"
              fullWidth
            />

            <TextField
              label="Image URL"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              type="url"
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as StartupStatus,
                  }))
                }
              >
                <MenuItem value={StartupStatus.IDEA}>💡 Idea</MenuItem>
                <MenuItem value={StartupStatus.PROTOTYPING}>
                  🔨 Prototyping
                </MenuItem>
                <MenuItem value={StartupStatus.BETA}>🚀 Beta</MenuItem>
                <MenuItem value={StartupStatus.LAUNCHED}>🎯 Launched</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Funding Goal ($)"
              value={formData.fundingGoal}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  fundingGoal: e.target.value,
                }))
              }
              type="number"
              fullWidth
            />

            <TextField
              label="Funding Raised ($)"
              value={formData.fundingRaised}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  fundingRaised: e.target.value,
                }))
              }
              type="number"
              fullWidth
            />

            <TextField
              label="Monetization Model"
              value={formData.monetizationModel}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  monetizationModel: e.target.value,
                }))
              }
              fullWidth
              placeholder="e.g., SaaS, Marketplace, Advertising, etc."
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name || !formData.description}
            startIcon={loading && <CircularProgress size={16} />}
          >
            {loading ? 'Updating...' : 'Update Startup'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditStartupModal;
