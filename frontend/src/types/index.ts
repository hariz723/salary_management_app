export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string | null;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

export interface EmployeeListItem {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  gender: string;
  country: string;
  country_code: string;
  city: string;
  department: string;
  job_title: string;
  job_level: string;
  hire_date: string;
  performance_rating: number;
  is_active: boolean;
  base_salary: number;
  bonus_percentage: number;
  equity_usd: number;
  currency: string;
  base_salary_usd: number;
  total_compensation_usd: number;
  band_status: 'WITHIN_BAND' | 'UNDERPAID' | 'OVERPAID';
}

export interface SalaryRecord {
  id: string;
  employee_id: string;
  base_salary: number;
  bonus_percentage: number;
  equity_usd: number;
  currency: string;
  exchange_rate_to_usd: number;
  base_salary_usd: number;
  bonus_usd: number;
  total_compensation_usd: number;
  effective_date: string;
  is_current: boolean;
  created_at: string;
}

export interface SalaryAuditLog {
  id: string;
  employee_id: string;
  change_type: string;
  previous_base: number;
  new_base: number;
  previous_total_usd: number;
  new_total_usd: number;
  change_percentage: number;
  reason: string;
  notes?: string | null;
  changed_by: string;
  created_at: string;
}

export interface EmployeeDetail {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  gender: string;
  country: string;
  country_code: string;
  city: string;
  department: string;
  job_title: string;
  job_level: string;
  hire_date: string;
  performance_rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_salary?: SalaryRecord | null;
  salary_history: SalaryRecord[];
  audit_logs: SalaryAuditLog[];
  band_status: 'WITHIN_BAND' | 'UNDERPAID' | 'OVERPAID';
  band_min_usd?: number;
  band_mid_usd?: number;
  band_max_usd?: number;
}

export interface PaginatedEmployeeResponse {
  items: EmployeeListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OverviewStats {
  total_employees: number;
  total_payroll_usd: number;
  mean_salary_usd: number;
  median_salary_usd: number;
  mean_total_comp_usd: number;
  median_total_comp_usd: number;
  avg_bonus_percentage: number;
  total_equity_usd: number;
  active_employees: number;
  inactive_employees: number;
  total_countries: number;
  total_departments: number;
  underpaid_count: number;
  overpaid_count: number;
  within_band_count: number;
}

export interface DistributionBucket {
  range_label: string;
  min_val: number;
  max_val: number;
  count: number;
  percentage: number;
}

export interface DepartmentStats {
  department: string;
  employee_count: number;
  total_payroll_usd: number;
  mean_base_usd: number;
  median_base_usd: number;
  mean_total_comp_usd: number;
  median_total_comp_usd: number;
  p10_usd: number;
  p25_usd: number;
  p75_usd: number;
  p90_usd: number;
  min_usd: number;
  max_usd: number;
  avg_bonus_percentage: number;
}

export interface CountryStats {
  country: string;
  country_code: string;
  currency: string;
  exchange_rate: number;
  employee_count: number;
  total_payroll_usd: number;
  mean_base_usd: number;
  median_base_usd: number;
  mean_total_comp_usd: number;
  median_total_comp_usd: number;
  total_local_currency: number;
}

export interface JobLevelStats {
  job_level: string;
  employee_count: number;
  mean_base_usd: number;
  median_base_usd: number;
  mean_total_comp_usd: number;
  median_total_comp_usd: number;
  avg_equity_usd: number;
}

export interface GenderGroupStats {
  gender: string;
  count: number;
  percentage: number;
  mean_base_usd: number;
  median_base_usd: number;
  mean_total_comp_usd: number;
  median_total_comp_usd: number;
}

export interface GenderDepartmentGap {
  department: string;
  male_median_usd: number;
  female_median_usd: number;
  non_binary_median_usd: number;
  gap_percentage_female_vs_male: number;
  female_to_male_ratio: number;
}

export interface GenderPayGapAnalysis {
  overall_by_gender: GenderGroupStats[];
  department_breakdown: GenderDepartmentGap[];
  overall_female_to_male_ratio: number;
  overall_gap_percentage: number;
}

export interface OutlierEmployee {
  employee_id: string;
  employee_code: string;
  name: string;
  department: string;
  job_level: string;
  country: string;
  salary_usd: number;
  band_min_usd: number;
  band_mid_usd: number;
  band_max_usd: number;
  status: 'UNDERPAID' | 'OVERPAID';
  deviation_usd: number;
  deviation_percentage: number;
}

export interface BandComplianceSummary {
  total_employees: number;
  within_band_count: number;
  underpaid_count: number;
  overpaid_count: number;
  compliance_rate_percentage: number;
  cost_to_bring_to_minimum_usd: number;
  top_outliers: OutlierEmployee[];
}

export interface HRQuestionCard {
  id: string;
  question: string;
  category: string;
  summary_answer: string;
  detailed_data: any;
}

export interface ExchangeRate {
  currency_code: string;
  rate_to_usd: number;
  symbol: string;
  currency_name: string;
  last_updated: string;
}

export interface SalaryBand {
  id: string;
  department: string;
  job_level: string;
  country: string;
  min_salary_usd: number;
  mid_salary_usd: number;
  max_salary_usd: number;
}

export interface MetadataResponse {
  countries: string[];
  country_codes: Record<string, string>;
  country_currencies: Record<string, string>;
  departments: string[];
  job_levels: string[];
  job_titles_by_department: Record<string, string[]>;
  currencies: ExchangeRate[];
  salary_bands: SalaryBand[];
}
