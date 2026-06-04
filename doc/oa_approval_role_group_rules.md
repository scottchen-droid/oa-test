# OA 系統審批角色、審批群組與審批規則設計需求

> 文件用途：定義 OA 系統審批流的角色語意、群組責任設計與實作規則  
> 適用範圍：電子表單、人事假勤、財務申請、行政申請、簽核中心、審批模板設定  
> 文件狀態：**已實作（v1）**

---

## 1. 設計背景

OA 系統的審批流設計遵守以下核心原則：

```text
不把審批人直接寫死在表單或員工資料上。
不把員工帳號直接綁定為某個審批角色作為主要設計。
不把系統角色（HR_ADMIN、FINANCE_ADMIN 等）直接當審批角色使用。
不讓每種表單在程式碼中各自寫一套審批邏輯。
```

正確做法：

```text
審批角色  →  定義流程節點的語意（「這一關要找哪一類人？」）
審批群組  →  承接實際審批責任（「這類人在某個範圍內，由誰負責？」）
審批群組成員  →  員工加入群組，有 primary / backup / member 三種類型
服務範圍  →  群組負責哪些公司、地區、事業部、項目或表單類型
審批模板  →  定義某種表單走哪些審批節點（引用審批角色代碼）
審批快照  →  表單送出後固定當下解析出的實際流程
```

---

## 2. 審批角色分類（共兩類）

### 2.1 動態組織解析型

這類角色直接從組織架構資料中解析，**不需要設定審批群組**。

| 角色代碼 | 中文名稱 | 解析來源 |
|---------|---------|---------|
| `applicant_direct_manager` | 申請人直屬主管 | `user_org_assignments.directManagerUserId` |
| `department_manager` | 部門主管 | `Department.managerUserId` |
| `project_owner` | 項目負責人 | `Project.projectOwnerUserId`（在組織架構管理設定）|
| `business_unit_head` | 事業部負責人 | `BusinessUnit.headUserId`（在組織架構管理設定）|

> 重要：**在組織架構管理 → 事業部** 中設定「事業部負責人」，**在項目管理** 中設定「項目負責人」。這是組織主檔資料，不是審批功能角色標籤。

### 2.2 審批群組解析型

這類角色透過「審批群組」解析，需要先建立群組並設定服務範圍。

| 角色代碼 | 中文名稱 | 說明 |
|---------|---------|------|
| `company_hr` | 公司人事專員 | 公司層級，服務範圍可跨多間公司 |
| `company_hr_manager` | 公司人事主管 | 公司層級 |
| `company_finance` | 公司財務人員 | 公司層級 |
| `company_finance_manager` | 公司財務主管 | 公司層級 |
| `group_hr` | 集團人事人員 | 集團層級 |
| `group_finance` | 集團財務人員 | 集團層級 |
| `group_finance_manager` | 集團財務主管 | 集團層級 |
| `ceo` | 執行長 | 集團層級，群組通常只有一位 primary 成員 |
| `chairman` | 董事長 | 集團層級，群組通常只有一位 primary 成員 |

---

## 3. 審批群組設計

### 3.1 群組結構

```
審批群組（approval_groups）
├── 名稱：台灣共用HR審批群組
├── 負責角色代碼（roleCode）：company_hr
├── 處理模式（mode）：primary
└── 服務範圍（approval_group_scopes）
    ├── company → 代碼科技
    ├── company → 天珤科技
    └── company → 天棨科技

群組成員（approval_group_members）
├── Amy：primary（主要負責人）
├── Ben：backup（備援）
└── Cindy：member（一般成員）
```

### 3.2 處理模式

| 模式 | 行為 | 適用場景 |
|------|------|---------|
| `primary` | 只通知主要負責人（primary 成員），由其審批 | HR、財務、CEO、董事長等有明確負責人的角色（預設） |
| `any` | 通知所有啟用成員，任一人通過即完成 | 多人共享工作池、輪流值班等 |

### 3.3 服務範圍解析優先序

當同一角色有多個群組匹配時，取**最精確**的範圍：

```
部門 > 項目 > 事業部 > 公司 > 地區 > form_type > 全集團
```

範例：
- 申請人公司 = 天珤科技，角色 = `company_hr`
- 系統查找所有 `roleCode=company_hr` 且 `isActive=true` 的群組
- 篩選服務範圍包含「天珤科技」的群組（company scope）
- 優先選公司層級的匹配，其次選地區，最後選全集團

---

## 4. 員工資料設計原則

員工資料中**不應直接標記審批功能角色**。

員工身上只記錄組織歸屬資料：
```
所屬地區、所屬公司、所屬事業部、所屬項目、所屬部門、直屬主管、職位、職級
```

審批責任透過群組設定，員工作為群組成員加入。

> **已移除**：先前實作的 `employee_approver_roles` 表（直接在員工身上標籤 hr_specialist、finance_manager 等）已於 Migration 009 移除，改用審批群組系統。

---

## 5. 審批模板步驟設計

### 5.1 步驟與串並簽

- **串簽**：`approvalMode = 'any'`（任一人通過即可）或步驟只有一位審批人
- **並簽**：`approvalMode = 'all'`（所有審批人都需簽核，通知所有人）
- **多數通過**：`approvalMode = 'majority'`

### 5.2 步驟範圍設定（scopeConfig）

對於**動態組織解析型**角色，步驟可以設定解析範圍：

