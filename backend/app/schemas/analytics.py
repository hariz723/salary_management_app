from typing import Any

from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_employees: int
    total_payroll_usd: float
    mean_salary_usd: float
    median_salary_usd: float
    mean_total_comp_usd: float
    median_total_comp_usd: float
    avg_bonus_percentage: float
    total_equity_usd: float
    active_employees: int
    inactive_employees: int
    total_countries: int
    total_departments: int
    underpaid_count: int
    overpaid_count: int
    within_band_count: int


class DistributionBucket(BaseModel):
    range_label: str
    min_val: float
    max_val: float
    count: int
    percentage: float


class DepartmentStats(BaseModel):
    department: str
    employee_count: int
    total_payroll_usd: float
    mean_base_usd: float
    median_base_usd: float
    mean_total_comp_usd: float
    median_total_comp_usd: float
    p10_usd: float
    p25_usd: float
    p75_usd: float
    p90_usd: float
    min_usd: float
    max_usd: float
    avg_bonus_percentage: float


class CountryStats(BaseModel):
    country: str
    country_code: str
    currency: str
    exchange_rate: float
    employee_count: int
    total_payroll_usd: float
    mean_base_usd: float
    median_base_usd: float
    mean_total_comp_usd: float
    median_total_comp_usd: float
    total_local_currency: float


class JobLevelStats(BaseModel):
    job_level: str
    employee_count: int
    mean_base_usd: float
    median_base_usd: float
    mean_total_comp_usd: float
    median_total_comp_usd: float
    avg_equity_usd: float


class GenderGroupStats(BaseModel):
    gender: str
    count: int
    percentage: float
    mean_base_usd: float
    median_base_usd: float
    mean_total_comp_usd: float
    median_total_comp_usd: float


class GenderDepartmentGap(BaseModel):
    department: str
    male_median_usd: float
    female_median_usd: float
    non_binary_median_usd: float
    gap_percentage_female_vs_male: float  # (male - female) / male * 100
    female_to_male_ratio: float  # female / male


class GenderPayGapAnalysis(BaseModel):
    overall_by_gender: list[GenderGroupStats]
    department_breakdown: list[GenderDepartmentGap]
    overall_female_to_male_ratio: float
    overall_gap_percentage: float


class OutlierEmployee(BaseModel):
    employee_id: str
    employee_code: str
    name: str
    department: str
    job_level: str
    country: str
    salary_usd: float
    band_min_usd: float
    band_mid_usd: float
    band_max_usd: float
    status: str  # UNDERPAID or OVERPAID
    deviation_usd: float
    deviation_percentage: float


class BandComplianceSummary(BaseModel):
    total_employees: int
    within_band_count: int
    underpaid_count: int
    overpaid_count: int
    compliance_rate_percentage: float
    cost_to_bring_to_minimum_usd: float
    top_outliers: list[OutlierEmployee]


class HRQuestionCard(BaseModel):
    id: str
    question: str
    category: str
    summary_answer: str
    detailed_data: dict[str, Any]
