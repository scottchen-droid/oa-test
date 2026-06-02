# 集團 OA 系統功能選單與首頁重整需求 v3

> 文件用途：重新整理 OA 系統首頁、員工基礎功能、主管功能、資訊中心，以及後台管理模塊
> 適用範圍：前端主選單、首頁設計、功能模塊規劃、權限設計、Route 規劃、Claude Code 開發指引
> 核心調整：將「儀表板 Dashboard」統一改名為「首頁」，首頁作為每位員工登入後的主要入口
> 重要原則：首頁以員工日常操作為主，保持精簡；人事、財務、行政、系統管理屬於後台管理模塊，依權限顯示

---

# 1. 調整背景

目前 OA 系統原本規劃中，有人事模塊、財務模塊、行政模塊、系統模塊四大模塊。

但實際使用情境上，所有員工登入 OA 後，第一需求不是進入後台管理，而是完成日常工作操作，例如：

1. 查看通知
2. 查看薪資明細
3. 查詢出勤紀錄
4. 查詢出勤異常
5. 申請請假
6. 申請加班
7. 申請補休
8. 查看公告
9. 使用電子表單
10. 若有權限，進行主管簽核

因此本次調整後，首頁不再稱為「儀表板 Dashboard」，而是統一命名為：

```text
首頁
```

首頁是每位員工登入後的主要入口，並且以「員工日常操作」為核心設計。

---

# 2. 整體設計原則

## 2.1 首頁是所有員工的入口

首頁不是後台管理頁，也不是所有模塊資訊的集合頁。

首頁應該做到：

1. 精簡
2. 清楚
3. 以員工日常使用為主
4. 不塞入完整財務、行政、人事、系統後台資訊
5. 只呈現和目前登入者有關的功能、通知、簽核與公告

---

## 2.2 首頁基礎功能分為三大區

首頁內的基礎功能大項分為：

```text
1. 個人
2. 主管
3. 資訊中心
```

其中：

| 功能區  | 使用對象         | 顯示規則  |
| ---- | ------------ | ----- |
| 個人   | 所有員工         | 預設顯示  |
| 主管   | 主管或具備主管簽核權限者 | 依權限顯示 |
| 資訊中心 | 所有員工         | 預設顯示  |

---

## 2.3 後台管理模塊依權限顯示

以下四個模塊不屬於一般員工日常操作入口：

```text
人事模塊
財務模塊
行政模塊
系統管理員模塊
```

這四個模塊應視為後台管理模塊，依照系統權限設定開啟給對應人員使用。

使用視角如下：

| 後台模塊    | 使用對象           | 設計視角      |
| ------- | -------------- | --------- |
| 人事模塊    | HR、人事主管、人事管理人員 | 人事單位後台管理  |
| 財務模塊    | 財務、會計、財務主管     | 財務單位後台管理  |
| 行政模塊    | 行政、總務、行政主管     | 行政單位後台管理  |
| 系統管理員模塊 | IT、系統管理員、超級管理員 | 系統設定與權限管理 |

一般員工不應看到這些後台模塊。

---

# 3. 調整後主選單結構

系統登入後，主選單建議如下：

```text
集團 OA 系統
│
├── 首頁
│   ├── 個人
│   ├── 主管
│   └── 資訊中心
│
├── 人事模塊
│   ├── 員工管理
│   ├── 組織任職
│   ├── 出勤管理
│   ├── 假勤管理
│   ├── 薪資管理
│   └── 績效管理
│
├── 財務模塊
│   ├── 採購申請管理
│   ├── 費用報銷管理
│   ├── 付款管理
│   ├── 費用分攤
│   └── 財務報表
│
├── 行政模塊
│   ├── 公告管理
│   ├── 公司資產管理
│   ├── 行政申請管理
│   ├── 訪客管理
│   └── 會議室管理
│
└── 系統管理員模塊
    ├── 帳號管理
    ├── 角色管理
    ├── 權限管理
    ├── 組織主檔
    ├── 審批流設定
    ├── 通知設定
    ├── 系統參數
    └── 系統稽核日誌
```

---

# 4. 首頁功能架構

首頁作為所有員工登入後的入口，主要由三大功能區組成：

```text
首頁
│
├── 個人
│
├── 主管
│
└── 資訊中心
```

---

# 5. 首頁 — 個人功能區

## 5.1 功能定位

個人功能區是所有員工都會使用的日常功能入口。

主要處理：

1. 個人通知
2. 薪資查詢
3. 出勤查詢
4. 出勤異常查詢
5. 請假申請
6. 加班申請
7. 補休申請
8. 登入紀錄查詢
9. 個人電子表單申請

---

## 5.2 個人功能結構

> **調整說明：**
> - 「個人中心」（通知、薪資明細）已移除：通知已整合至首頁快捷區；薪資明細暫不開放。
> - 「登入記錄」已移至資訊中心底下。

```text
個人
│
├── 考勤管理
│   ├── 打卡（上下班打卡 + 今日打卡時間，依線上打卡權限顯示）
│   ├── 出勤紀錄（日期查詢 + 缺卡補卡操作）
│   ├── 請假作業
│   └── 加班申請
│
└── 電子表單
    ├── 申請  → /home/forms/requests（頁面內以卡片列出所有可申請的表單類型）
    └── 簽核  → /home/forms/approvals（查看自己提交表單的審核進度）
```

