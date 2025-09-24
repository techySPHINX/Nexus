/* eslint-disable @typescript-eslint/no-explicit-any */
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  CircularProgress,
  Grid,
  IconButton,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Card,
  CardContent,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  CreateProjectInterface,
  ProjectDetailInterface,
  status,
} from '@/types/ShowcaseType';
import { Close } from '@mui/icons-material';

interface ProjectModalProps {
  project?: ProjectDetailInterface;
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
];

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
    seeking: [],
  });
  const [seekingCollaboration, setSeekingCollaboration] = useState(false);

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
    const cleanedData: CreateProjectInterface = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      skills: formData.skills,
      tags: formData.tags,
      ...(formData.githubUrl && { githubUrl: formData.githubUrl }),
      ...(formData.websiteUrl && { websiteUrl: formData.websiteUrl }),
      ...(formData.imageUrl && { imageUrl: formData.imageUrl }),
      ...(formData.videoUrl && { videoUrl: formData.videoUrl }),
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

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperComponent={({ children }) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3 }}
          style={{
            borderRadius: 16,
            margin: 8,
            maxWidth: 600,
            width: '100%',
            boxShadow: '0 8px 32px rgba(60,60,120,0.15)',
            background: 'linear-gradient(120deg, #f5f7fa 60%, #e3eafc 100%)',
          }}
        >
          {children}
        </motion.div>
      )}
      sx={{ zIndex: 1400 }}
    >
      {/* Modern Header */}
      <DialogTitle
        sx={{
          p: 2,
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h5" fontWeight={800} color="primary.main">
            {project ? 'Edit Project' : 'Create Project'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 2,
          maxHeight: '70vh',
          overflowY: 'auto',
          bgcolor: 'background.default',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card
            elevation={2}
            sx={{
              borderRadius: 4,
              boxShadow: 3,
              p: 2,
              bgcolor: 'background.paper',
            }}
          >
            <CardContent>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {/* Title and Status */}
                  <Grid item xs={12} md={8}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TextField
                        label="Project Title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        fullWidth
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          name="status"
                          value={formData.status}
                          onChange={handleSelectChange}
                          label="Status"
                        >
                          <MenuItem value={status.IDEA}>Idea</MenuItem>
                          <MenuItem value={status.IN_PROGRESS}>
                            In Progress
                          </MenuItem>
                          <MenuItem value={status.COMPLETED}>
                            Completed
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </motion.div>
                  </Grid>

                  {/* Description */}
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <TextField
                        label="Project Description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    </motion.div>
                  </Grid>

                  {/* URLs - Compact Grid */}
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TextField
                        label="GitHub URL"
                        name="githubUrl"
                        value={formData.githubUrl}
                        onChange={handleInputChange}
                        fullWidth
                        size="small"
                        placeholder="https://github.com/username/repo"
                      />
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TextField
                        label="Website URL"
                        name="websiteUrl"
                        value={formData.websiteUrl}
                        onChange={handleInputChange}
                        fullWidth
                        size="small"
                        placeholder="https://yourproject.com"
                      />
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TextField
                        label="Image URL"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        fullWidth
                        size="small"
                        placeholder="https://example.com/image.jpg"
                      />
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TextField
                        label="Video URL"
                        name="videoUrl"
                        value={formData.videoUrl}
                        onChange={handleInputChange}
                        fullWidth
                        size="small"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </motion.div>
                  </Grid>

                  {/* Seeking Collaboration */}
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={seekingCollaboration}
                            onChange={(e) =>
                              setSeekingCollaboration(e.target.checked)
                            }
                            size="small"
                          />
                        }
                        label="Looking for collaborators?"
                      />
                      {seekingCollaboration && (
                        <TextField
                          label="What help are you looking for?"
                          name="seeking"
                          value={formData.seeking}
                          onChange={handleInputChange}
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          sx={{ mt: 1 }}
                          placeholder="Describe the skills or roles you need..."
                        />
                      )}
                    </motion.div>
                  </Grid>

                  {/* Tags */}
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ mt: 1 }}
                      >
                        Project Tags
                      </Typography>
                      <Autocomplete
                        multiple
                        options={PREDEFINED_TAGS}
                        value={formData.tags}
                        onChange={(_event, value) =>
                          setFormData((prev) => ({ ...prev, tags: value }))
                        }
                        freeSolo
                        size="small"
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select or type tags"
                            variant="outlined"
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={option}
                              label={option}
                              size="small"
                              sx={{ mb: 0.5 }}
                            />
                          ))
                        }
                      />
                    </motion.div>
                  </Grid>

                  {/* Skills */}
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ mt: 1 }}
                      >
                        Required Skills
                      </Typography>
                      <Autocomplete
                        multiple
                        options={PREDEFINED_SKILLS}
                        value={formData.skills}
                        onChange={(_event, value) =>
                          setFormData((prev) => ({ ...prev, skills: value }))
                        }
                        freeSolo
                        size="small"
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select or type skills"
                            variant="outlined"
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={option}
                              label={option}
                              size="small"
                              sx={{ mb: 0.5 }}
                            />
                          ))
                        }
                      />
                    </motion.div>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          gap: 1,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          size="medium"
          disabled={loading}
          sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="medium"
          disabled={loading}
          sx={{ borderRadius: 2, minWidth: 120, fontWeight: 700, px: 3 }}
        >
          {loading ? (
            <CircularProgress size={22} />
          ) : project ? (
            'Update'
          ) : (
            'Create'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectModal;
