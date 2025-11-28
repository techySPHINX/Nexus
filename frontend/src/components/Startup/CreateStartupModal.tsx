// CreateStartupModal.tsx
import { FC, useState, FormEvent } from 'react';
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
import { StartupStatus } from '@/types/profileType';

interface CreateStartupPayload {
  name: string;
  description: string;
  websiteUrl?: string;
  imageUrl?: string;
  status?: StartupStatus;
  fundingGoal?: number;
  fundingRaised?: number;
  monetizationModel?: string[];
}

interface CreateStartupModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStartupPayload) => Promise<void>;
  loading?: boolean;
}

const CreateStartupModal: FC<CreateStartupModalProps> = ({
  open,
  onClose,
  onSubmit,
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
    monetizationModel: '', // comma-separated editor, we'll convert on submit
  });

  const handleSubmit = async (e: FormEvent) => {
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
    setFormData({
      name: '',
      description: '',
      websiteUrl: '',
      imageUrl: '',
      status: StartupStatus.IDEA,
      fundingGoal: '',
      fundingRaised: '',
      monetizationModel: '',
    });
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      websiteUrl: '',
      imageUrl: '',
      status: StartupStatus.IDEA,
      fundingGoal: '',
      fundingRaised: '',
      monetizationModel: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Typography variant="h5" fontWeight="600">
            Create New Startup
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
              minRows={3}
              maxRows={20}
              inputProps={{ style: { resize: 'vertical' } }}
              fullWidth
            />

            <TextField
              label="Website URL"
              value={formData.websiteUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))
              }
              required
              type="url"
              fullWidth
            />

            <TextField
              label="Image URL"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              required
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

            {/* Native details/summary provides an expandable section without extra imports */}
            <details
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  listStyle: 'none',
                  outline: 'none',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Advanced (optional)
              </summary>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            </details>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name || !formData.description}
            startIcon={loading && <CircularProgress size={16} />}
          >
            {loading ? 'Creating...' : 'Create Startup'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateStartupModal;
