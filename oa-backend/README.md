# OA Backend

企業級 OA（辦公自動化）系統後端服務，基於 NestJS + Prisma + PostgreSQL 構建，提供財務、人事、行政、系統管理等模組的 RESTful API。

---

## 技術棧

| 類別 | 技術 |
|------|------|
| 執行環境 | Node.js 20 |
| 框架 | NestJS 10 |
| 語言 | TypeScript 5 |
| ORM | Prisma 5 |
| 資料庫 | PostgreSQL（GCP Cloud SQL） |
| 認證 | JWT（Access Token 15m + Refresh Token 7d） |
| 物件儲存 | GCP Cloud Storage（Signed URL） |
| 文件 | Swagger / OpenAPI |
| 容器化 | Docker（Multi-stage Build） |

---

## 專案結構

```
oa-backend/
├── src/
│   ├── admin/               # 系統初始化、超管 Bootstrap
│   ├── announcements/       # 公告管理
│   ├── approvals/           # 共用審批流程引擎
│   ├── attendance/          # 出勤記錄、打卡
│   ├── audit-logs/          # 系統操作稽核日誌
│   ├── auth/                # 登入、登出、JWT 策略
│   │   ├── dto/
│   │   └── strategies/
│   ├── common/              # 共用工具
│   │   ├── decorators/      # @Public、@CurrentUser、@Roles
│   │   ├── filters/         # HTTP 例外過濾器
│   │   ├── guards/          # JWT 守衛、Role 守衛
│   │   └── interceptors/    # 統一回應格式包裝
│   ├── config/              # 環境設定（ConfigModule）
│   ├── dashboard/           # Dashboard 統計資料
│   ├── employees/           # 員工主檔管理
│   ├── forms/               # 電子表單
│   ├── leaves/              # 請假管理
│   ├── organizations/       # 組織主檔（地區/公司/部門/職位）
│   ├── overtime/            # 加班申請
│   ├── payroll/             # 薪資計算
│   ├── performance/         # 績效管理
│   ├── prisma/              # Prisma Service / Module
│   ├── purchase-requests/   # 採購申請單
│   ├── reimbursements/      # 費用報銷單
│   ├── roles/               # 角色與權限管理
│   ├── users/               # 帳號管理
│   ├── app.module.ts        # 根模組
│   └── main.ts              # 應用程式進入點
├── prisma/
│   └── schema.prisma        # 47 張資料表定義
├── scripts/
│   └── create-super-admin.ts
├── .env.example
├── Dockerfile
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## 架構設計

### 安全模型

所有路由預設需要 JWT 認證（全域 `JwtAuthGuard`），僅加上 `@Public()` 裝飾器的端點可公開存取。

```
請求 → JwtAuthGuard → RolesGuard → Controller → Service → Prisma → DB
```

### 統一回應格式

`TransformInterceptor` 自動包裝所有回應：

```json
{
  "success": true,
  "data": { ... },
  "message": "ok",
  "timestamp": "2026-06-01T00:00:00.000Z"
}
```

### 審批流程引擎

所有單據類型（採購申請、報銷、請假、加班）共用同一套引擎，以 `form_type` 欄位區分。提交時快照審批模板，模板異動不影響進行中的流程。

### 資料庫規範

- 金額欄位：`NUMERIC(18,2)`
- 主鍵：UUID
- 時間：UTC 儲存，前端自行轉換時區
- 敏感欄位（身分證、護照、銀行帳號）：應用層加密後入庫

---

## 本地啟動指南

### 環境需求

- Node.js >= 20
- PostgreSQL >= 14（或 Docker）
- npm >= 9

### 1. 安裝依賴

```bash
cd oa-backend
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`，至少設定以下項目：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/oa?schema=public"
JWT_SECRET=your-32-char-secret-here
JWT_REFRESH_SECRET=your-another-32-char-secret
ENCRYPTION_KEY=12345678901234567890123456789012
CORS_ORIGIN=http://localhost:5173
```

### 3. 建立資料庫並執行 Migration

