from pydantic import BaseModel
from typing import List, Dict
from app.schemas.salary import ExchangeRateOut, SalaryBandOut

class MetadataResponse(BaseModel):
    countries: List[str]
    country_codes: Dict[str, str]
    country_currencies: Dict[str, str]
    departments: List[str]
    job_levels: List[str]
    job_titles_by_department: Dict[str, List[str]]
    currencies: List[ExchangeRateOut]
    salary_bands: List[SalaryBandOut]
