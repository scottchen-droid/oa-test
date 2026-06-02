# 系統管理員模塊 (System Module) — 功能規格

## 模塊概述

系統管理員模塊提供整個 OA 系統的基礎設定，包含帳號管理、角色與權限設定、組織架構維護、審批流程設定及系統稽核。此模塊僅對具備 `module.system.access` 權限的使用者開放，預設由 `ADMIN` 角色持有。

**Route 前綴：** `/system`
**權限碼：** `module.system.access`
**可見對象：** 具備 `ADMIN` 角色或被指派 `module.system.access` 權限的使用者

---

## 路由結構

```
/system/users                帳號管理
/system/roles                角色與權限
/system/permissions          權限項目管理
/system/user-roles           使用者角色指派
/system/org/regions          地區管理
/system/org/companies        公司管理
/system/org/departments      部門管理
/system/org/business-units   業務單位管理
/system/org/projects         項目管理
/system/org/positions        職位管理
/system/org/job-levels       職級管理
/system/workflows            審批流設定
/system/audit-logs           系統稽核日誌
/system/module-settings      模塊設定
/system/notifications        通知設定
/system/settings             系統設定
```

---

## 一、帳號管理 `/system/users`

### 功能概述
管理所有使用者帳號（登入帳號），包含建立、停用、重設密碼、查看登入狀態。

### 帳號列表
**篩選：** 帳號狀態（啟用/停用/鎖定）、帳號狀態、有無員工資料
**欄位：** 工號（帳號）、顯示名稱、Email、帳號狀態、角色清單、最後登入時間、建立時間

**備注：** 帳號（`account`）等於員工工號，格式為純數字（如 `100001`）。

### 操作
- 新增帳號（通常由 HR 員工管理建立）
- 停用/啟用帳號
- 解鎖帳號（登入失敗次數超限後鎖定）
- 重設密碼（生成臨時密碼，首次登入強制變更）
- 指派/撤除角色

### 帳號與員工的關聯
```
users.id ──── employee_profiles.userId ──── 1:1
```
帳號建立後可在 HR > 員工管理 中關聯員工個人資料。

### API
```
GET    /api/users?status=&isSuperAdmin=&page=1
GET    /api/users/:id
POST   /api/users             { account, displayName, email, password? }
PUT    /api/users/:id         { displayName, email, status }
PUT    /api/users/:id/toggle-super-admin
PUT    /api/users/:id/reset-password
PUT    /api/users/:id/unlock
DELETE /api/users/:id
```

---

## 二、角色與權限 `/system/roles`

### 功能概述
定義角色（Role），將系統功能權限（Permission）組合進角色，再將角色指派給使用者。

### 2.1 角色管理

**角色列表**
**欄位：** 角色名稱、描述、權限數量、指派人數、建立時間

**角色範例**
| 角色代碼 | 名稱 | 說明 |
|---------|------|------|
| `HR_ADMIN` | 人事管理員 | 可存取人事模塊全部功能 |
| `HR_VIEWER` | 人事唯讀 | 只能查看人事資料 |
| `FINANCE_ADMIN` | 財務管理員 | 可存取財務模塊全部功能 |
| `FINANCE_REVIEWER` | 財務審核員 | 可審核報銷和採購申請 |
| `ADMIN_STAFF` | 行政人員 | 可存取行政模塊全部功能 |
| `MANAGER` | 主管 | 可審核所屬部門員工申請 |

**角色詳情頁**
- 角色基本資訊
- 已勾選的權限項目（依模塊分組顯示）
- 已指派此角色的使用者列表

### 2.2 權限項目管理 `/system/permissions`

權限採用點分階層命名：`{模塊}.{資源}.{操作}`

**權限碼範例**
```
# 模塊入口
module.hr.access
module.finance.access
module.administration.access
module.system.access

# 首頁個人功能
module.home.access
home.personal.notification.view
home.personal.payslip.view_self
home.attendance.record.view_self
home.attendance.leave.apply
home.attendance.overtime.apply
home.attendance.exception.apply
home.forms.purchase.create
home.forms.reimbursement.create

# 主管功能
module.home_manager.access
home.manager.leave.approve
home.manager.clock_patch.approve
home.manager.overtime.approve
home.manager.form.approve

# 人事模塊
hr.employee.view
hr.employee.create
hr.employee.edit
hr.employee.delete
hr.attendance.view_all
hr.attendance.edit
hr.leave.manage
hr.payroll.manage
hr.performance.manage

# 財務模塊
finance.purchase.view_all
finance.purchase.manage
finance.reimbursement.review
finance.payment.confirm
finance.report.view

# 行政模塊
administration.announcement.manage
administration.asset.manage
administration.visitor.manage
administration.meeting_room.manage

# 系統模塊
system.user.manage
system.role.manage
system.org.manage
system.workflow.manage
system.audit_log.view
```

