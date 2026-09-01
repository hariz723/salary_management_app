import json
import re
from typing import Any

import httpx
from sqlalchemy import asc, desc, func, or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logger import get_logger
from app.models.employee import Employee
from app.models.salary import SalaryRecord
from app.schemas.chatbot import ChatbotQueryResponse
from app.services import analytics_service
from app.services.metadata_service import COUNTRIES_DATA, DEPARTMENTS, JOB_LEVELS, get_band_for

logger = get_logger("chatbot_service")


def answer_chatbot_query(db: Session, raw_message: str) -> ChatbotQueryResponse:
    grounded_response = _answer_chatbot_query_from_db(db, raw_message)
    return _with_huggingface_answer(raw_message, grounded_response)


def _with_huggingface_answer(
    raw_message: str, grounded_response: ChatbotQueryResponse
) -> ChatbotQueryResponse:
    if not settings.HUGGINGFACE_API_TOKEN:
        return grounded_response

    generated_answer = _generate_huggingface_answer(raw_message, grounded_response)
    if not generated_answer:
        return grounded_response

    grounded_response.answer = generated_answer
    return grounded_response


def _generate_huggingface_answer(
    raw_message: str, grounded_response: ChatbotQueryResponse
) -> str | None:
    payload = {
        "model": settings.HUGGINGFACE_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are PayHub's compensation data assistant. Answer only from the "
                    "provided database facts. Do not invent employees, counts, salaries, "
                    "percentages, countries, or departments. Keep the answer concise and "
                    "preserve important numbers. Markdown bold is allowed."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Question: {raw_message}\n\n"
                    f"Database facts:\n{_format_response_context(grounded_response)}\n\n"
                    "Write the final answer for the user."
                ),
            },
        ],
        "temperature": 0.2,
        "max_tokens": 220,
    }
    headers = {
        "Authorization": f"Bearer {settings.HUGGINGFACE_API_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=settings.HUGGINGFACE_TIMEOUT_SECONDS) as client:
            response = client.post(settings.HUGGINGFACE_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            body = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning(f"Hugging Face chatbot generation failed; using DB answer. Error: {exc}")
        return None

    return _extract_huggingface_message(body)


def _format_response_context(response: ChatbotQueryResponse) -> str:
    context: dict[str, Any] = {
        "category": response.category,
        "answer": response.answer,
        "data_type": response.data_type,
        "data": response.data,
    }
    return json.dumps(context, ensure_ascii=True, default=str)


def _extract_huggingface_message(body: dict[str, Any]) -> str | None:
    try:
        message = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        logger.warning("Hugging Face chatbot response did not include a chat completion message.")
        return None

    answer = str(message).strip()
    return answer or None


def _answer_chatbot_query_from_db(db: Session, raw_message: str) -> ChatbotQueryResponse:
    query = raw_message.strip().lower()

    # 1. Highest / Top Compensated Employees
    if any(
        phrase in query
        for phrase in [
            "highest paid",
            "top earner",
            "top 5",
            "highest salary",
            "who earns the most",
            "who makes the most",
            "top paid",
        ]
    ):
        results = (
            db.query(Employee, SalaryRecord)
            .join(
                SalaryRecord,
                (SalaryRecord.employee_id == Employee.id) & (SalaryRecord.is_current == True),
            )
            .order_by(desc(SalaryRecord.total_compensation_usd))
            .limit(5)
            .all()
        )
        earners = [
            {
                "name": f"{emp.first_name} {emp.last_name}",
                "code": emp.employee_code,
                "title": emp.job_title,
                "department": emp.department,
                "country": emp.country,
                "total_comp_usd": f"${sal.total_compensation_usd:,.2f}",
                "base_salary_usd": f"${sal.base_salary_usd:,.2f}",
                "bonus_pct": f"{sal.bonus_percentage}%",
            }
            for emp, sal in results
        ]
        top = earners[0] if earners else None
        answer = (
            f"The highest compensated individual is **{top['name']}** ({top['title']} in {top['department']}) "
            f"earning **{top['total_comp_usd']} USD** in total compensation."
            if top
            else "No employee compensation records found."
        )
        return ChatbotQueryResponse(
            answer=answer,
            category="Top Earners",
            data_type="table",
            data={
                "headers": ["Employee", "Title", "Department", "Country", "Total Comp (USD)"],
                "rows": earners,
            },
            suggestions=[
                "Who is the lowest paid employee?",
                "What is the average salary in Engineering?",
                "How many employees are in the organization?",
            ],
        )

    # 2. Lowest Paid Employees
    if any(
        phrase in query
        for phrase in [
            "lowest paid",
            "lowest salary",
            "bottom 5",
            "lowest compensation",
            "least paid",
        ]
    ):
        results = (
            db.query(Employee, SalaryRecord)
            .join(
                SalaryRecord,
                (SalaryRecord.employee_id == Employee.id) & (SalaryRecord.is_current == True),
            )
            .filter(Employee.is_active == True)
            .order_by(asc(SalaryRecord.total_compensation_usd))
            .limit(5)
            .all()
        )
        earners = [
            {
                "name": f"{emp.first_name} {emp.last_name}",
                "code": emp.employee_code,
                "title": emp.job_title,
                "department": emp.department,
                "country": emp.country,
                "total_comp_usd": f"${sal.total_compensation_usd:,.2f}",
                "base_salary_usd": f"${sal.base_salary_usd:,.2f}",
            }
            for emp, sal in results
        ]
        lowest = earners[0] if earners else None
        answer = (
            f"The lowest compensated active employee is **{lowest['name']}** ({lowest['title']} in {lowest['department']}) "
            f"with total compensation of **{lowest['total_comp_usd']} USD**."
            if lowest
            else "No active employee records found."
        )
        return ChatbotQueryResponse(
            answer=answer,
            category="Compensation Spectrum",
            data_type="table",
            data={
                "headers": ["Employee", "Title", "Department", "Country", "Total Comp (USD)"],
                "rows": earners,
            },
            suggestions=[
                "Who are the top 5 highest paid employees?",
                "How many employees are underpaid relative to their salary band?",
                "Show gender pay parity across departments",
            ],
        )

    # 3. Gender Pay Gap & Parity
    if any(
        k in query
        for k in ["gender", "pay gap", "parity", "female", "male", "women", "equity", "diversity"]
    ):
        gender_data = analytics_service.get_gender_pay_gap(db)
        ratio_pct = f"{(gender_data.overall_female_to_male_ratio * 100):.1f}%"
        gap_sign = "+" if gender_data.overall_gap_percentage > 0 else ""
        gap_pct = f"{gap_sign}{gender_data.overall_gap_percentage}%"

        dept_summary = [
            {
                "department": d.department,
                "female_median": f"${d.female_median_usd:,.0f}",
                "male_median": f"${d.male_median_usd:,.0f}",
                "ratio": f"{(d.female_to_male_ratio * 100):.1f}%",
            }
            for d in gender_data.department_breakdown
        ]

        answer = (
            f"The overall organizational **Gender Pay Parity Ratio is {ratio_pct}** (female-to-male median ratio). "
            f"The global pay gap stands at **{gap_pct}** across all 8 functional departments."
        )
        return ChatbotQueryResponse(
            answer=answer,
            category="Pay Equity",
            data_type="table",
            data={
                "headers": ["Department", "Female Median", "Male Median", "Parity Ratio"],
                "rows": dept_summary,
            },
            suggestions=[
                "What is the budget to fix underpaid employees?",
                "What is the average salary in Engineering?",
                "Show overall headcount and payroll",
            ],
        )

    # 4. Salary Band Compliance & Underpaid Outliers
    if any(
        k in query
        for k in [
            "underpaid",
            "overpaid",
            "band compliance",
            "outlier",
            "remediation",
            "budget to fix",
            "cost to fix",
            "salary band",
        ]
    ):
        compliance = analytics_service.get_band_compliance(db)
        answer = (
            f"The organization has an overall **Salary Band Compliance Rate of {compliance.compliance_rate_percentage}%**. "
            f"There are **{compliance.underpaid_count} underpaid outliers** and **{compliance.overpaid_count} overpaid outliers**. "
            f"The estimated budget required to bring all underpaid employees to their salary band minimum is **${compliance.cost_to_bring_to_minimum_usd:,.2f} USD**."
        )
        outlier_rows = [
            {
                "name": o.name,
                "code": o.employee_code,
                "department": o.department,
                "level": o.job_level,
                "salary": f"${o.salary_usd:,.0f}",
                "status": o.status,
                "deviation": f"${o.deviation_usd:,.0f} ({o.deviation_percentage}%)",
            }
            for o in compliance.top_outliers[:5]
        ]
        return ChatbotQueryResponse(
            answer=answer,
            category="Band Compliance",
            data_type="table",
            data={
                "headers": [
                    "Employee",
                    "Code",
                    "Department",
                    "Level",
                    "Salary (USD)",
                    "Status",
                    "Deviation",
                ],
                "rows": outlier_rows,
            },
            suggestions=[
                "How many employees are in Engineering?",
                "Who are the top 5 highest earners?",
                "Show currency exchange rates",
            ],
        )

    # 5. Department Breakdown
    matched_dept = None
    for dept in DEPARTMENTS:
        if dept.lower() in query:
            matched_dept = dept
            break

    if matched_dept or "department" in query or "dept" in query:
        dept_stats = analytics_service.get_department_stats(db)
        if matched_dept:
            target = next(
                (d for d in dept_stats if d.department.lower() == matched_dept.lower()), None
            )
            if target:
                answer = (
                    f"**{target.department}** has **{target.employee_count} employees** with a total payroll of "
                    f"**${target.total_payroll_usd:,.2f} USD**. "
                    f"The average base salary is **${target.mean_base_usd:,.2f} USD** (median: **${target.median_base_usd:,.2f} USD**), "
                    f"with an average bonus of **{target.avg_bonus_percentage:.1f}%**."
                )
                return ChatbotQueryResponse(
                    answer=answer,
                    category=f"Department: {target.department}",
                    data_type="kpi",
                    data={
                        "Department": target.department,
                        "Headcount": target.employee_count,
                        "Total Payroll": f"${target.total_payroll_usd:,.2f} USD",
                        "Average Base Pay": f"${target.mean_base_usd:,.2f} USD",
                        "Median Base Pay": f"${target.median_base_usd:,.2f} USD",
                        "Average Bonus": f"{target.avg_bonus_percentage:.1f}%",
                    },
                    suggestions=[
                        f"Who is the highest paid in {target.department}?",
                        "Compare with other departments",
                        "What is the gender pay parity ratio?",
                    ],
                )

        # Department comparison
        rows = [
            {
                "department": d.department,
                "count": d.employee_count,
                "total_payroll": f"${d.total_payroll_usd:,.0f}",
                "mean_base": f"${d.mean_base_usd:,.0f}",
                "bonus": f"{d.avg_bonus_percentage:.1f}%",
            }
            for d in dept_stats
        ]
        top_dept = max(dept_stats, key=lambda x: x.total_payroll_usd) if dept_stats else None
        answer = (
            f"The organization spans **{len(dept_stats)} departments**. "
            f"**{top_dept.department if top_dept else 'N/A'}** represents the largest total payroll expenditure at "
            f"**${top_dept.total_payroll_usd:,.2f} USD**."
            if top_dept
            else "No department data available."
        )
        return ChatbotQueryResponse(
            answer=answer,
            category="Department Comparison",
            data_type="table",
            data={
                "headers": [
                    "Department",
                    "Headcount",
                    "Total Payroll (USD)",
                    "Avg Base (USD)",
                    "Avg Bonus",
                ],
                "rows": rows,
            },
            suggestions=[
                "What is the average salary in Engineering?",
                "What is the gender pay gap in Sales?",
                "Show underpaid outliers",
            ],
        )

    # 6. Country / Region Breakdown
    matched_country = None
    for country in COUNTRIES_DATA.keys():
        if country.lower() in query or COUNTRIES_DATA[country]["code"].lower() == query:
            matched_country = country
            break
    if "usa" in query or "united states" in query or " us " in f" {query} ":
        matched_country = "United States"
    elif "uk" in query or "united kingdom" in query or "britain" in query:
        matched_country = "United Kingdom"

    if matched_country or "country" in query or "countries" in query or "region" in query:
        country_stats = analytics_service.get_country_stats(db)
        if matched_country:
            c_target = next(
                (c for c in country_stats if c.country.lower() == matched_country.lower()), None
            )
            if c_target:
                meta = COUNTRIES_DATA.get(c_target.country, {})
                answer = (
                    f"**{c_target.country}** ({meta.get('code', '')}) has **{c_target.employee_count} employees** "
                    f"using local currency **{c_target.currency}** (1 {c_target.currency} = ${c_target.exchange_rate} USD). "
                    f"Total compensation spend is **${c_target.total_payroll_usd:,.2f} USD** with an average total compensation of **${c_target.mean_total_comp_usd:,.2f} USD**."
                )
                return ChatbotQueryResponse(
                    answer=answer,
                    category=f"Country: {c_target.country}",
                    data_type="kpi",
                    data={
                        "Country": c_target.country,
                        "Currency": f"{c_target.currency} ({meta.get('symbol', '')})",
                        "Headcount": c_target.employee_count,
                        "Exchange Rate to USD": f"${c_target.exchange_rate}",
                        "Total Spend (USD)": f"${c_target.total_payroll_usd:,.2f}",
                        "Average Comp (USD)": f"${c_target.mean_total_comp_usd:,.2f}",
                    },
                    suggestions=[
                        "What is the average salary in United States?",
                        "How many employees in India?",
                        "Show all supported currencies",
                    ],
                )

        rows = [
            {
                "country": c.country,
                "currency": c.currency,
                "count": c.employee_count,
                "total_usd": f"${c.total_payroll_usd:,.0f}",
                "mean_usd": f"${c.mean_total_comp_usd:,.0f}",
            }
            for c in country_stats
        ]
        answer = f"The workforce is distributed across **{len(country_stats)} countries and regional currency hubs**."
        return ChatbotQueryResponse(
            answer=answer,
            category="Global Countries",
            data_type="table",
            data={
                "headers": [
                    "Country",
                    "Currency",
                    "Headcount",
                    "Total Comp (USD)",
                    "Avg Comp (USD)",
                ],
                "rows": rows,
            },
            suggestions=[
                "Tell me about employees in Germany",
                "What is the total annual payroll?",
                "Who are the top 5 highest earners?",
            ],
        )

    # 7. Job Level & Seniority Breakdown
    matched_level = None
    for lvl in JOB_LEVELS:
        if lvl.lower() in query:
            matched_level = lvl
            break

    if matched_level or "seniority" in query or "job level" in query or "level" in query:
        level_stats = analytics_service.get_job_level_stats(db)
        if matched_level:
            target = next(
                (
                    level_stat
                    for level_stat in level_stats
                    if level_stat.job_level.lower() == matched_level.lower()
                ),
                None,
            )
            if target:
                answer = (
                    f"**{target.job_level} level** consists of **{target.employee_count} employees** "
                    f"with an average base salary of **${target.mean_base_usd:,.2f} USD** and an average total compensation of **${target.mean_total_comp_usd:,.2f} USD**. "
                    f"Average annual equity grant is **${target.avg_equity_usd:,.2f} USD**."
                )
                return ChatbotQueryResponse(
                    answer=answer,
                    category=f"Job Level: {target.job_level}",
                    data_type="kpi",
                    data={
                        "Seniority Level": target.job_level,
                        "Headcount": target.employee_count,
                        "Average Base (USD)": f"${target.mean_base_usd:,.2f}",
                        "Median Base (USD)": f"${target.median_base_usd:,.2f}",
                        "Average Total Comp (USD)": f"${target.mean_total_comp_usd:,.2f}",
                        "Average Equity (USD)": f"${target.avg_equity_usd:,.2f}",
                    },
                    suggestions=[
                        "Compare all seniority levels",
                        "What is the budget to fix underpaid employees?",
                        "Who is the highest paid employee?",
                    ],
                )

        rows = [
            {
                "level": level_stat.job_level,
                "count": level_stat.employee_count,
                "mean_base": f"${level_stat.mean_base_usd:,.0f}",
                "median_base": f"${level_stat.median_base_usd:,.0f}",
                "mean_total": f"${level_stat.mean_total_comp_usd:,.0f}",
                "avg_equity": f"${level_stat.avg_equity_usd:,.0f}",
            }
            for level_stat in level_stats
        ]
        answer = (
            f"Employees span **{len(level_stats)} seniority levels** (from Junior to Executive)."
        )
        return ChatbotQueryResponse(
            answer=answer,
            category="Seniority Progression",
            data_type="table",
            data={
                "headers": [
                    "Job Level",
                    "Headcount",
                    "Mean Base (USD)",
                    "Median Base (USD)",
                    "Mean Total (USD)",
                    "Avg Equity (USD)",
                ],
                "rows": rows,
            },
            suggestions=[
                "What is Executive compensation?",
                "What is Junior salary?",
                "What is the overall headcount?",
            ],
        )

    # 8. Performance Ratings
    if any(k in query for k in ["performance", "rating", "top performer", "low performer"]):
        top_performers = (
            db.query(func.count(Employee.id)).filter(Employee.performance_rating >= 4.0).scalar()
            or 0
        )
        avg_rating = db.query(func.avg(Employee.performance_rating)).scalar() or 0.0
        total_emp = db.query(func.count(Employee.id)).scalar() or 1
        pct_high = (top_performers / total_emp) * 100.0

        answer = (
            f"The workforce maintains an average performance rating of **{avg_rating:.2f} / 5.0**. "
            f"**{top_performers} employees ({pct_high:.1f}%)** achieve high performance ratings of 4.0 or above."
        )
        return ChatbotQueryResponse(
            answer=answer,
            category="Performance Metrics",
            data_type="kpi",
            data={
                "Average Rating": f"{avg_rating:.2f} / 5.0",
                "High Performers (>= 4.0)": f"{top_performers} ({pct_high:.1f}%)",
                "Total Evaluated Headcount": total_emp,
            },
            suggestions=[
                "Who are the top 5 highest earners?",
                "What is the average bonus in Engineering?",
                "Show salary band compliance",
            ],
        )

    # 9. Direct Employee Name or Code Search
    words = re.findall(r"[a-zA-Z0-9]+", query)
    emp_matches = []
    if len(words) >= 1:
        search_filter = or_(
            Employee.employee_code.ilike(f"%{query}%"),
            (Employee.first_name + " " + Employee.last_name).ilike(f"%{query}%"),
            Employee.email.ilike(f"%{query}%"),
        )
        if len(words) >= 2:
            search_filter = or_(
                search_filter,
                (
                    Employee.first_name.ilike(f"%{words[0]}%")
                    & Employee.last_name.ilike(f"%{words[1]}%")
                ),
                (
                    Employee.first_name.ilike(f"%{words[1]}%")
                    & Employee.last_name.ilike(f"%{words[0]}%")
                ),
            )
        emp_matches = (
            db.query(Employee, SalaryRecord)
            .join(
                SalaryRecord,
                (SalaryRecord.employee_id == Employee.id) & (SalaryRecord.is_current == True),
            )
            .filter(search_filter)
            .limit(3)
            .all()
        )

    if emp_matches:
        emp, sal = emp_matches[0]
        min_b, mid_b, max_b = get_band_for(emp.department, emp.job_level, emp.country)
        band_status = "WITHIN BAND"
        if sal.base_salary_usd < min_b:
            band_status = "UNDERPAID"
        elif sal.base_salary_usd > max_b:
            band_status = "OVERPAID"

        answer = (
            f"Found record for **{emp.first_name} {emp.last_name}** (`{emp.employee_code}`): "
            f"**{emp.job_title}** ({emp.job_level}) in **{emp.department}**, located in **{emp.city}, {emp.country}**. "
            f"Current base pay is **{sal.currency} {sal.base_salary:,.2f}** (${sal.base_salary_usd:,.2f} USD) "
            f"with a **{sal.bonus_percentage}%** bonus, totaling **${sal.total_compensation_usd:,.2f} USD**. "
            f"Compensation band status is **{band_status}**."
        )
        return ChatbotQueryResponse(
            answer=answer,
            category=f"Employee: {emp.first_name} {emp.last_name}",
            data_type="employee",
            data={
                "Full Name": f"{emp.first_name} {emp.last_name}",
                "Employee Code": emp.employee_code,
                "Email": emp.email,
                "Role & Department": f"{emp.job_title} • {emp.department} ({emp.job_level})",
                "Location": f"{emp.city}, {emp.country}",
                "Base Salary (Local)": f"{sal.currency} {sal.base_salary:,.2f}",
                "Base Salary (USD)": f"${sal.base_salary_usd:,.2f}",
                "Target Bonus": f"{sal.bonus_percentage}%",
                "Total Compensation": f"${sal.total_compensation_usd:,.2f} USD",
                "Band Status": band_status,
                "Performance Rating": f"{emp.performance_rating} / 5.0",
            },
            suggestions=[
                f"What is the average salary in {emp.department}?",
                f"How many employees are in {emp.country}?",
                "Who are the top 5 highest earners?",
            ],
        )

    # 10. Currencies & Exchange Rates
    if any(k in query for k in ["currency", "currencies", "exchange rate", "forex", "fx"]):
        rates_list = [
            {
                "currency": c["currency"],
                "symbol": c["symbol"],
                "country": name,
                "rate": f"1 {c['currency']} = ${c['rate']} USD",
            }
            for name, c in COUNTRIES_DATA.items()
        ]
        answer = "The platform supports **8 global operating currencies** pegged to real-time USD exchange rates."
        return ChatbotQueryResponse(
            answer=answer,
            category="Currencies & FX",
            data_type="table",
            data={
                "headers": ["Currency", "Symbol", "Country Hub", "USD Exchange Rate"],
                "rows": rates_list,
            },
            suggestions=[
                "What is the total payroll in USD?",
                "How many employees are in Japan?",
                "What is the median salary?",
            ],
        )

    # 11. Total Payroll & Headcount Overview (Default / General)
    overview = analytics_service.get_overview_stats(db)
    compliance_pct = (
        round((overview.within_band_count / overview.total_employees * 100.0), 2)
        if overview.total_employees > 0
        else 100.0
    )
    outliers_cnt = overview.underpaid_count + overview.overpaid_count
    answer = (
        f"**Workforce Summary**: Total headcount is **{overview.total_employees:,} employees** "
        f"(**{overview.active_employees:,} active**). "
        f"Total annual global payroll spend is **${overview.total_payroll_usd:,.2f} USD**. "
        f"The median base salary across all countries is **${overview.median_salary_usd:,.2f} USD** "
        f"(mean: **${overview.mean_salary_usd:,.2f} USD**) with a salary band compliance rate of **{compliance_pct}%**."
    )
    return ChatbotQueryResponse(
        answer=answer,
        category="Workforce Overview",
        data_type="kpi",
        data={
            "Total Payroll": f"${overview.total_payroll_usd:,.2f} USD",
            "Total Headcount": f"{overview.total_employees:,} ({overview.active_employees:,} active)",
            "Median Base Pay": f"${overview.median_salary_usd:,.2f} USD",
            "Mean Base Pay": f"${overview.mean_salary_usd:,.2f} USD",
            "Band Compliance": f"{compliance_pct}%",
            "Band Outliers": f"{outliers_cnt} employees",
        },
        suggestions=[
            "Who are the top 5 highest paid employees?",
            "What is the average salary in Engineering?",
            "What is the gender pay parity ratio?",
            "What is the budget required to fix underpaid employees?",
        ],
    )
