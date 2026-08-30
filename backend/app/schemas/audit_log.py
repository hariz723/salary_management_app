from datetime import datetime

from pydantic import BaseModel


class SalaryAuditLogOut(BaseModel):
    id: str
    employee_id: str
    change_type: str
    previous_base: float
    new_base: float
    previous_total_usd: float
    new_total_usd: float
    change_percentage: float
    reason: str
    notes: str | None
    changed_by: str
    created_at: datetime

    class Config:
        from_attributes = True