---

## 5.3 個人中心

### 5.3.1 通知

通知用於顯示和目前登入員工有關的系統通知。

通知包含：

1. 簽核通知
2. 申請通過通知
3. 申請駁回通知
4. 出勤異常通知
5. 系統訊息通知
6. 公告通知

建議 Route：

```text
/home/personal/notifications
```

---

### 5.3.2 薪資明細

薪資明細用於讓員工查看自己的薪資資料。

功能包含：

1. 查看每月薪資明細
2. 查看應發項目
3. 查看應扣項目
4. 查看實發金額
5. 下載薪資明細 PDF，若後續需要支援

資料權限：

1. 一般員工只能查看自己的薪資明細
2. 主管不能因為主管身份查看下屬薪資
3. HR 後台薪資管理權限需獨立於員工個人薪資查詢權限

建議 Route：

```text
/home/personal/payslips
/home/personal/payslips/:periodId
```

---

# 6. 首頁 — 考勤管理

## 6.1 功能定位

首頁中的考勤管理是給員工查看與申請自己個人考勤相關事項。

此處不是 HR 後台出勤管理。

首頁考勤管理只處理：

1. 員工自己的線上打卡（上下班）
2. 員工自己的出勤紀錄查詢與補卡申請
3. 員工自己的請假申請
4. 員工自己的加班申請
5. 員工自己的補休申請

---

## 6.2 打卡

### 6.2.1 功能說明

打卡功能用於員工進行線上上下班打卡，並顯示今日打卡狀況。

功能包含：

1. 上班打卡按鈕
2. 下班打卡按鈕
3. 顯示今日上班打卡時間
4. 顯示今日下班打卡時間
5. 顯示打卡結果（成功 / 失敗原因）

> 此功能依 `home.attendance.online_clock.use` 權限控制，未開通線上打卡的員工不顯示此選單。

建議 Route：

```text
/home/attendance/clock
```

---

## 6.3 出勤紀錄

### 6.3.1 功能說明

出勤紀錄用於讓員工查詢自己的個人出勤狀況，支援日期範圍條件查詢。

查詢條件：

1. 開始日期
2. 結束日期（預設查詢當月）

可查詢資料包含：

1. 日期
2. 上班打卡時間
3. 下班打卡時間
4. 出勤狀態
5. 遲到狀態
6. 早退狀態
7. 請假狀態
8. 加班狀態
9. 資料來源

資料來源可能包含：

```text
生物辨識打卡系統
線上打卡
人工匯入
補卡申請
```

### 6.3.2 補卡操作

若某筆出勤紀錄**缺少上班卡或下班卡**，該列顯示「補卡」按鈕。

點擊「補卡」開啟補卡申請表單，填寫：

1. 補卡日期（預帶該筆資料日期）
2. 補卡類型：上班 / 下班
3. 補卡時間
4. 補卡原因
5. 附件（選填）

補卡申請送出後進入審批流程，可在同列或申請記錄中查看狀態（待審核 / 已批准 / 已拒絕）。

建議 Route：

```text
/home/attendance/records
```

---

## 6.5 請假作業

### 6.5.1 功能說明

請假作業用於員工申請各類假期與加班補休。

請假作業需支援：

1. 特休
2. 病假
3. 事假
4. 補休
5. 婚假
6. 喪假
7. 產假
8. 陪產假
9. 其他公司自訂假別

請假申請需接入共用審批流。

不同假別可對應不同審批線。

建議 Route：

```text
/home/attendance/leaves
/home/attendance/leaves/new
/home/attendance/leaves/:id
```

---

## 6.6 加班申請

### 6.6.1 功能說明

加班申請用於員工申請加班。

加班申請需包含：

1. 加班日期
2. 加班開始時間
3. 加班結束時間
4. 加班時數
5. 加班原因
6. 是否轉補休
7. 附件，若需要

加班申請需接入共用審批流。

建議 Route：

```text
/home/attendance/overtime
/home/attendance/overtime/new
/home/attendance/overtime/:id
```

---

# 7. 首頁 — 帳號管理

## 7.1 功能定位

首頁中的帳號管理是員工個人帳號使用紀錄查詢，不是系統管理員的帳號管理後台。

---

## 7.2 登入記錄查詢

### 7.2.1 功能說明

登入記錄查詢用於讓員工查看自己的登入紀錄。

顯示欄位包含：

1. 登入時間
2. 登入 IP
3. 登入裝置
4. 瀏覽器
5. 登入結果
6. 失敗原因，若有

資料權限：

1. 一般員工只能查看自己的登入紀錄
2. 系統管理員可在系統管理員模塊查看全系統登入紀錄

建議 Route：

```text
/home/account/login-logs
```

---

# 8. 首頁 — 電子表單

## 8.1 功能定位

電子表單是員工個人可以發起的各類申請單。

所有電子表單都應接入共用審批流。

不同電子表單可依表單類型配置不同審批線。

---

## 8.2 Menu 結構設計原則

電子表單**不在側欄展開各個表單類型**，而是以 2 個固定子選單呈現：

| 側欄項目 | 路由 | 說明 |
|----------|------|------|
| 申請 | `/home/forms/requests` | 頁面內以卡片格式列出所有可申請的表單類型 |
| 簽核 | `/home/forms/approvals` | 顯示員工自己提交的表單申請審核進度 |

