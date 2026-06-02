# 集團 OA 系統 — 組織結構與審批規則設計需求

> 文件用途：定義集團 OA 系統中的組織結構、員工組織歸屬、成本歸屬、審批路徑與電子表單審批規則  
> 適用範圍：系統管理、員工主檔、人事假勤、電子表單、財務成本分析、審批流引擎  
> 核心目標：先定義穩定的組織結構，讓後續人事、假勤、電子表單、薪資、財務報表、審批流都能依照正確的組織邏輯運作

---

# 1. 設計背景

集團 OA 系統中的所有表單與流程，都會圍繞組織結構運作。

例如：

1. 請假單需要找到員工的主管或部門主管。
2. 補卡單需要依照員工所屬辦公室或部門走審批。
3. 加班單可能需要直屬主管、人事、財務或更高層審批。
4. 電子表單需要依不同表單類型套用不同審批線。
5. 薪資申請與審批需要依照實際發薪公司與地區處理。
6. 財務報表需要依照地區、公司、事業部、項目、部門、人員進行成本分析。
7. 有些人員的成本可能需要分攤到多個項目，例如 A 項目 50%、B 項目 50%。

因此，OA 系統必須先建立清楚、可維護、可查詢、可審批、可做財務歸屬的組織結構。

---

# 2. 組織結構核心概念

本系統的組織結構分為兩條主線：

```text
1. 集團業務組織線
2. 地區 / 公司辦公室組織線
```

兩條線都很重要，但用途不同。

---

## 2.1 集團業務組織線

集團業務組織線代表公司實際營運與管理分工。

結構如下：

```text
集團
└── 事業部
    └── 項目
        └── 部門
            └── 員工
```

範例：

```text
集團
├── 第一事業部
│   ├── YL
│   │   ├── 運營部門
│   │   ├── 風控部門
│   │   └── 產品部門
│   └── LY
│       ├── 運營部門
│       └── 客服部門
│
├── 第二事業部
│   └── KX
│       ├── 運營部門
│       └── 市場部門
│
├── 研發中心
│   ├── MP
│   │   ├── 遊戲前端部門
│   │   ├── 遊戲後端部門
│   │   ├── API 部門
│   │   └── 測試部門
│
├── 中心策
│   └── 產品企劃部門
│
└── 項目管理中心
    └── 專案管理部門
```

---

## 2.2 地區 / 公司辦公室組織線

地區 / 公司辦公室組織線代表法律實體、發薪主體、辦公室、人事與財務實際處理單位。

結構如下：

```text
地區 / 國家
└── 公司
    └── 員工
```

範例：

```text
日本區
├── 日本公司 A
└── 日本公司 B

台灣區
├── 台灣公司 A
├── 台灣公司 B
└── 台灣公司 C
```

---

## 2.3 兩條組織線的差異

| 組織線 | 用途 | 例子 |
|---|---|---|
| 集團業務組織線 | 管理事業部、項目、部門、項目負責人、部門主管、成本歸屬 | 第一事業部 / YL / 運營部門 |
| 地區 / 公司辦公室組織線 | 管理地區、公司、發薪、人事行政、當地財務、當地制度 | 日本區 / 日本公司 A |

同一位員工同時會有這兩種歸屬：

```text
員工 A
├── 地區：日本區
├── 公司：日本公司 A
├── 事業部：研發中心
├── 項目：MP
└── 部門：遊戲前端部門
```

---

# 3. 組織主檔管理

以下主檔需在系統管理中維護。

---

## 3.1 地區 / 國家管理

地區代表實際營運地區或國家，例如：

```text
台灣區
日本區
韓國區
菲律賓區
越南區
```

地區資料用於：

1. 公司歸屬
2. 薪資發放地區
3. 人事制度區分
4. 財務報表區分
5. 審批規則區分
6. 時區與幣別預設

建議欄位：

| 欄位 | 說明 |
|---|---|
| id | 地區 ID |
| code | 地區代碼，例如 TW、JP |
| name | 地區名稱 |
| timezone | 時區 |
| currencyCode | 預設幣別 |
| isActive | 是否啟用 |

---

## 3.2 公司管理

公司代表法律實體或實際發薪主體。

一個地區可以有多間公司。

範例：

```text
台灣區
├── 台灣公司 A
├── 台灣公司 B
└── 台灣公司 C

日本區
├── 日本公司 A
└── 日本公司 B
```

