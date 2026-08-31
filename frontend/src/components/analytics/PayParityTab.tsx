import React, { useEffect, useState } from 'react';
import { getGenderPayGap, getBandCompliance } from '../../services/api';
import { GenderPayGapAnalysis, BandComplianceSummary, OutlierEmployee } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { SalaryAdjustModal } from '../directory/SalaryAdjustModal';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import {
  Balance,
  Edit,
  WarningAmber,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const PayParityTab: React.FC = () => {
  const { formatMoney, convertFromUsd, selectedCurrency } = useCurrency();
  const [genderData, setGenderData] = useState<GenderPayGapAnalysis | null>(null);
  const [bandData, setBandData] = useState<BandComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustOutlier, setAdjustOutlier] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [g, b] = await Promise.all([getGenderPayGap(), getBandCompliance()]);
      setGenderData(g);
      setBandData(b);
    } catch (err) {
      console.error('Failed to load parity data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !genderData || !bandData) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress size={40} sx={{ color: '#2563eb' }} />
        <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
          Analyzing pay parity and band deviations...
        </Typography>
      </Box>
    );
  }

  const parityChartData = genderData.department_breakdown.map((dept) => ({
    department: dept.department,
    male: Math.round(convertFromUsd(dept.male_median_usd)),
    female: Math.round(convertFromUsd(dept.female_median_usd)),
    ratio: (dept.female_to_male_ratio * 100).toFixed(1),
  }));

  const femaleStats = genderData.overall_by_gender.find((g) => g.gender === 'Female');
  const maleStats = genderData.overall_by_gender.find((g) => g.gender === 'Male');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 6 }}>
      {/* Header Hero */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Chip
          label="Pay Equity & Governance"
          size="small"
          sx={{
            backgroundColor: 'rgba(236, 72, 153, 0.25)',
            color: '#fbcfe8',
            border: '1px solid rgba(244, 114, 182, 0.3)',
            fontWeight: 700,
            fontSize: '0.6875rem',
            mb: 1.5,
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
          Pay Parity & Salary Band Compliance
        </Typography>
        <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
          Ensure gender pay equality and eliminate compensation band deviations across global workforce.
        </Typography>
      </Paper>

      {/* Metric Cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Overall Gender Parity Ratio
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 1 }}>
                {(genderData.overall_female_to_male_ratio * 100).toFixed(1)}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                Female Median: {formatMoney(femaleStats?.median_total_comp_usd || 0)} vs Male Median: {formatMoney(maleStats?.median_total_comp_usd || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Band Compliance Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#059669', mt: 1 }}>
                {bandData.compliance_rate_percentage}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                {bandData.within_band_count.toLocaleString()} of {bandData.total_employees.toLocaleString()} employees within band
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Budget to Fix Underpaid
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#dc2626', mt: 1 }}>
                {formatMoney(bandData.cost_to_bring_to_minimum_usd)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                Required annual budget to bring {bandData.underpaid_count} outliers to band minimum
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gender Comparison Chart */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Balance sx={{ color: '#ec4899', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Department Median Pay by Gender
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 3 }}>
            Median total compensation ({selectedCurrency}) comparison
          </Typography>

          <Box sx={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={parityChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="department" angle={-30} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip
                  formatter={(value: any, name: any) => [`${formatMoney(convertFromUsd(value, 'USD'))}`, name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="male" name="Male Median" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="female" name="Female Median" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Priority Outliers Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmber sx={{ color: '#d97706', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Priority Compensation Band Outliers
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Employees outside approved bands requiring compensation committee review
              </Typography>
            </Box>

            <Chip label={`${bandData.top_outliers.length} Flagged`} color="error" size="small" sx={{ fontWeight: 800 }} />
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Dept & Level</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Current Salary ({selectedCurrency})</TableCell>
                  <TableCell>Band Range ({selectedCurrency})</TableCell>
                  <TableCell>Deviation</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bandData.top_outliers.map((r: OutlierEmployee) => (
                  <TableRow key={r.employee_id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>{r.employee_code}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{r.department}</Typography>
                      <Chip label={r.job_level} size="small" sx={{ height: 18, fontSize: '0.625rem', bgcolor: '#f3e8ff', color: '#7e22ce', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{r.country}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{formatMoney(r.salary_usd)}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      {formatMoney(r.band_min_usd)} - {formatMoney(r.band_max_usd)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.status === 'UNDERPAID' ? `-${r.deviation_percentage}% Below Min` : `+${r.deviation_percentage}% Above Max`}
                        color={r.status === 'UNDERPAID' ? 'error' : 'warning'}
                        size="small"
                        sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() =>
                          setAdjustOutlier({
                            id: r.employee_id,
                            employee_code: r.employee_code,
                            first_name: r.name.split(' ')[0] || '',
                            last_name: r.name.split(' ')[1] || '',
                            full_name: r.name,
                            email: `${r.employee_code.toLowerCase()}@acme.com`,
                            gender: 'Not Specified',
                            country: r.country,
                            country_code: 'US',
                            city: 'Global',
                            department: r.department,
                            job_title: r.job_level,
                            job_level: r.job_level,
                            hire_date: '2024-01-01',
                            performance_rating: 4.0,
                            is_active: true,
                            base_salary: r.salary_usd,
                            bonus_percentage: 10,
                            equity_usd: 0,
                            currency: 'USD',
                            base_salary_usd: r.salary_usd,
                            total_compensation_usd: r.salary_usd,
                            band_status: r.status,
                          })
                        }
                        sx={{ fontSize: '0.75rem', fontWeight: 700, borderRadius: 2 }}
                      >
                        Rectify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {adjustOutlier && (
        <SalaryAdjustModal
          visible={Boolean(adjustOutlier)}
          employee={adjustOutlier}
          onClose={() => setAdjustOutlier(null)}
          onSuccess={() => {
            setAdjustOutlier(null);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};
