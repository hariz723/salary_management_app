from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional, List
from app.schemas.salary import SalaryRecordOut, SalaryRecordBase
from app.schemas.audit_log import SalaryAuditLogOut

class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    gender: str = Field(..., max_length=20)
    country: str = Field(..., max_length=50)
    country_code: str = Field(..., max_length=10)
    city: str = Field(..., max_length=50)
    department: str = Field(..., max_length=50)
    job_title: str = Field(..., max_length=100)
    job_level: str = Field(..., max_length=20)
    hire_date: date = Field(default_factory=date.today)
    performance_rating: float = Field(default=3.0, ge=1.0, le=5.0)
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    initial_salary: SalaryRecordBase

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    job_level: Optional[str] = None
    performance_rating: Optional[float] = None
    is_active: Optional[bool] = None

class EmployeeListItem(BaseModel):
    id: str
    employee_code: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    gender: str
    country: str
    country_code: str
    city: str
    department: str
    job_title: str
    job_level: str
    hire_date: date
    performance_rating: float
    is_active: bool
    # Flattened current compensation
    base_salary: float
    bonus_percentage: float
    equity_usd: float
    currency: str
    base_salary_usd: float
    total_compensation_usd: float
    band_status: Optional[str] = "WITHIN_BAND"  # WITHIN_BAND, UNDERPAID, OVERPAID

    class Config:
        from_attributes = True

class EmployeeDetail(BaseModel):
    id: str
    employee_code: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    gender: str
    country: str
    country_code: str
    city: str
    department: str
    job_title: str
    job_level: str
    hire_date: date
    performance_rating: float
    is_active: bool
    created_at: datetime
    updated_at: datetime
    current_salary: Optional[SalaryRecordOut] = None
    salary_history: List[SalaryRecordOut] = []
    audit_logs: List[SalaryAuditLogOut] = []
    band_status: Optional[str] = "WITHIN_BAND"
    band_min_usd: Optional[float] = None
    band_mid_usd: Optional[float] = None
    band_max_usd: Optional[float] = None

    class Config:
        from_attributes = True

class PaginatedEmployeeResponse(BaseModel):
    items: List[EmployeeListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
