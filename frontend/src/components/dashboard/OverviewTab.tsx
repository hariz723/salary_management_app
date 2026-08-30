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
  DollarSign,
  Users,
  TrendingUp,
  Award,
  ShieldCheck,
  Globe2,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { Card, Spin, Tag, Progress } from 'antd';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#6366f1', '#14b8a6'];

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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spin size="large" />
        <p className="mt-4 text-sm text-slate-500 font-medium">Aggregating 10,000 employee records...</p>
      </div>
    );
  }

  if (!overview) {
    return <div className="text-center py-12 text-slate-500">Failed to load compensation overview.</div>;
  }

  const complianceRate = overview.total_employees > 0
    ? ((overview.within_band_count / overview.total_employees) * 100).toFixed(1)
    : '100';

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Live Executive Dashboard
            </span>
            <span className="text-xs text-slate-400">10,000 Headcount Monitored</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight text-white">
            ACME Global Compensation Overview
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Real-time multi-currency pay intelligence, department allocations, and band compliance.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
          <div className="text-right">
            <div className="text-xs text-slate-300">Active Viewing Currency</div>
            <div className="text-lg font-bold text-white tracking-wide">{selectedCurrency}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Annual Payroll */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Annual Payroll</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatMoney(overview.total_payroll_usd)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
              <span>Includes Base + Target Bonuses + Equity</span>
            </div>
          </div>
        </div>

        {/* Card 2: Headcount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {overview.total_employees.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5">
              <span className="font-semibold text-emerald-600">{overview.active_employees} Active</span>
              <span>•</span>
              <span className="text-slate-400">{overview.inactive_employees} Inactive</span>
            </div>
          </div>
        </div>

        {/* Card 3: Median Base & Mean */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Median Base Pay</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatMoney(overview.median_salary_usd)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Mean: <span className="font-semibold text-slate-700">{formatMoney(overview.mean_salary_usd)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Band Compliance */}
        <div
          onClick={() => onNavigateToDirectory({ band_status: 'UNDERPAID' })}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Band Compliance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{complianceRate}%</span>
              <span className="text-xs font-semibold text-amber-600 flex items-center">
                {overview.underpaid_count + overview.overpaid_count} Outliers
                <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${complianceRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Pay Distribution & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pay Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Compensation Distribution (10k Employees)</span>
              </h3>
              <p className="text-xs text-slate-500">Employee count across total compensation tiers</p>
            </div>
          </div>

          <div className="h-72 w-full">
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
                  formatter={(value: any, name: any, props: any) => [
                    `${value.toLocaleString()} employees (${props.payload.percentage}%)`,
                    'Count',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Department Average Total Compensation</span>
              </h3>
              <p className="text-xs text-slate-500">Benchmark comparison converted to {selectedCurrency}</p>
            </div>
          </div>

          <div className="h-72 w-full">
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
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="avg_comp" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Global Country Payroll & Job Level Seniority Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Country Breakdown Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Globe2 className="w-4 h-4 text-emerald-600" />
                <span>Global Payroll by Country & Currency</span>
              </h3>
              <p className="text-xs text-slate-500">8 regional hubs supporting 10,000 employees</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Headcount</th>
                  <th className="py-2.5 px-3">Local Currency</th>
                  <th className="py-2.5 px-3">Total Spend ({selectedCurrency})</th>
                  <th className="py-2.5 px-3">Median Pay</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {countryStats.map((c) => (
                  <tr key={c.country} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 flex items-center space-x-2">
                      <span>{c.country}</span>
                      <Tag color="default" className="text-[10px] m-0">{c.country_code}</Tag>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{c.employee_count.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {c.currency} {c.total_local_currency.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{formatMoney(c.total_payroll_usd)}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{formatMoney(c.median_base_usd)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigateToDirectory({ country: c.country })}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View ({c.employee_count})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Job Seniority Curve */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Job Level Pay Progression</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Base compensation progression by seniority level</p>

            <div className="space-y-3.5">
              {jobLevelStats.map((j) => (
                <div key={j.job_level} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{j.job_level}</span>
                    <span className="font-bold text-purple-700">{formatMoney(j.median_base_usd)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>{j.employee_count.toLocaleString()} employees</span>
                    <span>Avg Equity: {formatMoney(j.avg_equity_usd)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
