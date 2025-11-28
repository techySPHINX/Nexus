import { FC, useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Image,
  PictureAsPdf,
  VideoFile,
  AudioFile,
  Archive,
  InsertDriveFile,
  Delete,
  Download,
  Visibility,
  Add,
  Storage,
  Person,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { getErrorMessage } from '@/utils/errorHandler';

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  webViewLink?: string;
  downloadLink?: string;
  driveId?: string;
}

interface UploadForm {
  description: string;
  tags: string;
}

const Files: FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    description: '',
    tags: '',
  });
  const [uploading, setUploading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] =
    useState<FileItem | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [googleTokens, setGoogleTokens] = useState<{
    access_token: string;
    refresh_token?: string;
  } | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user has Google tokens stored
    const storedTokens = localStorage.getItem('googleDriveTokens');
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        setGoogleTokens(tokens);
        setIsGoogleConnected(true);
        fetchFiles(tokens);
      } catch (error) {
        console.error('Error parsing stored Google tokens:', error);
        localStorage.removeItem('googleDriveTokens');
      }
    } else {
      fetchFiles();
    }
  }, []);

  const connectGoogleDrive = async () => {
    try {
      setConnectingGoogle(true);

      // Get Google OAuth URL from backend
      const response = await apiService.files.getGoogleAuthUrl();
      const authUrl = response.data.authUrl;

      // Open Google OAuth popup
      const popup = window.open(
        authUrl,
        'googleOAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth callback
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setConnectingGoogle(false);
        }
      }, 1000);

      // Listen for message from popup
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS' && event.data.code) {
          try {
            // Exchange code for tokens
            const tokenResponse = await apiService.files.handleGoogleCallback(
              event.data.code
            );
            const tokens = tokenResponse.data;

            // Store tokens
            setGoogleTokens(tokens);
            setIsGoogleConnected(true);
            localStorage.setItem('googleDriveTokens', JSON.stringify(tokens));

            // Close popup and refresh files
            popup?.close();
            fetchFiles(tokens);

            console.log('✅ Google Drive connected successfully!');
          } catch (error) {
            console.error('❌ Error connecting Google Drive:', error);
            setError('Failed to connect Google Drive');
          }
        }
      });
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
      setError('Failed to connect to Google Drive');
      setConnectingGoogle(false);
    }
  };

  const disconnectGoogleDrive = () => {
    setGoogleTokens(null);
    setIsGoogleConnected(false);
    localStorage.removeItem('googleDriveTokens');
    fetchFiles(); // Refresh without tokens
  };

  // const refreshGoogleToken = async () => {
  //   if (!googleTokens?.refresh_token) return;

  //   try {
  //     const response = await apiService.files.refreshGoogleToken(
  //       googleTokens.refresh_token
  //     );
  //     const newTokens = response.data;

  //     setGoogleTokens(newTokens);
  //     localStorage.setItem('googleDriveTokens', JSON.stringify(newTokens));

  //     console.log('✅ Google token refreshed successfully!');
  //   } catch (error) {
  //     console.error('❌ Error refreshing Google token:', error);
  //     // Token refresh failed, disconnect
  //     disconnectGoogleDrive();
  //   }
  // };

  const fetchFiles = async (tokens?: {
    access_token: string;
    refresh_token?: string;
  }) => {
    try {
      setLoading(true);
      let response;
      if (tokens?.access_token) {
        // Use Google Drive API with tokens
        response = await apiService.files.getAll(
          tokens.access_token,
          tokens.refresh_token
        );
      } else {
        // Fallback to local files (if any)
        response = await apiService.files.getAll();
      }
      setFiles(response.data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      if (!isGoogleConnected || !googleTokens) {
        setError('Please connect your Google Drive first');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);
      formData.append('access_token', googleTokens.access_token);
      if (googleTokens.refresh_token) {
        formData.append('refresh_token', googleTokens.refresh_token);
      }

      const response = await apiService.files.upload(formData);
      console.log('✅ File uploaded to Google Drive:', response);

      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({ description: '', tags: '' });
      fetchFiles();
    } catch (err: unknown) {
      console.error('❌ Error uploading file:', err);
      setError(`Failed to upload file: ${getErrorMessage(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!isGoogleConnected || !googleTokens) {
      setError('Please connect your Google Drive first');
      return;
    }

    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await apiService.files.delete(fileId, {
          access_token: googleTokens.access_token,
          refresh_token: googleTokens.refresh_token,
        });
        fetchFiles(googleTokens);
      } catch (err) {
        console.error('Error deleting file:', err);
        setError('Failed to delete file');
      }
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image />;
    if (mimeType.startsWith('video/')) return <VideoFile />;
    if (mimeType.startsWith('audio/')) return <AudioFile />;
    if (mimeType === 'application/pdf') return <PictureAsPdf />;
    if (mimeType.includes('zip') || mimeType.includes('rar'))
      return <Archive />;
    if (mimeType.startsWith('text/')) return <Description />;
    return <InsertDriveFile />;
  };

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'Archive';
    if (mimeType.startsWith('text/')) return 'Text';
    return 'Document';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (file: FileItem) => {
    if (!isGoogleConnected || !googleTokens) {
      setError('Please connect your Google Drive first');
      return;
    }

    try {
      const response = await apiService.files.getDownloadUrl(
        file.id,
        googleTokens.access_token,
        googleTokens.refresh_token
      );
      window.open(response.data.downloadUrl, '_blank');
    } catch (err) {
      console.error('Error getting download URL:', err);
      setError('Failed to get download URL');
    }
  };

  const handleShareFile = async (file: FileItem, userEmail: string) => {
    if (!isGoogleConnected || !googleTokens) {
      setError('Please connect your Google Drive first');
      return;
    }

    try {
      await apiService.files.share(
        file.id,
        userEmail,
        googleTokens.access_token,
        googleTokens.refresh_token
      );
      // Show success message
    } catch (err: unknown) {
      console.error('Error sharing file:', err);
      setError(`Failed to share file: ${getErrorMessage(err)}`);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          File Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Upload, organize, and manage your files
        </Typography>
      </Box>

      {/* Google Drive Connection Status */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: isGoogleConnected ? 'success.light' : 'warning.light',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {isGoogleConnected ? (
            <>
              <CheckCircle color="success" />
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: 'success.dark' }}
                >
                  Google Drive Connected
                </Typography>
                <Typography variant="body2" color="success.dark">
                  Your files are securely stored in your Google Drive
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={disconnectGoogleDrive}
                sx={{ ml: 'auto' }}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <CloudUpload color="warning" />
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: 'warning.dark' }}
                >
                  Connect Google Drive
                </Typography>
                <Typography variant="body2" color="warning.dark">
                  Connect your Google Drive to start uploading files
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={connectGoogleDrive}
                disabled={connectingGoogle}
                startIcon={
                  connectingGoogle ? (
                    <CircularProgress size={16} />
                  ) : (
                    <CloudUpload />
                  )
                }
                sx={{ ml: 'auto' }}
              >
                {connectingGoogle ? 'Connecting...' : 'Connect Google Drive'}
              </Button>
            </>
          )}
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Storage sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Upload Files
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share documents, images, and other files with your network
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            multiple={false}
          />
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={!isGoogleConnected}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {isGoogleConnected ? 'Choose File' : 'Connect Google Drive First'}
          </Button>
          <Typography variant="body2" color="text.secondary">
            or drag and drop files here
          </Typography>
        </Box>
      </Paper>

      {/* Files List */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Your Files ({files.length})
        </Typography>

        {files.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <CloudUpload
              sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No files uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start by uploading your first file to share with your network
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Upload First File
            </Button>
          </Paper>
        ) : (
          <List>
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Paper sx={{ mb: 2, borderRadius: 2 }}>
                  <ListItem>
                    <ListItemIcon>{getFileIcon(file.mimeType)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            {file.originalName}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip
                              label={getFileType(file.mimeType)}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={formatFileSize(file.size)}
                              size="small"
                              variant="outlined"
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(file.createdAt).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownload(file)}
                          title="Download"
                        >
                          <Download />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            window.open(file.webViewLink || file.path, '_blank')
                          }
                          title="View in Google Drive"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => {
                            setSelectedFileForShare(file);
                            setShareDialogOpen(true);
                          }}
                          title="Share"
                        >
                          <Person />
                        </IconButton>
                        {user?.id === file.userId && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteFile(file.id)}
                            title="Delete"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Paper>
              </motion.div>
            ))}
          </List>
        )}
      </Box>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getFileIcon(selectedFile.type)}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(selectedFile.size)} •{' '}
                    {getFileType(selectedFile.type)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, description: e.target.value })
                }
                placeholder="Describe what this file contains..."
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (Optional)"
                value={uploadForm.tags}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, tags: e.target.value })
                }
                placeholder="Enter tags separated by commas..."
                helperText="Example: resume, portfolio, project"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading}
            startIcon={
              uploading ? <CircularProgress size={16} /> : <CloudUpload />
            }
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share File</DialogTitle>
        <DialogContent>
          {selectedFileForShare && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {selectedFileForShare.originalName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Share this file with another user
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="User Email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="Enter user's email address"
            helperText="The user will receive access to this file in Google Drive"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedFileForShare && shareEmail) {
                handleShareFile(selectedFileForShare, shareEmail);
                setShareDialogOpen(false);
                setShareEmail('');
                setSelectedFileForShare(null);
              }
            }}
            variant="contained"
            disabled={!shareEmail}
          >
            Share File
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Files;