```json
// project_owner: 申請人的項目 or 指定特定項目
{ "projectResolution": "applicant_project" | "specific_project", "projectId": "uuid" }

// business_unit_head: 申請人的事業部 or 指定事業部
{ "buResolution": "applicant_bu" | "specific_bu", "businessUnitId": "uuid" }

// department_manager: 申請人的部門 or 指定部門
{ "departmentResolution": "applicant_department" | "specific_department", "departmentId": "uuid" }
```

對於**審批群組解析型**角色（company_hr、ceo 等），**不需要在步驟上設定公司範圍**。服務範圍由群組自身的 scope 設定處理。

### 5.3 加簽（動態加簽）

每個步驟可設定 `allowDynamicAdding = true`，允許審批人在審核過程中臨時新增加簽節點。

---

## 6. 多模板匹配（金額條件）

對於涉及費用的表單，建議建立多條模板，依金額條件分流：

```
採購申請 - 低金額（≤ 10,000）
  步驟：部門主管 → 公司財務人員

採購申請 - 中金額（10,000 ~ 100,000）
  步驟：部門主管 → 項目負責人 → 公司財務主管

採購申請 - 高金額（> 100,000）
  步驟：部門主管 → 項目負責人 → 事業部負責人 → 執行長 → 董事長
```

金額條件設定在審批模板的 `minAmount` / `maxAmount` 欄位。表單送出時系統依金額選取最匹配的模板（priority 最小值優先）。

---

## 7. 送出前驗證規則

任何表單送出前，後端必須驗證（`POST /api/approvals/validate-form`）：

1. 是否有符合條件（formType + 金額範圍）的啟用模板
2. 每個必要步驟的審批角色是否能解析出審批人：
   - 群組解析型：是否有匹配的啟用群組且有 active primary 成員
   - 動態解析型：直屬主管是否已設定（其他 org 類型在表單上下文中驗證）
   - 指定人員型：是否已選擇人員

驗證失敗時明確提示缺少哪類設定。

---

## 8. 每種表單必有預設審批線

每一種可以送出的電子表單（form_type），至少需要一條 `isActive = true` 的審批模板。

建議後台操作限制：
- 停用最後一條某表單類型的模板前，系統提示警告
- 不可硬刪除已被使用過的審批模板（可停用）

---

## 9. 審批快照規則

表單送出後，系統固定當下解析出的實際審批流程（`approval_instances` + `approval_steps`）。

後續以下變更不影響已送出的表單：
- 審批模板修改 / 步驟變更
- 審批群組成員調整
- 項目負責人 / 部門主管 / 事業部負責人異動
- 員工組織歸屬異動

駁回後重新送出時，需重新解析當下最新設定，產生新的審批快照。

---

## 10. UI 操作入口

### 10.1 審批流設定（系統管理員 → 審批流設定）

```
審批流設定
├── Tab 1: 審批模板   ← 建立/編輯審批模板與步驟
├── Tab 2: 審批角色   ← 查看所有角色定義與解析方式（唯讀說明）
└── Tab 3: 審批群組   ← 建立群組、加入成員、設定服務範圍
```

### 10.2 組織負責人設定（系統管理員 → 組織架構）

```
組織架構管理
├── 事業部 Tab → 編輯時可設定「事業部負責人」
└── 項目 Tab   → 編輯時可設定「項目負責人」
```

部門主管在「部門 Tab」編輯時設定，直屬主管在員工組織配置中設定。

---

## 11. 資料庫設計（v1 已實作）

| 表名 | 說明 |
|------|------|
| `approval_groups` | 審批群組基本資訊（名稱、角色代碼、處理模式） |
| `approval_group_members` | 群組成員（primary / backup / member，含生效日期）|
| `approval_group_scopes` | 群組服務範圍（公司/地區/全集團/表單類型等）|
| `approval_templates` | 審批模板（formType、金額範圍、優先序）|
| `approval_template_steps` | 模板步驟（順序、串/並簽模式、允許加簽）|
| `approval_template_step_approvers` | 步驟審批人（角色代碼、scopeConfig、指定人員）|
| `approval_instances` | 審批快照（表單送出後生成）|
| `approval_steps` | 步驟快照（含動態加簽步驟）|
| `approval_step_approvers` | 步驟審批人快照（記錄實際解析人員）|

---

## 12. 後端 API 清單（審批群組相關）

```
GET    /api/approvals/groups                    列出審批群組
GET    /api/approvals/groups/:id                群組詳情（含成員與範圍）
POST   /api/approvals/groups                    新增群組
PATCH  /api/approvals/groups/:id                更新群組基本資訊

POST   /api/approvals/groups/:groupId/members   加入成員
DELETE /api/approvals/group-members/:memberId   移除成員

POST   /api/approvals/groups/:groupId/scopes    新增服務範圍
DELETE /api/approvals/group-scopes/:scopeId     刪除服務範圍

GET    /api/approvals/groups/resolve/:roleCode   解析指定角色的群組審批人
POST   /api/approvals/validate-form             送出前驗證審批流程完整性
```

---

## 13. 尚未實作（後續規劃）

| 功能 | 說明 |
|------|------|
| 多項目分攤費用並行會簽 | 一張費用單分攤多個項目，每個項目負責人並行會簽 |
| 駁回後修改重送流程 | 目前駁回即結束，未實作重送邏輯 |
| Backup 成員逾時通知 | Primary 未在時限內審批時通知 backup |
| 表單至少一條預設審批線強制驗證 | 防止管理員停用唯一模板 |
