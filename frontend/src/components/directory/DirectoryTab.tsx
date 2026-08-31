import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  FileDownload,
  FileUpload,
  Visibility,
  Edit,
  DeleteOutline,
  RestartAlt,
  People,
  PersonAdd,
} from '@mui/icons-material';
import {
  getEmployees,
  getMetadata,
  exportCsvUrl,
  deleteEmployee,
  bulkDeleteEmployees,
} from '../../services/api';
import { EmployeeListItem, MetadataResponse } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { EmployeeDrawer } from './EmployeeDrawer';
import { SalaryAdjustModal } from './SalaryAdjustModal';
import { ImportCsvModal } from './ImportCsvModal';
import { CreateEmployeeModal } from './CreateEmployeeModal';

interface DirectoryTabProps {
  initialFilter?: { department?: string; country?: string; band_status?: string };
}

export const DirectoryTab: React.FC<DirectoryTabProps> = ({ initialFilter }) => {
  const { formatMoney, selectedCurrency } = useCurrency();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState<string>(initialFilter?.country || '');
  const [department, setDepartment] = useState<string>(initialFilter?.department || '');
  const [jobLevel, setJobLevel] = useState<string>('');
  const [bandStatus, setBandStatus] = useState<string>(initialFilter?.band_status || '');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [meta, setMeta] = useState<MetadataResponse | null>(null);

  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [adjustEmp, setAdjustEmp] = useState<EmployeeListItem | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Single delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<EmployeeListItem | null>(null);
  // Bulk delete dialog state
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => {
    getMetadata().then(setMeta).catch(console.error);
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployees({
        page: page + 1,
        page_size: pageSize,
        search: search.trim() || undefined,
        country: country || undefined,
        department: department || undefined,
        job_level: jobLevel || undefined,
        band_status: bandStatus || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setEmployees(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, country, department, jobLevel, bandStatus, sortBy, sortOrder]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleResetFilters = () => {
    setSearch('');
    setCountry('');
    setDepartment('');
    setJobLevel('');
    setBandStatus('');
    setPage(0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowKeys(employees.map((e) => e.id));
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedRowKeys((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmployee(deleteTarget.id);
      setSelectedRowKeys((prev) => prev.filter((k) => k !== deleteTarget.id));
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await bulkDeleteEmployees(selectedRowKeys);
      setSelectedRowKeys([]);
      setBulkDeleteOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const handleSort = (field: string) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 6 }}>
      {/* Header Bar */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People sx={{ color: '#2563eb' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Employee Compensation Directory
              </Typography>
              <Chip
                label={`${total.toLocaleString()} Records`}
                size="small"
                color="primary"
                sx={{ fontWeight: 700, height: 22 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
              Indexed search, multi-facet filtering, salary adjustments, and batch deletion.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {selectedRowKeys.length > 0 && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteOutline />}
                onClick={() => setBulkDeleteOpen(true)}
                sx={{ borderRadius: 2.5, fontWeight: 700 }}
              >
                Delete Selected ({selectedRowKeys.length})
              </Button>
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownload />}
              href={exportCsvUrl}
              sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: '#cbd5e1', color: '#475569' }}
            >
              Export CSV
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUpload />}
              onClick={() => setImportModalOpen(true)}
              sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: '#cbd5e1', color: '#475569' }}
            >
              Bulk Import CSV
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAdd />}
              onClick={() => setCreateModalOpen(true)}
              sx={{
                borderRadius: 2.5,
                fontWeight: 700,
                px: 2,
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              Add Employee
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Search by code, name, email, title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small">
              <InputLabel>Country</InputLabel>
              <Select
                value={country}
                label="Country"
                onChange={(e) => {
                  setCountry(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Countries</MenuItem>
                {meta?.countries.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                label="Department"
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {meta?.departments.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Seniority Level</InputLabel>
              <Select
                value={jobLevel}
                label="Seniority Level"
                onChange={(e) => {
                  setJobLevel(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Levels</MenuItem>
                {meta?.job_levels.map((l) => (
                  <MenuItem key={l} value={l}>
                    {l}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Band Status</InputLabel>
              <Select
                value={bandStatus}
                label="Band Status"
                onChange={(e) => {
                  setBandStatus(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="WITHIN_BAND">✅ Within Band</MenuItem>
                <MenuItem value="UNDERPAID">⚠️ Underpaid Outlier</MenuItem>
                <MenuItem value="OVERPAID">🔺 Overpaid Outlier</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {(search || country || department || jobLevel || bandStatus) && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
              <Button
                size="small"
                startIcon={<RestartAlt />}
                onClick={handleResetFilters}
                sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}
              >
                Reset All Filters
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Employee Data Table */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 680 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < employees.length}
                    checked={employees.length > 0 && selectedRowKeys.length === employees.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'first_name' || sortBy === 'employee_code'}
                    direction={sortOrder}
                    onClick={() => handleSort('first_name')}
                  >
                    Employee
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'department'}
                    direction={sortOrder}
                    onClick={() => handleSort('department')}
                  >
                    Role & Dept
                  </TableSortLabel>
                </TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Base Pay (Local)</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'total_compensation_usd'}
                    direction={sortOrder}
                    onClick={() => handleSort('total_compensation_usd')}
                  >
                    Total Comp ({selectedCurrency})
                  </TableSortLabel>
                </TableCell>
                <TableCell>Band Status</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 1, color: '#64748b' }}>
                      Loading records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    No employee records match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => {
                  const isSelected = selectedRowKeys.includes(emp.id);
                  return (
                    <TableRow key={emp.id} hover selected={isSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleSelectOne(emp.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: '#0f172a' }}>
                            {emp.full_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                            ({emp.employee_code})
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          {emp.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {emp.job_title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {emp.department}
                          </Typography>
                          <Chip
                            label={emp.job_level}
                            size="small"
                            sx={{ height: 18, fontSize: '0.625rem', bgcolor: '#f3e8ff', color: '#7e22ce', fontWeight: 700 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {emp.country}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {emp.city}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {emp.currency} {emp.base_salary.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {formatMoney(emp.total_compensation_usd)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          Base: {formatMoney(emp.base_salary_usd)} + {emp.bonus_percentage}% bonus
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emp.band_status.replace('_', ' ')}
                          size="small"
                          color={
                            emp.band_status === 'WITHIN_BAND'
                              ? 'success'
                              : emp.band_status === 'UNDERPAID'
                              ? 'error'
                              : 'warning'
                          }
                          sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`★ ${emp.performance_rating.toFixed(1)}`}
                          size="small"
                          sx={{ height: 20, fontSize: '0.6875rem', bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View Profile">
                            <IconButton size="small" onClick={() => setSelectedEmpId(emp.id)} sx={{ color: '#2563eb' }}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Adjust Compensation">
                            <IconButton size="small" onClick={() => setAdjustEmp(emp)} sx={{ color: '#059669' }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Employee">
                            <IconButton size="small" onClick={() => setDeleteTarget(emp)} sx={{ color: '#ef4444' }}>
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100]}
          sx={{ borderTop: '1px solid #f1f5f9' }}
        />
      </Card>

      {/* Slide-out Employee Detail Drawer */}
      <EmployeeDrawer
        employeeId={selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
        onEmployeeUpdated={fetchEmployees}
      />

      {/* Salary Adjustment Modal */}
      {adjustEmp && (
        <SalaryAdjustModal
          visible={!!adjustEmp}
          employee={adjustEmp}
          onClose={() => setAdjustEmp(null)}
          onSuccess={() => {
            fetchEmployees();
            setAdjustEmp(null);
          }}
        />
      )}

      {/* CSV Import Modal */}
      <ImportCsvModal
        visible={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          fetchEmployees();
          setImportModalOpen(false);
        }}
      />

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Employee Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete <strong>{deleteTarget?.full_name}</strong> ({deleteTarget?.employee_code})?
            This will also delete associated salary history and audit logs.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmSingleDelete} sx={{ fontWeight: 700 }}>
            Delete Employee
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Bulk Delete Employees</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete all <strong>{selectedRowKeys.length} selected employees</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkDeleteOpen(false)} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmBulkDelete} sx={{ fontWeight: 700 }}>
            Delete All ({selectedRowKeys.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Single Employee Modal */}
      <CreateEmployeeModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onEmployeeCreated={fetchEmployees}
      />
    </Box>
  );
};
