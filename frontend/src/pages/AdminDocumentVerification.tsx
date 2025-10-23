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
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Download,
  Person,
  School,
  Work,
  Description,
  DateRange,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
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
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'approve' | 'reject'>('approve');
  const [adminComments, setAdminComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      const response = await axios.get('/auth/admin/pending-documents');
      const docs = response.data;
      setDocuments(docs);

      // Calculate stats
      const pending = docs.filter(
        (d: Document) => d.status === 'PENDING'
      ).length;
      const approved = docs.filter(
        (d: Document) => d.status === 'APPROVED'
      ).length;
      const rejected = docs.filter(
        (d: Document) => d.status === 'REJECTED'
      ).length;

      setStats({
        pending,
        approved,
        rejected,
        total: docs.length,
      });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelection = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments((prev) => [...prev, documentId]);
    } else {
      setSelectedDocuments((prev) => prev.filter((id) => id !== documentId));
    }
  };

  const handleBulkAction = (action: 'approve' | 'reject') => {
    if (selectedDocuments.length === 0) {
      alert('Please select documents first');
      return;
    }
    setDialogType(action);
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    try {
      const endpoint =
        dialogType === 'approve'
          ? '/auth/admin/approve-documents'
          : '/auth/admin/reject-documents';

      const payload = {
        documentIds: selectedDocuments,
        adminComments,
        ...(dialogType === 'reject' && { reason: rejectionReason }),
      };

      await axios.post(endpoint, payload);

      // Refresh the list
      await fetchPendingDocuments();

      // Reset form
      setSelectedDocuments([]);
      setAdminComments('');
      setRejectionReason('');
      setDialogOpen(false);

      alert(`Documents ${dialogType}d successfully!`);
    } catch (error) {
      console.error(`Failed to ${dialogType} documents:`, error);
      alert(`Failed to ${dialogType} documents. Please try again.`);
    }
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
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <div>
                    <Typography color="text.secondary" gutterBottom>
                      Pending Review
                    </Typography>
                    <Typography variant="h4">{stats.pending}</Typography>
                  </div>
                  <Description color="warning" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <div>
                    <Typography color="text.secondary" gutterBottom>
                      Approved
                    </Typography>
                    <Typography variant="h4">{stats.approved}</Typography>
                  </div>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <div>
                    <Typography color="text.secondary" gutterBottom>
                      Rejected
                    </Typography>
                    <Typography variant="h4">{stats.rejected}</Typography>
                  </div>
                  <Cancel color="error" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <div>
                    <Typography color="text.secondary" gutterBottom>
                      Total
                    </Typography>
                    <Typography variant="h4">{stats.total}</Typography>
                  </div>
                  <DateRange color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
              variant="contained"
              color="success"
              onClick={() => handleBulkAction('approve')}
              disabled={selectedDocuments.length === 0}
              startIcon={<CheckCircle />}
            >
              Approve Selected ({selectedDocuments.length})
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={() => handleBulkAction('reject')}
              disabled={selectedDocuments.length === 0}
              startIcon={<Cancel />}
            >
              Reject Selected ({selectedDocuments.length})
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
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocuments(
                          filteredDocuments.map((d) => d.id)
                        );
                      } else {
                        setSelectedDocuments([]);
                      }
                    }}
                    checked={
                      selectedDocuments.length === filteredDocuments.length &&
                      filteredDocuments.length > 0
                    }
                  />
                </TableCell>
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
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={(e) =>
                        handleDocumentSelection(document.id, e.target.checked)
                      }
                    />
                  </TableCell>
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
                          onClick={() =>
                            window.open(document.documentUrl, '_blank')
                          }
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton
                          onClick={() =>
                            window.open(document.documentUrl, '_blank')
                          }
                          size="small"
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
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
            {dialogType === 'approve'
              ? 'Approve Documents'
              : 'Reject Documents'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              You are about to {dialogType} {selectedDocuments.length}{' '}
              document(s).
              {dialogType === 'approve'
                ? ' The users will receive login credentials via email.'
                : ' The users will be notified of the rejection.'}
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
      </motion.div>
    </Container>
  );
};

export default AdminDocumentVerification;