公司資料用於：

1. 員工所屬公司
2. 發薪主體
3. 薪資審批
4. 財務成本歸屬
5. 當地人事與財務流程
6. 表單審批路徑

建議欄位：

| 欄位 | 說明 |
|---|---|
| id | 公司 ID |
| regionId | 所屬地區 |
| code | 公司代碼 |
| name | 公司名稱 |
| legalName | 法定名稱 |
| taxId | 統編 / 稅號 |
| currencyCode | 公司預設幣別 |
| isActive | 是否啟用 |

---

## 3.3 事業部管理

事業部是集團業務組織的第一層。

範例：

```text
第一事業部
第二事業部
研發中心
中心策
項目管理中心
```

事業部資料需支援在系統管理中新增、編輯、停用。

事業部資料用於：

1. 項目歸屬
2. 員工業務歸屬
3. 財務成本分析
4. 集團組織審批
5. 報表維度

建議欄位：

| 欄位 | 說明 |
|---|---|
| id | 事業部 ID |
| code | 事業部代碼 |
| name | 事業部名稱 |
| description | 說明 |
| headUserId | 事業部負責人，選填 |
| isActive | 是否啟用 |

---

## 3.4 項目管理

項目是事業部底下的下一層組織。

項目通常以代號簡稱呈現，例如：

```text
YL
LY
KX
MP
```

每個項目需有項目負責人。

項目資料用於：

1. 員工項目歸屬
2. 項目負責人審批
3. 成本分攤
4. 財務報表
5. 採購 / 報銷 / 薪資成本歸屬

建議欄位：

| 欄位 | 說明 |
|---|---|
| id | 項目 ID |
| businessUnitId | 所屬事業部 |
| code | 項目代碼，例如 YL、LY、KX、MP |
| name | 項目名稱 |
| description | 說明 |
| projectOwnerUserId | 項目負責人 |
| isActive | 是否啟用 |

---

## 3.5 部門管理

部門是項目底下的組織單位。

範例：

```text
運營部門
風控部門
遊戲前端部門
遊戲後端部門
API 部門
後台部門
測試部門
產品企劃部門
美術部門
專案管理部門
```

每個部門需有部門主管。

部門資料用於：

1. 員工部門歸屬
2. 部門主管審批
3. 部門成本分析
4. 出勤與假勤管理
5. 部門報表

建議欄位：

| 欄位 | 說明 |
|---|---|
| id | 部門 ID |
| projectId | 所屬項目 |
| code | 部門代碼 |
| name | 部門名稱 |
| managerUserId | 部門主管 |
| parentDepartmentId | 上層部門，選填 |
| isActive | 是否啟用 |

---

# 4. 項目負責人與部門主管設計

## 4.1 一人可擔任多個項目負責人

集團實際情況中，一個員工可能同時擔任多個項目負責人。

例如：

```text
員工 A
├── YL 項目負責人
├── LY 項目負責人
└── KX 項目負責人
```

因此項目負責人不應只存在員工資料的一個欄位中。

建議使用關聯表記錄。

---

## 4.2 一人可擔任多個部門主管

一個員工也可能同時管理多個部門。

例如：

```text
員工 B
├── 遊戲前端部門主管
├── 遊戲後端部門主管
└── API 部門主管
```

因此部門主管也需支援多對多關係。

---

## 4.3 建議設計：組織負責人關聯表

建議建立共用的組織負責人表。

```text
organization_leaders
```

用途：

1. 記錄項目負責人
2. 記錄部門主管
3. 記錄代理負責人
4. 支援同一員工負責多個項目或部門
5. 支援同一項目或部門存在多個負責人，若未來需要

建議欄位：

| 欄位 | 說明 |
|---|---|
| id | ID |
| orgType | 組織類型：business_unit / project / department |
| orgId | 組織 ID |
| userId | 負責人員 |
| leaderType | 負責人類型：owner / manager / deputy |
| startedAt | 開始日期 |
| endedAt | 結束日期 |
| isPrimary | 是否主要負責人 |
| isActive | 是否啟用 |

---

# 5. 員工組織歸屬

## 5.1 員工需同時標記兩類歸屬

每位員工都需要標記：

```text
1. 地區 / 公司歸屬
2. 事業部 / 項目 / 部門歸屬
```

