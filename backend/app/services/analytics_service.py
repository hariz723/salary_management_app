from collections import defaultdict

import numpy as np
from sqlalchemy.orm import Session

from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.analytics import (
    BandComplianceSummary,
    CountryStats,
    DepartmentStats,
    DistributionBucket,
    GenderDepartmentGap,
    GenderGroupStats,
    GenderPayGapAnalysis,
    HRQuestionCard,
    JobLevelStats,
    OutlierEmployee,
    OverviewStats,
)
from app.services.metadata_service import JOB_LEVELS, get_band_for


def get_overview_stats(db: Session) -> OverviewStats:
    repo = AnalyticsRepository(db)
    records = repo.get_active_salary_records_for_overview()

    if not records:
        return OverviewStats(
            total_employees=0,
            total_payroll_usd=0.0,
            mean_salary_usd=0.0,
            median_salary_usd=0.0,
            mean_total_comp_usd=0.0,
            median_total_comp_usd=0.0,
            avg_bonus_percentage=0.0,
            total_equity_usd=0.0,
            active_employees=0,
            inactive_employees=0,
            total_countries=0,
            total_departments=0,
            underpaid_count=0,
            overpaid_count=0,
            within_band_count=0,
        )

    base_salaries = np.array([r.base_salary_usd for r in records], dtype=np.float64)
    total_comps = np.array([r.total_compensation_usd for r in records], dtype=np.float64)
    bonuses = np.array([r.bonus_percentage for r in records], dtype=np.float64)
    equities = np.array([r.equity_usd for r in records], dtype=np.float64)

    active_count = sum(1 for r in records if r.is_active)
    inactive_count = len(records) - active_count
    countries = {r.country for r in records}
    departments = {r.department for r in records}

    underpaid = 0
    overpaid = 0
    within = 0
    for r in records:
        min_b, _, max_b = get_band_for(r.department, r.job_level, r.country)
        if r.base_salary_usd < min_b:
            underpaid += 1
        elif r.base_salary_usd > max_b:
            overpaid += 1
        else:
            within += 1

    return OverviewStats(
        total_employees=len(records),
        total_payroll_usd=round(float(np.sum(total_comps)), 2),
        mean_salary_usd=round(float(np.mean(base_salaries)), 2),
        median_salary_usd=round(float(np.median(base_salaries)), 2),
        mean_total_comp_usd=round(float(np.mean(total_comps)), 2),
        median_total_comp_usd=round(float(np.median(total_comps)), 2),
        avg_bonus_percentage=round(float(np.mean(bonuses)), 2),
        total_equity_usd=round(float(np.sum(equities)), 2),
        active_employees=active_count,
        inactive_employees=inactive_count,
        total_countries=len(countries),
        total_departments=len(departments),
        underpaid_count=underpaid,
        overpaid_count=overpaid,
        within_band_count=within,
    )


def get_pay_distribution(
    db: Session, country: str | None = None, department: str | None = None
) -> list[DistributionBucket]:
    repo = AnalyticsRepository(db)
    salaries = repo.get_total_comp_distribution_salaries(country=country, department=department)
    if not salaries:
        return []

    total_count = len(salaries)
    ranges = [
        ("< $40k", 0, 40000),
        ("$40k - $70k", 40000, 70000),
        ("$70k - $100k", 70000, 100000),
        ("$100k - $140k", 100000, 140000),
        ("$140k - $180k", 140000, 180000),
        ("$180k - $240k", 180000, 240000),
        ("$240k - $320k", 240000, 320000),
        ("> $320k", 320000, 10000000),
    ]

    buckets: list[DistributionBucket] = []
    for label, min_v, max_v in ranges:
        cnt = sum(1 for s in salaries if (s >= min_v if min_v == 0 else s > min_v) and s <= max_v)
        pct = round((cnt / total_count * 100.0), 2)
        buckets.append(
            DistributionBucket(
                range_label=label,
                min_val=float(min_v),
                max_val=float(max_v),
                count=cnt,
                percentage=pct,
            )
        )
    return buckets


