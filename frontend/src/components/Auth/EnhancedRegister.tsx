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
  IconButton,
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
  Visibility,
  VisibilityOff,
  Email,
  Lock,
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
import DocumentUploadComponent from './DocumentUpload';
import { getErrorMessage } from '@/utils/errorHandler';
import axios from 'axios';

const steps = [
  'Basic Information',
  'Account Details',
  'Document Verification',
  'Review & Submit',
];

const EnhancedRegister: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'STUDENT',
    studentId: '',
    graduationYear: new Date().getFullYear(),
    department: '',
  });
  const [documents, setDocuments] = useState<
    Array<{ documentType: string; documentUrl: string }>
  >([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

      case 1: // Account Details
        if (!formData.password) {
          setError('Password is required');
          return false;
        }
        if (formData.password.length < 12) {
          setError('Password must be at least 12 characters long');
          return false;
        }
        if (
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
            formData.password
          )
        ) {
          setError(
            'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
          );
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        break;

      case 2: // Document Verification
        if (formData.role !== 'ADMIN' && documents.length === 0) {
          setError('Please upload at least one verification document');
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
      const registrationData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        documents,
        ...(formData.studentId && { studentId: formData.studentId }),
        ...(formData.graduationYear && {
          graduationYear: formData.graduationYear,
        }),
        ...(formData.department && { department: formData.department }),
      };

      const endpoint =
        formData.role === 'ADMIN'
          ? '/auth/register'
          : '/auth/register-with-documents';

      const response = await axios.post(endpoint, registrationData);

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
                  </InputAdornment>
                }
              >
                <MenuItem value="STUDENT">Student</MenuItem>
                <MenuItem value="ALUM">Alumni</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
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
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              required
              margin="normal"
              helperText="Must be at least 12 characters with uppercase, lowercase, number, and special character"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </motion.div>
        );

      case 2:
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
              <DocumentUploadComponent
                onDocumentsChange={setDocuments}
                userRole={formData.role as 'STUDENT' | 'ALUM'}
              />
            )}
          </motion.div>
        );

      case 3:
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
              {formData.department && (
                <Typography variant="body2">
                  Department: {formData.department}
                </Typography>
              )}
              {formData.role === 'ALUM' && (
                <Typography variant="body2">
                  Graduation Year: {formData.graduationYear}
                </Typography>
              )}
            </Paper>

            {formData.role !== 'ADMIN' && (
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Uploaded Documents
                </Typography>
                {documents.length > 0 ? (
                  documents.map((doc, index) => (
                    <Typography key={index} variant="body2">
                      • {doc.documentType.replace('_', ' ')}
                    </Typography>
                  ))
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
