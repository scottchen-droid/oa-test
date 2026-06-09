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
/home/forms/requests            發起申請（只顯示使用者有權限申請的表單）
/home/forms/approvals           我的申請（查看自己申請的表單審核狀況）
/home/forms/drafts              我的草稿（查看與繼續編輯未送出的草稿）
/home/forms/fill-templates      我的填寫模板（管理常用填寫內容）
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
> 草稿使用獨立 `oa_form_drafts` 表；填寫模板使用 `oa_fill_templates` 表。

### 名詞區別

| 名稱 | 用途 | 對應資料表 |
|------|------|-----------|
| 草稿 | 尚未送出的填寫中申請 | `oa_form_drafts` |
| 填寫模板 | 使用者保存的常用填寫內容 | `oa_fill_templates` |
| 正式申請 | 已送出、進入審批流程的申請 | `oa_form_requests` |

> **重要：** 填寫模板不保存審批線、審批人、審批快照與審批狀態。從草稿或填寫模板送出時，都必須重新驗證欄位、重新解析審批流程。

---

### 4.1 發起申請 `/home/forms/requests`
**權限：** `home.forms.request.create`

進入頁面後以卡片格式列出所有**目前登入使用者有權限申請**的表單類型，點擊卡片開啟申請表單 Dialog。

> 頁面不應出現「臨時保存」或「模板保存」字樣，這兩個按鈕已廢棄。

**表單填寫 Dialog 按鈕（依序）：**
```
儲存草稿 | 另存為填寫模板 | 送出申請
```

**目前支援的表單類型：**
| formType | 顯示名稱 | 主要欄位 |
|----------|----------|----------|
| `purchase_request` | 採購申請 | 採購品項、數量、預估金額、供應商、預計交貨日期、採購原因 |
| `business_trip` | 出差申請 | 出差目的地、開始/結束日期、出差目的、預估差旅費、是否需住宿 |
| `expense_reimbursement` | 費用報銷 | 關聯採購/出差申請、費用明細 |
| `asset_request` | OA資產申請單 | 資產類型、數量、預計使用日期、申請原因 |
| `meal_allowance` | 誤餐費申請 | 加班日期、加班時數、申請金額、備註 |
| `it_request` | 資訊需求申請 | 需求標題、需求描述、優先程度、期望完成日期 |
| `headcount_request` | 人力需求申請 | 職位名稱、招募人數、招募原因、期望到職日期 |
| `resignation` | 離職申請 | 預計離職日期、離職原因、交接備註 |

**表單申請權限：** 每張表單可設定可申請對象（全體員工/指定公司/指定部門/指定角色/指定人員），發起申請頁只顯示目前登入者有權限的表單。

**API**
```
POST /api/forms                              送出正式申請
POST /api/forms/drafts                       儲存草稿
POST /api/forms/fill-templates               另存為填寫模板
POST /api/forms/:id/copy                     從歷史申請複製
```

---

### 4.2 我的申請 `/home/forms/approvals`
**權限：** `home.forms.approval.view_self`

顯示**當前員工自己提交**的所有電子表單申請列表及其審核狀況。支援「從歷史申請複製建立新申請」。

**列表欄位：**
- 表單類型（標籤顯示）
- 申請摘要（依 formType 自動生成摘要文字）
- 狀態（審核中 / 已通過 / 已駁回 / 已取消）
- 申請時間
- 更新時間
- 操作：複製建立新申請

**API**
```
GET  /api/forms/my-requests?page=1&limit=20
POST /api/forms/:id/copy
```

---

### 4.3 我的草稿 `/home/forms/drafts`
**權限：** `home.forms.request.create`

顯示目前登入使用者尚未送出的草稿列表。

**草稿特性：**
- 尚未送出、尚未產生申請單號
- 尚未進入審批流程，不產生審批快照
- 可繼續編輯，可直接刪除
- 送出時必須完整驗證欄位並重新解析審批流程