**API**
```
GET    /api/roles?page=1
GET    /api/roles/:id
POST   /api/roles         { name, code, description }
PUT    /api/roles/:id
DELETE /api/roles/:id
GET    /api/roles/:id/permissions
PUT    /api/roles/:id/permissions  { permissionIds[] }
GET    /api/permissions?module=
```

### 2.3 使用者角色指派 `/system/user-roles`

將角色指派給使用者，支援 Scope 設定（全域/地區/公司/部門）。

**欄位：** 使用者、角色、Scope 類型、Scope 對象、指派日期

**Scope 說明**
```
global      → 全集團有效
region      → 僅限指定地區
company     → 僅限指定公司
department  → 僅限指定部門
```

例如：將「財務審核員」角色 Scope=company 指派給某人，此人只能審核所在公司的財務單據。

**API**
```
GET    /api/user-roles?userId=&roleId=
POST   /api/user-roles   { userId, roleId, scopeType, scopeId? }
DELETE /api/user-roles/:id
```

---

## 三、組織架構

> 組織架構是整個 OA 系統的基礎，必須先建立才能進行員工管理和流程審批。

### 雙組織線設計

OA 系統同時維護兩條組織線，兩者皆重要但用途不同：

| 組織線 | 層級 | 用途 |
|--------|------|------|
| **地區 / 公司辦公室線** | 地區 → 公司 → 員工 | 發薪主體、人事行政、當地財務流程、審批路徑（`office_org`） |
| **集團業務線** | 事業部 → 項目 → 部門 → 員工 | 業務管理、項目負責、成本歸屬、集團審批路徑（`group_org`） |

同一員工同時具備兩種歸屬，記錄在 `user_org_assignments`。

> 建立順序：地區 → 公司 → 事業部 → 項目 → 部門 → 職位 + 職級 → 員工 → 組織配置 → 組織負責人

### 3.1 地區管理 `/system/org/regions`
**資料表：** `regions`
**欄位：** 地區名稱（中/英）、地區代碼（如 TW / JP）、幣別、時區、狀態

**API**
```
GET    /api/regions
POST   /api/regions    { name, code, currency, timezone }
PUT    /api/regions/:id
DELETE /api/regions/:id
```

### 3.2 公司管理 `/system/org/companies`
**資料表：** `companies`
**欄位：** 公司全名、公司代碼、所屬地區、法人統編、幣別（覆蓋地區預設）、狀態

**API**
```
GET    /api/companies?regionId=
POST   /api/companies   { name, code, regionId, taxId, currencyCode? }
PUT    /api/companies/:id
DELETE /api/companies/:id
```

### 3.3 事業部管理 `/system/org/business-units`
**資料表：** `business_units`
**欄位：** 事業部名稱、代碼、描述、**事業部負責人**（`headUserId`，選填）、狀態

> 若需多位負責人，使用 `organization_leaders`（`orgType=business_unit`，`leaderType=head`）。

**API**
```
GET    /api/business-units
POST   /api/business-units   { name, code, description?, headUserId? }
PUT    /api/business-units/:id
DELETE /api/business-units/:id
```

### 3.4 項目管理 `/system/org/projects`
**資料表：** `projects`
**欄位：** 項目名稱、代碼（如 YL / LY / MP）、所屬事業部、**項目負責人**（`projectOwnerUserId`，選填）、開始/結束日期、狀態

> 若需多位負責人，使用 `organization_leaders`（`orgType=project`，`leaderType=owner`）。

**API**
```
GET    /api/projects?businessUnitId=&status=
POST   /api/projects   { name, code, businessUnitId?, projectOwnerUserId?, startDate, endDate? }
PUT    /api/projects/:id
DELETE /api/projects/:id
```

### 3.5 部門管理 `/system/org/departments`
**資料表：** `departments`

**雙組織線欄位：**
- `companyId`（選填）：辦公室組織線，部門屬於某公司
- `projectId`（選填）：集團業務線，部門屬於某項目（如 MP/遊戲前端部門）
- `managerUserId`（選填）：部門主管（單一；多主管用 `organization_leaders`）
- `parentDepartmentId`（選填）：父部門（支援多層樹狀）

> 每個部門至少需要 `companyId` 或 `projectId` 其中一個。兩個都有時代表該部門同時對應兩條組織線。

支援樹狀結構，可顯示部門層級。

