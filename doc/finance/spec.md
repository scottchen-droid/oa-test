# 財務模塊 (Finance Module) — 功能規格

## 模塊概述

財務模塊是後端管理入口，供財務人員管理採購申請、費用報銷審核、付款確認及財務報表。員工在「首頁 > 電子表單」填寫申請，財務在此模塊進行後段管理。

**Route 前綴：** `/finance`
**權限碼：** `module.finance.access`
**可見對象：** 具備財務模塊角色的使用者 + `isSuperAdmin`

---

## 路由結構

```
/finance/purchase-requests   採購申請管理
/finance/reimbursements      費用報銷審核
/finance/payments            付款管理
/finance/allocations         費用分攤管理
/finance/reports             財務報表
```

---

## 一、採購申請管理 `/finance/purchase-requests`

### 功能概述
財務人員查看全公司所有採購申請，追蹤審批狀態，管理費用分攤設定。

### 列表頁
**篩選：** 申請人、公司、部門、狀態（草稿/待審核/審核中/已批准/已拒絕/已取消）、日期範圍、金額區間

**欄位：**
- 申請單號（自動生成，格式：`PR-YYYYMM-XXXX`）
- 申請人（工號、姓名）
- 申請標題
- 總金額
- 申請公司/部門
- 提交日期
- 當前審批狀態
- 當前審批人
- 操作

**統計卡（頁面頂部）：**
- 本月申請總數
- 待審核數量
- 本月審批金額
- 本月已付款金額

### 申請詳情
- 採購品項清單（品名、數量、單價、小計）
- 費用分攤設定（多公司/部門分攤比例）
- 附件清單
- 審批流程時間軸
- 審批意見記錄

### 費用分攤（`purchase_request_allocations`）
每筆採購申請可分攤至多個公司/部門：
```
allocation_items: [{
  companyId, departmentId, businessUnitId?, projectId?,
  allocationAmount, allocationPercent, description
}]
```

### API
```
GET  /api/purchase-requests?status=&applicantId=&companyId=&deptId=&dateFrom=&dateTo=&page=1
GET  /api/purchase-requests/:id
GET  /api/purchase-requests/:id/allocations
PUT  /api/purchase-requests/:id/allocations
GET  /api/purchase-requests/stats?month=2026-05
```

---

## 二、費用報銷申請（電子表單入口）

### 適用範圍

費用報銷申請用於報銷以下兩類原始申請單產生的實際費用：

| 來源 | 說明 | 限制 |
|------|------|------|
| **採購申請** | 採購物品/服務後報銷實際支出 | 每個分攤項目可被多張報銷單報銷，累計金額 ≤ 分攤金額 |
| **出差申請** | 出差產生的差旅費用報銷 | 累計報銷金額 ≤ 出差申請預算 |

> 誤餐費、加班費等屬於員工福利補貼，不適用費用報銷單，走「誤餐費申請」獨立流程。

### 費用報銷單 Schema 設計

```
ReimbursementRequest:
  reimbursementNo         報銷單號（RE-YYYYMM-XXXX）
  purchaseRequestId       關聯採購申請（可選）
  purchaseAllocationId    關聯採購分攤項目（可選，鎖定到具體事業部/項目）
  businessTripFormId      關聯出差申請 OaFormRequest（可選）
  sourceFormType          來源類型：purchase_request | business_trip
  currencyCode            報銷基礎幣別（與原始申請相同）
  totalAmount             報銷總金額（所有 items.amount 加總）
  bankName/AccountNo/Name 收款資訊
  status                  draft | submitted | approved | rejected | paid | canceled

ReimbursementItem:
  originalCurrencyCode    收據幣別（實際花費幣別，如 THB/JPY/TWD）
  originalAmount          收據金額
  exchangeRateId          使用的匯率記錄 ID
  exchangeRateSnapshot    匯率快照（提交時鎖定）
  amount                  換算後基礎幣別金額 = originalAmount × exchangeRateSnapshot
  currencyCode            基礎幣別（與 ReimbursementRequest.currencyCode 相同）
  expenseType             meal | transport | accommodation | purchase | visa | communication | other
  expenseDate             消費日期
  vendorName              商家名稱
  invoiceNo               發票/收據號碼
```

### 多幣別費用設計

員工在出差/採購中可能有多幣別費用（如台幣訂房 + 泰銖當地交通），但報銷時換算為申請時使用的基礎幣別（如 CNY）。

