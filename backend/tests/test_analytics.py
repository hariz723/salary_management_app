import pytest

def test_analytics_overview(client, seeded_db):
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_employees"] >= 200
    assert data["total_payroll_usd"] > 0
    assert data["mean_salary_usd"] > 0
    assert data["median_salary_usd"] > 0
    assert data["total_countries"] == 8
    assert data["total_departments"] == 8

def test_analytics_departments(client, seeded_db):
    response = client.get("/api/v1/analytics/departments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 8
    for dept in data:
        assert dept["employee_count"] > 0
        assert dept["p10_usd"] <= dept["p25_usd"] <= dept["median_total_comp_usd"] <= dept["p75_usd"] <= dept["p90_usd"]

def test_analytics_countries(client, seeded_db):
    response = client.get("/api/v1/analytics/countries")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 8
    for c in data:
        assert c["total_payroll_usd"] > 0

def test_analytics_gender_pay_gap(client, seeded_db):
    response = client.get("/api/v1/analytics/gender-pay-gap")
    assert response.status_code == 200
    data = response.json()
    assert "overall_by_gender" in data
    assert "department_breakdown" in data
    assert len(data["overall_by_gender"]) >= 2
    assert "overall_female_to_male_ratio" in data

def test_analytics_band_compliance(client, seeded_db):
    response = client.get("/api/v1/analytics/band-compliance")
    assert response.status_code == 200
    data = response.json()
    assert data["total_employees"] >= 200
    assert "compliance_rate_percentage" in data
    assert "cost_to_bring_to_minimum_usd" in data

def test_analytics_hr_questions(client, seeded_db):
    response = client.get("/api/v1/analytics/hr-questions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    for q in data:
        assert "id" in q
        assert "question" in q
        assert "summary_answer" in q
        assert "detailed_data" in q
