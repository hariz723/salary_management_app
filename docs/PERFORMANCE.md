# Performance & Benchmarks Guide

## 1. 10,000 Records Benchmark Strategy

Managing 10,000 employee records with fast response times (< 50ms) requires deliberate indexing and query design.

### Database Index Strategy
```sql
CREATE INDEX ix_employees_department ON employees (department);
CREATE INDEX ix_employees_country ON employees (country);
CREATE INDEX ix_employees_job_level ON employees (job_level);
CREATE INDEX ix_employees_gender ON employees (gender);
CREATE INDEX ix_employees_composite ON employees (department, job_level, country);
CREATE INDEX ix_salary_records_usd ON salary_records (total_compensation_usd);
CREATE INDEX ix_salary_records_employee ON salary_records (employee_id, is_current);
```

---

## 2. Expected Performance Targets

| Operation | Target Latency | Optimization Technique |
| :--- | :--- | :--- |
| **Directory Page Load (50 rows)** | < 15 ms | B-Tree index on primary/filter keys + `LIMIT`/`OFFSET` |
| **Search by Name/Email/ID** | < 25 ms | Substring index + debounced client input (300ms) |
| **Multi-Facet Filter (Dept + Country + Level)** | < 20 ms | Composite index `(department, job_level, country)` |
| **Executive Dashboard KPI Aggregation** | < 40 ms | SQL `SUM()`, `AVG()`, `COUNT()` indexed scan |
| **10,000 Record Seeding Execution** | < 3.5 sec | SQLite batch `executemany` with single transaction commit |
| **CSV Bulk Export (10,000 rows)** | < 350 ms | Streaming response with generator |

---

## 3. SQLite Tuning Settings

Applied in `app/core/database.py`:
- `PRAGMA journal_mode = WAL;` (Enables concurrent readers and writers)
- `PRAGMA synchronous = NORMAL;` (Significantly speeds up disk writes while maintaining durability)
- `PRAGMA cache_size = -64000;` (64 MB in-memory cache)
- `PRAGMA temp_store = MEMORY;`
