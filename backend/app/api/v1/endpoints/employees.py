
from app.core.database import get_db
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeDetail,
    PaginatedEmployeeResponse,
)
from app.services import employee_service
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("", response_model=PaginatedEmployeeResponse, summary="Get paginated list of employees with multi-facet filters")
def list_employees(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=200, description="Items per page"),
    search: str | None = Query(None, description="Search by name, code, email, title"),
    country: str | None = Query(None, description="Filter by country"),
    department: str | None = Query(None, description="Filter by department"),
    job_level: str | None = Query(None, description="Filter by job level"),
    gender: str | None = Query(None, description="Filter by gender"),
    min_salary_usd: float | None = Query(None, description="Minimum base salary in USD"),
    max_salary_usd: float | None = Query(None, description="Maximum base salary in USD"),
    band_status: str | None = Query(None, description="Filter by band status: UNDERPAID, OVERPAID, WITHIN_BAND"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order: asc or desc"),
    db: Session = Depends(get_db)
):
    return employee_service.get_employees(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        country=country,
        department=department,
        job_level=job_level,
        gender=gender,
        min_salary_usd=min_salary_usd,
        max_salary_usd=max_salary_usd,
        band_status=band_status,
        sort_by=sort_by,
        sort_order=sort_order
    )

@router.get("/{employee_id}", response_model=EmployeeDetail, summary="Get full employee profile with salary and audit history")
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    emp = employee_service.get_employee_by_id(db, employee_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Employee '{employee_id}' not found")
    return emp

@router.post("", response_model=EmployeeDetail, status_code=status.HTTP_201_CREATED, summary="Create a new employee with initial compensation")
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    return employee_service.create_employee(db, data)
