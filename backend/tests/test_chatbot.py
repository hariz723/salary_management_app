def test_chatbot_top_earners(client, seeded_db):
    response = client.post(
        "/api/v1/chatbot/query", json={"message": "Who is the highest paid employee?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "highest" in data["answer"].lower() or "compensation" in data["answer"].lower()
    assert data["category"] == "Top Earners"
    assert data["data_type"] == "table"
    assert len(data["suggestions"]) > 0


def test_chatbot_gender_pay_gap(client, seeded_db):
    response = client.post("/api/v1/chatbot/query", json={"message": "What is the gender pay gap?"})
    assert response.status_code == 200
    data = response.json()
    assert "parity" in data["answer"].lower() or "ratio" in data["answer"].lower()
    assert data["category"] == "Pay Equity"


def test_chatbot_band_compliance(client, seeded_db):
    response = client.post(
        "/api/v1/chatbot/query", json={"message": "How many employees are underpaid?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "underpaid" in data["answer"].lower()
    assert data["category"] == "Band Compliance"


def test_chatbot_department_query(client, seeded_db):
    response = client.post(
        "/api/v1/chatbot/query", json={"message": "What is the average salary in Engineering?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Engineering" in data["answer"]


def test_chatbot_country_query(client, seeded_db):
    response = client.post(
        "/api/v1/chatbot/query", json={"message": "How many employees in Germany?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Germany" in data["answer"]


def test_chatbot_general_query(client, seeded_db):
    response = client.post("/api/v1/chatbot/query", json={"message": "Tell me about the workforce"})
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "Workforce Overview"