> 新增表單類型只需在 `FormRequestsView.vue` 的 `formTypes` 陣列加入定義，無需新增路由或選單項目。

## 8.3 電子表單清單

目前 `oa_form_requests` 表支援以下 `formType`：

| formType | 顯示名稱 | 主要欄位 |
|----------|----------|----------|
| `purchase_request` | 採購申請 | 採購品項、數量、預估金額、供應商、預計交貨日期、採購原因 |
| `business_trip` | 出差申請 | 出差目的地、開始/結束日期、出差目的、預估差旅費、是否需住宿 |
| `asset_request` | OA資產申請單 | 資產類型、數量、預計使用日期、申請原因 |
| `meal_allowance` | 誤餐費申請 | 加班日期、加班時數、申請金額、備註 |
| `it_request` | 資訊需求申請 | 需求標題、需求描述、優先程度、期望完成日期 |
| `headcount_request` | 人力需求申請 | 職位名稱、招募人數、招募原因、期望到職日期 |
| `resignation` | 離職申請 | 預計離職日期、離職原因、交接備註 |

---

## 8.4 電子表單 Route（簡化後）

```text
/home/forms/requests                       申請（卡片選擇 + Dialog 填寫）
/home/forms/approvals                      簽核（我的申請審核進度）
```

> 舊設計中每種表單各自一條 route（如 `/home/forms/resignation/new`）已廢棄，改為 Dialog 方式在同一頁面操作。

```text
# 以下為廢棄路由（不再實作）
# /home/forms
# /home/forms/drafts
# /home/forms/my-submissions

# /home/forms/leave-without-pay/new
# /home/forms/leave-without-pay/:id

# /home/forms/resignation/new
# /home/forms/resignation/:id

# /home/forms/meal-allowance/new
/home/forms/meal-allowance/:id

/home/forms/it-request/new
/home/forms/it-request/:id

/home/forms/oa-asset-request/new
/home/forms/oa-asset-request/:id

/home/forms/manpower-request/new
/home/forms/manpower-request/:id
```

---

# 9. 首頁 — 主管功能區

## 9.1 功能定位

主管功能區是給主管或具備簽核權限的人員使用。

主管功能區不應假設所有員工都可看到。

雖然一般情況下主管職才會具備此功能，但系統需支援特例，例如：

1. 代理主管
2. 指定簽核人
3. 臨時加簽人
4. 跨部門審批人
5. 專案負責人

因此主管功能區應以權限控制，而不是只用職位判斷。

---

## 9.2 顯示規則

主管功能區顯示條件：

```text
使用者具備 module.home_manager.access 權限
或使用者具備任一簽核權限
或使用者目前存在待簽核任務
```

若使用者沒有主管功能權限，首頁不顯示主管功能區。

---

## 9.3 主管功能結構

```text
主管
│
└── 簽核
```

---

## 9.4 簽核 `/home/manager/approvals`

主管功能區僅提供一個「簽核」入口，進入後以 **Tab** 方式切換不同類型的待簽核區塊。

### Tab 清單

| Tab | 說明 | 對應 formType |
|-----|------|--------------|
| 請假簽核 | 員工請假申請待審列表 | `leave` |
| 補卡簽核 | 員工補卡申請待審列表 | `clock_patch` |
| 加班簽核 | 員工加班申請待審列表 | `overtime` |
| 電子表單簽核 | 各類電子表單待審列表 | `form` |

每個 Tab 標題顯示待審件數角標，讓主管快速得知各類待辦數量。

### 簽核作業共通規則

所有簽核作業都必須套入整套系統的共用審批線機制，不同類型的單據有不同審批線與邏輯。

簽核作業需支援：

1. 待簽核列表（依 Tab 類型顯示）
2. 單據詳情
3. 通過
4. 駁回
5. 填寫簽核意見（駁回時必填）
6. 查看審批流節點
7. 查看歷史簽核紀錄
8. 支援加簽（依權限允許）
9. 支援轉簽（依權限允許）
10. 支援抄送查看

建議 Route：

```text
/home/manager/approvals
/home/manager/approvals/:id
```

---

# 10. 首頁 — 資訊中心

## 10.1 功能定位

資訊中心是所有員工都可使用的資訊查詢區。

主要包含：

```text
公告
組織圖
系統訊息
登入記錄
```

---

## 10.2 公告

公告用於顯示公司公告、制度公告、人事公告、行政公告等資訊。

公告需支援：

1. 公告列表
2. 公告詳情
3. 公告分類
4. 附件下載
5. 公告已讀 / 未讀
6. 依公司、部門、角色、員工可見範圍控制

建議 Route：

```text
/home/info/announcements
/home/info/announcements/:id
```

---

## 10.3 組織圖

組織圖用於讓員工查詢公司組織架構。

可顯示：

1. 公司
2. 部門
3. 子部門
4. 主管
5. 部門成員
6. 職位

資料權限需依公司政策控制。

建議 Route：

```text
/home/info/org-chart
```

---

## 10.4 系統訊息

系統訊息用於顯示 OA 系統相關通知，例如：

1. 系統維護通知
2. 版本更新通知
3. 功能異動通知
4. 權限異動提醒
5. 重要系統公告

建議 Route：

```text
/home/info/system-messages
```

---

# 11. 首頁線上打卡功能

## 11.1 功能定位

