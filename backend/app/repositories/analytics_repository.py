from typing import Any

from sqlalchemy import and_, desc
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.salary import SalaryRecord


class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_active_salary_records_for_overview(self) -> list[Any]:
        return (
            self.db.query(
                Employee.is_active,
                Employee.department,
                Employee.job_level,
                Employee.country,
                SalaryRecord.base_salary_usd,
                SalaryRecord.bonus_percentage,
                SalaryRecord.equity_usd,
                SalaryRecord.total_compensation_usd,
            )
            .join(
                SalaryRecord,
                and_(SalaryRecord.employee_id == Employee.id, SalaryRecord.is_current == True),
            )
            .all()
        )

    def get_total_comp_distribution_salaries(
        self, country: str | None = None, department: str | None = None
    ) -> list[float]:
        query = self.db.query(SalaryRecord.total_compensation_usd).join(
            Employee, and_(Employee.id == SalaryRecord.employee_id, SalaryRecord.is_current == True)
        )
        if country:
            query = query.filter(Employee.country == country)
        if department:
            query = query.filter(Employee.department == department)
        return [r[0] for r in query.all()]

    def get_department_salary_records(self) -> list[Any]:
        return (
            self.db.query(
                Employee.department,
                SalaryRecord.base_salary_usd,
                SalaryRecord.bonus_percentage,
                SalaryRecord.total_compensation_usd,
            )
            .join(
                SalaryRecord,
                and_(SalaryRecord.employee_id == Employee.id, SalaryRecord.is_current == True),
            )
            .all()
        )

    def get_country_salary_records(self) -> list[Any]:
        return (
            self.db.query(
                Employee.country,
                Employee.country_code,
                SalaryRecord.currency,
                SalaryRecord.exchange_rate_to_usd,
                SalaryRecord.base_salary,
                SalaryRecord.base_salary_usd,
                SalaryRecord.total_compensation_usd,
            )
            .join(
                SalaryRecord,
                and_(SalaryRecord.employee_id == Employee.id, SalaryRecord.is_current == True),
            )
            .all()
        )

    def get_job_level_salary_records(self) -> list[Any]:
        return (
            self.db.query(
                Employee.job_level,
                SalaryRecord.base_salary_usd,
                SalaryRecord.equity_usd,
                SalaryRecord.total_compensation_usd,
            )
            .join(
                SalaryRecord,
                and_(SalaryRecord.employee_id == Employee.id, SalaryRecord.is_current == True),
            )
            .all()
        )

    def get_gender_salary_records(self) -> list[Any]:
        return (
            self.db.query(
                Employee.gender,
                Employee.department,
                SalaryRecord.base_salary_usd,
                SalaryRecord.total_compensation_usd,
            )
            .join(
                SalaryRecord,
                and_(SalaryRecord.employee_id == Employee.id, SalaryRecord.is_current == True),
            )
            .all()
        )

    def get_band_compliance_records(self) -> list[Any]:
        return (
            self.db.query(
                Employee.id,
                Employee.employee_code,
                Employee.first_name,
                Employee.last_name,
                Employee.department,
                Employee.job_level,
                Employee.country,
                SalaryRecord.base_salary_usd,
            )
            .join(
                SalaryRecord,
                and_(SalaryRecord.employee_id == Employee.id, SalaryRecord.is_current == True),
            )
            .all()
        )

    def get_top_earners(self, limit: int = 5) -> list[Any]:
        return (
            self.db.query(
                Employee.employee_code,
                Employee.first_name,
                Employee.last_name,
                Employee.department,
                Employee.job_title,
                Employee.country,
                SalaryRecord.total_compensation_usd,
            )
            .join(
                SalaryRecord,
                and_(SalaryRecord.employee_id == Employee.id, SalaryRecord.is_current == True),
            )
            .order_by(desc(SalaryRecord.total_compensation_usd))
            .limit(limit)
            .all()
        )

    def get_all_employees_with_current_salary_ordered(self) -> list[tuple[Employee, SalaryRecord]]:
        return (
            self.db.query(Employee, SalaryRecord)
            .join(
                SalaryRecord,
                and_(SalaryRecord.employee_id == Employee.id, SalaryRecord.is_current == True),
            )
            .order_by(Employee.employee_code)
            .all()
        )
