# 首頁模塊 (Home Module) — 功能規格

## 模塊概述

首頁是所有員工登入後的主要入口，提供個人自助服務、主管審批、資訊瀏覽三大區塊。不同於後端管理模塊，首頁所有功能面向一般員工，無需特殊角色即可使用（主管區塊除外）。

**Route 前綴：** `/home`
**權限碼：** `module.home.access`（登入後即擁有）

---

## 路由結構

```
/home                           首頁
/home/personal/notifications    我的通知
/home/personal/payslips         我的薪資單
/home/attendance/clock          打卡（上下班打卡 + 今日打卡時間）
/home/attendance/records        出勤紀錄（含補卡操作入口）
/home/attendance/leaves         假期申請
/home/attendance/overtime       加班申請
/home/forms/requests            電子表單申請（選擇表單類型並提交）
/home/forms/approvals           電子表單簽核（查看自己申請的表單審核狀況）
/home/account/login-logs        登入記錄
/home/manager/approvals         簽核（Tab 切換各類簽核，主管限）
/home/info/announcements        公告列表
/home/info/announcements/:id    公告詳情
/home/info/org-chart            組織架構圖
/home/info/system-messages      系統訊息
```

---

## 一、首頁儀表板 `/home`

### 版型
三欄式 Layout：左側快捷入口 + 中間主內容區 + 右側資訊卡

### 左欄（快捷入口 + 提醒）
- **快捷格** `ShortcutGrid`：5 個快捷入口，支援角標（未讀數）
  - 通知 → `/home/personal/notifications`
  - 簽核 → `/home/manager/approvals`（主管限，無權限則隱藏）
  - 請假 → `/home/attendance/leaves`
  - 公告 → `/home/info/announcements`
  - 打卡 → `/home/attendance/clock`
- **今日提醒** `ReminderCard`：來自後端 `/api/dashboard` 的 `todayReminders`
- **明日提醒** `ReminderCard`：`tomorrowReminders`
- **最近使用**：localStorage 記錄最近 5 個功能入口

### 中欄（主內容 Tabs）
| Tab | 內容 |
|-----|------|
| 總覽 | 公告列表 `AnnouncementList` |
| 個人 | 個人待辦事項（Phase 2 實作） |
| 主管 | 待審批列表（Phase 3 實作，需 `isManager`） |
| 資訊中心 | 公告 + 系統訊息摘要（Phase 2） |

### 右欄
- **AI 助理卡** `AssistantCard`：入口提示
- **登入資訊卡** `UserLoginInfoCard`：上次登入時間、IP、裝置

### API
```
GET /api/dashboard
Response: {
  shortcuts: ShortcutItem[]
  todayReminders: ReminderItem[]
  tomorrowReminders: ReminderItem[]
  announcements: AnnouncementItem[]
  currentUser: UserLoginInfo
  recentFunctions: RecentFunctionItem[]
}
```

---

## 二、個人中心

### 2.1 我的通知 `/home/personal/notifications`
**權限：** `home.personal.notification.view`

- 通知列表，支援已讀/未讀篩選
- 通知類型：審批結果、系統公告、HR 通知
- 點擊通知跳轉至對應功能頁
- 支援全部標為已讀

**API**
```
GET  /api/notifications?status=unread|read&page=1&limit=20
PUT  /api/notifications/:id/read
PUT  /api/notifications/read-all
```

### 2.2 我的薪資 `/home/personal/payslips`
**權限：** `home.personal.payslip.view_self`

- 顯示當前員工的薪資單列表（按月份）
- 選擇月份查看詳情
- 薪資單項目：基本薪資、加班費、補貼、扣款、實發金額
- 不可看他人薪資（後端強制 scope: self）

**API**
```
GET  /api/payroll/my-payslips?year=2026
GET  /api/payroll/my-payslips/:id
```

---

## 三、考勤管理（員工自助）

### 3.1 打卡 `/home/attendance/clock`
**權限：** `home.attendance.online_clock.use`

