-- ============================================================
-- OA System - Initial Schema Migration
-- 47 tables in dependency order
-- PostgreSQL (GCP Cloud SQL)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- A. Organisation & User Master Data
-- ============================================================

CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    timezone VARCHAR(100),
    currency_code VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES regions(id),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(150),
    tax_id VARCHAR(100),
    currency_code VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    parent_department_id UUID REFERENCES departments(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS business_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_unit_id UUID REFERENCES business_units(id),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS job_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    level_order INT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_no VARCHAR(50) UNIQUE,

    -- Login
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
    auth_provider_uid VARCHAR(255),

    -- Name
    name_zh VARCHAR(100),
    name_en VARCHAR(100),
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,

    -- Status: pending_activation / active / suspended / resigned / terminated
    status VARCHAR(30) NOT NULL DEFAULT 'pending_activation',

    -- Super admin bypasses all permission checks
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,

    -- Login tracking
    last_login_at TIMESTAMP,
    last_login_ip INET,
    password_changed_at TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_org_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),

    company_id UUID REFERENCES companies(id),
    department_id UUID REFERENCES departments(id),
    business_unit_id UUID REFERENCES business_units(id),
    project_id UUID REFERENCES projects(id),

    position_id UUID REFERENCES positions(id),
    job_level_id UUID REFERENCES job_levels(id),

    direct_manager_user_id UUID REFERENCES users(id),

    -- Employee may have multiple assignments; only one is primary
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    started_at DATE,
    ended_at DATE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- B. Employee Profiles (HR)
-- ============================================================

CREATE TABLE IF NOT EXISTS employee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),

    -- Personal info
    birth_date DATE,
    gender VARCHAR(10),
    nationality VARCHAR(50),
    id_number VARCHAR(255),       -- encrypted at app layer
    passport_no VARCHAR(255),     -- encrypted at app layer

    -- Contact
    personal_email VARCHAR(150),
    mobile_phone VARCHAR(50),
    work_phone VARCHAR(50),
    current_address TEXT,
    registered_address TEXT,

    -- Emergency contact
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relation VARCHAR(50),

    -- Bank (salary) — encrypted at app layer
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    bank_account_no VARCHAR(255),

    -- Education
    highest_education VARCHAR(50),
    school_name VARCHAR(150),
    major VARCHAR(100),
    graduation_year INT,

    -- Employment
    hire_date DATE,
    probation_end_date DATE,
    regular_date DATE,
    employment_type VARCHAR(30) NOT NULL DEFAULT 'full_time',
    contract_start_date DATE,
    contract_end_date DATE,

    -- Offboarding
    resignation_date DATE,
    last_working_date DATE,
    termination_type VARCHAR(30),
    termination_reason TEXT,

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- C. Roles & Permissions
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id),
    permission_id UUID NOT NULL REFERENCES permissions(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    role_id UUID NOT NULL REFERENCES roles(id),

    -- scope_type: global / region / company / department / business_unit / project
    scope_type VARCHAR(50),
    scope_id UUID,

    granted_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, role_id, scope_type, scope_id)
);

