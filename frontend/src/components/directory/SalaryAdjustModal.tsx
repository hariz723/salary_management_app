import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import { adjustSalary } from '../../services/api';
import { EmployeeListItem } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

interface SalaryAdjustModalProps {
  visible: boolean;
  employee: EmployeeListItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const SalaryAdjustModal: React.FC<SalaryAdjustModalProps> = ({
  visible,
  employee,
  onClose,
  onSuccess,
}) => {
  const { formatMoney } = useCurrency();
  const [newBase, setNewBase] = useState<number>(employee.base_salary);
  const [newBonus, setNewBonus] = useState<number>(employee.bonus_percentage);
  const [newEquity, setNewEquity] = useState<number>(employee.equity_usd || 0);
  const [changeType, setChangeType] = useState<string>('MERIT_INCREASE');
  const [reason, setReason] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const percentageChange =
    employee.base_salary > 0
      ? (((newBase - employee.base_salary) / employee.base_salary) * 100).toFixed(1)
      : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Please provide a business reason for this compensation adjustment.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await adjustSalary(employee.id, {
        new_base_salary: newBase,
        new_bonus_percentage: newBonus,
        new_equity_usd: newEquity,
        change_type: changeType,
        reason: reason.trim(),
        effective_date: effectiveDate,
        changed_by: 'HR Manager',
      });
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to adjust salary';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={visible} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUp sx={{ color: '#2563eb' }} />
        <span>Adjust Compensation: {employee.full_name}</span>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          {/* Current vs Proposed Overview */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>Current Base Salary</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {employee.currency} {employee.base_salary.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  USD Equiv: {formatMoney(employee.base_salary_usd)}
                </Typography>
              </Box>

              <Chip
                label={`${Number(percentageChange) >= 0 ? `+${percentageChange}%` : `${percentageChange}%`}`}
                color={Number(percentageChange) >= 0 ? 'success' : 'error'}
                sx={{ fontWeight: 800, fontSize: '0.8125rem' }}
              />
            </Box>
          </Paper>

          {/* Input Fields */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label={`New Base (${employee.currency})`}
              type="number"
              size="small"
              value={newBase}
              onChange={(e) => setNewBase(parseFloat(e.target.value) || 0)}
              required
            />

            <TextField
              label="Target Bonus (%)"
              type="number"
              size="small"
              value={newBonus}
              onChange={(e) => setNewBonus(parseFloat(e.target.value) || 0)}
              required
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Annual Equity (USD $)"
              type="number"
              size="small"
              value={newEquity}
              onChange={(e) => setNewEquity(parseFloat(e.target.value) || 0)}
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Adjustment Type</InputLabel>
              <Select
                value={changeType}
                label="Adjustment Type"
                onChange={(e) => setChangeType(e.target.value)}
              >
                <MenuItem value="MERIT_INCREASE">Merit Increase</MenuItem>
                <MenuItem value="PROMOTION">Promotion</MenuItem>
                <MenuItem value="ANNUAL_REVIEW">Annual Review</MenuItem>
                <MenuItem value="BAND_CORRECTION">Band Parity Correction</MenuItem>
                <MenuItem value="MARKET_ADJUSTMENT">Market Rate Adjustment</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Effective Date"
            type="date"
            size="small"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            label="Business Justification / Reason"
            placeholder="e.g. Promoted to Senior Engineer following H1 performance review."
            multiline
            rows={3}
            size="small"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
            sx={{ fontWeight: 700 }}
          >
            Apply Adjustment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
