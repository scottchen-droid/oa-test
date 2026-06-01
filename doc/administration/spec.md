# 行政模塊 (Administration Module) — 功能規格

## 模塊概述

行政模塊是後端管理入口，供行政人員管理公司公告發布、資產追蹤、行政申請、訪客管理及會議室預訂。

**Route 前綴：** `/administration`
**權限碼：** `module.administration.access`
**可見對象：** 具備行政模塊角色的使用者 + `isSuperAdmin`

---

## 路由結構

```
/administration/announcements    公告管理
/administration/assets           公司資產管理
/administration/requests         行政申請管理
/administration/visitors         訪客管理
/administration/meeting-rooms    會議室管理
```

---

## 一、公告管理 `/administration/announcements`

### 功能概述
行政人員建立和管理全公司公告，控制公告對象（全員/特定公司/部門）、置頂設定及發布排程。

### 公告列表
**篩選：** 發布狀態（草稿/已發布/已下架）、分類、日期範圍、建立者
**欄位：** 標題、分類、類型、發布對象、置頂、發布時間、狀態、已讀人數、操作

### 公告分類與類型
**分類（category）：**
- 人資公告（HR）
- 行政公告（Admin）
- IT 公告
- 財務公告
- 業務公告

**類型（type）：**
- 一般公告
- 制度文件
- 緊急通知

### 新增/編輯公告
**欄位：**
- 標題（必填）
- 分類（必填）
- 類型
- 內容（富文字編輯器，Phase 2；目前使用 `<textarea>`）
- 發布對象：全員 / 指定公司 / 指定部門 / 指定人員
- 置頂：是/否（置頂到期日）
- 附件（PDF、圖片等）
- 標籤（自定義 tags）
- 發布時間：立即發布 / 排程發布（指定日期時間）

### 已讀統計
- 查看公告已讀/未讀員工清單
- 已讀率百分比
- 可發送「催讀通知」給未讀員工（Phase 2）

### API
```
GET    /api/announcements?status=&category=&page=1
GET    /api/announcements/:id
POST   /api/announcements
PUT    /api/announcements/:id
DELETE /api/announcements/:id
POST   /api/announcements/:id/publish    (立即發布)
POST   /api/announcements/:id/unpublish  (下架)
GET    /api/announcements/:id/read-stats
```

---

## 二、公司資產管理 `/administration/assets`

### 功能概述
追蹤公司財產（電腦、設備、家具等）的購置、配發、轉讓、維修和報廢全生命週期。

### 資產列表
**篩選：** 資產類別、狀態（閒置/在用/維修中/報廢）、所屬公司/部門、領用人
**欄位：** 資產編號、資產名稱、類別、品牌/型號、序號、所屬公司、部門、領用人、購入日期、狀態

### 資產類別
- 資訊設備（電腦、螢幕、手機、平板）
- 辦公家具（桌椅、櫃子）
- 通訊設備（電話、對講機）
- 交通工具（車輛）
- 其他設備

### 資產詳情
- 基本資訊（名稱、類別、品牌、型號、序號、條碼）
- 財務資訊（購入金額、購入日期、折舊方式、殘值）
- 目前狀態（誰在使用、所在地點）
- 異動記錄（配發/轉讓/維修/歸還歷程）
- 附件（發票、保固書）

### 資產操作
| 操作 | 說明 |
|------|------|
| 配發 | 將閒置資產配發給員工/部門 |
| 歸還 | 員工歸還資產，變回閒置 |
| 轉讓 | 資產從一個部門/員工轉給另一個 |
| 維修 | 送修記錄，標記資產狀態為「維修中」 |
| 報廢 | 標記資產為報廢狀態 |

### API
```
GET    /api/assets?status=&category=&companyId=&deptId=&page=1
GET    /api/assets/:id
POST   /api/assets
PUT    /api/assets/:id
DELETE /api/assets/:id  (軟刪除)
POST   /api/assets/:id/assign   { userId, deptId, location, note }
POST   /api/assets/:id/return   { note }
POST   /api/assets/:id/transfer { toUserId?, toDeptId?, note }
POST   /api/assets/:id/maintain { description, estimatedReturnDate }
POST   /api/assets/:id/retire   { reason }
GET    /api/assets/:id/history
```