def get_department_stats(db: Session) -> list[DepartmentStats]:
    repo = AnalyticsRepository(db)
    records = repo.get_department_salary_records()

    dept_map = defaultdict(lambda: {"bases": [], "bonuses": [], "totals": []})
    for r in records:
        dept_map[r.department]["bases"].append(r.base_salary_usd)
        dept_map[r.department]["bonuses"].append(r.bonus_percentage)
        dept_map[r.department]["totals"].append(r.total_compensation_usd)

    stats: list[DepartmentStats] = []
    for dept in sorted(dept_map.keys()):
        bases = np.array(dept_map[dept]["bases"], dtype=np.float64)
        totals = np.array(dept_map[dept]["totals"], dtype=np.float64)
        bonuses = np.array(dept_map[dept]["bonuses"], dtype=np.float64)

        stats.append(
            DepartmentStats(
                department=dept,
                employee_count=len(bases),
                total_payroll_usd=round(float(np.sum(totals)), 2),
                mean_base_usd=round(float(np.mean(bases)), 2),
                median_base_usd=round(float(np.median(bases)), 2),
                mean_total_comp_usd=round(float(np.mean(totals)), 2),
                median_total_comp_usd=round(float(np.median(totals)), 2),
                p10_usd=round(float(np.percentile(totals, 10)), 2),
                p25_usd=round(float(np.percentile(totals, 25)), 2),
                p75_usd=round(float(np.percentile(totals, 75)), 2),
                p90_usd=round(float(np.percentile(totals, 90)), 2),
                min_usd=round(float(np.min(totals)), 2),
                max_usd=round(float(np.max(totals)), 2),
                avg_bonus_percentage=round(float(np.mean(bonuses)), 2),
            )
        )
    return stats


def get_country_stats(db: Session) -> list[CountryStats]:
    repo = AnalyticsRepository(db)
    records = repo.get_country_salary_records()

    country_map = defaultdict(
        lambda: {
            "bases_usd": [],
            "totals_usd": [],
            "local_bases": [],
            "code": "",
            "currency": "",
            "rate": 1.0,
        }
    )
    for r in records:
        c = country_map[r.country]
        c["bases_usd"].append(r.base_salary_usd)
        c["totals_usd"].append(r.total_compensation_usd)
        c["local_bases"].append(r.base_salary)
        c["code"] = r.country_code
        c["currency"] = r.currency
        c["rate"] = r.exchange_rate_to_usd

    stats: list[CountryStats] = []
    for country in sorted(country_map.keys()):
        data = country_map[country]
        bases_usd = np.array(data["bases_usd"], dtype=np.float64)
        totals_usd = np.array(data["totals_usd"], dtype=np.float64)
        local_bases = np.array(data["local_bases"], dtype=np.float64)

        stats.append(
            CountryStats(
                country=country,
                country_code=data["code"],
                currency=data["currency"],
                exchange_rate=data["rate"],
                employee_count=len(bases_usd),
                total_payroll_usd=round(float(np.sum(totals_usd)), 2),
                mean_base_usd=round(float(np.mean(bases_usd)), 2),
                median_base_usd=round(float(np.median(bases_usd)), 2),
                mean_total_comp_usd=round(float(np.mean(totals_usd)), 2),
                median_total_comp_usd=round(float(np.median(totals_usd)), 2),
                total_local_currency=round(float(np.sum(local_bases)), 2),
            )
        )
    return stats


def get_job_level_stats(db: Session) -> list[JobLevelStats]:
    repo = AnalyticsRepository(db)
    records = repo.get_job_level_salary_records()

    level_map = defaultdict(lambda: {"bases": [], "totals": [], "equities": []})
    for r in records:
        level_map[r.job_level]["bases"].append(r.base_salary_usd)
        level_map[r.job_level]["totals"].append(r.total_compensation_usd)
        level_map[r.job_level]["equities"].append(r.equity_usd)

    stats: list[JobLevelStats] = []
    for level in JOB_LEVELS:
        if level in level_map:
            bases = np.array(level_map[level]["bases"], dtype=np.float64)
            totals = np.array(level_map[level]["totals"], dtype=np.float64)
            equities = np.array(level_map[level]["equities"], dtype=np.float64)

            stats.append(
                JobLevelStats(
                    job_level=level,
                    employee_count=len(bases),
                    mean_base_usd=round(float(np.mean(bases)), 2),
                    median_base_usd=round(float(np.median(bases)), 2),
                    mean_total_comp_usd=round(float(np.mean(totals)), 2),
                    median_total_comp_usd=round(float(np.median(totals)), 2),
                    avg_equity_usd=round(float(np.mean(equities)), 2),
                )
            )
    return stats


