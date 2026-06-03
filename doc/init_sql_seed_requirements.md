# OA 系統 init.sql 初始化資料生成需求

> 文件用途：提供 Claude Code 生成 OA 系統 `init.sql` 的初始化資料需求  
> 適用範圍：PostgreSQL / Prisma / NestJS 後端專案  
> 目標：初始化 OA 系統最基礎的組織架構資料，包含地區、公司、事業部、項目、職級  
> 注意：請 Claude Code 先檢查目前專案內實際 Prisma schema 或資料表定義，再依照實際欄位產生 SQL，不要憑空假設欄位名稱

---

# 1. 生成目標

請根據本文件產生一份資料庫初始化 SQL：

```text
init.sql
```

此 SQL 用於初始化 OA 系統最基礎的組織架構資料。

初始化資料應從組織主檔開始，優先順序如下：

```text
1. 地區 / 國家 regions
2. 公司 companies
3. 事業部 business_units
4. 項目 projects
5. 職級 job_levels
```

若目前專案已有其他必要基礎表，例如：

```text
positions
departments
roles
permissions
system_settings
```

請不要自行補大量假資料，除非 schema 有 NOT NULL 或外鍵限制導致 init.sql 無法執行。

---

# 2. 重要開發原則

產生 `init.sql` 前，請先完成以下檢查：

1. 先讀取目前專案內的 Prisma schema 或 migration SQL。
2. 確認實際資料表名稱。
3. 確認實際欄位名稱。
4. 確認哪些欄位是 NOT NULL。
5. 確認主鍵是否使用 UUID。
6. 確認是否需要 `gen_random_uuid()` 或 `uuid_generate_v4()`。
7. 確認是否已有唯一鍵限制，例如 `code`、`name`。
8. SQL 必須可重複執行，建議使用 `INSERT ... ON CONFLICT ... DO UPDATE` 或 `ON CONFLICT DO NOTHING`。
9. 不要因為初始化資料重複執行而造成錯誤。
10. 不要硬刪資料，不要使用 `TRUNCATE`，避免破壞既有環境資料。

---

# 3. UUID 產生方式

如果資料表主鍵是 UUID，請依照專案目前 PostgreSQL 設定使用對應方式。

優先檢查目前 migration 是否已啟用：

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

若使用 `pgcrypto`，UUID 可使用：

```sql
gen_random_uuid()
```

如果專案使用 `uuid-ossp`，則使用：

```sql
uuid_generate_v4()
```

請不要同時混用兩種方式。

建議 init.sql 開頭加上：

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

除非目前專案已明確使用 `uuid-ossp`。

---

# 4. 地區 / 國家初始化資料

## 4.1 地區資料

初始化三個地區：

| code | name | timezone | currency_code |
|---|---|---|---|
| JP | 日本 | Asia/Tokyo | JPY |
| TW | 台灣 | Asia/Taipei | TWD |
| UK | 英國 | Europe/London | GBP |

## 4.2 SQL 生成要求

請產生對應 `regions` 表的初始化 SQL。

若實際欄位不同，請依照 schema 調整。

預期資料概念如下：

```text
regions
├── JP / 日本
├── TW / 台灣
└── UK / 英國
```

---

# 5. 公司初始化資料

## 5.1 公司與地區關係

公司在地區 / 國家之下。

初始化公司如下：

```text
日本
└── 天元有限公司

台灣
├── 代碼科技
├── 天珤科技
└── 天棨科技

英國
└── Royce Tech
```

## 5.2 公司資料

| region_code | company_code | company_name | currency_code |
|---|---|---|---|
| JP | JP_TY | 天元有限公司 | JPY |
| TW | TW_CODE | 代碼科技 | TWD |
| TW | TW_TIANBAO | 天珤科技 | TWD |
| TW | TW_TIANQI | 天棨科技 | TWD |
| UK | UK_ROYCE | Royce Tech | GBP |

## 5.3 SQL 生成要求

請透過 `region_code` 查詢對應 `regions.id` 後，寫入 `companies.region_id`。

不要硬寫 region UUID。

建議使用 CTE 或子查詢，例如概念如下：

```sql
SELECT id FROM regions WHERE code = 'JP'
```

公司資料需可重複執行。

如果 `companies.code` 有唯一鍵，請以 `code` 作為 upsert key。

---

# 6. 事業部初始化資料

## 6.1 事業部清單

初始化以下事業部：

