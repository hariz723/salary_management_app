import React, { useEffect, useState } from 'react';
import { Drawer, Tag, Spin, Timeline, Button, Divider } from 'antd';
import { getEmployeeById } from '../../services/api';
import { EmployeeDetail } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { SalaryAdjustModal } from './SalaryAdjustModal';
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  DollarSign,
  TrendingUp,
  History,
  ShieldCheck,
  AlertCircle,
  Clock,
  Edit3,
} from 'lucide-react';

interface EmployeeDrawerProps {
  employeeId: string | null;
  onClose: () => void;
  onEmployeeUpdated?: () => void;
}

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  employeeId,
  onClose,
  onEmployeeUpdated,
}) => {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const { formatMoney, selectedCurrency } = useCurrency();

  const loadDetails = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const data = await getEmployeeById(employeeId);
      setEmployee(data);
    } catch (err) {
      console.error('Failed to load employee:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [employeeId]);

  if (!employeeId) return null;

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                {employee ? `${employee.first_name[0]}${employee.last_name[0]}` : <User className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-base text-slate-900 leading-tight">
                  {employee?.full_name || 'Employee Profile'}
                </div>
                <div className="text-xs text-slate-500 font-mono">{employee?.employee_code}</div>
              </div>
            </div>
            {employee && (
              <Tag
                color={
                  employee.band_status === 'WITHIN_BAND'
                    ? 'green'
                    : employee.band_status === 'UNDERPAID'
                    ? 'red'
                    : 'orange'
                }
                className="text-xs font-semibold px-2 py-0.5"
              >
                {employee.band_status.replace('_', ' ')}
              </Tag>
            )}
          </div>
        }
        placement="right"
        width={620}
        onClose={onClose}
        open={!!employeeId}
        destroyOnClose
      >
        {loading || !employee ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Spin size="large" />
            <span className="mt-3 text-xs text-slate-500">Loading compensation profile & audit history...</span>
          </div>
        ) : (
          <div className="space-y-6 text-slate-700">
            {/* Quick Metadata Info */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Role:</span>
                <span className="font-semibold text-slate-800">{employee.job_title}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Tag color="purple" className="text-[10px] m-0">{employee.job_level}</Tag>
                <span className="text-slate-500">Dept:</span>
                <span className="font-semibold text-slate-800">{employee.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-800">{employee.city}, {employee.country}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Hired:</span>
                <span className="font-semibold text-slate-800">{employee.hire_date}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-800 truncate">{employee.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-slate-500">Rating:</span>
                <span className="font-bold text-amber-600">{employee.performance_rating} / 5.0</span>
              </div>
            </div>

            {/* Current Compensation Card */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm text-slate-900">Current Total Target Compensation</span>
                </div>
                <button
                  onClick={() => setAdjustModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Adjust Salary</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="p-2.5 bg-white rounded-xl shadow-xs border border-blue-100">
                  <div className="text-[11px] text-slate-500 font-medium">Local Base</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {employee.current_salary?.currency} {employee.current_salary?.base_salary.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl shadow-xs border border-blue-100">
                  <div className="text-[11px] text-slate-500 font-medium">Target Bonus</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {employee.current_salary?.bonus_percentage}%
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl shadow-xs border border-blue-100">
                  <div className="text-[11px] text-slate-500 font-medium">Annual Equity</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    ${employee.current_salary?.equity_usd.toLocaleString()} USD
                  </div>
                </div>
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <div className="text-[11px] text-blue-100 font-medium">Total ({selectedCurrency})</div>
                  <div className="text-sm font-extrabold mt-0.5">
                    {formatMoney(employee.current_salary?.total_compensation_usd || 0)}
                  </div>
                </div>
              </div>

              {/* Band range indicator */}
              {employee.band_min_usd && employee.band_max_usd && (
                <div className="mt-4 pt-3 border-t border-blue-200/50 text-xs">
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Band Min: {formatMoney(employee.band_min_usd)}</span>
                    <span className="font-semibold text-slate-800">Mid: {formatMoney(employee.band_mid_usd || 0)}</span>
                    <span>Max: {formatMoney(employee.band_max_usd)}</span>
                  </div>
                  <div className="relative w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            (((employee.current_salary?.base_salary_usd || 0) - employee.band_min_usd) /
                              (employee.band_max_usd - employee.band_min_usd)) *
                              100,
                            5
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Audit Logs & Compensation Timeline */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <History className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-sm text-slate-900">Chronological Salary Audit Trail</h3>
              </div>

              <Timeline
                mode="left"
                className="text-xs"
                items={employee.audit_logs.map((log) => ({
                  color: log.change_type === 'PROMOTION' ? 'green' : 'blue',
                  label: (
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  ),
                  children: (
                    <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <Tag color="blue" className="text-[10px] m-0 font-semibold">
                          {log.change_type}
                        </Tag>
                        {log.change_percentage > 0 && (
                          <span className="text-[11px] font-bold text-emerald-600">
                            +{log.change_percentage}% Increase
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-800 text-xs mt-1">
                        Reason: {log.reason}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Previous: {formatMoney(log.previous_total_usd)} → New: {formatMoney(log.new_total_usd)}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Logged by {log.changed_by}</span>
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Salary Adjustment Modal */}
      {employee && (
        <SalaryAdjustModal
          visible={adjustModalOpen}
          employee={employee}
          onClose={() => setAdjustModalOpen(false)}
          onSuccess={(updated) => {
            setEmployee(updated);
            if (onEmployeeUpdated) onEmployeeUpdated();
          }}
        />
      )}
    </>
  );
};
