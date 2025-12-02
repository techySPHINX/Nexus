# Admin Module - Frontend Integration Guide

## Overview
This guide helps frontend developers integrate the advanced admin filtering and management features.

## 🎨 UI Components Needed

### 1. Advanced Filter Panel

```typescript
// types/admin.types.ts
export interface DocumentFilter {
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: 'submittedAt' | 'userName' | 'graduationYear' | 'role' | 'department';
  sortOrder?: 'asc' | 'desc';
  
  // User filters
  graduationYear?: number;
  graduationYearFrom?: number;
  graduationYearTo?: number;
  role?: 'STUDENT' | 'ALUMNI';
  searchName?: string;
  searchEmail?: string;
  
  // Profile filters
  department?: string;
  branch?: string;
  course?: string;
  year?: string;
  location?: string;
  
  // Document filters
  documentType?: string;
  submittedAfter?: string;
  submittedBefore?: string;
  
  // Stats
  includeStats?: boolean;
}

export interface PendingDocumentResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats?: {
    total: number;
    byRole: { STUDENT: number; ALUMNI: number };
    byDepartment: Record<string, number>;
    byGraduationYear: Record<string, number>;
    avgWaitingTime: number;
  };
}
```

### 2. Filter Component (React Example)

```tsx
// components/AdminDocumentFilters.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Chip,
} from '@mui/material';

interface FilterOptions {
  departments: string[];
  branches: string[];
  courses: string[];
  graduationYears: number[];
  locations: string[];
  roles: string[];
  documentTypes: string[];
}

export const AdminDocumentFilters: React.FC<{
  onFilterChange: (filters: DocumentFilter) => void;
}> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<DocumentFilter>({
    page: 1,
    limit: 20,
    sortBy: 'submittedAt',
    sortOrder: 'asc',
  });
  
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  // Load filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    const response = await fetch('/api/admin/filter-options', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const data = await response.json();
    setFilterOptions(data);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 }; // Reset to page 1
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const resetFilters = {
      page: 1,
      limit: 20,
      sortBy: 'submittedAt' as const,
      sortOrder: 'asc' as const,
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const activeFilterCount = Object.keys(filters).filter(
    key => !['page', 'limit', 'sortBy', 'sortOrder'].includes(key) && filters[key]
  ).length;

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h3>Filters {activeFilterCount > 0 && `(${activeFilterCount} active)`}</h3>
        <Button onClick={clearFilters} variant="outlined" size="small">
          Clear All
        </Button>
      </Box>

      <Grid container spacing={2}>
        {/* Search */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search by Name"
            value={filters.searchName || ''}
            onChange={(e) => handleFilterChange('searchName', e.target.value)}
            placeholder="Enter student/alumni name"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search by Email"
            value={filters.searchEmail || ''}
            onChange={(e) => handleFilterChange('searchEmail', e.target.value)}
            placeholder="Enter email address"
          />
        </Grid>

        {/* Role */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              label="Role"
            >
              <MenuItem value="">All</MenuItem>
              {filterOptions?.roles.map(role => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Department */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={filters.department || ''}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              label="Department"
            >
              <MenuItem value="">All</MenuItem>
              {filterOptions?.departments.map(dept => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Graduation Year */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Graduation Year</InputLabel>
            <Select
              value={filters.graduationYear || ''}
              onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
              label="Graduation Year"
            >
              <MenuItem value="">All</MenuItem>
              {filterOptions?.graduationYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Branch */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Branch</InputLabel>
            <Select
              value={filters.branch || ''}
              onChange={(e) => handleFilterChange('branch', e.target.value)}
              label="Branch"
            >
              <MenuItem value="">All</MenuItem>
              {filterOptions?.branches.map(branch => (
                <MenuItem key={branch} value={branch}>{branch}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Course */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Course</InputLabel>
            <Select
              value={filters.course || ''}
              onChange={(e) => handleFilterChange('course', e.target.value)}
              label="Course"
            >
              <MenuItem value="">All</MenuItem>
              {filterOptions?.courses.map(course => (
                <MenuItem key={course} value={course}>{course}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Document Type */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={filters.documentType || 'ALL'}
              onChange={(e) => handleFilterChange('documentType', e.target.value)}
              label="Document Type"
            >
              <MenuItem value="ALL">All Types</MenuItem>
              {filterOptions?.documentTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Sorting */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy || 'submittedAt'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              label="Sort By"
            >
              <MenuItem value="submittedAt">Submitted Date</MenuItem>
              <MenuItem value="userName">User Name</MenuItem>
              <MenuItem value="graduationYear">Graduation Year</MenuItem>
              <MenuItem value="role">Role</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Sort Order</InputLabel>
            <Select
              value={filters.sortOrder || 'asc'}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              label="Sort Order"
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};
```

