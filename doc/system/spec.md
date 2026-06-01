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
> 建立順序：地區 → 公司 → 部門 → 業務單位 → 職位 + 職級

### 3.1 地區管理 `/system/org/regions`
**資料表：** `regions`
**欄位：** 地區名稱（中/英）、地區代碼、幣別、時區、所屬國家、狀態

**API**
```
GET    /api/regions
POST   /api/regions    { name, code, country, currency, timezone }
PUT    /api/regions/:id
DELETE /api/regions/:id
```

### 3.2 公司管理 `/system/org/companies`
**資料表：** `companies`
**欄位：** 公司全名（中/英）、公司代碼、所屬地區、法人統編/登記號、公司地址、電話、狀態

**API**
```
GET    /api/companies?regionId=
POST   /api/companies   { name, code, regionId, taxId, address, phone }
PUT    /api/companies/:id
DELETE /api/companies/:id
```

### 3.3 部門管理 `/system/org/departments`
**資料表：** `departments`
**欄位：** 部門名稱（中/英）、部門代碼、所屬公司、上層部門（支援多層）、部門主管、狀態

支援樹狀結構（`parentId`），可顯示部門層級。

**API**
```
GET    /api/departments?companyId=
GET    /api/departments/tree?companyId=   (樹狀結構)
POST   /api/departments   { name, code, companyId, parentId?, managerId? }
PUT    /api/departments/:id
DELETE /api/departments/:id
```

### 3.4 業務單位管理 `/system/org/business-units`
**資料表：** `business_units`
**欄位：** BU 名稱（中/英）、BU 代碼、所屬公司、負責人、狀態

**API**
```
GET    /api/business-units?companyId=
POST   /api/business-units   { name, code, companyId, managerId? }
PUT    /api/business-units/:id
DELETE /api/business-units/:id
```

### 3.5 項目管理 `/system/org/projects`
**資料表：** `projects`
**欄位：** 項目名稱（中/英）、項目代碼、所屬公司/BU、項目負責人、開始日期、結束日期、狀態

**API**
```
GET    /api/projects?companyId=&status=
POST   /api/projects   { name, code, companyId, businessUnitId?, managerId, startDate, endDate? }
PUT    /api/projects/:id
DELETE /api/projects/:id
```

### 3.6 職位管理 `/system/org/positions`
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
設定各類表單（請假/加班/採購/報銷等）的審批流程模板。

### 審批流模板

**模板屬性**
- 表單類型（`form_type`）：leave / overtime / clock_patch / purchase_request / reimbursement
- 名稱（可有多個模板，按條件匹配）
- 適用範圍（全域/指定公司/指定部門）
- 金額區間（財務表單用）
- 是否啟用

**審批節點（`approval_template_steps`）**
- 節點順序（`stepOrder`）
- 節點名稱
- 審批人設定：
  - 固定角色（如 `HR_ADMIN`）
  - 動態角色（如 `direct_manager` 直屬主管、`dept_head` 部門主管）
  - 固定人員（指定 userId）
- 通過規則：all（全員同意）/ any（任一人同意）/ majority（多數同意）
- 是否允許退回

**審批流範例：請假申請**
```
Step 1: 直屬主管（dynamic: direct_manager）— any
Step 2: HR 確認（role: HR_ADMIN）— any
```

**審批流範例：採購申請（金額 > 10萬）**
```
Step 1: 直屬主管（dynamic: direct_manager）— any
Step 2: 部門主管（dynamic: dept_head）— any
Step 3: 財務複核（role: FINANCE_ADMIN）— any
Step 4: 總經理（fixed user: CEO）— any
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
2. 公司 (companies)        ← 需要 regionId
3. 部門 (departments)      ← 需要 companyId
4. 業務單位 (business_units) ← 需要 companyId
5. 項目 (projects)         ← 需要 companyId + businessUnitId
6. 職位 (positions)
7. 職級 (job_levels)
8. 員工 (users + employee_profiles) ← 需要上述全部
9. 組織配置 (user_org_assignments) ← 需要員工 + 部門 + 職位 + 職級
```

---

## 開發優先順序

| Phase | 功能 |
|-------|------|
| Phase 1 | 組織架構（地區/公司/部門/BU/項目/職位/職級）、帳號管理、角色與權限基礎 |
| Phase 2 | 審批流設定（模板 + 節點配置）、稽核日誌 |
| Phase 3 | 使用者角色指派（含 Scope）、權限細粒度管理 |
| Phase 4 | 模塊設定、通知設定、系統設定 |
