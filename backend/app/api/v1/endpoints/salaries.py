from app.core.database import get_db
from app.schemas.employee import EmployeeDetail
from app.schemas.salary import SalaryAdjustmentCreate
from app.services import salary_service
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/adjust/{employee_id}", response_model=EmployeeDetail, summary="Adjust an employee's salary and record an immutable audit log")
def adjust_employee_salary(
    employee_id: str,
    data: SalaryAdjustmentCreate,
    db: Session = Depends(get_db)
):
    try:
        updated_emp = salary_service.adjust_salary(db, employee_id, data)
        return updated_emp
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to adjust salary: {e!s}")