**API**
```
GET    /api/departments?companyId=&projectId=
GET    /api/departments/tree?companyId=&projectId=
POST   /api/departments   { name, code, companyId?, projectId?, parentId?, managerUserId? }
PUT    /api/departments/:id
DELETE /api/departments/:id
```

### 3.6 組織負責人管理 `/system/org/leaders`
**資料表：** `organization_leaders`

支援一人同時擔任多個項目/部門負責人，並記錄歷史。

**欄位：** orgType（business_unit / project / department）、orgId、userId、leaderType（head / owner / manager / deputy）、isPrimary、生效/失效日期

**leaderType 說明：**
| leaderType | 對應 | 用於審批節點解析 |
|------------|------|------------------|
| `head` | 事業部負責人 | `approverType=business_unit_head` |
| `owner` | 項目負責人 | `approverType=project_owner` |
| `manager` | 部門主管 | `approverType=department_manager` |
| `deputy` | 代理負責人 | 暫代上述任一角色 |

**API**
```
GET    /api/org-leaders?orgType=&orgId=
GET    /api/org-leaders?userId=         (查詢某人的所有負責人角色)
POST   /api/org-leaders   { orgType, orgId, userId, leaderType, isPrimary, startedAt, endedAt? }
PUT    /api/org-leaders/:id
DELETE /api/org-leaders/:id             (軟停用 isActive=false)
```

### 3.7 職位管理 `/system/org/positions`
**資料表：** `positions`
**欄位：** 職位名稱（中/英）、職位代碼、所屬公司（可共用）、職位類別（管理/技術/行政等）

**API**
```
GET    /api/positions?companyId=
POST   /api/positions   { name, code, companyId?, category }
PUT    /api/positions/:id
DELETE /api/positions/:id
```

### 3.7 職級管理 `/system/org/job-levels`
**資料表：** `job_levels`
**欄位：** 職級名稱（中/英）、職級代碼、職級等級（數字，越大越高）、說明

例：L1（基層）→ L2 → L3（主任）→ L4（經理）→ L5（總監）→ L6（副總）→ L7（執行長）

**API**
```
GET    /api/job-levels
POST   /api/job-levels   { name, code, level, description? }
PUT    /api/job-levels/:id
DELETE /api/job-levels/:id
```

---

## 四、審批流設定 `/system/workflows`

### 功能概述
設定各類表單的審批流程模板，支援依組織結構動態解析審批人。

### 審批路徑類型（`approvalRouteType`）

| 類型 | 說明 | 適用場景 |
|------|------|----------|
| `office_org` | 依地區/公司辦公室組織線 | 薪資申請、當地人事/財務/行政流程 |
| `group_org` | 依事業部/項目/部門集團業務線 | 項目成本、資源申請、跨公司項目協作 |
| `mixed` | 混合模式，各節點可指定不同組織來源 | 跨公司人事異動、薪資成本分攤申請 |
| `custom` | 自訂固定審批人或角色（預設） | 簡單流程或特殊需求 |

### 審批模板屬性
- 表單類型（`formType`）：leave / overtime / clock_patch / purchase_request / reimbursement / oa_asset_request / meal_allowance / it_request / headcount_request / resignation / business_trip / payroll_request
- 審批路徑類型（`approvalRouteType`）
- 適用範圍：地區 / 公司 / 事業部 / **項目** / 部門（全部可選，null = 全域）
- 金額門檻（`minAmount` / `maxAmount`，財務表單用）
- 優先序（`priority`，數字越小越優先，多個模板匹配時取最小值）

### 審批節點審批人類型（`approverType`）

| approverType | 解析來源 | 說明 |
|---|---|---|
| `applicant_direct_manager` | `user_org_assignments.directManagerUserId` | 申請人直屬主管 |
| `department_manager` | `organization_leaders`（leaderType=manager） | 部門主管 |
| `project_owner` | `organization_leaders`（leaderType=owner） | 項目負責人 |
| `business_unit_head` | `organization_leaders`（leaderType=head） | 事業部負責人 |
| `company_hr` | `user_roles`（roleCode=HR_ADMIN，scopeId=companyId） | 公司 HR |
| `company_finance` | `user_roles`（roleCode=FINANCE_ADMIN，scopeId=companyId） | 公司財務 |
| `company_head` | `user_roles`（roleCode=COMPANY_HEAD，scopeId=companyId） | 公司負責人 |
| `role` | `approverRoleCode` | 指定角色（任一持有人） |
| `user` | `approverUserId` | 指定固定人員 |
| `dynamic` | 業務規則腳本 | 依額外規則動態解析 |
| `form_field_user` | 表單欄位 | 從表單內容指定欄位取得 userId |

> **解析失敗規則**：送出前若必要節點找不到審批人（如部門未設主管、項目未設負責人），系統阻止送出並提示缺少哪類設定。