因為這兩組資料會用於不同場景。

---

## 5.2 員工主要歸屬

每位員工至少需有一筆主要組織歸屬。

主要組織歸屬包含：

| 欄位 | 說明 |
|---|---|
| regionId | 地區 |
| companyId | 公司 |
| businessUnitId | 事業部 |
| projectId | 項目 |
| departmentId | 部門 |
| directManagerUserId | 直屬主管 |
| positionId | 職位 |
| jobLevelId | 職級 |
| isPrimary | 是否主要歸屬 |

範例：

```text
員工 C
├── 地區：日本區
├── 公司：日本公司 A
├── 事業部：研發中心
├── 項目：MP
├── 部門：遊戲前端部門
└── 直屬主管：員工 B
```

---

## 5.3 員工可有多筆組織歸屬

一個員工可能同時支援多個項目或部門。

因此系統需支援多筆組織歸屬。

例如：

```text
員工 D
├── 主要歸屬：研發中心 / MP / 遊戲前端部門
└── 兼任歸屬：第一事業部 / YL / 遊戲前端支援
```

---

## 5.4 建議設計：員工組織歸屬表

```text
employee_org_assignments
```

建議欄位：

| 欄位 | 說明 |
|---|---|
| id | ID |
| userId | 員工 |
| regionId | 地區 |
| companyId | 公司 |
| businessUnitId | 事業部 |
| projectId | 項目 |
| departmentId | 部門 |
| directManagerUserId | 直屬主管 |
| positionId | 職位 |
| jobLevelId | 職級 |
| assignmentType | primary / secondary / temporary |
| startedAt | 開始日期 |
| endedAt | 結束日期 |
| isPrimary | 是否主要歸屬 |
| isActive | 是否啟用 |

---

# 6. 員工成本歸屬與分攤

## 6.1 設計背景

員工薪資成本不一定 100% 歸屬於單一項目。

可能存在以下情況：

```text
員工 E
├── A 項目：50%
└── B 項目：50%
```

或：

```text
員工 F
├── 研發中心 / MP：70%
└── 第一事業部 / YL：30%
```

因此系統需要支援薪資成本分攤。

---

## 6.2 成本分攤用途

成本分攤資料用於：

1. 薪資成本分析
2. 財務報表
3. 項目成本明細
4. 事業部成本明細
5. 公司成本明細
6. 地區成本明細

---

## 6.3 成本分攤規則

每位員工可設定多筆成本分攤。

規則：

1. 同一期間內，分攤比例加總必須等於 100%。
2. 每筆分攤需指定地區、公司、事業部、項目、部門。
3. 分攤比例可依日期區間生效。
4. 若未設定成本分攤，預設 100% 歸屬於主要組織歸屬。
5. 成本分攤需保留歷史紀錄，不能覆蓋舊資料。
6. 薪資計算完成後，該期成本分攤快照需固定，後續異動不應影響已結算月份。

---

## 6.4 建議設計：員工成本分攤表

```text
employee_cost_allocations
```

建議欄位：

| 欄位 | 說明 |
|---|---|
| id | ID |
| userId | 員工 |
| regionId | 地區 |
| companyId | 公司 |
| businessUnitId | 事業部 |
| projectId | 項目 |
| departmentId | 部門 |
| allocationPercent | 分攤比例 |
| startedAt | 開始日期 |
| endedAt | 結束日期 |
| isActive | 是否啟用 |

---

## 6.5 薪資成本分攤快照

每次薪資期別確認後，需產生該期薪資成本分攤快照。

建議設計：

```text
payroll_cost_allocation_snapshots
```

建議欄位：

| 欄位 | 說明 |
|---|---|
| id | ID |
| payrollPeriodId | 薪資期別 |
| payrollRecordId | 薪資紀錄 |
| userId | 員工 |
| regionId | 地區 |
| companyId | 公司 |
| businessUnitId | 事業部 |
| projectId | 項目 |
| departmentId | 部門 |
| allocationPercent | 分攤比例 |
| allocatedAmount | 分攤金額 |
| currencyCode | 幣別 |

---

# 7. 審批路徑：辦公室組織 vs 集團組織

## 7.1 設計背景

不同類型的電子表單，審批路徑可能不同。

有些表單應依照辦公室組織走審批。

