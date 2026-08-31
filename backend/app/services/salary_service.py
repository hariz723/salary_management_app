import uuid
from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models.audit_log import SalaryAuditLog
from app.models.salary import SalaryRecord
from app.repositories import AuditLogRepository, EmployeeRepository, SalaryRepository
from app.schemas.employee import EmployeeDetail
from app.schemas.salary import SalaryAdjustmentCreate
from app.services.employee_service import get_employee_by_id
from app.services.metadata_service import COUNTRIES_DATA


def adjust_salary(db: Session, employee_id: str, data: SalaryAdjustmentCreate) -> EmployeeDetail:
    emp_repo = EmployeeRepository(db)
    sal_repo = SalaryRepository(db)
    audit_repo = AuditLogRepository(db)

    emp = emp_repo.get_by_id(employee_id)
    if not emp:
        raise ValueError(f"Employee with ID {employee_id} not found")

    current_sal = sal_repo.get_current_by_employee_id(employee_id)
    if not current_sal:
        history = sal_repo.get_history_by_employee_id(employee_id)
        current_sal = history[0] if history else None

    old_base = current_sal.base_salary if current_sal else 0.0
    old_total_usd = current_sal.total_compensation_usd if current_sal else 0.0
    currency = (
        current_sal.currency
        if current_sal
        else COUNTRIES_DATA.get(emp.country, {}).get("currency", "USD")
    )

    rate_row = sal_repo.get_exchange_rate(currency)
    rate = (
        rate_row.rate_to_usd if rate_row else COUNTRIES_DATA.get(emp.country, {}).get("rate", 1.0)
    )

    bonus_pct = (
        data.new_bonus_percentage
        if data.new_bonus_percentage is not None
        else (current_sal.bonus_percentage if current_sal else 0.0)
    )
    equity_usd = (
        data.new_equity_usd
        if data.new_equity_usd is not None
        else (current_sal.equity_usd if current_sal else 0.0)
    )

    new_base_usd = round(data.new_base_salary * rate, 2)
    bonus_usd = round(new_base_usd * (bonus_pct / 100.0), 2)
    new_total_usd = round(new_base_usd + bonus_usd + equity_usd, 2)

    change_pct = (
        round(((data.new_base_salary - old_base) / old_base * 100.0), 2) if old_base > 0 else 0.0
    )

    if current_sal:
        current_sal.is_current = False
        sal_repo.add(current_sal)

    new_sal = SalaryRecord(
        id=str(uuid.uuid4()),
        employee_id=emp.id,
        base_salary=data.new_base_salary,
        bonus_percentage=bonus_pct,
        equity_usd=equity_usd,
        currency=currency,
        exchange_rate_to_usd=rate,
        base_salary_usd=new_base_usd,
        bonus_usd=bonus_usd,
        total_compensation_usd=new_total_usd,
        effective_date=data.effective_date or date.today(),
        is_current=True,
    )
    sal_repo.add(new_sal)

    audit = SalaryAuditLog(
        id=str(uuid.uuid4()),
        employee_id=emp.id,
        change_type=data.change_type,
        previous_base=old_base,
        new_base=data.new_base_salary,
        previous_total_usd=old_total_usd,
        new_total_usd=new_total_usd,
        change_percentage=change_pct,
        reason=data.reason,
        notes=data.notes,
        changed_by=data.changed_by,
        created_at=datetime.utcnow(),
    )
    audit_repo.add(audit)

    db.commit()
    return get_employee_by_id(db, employee_id)