**換算流程：**
1. 員工填寫原始幣別 + 金額（如 5,000 THB 交通費）
2. 點「查詢匯率」，系統從 `exchange_rates` 表查詢消費日期最近的有效匯率
3. 系統自動計算換算金額（5,000 THB × 0.19 = 950 CNY）
4. 員工可手動覆蓋匯率（匯率不在系統內時）
5. 提交時，`exchangeRateSnapshot` 鎖定為提交時使用的匯率

**驗證規則：**
- `SUM(items.amount)` ≤ `purchaseAllocation.amount`（採購報銷）
- `SUM(items.amount)` ≤ `businessTrip.content.estimatedBudget`（出差報銷）

### 採購申請多事業部/項目的分攤報銷

當一筆採購申請分攤給多個事業部或項目時（`purchase_request_allocations` 多筆），**各事業部/項目需分別提交獨立的報銷單**，並指定 `purchaseAllocationId` 到自己的分攤項目。

```
PR-202506-0001 採購申請（總金額：100,000 CNY）
├─ 分攤項目 A（YL 項目）：40,000 CNY
│   └─ 報銷單 RE-202506-0001（YL 項目成員提交）
├─ 分攤項目 B（LY 項目）：35,000 CNY
│   └─ 報銷單 RE-202506-0002（LY 項目成員提交）
└─ 分攤項目 C（MP 項目）：25,000 CNY
    └─ 報銷單 RE-202506-0003（MP 項目成員提交）
```

### API（員工端）
```
GET  /api/reimbursements/my?status=&page=1        我的報銷單
POST /api/reimbursements                          新建草稿
PATCH /api/reimbursements/:id                     更新草稿
POST /api/reimbursements/:id/submit               送出審核（含金額驗證）
POST /api/reimbursements/:id/cancel               取消
GET  /api/exchange-rates/current?fromCurrency=THB&toCurrency=CNY&onDate=2026-06-01  查詢匯率
```

---

## 三、費用報銷審核 `/finance/reimbursements`（財務模塊）

### 功能概述
財務人員查看所有報銷申請，進行最終財務審核，確認金額後轉付款流程。

### 列表頁
**篩選：** 申請人、公司、部門、狀態（草稿/待審核/審核中/已批准/待付款/已付款/已拒絕）、日期範圍

**欄位：**
- 報銷單號（格式：`RE-YYYYMM-XXXX`）
- 申請人
- 報銷標題
- 報銷總金額
- 來源類型（採購申請/出差申請）
- 關聯申請單號
- 提交日期
- 狀態
- 操作

### 報銷詳情
- 報銷品項清單（費用類型、消費日期、原始幣別/金額、匯率、換算金額）
- 關聯採購申請分攤項目（顯示分攤金額 vs 已報銷金額）
- 收款資訊（銀行帳戶、開戶名）
- 附件（發票/收據）
- 審批流程時間軸

### 報銷與採購的關聯邏輯
- 一個採購分攤項目（`purchaseAllocationId`）對應多筆報銷
- 報銷金額累加不得超過分攤金額（後端在 submit 時驗證，並更新 `reimbursedAmount`）
- 財務可看到分攤項目的已報銷 / 未報銷金額

### API
```
GET  /api/reimbursements?status=&claimantUserId=&companyId=&purchaseRequestId=&page=1
GET  /api/reimbursements/:id
POST /api/reimbursements/:id/pay      (財務確認付款)
```

---

## 四、付款管理 `/finance/payments`

### 功能概述
財務確認已審核報銷的實際付款，記錄付款資訊，完成財務閉環。

### 待付款列表
- 顯示狀態為「待付款」的報銷申請
- 支援批量選取付款

### 付款確認
填寫付款資訊後標記為「已付款」：
- 付款日期
- 付款金額（可能與申請金額略有出入）
- 付款方式（銀行轉帳/支票/現金）
- 付款帳戶（公司帳戶）
- 轉帳水單附件
- 備註

### 付款記錄
- 已完成付款的歷史記錄
- 可按月份、公司、員工篩選
- 匯出付款清單（Excel，Phase 2）

### API
```
GET  /api/reimbursements?status=pending_payment&page=1
POST /api/payments                 { reimbursementId, paymentDate, amount, method, note, attachment }
GET  /api/payments?month=&companyId=&page=1
GET  /api/payments/:id
```

---

## 五、費用分攤管理 `/finance/allocations`

### 功能概述
財務管理採購申請的費用分攤，支援跨公司/部門的費用分攤追蹤。

### 功能項目
- 查看各公司/部門的費用分攤彙總
- 按月份/季度/年度統計分攤金額
- 追蹤分攤項目的報銷進度（已報銷/未報銷/部分報銷）
- 分攤明細匯出