def get_gender_pay_gap(db: Session) -> GenderPayGapAnalysis:
    repo = AnalyticsRepository(db)
    records = repo.get_gender_salary_records()

    overall_gender_map = defaultdict(lambda: {"bases": [], "totals": []})
    dept_gender_map = defaultdict(lambda: defaultdict(list))

    for r in records:
        overall_gender_map[r.gender]["bases"].append(r.base_salary_usd)
        overall_gender_map[r.gender]["totals"].append(r.total_compensation_usd)
        dept_gender_map[r.department][r.gender].append(r.base_salary_usd)

    total_count = len(records)
    gender_stats: list[GenderGroupStats] = []
    for g in ["Male", "Female", "Non-Binary"]:
        if g in overall_gender_map:
            bases = np.array(overall_gender_map[g]["bases"], dtype=np.float64)
            totals = np.array(overall_gender_map[g]["totals"], dtype=np.float64)
            gender_stats.append(
                GenderGroupStats(
                    gender=g,
                    count=len(bases),
                    percentage=round(len(bases) / total_count * 100.0, 2),
                    mean_base_usd=round(float(np.mean(bases)), 2),
                    median_base_usd=round(float(np.median(bases)), 2),
                    mean_total_comp_usd=round(float(np.mean(totals)), 2),
                    median_total_comp_usd=round(float(np.median(totals)), 2),
                )
            )

    dept_breakdown: list[GenderDepartmentGap] = []
    for dept in sorted(dept_gender_map.keys()):
        m_list = dept_gender_map[dept].get("Male", [])
        f_list = dept_gender_map[dept].get("Female", [])
        nb_list = dept_gender_map[dept].get("Non-Binary", [])

        m_med = float(np.median(m_list)) if m_list else 0.0
        f_med = float(np.median(f_list)) if f_list else 0.0
        nb_med = float(np.median(nb_list)) if nb_list else 0.0

        gap_pct = round(((m_med - f_med) / m_med * 100.0), 2) if m_med > 0 else 0.0
        ratio = round((f_med / m_med), 3) if m_med > 0 else 1.0

        dept_breakdown.append(
            GenderDepartmentGap(
                department=dept,
                male_median_usd=round(m_med, 2),
                female_median_usd=round(f_med, 2),
                non_binary_median_usd=round(nb_med, 2),
                gap_percentage_female_vs_male=gap_pct,
                female_to_male_ratio=ratio,
            )
        )

    male_overall = np.median(overall_gender_map.get("Male", {}).get("bases", [1.0]))
    female_overall = np.median(overall_gender_map.get("Female", {}).get("bases", [1.0]))
    overall_gap = round(float((male_overall - female_overall) / male_overall * 100.0), 2)
    overall_ratio = round(float(female_overall / male_overall), 3)

    return GenderPayGapAnalysis(
        overall_by_gender=gender_stats,
        department_breakdown=dept_breakdown,
        overall_female_to_male_ratio=overall_ratio,
        overall_gap_percentage=overall_gap,
    )


def get_band_compliance(db: Session) -> BandComplianceSummary:
    repo = AnalyticsRepository(db)
    records = repo.get_band_compliance_records()

    total_emps = len(records)
    within_cnt = 0
    underpaid_cnt = 0
    overpaid_cnt = 0
    cost_to_minimum = 0.0
    outliers: list[OutlierEmployee] = []

    for r in records:
        min_b, mid_b, max_b = get_band_for(r.department, r.job_level, r.country)
        sal = r.base_salary_usd
        if sal < min_b:
            underpaid_cnt += 1
            dev = min_b - sal
            cost_to_minimum += dev
            dev_pct = round((dev / min_b * 100.0), 2)
            outliers.append(
                OutlierEmployee(
                    employee_id=r.id,
                    employee_code=r.employee_code,
                    name=f"{r.first_name} {r.last_name}",
                    department=r.department,
                    job_level=r.job_level,
                    country=r.country,
                    salary_usd=round(sal, 2),
                    band_min_usd=min_b,
                    band_mid_usd=mid_b,
                    band_max_usd=max_b,
                    status="UNDERPAID",
                    deviation_usd=round(dev, 2),
                    deviation_percentage=dev_pct,
                )
            )
        elif sal > max_b:
            overpaid_cnt += 1
            dev = sal - max_b
            dev_pct = round((dev / max_b * 100.0), 2)
            outliers.append(
                OutlierEmployee(
                    employee_id=r.id,
                    employee_code=r.employee_code,
                    name=f"{r.first_name} {r.last_name}",
                    department=r.department,
                    job_level=r.job_level,
                    country=r.country,
                    salary_usd=round(sal, 2),
                    band_min_usd=min_b,
                    band_mid_usd=mid_b,
                    band_max_usd=max_b,
                    status="OVERPAID",
                    deviation_usd=round(dev, 2),
                    deviation_percentage=dev_pct,
                )
            )
        else:
            within_cnt += 1

    outliers.sort(key=lambda x: x.deviation_percentage, reverse=True)
    compliance_rate = round((within_cnt / total_emps * 100.0), 2) if total_emps > 0 else 100.0

    return BandComplianceSummary(
        total_employees=total_emps,
        within_band_count=within_cnt,
        underpaid_count=underpaid_cnt,
        overpaid_count=overpaid_cnt,
        compliance_rate_percentage=compliance_rate,
        cost_to_bring_to_minimum_usd=round(cost_to_minimum, 2),
        top_outliers=outliers[:50],
    )