-- ============================================================
-- D. Finance — Purchase Requests
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_no VARCHAR(50) NOT NULL UNIQUE,

    applicant_user_id UUID NOT NULL REFERENCES users(id),
    applicant_company_id UUID REFERENCES companies(id),
    applicant_department_id UUID REFERENCES departments(id),

    title VARCHAR(200) NOT NULL,
    description TEXT,

    total_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    currency_code VARCHAR(10) NOT NULL,

    -- draft / submitted / approving / approved / rejected / canceled / closed
    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    canceled_at TIMESTAMP,

    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_request_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id),

    region_id UUID NOT NULL REFERENCES regions(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    department_id UUID REFERENCES departments(id),
    business_unit_id UUID REFERENCES business_units(id),
    project_id UUID REFERENCES projects(id),

    amount NUMERIC(18, 2) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    description TEXT,

    reimbursed_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- E. Finance — Reimbursements
-- ============================================================

CREATE TABLE IF NOT EXISTS reimbursement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reimbursement_no VARCHAR(50) NOT NULL UNIQUE,

    purchase_request_id UUID REFERENCES purchase_requests(id),

    claimant_user_id UUID NOT NULL REFERENCES users(id),
    reimbursement_company_id UUID NOT NULL REFERENCES companies(id),
    reimbursement_region_id UUID NOT NULL REFERENCES regions(id),

    title VARCHAR(200) NOT NULL,
    description TEXT,

    total_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    currency_code VARCHAR(10) NOT NULL,

    -- draft / submitted / approving / approved / rejected / finance_reviewing / paid / canceled
    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    paid_at TIMESTAMP,
    canceled_at TIMESTAMP,

    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reimbursement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reimbursement_request_id UUID NOT NULL REFERENCES reimbursement_requests(id),
    purchase_request_allocation_id UUID REFERENCES purchase_request_allocations(id),

    expense_date DATE,
    expense_type VARCHAR(100),

    amount NUMERIC(18, 2) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,

    vendor_name VARCHAR(150),
    invoice_no VARCHAR(100),
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- F. Attachments
-- ============================================================

CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ref_type: purchase_request / reimbursement_request / reimbursement_item
    --           approval_action / leave_request / payroll_record
    ref_type VARCHAR(50) NOT NULL,
    ref_id UUID NOT NULL,

    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,        -- GCS object path
    file_size BIGINT,
    mime_type VARCHAR(100),

    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- G. Approval Workflow — Templates
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,

    -- form_type: purchase_request / reimbursement_request
    --            leave_request / overtime_request / clock_patch / asset_request
    form_type VARCHAR(50) NOT NULL,

    region_id UUID REFERENCES regions(id),
    company_id UUID REFERENCES companies(id),
    department_id UUID REFERENCES departments(id),
    business_unit_id UUID REFERENCES business_units(id),

    min_amount NUMERIC(18, 2),
    max_amount NUMERIC(18, 2),
    currency_code VARCHAR(10),

    priority INT NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_template_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_template_id UUID NOT NULL REFERENCES approval_templates(id),

    step_order INT NOT NULL,
    step_name VARCHAR(150) NOT NULL,
    -- approval_mode: all / any / majority
    approval_mode VARCHAR(30) NOT NULL DEFAULT 'all',

    is_required BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(approval_template_id, step_order)
);

CREATE TABLE IF NOT EXISTS approval_template_step_approvers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_template_step_id UUID NOT NULL REFERENCES approval_template_steps(id),

    -- approver_type: user / role / manager / department_head
    --                business_unit_head / finance_head / hr_head / ceo / chairman
    approver_type VARCHAR(50) NOT NULL,

    approver_user_id UUID REFERENCES users(id),
    approver_role_code VARCHAR(100),

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_template_cc_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_template_id UUID NOT NULL REFERENCES approval_templates(id),

    cc_type VARCHAR(50) NOT NULL,
    cc_user_id UUID REFERENCES users(id),
    cc_role_code VARCHAR(100),

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- H. Approval Workflow — Instances (snapshots at submission time)
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    form_type VARCHAR(50) NOT NULL,
    form_id UUID NOT NULL,

    approval_template_id UUID REFERENCES approval_templates(id),

    -- status: pending / in_progress / approved / rejected / canceled
    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    current_step_order INT,

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    canceled_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_instance_id UUID NOT NULL REFERENCES approval_instances(id),

    step_order INT NOT NULL,
    step_name VARCHAR(150) NOT NULL,
    approval_mode VARCHAR(30) NOT NULL DEFAULT 'all',

    -- status: pending / in_progress / approved / rejected / skipped / canceled
    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Dynamic co-sign tracking
    is_dynamic_added BOOLEAN NOT NULL DEFAULT FALSE,
    added_by UUID REFERENCES users(id),
    added_reason TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(approval_instance_id, step_order)
);

