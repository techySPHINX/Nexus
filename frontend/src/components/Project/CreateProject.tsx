/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  Skeleton,
  Avatar,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  CreateProjectInterface,
  ProjectDetailInterface,
  status,
} from '@/types/ShowcaseType';
import { Close } from '@mui/icons-material';

/**
 * MotionPaper defined outside component so it doesn't recreate on every render.
 * Keeps wrapper stable to prevent focus/caret issues when typing.
 */
const MotionPaper = React.forwardRef<HTMLDivElement, any>(function MotionPaper(
  { children, style }: any,
  ref
) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{
        borderRadius: 14,
        margin: 8,
        width: '100%',
        maxWidth: 760,
        backdropFilter: 'blur(8px) saturate(1.05)',
        WebkitBackdropFilter: 'blur(8px) saturate(1.05)',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.60) 0%, rgba(230,255,236,0.45) 50%, rgba(245,255,250,0.35) 100%)',
        boxShadow: '0 12px 30px rgba(18, 60, 37, 0.12)',
        border: '1px solid rgba(255,255,255,0.4)',
        ...style,
      }}
      layout
    >
      {children}
    </motion.div>
  );
});

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

const EMPTY_FORM = {
  title: '',
  description: '',
  githubUrl: '',
  websiteUrl: '',
  imageUrl: '',
  videoUrl: '',
  skills: [] as string[],
  tags: [] as string[],
  status: status.IDEA,
  seeking: [] as string[] | string,
};

