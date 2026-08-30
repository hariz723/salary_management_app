# ACME Salary Management System - Architecture & Technical Design

## 1. High-Level Architecture Overview

The application follows a clean layered architecture with separation of concerns between presentation, API, domain services, and data persistence layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite Frontend                    │
│  ┌───────────────────┐ ┌──────────────────┐ ┌─────────────┐ │
│  │ Executive Insights│ │ 10k Table & Query│ │ Salary Modal│ │
│  └─────────┬─────────┘ └────────┬─────────┘ └──────┬──────┘ │
└────────────┼────────────────────┼──────────────────┼────────┘
             │                    │                  │
             ▼                    ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend Gateway                   │
│  ┌───────────────────┐ ┌──────────────────┐ ┌─────────────┐ │
│  │ /api/v1/analytics │ │ /api/v1/employees│ │/api/v1/sal- │ │
│  │                   │ │                  │ │aries        │ │
│  └─────────┬─────────┘ └────────┬─────────┘ └──────┬──────┘ │
└────────────┼────────────────────┼──────────────────┼────────┘
             │                    │                  │
             ▼                    ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Domain Service Layer                    │
│  ┌───────────────────┐ ┌──────────────────┐ ┌─────────────┐ │
│  │ Analytics Engine  │ │ Employee Service │ │ Audit Trail │ │
│  │ (Percentiles, Pay │ │ (Fast Filtering &│ │ & Adjustment│ │
│  │  Gaps, Outliers)  │ │  Pagination)     │ │ Engine      │ │
│  └─────────┬─────────┘ └────────┬─────────┘ └──────┬──────┘ │
└────────────┼────────────────────┼──────────────────┼────────┘
             │                    │                  │
             ▼                    ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│            Data Persistence Layer (SQLAlchemy 2.0)          │
│  ┌───────────────────┐ ┌──────────────────┐ ┌─────────────┐ │
│  │  employees (10k)  │ │  salary_history  │ │ audit_logs  │ │
│  │  (B-Tree Indexed) │ │  & salary_bands  │ │ & exch_rates│ │
│  └───────────────────┘ └──────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Data Model & Schema Design

### 2.1 Entity Relationship Diagram

```
+-----------------------------------+        +-----------------------------------+
|             employees             |        |          salary_records           |
+-----------------------------------+        +-----------------------------------+
| id: String (UUID/ULID) [PK]       |<-------| id: String (UUID) [PK]            |
| employee_code: String (IDX, UNQ)  | 1    N | employee_id: String (FK, IDX)     |
| first_name: String                |        | base_salary: Float                |
| last_name: String                 |        | bonus_percentage: Float           |
| email: String (UNQ)               |        | equity_usd: Float                 |
| gender: String (M/F/Non-binary)   |        | currency: String (USD/EUR/INR...) |
| country: String (IDX)             |        | base_salary_usd: Float (IDX)      |
| city: String                      |        | total_compensation_usd: Float(IDX)|
| department: String (IDX)          |        | effective_date: Date              |
| job_title: String                 |        | is_current: Boolean (IDX)         |
| job_level: String (IDX)           |        +-----------------------------------+
| hire_date: Date                   |
| performance_rating: Float         |        +-----------------------------------+
| is_active: Boolean                |        |         salary_audit_logs         |
+-----------------------------------+        +-----------------------------------+
                                             | id: String (UUID) [PK]            |
                                             | employee_id: String (FK, IDX)     |
                                             | changed_by: String                |
                                             | change_type: String               |
                                             | previous_base: Float              |
                                             | new_base: Float                   |
                                             | previous_total_usd: Float         |
                                             | new_total_usd: Float              |
                                             | reason: String                    |
                                             | timestamp: DateTime               |
                                             +-----------------------------------+

+-----------------------------------+        +-----------------------------------+
|           salary_bands            |        |          exchange_rates           |
+-----------------------------------+        +-----------------------------------+
| id: String [PK]                   |        | currency_code: String [PK]        |
| department: String (IDX)          |        | rate_to_usd: Float                |
| job_level: String (IDX)           |        | last_updated: DateTime            |
| country: String (IDX)             |        +-----------------------------------+
| min_salary_usd: Float             |
| mid_salary_usd: Float             |
| max_salary_usd: Float             |
+-----------------------------------+
```

---

## 3. Key Design Decisions

1. **Denormalized USD Conversion on Mutation**:
   * For ultra-fast queries across 10,000 employees, each salary record stores both its native currency amount (`base_salary`, `currency`) and its normalized USD equivalent (`base_salary_usd`, `total_compensation_usd`).
   * **Benefit**: Aggregations (sum, average, percentiles, sorting) operate over pre-computed indexed numeric fields in single-digit milliseconds without needing run-time table joins and multiplication across 10k rows.

2. **Immutable Audit Trail**:
   * Any salary update creates a new immutable entry in `salary_audit_logs` and marks the previous `salary_records` entry as non-current, inserting a new current record.
   * Ensures compliance, complete traceability of pay changes, and instant audit log viewing.

3. **Fast Multi-Facet Indexing**:
   * Composite indexes on `(department, job_level)`, `(country, department)`, and individual indexes on `base_salary_usd`, `gender`, and `job_level` guarantee sub-20ms multi-facet filtering across 10,000 records.