例如：

```text
日本研發中心人員的薪資申請
→ 日本單位 HR 發起
→ 日本公司財務審核
→ 日本公司主管或負責人審批
```

有些表單應依照集團業務組織走審批。

例如：

```text
項目成本相關申請
→ 項目負責人審批
→ 事業部負責人審批
→ 集團高層審批
```

因此審批流不能只綁定單一組織路徑。

---

## 7.2 審批路徑類型

每個電子表單需可設定使用哪種審批路徑。

建議支援：

| 審批路徑類型 | 說明 |
|---|---|
| office_org | 依地區 / 公司 / 辦公室組織 |
| group_org | 依事業部 / 項目 / 部門的集團業務組織 |
| mixed | 混合模式，依節點指定不同組織來源 |
| custom | 自訂指定審批人或角色 |

---

## 7.3 office_org：辦公室組織審批

適用於：

1. 薪資申請
2. 當地人事流程
3. 當地財務流程
4. 當地行政流程
5. 需要由地區 / 公司處理的事項

範例：

```text
申請人
→ 直屬主管
→ 公司 HR
→ 公司財務
→ 公司負責人
```

組織資料來源：

```text
employee_org_assignments.regionId
employee_org_assignments.companyId
```

---

## 7.4 group_org：集團業務組織審批

適用於：

1. 項目成本
2. 項目資源申請
3. 跨公司項目協作
4. 項目預算
5. 集團層級決策

範例：

```text
申請人
→ 部門主管
→ 項目負責人
→ 事業部負責人
→ 集團高層
```

組織資料來源：

```text
employee_org_assignments.businessUnitId
employee_org_assignments.projectId
employee_org_assignments.departmentId
```

---

## 7.5 mixed：混合審批

混合審批表示同一張表單中，不同節點可能依不同組織來源找人。

範例：

```text
申請人
→ 部門主管，依 group_org
→ 公司 HR，依 office_org
→ 公司財務，依 office_org
→ 事業部負責人，依 group_org
```

適用於：

1. 跨公司的人事異動
2. 薪資成本分攤申請
3. 項目人力需求
4. 需要同時經過業務組織與當地公司審批的單據

---

# 8. 電子表單與審批設定

## 8.1 每種表單需綁定審批設定

每種電子表單都需能設定：

1. 表單類型
2. 適用地區
3. 適用公司
4. 適用事業部
5. 適用項目
6. 適用部門
7. 審批路徑類型
8. 審批模板
9. 特殊規則

---

## 8.2 表單類型範例

```text
leave_request             請假申請
overtime_request          加班申請
clock_patch_request       補卡申請
leave_without_pay         留職停薪申請
resignation_request       離職申請
meal_allowance_request    誤餐費申請
it_request                資訊需求申請
oa_asset_request          OA 資產申請
manpower_request          人力需求表單
purchase_request          採購申請
reimbursement_request     費用報銷
payroll_request           薪資申請
```

---

## 8.3 審批模板匹配規則

當表單送出時，系統需根據以下條件匹配審批模板：

1. formType
2. approvalRouteType
3. regionId
4. companyId
5. businessUnitId
6. projectId
7. departmentId
8. amount
9. priority
10. isActive

若有多個模板符合，依 priority 由小到大選擇最優先模板。

---

## 8.4 特殊審批規則

不同表單可能有不同特殊規則。

例如：

### 金額門檻規則

```text
金額 <= 10,000
→ 部門主管即可

10,000 < 金額 <= 100,000
→ 部門主管 + 項目負責人

金額 > 100,000
→ 部門主管 + 項目負責人 + 事業部負責人 + 集團高層
```

### 假勤規則

```text
請假天數 <= 1 天
→ 直屬主管

請假天數 > 1 天
→ 直屬主管 + 部門主管

特殊假別
→ HR 加入審批
```

### 薪資規則

```text
一般薪資發放
→ 當地 HR 發起
→ 當地財務審核
→ 當地公司主管確認

薪資異動
→ 當地 HR
→ 部門主管
→ 事業部負責人
→ 集團人事主管
```

### 人力需求規則

```text
一般人力需求
→ 部門主管
→ 項目負責人
→ 事業部負責人

跨公司人力需求
→ 部門主管
→ 項目負責人
→ 當地 HR
→ 事業部負責人
```

---