| code | name | description |
|---|---|---|
| BU1 | 第一事業部 | 集團第一事業部 |
| BU2 | 第二事業部 | 集團第二事業部 |
| BU3 | 第三事業部 | 集團第三事業部 |
| BU4 | 第四事業部 | 集團第四事業部 |
| RND | 研發中心 | 集團研發中心 |
| PMO | 項目管理中心 | 集團項目管理中心 |

## 6.2 SQL 生成要求

請寫入 `business_units` 表。

若有 `head_user_id` 或負責人欄位，初始資料可先為 `NULL`。

---

# 7. 項目初始化資料

## 7.1 項目與事業部關係

項目在事業部之下。

初始化規則：

```text
第一事業部
├── YL
├── LY
├── KX
└── Sport

第二事業部
└── V8

第三事業部
└── BW

第四事業部
└── VV

研發中心
└── 無項目

項目管理中心
└── 無項目
```

## 7.2 項目資料

| business_unit_code | project_code | project_name |
|---|---|---|
| BU1 | YL | YL |
| BU1 | LY | LY |
| BU1 | KX | KX |
| BU1 | SPORT | Sport |
| BU2 | V8 | V8 |
| BU3 | BW | BW |
| BU4 | VV | VV |

## 7.3 SQL 生成要求

請透過 `business_units.code` 查詢對應 `business_units.id` 後，寫入 `projects.business_unit_id`。

不要硬寫 business unit UUID。

若 `projects.code` 有唯一鍵，請以 `code` 作為 upsert key。

若 schema 中 `projects` 有 `project_owner_user_id`，初始資料可先為 `NULL`。

---

# 8. 職級初始化資料

## 8.1 職級設計

目前集團職級分成兩種：

```text
P 等：一般員工
M 等：管理崗
```

其中：

```text
一般員工：P1 ~ P16
管理崗：M1 ~ M7
```

數字越大，層級越高。

---

## 8.2 P 等職級

請初始化：

```text
P1
P2
P3
P4
P5
P6
P7
P8
P9
P10
P11
P12
P13
P14
P15
P16
```

建議資料：

| code | name | category | level_order |
|---|---|---|---|
| P1 | P1 | P | 1 |
| P2 | P2 | P | 2 |
| P3 | P3 | P | 3 |
| P4 | P4 | P | 4 |
| P5 | P5 | P | 5 |
| P6 | P6 | P | 6 |
| P7 | P7 | P | 7 |
| P8 | P8 | P | 8 |
| P9 | P9 | P | 9 |
| P10 | P10 | P | 10 |
| P11 | P11 | P | 11 |
| P12 | P12 | P | 12 |
| P13 | P13 | P | 13 |
| P14 | P14 | P | 14 |
| P15 | P15 | P | 15 |
| P16 | P16 | P | 16 |

---

## 8.3 M 等職級

請初始化：

```text
M1
M2
M3
M4
M5
M6
M7
```

建議資料：

| code | name | category | level_order |
|---|---|---|---|
| M1 | M1 | M | 101 |
| M2 | M2 | M | 102 |
| M3 | M3 | M | 103 |
| M4 | M4 | M | 104 |
| M5 | M5 | M | 105 |
| M6 | M6 | M | 106 |
| M7 | M7 | M | 107 |

## 8.4 level_order 設計說明

職級數字越大層級越高。

P 等使用：

```text
P1 = 1
P16 = 16
```

M 等使用：

```text
M1 = 101
M7 = 107
```

這樣可以讓管理崗在排序上高於一般員工。

若目前 schema 中沒有 `category` 欄位，請不要硬加，僅寫入現有欄位。

如果目前 schema 只有：

```text
code
name
level_order
description
is_active
```

則 description 可寫：

```text
一般員工職級
管理崗職級
```

---

# 9. init.sql 生成順序

請依照以下順序產生 SQL：

```text
1. PostgreSQL extension
2. regions
3. companies
4. business_units
5. projects
6. job_levels
```

原因：

1. 公司依賴地區。
2. 項目依賴事業部。
3. 職級可獨立初始化，但放在組織主檔後即可。
4. 未來員工資料會依賴地區、公司、事業部、項目、部門、職級。

---

# 10. SQL 風格要求

請生成可讀性高的 SQL。

建議風格：

1. 每個初始化區塊加註解。
2. 使用 transaction 包住整個初始化流程。
3. 使用 `ON CONFLICT` 避免重複執行錯誤。
4. 儘量使用自然 key，例如 `code`。
5. 不要硬寫 UUID。
6. 不要刪除既有資料。
7. 不要修改不相關表。
8. 若 schema 有 `created_at` / `updated_at`，請填入 `NOW()`。
9. 若 schema 有 `is_active`，請填入 `TRUE`。
10. 若有 `deleted_at` 軟刪除欄位，請保持 `NULL`。

