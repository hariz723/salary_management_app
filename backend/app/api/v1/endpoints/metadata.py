from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.salary_repository import SalaryRepository
from app.schemas.metadata import MetadataResponse
from app.schemas.salary import ExchangeRateOut, SalaryBandOut
from app.services.metadata_service import get_static_metadata

router = APIRouter()

@router.get("", response_model=MetadataResponse, summary="Get application reference metadata")
def get_metadata(db: Session = Depends(get_db)):
    static_data = get_static_metadata()
    sal_repo = SalaryRepository(db)
    currencies = sal_repo.get_all_exchange_rates()
    bands = sal_repo.get_all_salary_bands()

    return MetadataResponse(
        countries=static_data["countries"],
        country_codes=static_data["country_codes"],
        country_currencies=static_data["country_currencies"],
        departments=static_data["departments"],
        job_levels=static_data["job_levels"],
        job_titles_by_department=static_data["job_titles_by_department"],
        currencies=[ExchangeRateOut.model_validate(c) for c in currencies],
        salary_bands=[SalaryBandOut.model_validate(b) for b in bands]
    )
