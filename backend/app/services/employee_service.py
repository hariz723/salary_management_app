import math
import uuid

from sqlalchemy.orm import Session

from app.models.audit_log import SalaryAuditLog
from app.models.employee import Employee
from app.models.salary import SalaryRecord
from app.repositories import AuditLogRepository, EmployeeRepository, SalaryRepository
from app.schemas.audit_log import SalaryAuditLogOut
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeDetail,
    EmployeeListItem,
    PaginatedEmployeeResponse,
)
from app.schemas.salary import SalaryRecordOut
from app.services.metadata_service import COUNTRIES_DATA, get_band_for


def get_employees(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    search: str | None = None,
    country: str | None = None,
    department: str | None = None,
    job_level: str | None = None,
    gender: str | None = None,
    min_salary_usd: float | None = None,
    max_salary_usd: float | None = None,
    band_status: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> PaginatedEmployeeResponse:
    page = max(1, page)
    page_size = min(max(1, page_size), 200)

    emp_repo = EmployeeRepository(db)
    results, total = emp_repo.get_paginated_with_current_salary(
        page=page,
        page_size=page_size,
        search=search,
        country=country,
        department=department,
        job_level=job_level,
        gender=gender,
        min_salary_usd=min_salary_usd,
        max_salary_usd=max_salary_usd,
        sort_by=sort_by,
        sort_order=sort_order
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    items: list[EmployeeListItem] = []
    for emp, sal in results:
        min_band, mid_band, max_band = get_band_for(emp.department, emp.job_level, emp.country)
        status = "WITHIN_BAND"
        if sal.base_salary_usd < min_band:
            status = "UNDERPAID"
        elif sal.base_salary_usd > max_band:
            status = "OVERPAID"

        if band_status and band_status.upper() != status:
            continue

        items.append(
            EmployeeListItem(
                id=emp.id,
                employee_code=emp.employee_code,
                first_name=emp.first_name,
                last_name=emp.last_name,
                full_name=f"{emp.first_name} {emp.last_name}",
                email=emp.email,
                gender=emp.gender,
                country=emp.country,
                country_code=emp.country_code,
                city=emp.city,
                department=emp.department,
                job_title=emp.job_title,
                job_level=emp.job_level,
                hire_date=emp.hire_date,
                performance_rating=emp.performance_rating,
                is_active=emp.is_active,
                base_salary=sal.base_salary,
                bonus_percentage=sal.bonus_percentage,
                equity_usd=sal.equity_usd,
                currency=sal.currency,
                base_salary_usd=round(sal.base_salary_usd, 2),
                total_compensation_usd=round(sal.total_compensation_usd, 2),
                band_status=status
            )
        )

    return PaginatedEmployeeResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

def get_employee_by_id(db: Session, employee_id: str) -> EmployeeDetail | None:
    emp_repo = EmployeeRepository(db)
    sal_repo = SalaryRepository(db)
    audit_repo = AuditLogRepository(db)

    emp = emp_repo.get_by_id(employee_id)
    if not emp:
        return None

    salaries = sal_repo.get_history_by_employee_id(employee_id)
    audit_logs = audit_repo.get_by_employee_id(employee_id)

    current_sal = next((s for s in salaries if s.is_current), salaries[0] if salaries else None)

    min_band, mid_band, max_band = get_band_for(emp.department, emp.job_level, emp.country)
    band_status = "WITHIN_BAND"
    if current_sal:
        if current_sal.base_salary_usd < min_band:
            band_status = "UNDERPAID"
        elif current_sal.base_salary_usd > max_band:
            band_status = "OVERPAID"

    return EmployeeDetail(
        id=emp.id,
        employee_code=emp.employee_code,
        first_name=emp.first_name,
        last_name=emp.last_name,
        full_name=f"{emp.first_name} {emp.last_name}",
        email=emp.email,
        gender=emp.gender,
        country=emp.country,
        country_code=emp.country_code,
        city=emp.city,
        department=emp.department,
        job_title=emp.job_title,
        job_level=emp.job_level,
        hire_date=emp.hire_date,
        performance_rating=emp.performance_rating,
        is_active=emp.is_active,
        created_at=emp.created_at,
        updated_at=emp.updated_at,
        current_salary=SalaryRecordOut.model_validate(current_sal) if current_sal else None,
        salary_history=[SalaryRecordOut.model_validate(s) for s in salaries],
        audit_logs=[SalaryAuditLogOut.model_validate(a) for a in audit_logs],
        band_status=band_status,
        band_min_usd=min_band,
        band_mid_usd=mid_band,
        band_max_usd=max_band
    )

def create_employee(db: Session, data: EmployeeCreate) -> EmployeeDetail:
    emp_repo = EmployeeRepository(db)
    sal_repo = SalaryRepository(db)
    audit_repo = AuditLogRepository(db)

    count = emp_repo.count()
    emp_code = f"ACM-{count + 1:05d}"

    emp = Employee(
        id=str(uuid.uuid4()),
        employee_code=emp_code,
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        gender=data.gender,
        country=data.country,
        country_code=data.country_code,
        city=data.city,
        department=data.department,
        job_title=data.job_title,
        job_level=data.job_level,
        hire_date=data.hire_date,
        performance_rating=data.performance_rating,
        is_active=data.is_active,
    )
    emp_repo.add(emp)
    db.flush()

    rate_row = sal_repo.get_exchange_rate(data.initial_salary.currency)
    rate = rate_row.rate_to_usd if rate_row else COUNTRIES_DATA.get(data.country, {}).get("rate", 1.0)

    base_usd = round(data.initial_salary.base_salary * rate, 2)
    bonus_usd = round(base_usd * (data.initial_salary.bonus_percentage / 100.0), 2)
    total_comp_usd = round(base_usd + bonus_usd + data.initial_salary.equity_usd, 2)

    sal = SalaryRecord(
        id=str(uuid.uuid4()),
        employee_id=emp.id,
        base_salary=data.initial_salary.base_salary,
        bonus_percentage=data.initial_salary.bonus_percentage,
        equity_usd=data.initial_salary.equity_usd,
        currency=data.initial_salary.currency,
        exchange_rate_to_usd=rate,
        base_salary_usd=base_usd,
        bonus_usd=bonus_usd,
        total_compensation_usd=total_comp_usd,
        effective_date=data.initial_salary.effective_date,
        is_current=True
    )
    sal_repo.add(sal)

    audit = SalaryAuditLog(
        id=str(uuid.uuid4()),
        employee_id=emp.id,
        change_type="INITIAL_HIRE",
        previous_base=0.0,
        new_base=data.initial_salary.base_salary,
        previous_total_usd=0.0,
        new_total_usd=total_comp_usd,
        change_percentage=100.0,
        reason="Initial onboarding compensation package",
        notes=None,
        changed_by="HR Manager"
    )
    audit_repo.add(audit)
    db.commit()
    db.refresh(emp)

    return get_employee_by_id(db, emp.id)