首頁需要支援線上打卡上下班功能。

但目前公司主要使用生物辨識打卡系統，線上打卡只允許少數人使用，因此線上打卡功能必須可被開啟或關閉。

線上打卡功能不應對所有人預設顯示。

---

## 11.2 顯示規則

首頁線上打卡模塊顯示條件：

```text
系統啟用線上打卡功能
且目前登入員工被允許使用線上打卡
```

若條件不符合，首頁不顯示線上打卡模塊。

---

## 11.3 控制層級

線上打卡功能需支援以下控制層級：

| 控制層級 | 說明          |
| ---- | ----------- |
| 系統層級 | 是否啟用線上打卡功能  |
| 公司層級 | 某公司是否允許線上打卡 |
| 部門層級 | 某部門是否允許線上打卡 |
| 個人層級 | 某員工是否允許線上打卡 |

初版至少需要支援：

```text
個人層級開啟 / 關閉
```

後續可擴充公司、部門層級。

---

## 11.4 線上打卡功能

線上打卡需支援：

1. 上班打卡
2. 下班打卡
3. 顯示今日打卡狀態
4. 顯示今日上班時間
5. 顯示今日下班時間
6. 顯示打卡結果
7. 顯示打卡失敗原因
8. 記錄打卡 IP
9. 記錄打卡裝置
10. 記錄打卡來源為 online_clock

---

## 11.5 生物辨識打卡資料整合

目前每間公司主要使用生物辨識打卡系統。

生物辨識系統會在其他資料庫記錄員工出缺勤時間。

OA 系統需預留 API 整合能力，由 OA 後端呼叫外部系統 API 取得出勤資料。

整合原則：

1. OA 不直接操作生物辨識資料庫
2. OA 後端透過 API 或資料同步服務取得資料
3. 生物辨識系統為主要打卡來源
4. 線上打卡為例外補充機制
5. 出勤紀錄需標示資料來源

資料來源範例：

```text
biometric_clock
online_clock
manual_import
clock_patch
```

---

## 11.6 線上打卡管理設定

線上打卡開關應由後台管理功能控制。

建議放置於：

```text
人事模塊
└── 出勤管理
    └── 線上打卡設定
```

或：

```text
系統管理員模塊
└── 系統參數
    └── 線上打卡設定
```

建議初版放在人事模塊出勤管理，由 HR 或人事主管維護可使用線上打卡的人員名單。

---

# 12. 首頁 Route Prefix 建議

首頁相關功能統一使用 `/home` 作為前台員工入口。

```text
/home                                      首頁

/home/attendance/clock                     打卡（上下班 + 今日打卡時間）
/home/attendance/records                   出勤紀錄（含補卡操作）
/home/attendance/leaves                    請假作業
/home/attendance/leaves/new                新增請假
/home/attendance/leaves/:id                請假詳情
/home/attendance/overtime                  加班申請
/home/attendance/overtime/new              新增加班申請
/home/attendance/overtime/:id              加班申請詳情

/home/forms/requests                       申請（卡片選擇 + Dialog 填寫）
/home/forms/approvals                      簽核（我的申請審核進度）

/home/manager/approvals                    簽核（Tab 切換：請假/補卡/加班/電子表單）
/home/manager/approvals/:id                簽核詳情

/home/info/announcements                   公告
/home/info/announcements/:id               公告詳情
/home/info/org-chart                       組織圖
/home/info/system-messages                 系統訊息
/home/account/login-logs                   登入記錄（置於資訊中心底下）
```

---

# 13. 首頁權限設計建議

## 13.1 首頁基礎權限

所有員工預設具備：

```text
module.home.access
module.home_personal.access
module.home_info.access
```

---

## 13.2 個人功能權限

```text
home.personal.notification.view
home.personal.payslip.view_self

home.attendance.record.view_self
home.attendance.exception.view_self
home.attendance.leave.view_self
home.attendance.leave.create
home.attendance.overtime.view_self
home.attendance.overtime.create
home.attendance.comp_time.create

home.account.login_log.view_self

home.form.view_self
home.form.create
home.form.submit
home.form.cancel
```

---

## 13.3 主管功能權限

```text
module.home_manager.access        (主管功能區入口，含簽核頁面)
home.manager.approval.view        (查看待簽核列表)
home.manager.approval.approve     (執行簽核操作)
```

> 簽核頁面以 Tab 整合所有簽核類型（請假、補卡、加班、電子表單），不再分拆為獨立選單或獨立權限碼。

---

## 13.4 資訊中心權限

```text
home.info.announcement.view
home.info.org_chart.view
home.info.system_message.view
```

---

## 13.5 線上打卡權限

```text
home.attendance.online_clock.use
```

若使用者沒有此權限，首頁不顯示線上打卡模塊。

---

# 14. 後台管理模塊設計

後台管理模塊包含：

```text
人事模塊
財務模塊
行政模塊
系統管理員模塊
```

這些模塊不是一般員工日常使用功能，而是依權限開啟給特定人員。

---

# 15. 人事模塊

## 15.1 模塊定位

人事模塊是給 HR、人事主管、人事管理人員使用的後台管理模塊。

此模塊不等同於首頁的「個人」功能。

首頁個人功能是員工自助服務；人事模塊是 HR 後台管理。

---

## 15.2 人事模塊功能結構

