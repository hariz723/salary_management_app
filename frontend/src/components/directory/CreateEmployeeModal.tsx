import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd,
  AttachMoney,
  Badge,
  WorkOutline,
} from '@mui/icons-material';
import { createEmployee, CreateEmployeePayload } from '../../services/api';

interface CreateEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onEmployeeCreated: () => void;
}

const COUNTRIES_CONFIG: Record<string, { code: string; currency: string; rate: number; defaultCity: string; cities: string[] }> = {
  'United States': { code: 'USA', currency: 'USD', rate: 1.0, defaultCity: 'New York', cities: ['New York', 'San Francisco', 'Austin', 'Seattle', 'Chicago'] },
  'United Kingdom': { code: 'GBR', currency: 'GBP', rate: 1.28, defaultCity: 'London', cities: ['London', 'Manchester', 'Edinburgh', 'Bristol', 'Cambridge'] },
  'Germany': { code: 'DEU', currency: 'EUR', rate: 1.09, defaultCity: 'Berlin', cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne'] },
  'India': { code: 'IND', currency: 'INR', rate: 0.012, defaultCity: 'Bengaluru', cities: ['Bengaluru', 'Mumbai', 'Hyderabad', 'Delhi', 'Pune'] },
  'Singapore': { code: 'SGP', currency: 'SGD', rate: 0.75, defaultCity: 'Singapore', cities: ['Singapore'] },
  'Canada': { code: 'CAN', currency: 'CAD', rate: 0.74, defaultCity: 'Toronto', cities: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary'] },
  'Australia': { code: 'AUS', currency: 'AUD', rate: 0.66, defaultCity: 'Sydney', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Canberra'] },
  'Japan': { code: 'JPN', currency: 'JPY', rate: 0.0067, defaultCity: 'Tokyo', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Fukuoka'] },
};

const DEPARTMENTS_CONFIG: Record<string, string[]> = {
  Engineering: ['Software Engineer', 'Senior Backend Engineer', 'Frontend Specialist', 'DevOps Engineer', 'QA Automation Engineer', 'Engineering Manager'],
  Product: ['Product Manager', 'Associate PM', 'Group Product Manager', 'Product Designer', 'UX Researcher'],
  Sales: ['Account Executive', 'Sales Development Rep', 'Enterprise Sales Lead', 'Sales Director'],
  Marketing: ['Growth Marketer', 'Content Strategist', 'Product Marketing Manager', 'Performance Marketing Lead'],
  'Human Resources': ['HR Generalist', 'Technical Recruiter', 'Compensation Analyst', 'People Operations Lead', 'HR Director'],
  Finance: ['Financial Analyst', 'Senior Accountant', 'Finance Manager', 'Controller'],
  Operations: ['Operations Specialist', 'Logistics Coordinator', 'Program Manager', 'VP of Operations'],
  Legal: ['Corporate Counsel', 'Compliance Lead', 'Legal Specialist', 'Senior Legal Counsel'],
};

const JOB_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Executive'];
const GENDERS = ['Female', 'Male', 'Non-Binary'];

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  open,
  onClose,
  onEmployeeCreated,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Female');
  const [country, setCountry] = useState('United States');
  const [city, setCity] = useState('New York');
  const [department, setDepartment] = useState('Engineering');
  const [jobLevel, setJobLevel] = useState('Mid');
  const [jobTitle, setJobTitle] = useState('Software Engineer');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [performanceRating, setPerformanceRating] = useState(3.5);

  // Compensation
  const [currency, setCurrency] = useState('USD');
  const [baseSalary, setBaseSalary] = useState<number | ''>(85000);
  const [bonusPercentage, setBonusPercentage] = useState<number | ''>(10);
  const [equityUsd, setEquityUsd] = useState<number | ''>(5000);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto update currency and city when country changes
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const cfg = COUNTRIES_CONFIG[newCountry];
    if (cfg) {
      setCurrency(cfg.currency);
      setCity(cfg.defaultCity);
    }
  };

  // Auto update job title when department changes
  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const titles = DEPARTMENTS_CONFIG[newDept];
    if (titles && titles.length > 0) {
      setJobTitle(titles[0]);
    }
  };

  // Auto suggest email
  useEffect(() => {
    if (firstName && lastName) {
      const cleanFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      setEmail(`${cleanFirst}.${cleanLast}@company.com`);
    }
  }, [firstName, lastName]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setGender('Female');
    setCountry('United States');
    setCity('New York');
    setDepartment('Engineering');
    setJobLevel('Mid');
    setJobTitle('Software Engineer');
    setHireDate(new Date().toISOString().split('T')[0]);
    setPerformanceRating(3.5);
    setCurrency('USD');
    setBaseSalary(85000);
    setBonusPercentage(10);
    setEquityUsd(5000);
    setError(null);
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  // Live calculation of USD preview
  const rate = COUNTRIES_CONFIG[country]?.rate || 1.0;
  const numBase = Number(baseSalary) || 0;
  const numBonusPct = Number(bonusPercentage) || 0;
  const numEquity = Number(equityUsd) || 0;
  const baseUsd = numBase * rate;
  const bonusUsd = baseUsd * (numBonusPct / 100);
  const totalCompUsd = baseUsd + bonusUsd + numEquity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Please provide full name and a valid corporate email.');
      return;
    }
    if (!numBase || numBase <= 0) {
      setError('Base salary must be greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateEmployeePayload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        gender,
        country,
        country_code: COUNTRIES_CONFIG[country]?.code || 'USA',
        city: city.trim(),
        department,
        job_title: jobTitle.trim(),
        job_level: jobLevel,
        hire_date: hireDate,
        performance_rating: Number(performanceRating) || 3.0,
        is_active: true,
        initial_salary: {
          base_salary: numBase,
          bonus_percentage: numBonusPct,
          equity_usd: numEquity,
          currency,
        },
      };

      await createEmployee(payload);
      onEmployeeCreated();
      handleClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to create employee. Please verify input data.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonAdd fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              Add New Employee
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Create an employee record and establish their initial compensation package
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} disabled={submitting} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ pt: 2, pb: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Section 1: Personal & Location Details */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Badge sx={{ fontSize: 18, color: '#2563eb' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              1. Personal & Contact Information
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                fullWidth
                size="small"
                placeholder="e.g. Elena"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                fullWidth
                size="small"
                placeholder="e.g. Rostova"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Corporate Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                size="small"
                placeholder="elena.rostova@company.com"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                fullWidth
                size="small"
              >
                {GENDERS.map((g) => (
                  <MenuItem key={g} value={g}>{g}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Country / Compensation Hub"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                fullWidth
                size="small"
              >
                {Object.keys(COUNTRIES_CONFIG).map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City / Office Location"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                fullWidth
                size="small"
                placeholder="e.g. New York"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          {/* Section 2: Department & Role */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <WorkOutline sx={{ fontSize: 18, color: '#059669' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              2. Department, Seniority & Performance
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Department"
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                fullWidth
                size="small"
              >
                {Object.keys(DEPARTMENTS_CONFIG).map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                label="Seniority Level"
                value={jobLevel}
                onChange={(e) => setJobLevel(e.target.value)}
                fullWidth
                size="small"
              >
                {JOB_LEVELS.map((lvl) => (
                  <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Job Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hire Date"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Initial Performance Rating (1.0 - 5.0)"
                type="number"
                inputProps={{ min: 1.0, max: 5.0, step: 0.1 }}
                value={performanceRating}
                onChange={(e) => setPerformanceRating(parseFloat(e.target.value))}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2.5 }} />

          {/* Section 3: Compensation Package */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AttachMoney sx={{ fontSize: 18, color: '#7c3aed' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              3. Initial Compensation Package
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                label="Local Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                fullWidth
                size="small"
              >
                {['USD', 'EUR', 'GBP', 'INR', 'SGD', 'CAD', 'AUD', 'JPY'].map((cur) => (
                  <MenuItem key={cur} value={cur}>{cur}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label={`Annual Base (${currency})`}
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value === '' ? '' : Number(e.target.value))}
                required
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Target Bonus (%)"
                type="number"
                inputProps={{ min: 0, max: 200, step: 0.5 }}
                value={bonusPercentage}
                onChange={(e) => setBonusPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Annual Equity ($ USD)"
                type="number"
                inputProps={{ min: 0, step: 500 }}
                value={equityUsd}
                onChange={(e) => setEquityUsd(e.target.value === '' ? '' : Number(e.target.value))}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>

          {/* Compensation Summary Box */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 600 }}>
                ESTIMATED USD TOTAL COMPENSATION:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                ${totalCompUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Base (USD)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  ${baseUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Bonus ({numBonusPct}%)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  ${bonusUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>FX Exchange Rate</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b' }}>
                  1 {currency} = ${rate} USD
                </Typography>
              </Box>
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={handleClose} disabled={submitting} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}
            sx={{
              fontWeight: 700,
              px: 3,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
            }}
          >
            {submitting ? 'Saving Employee...' : 'Save & Establish Compensation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
