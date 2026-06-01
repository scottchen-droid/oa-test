# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

This directory contains the design specification for a **Group-level OA (Office Automation) System** rebuild, focused initially on **Financial OA** (purchase requests and expense reimbursements).

**Tech Stack:**
- **Frontend:** Vue.js 3 + TypeScript + Vite（獨立專案，部署為 GCP Cloud Run 服務）
- **Backend:** Node.js + NestJS + TypeScript + Prisma ORM（獨立專案，部署為 GCP Cloud Run 服務）
- **Database:** PostgreSQL（GCP Cloud SQL）
- **Object Storage:** GCP Cloud Storage（附件上傳，使用 Signed URL）
- **Cache / Queue:** GCP Memorystore for Redis
- **Secrets:** GCP Secret Manager
- **Architecture:** 前後端分離（非 monorepo），各自獨立 Git 儲存庫與 CI/CD

**Primary design document:** `oa_system_finance_design.md` (Traditional Chinese, 1600+ lines)

## Architecture

The system is a multi-tenant enterprise OA covering financial and HR workflows across a group structure of: Group → Region/Country → Company → Department → Business Unit → Project → Employee.

### Four Core Foundations

1. **Employee accounts & HR master data** — `users` (auth account) + `employee_profiles` (detailed HR info). All system accounts are created and managed by HR. `users.is_super_admin = TRUE` bypasses all permission checks.
2. **Organization master data** — `regions`, `companies`, `departments`, `positions`, `job_levels`, `user_org_assignments` (includes direct manager). Must be stable before any document, permission, or approval logic is built.
3. **Shared approval workflow engine** — all document types (purchase requests, reimbursements, leave, overtime, clock patches) use the same `approval_instances / approval_steps / approval_actions` engine, differentiated by `form_type`.
4. **Backend-enforced permission model** — `roles` + `permissions` + `user_roles` (with scope: global/region/company/department). All APIs validate identity, role, data scope, and state transitions server-side.

### Key Design Decision: Business Data vs. Workflow Data

A document's content (purchase request, leave request) and its approval flow are stored separately. Approval template changes never affect in-progress instances — `approval_instances` snapshot the workflow at submission time.

### Key Domain Concepts

- **採購申請單 / Purchase Request:** Pre-approval before spending. Supports cost allocation across multiple regions/companies/projects via `purchase_request_allocations`. Reimbursements link to allocation items, not the request itself.
- **費用報銷單 / Reimbursement:** Post-spend claim, traceable to a specific allocation item. One purchase request → many reimbursements, split by company/region.
- **Approval Workflow:** Template-based with amount tiers and regional variants. Supports multi-person nodes (all/any/majority), dynamic co-signing, CC recipients separate from approvers.
- **HR Module:** Employee accounts = login accounts. Covers attendance (clock-in via web/GPS/QR), leave management (balances per leave type per year), overtime, monthly payroll calculation, and performance cycles with goal-setting.

### Database Design

PostgreSQL conventions (Section 11):
- `NUMERIC(18,2)` for all monetary amounts
- UUID primary keys
- All timestamps in UTC; clients handle timezone conversion
- JSONB only for snapshots, metadata, and extensible config (allowances, audit payloads) — never for queryable core data
- Sensitive fields (`id_number`, `passport_no`, `bank_account_no`) encrypted at the application layer before storage

Key table groups (47 tables total):
- **Org & Auth:** `users`, `employee_profiles`, `user_org_assignments`, `positions`, `job_levels`, `regions`, `companies`, `departments`, `business_units`, `projects`
- **Finance:** `purchase_requests`, `purchase_request_allocations`, `reimbursement_requests`, `reimbursement_items`, `attachments`
- **Workflow:** `approval_templates`, `approval_template_steps`, `approval_template_step_approvers`, `approval_instances`, `approval_steps`, `approval_step_approvers`, `approval_actions`, `approval_cc_users`
- **Permissions:** `roles`, `user_roles`, `permissions`, `role_permissions`
- **HR — Attendance:** `public_holidays`, `work_schedules`, `work_schedule_rules`, `employee_work_schedules`, `attendance_records`, `clock_records`
- **HR — Leave:** `leave_types`, `leave_policies`, `leave_balances`, `leave_requests`, `overtime_requests`
- **HR — Payroll:** `salary_structures`, `payroll_periods`, `payroll_records`
- **HR — Performance:** `performance_cycles`, `performance_goals`, `performance_reviews`
- **System:** `notifications`, `system_audit_logs`

### Development Phases (Section 13)

1. User accounts, employee profiles, org master data, roles/permissions, super admin console
2. Purchase request CRUD
3. Shared approval workflow engine
4. Reimbursement handling
5. HR attendance & leave (clock-in, leave requests, overtime)
6. Payroll calculation
7. Performance management

## Open Questions

Section 15 lists 20 business decisions pending stakeholder input (10 finance, 10 HR). Consult before finalizing schema or workflow logic — decisions around leave accrual method, overtime compensation rules, clock-in location validation, and payroll multi-currency have direct schema implications.