```text
人事模塊
│
├── 員工管理
│   ├── 員工列表
│   ├── 新增員工
│   ├── 員工詳情
│   ├── 員工資料異動
│   ├── 入職管理
│   ├── 離職管理
│   └── 合約管理
│
├── 組織任職
│   ├── 員工組織歸屬
│   ├── 直屬主管設定
│   ├── 兼任部門設定
│   └── 任職異動紀錄
│
├── 出勤管理
│   ├── 出勤總覽
│   ├── 出勤異常管理
│   ├── 打卡資料查詢
│   ├── 生物辨識資料同步紀錄
│   ├── 補卡管理
│   ├── 線上打卡設定
│   ├── 班表設定
│   ├── 工作日曆
│   └── 國定假日設定
│
├── 假勤管理
│   ├── 請假管理
│   ├── 加班管理
│   ├── 補休管理
│   ├── 假別設定
│   ├── 假期政策
│   ├── 假期餘額管理
│   └── 假期餘額調整
│
├── 薪資管理
│   ├── 薪資結構
│   ├── 調薪紀錄
│   ├── 月度薪資計算
│   ├── 薪資確認
│   ├── 薪資發放
│   └── 薪資報表
│
└── 績效管理
    ├── 績效週期
    ├── 目標設定
    ├── 自評管理
    ├── 主管評核管理
    ├── 績效結果
    └── 績效報表
```

---

## 15.3 人事模塊 Route Prefix

```text
/hr
/hr/employees
/hr/onboarding
/hr/offboarding
/hr/org-assignments

/hr/attendance
/hr/attendance/overview
/hr/attendance/exceptions
/hr/attendance/clock-records
/hr/attendance/biometric-sync-logs
/hr/attendance/clock-patches
/hr/attendance/online-clock-settings
/hr/attendance/schedules
/hr/attendance/work-calendars
/hr/attendance/public-holidays

/hr/leaves
/hr/overtime
/hr/comp-time
/hr/leave-types
/hr/leave-policies
/hr/leave-balances
/hr/leave-balance-adjustments

/hr/payroll
/hr/payroll/salary-structures
/hr/payroll/salary-adjustments
/hr/payroll/periods
/hr/payroll/confirm
/hr/payroll/payments
/hr/payroll/reports

/hr/performance
/hr/performance/cycles
/hr/performance/goals
/hr/performance/self-reviews
/hr/performance/manager-reviews
/hr/performance/results
/hr/performance/reports
```

---

# 16. 財務模塊

## 16.1 模塊定位

財務模塊是給財務、會計、財務主管等人員使用的後台管理模塊。

一般員工不應看到完整財務模塊。

若一般員工需要申請誤餐費或其他費用，應透過首頁電子表單或財務相關申請入口發起，不直接進入財務後台。

---

## 16.2 財務模塊功能結構

```text
財務模塊
│
├── 採購申請管理
│   ├── 採購申請列表
│   ├── 採購申請詳情
│   ├── 採購申請審核
│   ├── 採購申請結案
│   └── 採購分攤明細
│
├── 費用報銷管理
│   ├── 報銷單列表
│   ├── 報銷單詳情
│   ├── 報銷審核
│   ├── 財務退件
│   └── 報銷紀錄
│
├── 付款管理
│   ├── 待付款清單
│   ├── 付款確認
│   ├── 付款憑證上傳
│   ├── 已付款紀錄
│   └── 付款狀態追蹤
│
├── 費用分攤
│   ├── 分攤金額追蹤
│   ├── 已報銷金額
│   ├── 剩餘可報銷金額
│   ├── 地區費用歸屬
│   ├── 公司費用歸屬
│   └── 專案費用歸屬
│
└── 財務報表
    ├── 採購申請報表
    ├── 報銷報表
    ├── 付款報表
    ├── 地區費用報表
    ├── 公司費用報表
    ├── 部門費用報表
    ├── 專案費用報表
    └── 報表匯出
```

---

## 16.3 財務模塊 Route Prefix

```text
/finance
/finance/purchase-requests
/finance/purchase-requests/:id
/finance/purchase-requests/approvals
/finance/purchase-requests/closing
/finance/purchase-allocations

/finance/reimbursements
/finance/reimbursements/:id
/finance/reimbursements/review
/finance/reimbursements/rejected
/finance/reimbursements/history

/finance/payments
/finance/payments/pending
/finance/payments/:id/confirm
/finance/payments/paid
/finance/payments/vouchers

/finance/allocations
/finance/allocations/tracking
/finance/allocations/regions
/finance/allocations/companies
/finance/allocations/projects

/finance/reports
/finance/reports/purchases
/finance/reports/reimbursements
/finance/reports/payments
/finance/reports/regions
/finance/reports/companies
/finance/reports/departments
/finance/reports/projects
```

---

# 17. 行政模塊

## 17.1 模塊定位

行政模塊是給行政、總務、行政主管等人員使用的後台管理模塊。

一般員工不應看到完整行政模塊。

若一般員工需要送出 OA 資產申請、資訊需求申請、用印申請、訪客申請等，應透過首頁電子表單或相關申請入口發起。

---

## 17.2 行政模塊功能結構