CREATE TABLE IF NOT EXISTS approval_step_approvers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_step_id UUID NOT NULL REFERENCES approval_steps(id),

    approver_user_id UUID NOT NULL REFERENCES users(id),

    -- status: pending / approved / rejected / skipped / transferred
    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    acted_at TIMESTAMP,
    comment TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    approval_instance_id UUID NOT NULL REFERENCES approval_instances(id),
    approval_step_id UUID REFERENCES approval_steps(id),
    approver_user_id UUID REFERENCES users(id),

    -- action: submit / approve / reject / cancel / withdraw
    --         add_step / add_approver / transfer / comment / cc_viewed
    action VARCHAR(50) NOT NULL,

    comment TEXT,
    metadata JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_cc_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    approval_instance_id UUID NOT NULL REFERENCES approval_instances(id),
    cc_user_id UUID NOT NULL REFERENCES users(id),

    has_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- I. Notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id),

    title VARCHAR(200) NOT NULL,
    message TEXT,

    ref_type VARCHAR(50),
    ref_id UUID,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- J. HR — Attendance
-- ============================================================

CREATE TABLE IF NOT EXISTS public_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES regions(id),
    company_id UUID REFERENCES companies(id),
    -- both NULL = group-wide holiday
    holiday_date DATE NOT NULL,
    name VARCHAR(150) NOT NULL,
    is_work_day BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(region_id, company_id, holiday_date)
);

CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_schedule_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_schedule_id UUID NOT NULL REFERENCES work_schedules(id),

    -- 0=Sunday, 1=Monday, ..., 6=Saturday
    day_of_week INT NOT NULL,

    is_work_day BOOLEAN NOT NULL DEFAULT TRUE,
    work_start_time TIME,
    work_end_time TIME,
    break_start_time TIME,
    break_end_time TIME,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    work_schedule_id UUID NOT NULL REFERENCES work_schedules(id),
    effective_date DATE NOT NULL,
    end_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- K. HR — Leave Types & Policies (before attendance_records)
-- ============================================================

CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    is_annual BOOLEAN NOT NULL DEFAULT TRUE,

    allow_carry_over BOOLEAN NOT NULL DEFAULT FALSE,
    carry_over_limit_days DECIMAL(5, 1),

    allow_negative_balance BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),

    company_id UUID REFERENCES companies(id),
    region_id UUID REFERENCES regions(id),

    min_service_months INT NOT NULL DEFAULT 0,
    max_service_months INT,

    annual_days DECIMAL(5, 1) NOT NULL,

    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    year INT NOT NULL,

    entitled_days DECIMAL(5, 1) NOT NULL DEFAULT 0,
    carry_over_days DECIMAL(5, 1) NOT NULL DEFAULT 0,
    adjusted_days DECIMAL(5, 1) NOT NULL DEFAULT 0,

    used_days DECIMAL(5, 1) NOT NULL DEFAULT 0,
    pending_days DECIMAL(5, 1) NOT NULL DEFAULT 0,
    -- available = entitled + carry_over + adjusted - used - pending (computed in app)

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_no VARCHAR(50) NOT NULL UNIQUE,

    user_id UUID NOT NULL REFERENCES users(id),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- morning / afternoon / null (full day)
    start_period VARCHAR(10),
    end_period VARCHAR(10),

    total_days DECIMAL(5, 1) NOT NULL,

    reason TEXT,

    proxy_user_id UUID REFERENCES users(id),

    -- draft / submitted / approving / approved / rejected / canceled / withdrawn
    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    canceled_at TIMESTAMP,

    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Note: leave_request_id on attendance_records is intentionally not a FK