### 分攤狀態
```
OPEN        → 已批准，可接受報銷
FULLY_PAID  → 分攤金額已全數報銷完畢
CANCELLED   → 分攤已取消（隨採購申請取消）
```

### API
```
GET  /api/finance/allocations?companyId=&deptId=&status=&month=
GET  /api/finance/allocations/:id
GET  /api/finance/allocations/summary?month=&companyId=
```

---

## 六、財務報表 `/finance/reports`

### 功能概述
提供財務相關統計報表，支援多維度分析。財務報表維度依據組織結構設計，涵蓋兩條組織線。

### 報表查詢維度

| 維度 | 欄位 | 說明 |
|------|------|------|
| 地區 | `regionId` | 辦公室組織線：地區維度 |
| 公司 | `companyId` | 辦公室組織線：發薪/費用主體 |
| 事業部 | `businessUnitId` | 集團業務線：事業部維度 |
| 項目 | `projectId` | 集團業務線：項目成本歸屬 |
| 部門 | `departmentId` | 費用/成本歸屬部門 |
| 員工 | `userId` | 個人費用 |
| 表單類型 | `formType` | 採購/報銷/薪資成本等 |
| 費用類型 | `expenseType` | 費用細項分類 |
| 月份 | `year+month` | 時間維度 |
| 幣別 | `currencyCode` | 多幣別支援 |

### 報表類型

**5.1 採購統計報表**
- 按月份、地區、公司、事業部、**項目**、部門、申請人統計採購金額
- 申請件數、審核通過率、平均審批時長

**5.2 報銷統計報表**
- 按月份、費用類別、地區、公司、**項目**、部門統計報銷金額
- 待付款金額、已付款金額

**5.3 費用分攤報表（採購）**
- 各公司/事業部/項目/部門實際承擔的費用分攤金額（`purchase_request_allocations`）
- 跨公司費用分攤明細

**5.4 薪資成本分攤報表**
- 依 `payroll_cost_allocation_snapshots` 彙整
- 按地區、公司、事業部、**項目**、部門分析薪資成本
- 支援月份篩選，快照已鎖定不受組織異動影響
- 用於項目成本核算、跨公司成本對帳

**5.5 付款流水報表**
- 月度付款明細
- 累計付款金額

### 報表操作
- 日期範圍篩選
- 地區/公司/事業部/項目/部門篩選
- 匯出 Excel（Phase 2）
- 圖表視覺化（Phase 2）

### API
```
GET /api/finance/reports/purchase-stats?year=&month=&regionId=&companyId=&projectId=&deptId=
GET /api/finance/reports/reimbursement-stats?year=&month=&regionId=&companyId=&projectId=
GET /api/finance/reports/allocation-summary?year=&companyId=&projectId=
GET /api/finance/reports/payroll-cost?periodId=&regionId=&companyId=&businessUnitId=&projectId=
GET /api/finance/reports/payment-flow?year=&month=
```

---

## 申請單號自動生成規則

| 類型 | 格式 | 範例 |
|------|------|------|
| 採購申請 | `PR-YYYYMM-XXXX` | `PR-202605-0001` |
| 費用報銷 | `RE-YYYYMM-XXXX` | `RE-202605-0001` |

序號按月歸零，每月從 `0001` 開始。後端在 `submit` 時生成（草稿不佔序號）。

---

## 審批流程設計

### 採購申請審批流程（示例）
```
員工提交 → 直屬主管審核 → 部門主管審核（金額 > 5萬）→ 財務複核 → 完成
```

### 費用報銷審批流程（示例）
```
員工提交 → 直屬主管審核 → 財務審核 → 付款確認
```

審批流程由「系統模塊 > 審批流設定」配置（`approval_templates`），支援金額閾值分支、多人會簽等。

---

## 關鍵業務規則

1. **報銷不得超過採購分攤金額** — 後端在 `submit` 時驗證 `SUM(reimbursement_items.amount) ≤ allocation_item.allocationAmount`
2. **採購申請取消後分攤失效** — 對應 `allocation_items` 狀態設為 `CANCELLED`
3. **金額以 `NUMERIC(18,2)` 儲存** — 禁止使用浮點數計算
4. **跨公司費用** — 一筆採購可分攤至多個公司，每間公司各別出報銷單

---

## 開發優先順序

| Phase | 功能 |
|-------|------|
| Phase 1 | 採購申請管理（列表 + 詳情）、報銷審核 |
| Phase 2 | 付款管理（確認付款 + 歷史記錄） |
| Phase 3 | 費用分攤管理、基礎財務報表 |
| Phase 4 | 進階報表（圖表 + 匯出 Excel） |
