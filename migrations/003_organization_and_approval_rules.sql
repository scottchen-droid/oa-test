-- ================================================================
-- Migration 003: 組織結構強化 + 審批規則擴充
-- 依據: doc/oa_organization_structure_and_approval_rules.md
-- 說明:
--   1. 事業部 (business_units)   加入 head_user_id
--   2. 項目 (projects)           加入 project_owner_user_id
--   3. 部門 (departments)        companyId 改為可選，加入 project_id / manager_user_id
--   4. 員工歸屬 (user_org_assignments) 加入 region_id / assignment_type / is_active
--   5. 審批模板 (approval_templates)   加入 approval_route_type / project_id
--   6. 審批步驟審核人 (approval_template_step_approvers) 擴大 approver_type 長度
--   7. 新增 organization_leaders 表
--   8. 新增 employee_cost_allocations 表
--   9. 新增 payroll_cost_allocation_snapshots 表
-- ================================================================

BEGIN;

-- ================================================================
-- 1. business_units — 加入事業部負責人
-- ================================================================
ALTER TABLE business_units
  ADD COLUMN IF NOT EXISTS head_user_id UUID REFERENCES users(id);

COMMENT ON COLUMN business_units.head_user_id IS '事業部負責人（單一，多負責人用 organization_leaders）';

-- ================================================================
-- 2. projects — 加入項目負責人
-- ================================================================
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_owner_user_id UUID REFERENCES users(id);

COMMENT ON COLUMN projects.project_owner_user_id IS '項目負責人（單一，多負責人用 organization_leaders）';

-- ================================================================
-- 3. departments — 雙組織線支援
-- ================================================================

-- companyId 改為可選（支援純集團業務線部門）
ALTER TABLE departments
  ALTER COLUMN company_id DROP NOT NULL;

-- 移除原有唯一限制（companyId 可為 null，舊限制行為不符需求）
ALTER TABLE departments
  DROP CONSTRAINT IF EXISTS departments_company_id_code_key;

-- 加入項目歸屬（集團業務組織線）
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- 加入部門主管（單一，多主管用 organization_leaders）
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS manager_user_id UUID REFERENCES users(id);

-- 加入唯一部分索引：同公司內不重複（companyId 非空時）
CREATE UNIQUE INDEX IF NOT EXISTS departments_company_code_unique
  ON departments (company_id, code)
  WHERE company_id IS NOT NULL;

-- 加入唯一部分索引：同項目內不重複（projectId 非空時）
CREATE UNIQUE INDEX IF NOT EXISTS departments_project_code_unique
  ON departments (project_id, code)
  WHERE project_id IS NOT NULL;

COMMENT ON COLUMN departments.company_id      IS '所屬公司（辦公室組織線，選填）';
COMMENT ON COLUMN departments.project_id      IS '所屬項目（集團業務組織線，選填）';
COMMENT ON COLUMN departments.manager_user_id IS '部門主管（單一，多主管用 organization_leaders）';

-- ================================================================
-- 4. user_org_assignments — 強化員工組織歸屬
-- ================================================================
ALTER TABLE user_org_assignments
  ADD COLUMN IF NOT EXISTS region_id      UUID REFERENCES regions(id),
  ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(30) NOT NULL DEFAULT 'primary',
  ADD COLUMN IF NOT EXISTS is_active      BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN user_org_assignments.region_id       IS '所屬地區（辦公室線，可從 company 推導，明確存儲方便查詢）';
COMMENT ON COLUMN user_org_assignments.assignment_type IS '歸屬類型：primary / secondary / temporary';
COMMENT ON COLUMN user_org_assignments.is_active       IS '是否啟用（軟停用，不影響歷史紀錄）';

-- ================================================================
-- 5. approval_templates — 審批路徑類型 + 項目維度
-- ================================================================
ALTER TABLE approval_templates
  ADD COLUMN IF NOT EXISTS approval_route_type VARCHAR(50) NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS project_id          UUID REFERENCES projects(id);

-- 擴大 form_type 欄位長度（支援更多表單類型名稱）
ALTER TABLE approval_templates
  ALTER COLUMN form_type TYPE VARCHAR(100);