-- to avoid circular dependency (leave_requests <-> attendance_records)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    work_date DATE NOT NULL,

    expected_start_time TIMESTAMP,
    expected_end_time TIMESTAMP,

    actual_clock_in TIMESTAMP,
    actual_clock_out TIMESTAMP,

    work_minutes INT NOT NULL DEFAULT 0,
    overtime_minutes INT NOT NULL DEFAULT 0,
    late_minutes INT NOT NULL DEFAULT 0,
    early_leave_minutes INT NOT NULL DEFAULT 0,

    -- normal / late / early_leave / absent / on_leave / holiday / rest_day
    status VARCHAR(30) NOT NULL DEFAULT 'normal',

    leave_request_id UUID,   -- soft reference, no FK to avoid circular dep

    note TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, work_date)
);

CREATE TABLE IF NOT EXISTS clock_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    attendance_record_id UUID REFERENCES attendance_records(id),

    -- clock_in / clock_out / break_start / break_end
    clock_type VARCHAR(30) NOT NULL,

    clock_time TIMESTAMP NOT NULL,

    -- web / mobile_gps / qrcode / admin_patch
    clock_method VARCHAR(30) NOT NULL,

    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_name VARCHAR(200),
    ip_address INET,

    is_manual BOOLEAN NOT NULL DEFAULT FALSE,
    manual_reason TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- L. HR — Overtime
-- ============================================================

CREATE TABLE IF NOT EXISTS overtime_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_no VARCHAR(50) NOT NULL UNIQUE,

    user_id UUID NOT NULL REFERENCES users(id),

    overtime_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(4, 1) NOT NULL,

    -- weekday / weekend / holiday
    overtime_type VARCHAR(30) NOT NULL,

    -- pay / comp_leave
    compensation_type VARCHAR(30) NOT NULL DEFAULT 'pay',

    reason TEXT,

    -- draft / submitted / approving / approved / rejected / canceled
    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,

    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- M. HR — Payroll
-- ============================================================

CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),

    currency_code VARCHAR(10) NOT NULL,
    base_salary NUMERIC(18, 2) NOT NULL DEFAULT 0,

    -- JSONB for flexible allowances: {"housing": 5000, "transport": 3000}
    allowances JSONB NOT NULL DEFAULT '{}',

    effective_date DATE NOT NULL,
    end_date DATE,

    change_reason TEXT,

    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INT NOT NULL,
    month INT NOT NULL,

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    pay_date DATE,

    -- draft / calculating / confirmed / paid
    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    locked_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(year, month)
);

CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id),
    user_id UUID NOT NULL REFERENCES users(id),

    salary_structure_id UUID REFERENCES salary_structures(id),
    currency_code VARCHAR(10) NOT NULL,

    base_salary NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_allowances NUMERIC(18, 2) NOT NULL DEFAULT 0,
    overtime_pay NUMERIC(18, 2) NOT NULL DEFAULT 0,
    bonus NUMERIC(18, 2) NOT NULL DEFAULT 0,
    gross_salary NUMERIC(18, 2) NOT NULL DEFAULT 0,

    income_tax NUMERIC(18, 2) NOT NULL DEFAULT 0,
    social_insurance NUMERIC(18, 2) NOT NULL DEFAULT 0,
    other_deductions NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(18, 2) NOT NULL DEFAULT 0,

    net_salary NUMERIC(18, 2) NOT NULL DEFAULT 0,

    calculation_detail JSONB,

    -- draft / confirmed / paid
    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(payroll_period_id, user_id)
);

-- ============================================================
-- N. HR — Performance
-- ============================================================

