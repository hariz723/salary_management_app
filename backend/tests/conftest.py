import pytest
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, get_db
from app.main import app
from app.models import Employee, SalaryRecord, SalaryBand, ExchangeRate, SalaryAuditLog
from app.scripts.seed_data import seed_exchange_rates, seed_salary_bands, generate_10k_employees

TEST_DATABASE_URL = "sqlite:///./test_salary_app.db"

@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_salary_app.db"):
        try:
            os.remove("./test_salary_app.db")
        except OSError:
            pass

@pytest.fixture(scope="session")
def seeded_db(test_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    try:
        seed_exchange_rates(db)
        seed_salary_bands(db)
        # Seed 200 sample employees for fast, deterministic unit test suite
        generate_10k_employees(db, total_count=200)
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def db_session(test_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
