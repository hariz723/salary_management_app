import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Float, Index, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_code = Column(String(20), unique=True, index=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    gender = Column(String(20), index=True, nullable=False)  # Female, Male, Non-Binary
    country = Column(String(50), index=True, nullable=False)
    country_code = Column(String(10), index=True, nullable=False)
    city = Column(String(50), nullable=False)
    department = Column(String(50), index=True, nullable=False)
    job_title = Column(String(100), index=True, nullable=False)
    job_level = Column(String(20), index=True, nullable=False)  # Junior, Mid, Senior, Lead, Director, VP
    hire_date = Column(Date, nullable=False, default=date.today)
    performance_rating = Column(Float, default=3.0)  # 1.0 - 5.0
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    salaries = relationship("SalaryRecord", back_populates="employee", cascade="all, delete-orphan", order_by="desc(SalaryRecord.effective_date)")
    audit_logs = relationship("SalaryAuditLog", back_populates="employee", cascade="all, delete-orphan", order_by="desc(SalaryAuditLog.created_at)")

    __table_args__ = (
        Index("ix_emp_dept_level", "department", "job_level"),
        Index("ix_emp_country_dept", "country", "department"),
        Index("ix_emp_dept_country_level", "department", "country", "job_level"),
    )