建議結構：

```sql
BEGIN;

-- 1. Regions
-- insert regions here

-- 2. Companies
-- insert companies here

-- 3. Business Units
-- insert business units here

-- 4. Projects
-- insert projects here

-- 5. Job Levels
-- insert job levels here

COMMIT;
```

---

# 11. Upsert 規則

## 11.1 regions

若 `regions.code` 已存在：

1. 更新 `name`
2. 更新 `timezone`
3. 更新 `currency_code`
4. 更新 `is_active = TRUE`
5. 更新 `updated_at = NOW()`

---

## 11.2 companies

若 `companies.code` 已存在：

1. 更新 `region_id`
2. 更新 `name`
3. 更新 `currency_code`
4. 更新 `is_active = TRUE`
5. 更新 `updated_at = NOW()`

---

## 11.3 business_units

若 `business_units.code` 已存在：

1. 更新 `name`
2. 更新 `description`
3. 更新 `is_active = TRUE`
4. 更新 `updated_at = NOW()`

---

## 11.4 projects

若 `projects.code` 已存在：

1. 更新 `business_unit_id`
2. 更新 `name`
3. 更新 `is_active = TRUE`
4. 更新 `updated_at = NOW()`

---

## 11.5 job_levels

若 `job_levels.code` 已存在：

1. 更新 `name`
2. 更新 `level_order`
3. 更新 `description`
4. 更新 `is_active = TRUE`
5. 更新 `updated_at = NOW()`

---

# 12. 需要 Claude Code 特別注意的地方

## 12.1 不要直接照本文件假設 schema

本文件描述的是初始化需求，不代表資料表欄位已經完全一致。

Claude Code 必須先讀取實際 schema。

例如：

如果實際公司表欄位是：

```text
currency
```

而不是：

```text
currency_code
```

請依照實際 schema 生成 SQL。

---

## 12.2 不要產生員工資料

本次 init.sql 不需要產生員工帳號。

不要初始化：

```text
users
employee_profiles
employee_org_assignments
employee_cost_allocations
```

除非專案明確要求建立 Super Admin。

---

## 12.3 不要產生部門資料

本次需求尚未定義各項目底下的部門，因此不要自行建立部門。

不要自行假設：

```text
運營部門
風控部門
遊戲前端部門
```

這些會在後續文件補充。

---

## 12.4 不要產生審批流資料

本次 init.sql 只處理組織基礎主檔。

不要初始化：

```text
approval_templates
approval_template_steps
approval_instances
approval_steps
```

審批流模板會在後續文件另外定義。

---

## 12.5 不要產生權限資料

本次 init.sql 不處理角色與權限。

不要初始化：

```text
roles
permissions
role_permissions
user_roles
```

角色權限會在後續文件另外定義。

---

# 13. 驗收標準

產生的 `init.sql` 必須符合：

1. 可以在空資料庫上成功執行。
2. 可以重複執行，不會造成 unique constraint 錯誤。
3. 地區資料包含日本、台灣、英國。
4. 日本底下有天元有限公司。
5. 台灣底下有代碼科技、天珤科技、天棨科技。
6. 英國底下有 Royce Tech。
7. 事業部包含第一事業部、第二事業部、第三事業部、第四事業部、研發中心、項目管理中心。
8. 第一事業部底下有 YL、LY、KX、Sport。
9. 第二事業部底下有 V8。
10. 第三事業部底下有 BW。
11. 第四事業部底下有 VV。
12. 研發中心與項目管理中心底下不產生項目。
13. 職級包含 P1 ~ P16。
14. 職級包含 M1 ~ M7。
15. 職級排序符合數字越大層級越高。
16. SQL 不硬寫 UUID。
17. SQL 不刪除既有資料。
18. SQL 不初始化未定義的員工、部門、審批流、權限資料。

---

# 14. Claude Code 最終指令

請依照本文件產生 `init.sql`。

請先檢查目前專案的 Prisma schema / migration SQL，確認實際資料表與欄位名稱後，再生成 SQL。

生成時請遵守：

1. 使用 transaction。
2. 使用 upsert。
3. 不硬寫 UUID。
4. 不刪除資料。
5. 不初始化本文件未要求的資料。
6. 保證 SQL 可重複執行。
7. 若 schema 與本文件欄位名稱不同，請以 schema 為準。
8. 若缺少必要資料表，請在回覆中明確指出，而不是硬寫錯誤 SQL。

輸出檔案：

```text
init.sql
```
