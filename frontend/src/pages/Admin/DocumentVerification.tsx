import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Download,
  OpenInNew,
  Person,
  School,
  Work,
  Description,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface Document {
  id: string;
  documentType: string;
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  adminComments?: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  };
}

const AdminDocumentVerification: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'approve' | 'reject'>('approve');
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<
    'pdf' | 'image' | 'other' | null
  >(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  // stats removed — server doesn't provide document-stats endpoint; UI will show list only

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      const response = await axios.get('/auth/admin/pending-documents');
      const docs = response.data;
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!activeDocument) return;
    try {
      const endpoint =
        dialogType === 'approve'
          ? '/auth/admin/approve-documents'
          : '/auth/admin/reject-documents';

      const payload = {
        documentIds: [activeDocument.id],
        adminComments,
      } as {
        documentIds: string[];
        adminComments?: string;
        reason?: string;
      };
      if (dialogType === 'reject') payload.reason = rejectionReason;

      await axios.post(endpoint, payload);

      // Refresh the list
      await fetchPendingDocuments();

      // Reset form
      setAdminComments('');
      setRejectionReason('');
      setDialogOpen(false);
      setActiveDocument(null);

      const successMsg =
        dialogType === 'approve'
          ? 'Document approved successfully!'
          : 'Document rejected successfully!';
      alert(successMsg);
    } catch (error) {
      console.error(`Failed to ${dialogType} document:`, error);
      alert(`Failed to ${dialogType} document. Please try again.`);
    }
  };

  const openPreview = (document: Document) => {
    const url = document.documentUrl;
    const fileName = url.split('/').pop() || 'document';
    const lower = url.split('?')[0].toLowerCase();
    let type: 'pdf' | 'image' | 'other' = 'other';
    if (lower.endsWith('.pdf')) type = 'pdf';
    else if (lower.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) type = 'image';

    setPreviewUrl(url);
    setPreviewType(type);
    setPreviewFileName(fileName);
    setPreviewOpen(true);
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      STUDENT_ID: 'Student ID',
      TRANSCRIPT: 'Transcript',
      DEGREE_CERTIFICATE: 'Degree Certificate',
      ALUMNI_CERTIFICATE: 'Alumni Certificate',
      EMPLOYMENT_PROOF: 'Employment Proof',
    };
    return labels[type] || type;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <School />;
      case 'ALUM':
        return <Work />;
      default:
        return <Person />;
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    if (filter === 'all') return true;
    return doc.status === filter.toUpperCase();
  });

  if (user?.role !== 'ADMIN') {
    return (
      <Container>
        <Alert severity="error">
          You don't have permission to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Document Verification Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Review and manage student/alumni verification documents
        </Typography>

        {/* Statistics Cards */}
        {/* Stats removed — server no longer provides document-stats; show list only */}

        {/* Action Bar */}
        <Paper
          elevation={0}
          sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}
        >
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filter}
                label="Filter"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Documents</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              onClick={fetchPendingDocuments}
              startIcon={<Description />}
            >
              Refresh
            </Button>
          </Box>
        </Paper>

        {/* Documents Table */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider' }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getRoleIcon(document.user.role)}
                      </Avatar>
                      <div>
                        <Typography variant="body2" fontWeight={500}>
                          {document.user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {document.user.email}
                        </Typography>
                        <Chip
                          label={document.user.role}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </div>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getDocumentTypeLabel(document.documentType)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={document.status}
                      color={
                        document.status === 'APPROVED'
                          ? 'success'
                          : document.status === 'REJECTED'
                            ? 'error'
                            : 'warning'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(document.submittedAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Document">
                        <IconButton
                          onClick={() => openPreview(document)}
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download / Open in new tab">
                        {/* Render as anchor to open in new tab safely */}
                        <IconButton
                          component="a"
                          href={document.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Open in new tab">
                        <IconButton
                          component="a"
                          href={document.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                        >
                          <OpenInNew />
                        </IconButton>
                      </Tooltip>
                      {document.status === 'PENDING' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => {
                                setDialogType('approve');
                                setActiveDocument(document);
                                setDialogOpen(true);
                              }}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDialogType('reject');
                                setActiveDocument(document);
                                setDialogOpen(true);
                              }}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredDocuments.length === 0 && !loading && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No documents found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filter === 'all'
                ? 'No document verification requests have been submitted yet.'
                : `No ${filter} documents found.`}
            </Typography>
          </Paper>
        )}

        {/* Action Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {dialogType === 'approve' ? 'Approve Document' : 'Reject Document'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              You are about to {dialogType} the document submitted by{' '}
              <strong>
                {activeDocument?.user?.name || activeDocument?.user?.email}
              </strong>
              .
              {dialogType === 'approve'
                ? ' The user will receive login credentials via email.'
                : ' The user will be notified of the rejection.'}
            </Typography>

            {dialogType === 'reject' && (
              <TextField
                fullWidth
                label="Rejection Reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                multiline
                rows={3}
                margin="normal"
                helperText="Please provide a clear reason for rejection"
              />
            )}

            <TextField
              fullWidth
              label="Admin Comments (Optional)"
              value={adminComments}
              onChange={(e) => setAdminComments(e.target.value)}
              multiline
              rows={3}
              margin="normal"
              helperText="Internal comments for record keeping"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmAction}
              variant="contained"
              color={dialogType === 'approve' ? 'success' : 'error'}
              disabled={dialogType === 'reject' && !rejectionReason.trim()}
            >
              {dialogType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {previewFileName} — {activeDocument?.user?.name || ''}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            {previewUrl && previewType === 'pdf' && (
              <Box sx={{ width: '100%', height: '75vh' }}>
                <iframe
                  src={previewUrl}
                  title={previewFileName}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              </Box>
            )}

            {previewUrl && previewType === 'image' && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                <img
                  src={previewUrl}
                  alt={previewFileName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            )}

            {previewUrl && previewType === 'other' && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2">
                  Preview not available for this file type.
                </Typography>
                <Button
                  component="a"
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mt: 2 }}
                  startIcon={<OpenInNew />}
                >
                  Open in new tab
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            {previewUrl && (
              <Button
                component="a"
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                startIcon={<OpenInNew />}
              >
                Open in new tab
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default AdminDocumentVerification;