```text
行政模塊
│
├── 公告管理
│   ├── 公告列表
│   ├── 新增公告
│   ├── 公告分類
│   ├── 公告附件
│   ├── 公告發布
│   └── 公告閱讀紀錄
│
├── 公司資產管理
│   ├── 資產台帳
│   ├── 新增資產
│   ├── 資產詳情
│   ├── 資產分類
│   ├── 資產領用
│   ├── 資產歸還
│   ├── 資產轉移
│   ├── 資產維修
│   ├── 資產報廢
│   ├── 資產盤點
│   └── 資產報表
│
├── 行政申請管理
│   ├── OA 資產申請管理
│   ├── 用印申請管理
│   ├── 資訊需求申請管理
│   ├── 誤餐費申請管理
│   └── 其他行政申請管理
│
├── 訪客管理
│   ├── 訪客預約
│   ├── 訪客紀錄
│   ├── 訪客審核
│   └── 訪客報表
│
└── 會議室管理
    ├── 會議室列表
    ├── 會議室預約
    ├── 預約審核
    └── 會議室設定
```

---

## 17.3 行政模塊 Route Prefix

```text
/administration
/administration/announcements
/administration/announcements/new
/administration/announcements/:id
/administration/announcement-categories
/administration/announcement-read-logs

/administration/assets
/administration/assets/new
/administration/assets/:id
/administration/assets/categories
/administration/assets/assignments
/administration/assets/returns
/administration/assets/transfers
/administration/assets/repairs
/administration/assets/disposals
/administration/assets/inventory-checks
/administration/assets/reports

/administration/requests
/administration/requests/oa-asset
/administration/requests/seal
/administration/requests/it
/administration/requests/meal-allowance
/administration/requests/other

/administration/visitors
/administration/visitors/new
/administration/visitors/records
/administration/visitors/approvals
/administration/visitors/reports

/administration/meeting-rooms
/administration/meeting-rooms/bookings
/administration/meeting-rooms/approvals
/administration/meeting-rooms/settings
```

---

# 18. 系統管理員模塊

## 18.1 模塊定位

系統管理員模塊是給 IT、系統管理員、超級管理員使用的後台管理模塊。

此模塊負責：

1. 帳號管理
2. 角色管理
3. 權限管理
4. 組織主檔
5. 審批流設定
6. 系統參數
7. 系統稽核
8. 模塊開關設定

---

## 18.2 系統管理員模塊功能結構

```text
系統管理員模塊
│
├── 帳號管理
│   ├── 帳號列表
│   ├── 新增帳號
│   ├── 帳號詳情
│   ├── 啟用帳號
│   ├── 停用帳號
│   ├── 重置密碼
│   └── 登入紀錄
│
├── 角色權限
│   ├── 角色管理
│   ├── 權限管理
│   ├── 使用者角色
│   ├── 資料範圍設定
│   ├── 功能模塊權限
│   └── 權限檢查紀錄
│
├── 組織主檔
│   ├── 地區 / 國家管理
│   ├── 公司管理
│   ├── 部門管理
│   ├── 事業部管理
│   ├── 專案項目管理
│   ├── 職位管理
│   └── 職級管理
│
├── 審批流設定
│   ├── 審批流模板
│   ├── 審批節點設定
│   ├── 審批人設定
│   ├── 抄送人設定
│   ├── 表單類型綁定
│   └── 審批流版本紀錄
│
├── 模塊開關設定
│   ├── 首頁功能開關
│   ├── 線上打卡功能開關
│   ├── 人事模塊開關
│   ├── 財務模塊開關
│   ├── 行政模塊開關
│   └── 系統功能開關
│
├── 通知設定
│   ├── 站內通知
│   ├── Email 通知
│   ├── 通知模板
│   ├── 通知佇列
│   └── 通知發送紀錄
│
├── 系統參數
│   ├── 字典管理
│   ├── 幣別設定
│   ├── 時區設定
│   ├── 檔案上傳設定
│   └── 安全性設定
│
└── 系統稽核
    ├── 操作日誌
    ├── 登入日誌
    ├── 權限異動紀錄
    ├── 資料異動紀錄
    └── 系統錯誤紀錄
```

---

## 18.3 系統管理員模塊 Route Prefix

```text
/system
/system/users
/system/users/new
/system/users/:id
/system/users/:id/reset-password
/system/users/login-logs

/system/roles
/system/permissions
/system/user-roles
/system/data-scopes
/system/module-permissions
/system/permission-check-logs

/system/org/regions
/system/org/companies
/system/org/departments
/system/org/business-units
/system/org/projects
/system/org/positions
/system/org/job-levels

/system/workflows
/system/workflows/templates
/system/workflows/steps
/system/workflows/approvers
/system/workflows/cc-users
/system/workflows/form-bindings
/system/workflows/version-logs

/system/module-settings
/system/module-settings/home
/system/module-settings/online-clock
/system/module-settings/hr
/system/module-settings/finance
/system/module-settings/administration
/system/module-settings/system

/system/notifications
/system/notifications/templates
/system/notifications/queue
/system/notifications/logs

/system/settings
/system/settings/dictionaries
/system/settings/currencies
/system/settings/timezones
/system/settings/file-upload
/system/settings/security

/system/audit-logs
/system/audit-logs/operations
/system/audit-logs/login
/system/audit-logs/permissions
/system/audit-logs/data-changes
/system/audit-logs/errors
```

---

# 19. 首頁資料結構建議

首頁 API 不需要回傳所有後台資料，只需回傳和員工本人有關的摘要資訊。

