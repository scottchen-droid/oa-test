-- ================================================================
-- init.sql — OA 系統生產環境初始化資料
-- ================================================================
-- 執行順序：
--   1. 先執行所有 schema migrations（001~005）
--   2. 再執行本檔案
--
-- 本檔案包含：
--   - permissions（系統權限定義）
--   - roles（角色定義）
--   - role_permissions（ADMIN 角色取得全部權限）
--   - leave_types（假別定義）
--   - job_levels（職級定義）
--   - approval_templates + steps + approvers（標準審批模板）
--
-- ⚠️  管理員帳號（00001）請透過 npm run db:init 建立
--     原因：密碼需要 bcrypt 雜湊，SQL 無法直接產生
--
-- 重複執行安全：所有 INSERT 均使用 ON CONFLICT DO NOTHING
-- ================================================================

BEGIN;

-- ================================================================
-- 1. 系統權限
-- ================================================================

INSERT INTO permissions (id, code, name, module, created_at) VALUES
  -- 模塊入口
  (gen_random_uuid(), 'module.hr.access',              '進入人事模塊',           'module', NOW()),
  (gen_random_uuid(), 'module.finance.access',          '進入財務模塊',           'module', NOW()),
  (gen_random_uuid(), 'module.administration.access',   '進入行政模塊',           'module', NOW()),
  (gen_random_uuid(), 'module.system.access',           '進入系統模塊',           'module', NOW()),
  (gen_random_uuid(), 'module.home.access',             '進入首頁',               'module', NOW()),
  (gen_random_uuid(), 'module.home_manager.access',     '主管功能入口',           'module', NOW()),
  -- 首頁個人功能
  (gen_random_uuid(), 'home.personal.notification.view',  '查看個人通知',         'home', NOW()),
  (gen_random_uuid(), 'home.personal.payslip.view_self',  '查看自己的薪資單',     'home', NOW()),
  (gen_random_uuid(), 'home.attendance.record.view_self', '查看自己的打卡記錄',   'home', NOW()),
  (gen_random_uuid(), 'home.attendance.leave.apply',      '申請請假',             'home', NOW()),
  (gen_random_uuid(), 'home.attendance.overtime.apply',   '申請加班',             'home', NOW()),
  (gen_random_uuid(), 'home.attendance.exception.apply',  '申請異常打卡補正',     'home', NOW()),
  (gen_random_uuid(), 'home.forms.purchase.create',       '建立採購申請單',       'home', NOW()),
  (gen_random_uuid(), 'home.forms.reimbursement.create',  '建立費用報銷單',       'home', NOW()),
  -- 主管功能
  (gen_random_uuid(), 'home.manager.leave.approve',       '主管：審核請假申請',   'home', NOW()),
  (gen_random_uuid(), 'home.manager.clock_patch.approve', '主管：審核補打卡申請', 'home', NOW()),
  (gen_random_uuid(), 'home.manager.overtime.approve',    '主管：審核加班申請',   'home', NOW()),
  (gen_random_uuid(), 'home.manager.form.approve',        '主管：審核表單申請',   'home', NOW()),
  -- 人事模塊
  (gen_random_uuid(), 'hr.employee.view',        '查看員工資料',         'hr', NOW()),
  (gen_random_uuid(), 'hr.employee.create',      '新增員工',             'hr', NOW()),
  (gen_random_uuid(), 'hr.employee.edit',        '編輯員工',             'hr', NOW()),
  (gen_random_uuid(), 'hr.employee.delete',      '刪除員工',             'hr', NOW()),
  (gen_random_uuid(), 'hr.attendance.view_all',  '查看所有打卡記錄',     'hr', NOW()),
  (gen_random_uuid(), 'hr.attendance.edit',      '編輯出勤記錄',         'hr', NOW()),
  (gen_random_uuid(), 'hr.leave.manage',         '管理假勤（假別/餘額）', 'hr', NOW()),
  (gen_random_uuid(), 'hr.payroll.manage',       '管理薪資',             'hr', NOW()),
  (gen_random_uuid(), 'hr.performance.manage',   '管理績效考核',         'hr', NOW()),
  -- 財務模塊
  (gen_random_uuid(), 'finance.purchase.view_all',      '查看所有採購申請', 'finance', NOW()),
  (gen_random_uuid(), 'finance.purchase.manage',         '管理採購申請',    'finance', NOW()),
  (gen_random_uuid(), 'finance.reimbursement.review',    '審核費用報銷',    'finance', NOW()),
  (gen_random_uuid(), 'finance.payment.confirm',         '確認付款',        'finance', NOW()),
  (gen_random_uuid(), 'finance.report.view',             '查看財務報表',    'finance', NOW()),
  -- 行政模塊
  (gen_random_uuid(), 'administration.announcement.manage', '管理公告',   'administration', NOW()),
  (gen_random_uuid(), 'administration.asset.manage',         '管理資產',   'administration', NOW()),
  (gen_random_uuid(), 'administration.visitor.manage',       '管理訪客',   'administration', NOW()),
  (gen_random_uuid(), 'administration.meeting_room.manage',  '管理會議室', 'administration', NOW()),
  -- 系統模塊
  (gen_random_uuid(), 'system.user.manage',     '管理帳號',         'system', NOW()),
  (gen_random_uuid(), 'system.role.manage',     '管理角色與權限',   'system', NOW()),
  (gen_random_uuid(), 'system.org.manage',      '管理組織架構',     'system', NOW()),
  (gen_random_uuid(), 'system.workflow.manage', '管理審批流',       'system', NOW()),
  (gen_random_uuid(), 'system.audit_log.view',  '查看稽核日誌',     'system', NOW())
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- 2. 角色
-- ================================================================

