from sqlalchemy import and_, asc, desc, or_
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.salary import SalaryRecord


class EmployeeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, employee_id: str) -> Employee | None:
        return self.db.query(Employee).filter(Employee.id == employee_id).first()

    def get_by_email(self, email: str) -> Employee | None:
        return self.db.query(Employee).filter(Employee.email == email).first()

    def count(self) -> int:
        return self.db.query(Employee).count()

    def get_existing_emails(self) -> set:
        return {e[0] for e in self.db.query(Employee.email).all()}

    def get_paginated_with_current_salary(
        self,
        page: int = 1,
        page_size: int = 25,
        search: str | None = None,
        country: str | None = None,
        department: str | None = None,
        job_level: str | None = None,
        gender: str | None = None,
        min_salary_usd: float | None = None,
        max_salary_usd: float | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[tuple[Employee, SalaryRecord]], int]:
        # Base query joining Employee with current active SalaryRecord
        query = self.db.query(Employee, SalaryRecord).join(
            SalaryRecord,
            and_(SalaryRecord.employee_id == Employee.id, SalaryRecord.is_current == True),
        )

        # Apply search filter
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Employee.employee_code.ilike(search_pattern),
                    Employee.first_name.ilike(search_pattern),
                    Employee.last_name.ilike(search_pattern),
                    Employee.email.ilike(search_pattern),
                    Employee.job_title.ilike(search_pattern),
                    Employee.city.ilike(search_pattern),
                )
            )

        # Multi-facet filters
        if country:
            query = query.filter(Employee.country == country)
        if department:
            query = query.filter(Employee.department == department)
        if job_level:
            query = query.filter(Employee.job_level == job_level)
        if gender:
            query = query.filter(Employee.gender == gender)
        if min_salary_usd is not None:
            query = query.filter(SalaryRecord.base_salary_usd >= min_salary_usd)
        if max_salary_usd is not None:
            query = query.filter(SalaryRecord.base_salary_usd <= max_salary_usd)

        total = query.count()

        sort_column_map = {
            "employee_code": Employee.employee_code,
            "first_name": Employee.first_name,
            "last_name": Employee.last_name,
            "department": Employee.department,
            "country": Employee.country,
            "job_level": Employee.job_level,
            "job_title": Employee.job_title,
            "hire_date": Employee.hire_date,
            "performance_rating": Employee.performance_rating,
            "base_salary_usd": SalaryRecord.base_salary_usd,
            "total_compensation_usd": SalaryRecord.total_compensation_usd,
            "created_at": Employee.created_at,
        }

        sort_col = sort_column_map.get(sort_by, Employee.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_col))
        else:
            query = query.order_by(desc(sort_col))

        offset = (page - 1) * page_size
        results = query.offset(offset).limit(page_size).all()
        return results, total

    def add(self, employee: Employee) -> Employee:
        self.db.add(employee)
        return employee

    def bulk_add(self, employees: list[Employee]) -> None:
        self.db.bulk_save_objects(employees)

    def delete(self, employee_id: str) -> bool:
        emp = self.get_by_id(employee_id)
        if emp:
            self.db.delete(emp)
            self.db.commit()
            return True
        return False

    def bulk_delete(self, employee_ids: list[str]) -> int:
        count = (
            self.db.query(Employee)
            .filter(Employee.id.in_(employee_ids))
            .delete(synchronize_session=False)
        )
        self.db.commit()
        return count
