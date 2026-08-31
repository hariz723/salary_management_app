import os
import random
import sys
import time
import uuid
from datetime import date, datetime, timedelta

from faker import Faker

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, SessionLocal, engine
from app.core.logger import get_logger
from app.core.security import hash_password
from app.models.audit_log import SalaryAuditLog
from app.models.employee import Employee
from app.models.salary import ExchangeRate, SalaryBand, SalaryRecord
from app.models.user import User
from app.repositories import (
    AuditLogRepository,
    EmployeeRepository,
    SalaryRepository,
)
from app.services.metadata_service import (
    COUNTRIES_DATA,
    DEPARTMENTS,
    JOB_LEVELS,
    JOB_TITLES,
    get_band_for,
)

logger = get_logger("seed_data")

random.seed(42)
fake = Faker()


def seed_users(db):
    if db.query(User).count() > 0:
        return
    logger.info("Seeding default auth users (HR Manager, Admin, Executive)...")
    default_users = [
        User(
            id=str(uuid.uuid4()),
            email="hr.manager@company.com",
            hashed_password=hash_password("Password123"),
            full_name="Sarah Jenkins (HR Manager)",
            role="HR_MANAGER",
            is_active=True,
            created_at=datetime.utcnow(),
        ),
        User(
            id=str(uuid.uuid4()),
            email="admin@company.com",
            hashed_password=hash_password("Admin123!"),
            full_name="System Administrator",
            role="HR_ADMIN",
            is_active=True,
            created_at=datetime.utcnow(),
        ),
        User(
            id=str(uuid.uuid4()),
            email="executive@company.com",
            hashed_password=hash_password("Exec123!"),
            full_name="Chief People Officer",
            role="EXECUTIVE",
            is_active=True,
            created_at=datetime.utcnow(),
        ),
        User(
            id=str(uuid.uuid4()),
            email="hr.manager@acme.com",
            hashed_password=hash_password("Password123"),
            full_name="Sarah Jenkins (HR Manager)",
            role="HR_MANAGER",
            is_active=True,
            created_at=datetime.utcnow(),
        ),
        User(
            id=str(uuid.uuid4()),
            email="admin@acme.com",
            hashed_password=hash_password("Admin123!"),
            full_name="System Administrator",
            role="HR_ADMIN",
            is_active=True,
            created_at=datetime.utcnow(),
        ),
    ]
    db.bulk_save_objects(default_users)
    db.commit()


def seed_exchange_rates(db):
    if db.query(ExchangeRate).count() > 0:
        return
    logger.info("Seeding exchange rates...")
    sal_repo = SalaryRepository(db)
    rates = [
        ExchangeRate(
            currency_code=data["currency"],
            rate_to_usd=float(data["rate"]),
            symbol=data["symbol"],
            currency_name=data["name"],
            last_updated=datetime.utcnow(),
        )
        for _, data in COUNTRIES_DATA.items()
    ]
    sal_repo.bulk_add_exchange_rates(rates)
    db.commit()


def seed_salary_bands(db):
    if db.query(SalaryBand).count() > 0:
        return
    logger.info("Seeding salary bands...")
    sal_repo = SalaryRepository(db)
    bands = []
    for dept in DEPARTMENTS:
        for lvl in JOB_LEVELS:
            for country in COUNTRIES_DATA.keys():
                min_b, mid_b, max_b = get_band_for(dept, lvl, country)
                bands.append(
                    SalaryBand(
                        id=str(uuid.uuid4()),
                        department=dept,
                        job_level=lvl,
                        country=country,
                        min_salary_usd=float(min_b),
                        mid_salary_usd=float(mid_b),
                        max_salary_usd=float(max_b),
                    )
                )
    sal_repo.bulk_add_salary_bands(bands)
    db.commit()


