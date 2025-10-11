import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Description,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface DocumentUpload {
  file: File;
  documentType: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

interface DocumentUploadComponentProps {
  onDocumentsChange: (
    documents: Array<{ documentType: string; documentUrl: string }>
  ) => void;
  userRole: 'STUDENT' | 'ALUM';
}

const STUDENT_DOCUMENT_TYPES = [
  { value: 'STUDENT_ID', label: 'Student ID Card' },
  { value: 'TRANSCRIPT', label: 'Academic Transcript' },
];

const ALUMNI_DOCUMENT_TYPES = [
  { value: 'DEGREE_CERTIFICATE', label: 'Degree Certificate' },
  { value: 'ALUMNI_CERTIFICATE', label: 'Alumni Certificate' },
  { value: 'EMPLOYMENT_PROOF', label: 'Employment Proof (Optional)' },
];

const DocumentUploadComponent: React.FC<DocumentUploadComponentProps> = ({
  onDocumentsChange,
  userRole,
}) => {
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const documentTypes =
    userRole === 'STUDENT' ? STUDENT_DOCUMENT_TYPES : ALUMNI_DOCUMENT_TYPES;

  const handleFileSelect = (files: FileList | null, documentType?: string) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      if (
        !['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(
          file.type
        )
      ) {
        alert(
          `File ${file.name} has an unsupported format. Please use PDF, JPG, or PNG.`
        );
        return;
      }

      const newDocument: DocumentUpload = {
        file,
        documentType: documentType || '',
        status: 'pending',
      };

      setDocuments((prev) => [...prev, newDocument]);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const uploadDocument = async (index: number) => {
    const document = documents[index];
    if (!document.documentType) {
      alert('Please select a document type first.');
      return;
    }

    setDocuments((prev) =>
      prev.map((doc, i) =>
        i === index ? { ...doc, status: 'uploading' } : doc
      )
    );

    try {
      const formData = new FormData();
      formData.append('file', document.file);
      formData.append('documentType', document.documentType);

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as { url: string };

      setDocuments((prev) =>
        prev.map((doc, i) =>
          i === index ? { ...doc, status: 'success', url: result.url } : doc
        )
      );
    } catch {
      setDocuments((prev) =>
        prev.map((doc, i) =>
          i === index
            ? { ...doc, status: 'error', error: 'Upload failed' }
            : doc
        )
      );
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDocumentType = (index: number, documentType: string) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, documentType } : doc))
    );
  };

  useEffect(() => {
    const validDocuments = documents
      .filter((doc) => doc.status === 'success' && doc.url)
      .map((doc) => ({
        documentType: doc.documentType,
        documentUrl: doc.url!,
      }));
    onDocumentsChange(validDocuments);
  }, [documents, onDocumentsChange]);

  const getStatusIcon = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'uploading':
        return (
          <Box sx={{ width: 20 }}>
            <LinearProgress />
          </Box>
        );
      default:
        return <Description color="action" />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Document Verification
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Please upload the required documents to verify your{' '}
        {userRole.toLowerCase()} status at KIIT. All documents should be clear
        and valid.
      </Typography>

      {/* Upload Area */}
      <Paper
        elevation={0}
        sx={{
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          mb: 3,
          bgcolor: dragOver ? 'primary.50' : 'background.paper',
          transition: 'all 0.3s ease',
        }}
        onDrop={handleDrop}
        onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = '.pdf,.jpg,.jpeg,.png';
          input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            handleFileSelect(target.files);
          };
          input.click();
        }}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drag & drop files here or click to browse
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported formats: PDF, JPG, PNG (Max 10MB each)
        </Typography>
      </Paper>

      {/* Required Documents Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Required Documents for{' '}
          {userRole === 'STUDENT' ? 'Students' : 'Alumni'}:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {documentTypes.map((type) => (
            <li key={type.value}>
              <Typography variant="body2">{type.label}</Typography>
            </li>
          ))}
        </ul>
      </Alert>

      {/* Document List */}
      {documents.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Uploaded Documents
          </Typography>
          {documents.map((document, index) => (
            <motion.div
              key={document.file.name + index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {getStatusIcon(document.status)}

                <Box flex={1}>
                  <Typography variant="body1" fontWeight={500}>
                    {document.file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(document.file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Document Type</InputLabel>
                  <Select
                    value={document.documentType}
                    label="Document Type"
                    onChange={(e) => updateDocumentType(index, e.target.value)}
                    disabled={document.status === 'uploading'}
                  >
                    {documentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box display="flex" gap={1}>
                  {document.status === 'pending' && !!document.documentType && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => uploadDocument(index)}
                      disabled={documents[index].status === 'uploading'}
                    >
                      Upload
                    </Button>
                  )}
                  <IconButton
                    onClick={() => removeDocument(index)}
                    disabled={document.status === 'uploading'}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Paper>
            </motion.div>
          ))}
        </Box>
      )}

      {/* Status Summary */}
      {documents.length > 0 && (
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Upload Status:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip label={`Total: ${documents.length}`} variant="outlined" />
            <Chip
              label={`Uploaded: ${
                documents.filter((d) => d.status === 'success').length
              }`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`Pending: ${
                documents.filter((d) => d.status === 'pending').length
              }`}
              color="warning"
              variant="outlined"
            />
            {documents.some((d) => d.status === 'error') && (
              <Chip
                label={`Failed: ${
                  documents.filter((d) => d.status === 'error').length
                }`}
                color="error"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DocumentUploadComponent;
