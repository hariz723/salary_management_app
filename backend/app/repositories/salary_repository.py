
from app.models.salary import ExchangeRate, SalaryBand, SalaryRecord
from sqlalchemy import desc
from sqlalchemy.orm import Session


class SalaryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_current_by_employee_id(self, employee_id: str) -> SalaryRecord | None:
        return self.db.query(SalaryRecord).filter(
            SalaryRecord.employee_id == employee_id,
            SalaryRecord.is_current == True
        ).first()

    def get_history_by_employee_id(self, employee_id: str) -> list[SalaryRecord]:
        return self.db.query(SalaryRecord).filter(
            SalaryRecord.employee_id == employee_id
        ).order_by(desc(SalaryRecord.effective_date), desc(SalaryRecord.created_at)).all()

    def add(self, salary_record: SalaryRecord) -> SalaryRecord:
        self.db.add(salary_record)
        return salary_record

    def bulk_add(self, salary_records: list[SalaryRecord]) -> None:
        self.db.bulk_save_objects(salary_records)

    # Exchange rates
    def get_exchange_rate(self, currency_code: str) -> ExchangeRate | None:
        return self.db.query(ExchangeRate).filter(
            ExchangeRate.currency_code == currency_code
        ).first()

    def get_all_exchange_rates(self) -> list[ExchangeRate]:
        return self.db.query(ExchangeRate).all()

    def bulk_add_exchange_rates(self, rates: list[ExchangeRate]) -> None:
        self.db.bulk_save_objects(rates)

    # Salary Bands
    def get_all_salary_bands(self) -> list[SalaryBand]:
        return self.db.query(SalaryBand).all()

    def bulk_add_salary_bands(self, bands: list[SalaryBand]) -> None:
        self.db.bulk_save_objects(bands)
