import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Avatar,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  Lock,
  Mail,
  Person,
  AttachMoney,
  AutoAwesome,
  ArrowForward,
  Visibility,
  VisibilityOff,
  CheckCircle,
} from '@mui/icons-material';

export const LoginPage: React.FC = () => {
  const { login, signup } = useAuth();
  const [tabIndex, setTabIndex] = useState(0); // 0: Sign In, 1: Create Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('HR_MANAGER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isLogin = tabIndex === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup({ email, password, full_name: fullName, role });
        setSuccessMsg('Account created successfully! Please sign in with your credentials.');
        setTabIndex(0);
        setPassword('');
        setFullName('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setTabIndex(0);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
      }}
    >
      {/* Brand Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Avatar
          sx={{
            width: 56,
            height: 56,
            mx: 'auto',
            mb: 1.5,
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
          }}
        >
          <AttachMoney fontSize="large" sx={{ color: '#ffffff' }} />
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
          Global Salary Hub
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
          Enterprise Compensation & Payroll Intelligence
        </Typography>
      </Box>

      {/* Main Card */}
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 4,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* 1-Click Demo Accounts */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: '#eff6ff',
              borderRadius: 3,
              border: '1px solid #bfdbfe',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <AutoAwesome sx={{ fontSize: 16, color: '#2563eb' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.05em' }}>
                1-CLICK DEMO LOGIN ACCOUNTS:
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setDemoCredentials('hr.manager@company.com', 'Password123')}
                sx={{
                  backgroundColor: '#ffffff',
                  borderColor: '#bfdbfe',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  '&:hover': { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                  HR Manager
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6875rem' }}>
                  hr.manager@company.com
                </Typography>
              </Button>

              <Button
                size="small"
                variant="outlined"
                onClick={() => setDemoCredentials('admin@company.com', 'Admin123!')}
                sx={{
                  backgroundColor: '#ffffff',
                  borderColor: '#bfdbfe',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  '&:hover': { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                  System Admin
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6875rem' }}>
                  admin@company.com
                </Typography>
              </Button>
            </Box>
          </Paper>

          {/* Tabs */}
          <Tabs
            value={tabIndex}
            onChange={(_, val) => {
              setTabIndex(val);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            variant="fullWidth"
            sx={{
              mb: 3,
              borderBottom: '1px solid #e2e8f0',
              '& .MuiTab-root': { fontWeight: 700, fontSize: '0.875rem' },
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Create Account" />
          </Tabs>

          {/* Feedback Banners */}
          {successMsg && (
            <Alert icon={<CheckCircle fontSize="inherit" />} severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
              {successMsg}
            </Alert>
          )}

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!isLogin && (
                <>
                  <TextField
                    label="Full Name"
                    size="small"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <FormControl size="small" fullWidth>
                    <InputLabel>Organization Role</InputLabel>
                    <Select
                      value={role}
                      label="Organization Role"
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <MenuItem value="HR_MANAGER">HR Manager</MenuItem>
                      <MenuItem value="COMPENSATION_ANALYST">Compensation Analyst</MenuItem>
                      <MenuItem value="EXECUTIVE">Executive / Leadership</MenuItem>
                      <MenuItem value="HR_ADMIN">HR Administrator</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              <TextField
                label="Work Email"
                type="email"
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                size="small"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                endIcon={<ArrowForward />}
                sx={{
                  py: 1.25,
                  mt: 1,
                  fontSize: '0.9375rem',
                  borderRadius: 2.5,
                  fontWeight: 700,
                }}
              >
                {loading ? 'Authenticating...' : isLogin ? 'Sign In to HRIS Portal' : 'Complete Registration'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