INSERT INTO roles (id, code, name, description, is_system, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'ADMIN',         '系統管理員', '持有全部權限的系統管理角色',       TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'HR_ADMIN',      'HR管理員',   '管理員工、薪資與假勤政策',         TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'FINANCE_ADMIN', '財務管理員', '管理採購申請與費用報銷',           TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'DEPT_MANAGER',  '部門主管',   '審核部門內的假勤與採購申請',       TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'APPROVER',      '審核人員',   '可審核各類申請',                  TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'EMPLOYEE',      '一般員工',   'OA 基本功能',                    TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'AUDITOR',       '稽核人員',   '唯讀存取所有財務文件',             TRUE, TRUE, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ADMIN 角色取得全部權限
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
  SELECT gen_random_uuid(), r.id, p.id, NOW()
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.code = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ================================================================
-- 3. 假別定義
-- ================================================================

INSERT INTO leave_types (id, code, name, description, requires_approval, is_paid, is_annual, allow_carry_over, carry_over_limit_days, allow_negative_balance, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'ANNUAL',      '年假',   '員工年度特休假',       TRUE, TRUE,  TRUE,  TRUE,  5.0,  FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'PERSONAL',    '事假',   '個人事務請假',         TRUE, FALSE, FALSE, FALSE, NULL, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'SICK',        '病假',   '因病請假',             TRUE, TRUE,  FALSE, FALSE, NULL, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'MARRIAGE',    '婚假',   '本人結婚請假',          TRUE, TRUE,  FALSE, FALSE, NULL, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'BEREAVEMENT', '喪假',   '直系親屬喪亡請假',      TRUE, TRUE,  FALSE, FALSE, NULL, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'MATERNITY',   '產假',   '女性員工生產請假',      TRUE, TRUE,  FALSE, FALSE, NULL, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'PATERNITY',   '陪產假', '男性員工配偶生產請假',  TRUE, TRUE,  FALSE, FALSE, NULL, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'OFFICIAL',    '公假',   '公務或受召請假',        TRUE, TRUE,  FALSE, FALSE, NULL, FALSE, TRUE, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- 4. 職級定義
-- ================================================================

INSERT INTO job_levels (id, code, name, level_order, description, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'L1', '助理',     1, '入門級，0~2 年經驗',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'L2', '專員',     2, '基礎執行，2~4 年經驗', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'L3', '資深專員', 3, '獨立作業，4~7 年經驗', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'L4', '主任',     4, '帶領小組，7~10 年經驗',TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'L5', '副理',     5, '部門副手，10 年以上',  TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'L6', '經理',     6, '部門主管',             TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'L7', '副總',     7, '事業部主管',           TRUE, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- 5. 標準審批模板（13 種表單類型）
-- ================================================================

-- 使用 DO block 處理模板 + 步驟 + 審核人的插入
DO $$
DECLARE
  tpl_id UUID;
  step_id UUID;

  templates JSONB := '[
    {"code":"TPL-LEAVE",     "name":"請假申請審批流",      "form_type":"leave_request",         "route":"group_org"},
    {"code":"TPL-OT",        "name":"加班申請審批流",      "form_type":"overtime_request",       "route":"group_org"},
    {"code":"TPL-CLOCK",     "name":"補卡申請審批流",      "form_type":"clock_patch_request",    "route":"group_org"},
    {"code":"TPL-PURCHASE",  "name":"採購申請審批流",      "form_type":"purchase_request",       "route":"group_org"},
    {"code":"TPL-REIMBURSE", "name":"費用報銷審批流",      "form_type":"reimbursement_request",  "route":"group_org"},
    {"code":"TPL-TRIP",      "name":"出差申請審批流",      "form_type":"business_trip",          "route":"group_org"},
    {"code":"TPL-ASSET",     "name":"OA資產申請審批流",   "form_type":"asset_request",          "route":"group_org"},
    {"code":"TPL-MEAL",      "name":"誤餐費申請審批流",    "form_type":"meal_allowance",         "route":"group_org"},
    {"code":"TPL-IT",        "name":"資訊需求申請審批流",  "form_type":"it_request",             "route":"group_org"},
    {"code":"TPL-HEADCOUNT", "name":"人力需求申請審批流",  "form_type":"headcount_request",      "route":"group_org"},
    {"code":"TPL-RESIGN",    "name":"離職申請審批流",      "form_type":"resignation",            "route":"mixed"},
    {"code":"TPL-LWP",       "name":"留職停薪申請審批流",  "form_type":"leave_without_pay",      "route":"mixed"},
    {"code":"TPL-PAYROLL",   "name":"薪資申請審批流",      "form_type":"payroll_request",        "route":"office_org"}
  ]';

  -- 標準三步驟（group_org / mixed 用）
  std_steps JSONB := '[
    {"order":1,"name":"直屬主管審核",    "type":"applicant_direct_manager"},
    {"order":2,"name":"部門主管審核",    "type":"department_manager"},
    {"order":3,"name":"項目負責人確認",  "type":"project_owner"}
  ]';

  resign_steps JSONB := '[
    {"order":1,"name":"直屬主管確認",      "type":"applicant_direct_manager"},
    {"order":2,"name":"部門主管確認",      "type":"department_manager"},
    {"order":3,"name":"事業部負責人確認",  "type":"business_unit_head"}
  ]';

  payroll_steps JSONB := '[
    {"order":1,"name":"直屬主管確認", "type":"applicant_direct_manager"},
    {"order":2,"name":"公司 HR 審核", "type":"company_hr"},
    {"order":3,"name":"公司財務確認", "type":"company_finance"}
  ]';

  t JSONB;
  s JSONB;
  steps JSONB;
