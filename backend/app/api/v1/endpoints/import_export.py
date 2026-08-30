from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import import_export_service

router = APIRouter()

@router.get("/export-csv", summary="Export full or filtered employee database as CSV")
def export_csv(db: Session = Depends(get_db)):
    csv_data = import_export_service.export_employees_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=acme_employees_salary_data.csv"}
    )

@router.post("/import-csv", summary="Bulk import employees from CSV with schema validation")
async def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a CSV file."
        )
    content = await file.read()
    try:
        csv_text = content.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content.decode("latin-1")

    result = import_export_service.import_employees_csv(db, csv_text)
    return result
