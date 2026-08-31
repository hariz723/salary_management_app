import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class SalaryAuditLog(Base):
    __tablename__ = "salary_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(
        String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )
    change_type = Column(
        String(50), nullable=False
    )  # ADJUSTMENT, PROMOTION, ANNUAL_REVIEW, CORRECTION, INITIAL_SEED
    previous_base = Column(Float, nullable=False)
    new_base = Column(Float, nullable=False)
    previous_total_usd = Column(Float, nullable=False)
    new_total_usd = Column(Float, nullable=False)
    change_percentage = Column(Float, nullable=False)
    reason = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    changed_by = Column(String(100), default="HR Manager", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    employee = relationship("Employee", back_populates="audit_logs")

    __table_args__ = (Index("ix_audit_emp_created", "employee_id", "created_at"),)
