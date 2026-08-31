import React, { useEffect, useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import {
  getOverviewStats,
  getPayDistribution,
  getDepartmentStats,
  getCountryStats,
  getJobLevelStats,
} from '../../services/api';
import {
  OverviewStats,
  DistributionBucket,
  DepartmentStats,
  CountryStats,
  JobLevelStats,
} from '../../types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  CircularProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import {
  AttachMoney,
  People,
  TrendingUp,
  Security,
  Public,
  CorporateFare,
  BarChart as BarChartIcon,
  NorthEast,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';

interface OverviewTabProps {
  onNavigateToDirectory: (filter?: { department?: string; country?: string; band_status?: string }) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateToDirectory }) => {
  const { formatMoney, convertFromUsd, selectedCurrency } = useCurrency();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [distribution, setDistribution] = useState<DistributionBucket[]>([]);
  const [deptStats, setDeptStats] = useState<DepartmentStats[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [jobLevelStats, setJobLevelStats] = useState<JobLevelStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [o, d, dept, c, j] = await Promise.all([
          getOverviewStats(),
          getPayDistribution(),
          getDepartmentStats(),
          getCountryStats(),
          getJobLevelStats(),
        ]);
        setOverview(o);
        setDistribution(d);
        setDeptStats(dept);
        setCountryStats(c);
        setJobLevelStats(j);
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} sx={{ color: '#2563eb' }} />
        <Typography variant="body2" sx={{ mt: 2, color: '#64748b', fontWeight: 600 }}>
          Aggregating compensation records...
        </Typography>
      </Box>
    );
  }

  if (!overview) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Failed to load compensation overview.</Typography>
      </Box>
    );
  }

  const complianceRate = overview.total_employees > 0
    ? ((overview.within_band_count / overview.total_employees) * 100).toFixed(1)
    : '100';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 6 }}>
      {/* Executive Hero Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          color: '#ffffff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Chip
            label="Executive Dashboard"
            size="small"
            sx={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#93c5fd',
              border: '1px solid rgba(147, 197, 253, 0.3)',
              fontWeight: 700,
              fontSize: '0.6875rem',
              mb: 1.5,
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Global Compensation Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
            Real-time multi-currency pay intelligence, department allocations, and band compliance.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontWeight: 600 }}>
              Active Viewing Currency
            </Typography>
            <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 800 }}>
              {selectedCurrency}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: '#2563eb', width: 44, height: 44 }}>
            <AttachMoney />
          </Avatar>
        </Paper>
      </Paper>

      {/* KPI Cards Grid */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Annual Payroll
                </Typography>
                <Avatar sx={{ bgcolor: '#ecfdf5', color: '#059669', width: 36, height: 36 }}>
                  <AttachMoney fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {formatMoney(overview.total_payroll_usd)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block' }}>
                Includes Base + Target Bonus + Equity
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Headcount
                </Typography>
                <Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb', width: 36, height: 36 }}>
                  <People fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {overview.total_employees.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block' }}>
                <span style={{ color: '#059669', fontWeight: 700 }}>{overview.active_employees} Active</span> • {overview.inactive_employees} Inactive
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Median Base Pay
                </Typography>
                <Avatar sx={{ bgcolor: '#eef2ff', color: '#4f46e5', width: 36, height: 36 }}>
                  <TrendingUp fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {formatMoney(overview.median_salary_usd)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block' }}>
                Mean: <strong>{formatMoney(overview.mean_salary_usd)}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => onNavigateToDirectory({ band_status: 'UNDERPAID' })}
            sx={{
              height: '100%',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 20px -8px rgba(0,0,0,0.1)' },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Band Compliance
                </Typography>
                <Avatar sx={{ bgcolor: '#fef3c7', color: '#d97706', width: 36, height: 36 }}>
                  <Security fontSize="small" />
                </Avatar>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  {complianceRate}%
                </Typography>
                <Chip
                  icon={<NorthEast sx={{ fontSize: '14px !important' }} />}
                  label={`${overview.underpaid_count + overview.overpaid_count} Outliers`}
                  size="small"
                  color="warning"
                  sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 700 }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={parseFloat(complianceRate)}
                color="success"
                sx={{ height: 6, borderRadius: 3, mt: 1.5, bgcolor: '#f1f5f9' }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <BarChartIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Compensation Distribution
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 3 }}>
                Employee count across total compensation tiers
              </Typography>

              <Box sx={{ height: 280, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="range_label"
                      angle={-30}
                      textAnchor="end"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      height={50}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip
                      formatter={(value: any, _name: any, props: any) => [
                        `${value.toLocaleString()} employees (${props.payload.percentage}%)`,
                        'Count',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      }}
                    />
                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CorporateFare sx={{ color: '#4f46e5', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Department Average Compensation
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 3 }}>
                Benchmark comparison converted to {selectedCurrency}
              </Typography>

              <Box sx={{ height: 280, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptStats.map((d) => ({
                      department: d.department,
                      avg_comp: Math.round(convertFromUsd(d.mean_total_comp_usd)),
                      headcount: d.employee_count,
                    }))}
                    margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="department"
                      angle={-30}
                      textAnchor="end"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      height={50}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip
                      formatter={(value: any) => [`${formatMoney(convertFromUsd(value, 'USD'))}`, 'Avg Total Comp']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      }}
                    />
                    <Bar dataKey="avg_comp" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Global Spend Table & Level Progression */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Public sx={{ color: '#059669', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Global Payroll by Country & Currency
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                8 regional compensation hubs
              </Typography>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Country</TableCell>
                      <TableCell>Headcount</TableCell>
                      <TableCell>Local Currency</TableCell>
                      <TableCell>Total Spend ({selectedCurrency})</TableCell>
                      <TableCell>Median Pay</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {countryStats.map((c) => (
                      <TableRow key={c.country} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {c.country}{' '}
                          <Chip label={c.country_code} size="small" sx={{ height: 18, fontSize: '0.625rem', ml: 0.5 }} />
                        </TableCell>
                        <TableCell>{c.employee_count.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {c.currency} {c.total_local_currency.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>{formatMoney(c.total_payroll_usd)}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatMoney(c.median_base_usd)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => onNavigateToDirectory({ country: c.country })}
                            sx={{ fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            View ({c.employee_count})
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <TrendingUp sx={{ color: '#7c3aed', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Job Level Pay Progression
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                Base compensation progression by seniority
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {jobLevelStats.map((j) => (
                  <Paper
                    key={j.job_level}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {j.job_level}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#7c3aed' }}>
                        {formatMoney(j.median_base_usd)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {j.employee_count.toLocaleString()} employees
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Avg Equity: {formatMoney(j.avg_equity_usd)}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