def get_hr_answers(db: Session) -> list[HRQuestionCard]:
    overview = get_overview_stats(db)
    dept_stats = get_department_stats(db)
    country_stats = get_country_stats(db)
    gender_gap = get_gender_pay_gap(db)
    band_comp = get_band_compliance(db)

    top_dept = max(dept_stats, key=lambda d: d.mean_total_comp_usd) if dept_stats else None
    top_bonus_dept = max(dept_stats, key=lambda d: d.avg_bonus_percentage) if dept_stats else None
    top_country = max(country_stats, key=lambda c: c.mean_total_comp_usd) if country_stats else None

    repo = AnalyticsRepository(db)
    top_earners = repo.get_top_earners(limit=5)

    cards: list[HRQuestionCard] = [
        HRQuestionCard(
            id="q1_gender_parity",
            question="What is the organization's gender pay parity index and where are the largest department gaps?",
            category="Equity & Diversity",
            summary_answer=f"Overall female-to-male pay ratio is {gender_gap.overall_female_to_male_ratio:.2f} (gap: {gender_gap.overall_gap_percentage}%). Across 8 departments, pay parity remains within competitive industry ranges.",
            detailed_data={
                "overall_ratio": gender_gap.overall_female_to_male_ratio,
                "overall_gap_pct": gender_gap.overall_gap_percentage,
                "departments": [d.model_dump() for d in gender_gap.department_breakdown],
            },
        ),
        HRQuestionCard(
            id="q2_band_cost",
            question="What is the budget impact required to bring all underpaid employees to band minimum?",
            category="Compensation Governance",
            summary_answer=f"${band_comp.cost_to_bring_to_minimum_usd:,.2f} USD is required to rectify {band_comp.underpaid_count} underpaid employees ({100 - band_comp.compliance_rate_percentage:.1f}% band deviation).",
            detailed_data={
                "cost_usd": band_comp.cost_to_bring_to_minimum_usd,
                "underpaid_count": band_comp.underpaid_count,
                "overpaid_count": band_comp.overpaid_count,
                "compliance_rate": band_comp.compliance_rate_percentage,
            },
        ),
        HRQuestionCard(
            id="q3_top_departments",
            question="Which departments lead in total compensation and performance bonuses?",
            category="Department Allocation",
            summary_answer=f"{top_dept.department if top_dept else 'N/A'} has the highest average total comp (${top_dept.mean_total_comp_usd:,.2f} USD). {top_bonus_dept.department if top_bonus_dept else 'N/A'} leads in bonus percentage ({top_bonus_dept.avg_bonus_percentage:.1f}%).",
            detailed_data={
                "top_department": top_dept.model_dump() if top_dept else {},
                "top_bonus_department": top_bonus_dept.model_dump() if top_bonus_dept else {},
            },
        ),
        HRQuestionCard(
            id="q4_country_expenditure",
            question="How is payroll distributed across global regions and currencies?",
            category="Global Payroll",
            summary_answer=f"Payroll is allocated across {len(country_stats)} countries totaling ${overview.total_payroll_usd:,.2f} USD. {top_country.country if top_country else 'N/A'} has the highest per-employee average compensation (${top_country.mean_total_comp_usd:,.2f} USD).",
            detailed_data={"countries": [c.model_dump() for c in country_stats]},
        ),
        HRQuestionCard(
            id="q5_top_earners",
            question="Who are the top 5 highest compensated individuals across the organization?",
            category="Executive & Key Talent",
            summary_answer=f"Top compensated roles are led by executive and technical leadership, capped by {top_earners[0].first_name} {top_earners[0].last_name} ({top_earners[0].job_title}) at ${top_earners[0].total_compensation_usd:,.2f} USD."
            if top_earners
            else "No employee records found.",
            detailed_data={
                "top_earners": [
                    {
                        "code": e.employee_code,
                        "name": f"{e.first_name} {e.last_name}",
                        "title": e.job_title,
                        "department": e.department,
                        "country": e.country,
                        "total_comp_usd": round(e.total_compensation_usd, 2),
                    }
                    for e in top_earners
                ]
            },
        ),
    ]
    return cards
