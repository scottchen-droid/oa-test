# 人事模塊 (HR Module) — 功能規格

## 模塊概述

人事模塊是後端管理入口，供 HR 人員管理全公司員工資料、組織配置、出勤統計、假期政策、薪資計算及績效考核。需要 `module.hr.access` 權限才能進入。

**Route 前綴：** `/hr`
**權限碼：** `module.hr.access`
**可見對象：** 具備 HR 模塊角色的使用者 + `isSuperAdmin`

---

## 路由結構

```
/hr/employees           員工管理列表
/hr/employees/:id       員工詳情與編輯
/hr/org-assignments     組織配置（員工部門/職位指派）
/hr/attendance          出勤管理（全員統計）
/hr/attendance/exceptions  補卡管理（審核）
/hr/leaves              假期管理（審核 + 餘額設定）
/hr/payroll             薪資管理
/hr/performance         績效管理
```

---

## 一、員工管理 `/hr/employees`

### 功能概述
管理所有員工的基本資料與帳號，包含建立帳號、維護員工個人資訊、設定所屬公司/部門。

### 列表頁
**篩選條件：** 公司、部門、在職狀態（在職/離職/試用）、職位、職級
**欄位顯示：**
- 工號 (`employee_no`)
- 姓名、英文名
- 公司、部門、職稱
- 到職日期
- 狀態（在職/離職/試用）
- 操作（查看 / 編輯 / 停用）

**操作：**
- 新增員工（含建立使用者帳號）
- 匯入員工（Excel，Phase 2）
- 匯出員工清單

### 員工詳情頁 `/hr/employees/:id`

**分頁 Tabs：**
1. **基本資料** — 姓名（中/英）、生日、性別、身份證字號（加密）、護照號碼（加密）、國籍、婚姻狀況、聯絡電話、個人 Email
2. **工作資訊** — 工號、入職日期、試用期結束日、轉正日、離職日期、工作地點、直屬主管
3. **組織配置** — 所屬公司、部門、Business Unit、職位、職級（`user_org_assignments`）
4. **薪資資訊** — 薪資結構、基本薪（敏感，需特殊權限）
5. **帳號資訊** — 登入帳號（工號）、帳號狀態、上次登入時間
6. **異動紀錄** — 職位/薪資調整歷程

### 資料模型對應
```
User (users) ─── 1:1 ── EmployeeProfile (employee_profiles)
                              │
                              └── UserOrgAssignment (user_org_assignments) ─ many
```

### API
```
GET    /api/employees?company=&dept=&status=&page=1
GET    /api/employees/:id
POST   /api/employees            (建立員工 + 使用者帳號)
PUT    /api/employees/:id
DELETE /api/employees/:id        (軟刪除/停用)
GET    /api/employees/:id/org-assignments
PUT    /api/employees/:id/org-assignments
```

---

## 二、組織配置 `/hr/org-assignments`

### 功能概述
批量管理員工的組織歸屬。一名員工可有多個組織指派（e.g., 同時屬於多個 BU/項目）。

### 功能項目
- 以樹狀/列表方式顯示部門與成員
- 調整員工所屬部門/BU/職位
- 指定直屬主管
- 員工轉調（部門間 transfer）記錄
- 批量調整

### API
```
GET  /api/hr/org-assignments?dept=&company=
PUT  /api/hr/org-assignments/:userId  { deptId, positionId, jobLevelId, managerId }
POST /api/hr/transfers  { userId, fromDeptId, toDeptId, effectiveDate, reason }
```

---

## 三、出勤管理 `/hr/attendance`

### 功能概述
HR 查看和管理全員出勤記錄，包含統計報表、異常處理、補卡審核。

### 3.1 出勤列表
**篩選：** 月份、員工、公司、部門、出勤狀態（正常/遲到/早退/缺勤/異常）

**欄位：**
- 員工工號、姓名
- 日期
- 上班打卡時間
- 下班打卡時間
- 實際工時
- 出勤狀態
- 備註

**統計卡：**
- 本月出勤天數
- 異常筆數（遲到/早退/缺勤）
- 加班總工時

### 3.2 補卡審核 `/hr/attendance/exceptions`
- 查看全員補卡申請列表
- 批准 / 拒絕補卡申請
- 直接修改出勤記錄（HR 特權）

