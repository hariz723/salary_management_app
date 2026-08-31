COUNTRIES_DATA: dict[str, dict[str, str]] = {
    "United States": {
        "code": "USA",
        "currency": "USD",
        "symbol": "$",
        "name": "US Dollar",
        "rate": 1.0,
    },
    "United Kingdom": {
        "code": "GBR",
        "currency": "GBP",
        "symbol": "£",
        "name": "British Pound",
        "rate": 1.28,
    },
    "Germany": {"code": "DEU", "currency": "EUR", "symbol": "€", "name": "Euro", "rate": 1.09},
    "India": {
        "code": "IND",
        "currency": "INR",
        "symbol": "₹",
        "name": "Indian Rupee",
        "rate": 0.012,
    },
    "Singapore": {
        "code": "SGP",
        "currency": "SGD",
        "symbol": "S$",
        "name": "Singapore Dollar",
        "rate": 0.75,
    },
    "Canada": {
        "code": "CAN",
        "currency": "CAD",
        "symbol": "CA$",
        "name": "Canadian Dollar",
        "rate": 0.74,
    },
    "Australia": {
        "code": "AUS",
        "currency": "AUD",
        "symbol": "A$",
        "name": "Australian Dollar",
        "rate": 0.66,
    },
    "Japan": {
        "code": "JPN",
        "currency": "JPY",
        "symbol": "¥",
        "name": "Japanese Yen",
        "rate": 0.0067,
    },
}

DEPARTMENTS = [
    "Engineering",
    "Product",
    "Sales",
    "Marketing",
    "Human Resources",
    "Finance",
    "Legal",
    "Operations",
]

JOB_LEVELS = ["Junior", "Mid", "Senior", "Lead", "Director", "VP"]

JOB_TITLES: dict[str, list[str]] = {
    "Engineering": [
        "Software Engineer",
        "Backend Developer",
        "Frontend Developer",
        "DevOps Engineer",
        "Data Engineer",
        "QA Engineer",
        "Security Architect",
        "Principal Engineer",
    ],
    "Product": [
        "Associate Product Manager",
        "Product Manager",
        "Senior Product Manager",
        "Group Product Manager",
        "Director of Product",
        "VP of Product",
    ],
    "Sales": [
        "Sales Development Rep",
        "Account Executive",
        "Senior Account Executive",
        "Enterprise AE",
        "Sales Director",
        "VP of Global Sales",
    ],
    "Marketing": [
        "Marketing Associate",
        "Content Strategist",
        "Growth Marketer",
        "Product Marketing Manager",
        "Marketing Director",
        "VP of Marketing",
    ],
    "Human Resources": [
        "HR Coordinator",
        "Talent Acquisition Specialist",
        "People Ops Lead",
        "Total Rewards Specialist",
        "HR Director",
        "VP of People",
    ],
    "Finance": [
        "Financial Analyst",
        "Staff Accountant",
        "Finance Manager",
        "Controller",
        "Director of FP&A",
        "VP of Finance",
    ],
    "Legal": [
        "Paralegal",
        "Corporate Counsel",
        "Senior Counsel",
        "Compliance Lead",
        "Legal Director",
        "General Counsel",
    ],
    "Operations": [
        "Operations Associate",
        "Logistics Coordinator",
        "Operations Manager",
        "Supply Chain Analyst",
        "Director of Operations",
        "VP of Operations",
    ],
}

# Base benchmark salaries (USD) by Job Level
LEVEL_BASE_SALARY_USD: dict[str, tuple[float, float, float]] = {
    "Junior": (50000.0, 65000.0, 80000.0),
    "Mid": (80000.0, 105000.0, 130000.0),
    "Senior": (125000.0, 155000.0, 185000.0),
    "Lead": (160000.0, 195000.0, 230000.0),
    "Director": (210000.0, 260000.0, 310000.0),
    "VP": (280000.0, 350000.0, 450000.0),
}

# Department multiplier for compensation bands
DEPT_MULTIPLIERS: dict[str, float] = {
    "Engineering": 1.15,
    "Product": 1.10,
    "Sales": 1.05,
    "Legal": 1.08,
    "Finance": 1.02,
    "Operations": 0.95,
    "Marketing": 0.95,
    "Human Resources": 0.92,
}

# Country cost-of-labor / location multiplier
COUNTRY_MULTIPLIERS: dict[str, float] = {
    "United States": 1.0,
    "United Kingdom": 0.85,
    "Germany": 0.82,
    "Canada": 0.80,
    "Australia": 0.80,
    "Singapore": 0.78,
    "Japan": 0.70,
    "India": 0.35,
}


def get_static_metadata() -> dict:
    return {
        "countries": list(COUNTRIES_DATA.keys()),
        "country_codes": {k: v["code"] for k, v in COUNTRIES_DATA.items()},
        "country_currencies": {k: v["currency"] for k, v in COUNTRIES_DATA.items()},
        "departments": DEPARTMENTS,
        "job_levels": JOB_LEVELS,
        "job_titles_by_department": JOB_TITLES,
    }


def get_band_for(department: str, job_level: str, country: str) -> tuple[float, float, float]:
    """Calculates min, mid, max USD salary band for a specific role and geography."""
    base_min, base_mid, base_max = LEVEL_BASE_SALARY_USD.get(
        job_level, (70000.0, 95000.0, 120000.0)
    )
    dept_mult = DEPT_MULTIPLIERS.get(department, 1.0)
    country_mult = COUNTRY_MULTIPLIERS.get(country, 1.0)

    min_sal = round(base_min * dept_mult * country_mult, 2)
    mid_sal = round(base_mid * dept_mult * country_mult, 2)
    max_sal = round(base_max * dept_mult * country_mult, 2)
    return min_sal, mid_sal, max_sal