```bash
# 建立資料庫（若尚未建立）
createdb oa

# 執行 Prisma migration（建立所有資料表）
npm run prisma:migrate:dev

# ⚠ 若 dev server 正在執行，先停止後再跑以下指令
npm run prisma:generate
```

### 4. 植入初始資料（Seed）

```bash
npx prisma db seed
```

Seed 會自動建立：
- 全部權限（41 項）與預設角色（7 個），`ADMIN` 角色自動取得所有權限
- 初始管理員帳號：`admin@oa.com` / `!Aa123456`
- 5 個地區（台灣、日本、香港、新加坡、菲律賓）、5 間公司
- 集團業務組織線：5 個事業部（第一事業部/第二事業部/研發中心/中心策/項目管理中心）、4 個項目（YL/LY/KX/MP）、18 個部門
- 20 位員工（含完整的地區/公司/事業部/項目/部門雙線歸屬）
- OrganizationLeader：事業部負責人、項目負責人、部門主管
- 13 種表單類型各一套 3 步驟審批模板（直屬主管→部門主管→項目負責人）
- 8 筆測試電子表單（涵蓋請假/加班/出差/採購/報銷/誤餐費/IT需求/人力需求），含完整事業部/項目/部門歸屬（供財務報表查詢）
- 員工成本分攤範例（Amy Liu：MP 70%、YL 30%）
- 薪資結構：20 位員工各一筆（TWD/JPY/HKD/PHP）
- 薪資期別 2026-05（paid）含 20 筆薪資紀錄與薪資成本分攤快照（供各事業部薪資成本分析）

### 5. 啟動開發伺服器

```bash
npm run start:dev
```

服務啟動後：
- API Base URL：`http://localhost:8080`
- Swagger 文件：`http://localhost:8080/api/docs`
- 初始登入：工號 `00001` 或 Email `admin@oa.com`，密碼 `!Aa123456`

---

## 常用指令

```bash
# 開發模式（熱重載）
npm run start:dev

# 正式模式
npm run build && npm run start:prod

# Prisma 相關
npm run prisma:generate          # 重新產生 Client 型別（需先停止 dev server）
npm run prisma:migrate:dev       # 建立並套用新 migration
npm run prisma:migrate:deploy    # 套用既有 migration（生產環境）
npm run prisma:studio            # 開啟 Prisma Studio GUI
npx prisma db seed               # 重新植入初始資料

# 型別檢查
npx tsc --noEmit
```

---

## Docker 部署

```bash
# 建構映像
docker build -t oa-backend .

# 執行容器
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e JWT_REFRESH_SECRET="..." \
  -e ENCRYPTION_KEY="..." \
  oa-backend
```

---

## 環境變數說明

| 變數 | 說明 | 範例 |
|------|------|------|
| `NODE_ENV` | 執行環境 | `development` / `production` |
| `PORT` | 監聽埠 | `8080` |
| `DATABASE_URL` | PostgreSQL 連線字串 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Access Token 簽名密鑰 | 32 字元以上隨機字串 |
| `JWT_REFRESH_SECRET` | Refresh Token 簽名密鑰 | 32 字元以上隨機字串 |
| `JWT_EXPIRES_IN` | Access Token 有效期 | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 有效期 | `7d` |
| `ENCRYPTION_KEY` | 敏感欄位加密金鑰 | 必須恰好 32 字元 |
| `GCP_PROJECT_ID` | GCP 專案 ID | `my-project-123` |
| `GCS_BUCKET_NAME` | Cloud Storage Bucket | `oa-attachments` |
| `CORS_ORIGIN` | 前端來源（CORS） | `http://localhost:5173` |
| `SMTP_HOST` | Email SMTP 主機 | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP 埠 | `587` |
| `SMTP_USER` | SMTP 帳號 | `noreply@example.com` |
| `SMTP_PASS` | SMTP 密碼 | — |
| `FRONTEND_URL` | 前端網址（重設密碼信件用） | `http://localhost:5173` |
