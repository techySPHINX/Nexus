import { FC, useState, useMemo } from 'react';
import {
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
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
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

const steps = ['Basic Information', 'Document Verification', 'Review & Submit'];

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

const EnhancedRegister: FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<RegisterForm>(initialForm);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { registerWithDocuments } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const backgrounds = useMemo(
    () => ({
      panel: isDark
        ? 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(17,24,39,0.92))'
        : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(236,248,243,0.9))',
      left: isDark
        ? 'radial-gradient(circle at 20% 20%, rgba(52,211,153,0.18), transparent 35%), radial-gradient(circle at 80% 0%, rgba(34,197,94,0.12), transparent 30%), linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))'
        : 'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.2), transparent 35%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.18), transparent 30%), linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))',
    }),
    [isDark]
  );

  const handleChange =
    (field: keyof RegisterForm) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | { target: { value: unknown } }
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

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (step: number): boolean => {
    setError('');
    switch (step) {
      case 0:
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
      case 1:
        if (formData.role !== Role.ADMIN && formData.documents.length === 0) {
          setError('Please provide at least one verification document');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setError('');
    setLoading(true);

    try {
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
                <MenuItem value={Role.STUDENT}>Student</MenuItem>
                <MenuItem value={Role.ALUM}>Alumni</MenuItem>
                <MenuItem value={Role.MENTOR}>Mentor</MenuItem>
                <MenuItem value={Role.ADMIN}>Admin</MenuItem>
              </Select>
            </FormControl>

            {formData.role === Role.STUDENT && (
              <>
                <TextField
                  fullWidth
                  label="Student ID"
                  value={formData.studentId}
                  onChange={handleChange('studentId')}
                  margin="normal"
                  helperText="Optional: Your KIIT student ID"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <School color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                  <InputLabel>Graduation Year</InputLabel>
                  <Select
                    value={formData.graduationYear ?? ''}
                    label="Graduation Year"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        graduationYear: isNaN(val) ? null : val,
                      }));
                    }}
                  >
                    {Array.from({ length: 14 }, (_, i) => {
                      const year = new Date().getFullYear() - 8 + i;
                      return (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={handleChange('department')}
                  margin="normal"
                  helperText="Optional: Your department/school"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <School color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {formData.role === Role.ALUM && (
              <>
                <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                  <InputLabel>Graduation Year</InputLabel>
                  <Select
                    value={formData.graduationYear ?? ''}
                    label="Graduation Year"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        graduationYear: isNaN(val) ? null : val,
                      }));
                    }}
                  >
                    {Array.from({ length: 14 }, (_, i) => {
                      const year = new Date().getFullYear() - 8 + i;
                      return (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department}
                  onChange={handleChange('department')}
                  margin="normal"
                  helperText="Your department/school at KIIT"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <School color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
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
            {formData.role === Role.ADMIN ? (
              <Alert severity="info">
                Admin accounts do not require document verification.
              </Alert>
            ) : (
              <>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Upload Verification Documents
                </Typography>
                {formData.documents.map((doc, idx) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 2,
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 2,
                      alignItems: { xs: 'stretch', md: 'center' },
                    }}
                  >
                    <FormControl sx={{ minWidth: 180, flex: '0 0 220px' }}>
                      <InputLabel>Document Type</InputLabel>
                      <Select
                        value={doc.documentType}
                        label="Document Type"
                        onChange={(e) =>
                          handleDocumentChange(
                            idx,
                            'documentType',
                            e.target.value
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
                    <TextField
                      fullWidth
                      label="Document URL"
                      value={doc.documentUrl}
                      onChange={(e) =>
                        handleDocumentChange(idx, 'documentUrl', e.target.value)
                      }
                      sx={{ flex: 1 }}
                    />
                    {formData.documents.length > 1 && (
                      <Button
                        color="error"
                        onClick={() => removeDocument(idx)}
                        sx={{ minWidth: 80 }}
                      >
                        Remove
                      </Button>
                    )}
                  </Paper>
                ))}
                <Button onClick={addDocument} sx={{ mt: 1 }}>
                  Add another document
                </Button>
              </>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Review Your Information
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.5, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{formData.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{formData.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1">{formData.role}</Typography>
                </Box>
                {formData.studentId && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Student ID
                    </Typography>
                    <Typography variant="body1">
                      {formData.studentId}
                    </Typography>
                  </Box>
                )}
                {formData.graduationYear && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Graduation Year
                    </Typography>
                    <Typography variant="body1">
                      {formData.graduationYear}
                    </Typography>
                  </Box>
                )}
                {formData.department && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Department
                    </Typography>
                    <Typography variant="body1">
                      {formData.department}
                    </Typography>
                  </Box>
                )}
              </Box>

              {formData.documents.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Documents
                  </Typography>
                  {formData.documents.map((doc, idx) => (
                    <Typography key={idx} variant="body2" sx={{ mt: 0.5 }}>
                      • {doc.documentType.replace('_', ' ')}
                      {doc.documentUrl && (
                        <Link
                          href={doc.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ ml: 1 }}
                        >
                          View
                        </Link>
                      )}
                    </Typography>
                  ))}
                </Box>
              )}
            </Paper>

            <Alert severity="warning">
              {formData.role === Role.ADMIN
                ? 'Your admin account will be created immediately upon submission.'
                : 'Your registration will be submitted for review. You will receive login credentials via email once approved.'}
            </Alert>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`w-full min-h-screen overflow-x-hidden bg-gradient-to-br transition-all duration-500 ${
        isDark
          ? 'from-gray-900 via-emerald-900 to-green-900'
          : 'from-emerald-50 via-green-50 to-teal-50'
      }`}
    >
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: '20px',
          pb: 8,
          px: { xs: 2.5, md: 4 },
          width: '100%',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 1100,
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            background: backgrounds.panel,
            boxShadow:
              '0 25px 80px rgba(16,185,129,0.12), 0 10px 30px rgba(0,0,0,0.35)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
            }}
          >
            {/* Left showcase */}
            <Box
              sx={{
                position: 'relative',
                p: { xs: 3, md: 5 },
                background: backgrounds.left,
                borderRight: { md: '1px solid rgba(255,255,255,0.06)' },
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 30px rgba(16,185,129,0.35)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(16,185,129,0.08)',
                  }}
                >
                  <img
                    src="/nexus.png"
                    alt="Nexus"
                    style={{
                      width: '70%',
                      height: '70%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: isDark ? 'rgba(167,243,208,0.9)' : '#047857',
                      letterSpacing: 1.5,
                      fontWeight: 700,
                    }}
                  >
                    Nexus Platform
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: isDark ? 'white' : '#0f172a',
                      textShadow: isDark
                        ? '0 10px 30px rgba(16,185,129,0.35)'
                        : '0 6px 18px rgba(16,185,129,0.15)',
                    }}
                  >
                    Enhanced Registration
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: isDark ? 'rgba(226,232,240,0.85)' : '#0f172a',
                      mt: 0.5,
                    }}
                  >
                    Step-by-step account creation process.
                  </Typography>
                </Box>
              </motion.div>

              <Box sx={{ display: 'grid', gap: 1.5, mt: 3 }}>
                {[
                  'Guided registration with validation',
                  'Secure document verification system',
                  'Admin approval for verified accounts',
                ].map((text, idx) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 * idx }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(226,232,240,0.9)',
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background:
                          idx === 0
                            ? '#22c55e'
                            : idx === 1
                              ? '#38bdf8'
                              : '#a78bfa',
                        boxShadow: '0 0 0 6px rgba(255,255,255,0.03)',
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {text}
                    </Typography>
                  </motion.div>
                ))}
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark
                      ? 'rgba(226,232,240,0.6)'
                      : 'rgba(15,23,42,0.6)',
                  }}
                >
                  Complete all steps to submit your registration
                </Typography>
              </Box>
            </Box>

            {/* Right form */}
            <Box
              sx={{
                p: { xs: 3, md: 4 },
                backdropFilter: 'blur(12px)',
                backgroundColor: isDark
                  ? 'transparent'
                  : 'rgba(255,255,255,0.65)',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
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

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  color: isDark ? 'white' : '#0f172a',
                }}
              >
                Create Account
              </Typography>

              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                    <StepContent>
                      {renderStepContent(index)}

                      <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                        <Button
                          disabled={index === 0}
                          onClick={handleBack}
                          startIcon={<ArrowBack />}
                        >
                          Back
                        </Button>
                        {index === steps.length - 1 ? (
                          <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading}
                            sx={{
                              background:
                                'linear-gradient(135deg, #22c55e, #16a34a)',
                              boxShadow: isDark
                                ? '0 12px 35px rgba(34,197,94,0.35)'
                                : '0 8px 24px rgba(34,197,94,0.25)',
                            }}
                          >
                            {loading ? 'Submitting...' : 'Submit'}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            endIcon={<ArrowForward />}
                            sx={{
                              background:
                                'linear-gradient(135deg, #22c55e, #16a34a)',
                              boxShadow: isDark
                                ? '0 12px 35px rgba(34,197,94,0.35)'
                                : '0 8px 24px rgba(34,197,94,0.25)',
                            }}
                          >
                            Next
                          </Button>
                        )}
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>

              {activeStep === steps.length && (
                <Paper sx={{ p: 3, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Registration Complete!
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Your registration has been submitted successfully.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="outlined"
                    sx={{
                      borderColor: '#22c55e',
                      color: '#22c55e',
                      '&:hover': {
                        borderColor: '#16a34a',
                        bgcolor: 'rgba(34,197,94,0.04)',
                      },
                    }}
                  >
                    Go to Login
                  </Button>
                </Paper>
              )}

              <Divider
                sx={{
                  my: 3,
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(15,23,42,0.08)',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark
                      ? 'rgba(226,232,240,0.7)'
                      : 'rgba(15,23,42,0.6)',
                  }}
                >
                  or
                </Typography>
              </Divider>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ textAlign: 'center' }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: isDark ? 'rgba(226,232,240,0.8)' : '#0f172a' }}
                >
                  Already have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/login"
                    sx={{
                      color: '#22c55e',
                      textDecoration: 'none',
                      fontWeight: 700,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Sign in
                  </Link>
                </Typography>
              </motion.div>
            </Box>
          </Box>
        </Paper>
      </Box>
    </div>
  );
};

export default EnhancedRegister;
