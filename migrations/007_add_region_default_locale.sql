-- ================================================================
-- Migration 007: 地區新增預設語系欄位
-- ================================================================

BEGIN;

ALTER TABLE regions
  ADD COLUMN IF NOT EXISTS "defaultLocale" VARCHAR(10) NOT NULL DEFAULT 'zh-TW';

-- 依照地區設定預設語系
-- JP → zh-TW（日本區員工為華人，預設繁體中文）
-- TW → zh-TW（台灣，繁體中文）
-- UK → en（英國，英文）

UPDATE regions SET "defaultLocale" = 'zh-TW' WHERE code = 'JP';
UPDATE regions SET "defaultLocale" = 'zh-TW' WHERE code = 'TW';
UPDATE regions SET "defaultLocale" = 'en'    WHERE code = 'UK';

COMMENT ON COLUMN regions."defaultLocale" IS '地區預設語系：zh-TW / zh-CN / en，員工登入時依此設定介面語言';

COMMIT;
