import { FC, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Avatar,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Close,
  //   CloudUpload,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { SubCommunity } from '../../types/subCommunity';

interface SubCommunityEditBoxProps {
  community: SubCommunity;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SubCommunityEditBox: FC<SubCommunityEditBoxProps> = ({
  community,
  open,
  onClose,
  onSave,
}) => {
  const { updateSubCommunity, loading } = useSubCommunity();
  type FormDataType = {
    name: string;
    description: string;
    isPrivate: boolean;
    iconUrl: string;
    bannerUrl: string;
  };

  const [formData, setFormData] = useState<FormDataType>({
    name: community.name,
    description: community.description,
    isPrivate: community.isPrivate,
    iconUrl: community.iconUrl || '',
    bannerUrl: community.bannerUrl || '',
  });
  // const [iconFile, setIconFile] = useState<File | null>(null);
  // const [bannerFile, setBannerFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: FormDataType) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // File upload handlers (commented out for now)
  /*
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, iconUrl: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, bannerUrl: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateSubCommunity(community.id, formData);

      // TODO: Handle file uploads if needed (when implementing actual file upload)
      /*
      if (iconFile) {
        await uploadIcon(community.id, iconFile);
      }
      if (bannerFile) {
        await uploadBanner(community.id, bannerFile);
      }
      */

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update community:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: community.name,
      description: community.description,
      isPrivate: community.isPrivate,
      iconUrl: community.iconUrl || '',
      bannerUrl: community.bannerUrl || '',
    });
    // setIconFile(null);
    // setBannerFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Edit Community</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {/* Banner URL Input */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Banner Image URL
            </Typography>
            <TextField
              fullWidth
              label="Banner URL"
              name="bannerUrl"
              value={formData.bannerUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/banner.jpg"
              InputProps={{
                startAdornment: (
                  <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
              helperText="Enter a URL for your community banner image"
            />
            {formData.bannerUrl && (
              <Box
                sx={{
                  mt: 2,
                  height: 100,
                  backgroundImage: `url(${formData.bannerUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  border: '1px solid #ccc',
                }}
              />
            )}
          </Box>

          {/* Icon URL Input */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Community Icon URL
              </Typography>
              <Avatar
                src={formData.iconUrl || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  border: '2px solid #ccc',
                }}
              >
                <LinkIcon />
              </Avatar>
            </Box>

            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Icon URL"
                name="iconUrl"
                value={formData.iconUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/icon.png"
                InputProps={{
                  startAdornment: (
                    <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
                helperText="Enter a URL for your community icon"
              />
            </Box>
          </Box>

          {/* File Upload Components (commented out) */}
          {/*
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Upload Banner Image
            </Typography>
            <Box
              sx={{
                height: 120,
                backgroundImage: formData.bannerUrl ? `url(${formData.bannerUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 2,
                border: '2px dashed #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                '&:hover': {
                  borderColor: 'primary.main',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: 2,
                  },
                },
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <CloudUpload sx={{ fontSize: 40, color: 'text.secondary' }} />
            </Box>
          </Box>

          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Upload Community Icon
              </Typography>
              <Avatar
                src={formData.iconUrl || undefined}
                sx={{
                  width: 80,
                  height: 80,
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: '50%',
                  },
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
                {!formData.iconUrl && <CloudUpload />}
              </Avatar>
            </Box>
          </Box>
          */}

          {/* Community Name */}
          <TextField
            fullWidth
            label="Community Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            margin="normal"
            helperText="This will be displayed as r/communityname"
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            margin="normal"
            helperText="Describe what your community is about"
          />

          {/* Privacy Setting */}
          <FormControlLabel
            control={
              <Switch
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2">Private Community</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formData.isPrivate
                    ? 'Users must request to join and be approved'
                    : 'Anyone can view and join this community'}
                </Typography>
              </Box>
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <Edit />}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