CITIES_BY_COUNTRY = {
    "United States": [
        "New York",
        "San Francisco",
        "Austin",
        "Seattle",
        "Chicago",
        "Boston",
        "Denver",
    ],
    "United Kingdom": ["London", "Manchester", "Edinburgh", "Bristol", "Cambridge", "Birmingham"],
    "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg", "Stuttgart", "Cologne"],
    "India": ["Bengaluru", "Hyderabad", "Pune", "Mumbai", "Delhi NCR", "Chennai"],
    "Singapore": ["Singapore Downtown", "Jurong East", "Tampines", "One-North", "Marina Bay"],
    "Canada": ["Toronto", "Vancouver", "Montreal", "Ottawa", "Calgary", "Waterloo"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Canberra"],
    "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Fukuoka", "Nagoya"],
}

COUNTRY_WEIGHTS = {
    "United States": 0.32,
    "India": 0.25,
    "United Kingdom": 0.12,
    "Germany": 0.10,
    "Canada": 0.08,
    "Singapore": 0.05,
    "Australia": 0.04,
    "Japan": 0.04,
}

LEVEL_WEIGHTS = {
    "Junior": 0.28,
    "Mid": 0.36,
    "Senior": 0.22,
    "Lead": 0.09,
    "Director": 0.04,
    "VP": 0.01,
}

BONUS_RANGES = {
    "Junior": (0.0, 8.0),
    "Mid": (5.0, 12.0),
    "Senior": (10.0, 18.0),
    "Lead": (15.0, 25.0),
    "Director": (20.0, 35.0),
    "VP": (30.0, 50.0),
}

EQUITY_RANGES = {
    "Junior": (0.0, 2000.0),
    "Mid": (2000.0, 8000.0),
    "Senior": (10000.0, 25000.0),
    "Lead": (20000.0, 45000.0),
    "Director": (45000.0, 90000.0),
    "VP": (90000.0, 200000.0),
}


