import React, { useEffect, useState } from 'react';
import { getGenderPayGap, getBandCompliance } from '../../services/api';
import { GenderPayGapAnalysis, BandComplianceSummary, OutlierEmployee } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { SalaryAdjustModal } from '../directory/SalaryAdjustModal';
import {
  Scale,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
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
import { Tag, Spin, Table } from 'antd';

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
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spin size="large" />
        <p className="mt-3 text-xs text-slate-500">Analyzing pay parity and band deviations...</p>
      </div>
    );
  }

  const outlierColumns = [
    {
      title: 'Employee',
      key: 'emp',
      render: (_: any, r: OutlierEmployee) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{r.name}</div>
          <div className="text-[10px] font-mono text-slate-400">{r.employee_code}</div>
        </div>
      ),
    },
    {
      title: 'Dept & Level',
      key: 'dept',
      render: (_: any, r: OutlierEmployee) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{r.department}</div>
          <Tag color="purple" className="text-[10px] m-0 py-0 px-1">{r.job_level}</Tag>
        </div>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      render: (c: string) => <span className="text-xs text-slate-700">{c}</span>,
    },
    {
      title: `Current Salary (${selectedCurrency})`,
      dataIndex: 'salary_usd',
      key: 'salary_usd',
      render: (s: number) => (
        <span className="text-xs font-bold text-slate-900">{formatMoney(s)}</span>
      ),
    },
    {
      title: `Band Range (${selectedCurrency})`,
      key: 'band_range',
      render: (_: any, r: OutlierEmployee) => (
        <div className="text-xs text-slate-500">
          {formatMoney(r.band_min_usd)} - {formatMoney(r.band_max_usd)}
        </div>
      ),
    },
    {
      title: 'Deviation',
      key: 'deviation',
      render: (_: any, r: OutlierEmployee) => (
        <div>
          <Tag color={r.status === 'UNDERPAID' ? 'red' : 'orange'} className="text-[10px] font-bold border-0">
            {r.status === 'UNDERPAID' ? `-${r.deviation_percentage}% Below Min` : `+${r.deviation_percentage}% Above Max`}
          </Tag>
          <div className="text-[10px] text-slate-500 mt-0.5">{formatMoney(r.deviation_usd)} deviation</div>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: any, r: OutlierEmployee) => (
        <button
          onClick={() =>
            setAdjustOutlier({
              id: r.employee_id,
              employee_code: r.employee_code,
              full_name: r.name,
              job_title: r.job_level,
              base_salary: r.salary_usd,
              bonus_percentage: 10,
              equity_usd: 0,
              currency: 'USD',
            })
          }
          className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center space-x-1"
        >
          <Edit3 className="w-3 h-3" />
          <span>Rectify</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
              Pay Equity & Compensation Governance
            </span>
          </div>
          <h1 className="text-2xl font-extrabold mt-2 tracking-tight">Pay Parity & Salary Band Compliance</h1>
          <p className="text-sm text-slate-300 mt-1">
            Ensure gender pay equality and eliminate compensation band deviations across 10,000 employees.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Gender Parity Ratio</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">
              {(genderData.overall_female_to_male_ratio * 100).toFixed(1)}%
            </span>
            <span className="text-xs font-semibold text-emerald-600">Female / Male</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Industry target parity is 95% - 105%. Overall gap stands at {genderData.overall_gap_percentage}%.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Band Compliance Rate</div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">
              {bandData.compliance_rate_percentage}%
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({bandData.within_band_count.toLocaleString()} / {bandData.total_employees.toLocaleString()})
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${bandData.compliance_rate_percentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget to Rectify Underpaid</div>
          <div className="text-3xl font-black text-amber-600 mt-2">
            {formatMoney(bandData.cost_to_bring_to_minimum_usd)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Cost required to bring all {bandData.underpaid_count} underpaid staff to band minimum.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Scale className="w-4 h-4 text-pink-600" />
              <span>Department Median Pay: Male vs Female ({selectedCurrency})</span>
            </h3>
            <p className="text-xs text-slate-500">Comparison of median compensation across departments</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={genderData.department_breakdown.map((d) => ({
                department: d.department,
                male: Math.round(convertFromUsd(d.male_median_usd)),
                female: Math.round(convertFromUsd(d.female_median_usd)),
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
                formatter={(val: any) => [`${formatMoney(convertFromUsd(val, 'USD'))}`, '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
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
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Priority Compensation Band Outliers</span>
            </h3>
            <p className="text-xs text-slate-500">
              Employees with compensation outside approved bands requiring HR compensation committee review
            </p>
          </div>
          <Tag color="red" className="font-bold text-xs">
            {bandData.top_outliers.length} Priority Flagged
          </Tag>
        </div>

        <Table
          columns={outlierColumns}
          dataSource={bandData.top_outliers}
          rowKey="employee_id"
          pagination={{ pageSize: 10, size: 'small' }}
          className="text-xs"
        />
      </div>

      {adjustOutlier && (
        <SalaryAdjustModal
          visible={!!adjustOutlier}
          employee={adjustOutlier}
          onClose={() => setAdjustOutlier(null)}
          onSuccess={() => {
            fetchData();
            setAdjustOutlier(null);
          }}
        />
      )}
    </div>
  );
};