### 審批流範例

**請假申請（group_org）**
```
Step 1: applicant_direct_manager（直屬主管）— any
Step 2: company_hr（公司 HR）             — any（請假 > 3 天時加入）
```

**採購申請（group_org，金額 > 10萬）**
```
Step 1: applicant_direct_manager — any
Step 2: department_manager       — any
Step 3: project_owner            — any
Step 4: business_unit_head       — any
Step 5: company_finance          — any
```

**薪資申請（mixed）**
```
Step 1: company_hr      (office_org) — any
Step 2: company_finance (office_org) — any
Step 3: business_unit_head (group_org) — any
```

### API
```
GET    /api/approval-templates?formType=
GET    /api/approval-templates/:id
POST   /api/approval-templates
PUT    /api/approval-templates/:id
DELETE /api/approval-templates/:id
PUT    /api/approval-templates/:id/steps  { steps[] }
POST   /api/approval-templates/:id/activate
POST   /api/approval-templates/:id/deactivate
```

---

## 五、系統稽核日誌 `/system/audit-logs`

### 功能概述
記錄所有重要操作的稽核軌跡，包含誰在何時對什麼資料做了什麼操作。

### 日誌列表
**篩選：** 操作者、操作類型（CREATE/UPDATE/DELETE）、資源類型（employees/roles/users 等）、日期範圍

**欄位：** 時間、操作者（工號 + 姓名）、操作類型、資源類型、資源 ID、操作描述、IP 位址

**欄位詳情（點擊展開）**
- 操作前資料（`before` JSON）
- 操作後資料（`after` JSON）
- Diff 視圖

### 審計日誌來源
後端攔截器（NestJS Interceptor）在以下情況自動記錄：
- 所有 POST / PUT / DELETE 請求
- 敏感資料存取（員工薪資、個人身份資訊）
- 登入成功/失敗

### API
```
GET  /api/audit-logs?userId=&resource=&action=&dateFrom=&dateTo=&page=1
GET  /api/audit-logs/:id
```

---

## 六、模塊設定 `/system/module-settings`

### 功能概述
啟用/停用各功能模塊，設定模塊相關參數。

**設定項目**
- 模塊啟用狀態（HR/Finance/Administration 模塊可按公司維度開關）
- 功能開關（如 GPS 打卡、視訊會議整合等）
- 系統參數（密碼政策、Session 逾時時間等）

---

## 七、通知設定 `/system/notifications`

### 功能概述
設定系統通知的發送規則與渠道。

**通知渠道：** 系統內通知 / Email / （未來：Line / Teams）

**通知事件**
- 審批申請（有新申請待審核）
- 審批結果（申請已批准/拒絕）
- 公告發布
- 系統維護通知

**設定項目**
- 各事件預設通知渠道
- Email SMTP 設定
- 通知模板（標題/內文）

---

## 八、系統設定 `/system/settings`

**設定項目**
- 系統名稱
- 公司 Logo（上傳）
- 預設時區
- 工作日設定（週一到五？週一到六？）
- 法定假日匯入（CSV，或手動設定 `public_holidays`）
- 登入失敗鎖定次數
- JWT Token 有效期

---

## 組織架構建立順序

> 必須依此順序建立，否則後續功能無法正常運作：

```
1. 地區 (regions)
2. 公司 (companies)              ← 需要 regionId
3. 事業部 (business_units)       ← 獨立建立
4. 項目 (projects)               ← 需要 businessUnitId（可選）
5. 部門 (departments)            ← 需要 companyId 或 projectId（至少一個）
6. 職位 (positions)
7. 職級 (job_levels)
8. 員工 (users + employee_profiles)
9. 員工組織配置 (user_org_assignments) ← 需要員工 + 地區 + 公司 + 事業部 + 項目 + 部門 + 職位 + 職級
10. 組織負責人 (organization_leaders)   ← 需要員工 + 事業部 / 項目 / 部門
11. 員工成本分攤 (employee_cost_allocations) ← 需要員工 + 組織完整
```

---

## 開發優先順序

| Phase | 功能 |
|-------|------|
| Phase 1 | 地區/公司/事業部/項目/部門/職位/職級（雙組織線），帳號管理，角色與權限基礎 |
| Phase 2 | 組織負責人管理，員工組織配置（含 assignmentType / regionId），審批流設定（含 approvalRouteType + 動態 approverType） |
| Phase 3 | 使用者角色指派（含 Scope），審批人解析引擎，稽核日誌 |
| Phase 4 | 員工成本分攤，薪資成本分攤快照，財務成本報表維度 |
| Phase 5 | 模塊設定，通知設定，系統設定 |