def generate_employees(db, total_count=1000):
    if db.query(Employee).count() >= total_count:
        logger.info(
            f"Database already contains {db.query(Employee).count()} employees. Skipping generation."
        )
        return

    logger.info(f"Generating {total_count} employees...")
    emp_repo = EmployeeRepository(db)
    sal_repo = SalaryRepository(db)
    audit_repo = AuditLogRepository(db)

    db.query(SalaryAuditLog).delete()
    db.query(SalaryRecord).delete()
    db.query(Employee).delete()
    db.commit()

    countries = list(COUNTRY_WEIGHTS.keys())
    c_weights = [COUNTRY_WEIGHTS[c] for c in countries]

    levels = list(LEVEL_WEIGHTS.keys())
    l_weights = [LEVEL_WEIGHTS[lvl] for lvl in levels]

    genders = ["Female", "Male", "Non-Binary"]
    g_weights = [0.46, 0.48, 0.06]

    start_date = date(2018, 1, 1)
    end_date = date(2026, 8, 1)
    days_range = (end_date - start_date).days

    batch_size = 500
    employees_batch = []
    salaries_batch = []
    audits_batch = []

    t0 = time.time()
    generated_emails = set()

    for i in range(1, total_count + 1):
        emp_id = str(uuid.uuid4())
        emp_code = f"EMP-{i:05d}"
        country = random.choices(countries, weights=c_weights, k=1)[0]
        c_meta = COUNTRIES_DATA[country]
        city = random.choice(CITIES_BY_COUNTRY[country])
        gender = random.choices(genders, weights=g_weights, k=1)[0]

        first_name = (
            fake.first_name_female()
            if gender == "Female"
            else fake.first_name_male()
            if gender == "Male"
            else fake.first_name()
        )
        last_name = fake.last_name()

        base_email = f"{first_name.lower()}.{last_name.lower()}@company.com"
        email = base_email
        email_suffix = 1
        while email in generated_emails:
            email = f"{first_name.lower()}.{last_name.lower()}{email_suffix}@company.com"
            email_suffix += 1
        generated_emails.add(email)

        dept = random.choice(DEPARTMENTS)
        level = random.choices(levels, weights=l_weights, k=1)[0]
        job_title = random.choice(JOB_TITLES[dept])

        hire_date = start_date + timedelta(days=random.randint(0, days_range))
        rating_raw = max(1.0, min(5.0, random.gauss(3.4, 0.7)))
        performance_rating = float(round(rating_raw, 1))
        is_active = random.random() > 0.03

        min_b, mid_b, max_b = get_band_for(dept, level, country)
        rate = float(c_meta["rate"])
        currency = c_meta["currency"]

        outlier_roll = random.random()
        if outlier_roll < 0.03:
            sal_usd = float(round(min_b * random.uniform(0.78, 0.96), 2))
        elif outlier_roll > 0.97:
            sal_usd = float(round(max_b * random.uniform(1.04, 1.25), 2))
        else:
            std = (max_b - min_b) / 4.5
            val = max(min_b, min(max_b, random.gauss(mid_b, std)))
            sal_usd = float(round(val, 2))

        local_base = float(round(sal_usd / rate, 2))
        base_salary_usd = float(round(local_base * rate, 2))

        bonus_min, bonus_max = BONUS_RANGES[level]
        bonus_pct = float(round(random.uniform(bonus_min, bonus_max), 1))
        bonus_usd = float(round(base_salary_usd * (bonus_pct / 100.0), 2))

        eq_min, eq_max = EQUITY_RANGES[level]
        equity_usd = float(round(random.uniform(eq_min, eq_max), 2))
        total_comp_usd = float(round(base_salary_usd + bonus_usd + equity_usd, 2))

        emp = Employee(
            id=emp_id,
            employee_code=emp_code,
            first_name=first_name,
            last_name=last_name,
            email=email,
            gender=gender,
            country=country,
            country_code=c_meta["code"],
            city=city,
            department=dept,
            job_title=job_title,
            job_level=level,
            hire_date=hire_date,
            performance_rating=performance_rating,
            is_active=is_active,
            created_at=datetime.utcnow(),
        )
        employees_batch.append(emp)

        sal = SalaryRecord(
            id=str(uuid.uuid4()),
            employee_id=emp_id,
            base_salary=local_base,
            bonus_percentage=bonus_pct,
            equity_usd=equity_usd,
            currency=currency,
            exchange_rate_to_usd=rate,
            base_salary_usd=base_salary_usd,
            bonus_usd=bonus_usd,
            total_compensation_usd=total_comp_usd,
            effective_date=hire_date,
            is_current=True,
            created_at=datetime.utcnow(),
        )
        salaries_batch.append(sal)

        audit = SalaryAuditLog(
            id=str(uuid.uuid4()),
            employee_id=emp_id,
            change_type="INITIAL_SEED",
            previous_base=0.0,
            new_base=local_base,
            previous_total_usd=0.0,
            new_total_usd=total_comp_usd,
            change_percentage=100.0,
            reason="Initial onboarding hire compensation",
            notes="Baseline generated seed record",
            changed_by="HR System Migration",
            created_at=datetime.utcnow(),
        )
        audits_batch.append(audit)

        if len(employees_batch) >= batch_size:
            emp_repo.bulk_add(employees_batch)
            sal_repo.bulk_add(salaries_batch)
            audit_repo.bulk_add(audits_batch)
            db.commit()
            employees_batch.clear()
            salaries_batch.clear()
            audits_batch.clear()

    if employees_batch:
        emp_repo.bulk_add(employees_batch)
        sal_repo.bulk_add(salaries_batch)
        audit_repo.bulk_add(audits_batch)
        db.commit()

    duration = time.time() - t0
    logger.info(f"Successfully generated {total_count} employee records in {duration:.2f}s.")


generate_10k_employees = generate_employees


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_users(db)
        seed_exchange_rates(db)
        seed_salary_bands(db)
        generate_employees(db, 1000)
    finally:
        db.close()


if __name__ == "__main__":
    main()
