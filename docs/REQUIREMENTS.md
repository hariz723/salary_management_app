# ACME Employee Salary Management System - Product Requirements Document (PRD)

## 1. Executive Summary & Goals
* **Problem**: ACME Corporation employs **10,000 employees** across multiple global regions (USA, UK, Germany, India, Singapore, Canada, Australia, Japan). Currently, compensation data is maintained across disparate spreadsheets, resulting in slow query responses, data inconsistency, lack of auditability, and inability for the HR Manager to answer executive compensation questions quickly.
* **Primary Goal**: Deliver a centralized, high-performance, web-based salary management application enabling the HR Manager to view, filter, adjust, and analyze compensation records for 10,000 employees with sub-second responsiveness, multi-currency normalization, and comprehensive analytical intelligence.

---

## 2. Target User Persona
* **Primary Persona**: **HR Manager / Compensation Lead**
* **Key Needs**:
  1. Instant answers to organizational compensation questions (e.g., "What is our department pay distribution?", "Do we have pay parity gaps across genders or regions?", "Who are the compensation band outliers?").
  2. Fast, indexed search and multi-facet filtering across 10,000 records without lag.
  3. Safe salary adjustments with mandatory reason logging and automated audit trails.
  4. Global multi-currency visibility with real-time conversion into a baseline currency (USD).
  5. Bulk import/export with strict schema validation.

---

## 3. Scope & Key Features

### 3.1 Feature Matrix
| Module | Capabilities | Acceptance Criteria |
| :--- | :--- | :--- |
| **1. Executive Analytics & Q&A** | • Organization-wide payroll KPI summary (Total Payroll, Median, Mean, Bonus Ratio)<br>• Pay distribution by Country & Department<br>• Percentile metrics (p10, p25, p50, p75, p90)<br>• Gender Pay Parity Index per role/department<br>• Pre-computed HR Q&A cards for executive decision-making | Sub-50ms query response on 10k dataset; real-time currency conversion. |
| **2. Employee Directory** | • Virtualized, server-side paginated table for 10,000 employees<br>• Multi-field filtering (Country, Department, Job Level, Gender, Band Status)<br>• Instant search by Name, Email, Employee ID<br>• Multi-column sorting | Pagination latency < 20ms; debounced search; zero UI freeze. |
| **3. Salary Management & Audit** | • Detailed compensation breakdown (Base, Bonus %, Stock/Equity, Gross Total)<br>• Salary adjustment action with required reason and effective date<br>• Immutable chronological audit log per employee | Every salary mutation writes to `salary_audit_logs`; previous and new values tracked. |
| **4. Currency Normalization** | • Support for USD, EUR, GBP, INR, SGD, CAD, AUD, JPY<br>• Toggle view between Local Currency and Normalized Currency (USD/EUR) | Accurate exchange rates applied across all aggregates and table views. |
| **5. Bulk Import & Export** | • CSV export of filtered views<br>• CSV bulk import with Pydantic validation and error reporting | Malformed rows rejected with line-by-line feedback; valid rows committed. |

---

## 4. Out of Scope (Non-Goals) & Deliberate Trade-Offs

| Out-of-Scope Feature | Reasoning / Justification |
| :--- | :--- |
| **1. Direct Payroll Disbursement / Banking Rails (ACH/SEPA/Wire)** | **Reasoning**: This system is designed for *compensation planning, management, and strategic HR analysis*, not transactional banking execution. Integrating live banking APIs introduces compliance overhead (PCI/PSD2) without adding value to the core assessment goal. |
| **2. Complex Country-Specific Tax Withholding Engine** | **Reasoning**: Tax laws vary drastically across 8+ jurisdictions and change quarterly. The system focuses on Gross Base, Target Bonus, and Total Target Compensation (TTC), which represents the true organizational cost. |
| **3. Employee Self-Service Portal / SSO Login** | **Reasoning**: The primary persona is the HR Manager. Building multi-tenant authentication, employee onboarding flows, and self-service payslips distracts from core high-volume data modeling, performance, and analytical depth. |
| **4. Real-Time Distributed Streaming (Kafka/Pulsar)** | **Reasoning**: For 10,000 employee records, an indexed relational SQLite/PostgreSQL database with proper query optimization delivers < 15ms latency. Introducing message queues would add unnecessary architectural complexity. |

---

## 5. Success Metrics & Verification
1. **Performance**: Server-side pagination & filter response time < 25ms over 10,000 indexed records.
2. **Data Integrity**: 100% test coverage on salary adjustment calculations and audit trail persistence.
3. **Usability**: HR Manager can answer any core organizational pay question within 2 clicks from the dashboard.