CREATE TABLE IF NOT EXISTS performance_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,

    -- annual / semi_annual / quarterly
    cycle_type VARCHAR(30) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    goal_setting_start DATE,
    goal_setting_end DATE,

    review_start_date DATE,
    review_end_date DATE,

    -- draft / goal_setting / self_review / manager_review / calibration / completed
    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performance_cycle_id UUID NOT NULL REFERENCES performance_cycles(id),
    user_id UUID NOT NULL REFERENCES users(id),

    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value TEXT,

    weight DECIMAL(5, 2) NOT NULL DEFAULT 100,

    self_assessment TEXT,
    self_rating DECIMAL(3, 1),

    manager_assessment TEXT,
    manager_rating DECIMAL(3, 1),

    -- draft / submitted / manager_reviewed / confirmed
    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performance_cycle_id UUID NOT NULL REFERENCES performance_cycles(id),
    reviewee_user_id UUID NOT NULL REFERENCES users(id),
    reviewer_user_id UUID NOT NULL REFERENCES users(id),

    overall_comment TEXT,

    final_rating DECIMAL(3, 1),
    rating_label VARCHAR(50),

    -- pending / in_progress / completed
    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    completed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(performance_cycle_id, reviewee_user_id, reviewer_user_id)
);

-- ============================================================
-- O. System Audit Logs (append-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    operator_user_id UUID NOT NULL REFERENCES users(id),

    -- action: user.create / user.suspend / role.assign / role.revoke
    --         permission.grant / system.config_change / payroll.confirm / payroll.unlock
    action VARCHAR(100) NOT NULL,

    -- target_type: user / role / permission / payroll_period / approval_template
    target_type VARCHAR(50),
    target_id UUID,

    old_data JSONB,
    new_data JSONB,

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes (performance-critical lookups)
-- ============================================================

-- users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_employee_no ON users(employee_no);

-- user_org_assignments
CREATE INDEX IF NOT EXISTS idx_uoa_user_id ON user_org_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_uoa_company_id ON user_org_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_uoa_department_id ON user_org_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_uoa_manager ON user_org_assignments(direct_manager_user_id);

-- purchase_requests
CREATE INDEX IF NOT EXISTS idx_pr_applicant ON purchase_requests(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_pr_status ON purchase_requests(status);

-- reimbursement_requests
CREATE INDEX IF NOT EXISTS idx_rr_claimant ON reimbursement_requests(claimant_user_id);
CREATE INDEX IF NOT EXISTS idx_rr_status ON reimbursement_requests(status);
CREATE INDEX IF NOT EXISTS idx_rr_pr ON reimbursement_requests(purchase_request_id);

-- approval_instances
CREATE INDEX IF NOT EXISTS idx_ai_form ON approval_instances(form_type, form_id);
CREATE INDEX IF NOT EXISTS idx_ai_status ON approval_instances(status);

-- approval_steps
CREATE INDEX IF NOT EXISTS idx_as_instance ON approval_steps(approval_instance_id);

-- approval_step_approvers
CREATE INDEX IF NOT EXISTS idx_asa_step ON approval_step_approvers(approval_step_id);
CREATE INDEX IF NOT EXISTS idx_asa_approver ON approval_step_approvers(approver_user_id, status);

-- approval_actions
CREATE INDEX IF NOT EXISTS idx_aa_instance ON approval_actions(approval_instance_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

-- attendance_records
CREATE INDEX IF NOT EXISTS idx_att_user_date ON attendance_records(user_id, work_date);

-- clock_records
CREATE INDEX IF NOT EXISTS idx_clock_user ON clock_records(user_id, clock_time);

-- leave_requests
CREATE INDEX IF NOT EXISTS idx_lr_user ON leave_requests(user_id, status);

-- leave_balances
CREATE INDEX IF NOT EXISTS idx_lb_user_year ON leave_balances(user_id, year);

-- payroll_records
CREATE INDEX IF NOT EXISTS idx_pay_period ON payroll_records(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_pay_user ON payroll_records(user_id);

-- system_audit_logs
CREATE INDEX IF NOT EXISTS idx_sal_operator ON system_audit_logs(operator_user_id);
CREATE INDEX IF NOT EXISTS idx_sal_target ON system_audit_logs(target_type, target_id);

-- attachments
CREATE INDEX IF NOT EXISTS idx_att_file_ref ON attachments(ref_type, ref_id);
