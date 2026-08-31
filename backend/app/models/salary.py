import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class SalaryRecord(Base):
    __tablename__ = "salary_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    base_salary = Column(Float, nullable=False)
    bonus_percentage = Column(Float, default=0.0)
    equity_usd = Column(Float, default=0.0)
    currency = Column(String(10), nullable=False, default="USD")
    exchange_rate_to_usd = Column(Float, nullable=False, default=1.0)
    base_salary_usd = Column(Float, nullable=False, index=True)
    bonus_usd = Column(Float, nullable=False, default=0.0)
    total_compensation_usd = Column(Float, nullable=False, index=True)
    effective_date = Column(Date, nullable=False, default=date.today)
    is_current = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee", back_populates="salaries")

    __table_args__ = (Index("ix_salary_emp_current", "employee_id", "is_current"),)


class SalaryBand(Base):
    __tablename__ = "salary_bands"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department = Column(String(50), nullable=False, index=True)
    job_level = Column(String(20), nullable=False, index=True)
    country = Column(String(50), nullable=False, index=True)
    min_salary_usd = Column(Float, nullable=False)
    mid_salary_usd = Column(Float, nullable=False)
    max_salary_usd = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_band_dept_level_country", "department", "job_level", "country", unique=True),
    )


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    currency_code = Column(String(10), primary_key=True)
    rate_to_usd = Column(Float, nullable=False)  # 1 Currency Unit = rate_to_usd USD
    symbol = Column(String(10), default="$")
    currency_name = Column(String(50), nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow)
