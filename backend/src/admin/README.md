# Admin Module - Advanced Document Verification & Management

## Overview

The Admin module provides production-grade administrative capabilities for managing user document verification, platform monitoring, and user management with advanced filtering, pagination, and bulk operations.

## 🎯 Key Features

### 1. Advanced Document Verification Filtering

- **Multi-dimensional filtering** on user attributes, profile data, and document types
- **Pagination & Sorting** for efficient data handling
- **Real-time statistics** for monitoring pending requests
- **Bulk operations** for efficient document processing

### 2. Platform Monitoring

- **Dashboard statistics** with user metrics, verification stats, and platform activity
- **Health monitoring** with security metrics and system status
- **Activity reports** with configurable time ranges

### 3. User Management

- **Advanced search** with multiple filter criteria
- **Detailed user profiles** with complete activity history
- **Secure access control** with role-based guards

## 📡 API Endpoints

### Document Verification

#### GET /admin/pending-documents

Get pending document verification requests with advanced filtering.

**Query Parameters:**

```typescript
{
  // Pagination
  page?: number;              // Default: 1
  limit?: number;             // Default: 20, Max: 100

  // Sorting
  sortBy?: 'submittedAt' | 'userName' | 'graduationYear' | 'role' | 'department';
  sortOrder?: 'asc' | 'desc'; // Default: 'asc'

  // User Filters
  graduationYear?: number;
  graduationYearFrom?: number;
  graduationYearTo?: number;
  role?: 'STUDENT' | 'ALUMNI';
  searchName?: string;
  searchEmail?: string;
  accountStatus?: string;

  // Profile Filters
  department?: string;        // dept field
  branch?: string;
  course?: string;
  year?: string;             // Academic year
  location?: string;

  // Document Filters
  documentType?: 'ALL' | 'STUDENT_ID' | 'ALUMNI_PROOF' | 'GRADUATION_CERTIFICATE' | 'ENROLLMENT_LETTER' | 'OTHERS';
  documentTypes?: string[];  // Multiple types

  // Date Filters
  submittedAfter?: string;   // ISO date string
  submittedBefore?: string;  // ISO date string

  // Include Statistics
  includeStats?: boolean;    // Default: false
}
```

**Example Requests:**

```bash
# Get all CSE students from 2024
GET /admin/pending-documents?department=CSE&graduationYear=2024&role=STUDENT

# Get alumni with graduation year between 2020-2023, sorted by name
GET /admin/pending-documents?role=ALUMNI&graduationYearFrom=2020&graduationYearTo=2023&sortBy=userName&sortOrder=asc

# Search by name with pagination
GET /admin/pending-documents?searchName=John&page=2&limit=10

# Get stats with first page
GET /admin/pending-documents?includeStats=true&limit=20

# Filter by multiple departments and document types
GET /admin/pending-documents?department=CSE&documentType=STUDENT_ID

# Get documents submitted in last 7 days
GET /admin/pending-documents?submittedAfter=2024-11-24T00:00:00Z
```

**Response:**

```json
{
  "data": [
    {
      "id": "doc-uuid",
      "documentType": "STUDENT_ID",
      "documentUrl": "https://...",
      "status": "PENDING",
      "submittedAt": "2024-12-01T10:00:00Z",
      "user": {
        "id": "user-uuid",
        "email": "student@example.com",
        "name": "John Doe",
        "role": "STUDENT",
        "graduationYear": 2024,
        "accountStatus": "PENDING_DOCUMENT_REVIEW",
        "profile": {
          "dept": "CSE",
          "branch": "Computer Science",
          "course": "B.Tech",
          "year": "4",
          "location": "Bangalore",
          "studentId": "12345"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "stats": {
    "total": 45,
    "byRole": {
      "STUDENT": 30,
      "ALUMNI": 15
    },
    "byDepartment": {
      "CSE": 20,
      "ECE": 15,
      "ME": 10
    },
    "byGraduationYear": {
      "2024": 25,
      "2023": 10,
      "2022": 10
    },
    "byDocumentType": {
      "STUDENT_ID": 30,
      "ALUMNI_PROOF": 15
    },
    "avgWaitingTime": 48.5,
    "oldestRequest": "2024-11-15T10:00:00Z",
    "newestRequest": "2024-12-01T14:00:00Z"
  }
}
```

#### GET /admin/pending-documents/stats

Get only statistics without document data.

**Response:**

```json
{
  "total": 45,
  "byRole": { "STUDENT": 30, "ALUMNI": 15 },
  "byDepartment": { "CSE": 20, "ECE": 15 },
  "avgWaitingTime": 48.5
}
```

#### POST /admin/approve-documents

Approve document verification requests.

**Request Body:**

```json
{
  "documentIds": ["doc-uuid-1", "doc-uuid-2"],
  "adminComments": "Verified successfully"
}
```

**Response:**

```json
{
  "message": "Documents approved and user activated successfully",
  "userId": "user-uuid",
  "email": "student@example.com"
}
```

#### POST /admin/reject-documents

Reject document verification requests.

**Request Body:**

```json
{
  "documentIds": ["doc-uuid-1"],
  "reason": "Invalid document format or poor image quality",
  "adminComments": "Please resubmit with clearer images"
}
```

#### POST /admin/bulk-approve

Bulk approve documents matching filter criteria.

**Request Body:**

```json
{
  "filters": {
    "department": "CSE",
    "graduationYear": 2024,
    "role": "STUDENT"
  },
  "adminComments": "Bulk verification for CSE 2024 batch"
}
```

**Response:**

```json
{
  "message": "Bulk approved 15 documents",
  "approved": 15
}
```

#### GET /admin/filter-options

