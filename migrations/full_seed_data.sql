-- ================================================================
-- OA System — Full Seed Data
-- Restores ALL reference + employee data from scratch.
-- Safe to run on an empty DB after all schema migrations have run.
-- Pre-condition: schema migrations 001–007 must already be applied.
--
-- bcrypt hash for '!Aa123456' (rounds=10):
--   $2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu
-- ================================================================

BEGIN;

-- ================================================================
-- SECTION 1: 地區 (regions)
-- ================================================================

INSERT INTO regions (id, code, name, timezone, "currencyCode", "defaultLocale", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'JP', '日本', 'Asia/Tokyo',    'JPY', 'zh-TW', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'TW', '台灣', 'Asia/Taipei',   'TWD', 'zh-TW', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'UK', '英國', 'Europe/London', 'GBP', 'en',    TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name            = EXCLUDED.name,
  timezone        = EXCLUDED.timezone,
  "currencyCode"  = EXCLUDED."currencyCode",
  "defaultLocale" = EXCLUDED."defaultLocale",
  "isActive"      = TRUE,
  "updatedAt"     = NOW();

-- ================================================================
-- SECTION 2: 公司 (companies)
-- ================================================================

INSERT INTO companies (id, "regionId", code, name, "currencyCode", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), (SELECT id FROM regions WHERE code = 'JP'), 'JP_TY',      '天元有限公司', 'JPY', TRUE, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM regions WHERE code = 'TW'), 'TW_CODE',    '代碼科技',     'TWD', TRUE, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM regions WHERE code = 'TW'), 'TW_TIANBAO', '天珤科技',     'TWD', TRUE, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM regions WHERE code = 'TW'), 'TW_TIANQI',  '天棨科技',     'TWD', TRUE, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM regions WHERE code = 'UK'), 'UK_ROYCE',   'Royce Tech',  'GBP', TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  "regionId"     = EXCLUDED."regionId",
  name           = EXCLUDED.name,
  "currencyCode" = EXCLUDED."currencyCode",
  "isActive"     = TRUE,
  "updatedAt"    = NOW();

-- ================================================================
-- SECTION 3: 事業部 (business_units)
-- ================================================================