### API
```
GET  /api/attendance/records?month=&employeeId=&deptId=&status=
GET  /api/attendance/summary?month=&deptId=
GET  /api/attendance/clock-patch?status=pending
PUT  /api/attendance/clock-patch/:id/approve
PUT  /api/attendance/clock-patch/:id/reject  { reason }
PUT  /api/attendance/records/:id  (HR 直接修改)
```

---

## 四、假期管理 `/hr/leaves`

### 功能概述
HR 維護假別設定、員工假期餘額、審核全員請假申請。

### 4.1 假期申請審核
- 查看所有待審核請假申請
- 批准 / 拒絕（主管可先審，HR 可二審）
- 篩選：員工、假別、日期範圍、狀態

### 4.2 假期餘額管理
- 查看/調整員工年度假期餘額
- 批量初始化新年度餘額
- 假期結轉設定

### 4.3 假別設定
- 維護假別清單（年假、事假、病假等）
- 設定各假別上限天數、是否需要審批、是否可結轉

### API
```
GET  /api/leaves/requests?status=&employeeId=&leaveTypeId=
GET  /api/leaves/balances?year=&employeeId=
PUT  /api/leaves/balances/:id  { daysAvailable }
GET  /api/leaves/types
POST /api/leaves/types
PUT  /api/leaves/types/:id
```

---

## 五、薪資管理 `/hr/payroll`

### 功能概述
HR/財務 管理薪資結構、計算每月薪資、生成薪資單。

### 5.1 薪資期間管理
- 建立/鎖定薪資期間（通常為每月）
- 薪資計算觸發（手動 or 自動）
- 鎖定後不可修改

### 5.2 薪資明細
- 查看每位員工的薪資明細
- 明細項目：基本薪、加班費、補貼、扣勞健保、扣稅、實發金額
- 批量生成薪資單 PDF（Phase 2）

### 5.3 薪資結構設定
- 定義薪資項目（底薪、交通補貼、餐補等）
- 計算公式設定（加班費計算規則）

### API
```
GET  /api/payroll/periods
POST /api/payroll/periods
PUT  /api/payroll/periods/:id/lock
GET  /api/payroll/records?periodId=&employeeId=
POST /api/payroll/records/calculate  { periodId }
GET  /api/payroll/structures
POST /api/payroll/structures
```

---

## 六、績效管理 `/hr/performance`

### 功能概述
HR 建立考核週期，員工設定目標，主管進行考核評分。

### 6.1 考核週期
- 建立年度/半年度考核週期
- 設定目標提交期限、考核期限
- 週期狀態：草稿 → 進行中 → 完成

### 6.2 目標設定
- 員工填寫個人目標（Phase 3）
- 主管確認目標

### 6.3 考核記錄
- 主管對員工進行評分
- 考核結果：S/A/B/C/D 等級
- 考核完成後員工可查看（`home.personal.performance.view_self`）

### API
```
GET  /api/performance/cycles
POST /api/performance/cycles
PUT  /api/performance/cycles/:id/activate
GET  /api/performance/goals?cycleId=&employeeId=
GET  /api/performance/reviews?cycleId=
POST /api/performance/reviews
PUT  /api/performance/reviews/:id
```

---

## 權限矩陣

| 功能 | HR 角色 | 直屬主管 | 一般員工 |
|------|---------|---------|---------|
| 員工列表 | 讀寫 | 僅所屬部門（唯讀） | 無 |
| 員工詳情（薪資） | 讀寫 | 無 | 僅本人 |
| 補卡審核 | 讀寫 | 所屬部門 | 無 |
| 請假審核 | 讀寫 | 所屬部門 | 無 |
| 薪資計算 | 讀寫 | 無 | 無 |
| 績效評分 | 讀寫 | 所屬部門員工 | 僅本人 |

---

## 開發優先順序

| Phase | 功能 |
|-------|------|
| Phase 1 | 員工管理（列表 + 詳情）、組織配置基礎功能 |
| Phase 2 | 出勤管理（HR 視角）、補卡審核 |
| Phase 3 | 假期管理（餘額 + 審核） |
| Phase 4 | 薪資管理（計算 + 薪資單） |
| Phase 5 | 績效管理 |
