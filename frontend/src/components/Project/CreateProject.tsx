/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTheme } from '@mui/material/styles';
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
  Tooltip,
  InputAdornment,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  CreateProjectInterface,
  ProjectDetailInterface,
  status,
  Tags,
} from '@/types/ShowcaseType';
import { Close, ImageSearch, Work } from '@mui/icons-material';
import { useProfile } from '@/contexts/ProfileContext';
import { Skill } from '@/types/profileType';
import { useShowcase } from '@/contexts/ShowcaseContext';

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

const EMPTY_FORM: CreateProjectInterface = {
  title: '',
  description: '',
  githubUrl: '',
  websiteUrl: '',
  imageUrl: '',
  videoUrl: '',
  skills: [],
  tags: [],
  status: status.IDEA,
  seeking: undefined, // Change from [] to undefined
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

  // To get all skills for filling them
  const { allSkills, fetchAllSkills, skillsLoading } = useProfile();
  const { allTypes, fetchAllTypes, typeLoading } = useShowcase();
  // State for selected skill names (for display in Autocomplete)
  const [SelectedSkill, setSelectedSkill] = useState<string[]>([]);
  const [SelectedType, setSelectedType] = useState<string[]>([]);

  // To reduce rapid re-renders (and caret jump) we apply a micro-debounce for text fields.
  // Input is still responsive for user but we avoid too-frequent state churn.
  const [pending, setPending] = useState<Record<string, any>>({});
  const pendingRef = useRef(pending);

  const [seekingCollaboration, setSeekingCollaboration] = useState(false);

  // Image preview state
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fetchingImage, setFetchingImage] = useState(false);

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
        tags: project.tags ?? [],
        skills: project.skills ?? [],
        status: project.status ?? status.IDEA,
        seeking: project.seeking ?? undefined, // Change from [] to undefined
      } as CreateProjectInterface);
      setSelectedSkill(project.skills || []);
      setSelectedType(project.tags || []);
      setSeekingCollaboration(!!project.seeking && project.seeking.length > 0);
    } else {
      setFormData(EMPTY_FORM); // Use EMPTY_FORM directly since it's now properly typed
      setSelectedSkill([]);
      setSelectedType([]);
      setSeekingCollaboration(false);
    }
  }, [project]);

  // Update formData when selectedSkills changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, skills: SelectedSkill }));
  }, [SelectedSkill]);

  // Update formData when selectedTypes changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, tags: SelectedType }));
  }, [SelectedType]);

  // Function to handle skill selection changes
  const handleSkillsChange = useCallback((_event: any, newSkills: string[]) => {
    setSelectedSkill(newSkills);
  }, []);

  const handleTypesChange = useCallback((_event: any, newTypes: string[]) => {
    setSelectedType(newTypes);
  }, []);

  // Get available skill names for Autocomplete
  const availableSkillNames = useMemo(() => {
    return allSkills.map((skill: Skill) => skill.name);
  }, [allSkills]);

  const availableTypeNames = useMemo(() => {
    return allTypes.map((type: Tags) => type.name);
  }, [allTypes]);

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

  // Function to extract image from URL
  const extractImageFromUrl = useCallback(
    async (url: string, type: 'github' | 'website'): Promise<string | null> => {
      if (!url) return null;

      try {
        setFetchingImage(true);

        if (type === 'github') {
          // Extract owner and repo from GitHub URL
          const githubMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
          if (githubMatch) {
            const [, owner, repo] = githubMatch;
            // Multiple GitHub image options
            const imageOptions = [
              `https://opengraph.githubassets.com/1/${owner}/${repo}`,
              `https://api.github.com/repos/${owner}/${repo}`,
            ];

            // Try each option
            for (const imageUrl of imageOptions) {
              try {
                const response = await fetch(imageUrl, { method: 'HEAD' });
                if (response.ok) {
                  return imageUrl;
                }
              } catch {
                continue;
              }
            }
          }
        } else if (type === 'website') {
          const domain = new URL(url).hostname;

          // Multiple favicon services
          const faviconServices = [
            `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
            `https://icons.duckduckgo.com/ip3/${domain}.ico`,
            `https://favicon.splitbee.io/?url=${url}`,
            `https://api.faviconkit.com/${domain}/144`,
          ];

          // Try each favicon service
          for (const faviconUrl of faviconServices) {
            try {
              const response = await fetch(faviconUrl, { method: 'HEAD' });
              if (response.ok) {
                return faviconUrl;
              }
            } catch {
              continue;
            }
          }

          // If favicons fail, try screenshot services
          const screenshotServices = [
            `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=800&h=400`,
            `https://image.thum.io/get/width/400/crop/600/${encodeURIComponent(url)}`,
          ];

          for (const screenshotUrl of screenshotServices) {
            try {
              const response = await fetch(screenshotUrl, { method: 'HEAD' });
              if (response.ok) {
                return screenshotUrl;
              }
            } catch {
              continue;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to extract image from URL:', error);

        // Fallback: Generate a placeholder based on domain
        if (type === 'website') {
          try {
            const domain = new URL(url).hostname;
            const initial = domain.charAt(0).toUpperCase();
            const colors = [
              '0f9d58',
              '4285f4',
              'db4437',
              'f4b400',
              '0f9d58',
              '4285f4',
            ];
            const color = colors[domain.length % colors.length];
            return `https://via.placeholder.com/400x200/${color}/ffffff?text=${initial}`;
          } catch {
            // Final fallback
            return `https://via.placeholder.com/400x200/0f9d58/ffffff?text=🌐`;
          }
        }
      } finally {
        if (mountedRef.current) {
          setFetchingImage(false);
        }
      }

      return null;
    },
    []
  );

  // Auto-fetch image when GitHub or Website URL is entered
  useEffect(() => {
    const autoFetchImage = async () => {
      // Don't auto-fetch if there's already an image URL
      if (formData.imageUrl || (!formData.githubUrl && !formData.websiteUrl)) {
        return;
      }

      let imageUrl: string | null = null;

      // Prefer GitHub over website for image extraction
      if (formData.githubUrl) {
        imageUrl = await extractImageFromUrl(formData.githubUrl, 'github');
      } else if (formData.websiteUrl) {
        imageUrl = await extractImageFromUrl(formData.websiteUrl, 'website');
      }

      if (imageUrl && mountedRef.current) {
        setFormData((prev) => ({ ...prev, imageUrl }));
      }
    };

    autoFetchImage();
  }, [
    formData.githubUrl,
    formData.websiteUrl,
    formData.imageUrl,
    extractImageFromUrl,
  ]);

  // Manual image fetch function
  const handleFetchImage = useCallback(async () => {
    const urlToUse = formData.githubUrl || formData.websiteUrl;
    if (!urlToUse) return;

    const type = formData.githubUrl ? 'github' : 'website';
    const imageUrl = await extractImageFromUrl(urlToUse, type);

    if (imageUrl && mountedRef.current) {
      setFormData((prev) => ({ ...prev, imageUrl }));
    }
  }, [formData.githubUrl, formData.websiteUrl, extractImageFromUrl]);

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
        ...(seekingCollaboration && formData.seeking
          ? {
              seeking: Array.isArray(formData.seeking)
                ? formData.seeking
                : (formData.seeking as string).trim().length > 0
                  ? [(formData.seeking as string).trim()]
                  : undefined,
            }
          : { seeking: undefined }),
      };
      onSubmit(cleanedData);
    },
    [formData, onSubmit, seekingCollaboration]
  );

  // First, make sure you have the getProxiedImageUrl function defined:
  const getProxiedImageUrl = (url: string): string => {
    if (!url) return '';

    // Don't proxy placeholder images or already proxied URLs
    if (url.includes('via.placeholder.com') || url.includes('corsproxy.io')) {
      return url;
    }

    // Proxy external URLs to avoid CORS issues
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
  };

  // image preview helpers
  useEffect(() => {
    console.log('Image URL changed:', formData.imageUrl);

    if (!formData.imageUrl) {
      console.log('No image URL, hiding preview');
      setImageLoading(false);
      setImageError(false);
      return;
    }

    setImageLoading(true);
    setImageError(false);

    const img = new Image();
    const proxiedUrl = getProxiedImageUrl(formData.imageUrl);
    console.log('Loading image with proxied URL:', proxiedUrl);

    img.src = proxiedUrl;
    img.loading = 'lazy';

    img.onload = () => {
      console.log('Image loaded successfully with proxy');
      if (!mountedRef.current) return;
      setImageLoading(false);
      setImageError(false);
    };

    img.onerror = () => {
      console.log('Image failed to load with proxy, trying direct URL');
      if (!mountedRef.current) return;

      // If proxy failed, try the original URL directly
      if (proxiedUrl !== formData.imageUrl) {
        const fallbackImg = new Image();
        fallbackImg.src = formData.imageUrl ?? '';
        console.log('Trying direct URL:', formData.imageUrl);

        fallbackImg.onload = () => {
          console.log('Direct URL loaded successfully - updating form data');
          if (!mountedRef.current) return;
          setImageLoading(false);
          setImageError(false);
          // UPDATE THE FORM DATA TO USE THE DIRECT URL THAT WORKS
          setFormData((prev) => ({
            ...prev,
            imageUrl: formData.imageUrl ?? '',
          }));
        };
        fallbackImg.onerror = () => {
          console.log('Direct URL also failed');
          if (!mountedRef.current) return;
          setImageLoading(false);
          setImageError(true);
        };
      } else {
        setImageLoading(false);
        setImageError(true);
      }
    };

    return () => {
      // Cleanup
      img.onload = null;
      img.onerror = null;
    };
  }, [formData.imageUrl]);

  // Check if we can fetch an image from URLs
  const canFetchImage =
    !formData.imageUrl && (formData.githubUrl || formData.websiteUrl);

  // small utility to compute modal title
  const modalTitle = project ? 'Edit Project' : 'Create Project';

  // Accessibility: compute firstField id
  const firstFieldId = useMemo(() => 'project-title-field', []);

  const theme = useTheme();

  // Paper style override so MotionPaper can remain generic but visuals adapt to theme
  const paperStyle: React.CSSProperties =
    theme.palette.mode === 'dark'
      ? {
          background:
            'linear-gradient(180deg, rgba(8,10,12,0.9) 0%, rgba(18,20,22,0.85) 50%, rgba(12,14,16,0.8) 100%)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.03)',
        }
      : {
          // keep previous light gradient for light mode
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.60) 0%, rgba(230,255,236,0.45) 50%, rgba(245,255,250,0.35) 100%)',
          boxShadow: '0 12px 30px rgba(18, 60, 37, 0.12)',
          border: '1px solid rgba(255,255,255,0.4)',
        };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperComponent={MotionPaper as any}
      PaperProps={{ style: paperStyle }}
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
              Create your project and showcase it to the community.
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
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(18,18,20,0.6), rgba(12,12,14,0.45))'
              : 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(240,255,245,0.5))',
          // Add this to ensure Autocomplete dropdowns can overflow
          position: 'relative', // This helps with z-index context
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
                      label="Project Description (20-50 words recommended)"
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
                        position: 'relative',
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
                          {!imageError && !imageLoading ? (
                            <img
                              src={getProxiedImageUrl(formData.imageUrl)}
                              alt="Project preview"
                              loading="lazy"
                              decoding="async"
                              style={{
                                width: '100%',
                                height: 140,
                                objectFit: 'cover',
                                display: 'block',
                                border: '2px solid green', // Debug border
                              }}
                              onLoad={() => {
                                console.log('IMG element onLoad fired');
                                setImageLoading(false);
                                setImageError(false);
                              }}
                              onError={() => {
                                console.log('IMG element onError fired');
                                // Try direct URL as fallback
                                if (
                                  formData.imageUrl &&
                                  !formData.imageUrl.includes('corsproxy.io')
                                ) {
                                  const directUrl = formData.imageUrl;
                                  setFormData((prev) => ({
                                    ...prev,
                                    imageUrl: directUrl,
                                  }));
                                } else {
                                  setImageError(true);
                                }
                              }}
                            />
                          ) : imageError ? (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Couldn't load preview
                              </Typography>
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{ display: 'block', mt: 1 }}
                              >
                                URL: {formData.imageUrl}
                              </Typography>
                            </Box>
                          ) : null}
                        </>
                      ) : (
                        <Box
                          sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            minHeight: 140,
                          }}
                        >
                          <Skeleton variant="circular" width={40} height={40} />
                          <Box>
                            <Typography variant="body2">
                              {canFetchImage
                                ? 'Auto-image available'
                                : 'Add an image URL'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {canFetchImage
                                ? 'Enter GitHub or website URL above'
                                : 'Optional — shows on project card.'}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* Fetch image button */}
                    {canFetchImage && (
                      <Box
                        sx={{
                          mt: 1,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <Tooltip title="Fetch image from URL">
                          <Button
                            size="small"
                            startIcon={<ImageSearch />}
                            onClick={handleFetchImage}
                            disabled={fetchingImage}
                            variant="outlined"
                          >
                            {fetchingImage ? 'Fetching...' : 'Auto-fetch Image'}
                          </Button>
                        </Tooltip>
                      </Box>
                    )}
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

                    {/* Auto-image hint */}
                    {(formData.githubUrl || formData.websiteUrl) &&
                      !formData.imageUrl && (
                        <Typography
                          variant="caption"
                          color="info.main"
                          sx={{ mt: 1, display: 'block' }}
                        >
                          💡 We can automatically fetch an image from your{' '}
                          {formData.githubUrl ? 'GitHub repository' : 'website'}
                          . Use the "Auto-fetch Image" button.
                        </Typography>
                      )}
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
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Project Tags
                    </Typography>
                    <Autocomplete
                      multiple
                      options={availableTypeNames}
                      value={SelectedType}
                      onChange={handleTypesChange}
                      onOpen={() => fetchAllTypes()}
                      loading={typeLoading}
                      componentsProps={{
                        popper: {
                          style: {
                            zIndex: 1401, // Higher than Dialog zIndex
                          },
                        },
                      }}
                      freeSolo
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          helperText="Select from predefined tags or type to add your own"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <Chip label="Tag" color="info" size="small" />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                          placeholder="Add or select tags"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option}
                              {...tagProps}
                              onDelete={() => {
                                const newTags = formData.tags.filter(
                                  (_: string, i: number) => i !== index
                                );
                                handleAutocompleteChange('tags', newTags);
                              }}
                            />
                          );
                        })
                      }
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      💡 Using relevant tags helps your project get discovered
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Required Skills
                    </Typography>
                    <Autocomplete
                      multiple
                      options={availableSkillNames}
                      value={SelectedSkill}
                      onChange={handleSkillsChange}
                      onOpen={() => fetchAllSkills()}
                      loading={skillsLoading}
                      componentsProps={{
                        popper: {
                          style: {
                            zIndex: 1401, // Higher than Dialog zIndex
                          },
                        },
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          helperText="Select from existing skills or type to add new ones"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <Work color="action" />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      freeSolo
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option}
                              {...tagProps}
                              onDelete={() => {
                                const newSkills = SelectedSkill.filter(
                                  (_, i) => i !== index
                                );
                                setSelectedSkill(newSkills);
                              }}
                            />
                          );
                        })
                      }
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      💡 Using consistent skill names helps match with relevant
                      collaborators
                    </Typography>
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
