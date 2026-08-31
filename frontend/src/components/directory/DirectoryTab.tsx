import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Select, Tag, Space, Tooltip, Pagination, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
import {
  Search,
  Download,
  Upload,
  Eye,
  Edit3,
  Trash2,
  RotateCcw,
  Users,
} from 'lucide-react';

interface DirectoryTabProps {
  initialFilter?: { department?: string; country?: string; band_status?: string };
}

export const DirectoryTab: React.FC<DirectoryTabProps> = ({ initialFilter }) => {
  const { formatMoney, selectedCurrency } = useCurrency();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState<string | undefined>(initialFilter?.country);
  const [department, setDepartment] = useState<string | undefined>(initialFilter?.department);
  const [jobLevel, setJobLevel] = useState<string | undefined>(undefined);
  const [gender, setGender] = useState<string | undefined>(undefined);
  const [bandStatus, setBandStatus] = useState<string | undefined>(initialFilter?.band_status);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const [meta, setMeta] = useState<MetadataResponse | null>(null);

  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [adjustEmp, setAdjustEmp] = useState<EmployeeListItem | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    getMetadata().then(setMeta).catch(console.error);
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEmployees({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        country,
        department,
        job_level: jobLevel,
        gender,
        band_status: bandStatus,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setEmployees(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      message.error('Failed to load employee list');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, country, department, jobLevel, gender, bandStatus, sortBy, sortOrder]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleResetFilters = () => {
    setSearch('');
    setCountry(undefined);
    setDepartment(undefined);
    setJobLevel(undefined);
    setGender(undefined);
    setBandStatus(undefined);
    setPage(1);
  };

  const handleDeleteSingle = async (id: string, name: string) => {
    try {
      await deleteEmployee(id);
      message.success(`Deleted employee ${name}`);
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
      fetchEmployees();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to delete employee';
      message.error(msg);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    setDeleting(true);
    try {
      const res = await bulkDeleteEmployees(selectedRowKeys as string[]);
      message.success(`Successfully deleted ${res.deleted_count} employees`);
      setSelectedRowKeys([]);
      fetchEmployees();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Bulk delete failed';
      message.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnsType<EmployeeListItem> = [
    {
      title: 'Employee',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (_, record) => (
        <div>
          <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
            <span>{record.full_name}</span>
            <span className="text-[10px] font-mono text-slate-400 font-normal">({record.employee_code})</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Role & Dept',
      key: 'role',
      render: (_, record) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{record.job_title}</div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
            <span>{record.department}</span>
            <span>•</span>
            <Tag color="purple" className="text-[10px] m-0 py-0 px-1 border-0">
              {record.job_level}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{record.country}</div>
          <div className="text-[11px] text-slate-400">{record.city}</div>
        </div>
      ),
    },
    {
      title: 'Base Pay (Local)',
      key: 'base_local',
      render: (_, record) => (
        <div className="text-xs font-mono font-medium text-slate-700">
          {record.currency} {record.base_salary.toLocaleString()}
        </div>
      ),
    },
    {
      title: `Total Comp (${selectedCurrency})`,
      key: 'total_comp',
      sorter: true,
      render: (_, record) => (
        <div>
          <div className="text-xs font-bold text-slate-900">
            {formatMoney(record.total_compensation_usd)}
          </div>
          <div className="text-[10px] text-slate-400">
            Base: {formatMoney(record.base_salary_usd)} + {record.bonus_percentage}% bonus
          </div>
        </div>
      ),
    },
    {
      title: 'Band Status',
      dataIndex: 'band_status',
      key: 'band_status',
      render: (status: string) => {
        const color =
          status === 'WITHIN_BAND' ? 'green' : status === 'UNDERPAID' ? 'red' : 'orange';
        return (
          <Tag color={color} className="text-[10px] font-semibold border-0">
            {status.replace('_', ' ')}
          </Tag>
        );
      },
    },
    {
      title: 'Performance',
      dataIndex: 'performance_rating',
      key: 'performance_rating',
      render: (rating: number) => (
        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
          ★ {rating.toFixed(1)}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Profile & Audit Trail">
            <button
              onClick={() => setSelectedEmpId(record.id)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip title="Adjust Salary">
            <button
              onClick={() => setAdjustEmp(record)}
              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete Employee"
            description={`Are you sure you want to permanently delete ${record.full_name}?`}
            onConfirm={() => handleDeleteSingle(record.id, record.full_name)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Record">
              <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Employee Compensation Directory</span>
            </h2>
            <Tag color="blue" className="text-xs font-bold font-mono">
              {total.toLocaleString()} Total Records
            </Tag>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Indexed search, multi-facet filtering, salary adjustments, and batch deletion.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-2">
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`Delete ${selectedRowKeys.length} Employees`}
              description={`Are you sure you want to permanently delete these ${selectedRowKeys.length} selected employee records?`}
              onConfirm={handleBulkDelete}
              okText="Yes, Delete All"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <button
                disabled={deleting}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedRowKeys.length})</span>
              </button>
            </Popconfirm>
          )}

          <a
            href={exportCsvUrl}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Import CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="lg:col-span-2">
            <Input
              prefix={<Search className="w-4 h-4 text-slate-400 mr-1" />}
              placeholder="Search by code, name, email, title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              allowClear
              size="middle"
              className="rounded-lg text-xs"
            />
          </div>

          <Select
            placeholder="All Countries"
            value={country}
            onChange={(val) => {
              setCountry(val);
              setPage(1);
            }}
            allowClear
            className="w-full text-xs"
            options={meta?.countries.map((c) => ({ value: c, label: c })) || []}
          />

          <Select
            placeholder="All Departments"
            value={department}
            onChange={(val) => {
              setDepartment(val);
              setPage(1);
            }}
            allowClear
            className="w-full text-xs"
            options={meta?.departments.map((d) => ({ value: d, label: d })) || []}
          />

          <Select
            placeholder="All Levels"
            value={jobLevel}
            onChange={(val) => {
              setJobLevel(val);
              setPage(1);
            }}
            allowClear
            className="w-full text-xs"
            options={meta?.job_levels.map((l) => ({ value: l, label: l })) || []}
          />

          <Select
            placeholder="Band Status"
            value={bandStatus}
            onChange={(val) => {
              setBandStatus(val);
              setPage(1);
            }}
            allowClear
            className="w-full text-xs"
            options={[
              { value: 'WITHIN_BAND', label: '✅ Within Band' },
              { value: 'UNDERPAID', label: '⚠️ Underpaid Outlier' },
              { value: 'OVERPAID', label: '🔺 Overpaid Outlier' },
            ]}
          />
        </div>

        {(search || country || department || jobLevel || gender || bandStatus) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          scroll={{ x: 850 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          className="text-xs"
          onChange={(_pagination, _filters, sorter: any) => {
            if (sorter && sorter.field) {
              setSortBy(sorter.field === 'total_comp' ? 'total_compensation_usd' : sorter.field);
              setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
            }
          }}
        />

        <div className="p-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            {selectedRowKeys.length > 0 ? (
              <span className="font-semibold text-blue-600">
                {selectedRowKeys.length} employee{selectedRowKeys.length > 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{' '}
                <span className="font-bold text-slate-800">{total.toLocaleString()}</span> employees
              </span>
            )}
          </div>

          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            pageSizeOptions={['25', '50', '100']}
            onChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
            size="small"
          />
        </div>
      </div>

      <EmployeeDrawer
        employeeId={selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
        onEmployeeUpdated={fetchEmployees}
      />

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

      <ImportCsvModal
        visible={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          fetchEmployees();
          setImportModalOpen(false);
        }}
      />
    </div>
  );
};
