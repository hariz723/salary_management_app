
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.analytics import (
    BandComplianceSummary,
    CountryStats,
    DepartmentStats,
    DistributionBucket,
    GenderPayGapAnalysis,
    HRQuestionCard,
    JobLevelStats,
    OverviewStats,
)
from app.services import analytics_service

router = APIRouter()

@router.get("/overview", response_model=OverviewStats, summary="Get high-level compensation KPIs across ACME")
def get_overview(db: Session = Depends(get_db)):
    return analytics_service.get_overview_stats(db)

@router.get("/distribution", response_model=list[DistributionBucket], summary="Get compensation distribution buckets")
def get_distribution(
    country: str | None = Query(None, description="Optional country filter"),
    department: str | None = Query(None, description="Optional department filter"),
    db: Session = Depends(get_db)
):
    return analytics_service.get_pay_distribution(db, country=country, department=department)

@router.get("/departments", response_model=list[DepartmentStats], summary="Get detailed metrics and percentiles per department")
def get_departments(db: Session = Depends(get_db)):
    return analytics_service.get_department_stats(db)

@router.get("/countries", response_model=list[CountryStats], summary="Get payroll expenditure per country and currency")
def get_countries(db: Session = Depends(get_db)):
    return analytics_service.get_country_stats(db)

@router.get("/job-levels", response_model=list[JobLevelStats], summary="Get compensation breakdown by job level")
def get_job_levels(db: Session = Depends(get_db)):
    return analytics_service.get_job_level_stats(db)

@router.get("/gender-pay-gap", response_model=GenderPayGapAnalysis, summary="Get comprehensive gender pay parity & diversity metrics")
def get_gender_pay_gap(db: Session = Depends(get_db)):
    return analytics_service.get_gender_pay_gap(db)

@router.get("/band-compliance", response_model=BandComplianceSummary, summary="Get compensation band outliers and correction budget impact")
def get_band_compliance(db: Session = Depends(get_db)):
    return analytics_service.get_band_compliance(db)

@router.get("/hr-questions", response_model=list[HRQuestionCard], summary="Get instant answers to strategic HR executive questions")
def get_hr_questions(db: Session = Depends(get_db)):
    return analytics_service.get_hr_answers(db)
