
from pydantic import BaseModel

from app.schemas.salary import ExchangeRateOut, SalaryBandOut


class MetadataResponse(BaseModel):
    countries: list[str]
    country_codes: dict[str, str]
    country_currencies: dict[str, str]
    departments: list[str]
    job_levels: list[str]
    job_titles_by_department: dict[str, list[str]]
    currencies: list[ExchangeRateOut]
    salary_bands: list[SalaryBandOut]