---

## 三、行政申請管理 `/administration/requests`

### 功能概述
處理員工提交的行政相關申請，如辦公用品申請、名片申請、門禁申請等。

### 申請類型
- 辦公用品申請
- 名片印製申請
- 門禁/系統權限申請
- 員工識別證申請
- 停車位申請

### 申請列表
**篩選：** 申請類型、狀態（待處理/處理中/已完成/已拒絕）、申請人、日期

### 申請詳情
- 申請內容（依類型不同有不同欄位）
- 處理進度追蹤
- 行政人員備註
- 完成確認

### API
```
GET  /api/admin-requests?type=&status=&page=1
GET  /api/admin-requests/:id
PUT  /api/admin-requests/:id/process  { status, note }
PUT  /api/admin-requests/:id/complete { note, attachments[] }
```

---

## 四、訪客管理 `/administration/visitors`

### 功能概述
登記訪客資訊，管理訪客進出記錄，支援電子簽到（Phase 2）。

### 訪客登記
**欄位：**
- 訪客姓名
- 訪客公司
- 訪客身份（廠商/客戶/求職者/其他）
- 被訪人員（員工）
- 訪問目的
- 預計到訪時間
- 攜帶設備（筆電等，資安記錄）
- 訪客照片（Phase 2）

### 訪客記錄
- 進廠時間、離廠時間
- 訪客名牌號碼（如有）
- 訪問紀錄歷史

### API
```
GET  /api/visitors?date=&status=&page=1
POST /api/visitors          { name, company, visiteeId, purpose, expectedArrival, equipments[] }
PUT  /api/visitors/:id/checkin   { badgeNo? }
PUT  /api/visitors/:id/checkout
GET  /api/visitors/:id
```

---

## 五、會議室管理 `/administration/meeting-rooms`

### 功能概述
管理公司會議室資源，支援預訂、衝突检測、設備管理。

### 會議室設定
**欄位：** 會議室名稱、所在樓層/位置、容納人數、設備清單（投影機/白板/視訊設備）、是否可預訂

### 預訂功能
- 月曆式視圖顯示各會議室使用情況
- 預訂：選擇會議室 + 日期 + 時段 + 主題 + 參與人員
- 衝突自動偵測（後端驗證，時段重疊則拒絕）
- 重複預訂（每週重複，Phase 2）
- 預訂確認通知（Email + 系統通知）
- 取消預訂

### 管理功能
- 審批特殊申請（大型會議室需要審批，Phase 2）
- 會議室使用率統計
- 設備維修管理

### API
```
GET  /api/meeting-rooms
POST /api/meeting-rooms
PUT  /api/meeting-rooms/:id
GET  /api/meeting-rooms/:id/bookings?date=
POST /api/meeting-rooms/:id/bookings  { title, startTime, endTime, attendees[] }
PUT  /api/meeting-rooms/bookings/:id/cancel
GET  /api/meeting-rooms/bookings?roomId=&month=
```

---

## 關鍵業務規則

1. **公告發布對象** — 發布後員工端立即可見（或排程時間到後可見）
2. **資產編號唯一** — 系統自動生成，格式：`AST-YYYY-XXXX`
3. **會議室預訂衝突** — 同一會議室同一時段只能有一筆有效預訂，後端加樂觀鎖
4. **資產配發記錄** — 所有配發/歸還/轉讓操作都記錄到 `asset_histories`

---

## 開發優先順序

| Phase | 功能 |
|-------|------|
| Phase 1 | 公告管理（完整 CRUD + 發布）、資產管理（基礎 CRUD） |
| Phase 2 | 資產操作（配發/歸還/維修/報廢）、行政申請管理 |
| Phase 3 | 訪客管理 |
| Phase 4 | 會議室管理（預訂 + 月曆視圖） |