**功能：**
- 上班打卡 / 下班打卡按鈕
- 顯示今日已打卡時間（上班時間、下班時間）
- 即時顯示當前時間
- 顯示打卡結果（成功 / 失敗原因）
- 打卡方式：網頁打卡（Phase 1）/ GPS 打卡（Phase 2）/ QR 打卡（Phase 3）

> 此頁面依 `home.attendance.online_clock.use` 權限控制顯示，未開啟線上打卡的員工不顯示此選單。

**打卡流程：**
1. 點擊「上班打卡」或「下班打卡」
2. 後端記錄 `clock_records`（time, type: clock_in|clock_out, method: web, ip, lat/lng）
3. 自動計算出勤狀態寫入 `attendance_records`

**API**
```
GET  /api/attendance/today
POST /api/attendance/clock-in   { method: 'web', lat?, lng? }
POST /api/attendance/clock-out  { method: 'web', lat?, lng? }
```

### 3.2 出勤紀錄 `/home/attendance/records`
**權限：** `home.attendance.record.view_self`

**功能：**
- 日期範圍查詢條件（預設當月），可指定起訖日期查詢出勤紀錄列表
- 列表欄位：日期、上班打卡時間、下班打卡時間、出勤狀態、備註
- 若某筆記錄**缺少上班卡或下班卡**，該列顯示「補卡」操作按鈕
- 點擊「補卡」開啟補卡申請表單（日期、補卡類型：上班/下班、補卡時間、原因、附件）
- 補卡申請送出後進入審批流程
- 可查看補卡申請狀態（待審核 / 已批准 / 已拒絕）

**API**
```
GET  /api/attendance/records?startDate=2026-05-01&endDate=2026-05-31
POST /api/attendance/clock-patch  { date, punchType: 'clock_in'|'clock_out', punchTime, reason, attachments[] }
GET  /api/attendance/clock-patch/my?status=pending
```

### 3.3 假期申請 `/home/attendance/leaves`
**權限：** `home.attendance.leave.apply`

- 剩餘假期餘額（各假別）
- 歷史請假記錄
- 新增請假申請：假別、開始/結束日期、事由、代理人
- 取消待審核申請

**假別範例：** 年假、事假、病假、婚假、喪假、產假、陪產假、公假

**API**
```
GET  /api/leaves/my-balances
GET  /api/leaves/my-requests?status=pending
POST /api/leaves/requests       { leaveTypeId, startDate, endDate, reason, delegateId? }
PUT  /api/leaves/requests/:id/cancel
```

### 3.4 加班申請 `/home/attendance/overtime`
**權限：** `home.attendance.overtime.apply`

- 歷史加班記錄（含審核狀態）
- 新增加班申請：日期、開始/結束時間、加班類型、原因
- 加班類型：工作日加班 / 假日加班 / 補班日
- 補償方式：加班費 / 補休（需設定）

**API**
```
GET  /api/overtime/my-requests
POST /api/overtime/requests  { date, startTime, endTime, type, reason, compensationType }
PUT  /api/overtime/requests/:id/cancel
```

---

## 四、電子表單（員工自助）

> 電子表單使用通用 `oa_form_requests` 表儲存，欄位以 JSONB 儲存（支援未來擴充新表單類型）。

### 4.1 電子表單申請 `/home/forms/requests`
**權限：** `home.forms.request.create`

進入頁面後以卡片格式列出所有可申請的表單類型，點擊卡片開啟申請表單 Dialog。

**目前支援的表單類型：**
| formType | 顯示名稱 | 主要欄位 |
|----------|----------|----------|
| `asset_request` | OA資產申請單 | 資產類型、數量、預計使用日期、申請原因 |
| `meal_allowance` | 誤餐費申請 | 加班日期、加班時數、申請金額、備註 |
| `it_request` | 資訊需求申請 | 需求標題、需求描述、優先程度、期望完成日期 |
| `headcount_request` | 人力需求申請 | 職位名稱、招募人數、招募原因、期望到職日期 |
| `resignation` | 離職申請 | 預計離職日期、離職原因、交接備註 |