**列表欄位：** 表單類型、草稿標題、建立時間、最後保存時間
**操作：** 送出申請、刪除

**API**
```
GET    /api/forms/drafts
PATCH  /api/forms/drafts/:id
DELETE /api/forms/drafts/:id
POST   /api/forms/drafts/:id/submit
```

---

### 4.4 我的填寫模板 `/home/forms/fill-templates`
**權限：** `home.forms.request.create`

管理目前登入使用者建立的填寫模板（常用填寫內容）。

**填寫模板特性（不保存以下內容）：**
- ✗ 審批線、審批人、審批快照、審批狀態
- ✗ 申請單號、簽核紀錄、送出時間
- ✗ 已核銷狀態、上次發票號碼、上次附件憑證

**列表欄位：** 模板名稱、表單類型、模板說明、是否常用、是否啟用、最近使用時間
**操作：** 編輯（名稱/說明/常用/啟用）、設為常用/取消常用、刪除

**API**
```
GET    /api/forms/fill-templates?formType=
POST   /api/forms/fill-templates
PATCH  /api/forms/fill-templates/:id
DELETE /api/forms/fill-templates/:id
POST   /api/forms/fill-templates/:id/use
```

---

## 五、工作單中心

工作單中心讓各負責單位（IT、行政、HR 等）接收並處理由「人員資源申請單」審批通過後自動產生的任務。

> 核心邏輯：電子表單負責申請與審批，工作單負責後續執行與結果回填。

### 5.1 我的工作單 `/home/work-orders`

**功能：**
- 顯示目前登入者需要處理的工作單（assignedUserId = 我，或所屬群組有派發的工作單）
- Tab 篩選狀態：全部 / 待處理 / 處理中 / 已完成 / 失敗 / 退回
- 列表欄位：資源項目、申請對象、申請類型、狀態、群組、建立時間、操作

**工作單狀態：**

| 代碼 | 顯示 | 說明 |
|------|------|------|
| `pending_dispatch` | 待派發 | 審批通過，等待系統派發 |
| `dispatch_error` | 派發異常 | 找不到對應派發規則 |
| `pending` | 待處理 | 已派發，等待處理人接手 |
| `processing` | 處理中 | 處理人已開始處理 |
| `completed` | 已完成 | 處理完成，結果已回填 |
| `failed` | 無法處理 | 標記為無法完成 |
| `returned` | 已退回 | 退回給申請人或 HR |
| `canceled` | 已取消 | 主單取消後連動 |

**操作按鈕（依狀態）：**
- `pending` → 「開始處理」
- `processing` → 「完成」「標記失敗」「退回」
- 任何狀態 → 「補充備註」
- 「完成」時若 `requiresAccountFill=true`：顯示回填表單（帳號/卡號/分機等）

**API：**
```
GET  /api/work-orders/mine?status=&page=1&limit=20
POST /api/work-orders/:id/start
POST /api/work-orders/:id/complete  { resultData? }
POST /api/work-orders/:id/fail      { reason }
POST /api/work-orders/:id/return    { reason }
POST /api/work-orders/:id/reassign  { newGroupId, reason }
POST /api/work-orders/:id/note      { content }
```

### 5.2 群組工作單 `/home/work-orders/group`

**功能：**
- 顯示登入者所屬工作單處理群組的所有工作單
- 頂部 Tab 依群組切換（若使用者加入多個群組）
- 若未加入任何群組，顯示提示訊息
- 操作與「我的工作單」相同

**API：**
```
GET /api/work-orders/group?groupId=&status=&page=1
GET /api/work-order-groups/my        → 取得使用者所屬群組列表
```

---

## 六、登入記錄 `/home/account/login-logs`

- 顯示本帳號最近 N 筆登入記錄
- 欄位：時間、IP、裝置/瀏覽器、地點（如可推斷）、狀態（成功/失敗）

**API**
```
GET /api/auth/login-logs?page=1&limit=20
```

---

## 七、主管區塊（需 `module.home_manager.access`）

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

## 八、資訊中心

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
