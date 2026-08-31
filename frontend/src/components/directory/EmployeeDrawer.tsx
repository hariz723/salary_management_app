import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Paper,
  Button,
  CircularProgress,
  Avatar,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Close,
  Person,
  History,
  Star,
  Edit,
  TrendingUp,
} from '@mui/icons-material';
import { getEmployeeById } from '../../services/api';
import { EmployeeDetail } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { SalaryAdjustModal } from './SalaryAdjustModal';

interface EmployeeDrawerProps {
  employeeId: string | null;
  onClose: () => void;
  onEmployeeUpdated: () => void;
}

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  employeeId,
  onClose,
  onEmployeeUpdated,
}) => {
  const { formatMoney } = useCurrency();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0); // 0: Overview, 1: History, 2: Audit Logs
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);

  useEffect(() => {
    if (!employeeId) {
      setEmployee(null);
      return;
    }
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getEmployeeById(employeeId);
        setEmployee(data);
      } catch (err) {
        console.error('Failed to load employee details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [employeeId]);

  const currentSalary = employee?.salary_history.find((s) => s.is_current);

  return (
    <>
      <Drawer
        anchor="right"
        open={Boolean(employeeId)}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 580 },
            p: 3,
            backgroundColor: '#f8fafc',
          },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
              Loading employee record...
            </Typography>
          </Box>
        ) : !employee ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography color="text.secondary">Employee profile not found.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: '#eff6ff',
                    color: '#1d4ed8',
                    fontWeight: 800,
                  }}
                >
                  {employee.first_name[0]}{employee.last_name[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                    {employee.full_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                    {employee.employee_code} • {employee.email}
                  </Typography>
                </Box>
              </Box>

              <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
                <Close />
              </IconButton>
            </Box>

            {/* Quick Badges */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
              <Chip
                label={employee.band_status.replace('_', ' ')}
                color={
                  employee.band_status === 'WITHIN_BAND'
                    ? 'success'
                    : employee.band_status === 'UNDERPAID'
                    ? 'error'
                    : 'warning'
                }
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Chip label={employee.department} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              <Chip label={employee.job_level} size="small" color="secondary" sx={{ fontWeight: 700 }} />
              <Chip
                icon={<Star sx={{ fontSize: '14px !important', color: '#b45309' }} />}
                label={`★ ${employee.performance_rating.toFixed(1)}`}
                size="small"
                sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }}
              />
            </Box>

            {/* Compensation Highlight Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 2.5,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#ffffff',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Annual Compensation
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', mt: 0.5 }}>
                    {currentSalary ? formatMoney(currentSalary.total_compensation_usd) : '$0'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                    Local: {currentSalary?.currency} {currentSalary?.base_salary.toLocaleString()} base + {currentSalary?.bonus_percentage}% bonus
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => setAdjustModalOpen(true)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    bgcolor: '#2563eb',
                    '&:hover': { bgcolor: '#1d4ed8' },
                  }}
                >
                  Adjust
                </Button>
              </Box>
            </Paper>

            {/* Navigation Tabs */}
            <Tabs
              value={tabIndex}
              onChange={(_, val) => setTabIndex(val)}
              variant="fullWidth"
              sx={{
                mb: 2,
                borderBottom: '1px solid #e2e8f0',
                '& .MuiTab-root': { fontWeight: 700, fontSize: '0.8125rem' },
              }}
            >
              <Tab label="Profile & Bands" icon={<Person fontSize="small" />} iconPosition="start" />
              <Tab label="Salary History" icon={<History fontSize="small" />} iconPosition="start" />
              <Tab label="Audit Logs" icon={<TrendingUp fontSize="small" />} iconPosition="start" />
            </Tabs>

            {/* Tab Contents */}
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
              {tabIndex === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Job Details Paper */}
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#0f172a' }}>
                      Position Information
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Job Title</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.job_title}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Department</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.department}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Location</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.city}, {employee.country}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Hire Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee.hire_date}</Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Compensation Band Benchmarks */}
                  {employee.band_min_usd !== undefined && employee.band_max_usd !== undefined && (
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#0f172a' }}>
                        Salary Band Governance (USD)
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, textAlign: 'center' }}>
                        <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Min Band</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#dc2626' }}>
                            {formatMoney(employee.band_min_usd)}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                          <Typography variant="caption" sx={{ color: '#1e40af', display: 'block' }}>Mid Band</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb' }}>
                            {formatMoney(employee.band_mid_usd || 0)}
                          </Typography>
                        </Box>
                        <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Max Band</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                            {formatMoney(employee.band_max_usd)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  )}
                </Box>
              )}

              {tabIndex === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {employee.salary_history.map((sal) => (
                    <Paper
                      key={sal.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: '#ffffff',
                        border: sal.is_current ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {formatMoney(sal.total_compensation_usd)}
                        </Typography>
                        {sal.is_current && <Chip label="Current" size="small" color="primary" sx={{ height: 20, fontWeight: 700 }} />}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                        Base: {sal.currency} {sal.base_salary.toLocaleString()} • Effective: {sal.effective_date}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}

              {tabIndex === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {employee.audit_logs.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                      No audit history recorded.
                    </Typography>
                  ) : (
                    employee.audit_logs.map((log) => (
                      <Paper key={log.id} elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip label={log.change_type} size="small" sx={{ fontWeight: 700, height: 20 }} />
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {new Date(log.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, mt: 1, color: '#0f172a' }}>
                          {log.reason}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                          Changed from {formatMoney(log.previous_total_usd)} to {formatMoney(log.new_total_usd)} ({log.change_percentage > 0 ? `+${log.change_percentage}%` : `${log.change_percentage}%`}) by {log.changed_by}
                        </Typography>
                      </Paper>
                    ))
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Drawer>

      {adjustModalOpen && currentSalary && employee && (
        <SalaryAdjustModal
          visible={adjustModalOpen}
          employee={{
            id: employee.id,
            employee_code: employee.employee_code,
            first_name: employee.first_name,
            last_name: employee.last_name,
            full_name: employee.full_name,
            email: employee.email,
            department: employee.department,
            job_level: employee.job_level,
            job_title: employee.job_title,
            country: employee.country,
            country_code: employee.country_code,
            city: employee.city,
            gender: employee.gender,
            currency: currentSalary.currency,
            base_salary: currentSalary.base_salary,
            bonus_percentage: currentSalary.bonus_percentage,
            equity_usd: currentSalary.equity_usd,
            base_salary_usd: currentSalary.base_salary_usd,
            total_compensation_usd: currentSalary.total_compensation_usd,
            band_status: employee.band_status,
            performance_rating: employee.performance_rating,
            hire_date: employee.hire_date,
            is_active: employee.is_active,
          }}
          onClose={() => setAdjustModalOpen(false)}
          onSuccess={() => {
            setAdjustModalOpen(false);
            onEmployeeUpdated();
            if (employeeId) {
              getEmployeeById(employeeId).then(setEmployee);
            }
          }}
        />
      )}
    </>
  );
};
