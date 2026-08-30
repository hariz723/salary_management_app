import pytest

def test_salary_adjustment(client, seeded_db):
    list_resp = client.get("/api/v1/employees?page=1&page_size=1")
    emp = list_resp.json()["items"][0]
    emp_id = emp["id"]
    old_base = emp["base_salary"]

    new_base = round(old_base * 1.15, 2)
    payload = {
        "new_base_salary": new_base,
        "new_bonus_percentage": 15.0,
        "new_equity_usd": 10000.0,
        "change_type": "PROMOTION",
        "reason": "Promoted to Senior level with merit increase",
        "notes": "Exceptional Q2 performance rating 4.8",
        "changed_by": "Compensation Committee"
    }

    response = client.post(f"/api/v1/salaries/adjust/{emp_id}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["current_salary"]["base_salary"] == new_base
    assert data["current_salary"]["bonus_percentage"] == 15.0
    assert data["current_salary"]["equity_usd"] == 10000.0

    # Verify audit log was created
    assert len(data["audit_logs"]) >= 2
    latest_audit = data["audit_logs"][0]
    assert latest_audit["change_type"] == "PROMOTION"
    assert latest_audit["new_base"] == new_base
    assert latest_audit["reason"] == "Promoted to Senior level with merit increase"

def test_salary_adjustment_invalid_salary(client, seeded_db):
    list_resp = client.get("/api/v1/employees?page=1&page_size=1")
    emp_id = list_resp.json()["items"][0]["id"]

    payload = {
        "new_base_salary": -5000.0,
        "reason": "Invalid decrease"
    }
    response = client.post(f"/api/v1/salaries/adjust/{emp_id}", json=payload)
    assert response.status_code == 422
