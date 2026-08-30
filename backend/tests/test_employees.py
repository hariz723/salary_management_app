
def test_list_employees_pagination(client, seeded_db):
    response = client.get("/api/v1/employees?page=1&page_size=20")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) == 20
    assert data["page"] == 1
    assert data["page_size"] == 20

def test_list_employees_filters(client, seeded_db):
    # Filter by country
    response = client.get("/api/v1/employees?country=United States")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["country"] == "United States"

    # Filter by department
    response = client.get("/api/v1/employees?department=Engineering")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["department"] == "Engineering"

def test_get_employee_detail(client, seeded_db):
    # First get an employee id
    list_resp = client.get("/api/v1/employees?page=1&page_size=1")
    emp_id = list_resp.json()["items"][0]["id"]

    response = client.get(f"/api/v1/employees/{emp_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == emp_id
    assert "current_salary" in data
    assert "salary_history" in data
    assert "audit_logs" in data
    assert data["current_salary"] is not None
    assert len(data["salary_history"]) >= 1

def test_get_nonexistent_employee(client, seeded_db):
    response = client.get("/api/v1/employees/non-existent-uuid")
    assert response.status_code == 404
