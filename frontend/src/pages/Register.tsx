import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Email, Person, School } from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import { getErrorMessage } from '@/utils/errorHandler';
import { Role } from '@/types/profileType';

enum DocumentTypes {
  STUDENT_ID = 'STUDENT_ID',
  TRANSCRIPT = 'TRANSCRIPT',
  DEGREE_CERTIFICATE = 'DEGREE_CERTIFICATE',
  ALUMNI_CERTIFICATE = 'ALUMNI_CERTIFICATE',
  EMPLOYMENT_PROOF = 'EMPLOYMENT_PROOF',
}

type DocumentItem = {
  documentType: DocumentTypes;
  documentUrl: string;
  fileName?: string;
};

type RegisterForm = {
  studentId?: string | undefined;
  graduationYear?: number | null;
  department?: string | undefined;
  documents: DocumentItem[];
  email: string;
  name: string;
  role: Role;
};

type RegisterWithDocsPayload = {
  email: string;
  name: string;
  role: Role;
  documents: { documentType: DocumentTypes; documentUrl: string }[];
  department?: string | undefined;
  graduationYear?: number | undefined;
  studentId?: string | undefined;
};

const initialForm: RegisterForm = {
  studentId: undefined,
  graduationYear: null,
  department: undefined,
  documents: [
    { documentType: DocumentTypes.STUDENT_ID, documentUrl: '', fileName: '' },
  ],
  email: '',
  name: '',
  role: Role.STUDENT,
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterForm>(initialForm);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { registerWithDocuments } = useAuth();
  const navigate = useNavigate();

  const handleChange =
    (field: keyof RegisterForm) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | SelectChangeEvent<string>
    ) => {
      const value = (event.target as HTMLInputElement).value;
      setFormData((prev) => ({ ...prev, [field]: value }) as RegisterForm);
    };

  const handleDocumentChange = (
    index: number,
    key: keyof DocumentItem,
    value: string
  ) => {
    setFormData((prev) => {
      const docs = prev.documents.slice();
      docs[index] = { ...docs[index], [key]: value } as DocumentItem;
      return { ...prev, documents: docs } as RegisterForm;
    });
  };

  /*
  Previously we supported selecting a local file and converting it to a base64 data URL
  which was stored in `documentUrl`. That logic is commented out because we now collect
  a direct URL from the user instead of uploading files during registration.

  Old implementation (kept for reference):

  const handleFileSelect = (index: number, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      handleDocumentChange(index, 'documentUrl', result);
      handleDocumentChange(index, 'fileName', file.name);
    };
    reader.readAsDataURL(file);
  };

  */

  const addDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          documentType: DocumentTypes.STUDENT_ID,
          documentUrl: '',
          fileName: '',
        },
      ],
    }));
  };

  // const removeDocument = (index: number) => {
  //   setFormData((prev) => {
  //     const docs = prev.documents.slice();
  //     docs.splice(index, 1);
  //     return { ...prev, documents: docs } as RegisterForm;
  //   });
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('Form Data:', formData);

    if (!formData.email.endsWith('@kiit.ac.in')) {
      setError('Email must be from kiit.ac.in domain');
      return;
    }

    setLoading(true);

    try {
      // prepare payload matching RegisterWithDocumentsDto
      const payload: RegisterWithDocsPayload = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        documents: formData.documents.map((d) => ({
          documentType: d.documentType,
          documentUrl: d.documentUrl || d.fileName || '',
        })),
        department: formData.department,
        graduationYear: formData.graduationYear ?? undefined,
        studentId: formData.studentId,
      };

      const message = await registerWithDocuments(
        payload.email,
        payload.name,
        payload.role,
        payload.documents,
        payload.department ?? undefined,
        payload.graduationYear ?? undefined,
        payload.studentId ?? undefined
      );

      navigate('/registration-success', {
        state: { message, requiresApproval: true },
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // (role icons were previously used for adornments; Select does not accept startAdornment)

  return (
    <Container maxWidth="sm">
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeToggle />
      </Box>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%' }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <School sx={{ color: 'white', fontSize: 30 }} />
                </Box>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{ fontWeight: 700 }}
                >
                  Join Nexus
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create your account to get started
                </Typography>
              </motion.div>
            </Box>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              </motion.div>
            )}

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={handleChange('name')}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
                margin="normal"
                helperText="Must be from kiit.ac.in domain"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={handleChange('role')}
                >
                  <MenuItem value={Role.STUDENT}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Student
                    </Box>
                  </MenuItem>
                  <MenuItem value={Role.ALUM}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Alumni
                    </Box>
                  </MenuItem>
                  <MenuItem value={Role.MENTOR}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Mentor
                    </Box>
                  </MenuItem>
                  <MenuItem value={Role.ADMIN}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Admin
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              {/* Documents UI */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Verification Documents
                </Typography>
                {formData.documents.map((doc: DocumentItem, idx: number) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 1,
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 2,
                      alignItems: { xs: 'stretch', md: 'center' },
                    }}
                  >
                    <FormControl sx={{ minWidth: 180, flex: '0 0 220px' }}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={doc.documentType}
                        label="Type"
                        onChange={(e) =>
                          handleDocumentChange(
                            idx,
                            'documentType',
                            (e.target as HTMLInputElement).value
                          )
                        }
                      >
                        {Object.values(DocumentTypes).map((dt) => (
                          <MenuItem key={dt} value={dt}>
                            {dt.replace('_', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {/* Document URL input (we accept a URL for now instead of file upload) */}
                    <TextField
                      fullWidth
                      label="Document URL"
                      value={doc.documentUrl}
                      onChange={(e) =>
                        handleDocumentChange(idx, 'documentUrl', e.target.value)
                      }
                      margin="normal"
                      sx={{ mx: 2, flex: 1, mt: { xs: 1, md: 0 } }}
                    />
                    {/* <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {doc.documentUrl ? 'File selected' : 'No file selected'}
                      </Typography>
                    </Box>
                    <Button color="error" onClick={() => removeDocument(idx)}>
                      Remove
                    </Button> */}
                  </Paper>
                ))}
                <Button onClick={addDocument} sx={{ mt: 1 }}>
                  Add another document
                </Button>
              </Box>
              {formData.role === 'STUDENT' && (
                <TextField
                  fullWidth
                  label="Student ID"
                  value={formData.studentId}
                  onChange={handleChange('studentId')}
                  required
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <School color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              )}
              {formData.role === 'STUDENT' && (
                <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                  <InputLabel id="graduation-year-label">
                    Graduation Year
                  </InputLabel>
                  <Select
                    labelId="graduation-year-label"
                    label="Graduation Year"
                    value={formData.graduationYear ?? ''}
                    onChange={(e) => {
                      const val = Number((e.target as HTMLInputElement).value);
                      setFormData((prev) => ({
                        ...prev,
                        graduationYear: isNaN(val) ? null : val,
                      }));
                    }}
                    required
                  >
                    {(() => {
                      const currentYear = new Date().getFullYear();
                      const start = currentYear - 8;
                      const years = Array.from({ length: 14 }).map(
                        (_, i) => start + i
                      );
                      return years.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ));
                    })()}
                  </Select>
                </FormControl>
              )}
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={handleChange('department')}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <School color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </motion.div>
            </motion.form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              style={{ textAlign: 'center' }}
            >
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </motion.div>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default Register;
