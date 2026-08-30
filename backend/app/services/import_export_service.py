import csv
import io
import uuid
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import SalaryAuditLog
from app.models.employee import Employee
from app.models.salary import SalaryRecord
from app.repositories import (
    AnalyticsRepository,
    AuditLogRepository,
    EmployeeRepository,
    SalaryRepository,
)
from app.services.metadata_service import (
    COUNTRIES_DATA,
    get_band_for,
)


def export_employees_csv(db: Session) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    headers = [
        "Employee Code", "First Name", "Last Name", "Email", "Gender",
        "Country", "Country Code", "City", "Department", "Job Title",
        "Job Level", "Hire Date", "Performance Rating", "Is Active",
        "Currency", "Base Salary", "Bonus %", "Equity USD",
        "Base Salary USD", "Total Compensation USD", "Band Status"
    ]
    writer.writerow(headers)

    analytics_repo = AnalyticsRepository(db)
    records = analytics_repo.get_all_employees_with_current_salary_ordered()

    for emp, sal in records:
        min_b, mid_b, max_b = get_band_for(emp.department, emp.job_level, emp.country)
        status = "WITHIN_BAND"
        if sal.base_salary_usd < min_b:
            status = "UNDERPAID"
        elif sal.base_salary_usd > max_b:
            status = "OVERPAID"

        writer.writerow([
            emp.employee_code,
            emp.first_name,
            emp.last_name,
            emp.email,
            emp.gender,
            emp.country,
            emp.country_code,
            emp.city,
            emp.department,
            emp.job_title,
            emp.job_level,
            emp.hire_date.isoformat() if emp.hire_date else "",
            emp.performance_rating,
            "Active" if emp.is_active else "Inactive",
            sal.currency,
            sal.base_salary,
            sal.bonus_percentage,
            sal.equity_usd,
            sal.base_salary_usd,
            sal.total_compensation_usd,
            status
        ])

    return output.getvalue()

def import_employees_csv(db: Session, csv_text: str) -> dict[str, Any]:
    f = io.StringIO(csv_text.strip())
    reader = csv.DictReader(f)

    required_fields = ["first_name", "last_name", "email", "country", "department", "job_title", "job_level", "base_salary"]

    total_rows = 0
    imported_count = 0
    errors: list[dict[str, Any]] = []

    emp_repo = EmployeeRepository(db)
    sal_repo = SalaryRepository(db)
    audit_repo = AuditLogRepository(db)

    existing_emails = emp_repo.get_existing_emails()
    current_count = emp_repo.count()

    rates_db = {r.currency_code: r.rate_to_usd for r in sal_repo.get_all_exchange_rates()}

    new_employees = []
    new_salaries = []
    new_audits = []

    for row_idx, row in enumerate(reader, start=2):
        total_rows += 1
        clean_row = {k.strip().lower().replace(" ", "_"): v.strip() for k, v in row.items() if k}

        missing = [f for f in required_fields if f not in clean_row or not clean_row[f]]
        if missing:
            errors.append({"row": row_idx, "error": f"Missing required columns: {', '.join(missing)}"})
            continue

        email = clean_row["email"]
        if email in existing_emails:
            errors.append({"row": row_idx, "error": f"Duplicate email address '{email}'"})
            continue

        country = clean_row["country"]
        if country not in COUNTRIES_DATA:
            errors.append({"row": row_idx, "error": f"Invalid country '{country}'. Supported: {', '.join(COUNTRIES_DATA.keys())}"})
            continue

        try:
            base_salary = float(clean_row["base_salary"])
            if base_salary <= 0:
                raise ValueError("Base salary must be greater than 0")
        except ValueError as ex:
            errors.append({"row": row_idx, "error": f"Invalid base salary: {ex!s}"})
            continue

        bonus_pct = float(clean_row.get("bonus_%", clean_row.get("bonus_percentage", 0.0)) or 0.0)
        equity_usd = float(clean_row.get("equity_usd", 0.0) or 0.0)
        gender = clean_row.get("gender", "Female")
        city = clean_row.get("city", "HQ")
        dept = clean_row.get("department", "Engineering")
        job_title = clean_row.get("job_title", "Specialist")
        job_level = clean_row.get("job_level", "Mid")
        currency = clean_row.get("currency", COUNTRIES_DATA[country]["currency"])

        rate = rates_db.get(currency, COUNTRIES_DATA[country]["rate"])
        base_usd = round(base_salary * rate, 2)
        bonus_usd = round(base_usd * (bonus_pct / 100.0), 2)
        total_usd = round(base_usd + bonus_usd + equity_usd, 2)

        emp_id = str(uuid.uuid4())
        emp_code = f"ACM-{current_count + imported_count + 1:05d}"

        emp = Employee(
            id=emp_id,
            employee_code=emp_code,
            first_name=clean_row["first_name"],
            last_name=clean_row["last_name"],
            email=email,
            gender=gender,
            country=country,
            country_code=COUNTRIES_DATA[country]["code"],
            city=city,
            department=dept,
            job_title=job_title,
            job_level=job_level,
            hire_date=date.today(),
            performance_rating=3.5,
            is_active=True
        )
        new_employees.append(emp)

        sal = SalaryRecord(
            id=str(uuid.uuid4()),
            employee_id=emp_id,
            base_salary=base_salary,
            bonus_percentage=bonus_pct,
            equity_usd=equity_usd,
            currency=currency,
            exchange_rate_to_usd=rate,
            base_salary_usd=base_usd,
            bonus_usd=bonus_usd,
            total_compensation_usd=total_usd,
            effective_date=date.today(),
            is_current=True
        )
        new_salaries.append(sal)

        audit = SalaryAuditLog(
            id=str(uuid.uuid4()),
            employee_id=emp_id,
            change_type="CSV_IMPORT",
            previous_base=0.0,
            new_base=base_salary,
            previous_total_usd=0.0,
            new_total_usd=total_usd,
            change_percentage=100.0,
            reason="Bulk CSV upload onboarding",
            notes=None,
            changed_by="HR Manager"
        )
        new_audits.append(audit)

        existing_emails.add(email)
        imported_count += 1

    if new_employees:
        emp_repo.bulk_add(new_employees)
        sal_repo.bulk_add(new_salaries)
        audit_repo.bulk_add(new_audits)
        db.commit()

    return {
        "total_rows": total_rows,
        "imported_count": imported_count,
        "failed_count": len(errors),
        "errors": errors[:50]
    }
