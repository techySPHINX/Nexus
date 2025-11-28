import { FC, useEffect, useState, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Link,
  Snackbar,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  MenuItem,
  Avatar,
  Badge,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
  Drawer,
  Divider,
  Fab,
  Zoom,
} from '@mui/material';
import {
  FilterList,
  Refresh,
  Visibility,
  CheckCircle,
  Cancel,
  Download,
  OpenInNew,
  Person,
  CalendarToday,
  Description,
  SelectAll,
  Deselect,
  Close,
  Search,
} from '@mui/icons-material';
import axios from 'axios';
import { getErrorMessage } from '@/utils/errorHandler';
import { useNotification } from '@/contexts/NotificationContext';

type PendingDocument = {
  id: string;
  documentType: string;
  documentUrl: string;
  fileName?: string;
  fileSize?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

type FilterState = {
  status: string;
  documentType: string;
  search: string;
};

const statusColors = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
} as const;

const documentTypes = [
  'ID Card',
  'Passport',
  'Driver License',
  'Utility Bill',
  'Bank Statement',
  'Other',
];

const DocumentVerification: FC = () => {
  const { showNotification } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<PendingDocument[]>(
    []
  );
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(8);

  // Selection state
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<PendingDocument | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // UI states
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity?: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    documentType: 'all',
    search: '',
  });

  // Memoized fetch function
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/pending-documents');
      const docs: PendingDocument[] = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? []);
      setDocuments(docs);
    } catch (err: unknown) {
      showNotification?.(
        getErrorMessage(err) || 'Failed to fetch documents',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Initial data loading
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter documents when dependencies change
  const filterDocuments = useCallback(() => {
    let filtered = [...documents];

    // Tab filtering
    if (activeTab === 1)
      filtered = filtered.filter((doc) => doc.status === 'PENDING');
    else if (activeTab === 2)
      filtered = filtered.filter((doc) => doc.status === 'APPROVED');

    // Additional filters
    if (filters.status !== 'all') {
      filtered = filtered.filter((doc) => doc.status === filters.status);
    }
    if (filters.documentType !== 'all') {
      filtered = filtered.filter(
        (doc) => doc.documentType === filters.documentType
      );
    }
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.user?.name?.toLowerCase().includes(searchLower) ||
          doc.user?.email?.toLowerCase().includes(searchLower) ||
          doc.documentType.toLowerCase().includes(searchLower) ||
          doc.fileName?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredDocuments(filtered);
    setPage(1);
  }, [documents, activeTab, filters]);

  // Apply filters when dependencies change
  useEffect(() => {
    filterDocuments();
  }, [filterDocuments]);

  // Selection handlers
  const handleSelectDoc = useCallback((docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDocs([]);
  }, []);

  const handleAction = useCallback(
    (doc: PendingDocument, action: 'approve' | 'reject' | 'preview') => {
      setActiveDoc(doc);
      setAdminComments('');
      setRejectReason('');

      switch (action) {
        case 'approve':
          setApproveDialogOpen(true);
          break;
        case 'reject':
          setRejectDialogOpen(true);
          break;
        case 'preview':
          setPreviewDialogOpen(true);
          break;
      }
    },
    []
  );

  const confirmApprove = useCallback(
    async (documentIds?: string[]) => {
      const idsToApprove =
        documentIds || (activeDoc ? [activeDoc.id] : selectedDocs);

      if (idsToApprove.length === 0) return;

      try {
        await axios.post('/admin/approve-documents', {
          documentIds: idsToApprove,
          adminComments,
        });
        setSnackbar({
          open: true,
          message: `${idsToApprove.length} document(s) approved successfully`,
          severity: 'success',
        });
        setApproveDialogOpen(false);
        setSelectedDocs([]);
        fetchData();
      } catch (err: unknown) {
        setSnackbar({
          open: true,
          message: getErrorMessage(err) || 'Approval failed',
          severity: 'error',
        });
      }
    },
    [activeDoc, adminComments, selectedDocs, fetchData]
  );

  const confirmReject = useCallback(
    async (documentIds?: string[]) => {
      const idsToReject =
        documentIds || (activeDoc ? [activeDoc.id] : selectedDocs);

      if (idsToReject.length === 0) return;
      if (!rejectReason.trim() && !activeDoc) {
        setSnackbar({
          open: true,
          message: 'Rejection reason is required',
          severity: 'error',
        });
        return;
      }

      try {
        await axios.post('/admin/reject-documents', {
          documentIds: idsToReject,
          reason: rejectReason,
          adminComments,
        });
        setSnackbar({
          open: true,
          message: `${idsToReject.length} document(s) rejected`,
          severity: 'success',
        });
        setRejectDialogOpen(false);
        setSelectedDocs([]);
        fetchData();
      } catch (err: unknown) {
        setSnackbar({
          open: true,
          message: getErrorMessage(err) || 'Rejection failed',
          severity: 'error',
        });
      }
    },
    [activeDoc, rejectReason, adminComments, selectedDocs, fetchData]
  );

  const handleDownload = useCallback(
    async (doc: PendingDocument) => {
      try {
        const response = await axios.get(doc.documentUrl, {
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.fileName || `document-${doc.id}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        showNotification?.('Download failed. ' + getErrorMessage(err), 'error');
      }
    },
    [showNotification]
  );

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
      setSelectedDocs([]);
    },
    []
  );

  const handlePageChange = useCallback(
    (_: React.ChangeEvent<unknown>, value: number) => {
      setPage(value);
    },
    []
  );

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      documentType: 'all',
      search: '',
    });
  }, []);

  const pendingCount = documents.filter(
    (doc) => doc.status === 'PENDING'
  ).length;

  const paginatedDocuments = filteredDocuments.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleSelectAll = useCallback(() => {
    if (selectedDocs.length === paginatedDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(paginatedDocuments.map((doc) => doc.id));
    }
  }, [paginatedDocuments, selectedDocs.length]);

  // Mobile-friendly table row component
  const MobileDocumentRow = ({ doc }: { doc: PendingDocument }) => (
    <Card sx={{ mb: 2, p: 2 }} variant="outlined">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
        }}
      >
        {batchMode && (
          <Checkbox
            checked={selectedDocs.includes(doc.id)}
            onChange={() => handleSelectDoc(doc.id)}
            size="small"
          />
        )}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar src={doc.user?.avatar} sx={{ width: 32, height: 32 }}>
              <Person />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="medium">
                {doc.user?.name || 'Unknown User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {doc.user?.email || doc.userId}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={doc.status}
            color={statusColors[doc.status]}
            size="small"
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {doc.documentType}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Submitted:{' '}
            {doc.submittedAt
              ? new Date(doc.submittedAt).toLocaleDateString()
              : '-'}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => handleAction(doc, 'preview')}
        >
          View
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Download">
            <IconButton size="small" onClick={() => handleDownload(doc)}>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open in new tab">
            <IconButton
              component="a"
              href={doc.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
            >
              <OpenInNew />
            </IconButton>
          </Tooltip>
          {doc.status === 'PENDING' && (
            <>
              <Tooltip title="Approve">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleAction(doc, 'approve')}
                >
                  <CheckCircle />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleAction(doc, 'reject')}
                >
                  <Cancel />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              color="primary"
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', sm: '2rem' } }}
            >
              Document Verification
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and verify user-submitted documents
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <TextField
              size="small"
              placeholder="Search documents..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
              sx={{
                flex: { xs: 1, sm: 'none' },
                minWidth: { xs: 'auto', sm: 250 },
              }}
            />
            <Tooltip title="Filters">
              <IconButton
                onClick={() => setFilterDrawerOpen(true)}
                color="primary"
              >
                <Badge
                  badgeContent={
                    Object.values(filters).filter(
                      (v) => v !== 'all' && v !== ''
                    ).length
                  }
                  color="error"
                >
                  <FilterList />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                onClick={fetchData}
                color="primary"
                disabled={loading}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Card
              variant="outlined"
              sx={{
                textAlign: 'center',
                p: 2,
                bgcolor: 'warning.light',
                border: 'none',
              }}
            >
              <Typography variant="h4" color="warning.dark" fontWeight="bold">
                {pendingCount}
              </Typography>
              <Typography variant="body2" color="warning.dark">
                Pending Review
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="text.secondary" fontWeight="bold">
                {documents.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Documents
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="text.secondary" fontWeight="bold">
                {filteredDocuments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Filtered
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Batch Controls */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={batchMode}
                onChange={(e) => {
                  setBatchMode(e.target.checked);
                  if (!e.target.checked) setSelectedDocs([]);
                }}
                color="primary"
              />
            }
            label="Batch Mode"
          />

          {batchMode && selectedDocs.length > 0 && (
            <Zoom in={batchMode && selectedDocs.length > 0}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flex: 1,
                  minWidth: { xs: '100%', sm: 'auto' },
                }}
              >
                <Card
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    flex: 1,
                  }}
                >
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1,
                      }}
                    >
                      <Typography variant="subtitle1">
                        {selectedDocs.length} document(s) selected
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          startIcon={<CheckCircle />}
                          variant="contained"
                          color="success"
                          onClick={() => setApproveDialogOpen(true)}
                          size="small"
                          sx={{ color: 'white' }}
                        >
                          Approve
                        </Button>
                        <Button
                          startIcon={<Cancel />}
                          variant="contained"
                          color="error"
                          onClick={() => setRejectDialogOpen(true)}
                          size="small"
                          sx={{ color: 'white' }}
                        >
                          Reject
                        </Button>
                        <Button
                          startIcon={<Deselect />}
                          variant="outlined"
                          size="small"
                          sx={{ color: 'white', borderColor: 'white' }}
                          onClick={clearSelection}
                        >
                          Clear
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Zoom>
          )}
        </Box>
      </Box>

      {/* Main Content */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
          >
            <Tab label="All Documents" />
            <Tab
              label={
                <Badge
                  badgeContent={pendingCount}
                  color="warning"
                  showZero={false}
                >
                  Pending Review
                </Badge>
              }
            />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading documents...</Typography>
          </Box>
        ) : isMobile ? (
          /* Mobile View */
          <Box sx={{ p: 2 }}>
            {batchMode && paginatedDocuments.length > 0 && (
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <Checkbox
                  indeterminate={
                    selectedDocs.length > 0 &&
                    selectedDocs.length < paginatedDocuments.length
                  }
                  checked={
                    paginatedDocuments.length > 0 &&
                    selectedDocs.length === paginatedDocuments.length
                  }
                  onChange={handleSelectAll}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  Select all ({selectedDocs.length} selected)
                </Typography>
              </Box>
            )}

            {paginatedDocuments.map((doc) => (
              <MobileDocumentRow key={doc.id} doc={doc} />
            ))}

            {paginatedDocuments.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No documents found matching your criteria
                </Typography>
                {Object.values(filters).some(
                  (v) => v !== 'all' && v !== ''
                ) && (
                  <Button onClick={clearFilters} sx={{ mt: 1 }}>
                    Clear Filters
                  </Button>
                )}
              </Box>
            )}
          </Box>
        ) : (
          /* Desktop View */
          <>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {filteredDocuments.length} documents
              </Typography>

              {batchMode && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Select All">
                    <IconButton size="small" onClick={handleSelectAll}>
                      <SelectAll />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDocs.length} selected
                  </Typography>
                </Box>
              )}
            </Box>

            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  {batchMode && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedDocs.length > 0 &&
                          selectedDocs.length < paginatedDocuments.length
                        }
                        checked={
                          paginatedDocuments.length > 0 &&
                          selectedDocs.length === paginatedDocuments.length
                        }
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                  )}
                  <TableCell>User</TableCell>
                  <TableCell>Document Type</TableCell>
                  <TableCell>File</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDocuments.map((doc) => (
                  <TableRow
                    key={doc.id}
                    hover
                    selected={selectedDocs.includes(doc.id)}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    {batchMode && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedDocs.includes(doc.id)}
                          onChange={() => handleSelectDoc(doc.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Avatar
                          src={doc.user?.avatar}
                          sx={{ width: 40, height: 40 }}
                        >
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography fontWeight="medium">
                            {doc.user?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {doc.user?.email || doc.userId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.documentType}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Description color="action" />
                        <Box>
                          <Link
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAction(doc, 'preview');
                            }}
                            sx={{ cursor: 'pointer' }}
                          >
                            {doc.fileName || 'View Document'}
                          </Link>
                          {doc.fileSize && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {doc.fileSize}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          {doc.submittedAt
                            ? new Date(doc.submittedAt).toLocaleDateString()
                            : '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status}
                        color={statusColors[doc.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 1,
                        }}
                      >
                        <Tooltip title="Preview">
                          <IconButton
                            size="small"
                            onClick={() => handleAction(doc, 'preview')}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open in new tab">
                          <IconButton
                            component="a"
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                          >
                            <OpenInNew />
                          </IconButton>
                        </Tooltip>
                        {doc.status === 'PENDING' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleAction(doc, 'approve')}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleAction(doc, 'reject')}
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

            {paginatedDocuments.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  No documents found matching your criteria
                </Typography>
                {Object.values(filters).some(
                  (v) => v !== 'all' && v !== ''
                ) && <Button onClick={clearFilters}>Clear Filters</Button>}
              </Box>
            )}
          </>
        )}

        {/* Pagination */}
        {filteredDocuments.length > rowsPerPage && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(filteredDocuments.length / rowsPerPage)}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size={isSmallMobile ? 'small' : 'medium'}
            />
          </Box>
        )}
      </Paper>

      {/* Filter Drawer for Mobile */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setFilterDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Divider />

          <Box sx={{ mt: 2 }}>
            {/* <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
              </Select>
            </FormControl> */}

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={filters.documentType}
                label="Document Type"
                onChange={(e) =>
                  handleFilterChange('documentType', e.target.value)
                }
              >
                <MenuItem value="all">All Types</MenuItem>
                {documentTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              startIcon={<Close />}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Dialogs remain the same */}
      <Dialog
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            {activeDoc
              ? 'Approve Document'
              : `Approve ${selectedDocs.length} Document(s)`}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {activeDoc
              ? 'You are about to approve this document. Optionally leave comments for the user.'
              : `You are about to approve ${selectedDocs.length} document(s). Optionally leave comments for the users.`}
          </Typography>
          <TextField
            fullWidth
            label="Comments (optional)"
            multiline
            minRows={3}
            value={adminComments}
            onChange={(e) => setAdminComments(e.target.value)}
            placeholder="Add any notes or instructions for the user..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() =>
              activeDoc ? confirmApprove() : confirmApprove(selectedDocs)
            }
          >
            {activeDoc
              ? 'Approve Document'
              : `Approve ${selectedDocs.length} Document(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Cancel color="error" />
            {activeDoc
              ? 'Reject Document'
              : `Reject ${selectedDocs.length} Document(s)`}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {activeDoc
              ? 'Please provide a reason for rejection. This will be shared with the user.'
              : `Please provide a reason for rejecting ${selectedDocs.length} document(s). This will be shared with the users.`}
          </Typography>
          <TextField
            fullWidth
            label="Rejection reason *"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            margin="normal"
            required={!activeDoc}
            placeholder="Specify why the document(s) are being rejected..."
          />
          <TextField
            fullWidth
            label="Additional comments (optional)"
            multiline
            minRows={2}
            value={adminComments}
            onChange={(e) => setAdminComments(e.target.value)}
            placeholder="Add any additional feedback or instructions..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() =>
              activeDoc ? confirmReject() : confirmReject(selectedDocs)
            }
            disabled={!activeDoc && !rejectReason.trim()}
          >
            {activeDoc
              ? 'Reject Document'
              : `Reject ${selectedDocs.length} Document(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Document Preview - {activeDoc?.documentType}</DialogTitle>
        <DialogContent>
          {activeDoc && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <img
                src={activeDoc.documentUrl}
                alt="Document preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          {activeDoc && (
            <Button
              startIcon={<Download />}
              onClick={() => handleDownload(activeDoc)}
            >
              Download
            </Button>
          )}
          {activeDoc && (
            <Button
              component="a"
              href={activeDoc.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<OpenInNew />}
            >
              Open in new tab
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Mobile */}
      {isMobile && batchMode && selectedDocs.length > 0 && (
        <Fab
          color="primary"
          variant="extended"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => {
            // Show quick actions menu
            setApproveDialogOpen(true);
          }}
        >
          <CheckCircle sx={{ mr: 1 }} />
          {selectedDocs.length}
        </Fab>
      )}
    </Container>
  );
};

export default DocumentVerification;
