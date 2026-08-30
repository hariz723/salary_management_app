# Employee Salary Management System

An enterprise-grade compensation intelligence and salary management platform built for **Corporation's HR Manager** to manage, analyze, adjust, and govern compensation data for **10,000 employees** across 8 countries and currencies with sub-50ms responsiveness.

---

## 🚀 Quick Start with Docker Compose

Run the entire system (PostgreSQL + FastAPI Backend + React/Vite Frontend) with a single command:

```bash
docker compose up --build
# Or using the Makefile:
make up
```

### 🛠️ Handy Makefile Commands:
* `make setup-local` - Install all dependencies (Python + npm), copy `.env`, and seed 10k records
* `make migrate` - Apply all pending Alembic database migrations (`alembic upgrade head`)
* `make migrate-generate m='msg'` - Autogenerate a new Alembic migration schema revision
* `make migrate-downgrade` - Roll back the latest migration
* `make up` - Build and start all services (PostgreSQL, Backend, Frontend) in foreground
* `make up-d` - Start all services in the background
* `make down` - Stop all services
* `make down-v` - Stop services and reset PostgreSQL volume
* `make logs` - Tail logs across all containers (`make logs-backend`, `make logs-frontend`, `make logs-db`)
* `make test` - Run Pytest test suite inside the Docker container
* `make lint` - Run all linters (Backend Ruff + Frontend ESLint)
* `make format` - Automatically fix and format code
* `make ps` - View status of running containers


### Access URLs:
* **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
* **Backend Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **PostgreSQL Database**: `localhost:5432` (`user: acme_user`, `password: acme_password`, `db: salary_db`)

### 🔑 Demo Login Accounts:
| Role | Email | Password |
| :--- | :--- | :--- |
| **HR Manager** (Default) | `hr.manager@acme.com` | `Password123` |
| **System Administrator** | `admin@acme.com` | `Admin123!` |
| **Chief People Officer (Executive)** | `executive@acme.com` | `Exec123!` |

*(You can also use the 1-click Demo Account buttons on the login screen!)*

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                    │
│     (TypeScript, Ant Design, Tailwind CSS, Recharts)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ (REST API / JWT Auth)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend Gateway                  │
│       (Python 3.13, Pydantic v2, Repository Pattern)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ (SQLAlchemy 2.0 ORM)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL 16 Database                      │
│   (employees, salary_records, salary_audit_logs, users)     │
└─────────────────────────────────────────────────────────────┘
```

### Backend:
* **FastAPI (Python 3.13)**: High-speed asynchronous REST API with auto-generated Swagger documentation.
* **SQLAlchemy 2.0 & Repository Pattern**: Clean separation of database queries in `repositories/` from business services in `services/`.
* **PostgreSQL 16 / SQLite**: Connection pooling and composite B-tree indexes ensuring < 25ms response time on 10,000 rows.
* **Security**: Salted PBKDF2 password hashing & signed JWT access token authentication.
* **Pydantic v2**: Strict schema validation for requests, responses, and bulk CSV uploads.

### Frontend:
* **React 18 + Vite + TypeScript**: Instant HMR and lightning-fast rendering.
* **Ant Design 5 & Tailwind CSS**: Enterprise-grade UI data tables, drawers, filter toolbars, and modal workflows.
* **Recharts**: Interactive pay distribution histograms, department benchmark comparisons, and parity charts.
* **Live Multi-Currency Conversion**: Instant toggle between USD, EUR, GBP, INR, SGD, CAD, AUD, and JPY.

---

## 📊 Core Features

1. **📊 Executive Overview & Insights**:
   * Organization-wide payroll KPI cards (Total Spend, Headcount, Median/Mean Base Pay, Bonus %, Equity).
   * Pay distribution histogram across 10,000 employees.
   * Department compensation averages & global country-by-country spend.

2. **👥 10,000 Employee Compensation Directory**:
   * Server-side paginated table with multi-facet filters (Country, Department, Job Level, Gender, Band Status).
   * Instant debounced search across employee code, name, email, and job title.
   * Direct CSV export and bulk CSV import with line-by-line schema validation.

3. **💡 Strategic HR Q&A / Compensation Answers**:
   * Pre-computed answers to core executive questions (*"What is our gender pay gap?"*, *"What is the budget required to correct underpaid employees?"*, *"Which departments lead in bonuses?"*, *"Who are the top 5 highest earners globally?"*).

4. **⚖️ Pay Parity & Salary Band Governance**:
   * Department-by-department gender pay gap parity ratios.
   * Priority compensation band outliers table with 1-click rectification.

5. **📝 Salary Adjustment & Immutable Audit Trail**:
   * Detailed compensation breakdown (Base, Bonus %, Equity, Gross Total).
   * Salary adjustment form with mandatory business justification and effective date.
   * Chronological audit log timeline for every compensation modification.

---

## 🧪 Running Pytest Tests

To execute the fast, deterministic backend test suite:

```bash
conda run -n py313 pytest backend/
```

---

## 📁 Engineering Artifacts & Assessment Docs

* 📄 **Requirements Document (PRD)**: [`docs/REQUIREMENTS.md`](file:///home/hari/projects/salary_management_app/docs/REQUIREMENTS.md)
* 🏛️ **Architecture & Data Flow**: [`docs/ARCHITECTURE.md`](file:///home/hari/projects/salary_management_app/docs/ARCHITECTURE.md)
* ⚖️ **Design Trade-offs & Decisions**: [`docs/TRADE_OFFS.md`](file:///home/hari/projects/salary_management_app/docs/TRADE_OFFS.md)
* ⚡ **Performance & 10k Benchmarks**: [`docs/PERFORMANCE.md`](file:///home/hari/projects/salary_management_app/docs/PERFORMANCE.md)