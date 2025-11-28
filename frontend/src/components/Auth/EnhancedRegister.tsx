import { FC, useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Email,
  Person,
  School,
  Work,
  AdminPanelSettings,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../ThemeToggle';
// DocumentUploadComponent used previously for file uploads. We're switching to URL-based
// document inputs for now; keep the component import commented so it can be
// re-enabled later if we switch back to file uploads.
// import DocumentUploadComponent from './DocumentUpload';
import { getErrorMessage } from '@/utils/errorHandler';
import axios from 'axios';
// Role is handled as string literals here so we can add MENTOR without changing shared types

const steps = ['Basic Information', 'Document Verification', 'Review & Submit'];

const EnhancedRegister: FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  type RoleType = 'STUDENT' | 'ALUM' | 'ADMIN' | 'MENTOR';

  const [formData, setFormData] = useState<{
    email: string;
    name: string;
    role: RoleType;
    studentId: string;
    graduationYear: number | '';
    department: string;
  }>({
    email: '',
    name: '',
    role: 'STUDENT',
    studentId: '',
    // allow student to optionally provide graduationYear
    graduationYear: new Date().getFullYear(),
    department: '',
  });
  const [documents, setDocuments] = useState<
    Array<{ documentType: string; documentUrl: string }>
  >([]);
  // Password fields removed per request; accounts will be created without a
  // password in the UI and handled by admin approval flow.
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange =
    (field: string) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | { target: { value: unknown } }
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateStep = (step: number): boolean => {
    setError('');
    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) {
          setError('Full name is required');
          return false;
        }
        if (!formData.email.trim()) {
          setError('Email is required');
          return false;
        }
        if (!formData.email.endsWith('@kiit.ac.in')) {
          setError('Email must be from kiit.ac.in domain');
          return false;
        }
        break;

      case 1: // Document Verification
        if (formData.role !== 'ADMIN' && documents.length === 0) {
          setError('Please provide at least one verification document URL');
          return false;
        }
        break;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setError('');
    setLoading(true);

    try {
      // Build payload: do NOT include password when submitting to register-with-documents
      const baseData: Record<string, unknown> = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        documents,
        ...(formData.studentId && { studentId: formData.studentId }),
        ...(formData.graduationYear && {
          graduationYear: formData.graduationYear,
        }),
        ...(formData.department && { department: formData.department }),
      };

      // Password removed from UI/payload per request. Always use register-with-documents
      // endpoint and pass documents as URLs.
      const response = await axios.post(
        '/auth/register-with-documents',
        baseData
      );

      // Show success message and redirect
      navigate('/registration-success', {
        state: {
          message: response.data.message || 'Registration successful!',
          requiresApproval: formData.role !== 'ADMIN',
        },
      });
    } catch (err: unknown) {
      setError(
        getErrorMessage(err) || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
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
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={handleChange('role')}
                startAdornment={
                  <InputAdornment position="start">
                    {formData.role === 'STUDENT' && <School color="action" />}
                    {formData.role === 'ALUM' && <Work color="action" />}
                    {formData.role === 'ADMIN' && (
                      <AdminPanelSettings color="action" />
                    )}
                    {formData.role === 'MENTOR' && <Work color="action" />}
                  </InputAdornment>
                }
              >
                <MenuItem value="STUDENT">Student</MenuItem>
                <MenuItem value="ALUM">Alumni</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MENTOR">Mentor</MenuItem>
              </Select>
            </FormControl>

            {formData.role === 'STUDENT' && (
              <>
                <TextField
                  fullWidth
                  label="Student ID"
                  value={formData.studentId}
                  onChange={handleChange('studentId')}
                  margin="normal"
                  helperText="Optional: Your KIIT student ID"
                />
                <TextField
                  fullWidth
                  label="Graduation Year (optional)"
                  type="number"
                  value={formData.graduationYear}
                  onChange={handleChange('graduationYear')}
                  margin="normal"
                  inputProps={{ min: 1990, max: new Date().getFullYear() }}
                />
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={handleChange('department')}
                  margin="normal"
                  helperText="Optional: Your department/school"
                />
              </>
            )}

            {formData.role === 'ALUM' && (
              <>
                <TextField
                  fullWidth
                  label="Graduation Year"
                  type="number"
                  value={formData.graduationYear}
                  onChange={handleChange('graduationYear')}
                  margin="normal"
                  inputProps={{ min: 1990, max: new Date().getFullYear() }}
                />
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={handleChange('department')}
                  margin="normal"
                  helperText="Your department/school at KIIT"
                />
              </>
            )}
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {formData.role === 'ADMIN' ? (
              <Alert severity="info">
                Admin accounts do not require document verification.
              </Alert>
            ) : (
              <>
                {/*
                  Previously we used a DocumentUploadComponent to accept file uploads.
                  That implementation is commented out above. For now we accept
                  document URLs from the user and pass them to the backend as
                  { documentType, documentUrl } objects.
                */}

                {documents.map((doc, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      display: 'flex',
                      gap: 2,
                      flexDirection: { xs: 'column', md: 'row' },
                    }}
                  >
                    <FormControl sx={{ minWidth: 160 }}>
                      <InputLabel>Document Type</InputLabel>
                      <Select
                        value={doc.documentType}
                        label="Document Type"
                        onChange={(e) => {
                          const newType = e.target.value as string;
                          setDocuments((prev) =>
                            prev.map((d, i) =>
                              i === idx ? { ...d, documentType: newType } : d
                            )
                          );
                        }}
                      >
                        <MenuItem value="STUDENT_ID">STUDENT_ID</MenuItem>
                        <MenuItem value="UNIVERSITY_ID">UNIVERSITY_ID</MenuItem>
                        <MenuItem value="OTHER">OTHER</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Document URL"
                      value={doc.documentUrl}
                      onChange={(e) =>
                        setDocuments((prev) =>
                          prev.map((d, i) =>
                            i === idx
                              ? { ...d, documentUrl: e.target.value }
                              : d
                          )
                        )
                      }
                      helperText="Provide a publicly accessible URL to your document (e.g., Google Drive link)"
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        color="error"
                        onClick={() =>
                          setDocuments((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </Box>
                  </Paper>
                ))}

                <Button
                  variant="outlined"
                  onClick={() =>
                    setDocuments((prev) => [
                      ...prev,
                      { documentType: 'STUDENT_ID', documentUrl: '' },
                    ])
                  }
                >
                  Add Document URL
                </Button>
              </>
            )}
          </motion.div>
        );

      /* original file-upload based document verification removed;
         replaced with URL-based inputs in case 1 above. */

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>

            <Paper
              elevation={0}
              sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}
            >
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Personal Information
              </Typography>
              <Typography variant="body2">Name: {formData.name}</Typography>
              <Typography variant="body2">Email: {formData.email}</Typography>
              <Typography variant="body2">Role: {formData.role}</Typography>
              {formData.studentId && (
                <Typography variant="body2">
                  Student ID: {formData.studentId}
                </Typography>
              )}
              <Typography variant="body2">
                Graduation Year: {formData.graduationYear}
              </Typography>
              {formData.department && (
                <Typography variant="body2">
                  Department: {formData.department}
                </Typography>
              )}
            </Paper>

            {formData.role !== 'ADMIN' && (
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Uploaded Documents
                </Typography>
                {documents.length > 0 ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    {documents.map((doc, index) => (
                      <Box
                        key={index}
                        sx={{ mr: { md: 2 }, mb: { xs: 1, md: 0 } }}
                      >
                        <Typography variant="body2">
                          • {doc.documentType.replace('_', ' ')}
                        </Typography>
                        {doc.documentUrl && (
                          <Typography variant="caption" color="text.secondary">
                            <Link
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </Link>
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No documents uploaded
                  </Typography>
                )}
              </Paper>
            )}

            <Alert severity="warning" sx={{ mt: 2 }}>
              {formData.role === 'ADMIN'
                ? 'Your admin account will be created immediately upon submission.'
                : 'Your registration will be submitted for review. You will receive login credentials via email once approved by our admin team.'}
            </Alert>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeToggle />
      </Box>

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
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
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ fontWeight: 700 }}
              >
                Join Nexus
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Connect with KIIT students and alumni
              </Typography>
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

            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {renderStepContent(index)}

                    <Box sx={{ mt: 3 }}>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        startIcon={<ArrowBack />}
                        sx={{ mr: 1 }}
                      >
                        Back
                      </Button>

                      {index === steps.length - 1 ? (
                        <Button
                          variant="contained"
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? 'Submitting...' : 'Submit Registration'}
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          endIcon={<ArrowForward />}
                        >
                          Next
                        </Button>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default EnhancedRegister;