# 9. 審批節點人員解析規則

## 9.1 節點人員不可全部寫死

審批模板不應只保存固定使用者 ID。

原因：

1. 部門主管會異動。
2. 項目負責人會異動。
3. 公司 HR 或財務人員可能調整。
4. 不同地區公司有不同審批人。
5. 已送出的審批流程需要固定快照，但新送出的單應使用最新設定。

---

## 9.2 節點人員解析方式

審批節點可支援以下解析方式：

| approverType | 說明 |
|---|---|
| applicant_direct_manager | 申請人直屬主管 |
| department_manager | 部門主管 |
| project_owner | 項目負責人 |
| business_unit_head | 事業部負責人 |
| company_hr | 公司 HR |
| company_finance | 公司財務 |
| company_head | 公司負責人 |
| role | 指定角色 |
| user | 指定人 |
| dynamic | 依規則動態解析 |
| form_field_user | 從表單欄位取得指定人 |

---

## 9.3 審批實例需保存快照

當表單送出並產生審批流程時，系統需將當下解析出的審批人寫入審批實例。

原因：

1. 已送出的單據不應受後續組織異動影響。
2. 部門主管異動不應改變已送出單據的審批人。
3. 項目負責人異動不應改變歷史流程。
4. 方便稽核與追蹤。

---

# 10. 建議資料表

以下為資料表設計方向，實際欄位可依 Prisma schema 命名規範調整。

---

## 10.1 business_units：事業部

```sql
CREATE TABLE business_units (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    head_user_id UUID REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 10.2 projects：項目

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    business_unit_id UUID NOT NULL REFERENCES business_units(id),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    project_owner_user_id UUID REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

> 備註：若需支援多個項目負責人，建議不要只依賴 `project_owner_user_id`，而是使用 `organization_leaders`。

---

## 10.3 departments：部門

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    parent_department_id UUID REFERENCES departments(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    manager_user_id UUID REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

> 備註：若需支援多個部門主管，建議不要只依賴 `manager_user_id`，而是使用 `organization_leaders`。

---

## 10.4 organization_leaders：組織負責人

```sql
CREATE TABLE organization_leaders (
    id UUID PRIMARY KEY,

    org_type VARCHAR(50) NOT NULL,
    -- business_unit / project / department

    org_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),

    leader_type VARCHAR(50) NOT NULL,
    -- head / owner / manager / deputy

    is_primary BOOLEAN NOT NULL DEFAULT TRUE,

    started_at DATE,
    ended_at DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 10.5 employee_org_assignments：員工組織歸屬

