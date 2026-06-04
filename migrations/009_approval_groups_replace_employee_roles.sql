-- ================================================================
-- Migration 009: 審批群組系統
-- 移除 employee_approver_roles（員工直接標籤審批角色的設計）
-- 新增 approval_groups / approval_group_members / approval_group_scopes
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. 移除 employee_approver_roles
-- ----------------------------------------------------------------
DROP TABLE IF EXISTS employee_approver_roles;

-- ----------------------------------------------------------------
-- 2. 新增審批群組表
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_groups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL,
  "roleCode"  VARCHAR(50)  NOT NULL,
  -- roleCode 可用值（對應 approverType）：
  --   company_hr / company_hr_manager / company_finance / company_finance_manager
  --   group_hr / group_finance / group_finance_manager
  --   ceo / chairman
  mode        VARCHAR(20)  NOT NULL DEFAULT 'primary',
  -- primary = 只通知主要負責人
  -- any     = 任一成員皆可處理
  description TEXT,
  "isActive"  BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_groups_role ON approval_groups ("roleCode", "isActive");

COMMENT ON TABLE approval_groups IS
  '審批群組：承接審批角色在特定服務範圍內的責任。
   一個角色可以有多個群組（不同公司/地區）。
   解析時依申請人的公司/地區找最匹配的群組，再取其 primary 成員。';

-- ----------------------------------------------------------------
-- 3. 新增審批群組成員表
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_group_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId"   UUID        NOT NULL REFERENCES approval_groups(id),
  "userId"    UUID        NOT NULL REFERENCES users(id),
  "memberType" VARCHAR(20) NOT NULL DEFAULT 'member',
  -- primary = 主要負責人（primary 模式時唯一收到通知並需簽核）
  -- backup  = 備援（primary 不在時啟用，第一版可不實作）
  -- member  = 一般成員（any 模式時與主要成員同等）
  "isActive"  BOOLEAN      NOT NULL DEFAULT TRUE,
  "startedAt" DATE,
  "endedAt"   DATE,
  "createdAt" TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agm_group ON approval_group_members ("groupId");
CREATE INDEX IF NOT EXISTS idx_agm_user  ON approval_group_members ("userId");

COMMENT ON TABLE approval_group_members IS
  '審批群組成員。primary 模式下只有 memberType=primary 的成員負責審批。
   any 模式下所有 isActive=TRUE 的成員都收到通知，任一人簽核即完成。';

-- ----------------------------------------------------------------
-- 4. 新增審批群組服務範圍表
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_group_scopes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "groupId"   UUID        NOT NULL REFERENCES approval_groups(id),
  "scopeType" VARCHAR(30) NOT NULL,
  -- all           = 全集團（適用所有申請）
  -- region        = 特定地區（scopeId = regionId）
  -- company       = 特定公司（scopeId = companyId）
  -- business_unit = 特定事業部（scopeId = businessUnitId）
  -- project       = 特定項目（scopeId = projectId）
  -- department    = 特定部門（scopeId = departmentId）
  -- form_type     = 特定表單類型（formType 欄位填值）
  "scopeId"   UUID,        -- 對應組織 ID（scopeType=all / form_type 時為 NULL）
  "formType"  VARCHAR(100), -- scopeType=form_type 時填表單類型代碼
  "createdAt" TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ags_group ON approval_group_scopes ("groupId");

COMMENT ON TABLE approval_group_scopes IS
  '審批群組服務範圍。一個群組可以有多筆範圍。
   解析時：找到所有符合申請人組織條件的群組，優先選最精確的範圍（company > region > all）。
   多筆範圍代表 OR 關係（例如同一群組負責多間公司）。';

COMMIT;