INSERT INTO business_units (id, code, name, description, "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'BU1', '第一事業部',   '集團第一事業部',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'BU2', '第二事業部',   '集團第二事業部',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'BU3', '第三事業部',   '集團第三事業部',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'BU4', '第四事業部',   '集團第四事業部',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'RND', '研發中心',     '集團研發中心',     TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'PMO', '項目管理中心', '集團項目管理中心', TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  "isActive"  = TRUE,
  "updatedAt" = NOW();

-- ================================================================
-- SECTION 4: 項目 (projects)
-- ================================================================

INSERT INTO projects (id, "businessUnitId", code, name, "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), (SELECT id FROM business_units WHERE code = 'BU1'), 'YL',    'YL',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM business_units WHERE code = 'BU1'), 'LY',    'LY',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM business_units WHERE code = 'BU1'), 'KX',    'KX',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM business_units WHERE code = 'BU1'), 'SPORT', 'Sport', TRUE, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM business_units WHERE code = 'BU2'), 'V8',    'V8',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM business_units WHERE code = 'BU3'), 'BW',    'BW',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM business_units WHERE code = 'BU4'), 'VV',    'VV',    TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  "businessUnitId" = EXCLUDED."businessUnitId",
  name             = EXCLUDED.name,
  "isActive"       = TRUE,
  "updatedAt"      = NOW();

-- ================================================================
-- SECTION 5: 職級 (job_levels)  P1~P16 (levelOrder 1-16) + M1~M7 (levelOrder 101-107)
-- ================================================================

INSERT INTO job_levels (id, code, name, "levelOrder", description, "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'P1',  'P1',  1,   '一般員工職級 P1',  TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P2',  'P2',  2,   '一般員工職級 P2',  TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P3',  'P3',  3,   '一般員工職級 P3',  TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P4',  'P4',  4,   '一般員工職級 P4',  TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P5',  'P5',  5,   '一般員工職級 P5',  TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P6',  'P6',  6,   '一般員工職級 P6',  TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P7',  'P7',  7,   '一般員工職級 P7',  TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P8',  'P8',  8,   '一般員工職級 P8',  TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P9',  'P9',  9,   '一般員工職級 P9',  TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P10', 'P10', 10,  '一般員工職級 P10', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P11', 'P11', 11,  '一般員工職級 P11', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P12', 'P12', 12,  '一般員工職級 P12', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P13', 'P13', 13,  '一般員工職級 P13', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P14', 'P14', 14,  '一般員工職級 P14', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P15', 'P15', 15,  '一般員工職級 P15', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P16', 'P16', 16,  '一般員工職級 P16', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M1',  'M1',  101, '管理崗職級 M1',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M2',  'M2',  102, '管理崗職級 M2',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M3',  'M3',  103, '管理崗職級 M3',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M4',  'M4',  104, '管理崗職級 M4',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M5',  'M5',  105, '管理崗職級 M5',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M6',  'M6',  106, '管理崗職級 M6',    TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M7',  'M7',  107, '管理崗職級 M7',    TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name         = EXCLUDED.name,
  "levelOrder" = EXCLUDED."levelOrder",
  description  = EXCLUDED.description,
  "isActive"   = TRUE,
  "updatedAt"  = NOW();

-- ================================================================
-- SECTION 6: 角色 (roles)
-- 7 system roles: ADMIN, HR_ADMIN, FINANCE_ADMIN, DEPT_MANAGER, APPROVER, EMPLOYEE, AUDITOR
-- ================================================================

INSERT INTO roles (id, code, name, description, "isSystem", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'ADMIN',         '系統管理員',   '擁有所有功能的最高管理員角色',         TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'HR_ADMIN',      'HR 管理員',    '負責人事、薪資、假勤管理',             TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'FINANCE_ADMIN', '財務管理員',   '負責採購申請及費用報銷的審核與管理',   TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'DEPT_MANAGER',  '部門主管',     '管理所屬部門成員及審核本部門申請',     TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'APPROVER',      '審批人',       '負責各類審批流程的節點審批',           TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'EMPLOYEE',      '一般員工',     '一般員工，可提交採購申請及費用報銷',   TRUE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'AUDITOR',       '稽核人員',     '只讀稽核，可查看所有申請及審批紀錄',   TRUE, TRUE, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- SECTION 7: 假別類型 (leave_types)
-- 8 types: ANNUAL, PERSONAL, SICK, MARRIAGE, BEREAVEMENT, MATERNITY, PATERNITY, OFFICIAL
-- ================================================================

INSERT INTO leave_types (id, code, name, description, "requiresApproval", "isPaid", "isAnnual", "allowCarryOver", "allowNegativeBalance", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'ANNUAL',       '特休假',   '年度特別休假，依年資累積',               TRUE,  TRUE,  TRUE,  TRUE,  FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'PERSONAL',     '事假',     '處理私人事務之假別',                     TRUE,  FALSE, TRUE,  FALSE, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'SICK',         '病假',     '因病就醫或療養之假別',                   TRUE,  TRUE,  TRUE,  FALSE, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'MARRIAGE',     '婚假',     '本人結婚之假別',                         TRUE,  TRUE,  FALSE, FALSE, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'BEREAVEMENT',  '喪假',     '直系親屬喪亡之假別',                     TRUE,  TRUE,  FALSE, FALSE, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'MATERNITY',    '產假',     '女性員工生育之假別',                     TRUE,  TRUE,  FALSE, FALSE, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'PATERNITY',    '陪產假',   '男性員工配偶生育之陪產假別',             TRUE,  TRUE,  FALSE, FALSE, FALSE, TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'OFFICIAL',     '公假',     '奉命公出、受訓、選舉投票等公務假別',     FALSE, TRUE,  FALSE, FALSE, FALSE, TRUE, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- SECTION 8: 系統管理員帳號 00001
-- ================================================================

INSERT INTO users (
  id, "employeeNo", email, "passwordHash", "authProvider",
  "displayName", "nameZh", "nameEn",
  status, "createdAt", "updatedAt"
)
VALUES (
  gen_random_uuid(),
  '00001',
  'admin@oa-system.com',
  '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu',
  'local',
  '系統管理員',
  '系統管理員',
  'System Admin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Assign ADMIN role to admin user 00001
INSERT INTO user_roles (id, "userId", "roleId", "createdAt")
SELECT gen_random_uuid(), u.id, r.id, NOW()
FROM users u, roles r
WHERE u."employeeNo" = '00001' AND r.code = 'ADMIN'
ON CONFLICT ("userId", "roleId", "scopeType", "scopeId") DO NOTHING;

-- ================================================================
-- SECTION 9: 員工帳號 (users) — JP_TY 10001–10030
-- ================================================================

-- JP_TY employees (nameZh only, no nameEn)
INSERT INTO users (id, "employeeNo", email, "passwordHash", "authProvider", "displayName", "nameZh", status, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '10001', '10001@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '山田太郎', '山田太郎', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10002', '10002@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '鈴木花子', '鈴木花子', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10003', '10003@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '田中一郎', '田中一郎', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10004', '10004@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '佐藤美咲', '佐藤美咲', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10005', '10005@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '伊藤浩二', '伊藤浩二', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10006', '10006@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '渡辺麻衣', '渡辺麻衣', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10007', '10007@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '中村健太', '中村健太', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10008', '10008@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '小林沙耶', '小林沙耶', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10009', '10009@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '加藤雄介', '加藤雄介', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10010', '10010@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '吉田由紀', '吉田由紀', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10011', '10011@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '山本拓也', '山本拓也', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10012', '10012@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '松本理恵', '松本理恵', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10013', '10013@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '井上慎一', '井上慎一', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10014', '10014@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '木村奈緒', '木村奈緒', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10015', '10015@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '林勇太',   '林勇太',   'active', NOW(), NOW()),
  (gen_random_uuid(), '10016', '10016@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '清水葵',   '清水葵',   'active', NOW(), NOW()),
  (gen_random_uuid(), '10017', '10017@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '山口亮介', '山口亮介', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10018', '10018@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '池田千春', '池田千春', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10019', '10019@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '橋本翔平', '橋本翔平', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10020', '10020@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '阿部沙紀', '阿部沙紀', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10021', '10021@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '石川大輔', '石川大輔', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10022', '10022@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '前田真由美', '前田真由美', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10023', '10023@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '岡田晃',   '岡田晃',   'active', NOW(), NOW()),
  (gen_random_uuid(), '10024', '10024@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '長谷川愛', '長谷川愛', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10025', '10025@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '近藤昌也', '近藤昌也', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10026', '10026@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '坂本麻里', '坂本麻里', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10027', '10027@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '藤田健',   '藤田健',   'active', NOW(), NOW()),
  (gen_random_uuid(), '10028', '10028@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '石田みゆき', '石田みゆき', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10029', '10029@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '西村義人', '西村義人', 'active', NOW(), NOW()),
  (gen_random_uuid(), '10030', '10030@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '福田のぞみ', '福田のぞみ', 'active', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- SECTION 9: 員工帳號 (users) — TW_CODE 20001–20030
-- ================================================================

INSERT INTO users (id, "employeeNo", email, "passwordHash", "authProvider", "displayName", "nameZh", status, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '20001', '20001@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '陳志豪', '陳志豪', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20002', '20002@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '林雅琪', '林雅琪', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20003', '20003@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '張明峰', '張明峰', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20004', '20004@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '黃怡寧', '黃怡寧', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20005', '20005@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '王俊偉', '王俊偉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20006', '20006@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '李佳蓉', '李佳蓉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20007', '20007@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '吳建宏', '吳建宏', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20008', '20008@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '劉姿妤', '劉姿妤', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20009', '20009@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '許智翔', '許智翔', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20010', '20010@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '蔡欣怡', '蔡欣怡', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20011', '20011@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '鄭文彬', '鄭文彬', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20012', '20012@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '楊佩珊', '楊佩珊', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20013', '20013@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '謝宗憲', '謝宗憲', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20014', '20014@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '洪雅雯', '洪雅雯', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20015', '20015@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '曾冠廷', '曾冠廷', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20016', '20016@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '邱雅婷', '邱雅婷', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20017', '20017@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '羅志偉', '羅志偉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20018', '20018@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '方美玲', '方美玲', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20019', '20019@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '盧建宇', '盧建宇', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20020', '20020@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '蘇怡萱', '蘇怡萱', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20021', '20021@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '江俊名', '江俊名', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20022', '20022@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '徐靜怡', '徐靜怡', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20023', '20023@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '余昌霖', '余昌霖', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20024', '20024@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '崔詩涵', '崔詩涵', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20025', '20025@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '趙大偉', '趙大偉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20026', '20026@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '廖宜珊', '廖宜珊', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20027', '20027@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '鍾明哲', '鍾明哲', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20028', '20028@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '高思穎', '高思穎', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20029', '20029@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '郭啟明', '郭啟明', 'active', NOW(), NOW()),
  (gen_random_uuid(), '20030', '20030@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '蕭雅欣', '蕭雅欣', 'active', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- SECTION 9: 員工帳號 (users) — TW_TIANBAO 30001–30030
-- ================================================================

INSERT INTO users (id, "employeeNo", email, "passwordHash", "authProvider", "displayName", "nameZh", status, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '30001', '30001@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '陳志豪', '陳志豪', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30002', '30002@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '林雅琪', '林雅琪', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30003', '30003@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '張明峰', '張明峰', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30004', '30004@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '黃怡寧', '黃怡寧', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30005', '30005@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '王俊偉', '王俊偉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30006', '30006@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '李佳蓉', '李佳蓉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30007', '30007@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '吳建宏', '吳建宏', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30008', '30008@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '劉姿妤', '劉姿妤', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30009', '30009@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '許智翔', '許智翔', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30010', '30010@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '蔡欣怡', '蔡欣怡', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30011', '30011@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '鄭文彬', '鄭文彬', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30012', '30012@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '楊佩珊', '楊佩珊', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30013', '30013@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '謝宗憲', '謝宗憲', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30014', '30014@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '洪雅雯', '洪雅雯', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30015', '30015@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '曾冠廷', '曾冠廷', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30016', '30016@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '邱雅婷', '邱雅婷', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30017', '30017@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '羅志偉', '羅志偉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30018', '30018@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '方美玲', '方美玲', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30019', '30019@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '盧建宇', '盧建宇', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30020', '30020@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '蘇怡萱', '蘇怡萱', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30021', '30021@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '江俊名', '江俊名', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30022', '30022@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '徐靜怡', '徐靜怡', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30023', '30023@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '余昌霖', '余昌霖', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30024', '30024@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '崔詩涵', '崔詩涵', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30025', '30025@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '趙大偉', '趙大偉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30026', '30026@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '廖宜珊', '廖宜珊', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30027', '30027@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '鍾明哲', '鍾明哲', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30028', '30028@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '高思穎', '高思穎', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30029', '30029@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '郭啟明', '郭啟明', 'active', NOW(), NOW()),
  (gen_random_uuid(), '30030', '30030@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '蕭雅欣', '蕭雅欣', 'active', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- SECTION 9: 員工帳號 (users) — TW_TIANQI 40001–40030
-- ================================================================

INSERT INTO users (id, "employeeNo", email, "passwordHash", "authProvider", "displayName", "nameZh", status, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '40001', '40001@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '陳志豪', '陳志豪', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40002', '40002@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '林雅琪', '林雅琪', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40003', '40003@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '張明峰', '張明峰', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40004', '40004@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '黃怡寧', '黃怡寧', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40005', '40005@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '王俊偉', '王俊偉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40006', '40006@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '李佳蓉', '李佳蓉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40007', '40007@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '吳建宏', '吳建宏', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40008', '40008@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '劉姿妤', '劉姿妤', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40009', '40009@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '許智翔', '許智翔', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40010', '40010@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '蔡欣怡', '蔡欣怡', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40011', '40011@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '鄭文彬', '鄭文彬', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40012', '40012@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '楊佩珊', '楊佩珊', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40013', '40013@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '謝宗憲', '謝宗憲', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40014', '40014@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '洪雅雯', '洪雅雯', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40015', '40015@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '曾冠廷', '曾冠廷', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40016', '40016@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '邱雅婷', '邱雅婷', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40017', '40017@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '羅志偉', '羅志偉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40018', '40018@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '方美玲', '方美玲', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40019', '40019@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '盧建宇', '盧建宇', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40020', '40020@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '蘇怡萱', '蘇怡萱', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40021', '40021@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '江俊名', '江俊名', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40022', '40022@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '徐靜怡', '徐靜怡', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40023', '40023@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '余昌霖', '余昌霖', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40024', '40024@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '崔詩涵', '崔詩涵', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40025', '40025@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '趙大偉', '趙大偉', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40026', '40026@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '廖宜珊', '廖宜珊', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40027', '40027@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '鍾明哲', '鍾明哲', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40028', '40028@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '高思穎', '高思穎', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40029', '40029@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '郭啟明', '郭啟明', 'active', NOW(), NOW()),
  (gen_random_uuid(), '40030', '40030@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', '蕭雅欣', '蕭雅欣', 'active', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- SECTION 9: 員工帳號 (users) — UK_ROYCE 50001–50030 (nameEn only)
-- ================================================================

INSERT INTO users (id, "employeeNo", email, "passwordHash", "authProvider", "displayName", "nameEn", status, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '50001', '50001@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'James Smith',    'James Smith',    'active', NOW(), NOW()),
  (gen_random_uuid(), '50002', '50002@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Emma Jones',     'Emma Jones',     'active', NOW(), NOW()),
  (gen_random_uuid(), '50003', '50003@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Oliver Brown',   'Oliver Brown',   'active', NOW(), NOW()),
  (gen_random_uuid(), '50004', '50004@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Sophia Williams','Sophia Williams','active', NOW(), NOW()),
  (gen_random_uuid(), '50005', '50005@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Harry Taylor',   'Harry Taylor',   'active', NOW(), NOW()),
  (gen_random_uuid(), '50006', '50006@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Isabella Davies','Isabella Davies','active', NOW(), NOW()),
  (gen_random_uuid(), '50007', '50007@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Jack Wilson',    'Jack Wilson',    'active', NOW(), NOW()),
  (gen_random_uuid(), '50008', '50008@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Mia Evans',      'Mia Evans',      'active', NOW(), NOW()),
  (gen_random_uuid(), '50009', '50009@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'George Thomas',  'George Thomas',  'active', NOW(), NOW()),
  (gen_random_uuid(), '50010', '50010@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Amelia Roberts', 'Amelia Roberts', 'active', NOW(), NOW()),
  (gen_random_uuid(), '50011', '50011@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Noah Johnson',   'Noah Johnson',   'active', NOW(), NOW()),
  (gen_random_uuid(), '50012', '50012@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Lily White',     'Lily White',     'active', NOW(), NOW()),
  (gen_random_uuid(), '50013', '50013@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Charlie Lewis',  'Charlie Lewis',  'active', NOW(), NOW()),
  (gen_random_uuid(), '50014', '50014@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Emily Martin',   'Emily Martin',   'active', NOW(), NOW()),
  (gen_random_uuid(), '50015', '50015@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Freddie Lee',    'Freddie Lee',    'active', NOW(), NOW()),
  (gen_random_uuid(), '50016', '50016@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Grace Harris',   'Grace Harris',   'active', NOW(), NOW()),
  (gen_random_uuid(), '50017', '50017@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Ethan Clark',    'Ethan Clark',    'active', NOW(), NOW()),
  (gen_random_uuid(), '50018', '50018@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Hannah Walker',  'Hannah Walker',  'active', NOW(), NOW()),
  (gen_random_uuid(), '50019', '50019@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Max Hall',       'Max Hall',       'active', NOW(), NOW()),
  (gen_random_uuid(), '50020', '50020@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Chloe Robinson', 'Chloe Robinson', 'active', NOW(), NOW()),
  (gen_random_uuid(), '50021', '50021@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Sebastian Hill', 'Sebastian Hill', 'active', NOW(), NOW()),
  (gen_random_uuid(), '50022', '50022@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Zoe Allen',      'Zoe Allen',      'active', NOW(), NOW()),
  (gen_random_uuid(), '50023', '50023@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Archie Young',   'Archie Young',   'active', NOW(), NOW()),
  (gen_random_uuid(), '50024', '50024@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Ella King',      'Ella King',      'active', NOW(), NOW()),
  (gen_random_uuid(), '50025', '50025@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Benjamin Wright','Benjamin Wright','active', NOW(), NOW()),
  (gen_random_uuid(), '50026', '50026@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Layla Scott',    'Layla Scott',    'active', NOW(), NOW()),
  (gen_random_uuid(), '50027', '50027@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Mason Green',    'Mason Green',    'active', NOW(), NOW()),
  (gen_random_uuid(), '50028', '50028@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Poppy Baker',    'Poppy Baker',    'active', NOW(), NOW()),
  (gen_random_uuid(), '50029', '50029@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Logan Adams',    'Logan Adams',    'active', NOW(), NOW()),
  (gen_random_uuid(), '50030', '50030@oa-system.com', '$2b$10$8NQVgHyMD1GseUTCnh9xqOOAjjjF.BnQ8GMP/P.0PGEn8F0EJQMbu', 'local', 'Ellie Nelson',   'Ellie Nelson',   'active', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- SECTION 9: 人事檔案 (employee_profiles) — JP_TY 10001–10030
-- Hire dates staggered: 2023-01-01 + n months (n = employeeNo offset 0-29)
-- ================================================================

INSERT INTO employee_profiles (id, "userId", "hireDate", "employmentType", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  u.id,
  (DATE '2023-01-01' + (((u."employeeNo"::int - 10001)) || ' months')::interval)::date,
  'full_time',
  NOW(),
  NOW()
FROM users u
WHERE u."employeeNo" IN (
  '10001','10002','10003','10004','10005','10006','10007','10008','10009','10010',
  '10011','10012','10013','10014','10015','10016','10017','10018','10019','10020',
  '10021','10022','10023','10024','10025','10026','10027','10028','10029','10030'
)
ON CONFLICT ("userId") DO NOTHING;

-- ================================================================
-- SECTION 9: 人事檔案 (employee_profiles) — TW_CODE 20001–20030
-- ================================================================

INSERT INTO employee_profiles (id, "userId", "hireDate", "employmentType", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  u.id,
  (DATE '2023-01-01' + (((u."employeeNo"::int - 20001)) || ' months')::interval)::date,
  'full_time',
  NOW(),
  NOW()
FROM users u
WHERE u."employeeNo" IN (
  '20001','20002','20003','20004','20005','20006','20007','20008','20009','20010',
  '20011','20012','20013','20014','20015','20016','20017','20018','20019','20020',
  '20021','20022','20023','20024','20025','20026','20027','20028','20029','20030'
)
ON CONFLICT ("userId") DO NOTHING;

-- ================================================================
-- SECTION 9: 人事檔案 (employee_profiles) — TW_TIANBAO 30001–30030
-- ================================================================

INSERT INTO employee_profiles (id, "userId", "hireDate", "employmentType", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  u.id,
  (DATE '2023-01-01' + (((u."employeeNo"::int - 30001)) || ' months')::interval)::date,
  'full_time',
  NOW(),
  NOW()
FROM users u
WHERE u."employeeNo" IN (
  '30001','30002','30003','30004','30005','30006','30007','30008','30009','30010',
  '30011','30012','30013','30014','30015','30016','30017','30018','30019','30020',
  '30021','30022','30023','30024','30025','30026','30027','30028','30029','30030'
)
ON CONFLICT ("userId") DO NOTHING;

-- ================================================================
-- SECTION 9: 人事檔案 (employee_profiles) — TW_TIANQI 40001–40030
-- ================================================================

INSERT INTO employee_profiles (id, "userId", "hireDate", "employmentType", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  u.id,
  (DATE '2023-01-01' + (((u."employeeNo"::int - 40001)) || ' months')::interval)::date,
  'full_time',
  NOW(),
  NOW()
FROM users u
WHERE u."employeeNo" IN (
  '40001','40002','40003','40004','40005','40006','40007','40008','40009','40010',
  '40011','40012','40013','40014','40015','40016','40017','40018','40019','40020',
  '40021','40022','40023','40024','40025','40026','40027','40028','40029','40030'
)
ON CONFLICT ("userId") DO NOTHING;

-- ================================================================
-- SECTION 9: 人事檔案 (employee_profiles) — UK_ROYCE 50001–50030
-- ================================================================

INSERT INTO employee_profiles (id, "userId", "hireDate", "employmentType", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  u.id,
  (DATE '2023-01-01' + (((u."employeeNo"::int - 50001)) || ' months')::interval)::date,
  'full_time',
  NOW(),
  NOW()
FROM users u
WHERE u."employeeNo" IN (
  '50001','50002','50003','50004','50005','50006','50007','50008','50009','50010',
  '50011','50012','50013','50014','50015','50016','50017','50018','50019','50020',
  '50021','50022','50023','50024','50025','50026','50027','50028','50029','50030'
)
ON CONFLICT ("userId") DO NOTHING;

-- ================================================================
-- SECTION 9: 員工組織歸屬 (user_org_assignments) — JP_TY 10001–10030
-- Business Unit: RND
-- Level distribution (1-indexed within each company's 30 employees):
--   Employees  1-3  → P1  (offset 0-2)
--   Employees  4-6  → P2  (offset 3-5)
--   Employees  7-9  → P3  (offset 6-8)
--   Employees 10-12 → P4  (offset 9-11)
--   Employees 13-15 → P5  (offset 12-14)
--   Employees 16-18 → P6  (offset 15-17)
--   Employees 19-20 → P7  (offset 18-19)
--   Employees 21-22 → P8  (offset 20-21)
--   Employees 23-24 → P9  (offset 22-23)
--   Employee  25    → P10 (offset 24)
--   Employee  26    → P11 (offset 25)
--   Employee  27    → P12 (offset 26)
--   Employee  28    → P13 (offset 27)
--   Employee  29    → M1  (offset 28)
--   Employee  30    → M2  (offset 29)
-- ================================================================

INSERT INTO user_org_assignments (
  id, "userId", "regionId", "companyId", "businessUnitId", "jobLevelId",
  "isPrimary", "assignmentType", "isActive", "startedAt", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  (SELECT id FROM regions       WHERE code = 'JP'),
  (SELECT id FROM companies     WHERE code = 'JP_TY'),
  (SELECT id FROM business_units WHERE code = 'RND'),
  (SELECT id FROM job_levels WHERE code =
    CASE
      WHEN (u."employeeNo"::int - 10001) BETWEEN 0  AND 2  THEN 'P1'
      WHEN (u."employeeNo"::int - 10001) BETWEEN 3  AND 5  THEN 'P2'
      WHEN (u."employeeNo"::int - 10001) BETWEEN 6  AND 8  THEN 'P3'
      WHEN (u."employeeNo"::int - 10001) BETWEEN 9  AND 11 THEN 'P4'
      WHEN (u."employeeNo"::int - 10001) BETWEEN 12 AND 14 THEN 'P5'
      WHEN (u."employeeNo"::int - 10001) BETWEEN 15 AND 17 THEN 'P6'
      WHEN (u."employeeNo"::int - 10001) BETWEEN 18 AND 19 THEN 'P7'
      WHEN (u."employeeNo"::int - 10001) BETWEEN 20 AND 21 THEN 'P8'
      WHEN (u."employeeNo"::int - 10001) BETWEEN 22 AND 23 THEN 'P9'
      WHEN (u."employeeNo"::int - 10001) = 24              THEN 'P10'
      WHEN (u."employeeNo"::int - 10001) = 25              THEN 'P11'
      WHEN (u."employeeNo"::int - 10001) = 26              THEN 'P12'
      WHEN (u."employeeNo"::int - 10001) = 27              THEN 'P13'
      WHEN (u."employeeNo"::int - 10001) = 28              THEN 'M1'
      WHEN (u."employeeNo"::int - 10001) = 29              THEN 'M2'
    END
  ),
  TRUE,
  'primary',
  TRUE,
  (DATE '2023-01-01' + (((u."employeeNo"::int - 10001)) || ' months')::interval)::date,
  NOW(),
  NOW()
FROM users u
WHERE u."employeeNo" IN (
  '10001','10002','10003','10004','10005','10006','10007','10008','10009','10010',
  '10011','10012','10013','10014','10015','10016','10017','10018','10019','10020',
  '10021','10022','10023','10024','10025','10026','10027','10028','10029','10030'
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- SECTION 9: 員工組織歸屬 (user_org_assignments) — TW_CODE 20001–20030
-- Business Unit: BU1
-- ================================================================

INSERT INTO user_org_assignments (
  id, "userId", "regionId", "companyId", "businessUnitId", "jobLevelId",
  "isPrimary", "assignmentType", "isActive", "startedAt", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  (SELECT id FROM regions       WHERE code = 'TW'),
  (SELECT id FROM companies     WHERE code = 'TW_CODE'),
  (SELECT id FROM business_units WHERE code = 'BU1'),
  (SELECT id FROM job_levels WHERE code =
    CASE
      WHEN (u."employeeNo"::int - 20001) BETWEEN 0  AND 2  THEN 'P1'
      WHEN (u."employeeNo"::int - 20001) BETWEEN 3  AND 5  THEN 'P2'
      WHEN (u."employeeNo"::int - 20001) BETWEEN 6  AND 8  THEN 'P3'
      WHEN (u."employeeNo"::int - 20001) BETWEEN 9  AND 11 THEN 'P4'
      WHEN (u."employeeNo"::int - 20001) BETWEEN 12 AND 14 THEN 'P5'
      WHEN (u."employeeNo"::int - 20001) BETWEEN 15 AND 17 THEN 'P6'
      WHEN (u."employeeNo"::int - 20001) BETWEEN 18 AND 19 THEN 'P7'
      WHEN (u."employeeNo"::int - 20001) BETWEEN 20 AND 21 THEN 'P8'
      WHEN (u."employeeNo"::int - 20001) BETWEEN 22 AND 23 THEN 'P9'
      WHEN (u."employeeNo"::int - 20001) = 24              THEN 'P10'
      WHEN (u."employeeNo"::int - 20001) = 25              THEN 'P11'
      WHEN (u."employeeNo"::int - 20001) = 26              THEN 'P12'
      WHEN (u."employeeNo"::int - 20001) = 27              THEN 'P13'
      WHEN (u."employeeNo"::int - 20001) = 28              THEN 'M1'
      WHEN (u."employeeNo"::int - 20001) = 29              THEN 'M2'
    END
  ),
  TRUE,
  'primary',
  TRUE,
  (DATE '2023-01-01' + (((u."employeeNo"::int - 20001)) || ' months')::interval)::date,
  NOW(),
  NOW()
FROM users u
WHERE u."employeeNo" IN (
  '20001','20002','20003','20004','20005','20006','20007','20008','20009','20010',
  '20011','20012','20013','20014','20015','20016','20017','20018','20019','20020',
  '20021','20022','20023','20024','20025','20026','20027','20028','20029','20030'
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- SECTION 9: 員工組織歸屬 (user_org_assignments) — TW_TIANBAO 30001–30030
-- Business Unit: BU2
-- ================================================================

INSERT INTO user_org_assignments (
  id, "userId", "regionId", "companyId", "businessUnitId", "jobLevelId",
  "isPrimary", "assignmentType", "isActive", "startedAt", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  (SELECT id FROM regions       WHERE code = 'TW'),
  (SELECT id FROM companies     WHERE code = 'TW_TIANBAO'),
  (SELECT id FROM business_units WHERE code = 'BU2'),
  (SELECT id FROM job_levels WHERE code =
    CASE
      WHEN (u."employeeNo"::int - 30001) BETWEEN 0  AND 2  THEN 'P1'
      WHEN (u."employeeNo"::int - 30001) BETWEEN 3  AND 5  THEN 'P2'
      WHEN (u."employeeNo"::int - 30001) BETWEEN 6  AND 8  THEN 'P3'
      WHEN (u."employeeNo"::int - 30001) BETWEEN 9  AND 11 THEN 'P4'
      WHEN (u."employeeNo"::int - 30001) BETWEEN 12 AND 14 THEN 'P5'
      WHEN (u."employeeNo"::int - 30001) BETWEEN 15 AND 17 THEN 'P6'
      WHEN (u."employeeNo"::int - 30001) BETWEEN 18 AND 19 THEN 'P7'
      WHEN (u."employeeNo"::int - 30001) BETWEEN 20 AND 21 THEN 'P8'
      WHEN (u."employeeNo"::int - 30001) BETWEEN 22 AND 23 THEN 'P9'
      WHEN (u."employeeNo"::int - 30001) = 24              THEN 'P10'
      WHEN (u."employeeNo"::int - 30001) = 25              THEN 'P11'
      WHEN (u."employeeNo"::int - 30001) = 26              THEN 'P12'
      WHEN (u."employeeNo"::int - 30001) = 27              THEN 'P13'
      WHEN (u."employeeNo"::int - 30001) = 28              THEN 'M1'
      WHEN (u."employeeNo"::int - 30001) = 29              THEN 'M2'
    END
  ),
  TRUE,
  'primary',
  TRUE,
  (DATE '2023-01-01' + (((u."employeeNo"::int - 30001)) || ' months')::interval)::date,
  NOW(),
  NOW()
FROM users u
WHERE u."employeeNo" IN (
  '30001','30002','30003','30004','30005','30006','30007','30008','30009','30010',
  '30011','30012','30013','30014','30015','30016','30017','30018','30019','30020',
  '30021','30022','30023','30024','30025','30026','30027','30028','30029','30030'
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- SECTION 9: 員工組織歸屬 (user_org_assignments) — TW_TIANQI 40001–40030
-- Business Unit: BU3
-- ================================================================

INSERT INTO user_org_assignments (
  id, "userId", "regionId", "companyId", "businessUnitId", "jobLevelId",
  "isPrimary", "assignmentType", "isActive", "startedAt", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  (SELECT id FROM regions       WHERE code = 'TW'),
  (SELECT id FROM companies     WHERE code = 'TW_TIANQI'),
  (SELECT id FROM business_units WHERE code = 'BU3'),
  (SELECT id FROM job_levels WHERE code =
    CASE
      WHEN (u."employeeNo"::int - 40001) BETWEEN 0  AND 2  THEN 'P1'
      WHEN (u."employeeNo"::int - 40001) BETWEEN 3  AND 5  THEN 'P2'
      WHEN (u."employeeNo"::int - 40001) BETWEEN 6  AND 8  THEN 'P3'
      WHEN (u."employeeNo"::int - 40001) BETWEEN 9  AND 11 THEN 'P4'
      WHEN (u."employeeNo"::int - 40001) BETWEEN 12 AND 14 THEN 'P5'
      WHEN (u."employeeNo"::int - 40001) BETWEEN 15 AND 17 THEN 'P6'
      WHEN (u."employeeNo"::int - 40001) BETWEEN 18 AND 19 THEN 'P7'
      WHEN (u."employeeNo"::int - 40001) BETWEEN 20 AND 21 THEN 'P8'
      WHEN (u."employeeNo"::int - 40001) BETWEEN 22 AND 23 THEN 'P9'
      WHEN (u."employeeNo"::int - 40001) = 24              THEN 'P10'
      WHEN (u."employeeNo"::int - 40001) = 25              THEN 'P11'
      WHEN (u."employeeNo"::int - 40001) = 26              THEN 'P12'
      WHEN (u."employeeNo"::int - 40001) = 27              THEN 'P13'
      WHEN (u."employeeNo"::int - 40001) = 28              THEN 'M1'
      WHEN (u."employeeNo"::int - 40001) = 29              THEN 'M2'
    END
  ),
  TRUE,
  'primary',
  TRUE,
  (DATE '2023-01-01' + (((u."employeeNo"::int - 40001)) || ' months')::interval)::date,
  NOW(),
  NOW()
FROM users u
WHERE u."employeeNo" IN (
  '40001','40002','40003','40004','40005','40006','40007','40008','40009','40010',
  '40011','40012','40013','40014','40015','40016','40017','40018','40019','40020',
  '40021','40022','40023','40024','40025','40026','40027','40028','40029','40030'
)
ON CONFLICT DO NOTHING;

-- ================================================================
-- SECTION 9: 員工組織歸屬 (user_org_assignments) — UK_ROYCE 50001–50030
-- Business Unit: BU4
-- ================================================================

INSERT INTO user_org_assignments (
  id, "userId", "regionId", "companyId", "businessUnitId", "jobLevelId",
  "isPrimary", "assignmentType", "isActive", "startedAt", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  (SELECT id FROM regions       WHERE code = 'UK'),
  (SELECT id FROM companies     WHERE code = 'UK_ROYCE'),
  (SELECT id FROM business_units WHERE code = 'BU4'),
  (SELECT id FROM job_levels WHERE code =
    CASE
      WHEN (u."employeeNo"::int - 50001) BETWEEN 0  AND 2  THEN 'P1'
      WHEN (u."employeeNo"::int - 50001) BETWEEN 3  AND 5  THEN 'P2'
      WHEN (u."employeeNo"::int - 50001) BETWEEN 6  AND 8  THEN 'P3'
      WHEN (u."employeeNo"::int - 50001) BETWEEN 9  AND 11 THEN 'P4'
      WHEN (u."employeeNo"::int - 50001) BETWEEN 12 AND 14 THEN 'P5'
      WHEN (u."employeeNo"::int - 50001) BETWEEN 15 AND 17 THEN 'P6'
      WHEN (u."employeeNo"::int - 50001) BETWEEN 18 AND 19 THEN 'P7'
      WHEN (u."employeeNo"::int - 50001) BETWEEN 20 AND 21 THEN 'P8'
      WHEN (u."employeeNo"::int - 50001) BETWEEN 22 AND 23 THEN 'P9'
      WHEN (u."employeeNo"::int - 50001) = 24              THEN 'P10'
      WHEN (u."employeeNo"::int - 50001) = 25              THEN 'P11'
      WHEN (u."employeeNo"::int - 50001) = 26              THEN 'P12'
      WHEN (u."employeeNo"::int - 50001) = 27              THEN 'P13'
      WHEN (u."employeeNo"::int - 50001) = 28              THEN 'M1'
      WHEN (u."employeeNo"::int - 50001) = 29              THEN 'M2'
    END
  ),
  TRUE,
  'primary',
  TRUE,
  (DATE '2023-01-01' + (((u."employeeNo"::int - 50001)) || ' months')::interval)::date,
  NOW(),
  NOW()
FROM users u
WHERE u."employeeNo" IN (
  '50001','50002','50003','50004','50005','50006','50007','50008','50009','50010',
  '50011','50012','50013','50014','50015','50016','50017','50018','50019','50020',
  '50021','50022','50023','50024','50025','50026','50027','50028','50029','50030'
)
ON CONFLICT DO NOTHING;

COMMIT;