```sql
CREATE TABLE employee_org_assignments (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL REFERENCES users(id),

    region_id UUID REFERENCES regions(id),
    company_id UUID REFERENCES companies(id),

    business_unit_id UUID REFERENCES business_units(id),
    project_id UUID REFERENCES projects(id),
    department_id UUID REFERENCES departments(id),

    direct_manager_user_id UUID REFERENCES users(id),
    position_id UUID REFERENCES positions(id),
    job_level_id UUID REFERENCES job_levels(id),

    assignment_type VARCHAR(50) NOT NULL DEFAULT 'primary',
    -- primary / secondary / temporary

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    started_at DATE,
    ended_at DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 10.6 employee_cost_allocations：員工成本分攤

```sql
CREATE TABLE employee_cost_allocations (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL REFERENCES users(id),

    region_id UUID REFERENCES regions(id),
    company_id UUID REFERENCES companies(id),

    business_unit_id UUID REFERENCES business_units(id),
    project_id UUID REFERENCES projects(id),
    department_id UUID REFERENCES departments(id),

    allocation_percent NUMERIC(5, 2) NOT NULL,

    started_at DATE NOT NULL,
    ended_at DATE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 10.7 approval_templates：審批模板

```sql
CREATE TABLE approval_templates (
    id UUID PRIMARY KEY,

    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,

    form_type VARCHAR(100) NOT NULL,

    approval_route_type VARCHAR(50) NOT NULL,
    -- office_org / group_org / mixed / custom

    region_id UUID REFERENCES regions(id),
    company_id UUID REFERENCES companies(id),
    business_unit_id UUID REFERENCES business_units(id),
    project_id UUID REFERENCES projects(id),
    department_id UUID REFERENCES departments(id),

    min_amount NUMERIC(18, 2),
    max_amount NUMERIC(18, 2),
    currency_code VARCHAR(10),

    priority INT NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 10.8 approval_template_steps：審批模板節點

```sql
CREATE TABLE approval_template_steps (
    id UUID PRIMARY KEY,

    approval_template_id UUID NOT NULL REFERENCES approval_templates(id),

    step_order INT NOT NULL,
    step_name VARCHAR(150) NOT NULL,

    approver_type VARCHAR(100) NOT NULL,
    -- applicant_direct_manager / department_manager / project_owner
    -- business_unit_head / company_hr / company_finance
    -- company_head / role / user / dynamic / form_field_user

    approval_mode VARCHAR(30) NOT NULL DEFAULT 'all',
    -- all / any / majority

    is_required BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(approval_template_id, step_order)
);
```

---

# 11. 系統管理功能需求

## 11.1 組織主檔管理

系統管理需提供以下功能：

```text
組織主檔
├── 地區管理
├── 公司管理
├── 事業部管理
├── 項目管理
├── 部門管理
├── 職位管理
└── 職級管理
```

---

## 11.2 組織負責人管理

需提供：

1. 設定事業部負責人
2. 設定項目負責人
3. 設定部門主管
4. 設定代理負責人
5. 查詢負責人歷史紀錄
6. 停用負責人關係

---

## 11.3 員工組織歸屬管理

需提供：

1. 設定員工主要公司
2. 設定員工主要地區
3. 設定員工主要事業部
4. 設定員工主要項目
5. 設定員工主要部門
6. 設定直屬主管
7. 設定兼任組織
8. 查詢員工歷史組織異動

---

## 11.4 員工成本分攤管理

需提供：

1. 設定員工成本分攤
2. 支援多筆成本歸屬
3. 支援生效日期與失效日期
4. 檢查同一期間比例是否等於 100%
5. 查詢成本分攤歷史
6. 薪資計算時產生成本分攤快照

---

# 12. 驗證規則

## 12.1 員工主要歸屬驗證

每位正式員工必須有一筆主要組織歸屬。

主要組織歸屬需包含：

1. regionId
2. companyId
3. businessUnitId
4. projectId
5. departmentId
6. directManagerUserId

若資料不完整，系統需提示 HR 或系統管理員補齊。

---

## 12.2 成本分攤比例驗證

同一員工在同一期間的成本分攤比例總和必須等於 100%。

錯誤範例：

```text
A 項目：50%
B 項目：30%
總計：80%
```

系統需阻止儲存。

正確範例：

```text
A 項目：50%
B 項目：50%
總計：100%
```

---

## 12.3 組織負責人驗證

送出審批前，系統需確認必要負責人是否存在。

例如：

1. 表單需要部門主管，但該部門未設定主管。
2. 表單需要項目負責人，但該項目未設定負責人。
3. 表單需要事業部負責人，但該事業部未設定負責人。
4. 表單需要公司 HR，但公司未設定 HR 角色人員。
5. 表單需要公司財務，但公司未設定財務角色人員。

若審批人解析失敗，表單不可送出，需提示缺少哪個組織負責人設定。

---

# 13. 審批流程產生規則

## 13.1 表單送出流程

當使用者送出電子表單時，系統應執行：

```text
1. 讀取表單類型 formType
2. 讀取表單金額 amount，若有
3. 讀取表單所屬組織資料
4. 判斷表單應使用 office_org / group_org / mixed / custom
5. 匹配 approval_templates
6. 解析 approval_template_steps
7. 根據每個 step 的 approverType 找出實際審批人
8. 產生 approval_instance
9. 產生 approval_steps
10. 產生 approval_step_approvers
11. 寫入審批快照
12. 發送通知給第一關審批人
```

---

## 13.2 審批人解析失敗

若任一必要節點找不到審批人，系統需：

1. 阻止表單送出
2. 顯示錯誤訊息
3. 指出缺少哪一類審批人
4. 提示使用者聯繫 HR 或系統管理員

錯誤訊息範例：

```text
此表單需要項目負責人審批，但目前項目 YL 尚未設定項目負責人，請聯繫系統管理員。
```

---

# 14. 財務報表維度

組織結構資料需支援財報查詢。

財務報表至少需支援以下維度：

```text
地區
公司
事業部
項目
部門
員工
表單類型
費用類型
月份
幣別
```

薪資成本、採購成本、報銷成本，都需能依上述維度彙整。

---

# 15. 權限設計

## 15.1 組織主檔權限

```text
system.org.region.view
system.org.region.manage

system.org.company.view
system.org.company.manage

system.org.business_unit.view
system.org.business_unit.manage

system.org.project.view
system.org.project.manage

system.org.department.view
system.org.department.manage

system.org.leader.view
system.org.leader.manage
```

---

## 15.2 員工組織歸屬權限

```text
hr.employee_org_assignment.view
hr.employee_org_assignment.manage
hr.employee_org_assignment.history_view
```

---

## 15.3 成本分攤權限

```text
hr.employee_cost_allocation.view
hr.employee_cost_allocation.manage
hr.employee_cost_allocation.history_view

finance.employee_cost_allocation.view
finance.employee_cost_allocation.report_view
```

---

## 15.4 審批模板權限

```text
system.workflow.template.view
system.workflow.template.create
system.workflow.template.update
system.workflow.template.delete
system.workflow.template.activate
```

---

# 16. 開發優先級建議

## Phase 1：組織主檔

1. 地區管理
2. 公司管理
3. 事業部管理
4. 項目管理
5. 部門管理
6. 組織負責人管理

---

## Phase 2：員工歸屬

1. 員工主要組織歸屬
2. 員工兼任組織歸屬
3. 直屬主管設定
4. 歷史組織異動紀錄

---

## Phase 3：審批路徑

1. 審批路徑類型
2. 審批模板匹配
3. 審批節點人員解析
4. 審批實例快照

---

## Phase 4：成本分攤

1. 員工成本分攤設定
2. 成本比例驗證
3. 薪資成本分攤快照
4. 財報維度查詢

---

## Phase 5：電子表單規則

1. 表單類型綁定審批路徑
2. 金額門檻審批規則
3. 假勤特殊審批規則
4. 混合審批路徑

---

# 17. Claude Code 開發指示

請依照本文件設計集團 OA 系統的組織結構與審批規則。

開發時請注意：

1. 集團業務組織線為：事業部 → 項目 → 部門 → 員工。
2. 地區 / 公司辦公室組織線為：地區 → 公司 → 員工。
3. 員工必須同時具備地區、公司、事業部、項目、部門等歸屬資料。
4. 一個員工可以擔任多個項目負責人。
5. 一個員工可以擔任多個部門主管。
6. 項目負責人與部門主管需使用關聯表設計，不要只使用單一欄位限制。
7. 員工薪資成本需支援多項目分攤，例如 A 項目 50%、B 項目 50%。
8. 成本分攤比例同一期間必須加總 100%。
9. 薪資計算後需保存成本分攤快照，不可受後續組織異動影響。
10. 電子表單需能設定使用 office_org、group_org、mixed、custom 等不同審批路徑。
11. 不同電子表單需能套用不同審批模板。
12. 金額門檻、請假天數、特殊假別等規則需能影響審批節點。
13. 審批節點審批人需支援動態解析，例如直屬主管、部門主管、項目負責人、公司 HR、公司財務、事業部負責人。
14. 表單送出時需產生審批實例快照，避免後續組織異動影響歷史單據。
15. 若審批人解析失敗，表單不可送出，需明確提示缺少哪一類設定。
16. 保留既有技術棧、資料庫設計方向、共用審批流與權限模型，不要重寫整套系統架構。

---

# 18. 最終結論

本系統的組織設計需同時支援：

```text
集團業務管理
地區公司管理
人事假勤審批
電子表單審批
薪資成本分攤
財務報表分析
```

核心設計可以整理為：

```text
地區 / 公司：處理辦公室、發薪、人事、當地財務流程
事業部 / 項目 / 部門：處理集團業務組織、項目負責、部門管理、成本歸屬
員工組織歸屬：連接兩條組織線
成本分攤：支援同一員工多項目成本分配
審批路徑：依表單類型選擇 office_org、group_org、mixed 或 custom
審批模板：依地區、公司、事業部、項目、部門、金額、優先級匹配
審批快照：送出後固定當下審批人與流程，確保歷史資料可追蹤
```

只有先把這些組織主檔與歸屬關係定義清楚，後續人事、財務、行政、電子表單與審批流才不會混亂。
