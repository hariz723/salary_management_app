import axios from 'axios';
import {
  AuthToken,
  EmployeeDetail,
  PaginatedEmployeeResponse,
  OverviewStats,
  DistributionBucket,
  DepartmentStats,
  CountryStats,
  JobLevelStats,
  GenderPayGapAnalysis,
  BandComplianceSummary,
  HRQuestionCard,
  MetadataResponse,
  User
} from '../types';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('acme_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const login = async (email: string, password: string): Promise<AuthToken> => {
  const res = await apiClient.post<AuthToken>('/auth/login', { email, password });
  return res.data;
};

export const signup = async (payload: { email: string; password: string; full_name: string; role?: string }): Promise<AuthToken> => {
  const res = await apiClient.post<AuthToken>('/auth/signup', payload);
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await apiClient.get<User>('/auth/me');
  return res.data;
};

// Employee API
export const getEmployees = async (params: {
  page?: number;
  page_size?: number;
  search?: string;
  country?: string;
  department?: string;
  job_level?: string;
  gender?: string;
  min_salary_usd?: number;
  max_salary_usd?: number;
  band_status?: string;
  sort_by?: string;
  sort_order?: string;
}): Promise<PaginatedEmployeeResponse> => {
  const res = await apiClient.get<PaginatedEmployeeResponse>('/employees', { params });
  return res.data;
};

export const getEmployeeById = async (id: string): Promise<EmployeeDetail> => {
  const res = await apiClient.get<EmployeeDetail>(`/employees/${id}`);
  return res.data;
};

export interface CreateEmployeePayload {
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  country: string;
  country_code: string;
  city: string;
  department: string;
  job_title: string;
  job_level: string;
  hire_date?: string;
  performance_rating?: number;
  is_active?: boolean;
  initial_salary: {
    base_salary: number;
    bonus_percentage?: number;
    equity_usd?: number;
    currency: string;
  };
}

export const createEmployee = async (payload: CreateEmployeePayload): Promise<EmployeeDetail> => {
  const res = await apiClient.post<EmployeeDetail>('/employees', payload);
  return res.data;
};

export const deleteEmployee = async (id: string): Promise<{ status: string; message: string }> => {
  const res = await apiClient.delete<{ status: string; message: string }>(`/employees/${id}`);
  return res.data;
};

export const bulkDeleteEmployees = async (ids: string[]): Promise<{ status: string; deleted_count: number }> => {
  const res = await apiClient.post<{ status: string; deleted_count: number }>('/employees/bulk-delete', {
    employee_ids: ids,
  });
  return res.data;
};

// Salary API
export const adjustSalary = async (
  employeeId: string,
  payload: {
    new_base_salary: number;
    new_bonus_percentage?: number;
    new_equity_usd?: number;
    change_type?: string;
    reason: string;
    notes?: string;
    effective_date?: string;
    changed_by?: string;
  }
): Promise<EmployeeDetail> => {
  const res = await apiClient.post<EmployeeDetail>(`/salaries/adjust/${employeeId}`, payload);
  return res.data;
};

// Analytics API
export const getOverviewStats = async (): Promise<OverviewStats> => {
  const res = await apiClient.get<OverviewStats>('/analytics/overview');
  return res.data;
};

export const getPayDistribution = async (country?: string, department?: string): Promise<DistributionBucket[]> => {
  const res = await apiClient.get<DistributionBucket[]>('/analytics/distribution', {
    params: { country, department },
  });
  return res.data;
};

export const getDepartmentStats = async (): Promise<DepartmentStats[]> => {
  const res = await apiClient.get<DepartmentStats[]>('/analytics/departments');
  return res.data;
};

export const getCountryStats = async (): Promise<CountryStats[]> => {
  const res = await apiClient.get<CountryStats[]>('/analytics/countries');
  return res.data;
};

export const getJobLevelStats = async (): Promise<JobLevelStats[]> => {
  const res = await apiClient.get<JobLevelStats[]>('/analytics/job-levels');
  return res.data;
};

export const getGenderPayGap = async (): Promise<GenderPayGapAnalysis> => {
  const res = await apiClient.get<GenderPayGapAnalysis>('/analytics/gender-pay-gap');
  return res.data;
};

export const getBandCompliance = async (): Promise<BandComplianceSummary> => {
  const res = await apiClient.get<BandComplianceSummary>('/analytics/band-compliance');
  return res.data;
};

export const getHRQuestions = async (): Promise<HRQuestionCard[]> => {
  const res = await apiClient.get<HRQuestionCard[]>('/analytics/hr-questions');
  return res.data;
};

// Metadata API
export const getMetadata = async (): Promise<MetadataResponse> => {
  const res = await apiClient.get<MetadataResponse>('/metadata');
  return res.data;
};

// CSV Export & Import
export const exportCsvUrl = `${API_BASE}/data/export-csv`;

export const importCsv = async (file: File): Promise<{
  total_rows: number;
  imported_count: number;
  failed_count: number;
  errors: Array<{ row: number; error: string }>;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/data/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