### 3. Document List Component

```tsx
// components/PendingDocumentsList.tsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Chip,
  Avatar,
  Box,
  Pagination,
} from '@mui/material';

export const PendingDocumentsList: React.FC<{
  filters: DocumentFilter;
}> = ({ filters }) => {
  const [response, setResponse] = useState<PendingDocumentResponse | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [filters]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/admin/pending-documents?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const data = await response.json();
      setResponse(data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocs(response?.data.map(doc => doc.id) || []);
    } else {
      setSelectedDocs([]);
    }
  };

  const handleSelectDoc = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocs([...selectedDocs, docId]);
    } else {
      setSelectedDocs(selectedDocs.filter(id => id !== docId));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedDocs.length === 0) return;

    setLoading(true);
    try {
      const result = await fetch('/api/admin/approve-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          documentIds: selectedDocs,
          adminComments: 'Bulk approved',
        }),
      });

      const data = await result.json();

      // Show detailed results to admin
      if (data.stats.successCount > 0) {
        toast.success(`✅ Successfully approved ${data.stats.successCount} user(s)`);
      }

      if (data.stats.alreadyApprovedCount > 0) {
        toast.info(`ℹ️ ${data.stats.alreadyApprovedCount} user(s) already approved`);
      }

      if (data.stats.failedCount > 0) {
        toast.error(`❌ Failed to approve ${data.stats.failedCount} user(s)`);
        // Show details of failures
        data.failed.forEach((failure: any) => {
          console.error(`Failed for ${failure.email}: ${failure.reason}`);
        });
      }

      // Show detailed modal with results
      setApprovalResults({
        successful: data.successful,
        failed: data.failed,
        alreadyApproved: data.alreadyApproved,
      });
      setShowResultsModal(true);

      setSelectedDocs([]);
      fetchDocuments(); // Refresh list
    } catch (error) {
      console.error('Bulk approve failed:', error);
      toast.error('Failed to process bulk approval');
    } finally {
      setLoading(false);
    }
  };

  if (!response) return <div>Loading...</div>;

  return (
    <Box>
      {/* Statistics Bar */}
      {response.stats && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <strong>Total:</strong> {response.stats.total}
            </Grid>
            <Grid item xs={3}>
              <strong>Students:</strong> {response.stats.byRole.STUDENT}
            </Grid>
            <Grid item xs={3}>
              <strong>Alumni:</strong> {response.stats.byRole.ALUMNI}
            </Grid>
            <Grid item xs={3}>
              <strong>Avg Wait:</strong> {response.stats.avgWaitingTime.toFixed(1)}h
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Bulk Actions */}
      {selectedDocs.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleBulkApprove}
          >
            Approve {selectedDocs.length} Selected
          </Button>
        </Box>
      )}

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={selectedDocs.length === response.data.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </TableCell>
            <TableCell>User</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Graduation Year</TableCell>
            <TableCell>Document Type</TableCell>
            <TableCell>Submitted</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {response.data.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedDocs.includes(doc.id)}
                  onChange={(e) => handleSelectDoc(doc.id, e.target.checked)}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={doc.user.iconUrl} />
                  <div>
                    <div>{doc.user.name}</div>
                    <div style={{ fontSize: '0.8em', color: 'gray' }}>
                      {doc.user.email}
                    </div>
                  </div>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={doc.user.role}
                  color={doc.user.role === 'STUDENT' ? 'primary' : 'secondary'}
                  size="small"
                />
              </TableCell>
              <TableCell>{doc.user.profile?.dept || 'N/A'}</TableCell>
              <TableCell>{doc.user.graduationYear || 'N/A'}</TableCell>
              <TableCell>{doc.documentType}</TableCell>
              <TableCell>
                {new Date(doc.submittedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button size="small" onClick={() => window.open(doc.documentUrl)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={response.pagination.totalPages}
          page={response.pagination.page}
          onChange={(_, page) => filters.page = page}
          color="primary"
        />
      </Box>
    </Box>
  );
};
```

