import React, { useEffect, useState } from 'react';
import { getHRQuestions } from '../../services/api';
import { HRQuestionCard } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import {
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Building2,
  Globe2,
  Users,
  Award,
} from 'lucide-react';
import { Tag, Spin } from 'antd';

export const InsightsTab: React.FC = () => {
  const [questions, setQuestions] = useState<HRQuestionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatMoney } = useCurrency();

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const data = await getHRQuestions();
        setQuestions(data);
      } catch (err) {
        console.error('Failed to load HR Q&A:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spin size="large" />
        <p className="mt-3 text-xs text-slate-500">Computing strategic organizational pay answers...</p>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Equity & Diversity':
        return <Users className="w-5 h-5 text-pink-600" />;
      case 'Compensation Governance':
        return <ShieldCheck className="w-5 h-5 text-amber-600" />;
      case 'Department Allocation':
        return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 'Global Payroll':
        return <Globe2 className="w-5 h-5 text-emerald-600" />;
      case 'Executive & Key Talent':
        return <Award className="w-5 h-5 text-blue-600" />;
      default:
        return <HelpCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30 flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Automated HR Intelligence</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold mt-2 tracking-tight">Strategic Compensation Q&A</h1>
          <p className="text-sm text-slate-300 mt-1">
            Instant analytical answers to executive questions regarding how ACME pays its 10,000 employees.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl shrink-0">
                    {getCategoryIcon(q.category)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Tag color="blue" className="text-[10px] font-semibold uppercase tracking-wider border-0">
                        {q.category}
                      </Tag>
                      <span className="text-xs text-slate-400">Question #{idx + 1}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{q.question}</h3>
                    <p className="text-sm text-slate-600 mt-2 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 font-medium">
                      💡 {q.summary_answer}
                    </p>
                  </div>
                </div>
              </div>

              {q.id === 'q1_gender_parity' && q.detailed_data?.departments && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-2">Department Gender Pay Parity Ratio (Female / Male)</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {q.detailed_data.departments.map((dept: any) => (
                      <div key={dept.department} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="font-semibold text-slate-800 truncate">{dept.department}</div>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-slate-500">Parity Ratio:</span>
                          <span className={`font-bold ${dept.female_to_male_ratio >= 0.95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {(dept.female_to_male_ratio * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {q.id === 'q5_top_earners' && q.detailed_data?.top_earners && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-2">Top 5 Highest Compensated Roles Across ACME</div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    {q.detailed_data.top_earners.map((earner: any, eIdx: number) => (
                      <div key={eIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between">
                          <Tag color="gold" className="text-[10px] m-0 font-bold">#{eIdx + 1}</Tag>
                          <span className="font-bold text-blue-700">{formatMoney(earner.total_comp_usd)}</span>
                        </div>
                        <div className="font-bold text-slate-900 mt-1 truncate">{earner.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{earner.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{earner.country}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