COMMENT ON COLUMN approval_templates.approval_route_type IS '審批路徑：office_org / group_org / mixed / custom';
COMMENT ON COLUMN approval_templates.project_id          IS '適用項目（null=全域）';

-- ================================================================
-- 6. approval_template_step_approvers — 擴大 approver_type 長度
-- ================================================================
ALTER TABLE approval_template_step_approvers
  ALTER COLUMN approver_type TYPE VARCHAR(100);

COMMENT ON COLUMN approval_template_step_approvers.approver_type IS
  'applicant_direct_manager / department_manager / project_owner / '
  'business_unit_head / company_hr / company_finance / company_head / '
  'role / user / dynamic / form_field_user';

-- ================================================================
-- 7. organization_leaders — 組織負責人關聯表
-- ================================================================
CREATE TABLE IF NOT EXISTS organization_leaders (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_type     VARCHAR(50) NOT NULL,          -- business_unit / project / department
  org_id       UUID        NOT NULL,          -- 對應組織的 id
  user_id      UUID        NOT NULL REFERENCES users(id),
  leader_type  VARCHAR(50) NOT NULL,          -- head / owner / manager / deputy
  is_primary   BOOLEAN     NOT NULL DEFAULT TRUE,
  started_at   DATE,
  ended_at     DATE,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_leaders_org ON organization_leaders (org_type, org_id);
CREATE INDEX IF NOT EXISTS idx_org_leaders_user ON organization_leaders (user_id);

COMMENT ON TABLE organization_leaders IS
  '組織負責人關聯：支援一人多項目/多部門負責人，支援代理負責人，保留歷史紀錄';

-- ================================================================
-- 8. employee_cost_allocations — 員工薪資成本分攤
-- ================================================================
CREATE TABLE IF NOT EXISTS employee_cost_allocations (
  id                 UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID           NOT NULL REFERENCES users(id),
  region_id          UUID           REFERENCES regions(id),
  company_id         UUID           REFERENCES companies(id),
  business_unit_id   UUID           REFERENCES business_units(id),
  project_id         UUID           REFERENCES projects(id),
  department_id      UUID           REFERENCES departments(id),
  allocation_percent NUMERIC(5, 2)  NOT NULL,  -- 0.00–100.00，同期間加總 = 100
  started_at         DATE           NOT NULL,
  ended_at           DATE,
  is_active          BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMP      NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_alloc_user ON employee_cost_allocations (user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_cost_alloc_project ON employee_cost_allocations (project_id);

COMMENT ON TABLE employee_cost_allocations IS
  '員工薪資成本分攤：同一員工在同一期間的所有分攤比例加總必須為 100%';
COMMENT ON COLUMN employee_cost_allocations.allocation_percent IS
  '分攤比例（0.00–100.00）；業務層需確保同 user 同期間所有筆加總 = 100';

-- ================================================================
-- 9. payroll_cost_allocation_snapshots — 薪資成本分攤快照
-- ================================================================
CREATE TABLE IF NOT EXISTS payroll_cost_allocation_snapshots (
  id                 UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_period_id  UUID           NOT NULL REFERENCES payroll_periods(id),
  payroll_record_id  UUID           NOT NULL REFERENCES payroll_records(id),
  user_id            UUID           NOT NULL REFERENCES users(id),
  region_id          UUID,          -- 快照值，不設 FK 防止歷史紀錄被影響
  company_id         UUID,
  business_unit_id   UUID,
  project_id         UUID,
  department_id      UUID,
  allocation_percent NUMERIC(5, 2)  NOT NULL,  -- 快照比例
  allocated_amount   NUMERIC(18, 2) NOT NULL,  -- 快照金額 = 淨薪資 × 比例
  currency_code      VARCHAR(10)    NOT NULL,
  created_at         TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payroll_cost_period ON payroll_cost_allocation_snapshots (payroll_period_id, user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_cost_project ON payroll_cost_allocation_snapshots (project_id);

COMMENT ON TABLE payroll_cost_allocation_snapshots IS
  '薪資成本分攤快照：薪資期別鎖定後產生，後續組織異動不影響已結算月份的成本歸屬';
COMMENT ON COLUMN payroll_cost_allocation_snapshots.region_id IS
  '快照值（不設 FK）：避免組織異動或刪除影響歷史稽核紀錄';

COMMIT;
