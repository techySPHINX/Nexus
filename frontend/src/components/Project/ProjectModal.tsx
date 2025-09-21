import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Chip,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Grid,
  Avatar,
  IconButton,
  Paper,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  CreateProjectInterface,
  ProjectInterface,
  status,
} from '@/types/ShowcaseType';
import { Add, Close } from '@mui/icons-material';

interface ProjectModalProps {
  project?: ProjectInterface;
  onClose: () => void;
  onSubmit: (data: CreateProjectInterface) => void;
  loading?: boolean;
}

// Predefined options
const PREDEFINED_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'HTML/CSS',
  'UI/UX Design',
  'GraphQL',
  'AWS',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'MongoDB',
  'Git',
];

const PREDEFINED_TAGS = [
  'Web Development',
  'Mobile App',
  'AI/ML',
  'Blockchain',
  'IoT',
  'Open Source',
  'E-commerce',
  'Education',
  'Healthcare',
  'Finance',
  'Social Good',
  'Sustainability',
];

const MotionPaper = motion(Paper);

const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CreateProjectInterface>({
    title: '',
    description: '',
    githubUrl: '',
    websiteUrl: '',
    imageUrl: '',
    videoUrl: '',
    skills: [],
    tags: [],
    status: status.IDEA,
    seeking: '',
  });
  const [seekingCollaboration, setSeekingCollaboration] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [currentSkill, setCurrentSkill] = useState('');
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (project) {
      const hasSeeking = !!project.seeking && project.seeking.length > 0;
      setFormData({
        title: project.title,
        description: project.description,
        githubUrl: project.githubUrl || '',
        websiteUrl: project.websiteUrl || '',
        imageUrl: project.imageUrl || '',
        videoUrl: project.videoUrl || '',
        skills: project.skills,
        tags: project.tags,
        status: project.status,
        seeking: project.seeking || '',
      });
      setSeekingCollaboration(hasSeeking);
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clean up the data before submitting - remove empty strings
    const cleanedData: CreateProjectInterface = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      skills: formData.skills,
      tags: formData.tags,
      // Only include URLs if they have values
      ...(formData.githubUrl && { githubUrl: formData.githubUrl }),
      ...(formData.websiteUrl && { websiteUrl: formData.websiteUrl }),
      ...(formData.imageUrl && { imageUrl: formData.imageUrl }),
      ...(formData.videoUrl && { videoUrl: formData.videoUrl }),
      // Only include seeking if collaboration is sought and there's content
      ...(seekingCollaboration &&
        formData.seeking && { seeking: formData.seeking }),
    };

    onSubmit(cleanedData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (
    e: React.ChangeEvent<{ name: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()],
      }));
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handlePredefinedTagSelect = (
    event: React.SyntheticEvent,
    value: string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      tags: value,
    }));
  };

  const handlePredefinedSkillSelect = (
    event: React.SyntheticEvent,
    value: string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      skills: value,
    }));
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperComponent={MotionPaper as React.JSXElementConstructor<unknown>}
      PaperProps={{
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3 },
        sx: {
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          maxWidth: 800,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
          border: '1px solid #4caf50',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: 28,
          mb: 2,
          px: 0,
          background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
          color: 'white',
          borderRadius: 2,
          p: 3,
          mx: -3,
          mt: -3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {project ? 'Edit Project' : 'Create New Project'}
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ maxHeight: '70vh', overflowY: 'auto', px: 0, mt: 2 }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Project Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                fullWidth
                variant="outlined"
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#4caf50',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Project Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                fullWidth
                multiline
                minRows={4}
                variant="outlined"
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#4caf50',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="GitHub URL (optional)"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#4caf50',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Website URL (optional)"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#4caf50',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Image URL (optional)"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#4caf50',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Video URL (optional)"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#4caf50',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: '#4caf50',
                    },
                  },
                }}
              >
                <InputLabel>Project Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  label="Project Status"
                >
                  <MenuItem value={status.IDEA}>Idea</MenuItem>
                  <MenuItem value={status.IN_PROGRESS}>In Progress</MenuItem>
                  <MenuItem value={status.COMPLETED}>Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={seekingCollaboration}
                    onChange={(e) => setSeekingCollaboration(e.target.checked)}
                    sx={{
                      color: '#4caf50',
                      '&.Mui-checked': {
                        color: '#2e7d32',
                      },
                    }}
                  />
                }
                label="Looking for collaboration?"
              />
              {seekingCollaboration && (
                <TextField
                  label="Describe what skills or help you're looking for"
                  name="seeking"
                  value={formData.seeking}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  minRows={2}
                  variant="outlined"
                  size="medium"
                  sx={{
                    mt: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&.Mui-focused fieldset': {
                        borderColor: '#4caf50',
                      },
                    },
                  }}
                />
              )}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#2e7d32',
                    mb: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      mr: 1,
                      bgcolor: 'primary.main',
                      backgroundColor: '#4caf50',
                    }}
                  >
                    <Add sx={{ fontSize: 16 }} />
                  </Avatar>
                  Tags
                </Typography>

                <Autocomplete
                  multiple
                  options={PREDEFINED_TAGS}
                  value={formData.tags}
                  onChange={handlePredefinedTagSelect}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Select or create tags"
                      placeholder="Type to add a tag"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&.Mui-focused fieldset': {
                            borderColor: '#4caf50',
                          },
                        },
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option}
                        label={option}
                        color="primary"
                        variant="outlined"
                        onDelete={() => handleRemoveTag(option)}
                        sx={{
                          mb: 1,
                          mr: 1,
                          borderColor: '#4caf50',
                          color: '#2e7d32',
                          '& .MuiChip-deleteIcon': {
                            color: '#4caf50',
                          },
                        }}
                      />
                    ))
                  }
                  sx={{ mb: 2 }}
                />

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <TextField
                    label="Add custom tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="contained"
                    disabled={!currentTag.trim()}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: '#4caf50',
                      '&:hover': {
                        backgroundColor: '#2e7d32',
                      },
                    }}
                  >
                    Add
                  </Button>
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#2e7d32',
                    mb: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      mr: 1,
                      bgcolor: 'secondary.main',
                      backgroundColor: '#81c784',
                    }}
                  >
                    <Add sx={{ fontSize: 16 }} />
                  </Avatar>
                  Skills Required
                </Typography>

                <Autocomplete
                  multiple
                  options={PREDEFINED_SKILLS}
                  value={formData.skills}
                  onChange={handlePredefinedSkillSelect}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Select or add skills"
                      placeholder="Type to add a skill"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&.Mui-focused fieldset': {
                            borderColor: '#4caf50',
                          },
                        },
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option}
                        label={option}
                        onDelete={() => handleRemoveSkill(option)}
                        sx={{
                          mb: 1,
                          mr: 1,
                          backgroundColor: '#e8f5e9',
                          color: '#2e7d32',
                          '& .MuiChip-deleteIcon': {
                            color: '#4caf50',
                          },
                        }}
                      />
                    ))
                  }
                  sx={{ mb: 2 }}
                />

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <TextField
                    label="Add custom skill"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <Button
                    onClick={handleAddSkill}
                    variant="contained"
                    disabled={!currentSkill.trim()}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: '#81c784',
                      '&:hover': {
                        backgroundColor: '#4caf50',
                      },
                    }}
                  >
                    Add
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="large"
          sx={{
            borderRadius: 2,
            px: 4,
            borderColor: '#4caf50',
            color: '#2e7d32',
            '&:hover': {
              borderColor: '#2e7d32',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 4,
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
            },
            '&.Mui-disabled': {
              background: 'rgba(76, 175, 80, 0.5)',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : project ? (
            'Update Project'
          ) : (
            'Create Project'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectModal;