BEGIN
  FOR t IN SELECT * FROM jsonb_array_elements(templates)
  LOOP
    -- 取得或建立模板
    SELECT id INTO tpl_id FROM approval_templates WHERE code = t->>'code';
    IF tpl_id IS NULL THEN
      INSERT INTO approval_templates (id, code, name, form_type, approval_route_type, priority, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), t->>'code', t->>'name', t->>'form_type', t->>'route', 100, TRUE, NOW(), NOW())
      RETURNING id INTO tpl_id;
    END IF;

    -- 選擇對應步驟
    IF t->>'code' IN ('TPL-RESIGN', 'TPL-LWP') THEN
      steps := resign_steps;
    ELSIF t->>'code' = 'TPL-PAYROLL' THEN
      steps := payroll_steps;
    ELSE
      steps := std_steps;
    END IF;

    -- 建立步驟與審核人
    FOR s IN SELECT * FROM jsonb_array_elements(steps)
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM approval_template_steps
        WHERE approval_template_id = tpl_id AND step_order = (s->>'order')::INT
      ) THEN
        INSERT INTO approval_template_steps (id, approval_template_id, step_order, step_name, approval_mode, is_required, created_at, updated_at)
        VALUES (gen_random_uuid(), tpl_id, (s->>'order')::INT, s->>'name', 'any', TRUE, NOW(), NOW())
        RETURNING id INTO step_id;

        INSERT INTO approval_template_step_approvers (id, approval_template_step_id, approver_type, created_at)
        VALUES (gen_random_uuid(), step_id, s->>'type', NOW());
      END IF;
    END LOOP;
  END LOOP;
END $$;

COMMIT;

-- ================================================================
-- 管理員帳號
-- ================================================================
-- ⚠️  管理員帳號（employeeNo='00001'）請透過以下指令建立：
--
--   cd oa-backend && npm run db:init
--
-- 原因：密碼需要 bcrypt hash，純 SQL 無法安全產生。
-- 預設密碼：!Aa123456（首次登入後請立即修改）
-- ================================================================
