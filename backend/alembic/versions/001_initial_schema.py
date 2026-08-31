"""Initial migration with employees, salary_records, salary_bands, exchange_rates, audit_logs, and users

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-08-31 03:57:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. users Table
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="HR_MANAGER"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("last_login", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # 2. exchange_rates Table
    op.create_table(
        "exchange_rates",
        sa.Column("currency_code", sa.String(length=10), nullable=False),
        sa.Column("rate_to_usd", sa.Float(), nullable=False),
        sa.Column("symbol", sa.String(length=10), nullable=True),
        sa.Column("currency_name", sa.String(length=50), nullable=False),
        sa.Column("last_updated", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("currency_code"),
    )

    # 3. salary_bands Table
    op.create_table(
        "salary_bands",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("department", sa.String(length=50), nullable=False),
        sa.Column("job_level", sa.String(length=20), nullable=False),
        sa.Column("country", sa.String(length=50), nullable=False),
        sa.Column("min_salary_usd", sa.Float(), nullable=False),
        sa.Column("mid_salary_usd", sa.Float(), nullable=False),
        sa.Column("max_salary_usd", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_band_dept_level_country",
        "salary_bands",
        ["department", "job_level", "country"],
        unique=True,
    )

    # 4. employees Table
    op.create_table(
        "employees",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("employee_code", sa.String(length=20), nullable=False),
        sa.Column("first_name", sa.String(length=50), nullable=False),
        sa.Column("last_name", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("gender", sa.String(length=20), nullable=False),
        sa.Column("country", sa.String(length=50), nullable=False),
        sa.Column("country_code", sa.String(length=10), nullable=False),
        sa.Column("city", sa.String(length=50), nullable=False),
        sa.Column("department", sa.String(length=50), nullable=False),
        sa.Column("job_title", sa.String(length=100), nullable=False),
        sa.Column("job_level", sa.String(length=20), nullable=False),
        sa.Column("hire_date", sa.Date(), nullable=False),
        sa.Column("performance_rating", sa.Float(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_employees_employee_code"), "employees", ["employee_code"], unique=True)
    op.create_index(op.f("ix_employees_email"), "employees", ["email"], unique=True)
    op.create_index(op.f("ix_employees_country"), "employees", ["country"], unique=False)
    op.create_index(op.f("ix_employees_department"), "employees", ["department"], unique=False)
    op.create_index(op.f("ix_employees_job_level"), "employees", ["job_level"], unique=False)
    op.create_index(op.f("ix_employees_gender"), "employees", ["gender"], unique=False)
    op.create_index(
        "ix_emp_dept_country_level",
        "employees",
        ["department", "country", "job_level"],
        unique=False,
    )

    # 5. salary_records Table
    op.create_table(
        "salary_records",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("employee_id", sa.String(length=36), nullable=False),
        sa.Column("base_salary", sa.Float(), nullable=False),
        sa.Column("bonus_percentage", sa.Float(), nullable=True),
        sa.Column("equity_usd", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(length=10), nullable=False),
        sa.Column("exchange_rate_to_usd", sa.Float(), nullable=False),
        sa.Column("base_salary_usd", sa.Float(), nullable=False),
        sa.Column("bonus_usd", sa.Float(), nullable=False),
        sa.Column("total_compensation_usd", sa.Float(), nullable=False),
        sa.Column("effective_date", sa.Date(), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_salary_emp_current", "salary_records", ["employee_id", "is_current"], unique=False
    )
    op.create_index(
        op.f("ix_salary_records_base_salary_usd"),
        "salary_records",
        ["base_salary_usd"],
        unique=False,
    )
    op.create_index(
        op.f("ix_salary_records_total_compensation_usd"),
        "salary_records",
        ["total_compensation_usd"],
        unique=False,
    )

    # 6. salary_audit_logs Table
    op.create_table(
        "salary_audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("employee_id", sa.String(length=36), nullable=False),
        sa.Column("change_type", sa.String(length=50), nullable=False),
        sa.Column("previous_base", sa.Float(), nullable=False),
        sa.Column("new_base", sa.Float(), nullable=False),
        sa.Column("previous_total_usd", sa.Float(), nullable=False),
        sa.Column("new_total_usd", sa.Float(), nullable=False),
        sa.Column("change_percentage", sa.Float(), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("changed_by", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_audit_emp_created", "salary_audit_logs", ["employee_id", "created_at"], unique=False
    )


def downgrade() -> None:
    op.drop_table("salary_audit_logs")
    op.drop_table("salary_records")
    op.drop_table("employees")
    op.drop_table("salary_bands")
    op.drop_table("exchange_rates")
    op.drop_table("users")
