from datetime import date, datetime

from pydantic import BaseModel, Field


class SalaryRecordBase(BaseModel):
    base_salary: float = Field(..., gt=0, description="Base salary in local currency")
    bonus_percentage: float = Field(
        default=0.0, ge=0.0, le=200.0, description="Target bonus percentage"
    )
    equity_usd: float = Field(default=0.0, ge=0.0, description="Annual equity grant in USD")
    currency: str = Field(..., max_length=10, description="Currency code (e.g. USD, EUR, GBP)")
    effective_date: date = Field(default_factory=date.today)


class SalaryRecordOut(SalaryRecordBase):
    id: str
    employee_id: str
    exchange_rate_to_usd: float
    base_salary_usd: float
    bonus_usd: float
    total_compensation_usd: float
    is_current: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SalaryAdjustmentCreate(BaseModel):
    new_base_salary: float = Field(..., gt=0, description="New base salary in local currency")
    new_bonus_percentage: float | None = Field(default=None, ge=0.0, le=200.0)
    new_equity_usd: float | None = Field(default=None, ge=0.0)
    change_type: str = Field(
        default="ADJUSTMENT", description="ADJUSTMENT, PROMOTION, ANNUAL_REVIEW, CORRECTION"
    )
    reason: str = Field(
        ..., min_length=3, max_length=255, description="Mandatory business reason for adjustment"
    )
    notes: str | None = None
    effective_date: date | None = Field(default_factory=date.today)
    changed_by: str = Field(default="HR Manager")


class SalaryBandOut(BaseModel):
    id: str
    department: str
    job_level: str
    country: str
    min_salary_usd: float
    mid_salary_usd: float
    max_salary_usd: float

    class Config:
        from_attributes = True


class ExchangeRateOut(BaseModel):
    currency_code: str
    rate_to_usd: float
    symbol: str
    currency_name: str
    last_updated: datetime

    class Config:
        from_attributes = True
