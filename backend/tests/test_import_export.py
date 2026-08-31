import io


def test_export_csv(client, seeded_db):
    response = client.get("/api/v1/data/export-csv")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    content = response.text
    lines = content.strip().split("\n")
    assert len(lines) >= 201  # Header + 200 employees
    assert "Employee Code,First Name,Last Name" in lines[0]


def test_import_csv_valid(client, seeded_db):
    csv_content = """first_name,last_name,email,gender,country,department,job_title,job_level,base_salary,bonus_%,equity_usd
John,DoeTest,john.doetest123@acme.com,Male,United States,Engineering,Senior Backend Engineer,Senior,145000,12,15000
Jane,SmithTest,jane.smithtest123@acme.com,Female,United Kingdom,Product,Product Manager,Mid,75000,10,5000
"""
    files = {"file": ("test_import.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/v1/data/import-csv", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 2
    assert data["imported_count"] == 2
    assert data["failed_count"] == 0


def test_import_csv_with_errors(client, seeded_db):
    csv_content = """first_name,last_name,email,gender,country,department,job_title,job_level,base_salary
,NoFirstName,invalid1@acme.com,Male,United States,Engineering,Dev,Mid,100000
ValidFirst,ValidLast,invalid2@acme.com,Female,UnknownCountry,Engineering,Dev,Mid,100000
BadSalary,Person,invalid3@acme.com,Female,United States,Engineering,Dev,Mid,-500
"""
    files = {"file": ("test_bad_import.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/v1/data/import-csv", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 3
    assert data["imported_count"] == 0
    assert data["failed_count"] == 3
    assert len(data["errors"]) == 3