Get available filter options for dropdowns.

**Response:**

```json
{
  "departments": ["CSE", "ECE", "ME", "Civil"],
  "branches": ["Computer Science", "Electronics"],
  "courses": ["B.Tech", "M.Tech", "MBA"],
  "graduationYears": [2024, 2023, 2022],
  "locations": ["Bangalore", "Hyderabad"],
  "roles": ["STUDENT", "ALUMNI"],
  "documentTypes": ["STUDENT_ID", "ALUMNI_PROOF", "GRADUATION_CERTIFICATE"]
}
```

### Dashboard & Analytics

#### GET /admin/dashboard/stats

Get comprehensive dashboard statistics.

**Response:**

```json
{
  "users": {
    "total": 1500,
    "active": 1200,
    "inactive": 300
  },
  "verifications": {
    "pending": 45,
    "approvedToday": 12,
    "rejectedToday": 3
  },
  "platform": {
    "posts": 850,
    "projects": 120,
    "referrals": 200,
    "mentorships": 50
  }
}
```

#### GET /admin/dashboard/activity

Get user activity report.

**Query Parameters:**

- `days` - Number of days to look back (default: 7)

**Response:**

```json
{
  "period": "Last 7 days",
  "newUsers": 25,
  "activeSessions": 450,
  "newPosts": 85,
  "newProjects": 12
}
```

#### GET /admin/dashboard/health

Get platform health metrics.

**Response:**

```json
{
  "security": {
    "failedLogins": 5,
    "lockedAccounts": 2,
    "unverifiedEmails": 15,
    "recentSecurityEvents": 120
  },
  "status": "healthy",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

### User Management

#### GET /admin/users/search

Search users with advanced filters.

**Query Parameters:**

```typescript
{
  query?: string;           // Search by name or email
  role?: string;
  accountStatus?: string;
  graduationYear?: number;
  department?: string;
  page?: number;
  limit?: number;
}
```

**Example:**

```bash
GET /admin/users/search?query=john&role=STUDENT&department=CSE&page=1&limit=20
```

#### GET /admin/users/:userId

Get detailed user information.

**Response:**

```json
{
  "id": "user-uuid",
  "email": "student@example.com",
  "name": "John Doe",
  "role": "STUDENT",
  "profile": { ... },
  "verificationDocuments": [ ... ],
  "Post": [ ... ],
  "projects": [ ... ],
  "securityEvents": [ ... ]
}
```

#### GET /admin/user-documents

Get user's document verification history.

**Query Parameters:**

- `userId` - User ID (required)

## 🔒 Security

All endpoints are protected with:

- **JWT Authentication** (`JwtAuthGuard`)
- **Role-based Authorization** (`RolesGuard` with `@Roles('ADMIN')`)
- **Input Validation** (DTOs with class-validator)
- **SQL Injection Protection** (Prisma ORM)

## 📊 Production Features

### Performance

- **Efficient pagination** with skip/take
- **Indexed database queries** on frequently filtered fields
- **Selective field projection** to reduce data transfer
- **Batch operations** for bulk approvals

### User Experience

- **Rich filtering options** for precise document selection
- **Real-time statistics** for monitoring
- **Comprehensive error messages** with validation
- **Flexible sorting** on multiple fields

### Monitoring

- **Request logging** with Winston
- **Security event tracking**
- **Performance metrics**
- **Admin action audit trail**

## 🛠️ DTOs & Validation

### GetPendingDocumentsFilterDto

Comprehensive filter DTO with validation:

- Min/Max constraints on pagination
- Enum validation for sortBy, sortOrder, roles
- Date string validation
- Transform decorators for data normalization

### ApproveDocumentsDto

```typescript
{
  documentIds: string[];     // Min 1 item required
  adminComments?: string;
}
```

### RejectDocumentsDto

```typescript
{
  documentIds: string[];     // Min 1 item required
  reason: string;            // Min 10 characters
  adminComments?: string;
}
```

## 📝 Best Practices

1. **Always use pagination** for large datasets
2. **Include stats** only when needed (adds processing overhead)
3. **Use specific filters** to reduce result set
4. **Leverage bulk operations** for batch processing
5. **Monitor waiting times** to maintain good UX
6. **Use filter-options endpoint** to populate UI dropdowns

## 🔄 Workflow Examples

### Efficient Document Review Workflow

1. **Get filter options** to populate UI:

   ```bash
   GET /admin/filter-options
   ```

2. **Filter by department and year**:

   ```bash
   GET /admin/pending-documents?department=CSE&graduationYear=2024&includeStats=true
   ```

3. **Review and approve in bulk**:
   ```bash
   POST /admin/bulk-approve
   {
     "filters": { "department": "CSE", "graduationYear": 2024 },
     "adminComments": "Verified CSE 2024 batch"
   }
   ```

### Monitoring Dashboard Workflow

1. **Get overall stats**:

   ```bash
   GET /admin/dashboard/stats
   ```

2. **Check platform health**:

   ```bash
   GET /admin/dashboard/health
   ```

3. **Review recent activity**:
   ```bash
   GET /admin/dashboard/activity?days=7
   ```

## 🚀 Future Enhancements

- [ ] Export functionality (CSV, PDF)
- [ ] Email notifications for pending reviews
- [ ] Automated approval rules
- [ ] Document quality validation
- [ ] Real-time dashboard updates
- [ ] Advanced analytics with charts
- [ ] Role delegation for sub-admins
- [ ] Scheduled bulk operations

## 📚 Related Documentation

- [Authentication Guide](../../Authentication.md)
- [Prisma Schema](../../prisma/schema.prisma)
- [Security Best Practices](../Security.md)
