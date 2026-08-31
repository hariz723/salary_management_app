from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.audit_log import SalaryAuditLog


class AuditLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_employee_id(self, employee_id: str) -> list[SalaryAuditLog]:
        return (
            self.db.query(SalaryAuditLog)
            .filter(SalaryAuditLog.employee_id == employee_id)
            .order_by(desc(SalaryAuditLog.created_at))
            .all()
        )

    def add(self, audit_log: SalaryAuditLog) -> SalaryAuditLog:
        self.db.add(audit_log)
        return audit_log

    def bulk_add(self, audit_logs: list[SalaryAuditLog]) -> None:
        self.db.bulk_save_objects(audit_logs)
