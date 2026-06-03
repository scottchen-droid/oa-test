-- ================================================================
-- Migration 006: 組織主數據初始化
-- 地區 / 公司 / 事業部 / 項目 / 職級
--
-- 注意：本專案的 Prisma 不使用 @map 覆寫欄位名稱，
--       因此 DB 實際欄位為 camelCase（如 currencyCode, isActive）。
-- ================================================================

BEGIN;

-- ================================================================
-- 1. 地區 (regions)
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
-- 2. 公司 (companies)
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
-- 3. 事業部 (business_units)
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
-- 4. 項目 (projects)
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
-- 5. 職級 (job_levels)  P1~P16 + M1~M7
--    P 等：一般員工  levelOrder 1~16
--    M 等：管理崗    levelOrder 101~107（排序高於 P 等）
-- ================================================================

INSERT INTO job_levels (id, code, name, "levelOrder", description, "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'P1',  'P1',  1,   '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P2',  'P2',  2,   '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P3',  'P3',  3,   '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P4',  'P4',  4,   '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P5',  'P5',  5,   '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P6',  'P6',  6,   '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P7',  'P7',  7,   '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P8',  'P8',  8,   '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P9',  'P9',  9,   '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P10', 'P10', 10,  '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P11', 'P11', 11,  '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P12', 'P12', 12,  '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P13', 'P13', 13,  '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P14', 'P14', 14,  '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P15', 'P15', 15,  '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'P16', 'P16', 16,  '一般員工職級', TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M1',  'M1',  101, '管理崗職級',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M2',  'M2',  102, '管理崗職級',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M3',  'M3',  103, '管理崗職級',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M4',  'M4',  104, '管理崗職級',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M5',  'M5',  105, '管理崗職級',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M6',  'M6',  106, '管理崗職級',   TRUE, NOW(), NOW()),
  (gen_random_uuid(), 'M7',  'M7',  107, '管理崗職級',   TRUE, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name           = EXCLUDED.name,
  "levelOrder"   = EXCLUDED."levelOrder",
  description    = EXCLUDED.description,
  "isActive"     = TRUE,
  "updatedAt"    = NOW();

COMMIT;
