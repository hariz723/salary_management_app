import React, { useState } from 'react';
import { Modal, Form, InputNumber, Select, Input, DatePicker, message, Alert } from 'antd';
import { adjustSalary } from '../../services/api';
import { EmployeeListItem, EmployeeDetail } from '../../types';
import { DollarSign } from 'lucide-react';
import dayjs from 'dayjs';

interface SalaryAdjustModalProps {
  visible: boolean;
  employee: EmployeeListItem | EmployeeDetail | null;
  onClose: () => void;
  onSuccess: (updatedEmployee: EmployeeDetail) => void;
}

export const SalaryAdjustModal: React.FC<SalaryAdjustModalProps> = ({
  visible,
  employee,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!employee) return null;

  const currentBase = employee.base_salary;
  const currentBonus = employee.bonus_percentage;
  const currentEquity = employee.equity_usd;
  const currency = employee.currency;

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const updated = await adjustSalary(employee.id, {
        new_base_salary: values.new_base_salary,
        new_bonus_percentage: values.new_bonus_percentage,
        new_equity_usd: values.new_equity_usd,
        change_type: values.change_type,
        reason: values.reason,
        notes: values.notes,
        effective_date: values.effective_date ? values.effective_date.format('YYYY-MM-DD') : undefined,
        changed_by: 'HR Manager',
      });
      message.success(`Salary adjusted successfully for ${employee.full_name}! Audit log created.`);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to adjust compensation';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">Adjust Compensation & Log Audit</div>
            <div className="text-xs text-slate-500 font-normal">
              {employee.full_name} ({employee.employee_code}) • {employee.job_title}
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={560}
      className="rounded-2xl overflow-hidden"
    >
      <div className="my-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-500">Current Base: </span>
          <span className="font-bold text-slate-800">
            {currency} {currentBase.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Bonus: </span>
          <span className="font-bold text-slate-800">{currentBonus}%</span>
        </div>
        <div>
          <span className="text-slate-500">Equity: </span>
          <span className="font-bold text-slate-800">${currentEquity.toLocaleString()} USD</span>
        </div>
      </div>

      {errorMsg && (
        <Alert message={errorMsg} type="error" showIcon className="mb-4 rounded-lg text-xs" />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          new_base_salary: currentBase,
          new_bonus_percentage: currentBonus,
          new_equity_usd: currentEquity,
          change_type: 'ADJUSTMENT',
          effective_date: dayjs(),
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <Form.Item
            name="new_base_salary"
            label={<span className="text-xs font-semibold">New Base Salary ({currency})</span>}
            rules={[{ required: true, message: 'Please enter new base salary' }]}
          >
            <InputNumber
              className="w-full"
              min={1}
              size="middle"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
            />
          </Form.Item>

          <Form.Item
            name="change_type"
            label={<span className="text-xs font-semibold">Adjustment Type</span>}
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'ADJUSTMENT', label: 'Market / Merit Adjustment' },
                { value: 'PROMOTION', label: 'Promotion' },
                { value: 'ANNUAL_REVIEW', label: 'Annual Compensation Review' },
                { value: 'BAND_CORRECTION', label: 'Band Parity Correction' },
                { value: 'CORRECTION', label: 'Data Correction' },
              ]}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item
            name="new_bonus_percentage"
            label={<span className="text-xs font-semibold">Target Bonus (%)</span>}
          >
            <InputNumber className="w-full" min={0} max={200} step={0.5} />
          </Form.Item>

          <Form.Item
            name="new_equity_usd"
            label={<span className="text-xs font-semibold">Annual Equity Grant (USD)</span>}
          >
            <InputNumber
              className="w-full"
              min={0}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="effective_date"
          label={<span className="text-xs font-semibold">Effective Date</span>}
        >
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          name="reason"
          label={<span className="text-xs font-semibold">Mandatory Business Reason (For Audit Log)</span>}
          rules={[{ required: true, min: 3, message: 'Please provide a clear justification' }]}
        >
          <Input placeholder="e.g. Q3 Performance Merit Increase, promoted to Lead Engineer" />
        </Form.Item>

        <Form.Item name="notes" label={<span className="text-xs font-semibold">Additional Notes (Optional)</span>}>
          <Input.TextArea rows={2} placeholder="Optional committee approvals or benchmark links" />
        </Form.Item>

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center space-x-1.5"
          >
            {loading ? 'Saving...' : 'Confirm & Write Audit Entry'}
          </button>
        </div>
      </Form>
    </Modal>
  );
};
