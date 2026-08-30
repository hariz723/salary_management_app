import pytest
from app.repositories import EmployeeRepository, SalaryRepository, AuditLogRepository, AnalyticsRepository
from app.models.employee import Employee
from app.models.salary import SalaryRecord
from app.models.audit_log import SalaryAuditLog

def test_employee_repository(seeded_db):
    repo = EmployeeRepository(seeded_db)
    count = repo.count()
    assert count >= 200

    results, total = repo.get_paginated_with_current_salary(page=1, page_size=10)
    assert len(results) == 10
    assert total >= 200
    first_emp, first_sal = results[0]
    assert first_emp.id is not None
    assert first_sal.base_salary > 0

    # Test get_by_id
    emp_by_id = repo.get_by_id(first_emp.id)
    assert emp_by_id is not None
    assert emp_by_id.email == first_emp.email

def test_salary_repository(seeded_db):
    emp_repo = EmployeeRepository(seeded_db)
    sal_repo = SalaryRepository(seeded_db)

    results, _ = emp_repo.get_paginated_with_current_salary(page=1, page_size=1)
    emp, current_sal = results[0]

    fetched_sal = sal_repo.get_current_by_employee_id(emp.id)
    assert fetched_sal is not None
    assert fetched_sal.id == current_sal.id

    rates = sal_repo.get_all_exchange_rates()
    assert len(rates) == 8

def test_audit_log_repository(seeded_db):
    emp_repo = EmployeeRepository(seeded_db)
    audit_repo = AuditLogRepository(seeded_db)

    results, _ = emp_repo.get_paginated_with_current_salary(page=1, page_size=1)
    emp, _ = results[0]

    logs = audit_repo.get_by_employee_id(emp.id)
    assert len(logs) >= 1
    assert logs[0].change_type in ["INITIAL_SEED", "INITIAL_HIRE", "ADJUSTMENT"]

def test_analytics_repository(seeded_db):
    analytics_repo = AnalyticsRepository(seeded_db)
    records = analytics_repo.get_active_salary_records_for_overview()
    assert len(records) >= 200

    dept_records = analytics_repo.get_department_salary_records()
    assert len(dept_records) >= 200

    top_earners = analytics_repo.get_top_earners(limit=3)
    assert len(top_earners) == 3
    assert top_earners[0].total_compensation_usd >= top_earners[1].total_compensation_usd