> 未來新增表單類型時，只需在前端新增卡片定義與 Dialog 欄位，後端直接接受即可。

**API**
```
POST /api/forms    { formType, content: { ...欄位 } }
```

### 4.2 電子表單簽核 `/home/forms/approvals`
**權限：** `home.forms.approval.view_self`

顯示**當前員工自己提交**的所有電子表單申請列表及其審核狀況。

**列表欄位：**
- 表單類型（標籤顯示）
- 申請摘要（依 formType 自動生成摘要文字）
- 狀態（審核中 / 已通過 / 已駁回 / 已取消）
- 申請時間
- 更新時間

**API**
```
GET  /api/forms/my-requests?page=1&limit=20
```

---

## 五、登入記錄 `/home/account/login-logs`

- 顯示本帳號最近 N 筆登入記錄
- 欄位：時間、IP、裝置/瀏覽器、地點（如可推斷）、狀態（成功/失敗）

**API**
```
GET /api/auth/login-logs?page=1&limit=20
```

---

## 六、主管區塊（需 `module.home_manager.access`）

主管區塊在側欄以「主管」入口顯示，僅對具備 `module.home_manager.access` 權限的使用者可見。

### 6.1 簽核 `/home/manager/approvals`
**權限：** `module.home_manager.access`

進入頁面後，以 **Tab** 方式切換不同類型的待簽核列表。每個 Tab 顯示對應的待審核數量角標。

**Tab 清單：**
| Tab | 說明 | formType |
|-----|------|----------|
| 請假簽核 | 員工請假申請待審 | `leave` |
| 補卡簽核 | 員工補卡申請待審 | `clock_patch` |
| 加班簽核 | 員工加班申請待審 | `overtime` |
| 電子表單簽核 | 各類電子表單待審 | `form` |

**共同規格：**
- 每個 Tab 獨立顯示「待我審核」的申請列表
- 點擊列表項目展開或跳轉詳情頁，進行批准 / 拒絕 / 退回
- 拒絕時簽核意見為必填
- 支援查看審批流節點與歷史簽核紀錄
- 支援加簽 / 轉簽（依權限）
- 支援批量操作（Phase 3）

**API**
```
GET  /api/approvals/pending?formType=leave
GET  /api/approvals/pending?formType=clock_patch
GET  /api/approvals/pending?formType=overtime
GET  /api/approvals/pending?formType=form
POST /api/approvals/:id/approve  { comment? }
POST /api/approvals/:id/reject   { comment }
GET  /api/approvals/:id          (詳情)
```

---

## 七、資訊中心

### 7.1 公告 `/home/info/announcements`

- 公告列表（支援置頂、分類篩選）
- 已讀/未讀標記
- 點擊進入公告詳情頁

```
GET  /api/announcements?category=&page=1
GET  /api/announcements/:id
PUT  /api/announcements/:id/read
```

### 7.2 組織架構圖 `/home/info/org-chart`
- 互動式組織架構樹（Phase 2）
- 顯示集團 → 地區 → 公司 → 部門 → 員工
- 可搜尋員工或部門

### 7.3 系統訊息 `/home/info/system-messages`
- 系統通知（維護公告、版本更新等）
- 只讀，由系統管理員發布

---

## 開發優先順序

| Phase | 功能 |
|-------|------|
| Phase 1 | 首頁、打卡（網頁）、出勤紀錄（含補卡按鈕）、公告列表、我的請假、我的加班 |
| Phase 2 | 我的通知、我的薪資、組織架構圖、系統訊息 |
| Phase 3 | 主管簽核功能（Tab 整合：請假/補卡/加班/表單）、GPS/QR 打卡 |
| Phase 4 | 電子表單（採購申請、費用報銷）、登入記錄 |