建議 API：

```text
GET /api/home
```

建議 Response：

```ts
type HomeResponse = {
  currentUser: CurrentUser;
  onlineClock?: OnlineClockWidget;
  personal: PersonalHomeSection;
  manager?: ManagerHomeSection;
  infoCenter: InfoCenterSection;
  shortcuts: HomeShortcut[];
};
```

---

## 19.1 OnlineClockWidget

```ts
type OnlineClockWidget = {
  enabled: boolean;
  canUse: boolean;
  todayStatus?: {
    workDate: string;
    clockInTime?: string;
    clockOutTime?: string;
    source?: "biometric_clock" | "online_clock" | "manual_import" | "clock_patch";
    status: "not_clocked" | "working" | "completed" | "leave" | "absent" | "holiday";
  };
};
```

若 `enabled = false` 或 `canUse = false`，前端不顯示線上打卡模塊。

---

## 19.2 PersonalHomeSection

```ts
type PersonalHomeSection = {
  unreadNotificationCount: number;
  latestNotifications: NotificationItem[];
  latestPayslip?: PayslipSummary;

  attendanceSummary: {
    currentMonth: string;
    normalDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    absentDays: number;
    exceptionCount: number;
  };

  pendingApplications: {
    leaveCount: number;
    overtimeCount: number;
    formCount: number;
  };
};
```

---

## 19.3 ManagerHomeSection

```ts
type ManagerHomeSection = {
  enabled: boolean;
  pendingApprovalCounts: {
    leave: number;
    clockPatch: number;
    overtime: number;
    forms: number;
  };
};
```

---

## 19.4 InfoCenterSection

```ts
type InfoCenterSection = {
  latestAnnouncements: AnnouncementItem[];
  unreadSystemMessageCount: number;
};
```

---

## 19.5 HomeShortcut

```ts
type HomeShortcut = {
  key: string;
  name: string;
  route: string;
  icon?: string;
  badgeCount?: number;
  permissionCode?: string;
};
```

---

# 20. 選單資料結構建議

```ts
type MenuItem = {
  key: string;
  name: string;
  route?: string;
  icon?: string;
  permissionCode?: string;
  children?: MenuItem[];
  hiddenWhenNoPermission?: boolean;
  hiddenWhenNoChildren?: boolean;
};
```

---

## 20.1 首頁選單 Mock Data

```ts
export const homeMenu: MenuItem[] = [
  {
    key: "home",
    name: "首頁",
    route: "/home",
    icon: "home",
    permissionCode: "module.home.access",
    children: [
      {
        key: "home-personal",
        name: "個人",
        permissionCode: "module.home_personal.access",
        children: [
          {
            key: "home-attendance",
            name: "考勤管理",
            children: [
              {
                key: "home-attendance-clock",
                name: "打卡",
                route: "/home/attendance/clock",
                permissionCode: "home.attendance.online_clock.use",
                hiddenWhenNoPermission: true,
              },
              {
                key: "home-attendance-records",
                name: "出勤紀錄",
                route: "/home/attendance/records",
                permissionCode: "home.attendance.record.view_self",
              },
              {
                key: "home-leaves",
                name: "假期申請",
                route: "/home/attendance/leaves",
                permissionCode: "home.attendance.leave.view_self",
              },
              {
                key: "home-overtime",
                name: "加班申請",
                route: "/home/attendance/overtime",
                permissionCode: "home.attendance.overtime.view_self",
              },
            ],
          },
          {
            key: "home-forms",
            name: "電子表單",
            children: [
              {
                key: "home-forms-requests",
                name: "申請",
                route: "/home/forms/requests",
                permissionCode: "home.form.create",
                // 頁面內以卡片呈現所有表單類型（採購申請、出差申請、OA資產申請、誤餐費、資訊需求、人力需求、離職）
              },
              {
                key: "home-forms-approvals",
                name: "簽核",
                route: "/home/forms/approvals",
                permissionCode: "home.form.view_self",
                // 顯示員工自己提交的表單審核進度
              },
            ],
          },
        ],
      },
      {
        key: "home-manager",
        name: "主管",
        permissionCode: "module.home_manager.access",
        hiddenWhenNoPermission: true,
        children: [
          {
            key: "home-manager-approvals",
            name: "簽核",
            route: "/home/manager/approvals",
            permissionCode: "module.home_manager.access",
            // 進入頁面後以 Tab 切換：請假簽核 / 補卡簽核 / 加班簽核 / 電子表單簽核
          },
        ],
      },
      {
        key: "home-info",
        name: "資訊中心",
        permissionCode: "module.home_info.access",
        children: [
          {
            key: "home-announcements",
            name: "公告",
            route: "/home/info/announcements",
            permissionCode: "home.info.announcement.view",
          },
          {
            key: "home-org-chart",
            name: "組織圖",
            route: "/home/info/org-chart",
            permissionCode: "home.info.org_chart.view",
          },
          {
            key: "home-system-messages",
            name: "系統訊息",
            route: "/home/info/system-messages",
            permissionCode: "home.info.system_message.view",
          },
          {
            key: "home-login-logs",
            name: "登入記錄",
            route: "/home/account/login-logs",
            permissionCode: "home.account.login_log.view_self",
          },
        ],
      },
    ],
  },
];
```

---

# 21. 後台模塊選單 Mock Data