const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onSubmit,
  loading = false,
}) => {
  // Form state
  const [formData, setFormData] = useState<CreateProjectInterface>(() =>
    Object.assign({}, EMPTY_FORM)
  );

  // To reduce rapid re-renders (and caret jump) we apply a micro-debounce for text fields.
  // Input is still responsive for user but we avoid too-frequent state churn.
  const [pending, setPending] = useState<Record<string, any>>({});
  const pendingRef = useRef(pending);

  const [seekingCollaboration, setSeekingCollaboration] = useState(false);

  // Image preview state
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Keep a stable mounted flag
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize form when project changes (only once per project prop)
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title ?? '',
        description: project.description ?? '',
        githubUrl: project.githubUrl ?? '',
        websiteUrl: project.websiteUrl ?? '',
        imageUrl: project.imageUrl ?? '',
        videoUrl: project.videoUrl ?? '',
        skills: project.skills ?? [],
        tags: project.tags ?? [],
        status: project.status ?? status.IDEA,
        seeking: project.seeking ?? [],
      } as CreateProjectInterface);
      setSeekingCollaboration(!!project.seeking && project.seeking.length > 0);
    } else {
      setFormData(Object.assign({}, EMPTY_FORM));
      setSeekingCollaboration(false);
    }
  }, [project]);

  // Update pendingRef whenever pending changes (for stable access)
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  // Debounce effect: flush pending to formData after short delay
  useEffect(() => {
    if (Object.keys(pending).length === 0) return;
    const t = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setFormData((prev) => ({ ...prev, ...pendingRef.current }));
      setPending({});
    }, 120); // 120ms micro-debounce

    return () => clearTimeout(t);
  }, [pending]);

  // Input handlers memoized to keep stable identity (helps with re-renders)
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      // For quick typing we update pending; debounced flush will commit to formData
      setPending((p) => ({ ...p, [name]: value }));
    },
    []
  );

  const handleSelectChange = useCallback((e: any) => {
    const { name, value } = e.target;
    // selects are less chatty — commit immediately
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAutocompleteChange = useCallback((name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      // flush any pending changes immediately before submit
      if (Object.keys(pendingRef.current).length) {
        setFormData((prev) => ({ ...prev, ...pendingRef.current }));
        setPending({});
      }
      // Build cleaned payload
      const cleanedData: CreateProjectInterface = {
        title: (formData.title || '').trim(),
        description: (formData.description || '').trim(),
        status: formData.status as status,
        skills: formData.skills || [],
        tags: formData.tags || [],
        ...(formData.githubUrl ? { githubUrl: formData.githubUrl.trim() } : {}),
        ...(formData.websiteUrl
          ? { websiteUrl: formData.websiteUrl.trim() }
          : {}),
        ...(formData.imageUrl ? { imageUrl: formData.imageUrl.trim() } : {}),
        ...(formData.videoUrl ? { videoUrl: formData.videoUrl.trim() } : {}),
        ...(seekingCollaboration &&
        formData.seeking &&
        (Array.isArray(formData.seeking)
          ? formData.seeking.length > 0
          : (formData.seeking as string).trim().length > 0)
          ? { seeking: formData.seeking }
          : {}),
      };
      onSubmit(cleanedData);
    },
    [formData, onSubmit, seekingCollaboration]
  );

  // image preview helpers
  useEffect(() => {
    if (!formData.imageUrl) {
      setImageLoading(false);
      setImageError(false);
      return;
    }
    setImageLoading(true);
    setImageError(false);
    const img = new Image();
    img.src = formData.imageUrl;
    img.loading = 'lazy';
    img.onload = () => {
      if (!mountedRef.current) return;
      setImageLoading(false);
      setImageError(false);
    };
    img.onerror = () => {
      if (!mountedRef.current) return;
      setImageLoading(false);
      setImageError(true);
    };

    return () => {
      // no-op
    };
  }, [formData.imageUrl]);

  // small utility to compute modal title
  const modalTitle = project ? 'Edit Project' : 'Create Project';

  // Accessibility: compute firstField id
  const firstFieldId = useMemo(() => 'project-title-field', []);

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperComponent={MotionPaper as any}
      aria-labelledby="project-modal-title"
      sx={{
        zIndex: 1400,
      }}
    >
      {/* Header */}
      <DialogTitle
        id="project-modal-title"
        sx={{
          p: 2,
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'success.main',
              width: 44,
              height: 44,
              boxShadow: '0 4px 12px rgba(56, 142, 60, 0.14)',
            }}
            aria-hidden
          >
            {/* subtle icon letter */}P
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontWeight: 800, color: 'success.dark' }}
            >
              {modalTitle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create or edit your project — keep it short, 20–50 words in
              description for clarity.
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          aria-label="Close project modal"
          size="large"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 3,
          maxHeight: '68vh',
          overflowY: 'auto',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(240,255,245,0.5))',
        }}
      >
        <motion.div
          layoutId={`project-modal-body`}
          initial={{ opacity: 0.98 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28 }}
        >
          <Card elevation={0} sx={{ borderRadius: 3, px: 0 }}>
            <CardContent>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {/* Title and Status */}
                  <Grid item xs={12} md={8}>
                    <TextField
                      id={firstFieldId}
                      label="Project Title"
                      name="title"
                      value={pending.title ?? formData.title}
                      onChange={handleInputChange}
                      required
                      fullWidth
                      size="small"
                      sx={{ mb: 1.2 }}
                      inputProps={{ 'aria-label': 'Project title' }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="project-status-label">Status</InputLabel>
                      <Select
                        labelId="project-status-label"
                        name="status"
                        value={formData.status}
                        onChange={handleSelectChange}
                        label="Status"
                        inputProps={{ 'aria-label': 'Project status' }}
                      >
                        <MenuItem value={status.IDEA}>Idea</MenuItem>
                        <MenuItem value={status.IN_PROGRESS}>
                          In Progress
                        </MenuItem>
                        <MenuItem value={status.COMPLETED}>Completed</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Description (20-50 words hint) */}
                  <Grid item xs={12}>
                    <TextField
                      label="Project Description (20–50 words recommended)"
                      name="description"
                      value={pending.description ?? formData.description}
                      onChange={handleInputChange}
                      required
                      fullWidth
                      multiline
                      rows={4}
                      size="small"
                      sx={{ mb: 1 }}
                      inputProps={{ 'aria-label': 'Project description' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Keep it concise — focus on problem, approach & tech.
                    </Typography>
                  </Grid>

                  {/* Left column: image preview (lazy) */}
                  <Grid item xs={12} md={4}>
                    <Box
                      sx={{
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid rgba(14, 70, 37, 0.06)',
                        bgcolor: 'rgba(245,255,250,0.6)',
                      }}
                      aria-hidden={!formData.imageUrl}
                    >
                      {formData.imageUrl ? (
                        <>
                          {imageLoading && (
                            <Skeleton
                              variant="rectangular"
                              height={140}
                              animation="wave"
                            />
                          )}
                          {!imageError ? (
                            <img
                              src={formData.imageUrl}
                              alt="Project preview"
                              loading="lazy"
                              style={{
                                width: '100%',
                                height: imageLoading ? 0 : 140,
                                objectFit: 'cover',
                                display: imageLoading ? 'none' : 'block',
                                transition: 'opacity 220ms ease-in-out',
                              }}
                              onLoad={() => setImageLoading(false)}
                              onError={() => setImageError(true)}
                            />
                          ) : (
                            <Box sx={{ p: 2 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Couldn't load preview
                              </Typography>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Box
                          sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Skeleton variant="circular" width={40} height={40} />
                          <Box>
                            <Typography variant="body2">
                              Add an image URL
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Optional — shows on project card.
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Right column: URLs */}
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="GitHub URL"
                          name="githubUrl"
                          value={pending.githubUrl ?? formData.githubUrl}
                          onChange={handleInputChange}
                          fullWidth
                          size="small"
                          placeholder="https://github.com/username/repo"
                          inputProps={{ 'aria-label': 'GitHub url' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Website URL"
                          name="websiteUrl"
                          value={pending.websiteUrl ?? formData.websiteUrl}
                          onChange={handleInputChange}
                          fullWidth
                          size="small"
                          placeholder="https://yourproject.com"
                          inputProps={{ 'aria-label': 'Website url' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Image URL"
                          name="imageUrl"
                          value={pending.imageUrl ?? formData.imageUrl}
                          onChange={handleInputChange}
                          fullWidth
                          size="small"
                          placeholder="https://example.com/image.jpg"
                          inputProps={{ 'aria-label': 'Image url' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Video URL"
                          name="videoUrl"
                          value={pending.videoUrl ?? formData.videoUrl}
                          onChange={handleInputChange}
                          fullWidth
                          size="small"
                          placeholder="https://youtube.com/watch?v=..."
                          inputProps={{ 'aria-label': 'Video url' }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Seeking collaboration */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={seekingCollaboration}
                          onChange={(e) =>
                            setSeekingCollaboration(e.target.checked)
                          }
                          size="small"
                          inputProps={{
                            'aria-label': 'Looking for collaborators?',
                          }}
                        />
                      }
                      label="Looking for collaborators?"
                    />
                    {seekingCollaboration && (
                      <TextField
                        label="What help are you looking for?"
                        name="seeking"
                        value={
                          pending.seeking ??
                          (Array.isArray(formData.seeking)
                            ? formData.seeking.join(', ')
                            : formData.seeking || '')
                        }
                        onChange={(e) => {
                          // store as a simple CSV string in pending to avoid frequent array ops
                          setPending((p) => ({
                            ...p,
                            seeking: e.target.value,
                          }));
                        }}
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        sx={{ mt: 1 }}
                        placeholder="Describe the skills or roles you need..."
                        inputProps={{ 'aria-label': 'Seeking help' }}
                      />
                    )}
                  </Grid>

                  {/* Tags & Skills */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Project Tags
                    </Typography>
                    <Autocomplete
                      multiple
                      options={PREDEFINED_TAGS}
                      value={formData.tags}
                      onChange={(_e, value) =>
                        handleAutocompleteChange('tags', value)
                      }
                      freeSolo
                      size="small"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select or type tags"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option}
                            label={option}
                            size="small"
                          />
                        ))
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Required Skills
                    </Typography>
                    <Autocomplete
                      multiple
                      options={PREDEFINED_SKILLS}
                      value={formData.skills}
                      onChange={(_e, value) =>
                        handleAutocompleteChange('skills', value)
                      }
                      freeSolo
                      size="small"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select or type skills"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option}
                            label={option}
                            size="small"
                          />
                        ))
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </DialogContent>

      {/* Sticky action bar */}
      <DialogActions
        sx={{
          p: 2,
          gap: 1,
          borderTop: 1,
          borderColor: 'divider',
          position: 'sticky',
          bottom: 0,
          bgcolor: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
        role="toolbar"
        aria-label="Project actions"
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
          sx={{
            borderRadius: 2,
            minWidth: 120,
            fontWeight: 800,
            px: 3,
            background: 'linear-gradient(90deg,#0f9d58,#0bb37b)',
            boxShadow: '0 8px 20px rgba(11,179,123,0.18)',
          }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
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