### 4. Main Admin Page

```tsx
// pages/AdminDashboard.tsx
import React, { useState } from 'react';
import { Container, Tabs, Tab, Box } from '@mui/material';
import { AdminDocumentFilters } from '../components/AdminDocumentFilters';
import { PendingDocumentsList } from '../components/PendingDocumentsList';
import { DashboardStats } from '../components/DashboardStats';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<DocumentFilter>({
    page: 1,
    limit: 20,
    includeStats: true,
  });

  return (
    <Container maxWidth="xl">
      <h1>Admin Dashboard</h1>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab label="Pending Documents" />
        <Tab label="Statistics" />
        <Tab label="User Management" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && (
          <>
            <AdminDocumentFilters onFilterChange={setFilters} />
            <PendingDocumentsList filters={filters} />
          </>
        )}
        {activeTab === 1 && <DashboardStats />}
        {activeTab === 2 && <div>User Management (Coming Soon)</div>}
      </Box>
    </Container>
  );
};
```

## 🔄 API Service Functions

```typescript
// services/adminService.ts
const API_BASE = '/api/admin';

export const adminService = {
  // Get pending documents with filters
  async getPendingDocuments(filters: DocumentFilter) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/pending-documents?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },

  // Get filter options
  async getFilterOptions() {
    const response = await fetch(`${API_BASE}/filter-options`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },

  // Approve documents
  async approveDocuments(documentIds: string[], adminComments?: string) {
    const response = await fetch(`${API_BASE}/approve-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ documentIds, adminComments }),
    });
    return response.json();
    // Returns: {
    //   message: string,
    //   totalProcessed: number,
    //   successful: Array<{ userId, email, userName }>,
    //   failed: Array<{ userId, email, reason }>,
    //   alreadyApproved: Array<{ userId, email }>,
    //   stats: { successCount, failedCount, alreadyApprovedCount }
    // }
  },

  // Reject documents
  async rejectDocuments(documentIds: string[], reason: string, adminComments?: string) {
    const response = await fetch(`${API_BASE}/reject-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ documentIds, reason, adminComments }),
    });
    return response.json();
    // Returns: {
    //   message: string,
    //   totalProcessed: number,
    //   successful: Array<{ userId, email, userName }>,
    //   failed: Array<{ userId, email, reason }>,
    //   stats: { successCount, failedCount }
    // }
  },

  // Bulk approve by filters (now supports multiple users!)
  async bulkApprove(filters: DocumentFilter, adminComments?: string) {
    const response = await fetch(`${API_BASE}/bulk-approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ filters, adminComments }),
    });
    return response.json();
    // Returns same structure as approveDocuments with batch results
  },

  // Bulk reject by filters (now supports multiple users!)
  async bulkReject(filters: DocumentFilter, reason: string, adminComments?: string) {
    const response = await fetch(`${API_BASE}/bulk-reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ filters, reason, adminComments }),
    });
    return response.json();
    // Returns same structure as rejectDocuments with batch results
  },

  // Dashboard stats
  async getDashboardStats() {
    const response = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },

  // User search
  async searchUsers(filters: any) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE}/users/search?${params}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.json();
  },
};
```

## 🎯 Key UX Features to Implement

### Batch Results Modal Component

```tsx
// components/BatchApprovalResults.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

interface BatchResult {
  successful: Array<{ userId: string; email: string; userName: string }>;
  failed: Array<{ userId: string; email: string; reason: string }>;
  alreadyApproved?: Array<{ userId: string; email: string }>;
}

export const BatchApprovalResults: React.FC<{
  open: boolean;
  onClose: () => void;
  results: BatchResult;
}> = ({ open, onClose, results }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Batch Approval Results</DialogTitle>
      <DialogContent>
        {/* Summary Stats */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {results.successful.length > 0 && (
            <Chip
              icon={<CheckCircleIcon />}
              label={`${results.successful.length} Successful`}
              color="success"
              variant="outlined"
            />
          )}
          {results.failed.length > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${results.failed.length} Failed`}
              color="error"
              variant="outlined"
            />
          )}
          {(results.alreadyApproved?.length || 0) > 0 && (
            <Chip
              icon={<InfoIcon />}
              label={`${results.alreadyApproved?.length} Already Approved`}
              color="info"
              variant="outlined"
            />
          )}
        </Box>

        {/* Successful Approvals */}
        {results.successful.length > 0 && (
          <>
            <Typography variant="h6" color="success.main" gutterBottom>
              ✅ Successfully Approved
            </Typography>
            <List dense>
              {results.successful.map((item) => (
                <ListItem key={item.userId}>
                  <ListItemText
                    primary={item.userName}
                    secondary={item.email}
                  />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Failed Approvals */}
        {results.failed.length > 0 && (
          <>
            <Typography variant="h6" color="error.main" gutterBottom>
              ❌ Failed Approvals
            </Typography>
            <List dense>
              {results.failed.map((item) => (
                <ListItem key={item.userId}>
                  <ListItemText
                    primary={item.email}
                    secondary={`Reason: ${item.reason}`}
                  />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Already Approved */}
        {(results.alreadyApproved?.length || 0) > 0 && (
          <>
            <Typography variant="h6" color="info.main" gutterBottom>
              ℹ️ Already Approved
            </Typography>
            <List dense>
              {results.alreadyApproved?.map((item) => (
                <ListItem key={item.userId}>
                  <ListItemText primary={item.email} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

### Usage in Main Component

```tsx
const [approvalResults, setApprovalResults] = useState<BatchResult | null>(null);
const [showResultsModal, setShowResultsModal] = useState(false);

// After bulk approval
const handleBulkApprove = async () => {
  const result = await adminService.approveDocuments(selectedDocs);
  setApprovalResults(result);
  setShowResultsModal(true);
};

return (
  <>
    {/* ...existing code... */}
    
    {approvalResults && (
      <BatchApprovalResults
        open={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        results={approvalResults}
      />
    )}
  </>
);
```

1. **Smart Filter Persistence**: Save filter state in localStorage or URL params
2. **Real-time Stats**: Show live counts as filters change
3. **Keyboard Shortcuts**: Quick actions for power users
4. **Export Functionality**: CSV/PDF export of filtered results
5. **Visual Indicators**: Color-coded urgency (old submissions)
6. **Batch Preview**: Preview documents before bulk approval
7. **Filter Presets**: Save common filter combinations
8. **Mobile Responsive**: Touch-friendly bulk selection

## 📱 Mobile Considerations

```tsx
// Mobile-friendly filter panel
<Drawer anchor="bottom" open={showFilters}>
  <AdminDocumentFilters onFilterChange={setFilters} />
</Drawer>
```

## 🚀 Performance Tips

1. **Debounce search inputs** (300ms recommended)
2. **Use virtual scrolling** for large lists
3. **Cache filter options** (refresh every 5 minutes)
4. **Lazy load document images**
5. **Implement infinite scroll** as alternative to pagination
6. **Show loading skeletons** during fetch

## 🔍 Testing Examples

```typescript
// Test filter combinations
describe('Admin Filters', () => {
  it('should filter by department and year', async () => {
    const filters = {
      department: 'CSE',
      graduationYear: 2024,
      page: 1,
      limit: 20,
    };
    
    const result = await adminService.getPendingDocuments(filters);
    expect(result.data.every(doc => 
      doc.user.profile.dept === 'CSE' &&
      doc.user.graduationYear === 2024
    )).toBe(true);
  });
});
```

This guide provides everything needed for a production-grade admin interface! 🎉