```ts
export const adminMenu: MenuItem[] = [
  {
    key: "hr",
    name: "人事模塊",
    route: "/hr",
    icon: "users",
    permissionCode: "module.hr.access",
    hiddenWhenNoPermission: true,
  },
  {
    key: "finance",
    name: "財務模塊",
    route: "/finance",
    icon: "wallet",
    permissionCode: "module.finance.access",
    hiddenWhenNoPermission: true,
  },
  {
    key: "administration",
    name: "行政模塊",
    route: "/administration",
    icon: "building",
    permissionCode: "module.administration.access",
    hiddenWhenNoPermission: true,
  },
  {
    key: "system",
    name: "系統管理員模塊",
    route: "/system",
    icon: "settings",
    permissionCode: "module.system.access",
    hiddenWhenNoPermission: true,
  },
];
```

---

# 22. 開發優先級建議

## Phase 1：首頁基礎功能

1. 首頁 Layout（左側 Menu 無白邊，填滿側欄）
2. 個人功能區
3. 資訊中心
4. 通知
5. 打卡（上下班 + 今日打卡時間）
6. 出勤紀錄（日期查詢 + 缺卡補卡按鈕）
7. 假期申請
8. 加班申請
9. 登入記錄查詢
10. 公告
11. 系統訊息

---

## Phase 2：我的通知、薪資與外部打卡整合

1. 我的通知
2. 我的薪資明細
3. 個人線上打卡開關設定
4. 生物辨識打卡 API 整合
5. 出勤資料來源標示
6. 出勤資料同步紀錄
7. 組織圖

---

## Phase 3：主管功能

1. 主管功能權限控制
2. 簽核頁面（Tab 整合：請假 / 補卡 / 加班 / 電子表單）
3. 審批流串接

---

## Phase 4：電子表單

1. 留職停薪申請單
2. 離職申請單
3. 誤餐費申請
4. 資訊需求申請單
5. OA 資產申請單
6. 人力需求表單
7. 表單審批流設定

---

## Phase 5：後台管理模塊

1. 人事模塊
2. 財務模塊
3. 行政模塊
4. 系統管理員模塊
5. 模塊權限開關
6. 模塊選單權限控制

---

# 23. Claude Code 整理指示

請依照本文件重新整理目前 OA 系統既有 Markdown 文件。

整理時請注意：

1. 將「儀表板 Dashboard」統一改名為「首頁」。

2. 首頁是每個員工登入後的入口，以員工日常操作為主。

3. 首頁內基礎功能分成：

   * 個人
   * 主管
   * 資訊中心

4. 個人功能包含：

   * 通知
   * 薪資明細
   * 打卡（上下班 + 今日打卡時間，依線上打卡權限顯示）
   * 出勤紀錄（日期查詢 + 缺卡補卡操作，無獨立的異常補卡選單）
   * 假期申請
   * 加班申請
   * 登入記錄查詢
   * 電子表單

5. 主管功能包含一個「簽核」入口，進入後以 Tab 切換：

   * 請假簽核 Tab
   * 補卡簽核 Tab
   * 加班簽核 Tab
   * 電子表單簽核 Tab

6. 資訊中心包含：

   * 公告
   * 組織圖
   * 系統訊息

7. 主管功能需要權限控管，不可單純用職位判斷。

8. 首頁需要支援線上打卡模塊，但線上打卡需可被開啟或關閉。

9. 線上打卡需支援個人層級開啟 / 關閉。若關閉，首頁不顯示線上打卡模塊。

10. 生物辨識打卡系統是主要出勤資料來源，OA 系統需預留 API 整合能力取得出勤紀錄。

11. 人事模塊、財務模塊、行政模塊、系統管理員模塊是後台管理模塊，不是一般員工日常入口。

12. 人事模塊請以 HR / 人事主管視角設計。

13. 財務模塊請以財務 / 會計 / 財務主管視角設計。

14. 行政模塊請以行政 / 總務 / 行政主管視角設計。

15. 系統管理員模塊請以 IT / 系統管理員 / 超級管理員視角設計。

16. 保留既有技術棧、資料庫設計、共用審批流、權限模型與 GCP 部署規劃，不要重寫底層架構。

17. 最後輸出一份乾淨、結構化、可直接作為開發依據的 Markdown。

---

# 24. 最終結論

本次調整後，OA 系統功能定位如下：

```text
首頁：
所有員工登入後的入口，以個人日常功能、主管簽核、資訊中心為主。

個人：
員工自己的通知、薪資、出勤、請假、加班、登入紀錄、電子表單。

主管：
依權限顯示的簽核功能，處理請假、補卡、加班、電子表單簽核。

資訊中心：
公告、組織圖、系統訊息。

人事模塊：
HR / 人事主管使用的後台管理模塊。

財務模塊：
財務 / 會計 / 財務主管使用的後台管理模塊。

行政模塊：
行政 / 總務 / 行政主管使用的後台管理模塊。

系統管理員模塊：
IT / 系統管理員 / 超級管理員使用的系統管理後台。
```

首頁應保持精簡，不應將人事、財務、行政、系統管理後台內容全部塞入首頁。

一般員工最常用的是首頁內的個人功能與資訊中心；具備主管權限的人額外看到主管簽核；具備後台角色的人，才額外看到人事、財務、行政或系統管理員模塊。
