-- ================================================================
-- Migration 008: 審批流強化 + 員工審批職能角色
--
-- 1. approval_template_steps     — 新增 allowDynamicAdding 欄位
-- 2. approval_template_step_approvers — 新增 scopeConfig 欄位
-- 3. employee_approver_roles     — 新增員工審批職能角色表
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. 審批步驟新增「允許加簽」欄位
-- ----------------------------------------------------------------
ALTER TABLE approval_template_steps
  ADD COLUMN IF NOT EXISTS "allowDynamicAdding" BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN approval_template_steps."allowDynamicAdding" IS
  '是否允許在此步驟進行動態加簽（臨時新增審批人）';

-- ----------------------------------------------------------------
-- 2. 審批步驟審批人新增「範圍設定」欄位（JSON）
-- ----------------------------------------------------------------
ALTER TABLE approval_template_step_approvers
  ADD COLUMN IF NOT EXISTS "scopeConfig" JSONB;

COMMENT ON COLUMN approval_template_step_approvers."scopeConfig" IS
  '範圍解析設定，格式依 approverType 而異：
   project_owner    → { projectResolution: "applicant_project"|"specific_project", projectId?: uuid }
   department_manager → { departmentResolution: "applicant_department"|"specific_department", departmentId?: uuid }
   business_unit_head → { buResolution: "applicant_bu"|"specific_bu", businessUnitId?: uuid }
   company_hr/finance/... → { companyResolution: "applicant_company"|"specific_company", companyId?: uuid }';

-- ----------------------------------------------------------------
-- 3. 員工審批職能角色表
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_approver_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID        NOT NULL REFERENCES users(id),
  "roleType"  VARCHAR(50) NOT NULL,
  -- hr_specialist    → 人事專員（公司層級 company_hr，集團層級 group_hr）
  -- hr_manager       → 人事主管（company_hr_manager）
  -- finance_specialist → 財務人員（company_finance, group_finance）
  -- finance_manager  → 財務主管（company_finance_manager）
  -- company_head     → 公司負責人（company_head）

  "scopeType" VARCHAR(20) NOT NULL,
  -- company  → 公司層級（scopeId = companyId）
  -- group    → 集團層級（scopeId = NULL）

  "scopeId"   UUID        REFERENCES companies(id),
  -- 公司層級時填 companyId；集團層級時為 NULL

  "isActive"  BOOLEAN     NOT NULL DEFAULT TRUE,
  "startedAt" DATE,
  "endedAt"   DATE,
  "createdAt" TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_approver_roles_lookup
  ON employee_approver_roles ("roleType", "scopeType", "scopeId");

CREATE INDEX IF NOT EXISTS idx_emp_approver_roles_user
  ON employee_approver_roles ("userId");

COMMENT ON TABLE employee_approver_roles IS
  '員工審批職能角色：定義員工在審批流中的功能角色，
   例如某員工是「台灣公司的人事主管」或「集團財務人員」。
   審批流解析時，company_hr 類型會查詢 roleType=hr_specialist, scopeType=company, scopeId=<申請人公司>。';

-- ----------------------------------------------------------------
-- 現有審批模板步驟的預設值更新
-- （將已有步驟的 allowDynamicAdding 保持 FALSE，已由 DEFAULT 處理）
-- ----------------------------------------------------------------

COMMIT;
