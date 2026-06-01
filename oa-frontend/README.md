# OA Frontend

企業級 OA（辦公自動化）系統前端應用，基於 Vue 3 + TypeScript + Element Plus 構建，涵蓋人事、財務、行政、系統管理等完整模組介面。

---

## 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | Vue 3（Composition API） |
| 語言 | TypeScript 5 |
| 建構工具 | Vite 5 |
| UI 元件庫 | Element Plus 2 |
| 狀態管理 | Pinia 2 |
| 路由 | Vue Router 4 |
| HTTP 客戶端 | Axios |
| 日期處理 | Day.js |
| 容器化 | Docker（Nginx） |

---

## 專案結構

```
oa-frontend/
├── src/
│   ├── api/                     # API 呼叫層
│   │   ├── client.ts            # Axios 實例（攔截器、Token 注入）
│   │   ├── auth.api.ts
│   │   ├── dashboard.api.ts
│   │   ├── employees.api.ts
│   │   ├── finance.api.ts
│   │   ├── hr.api.ts
│   │   ├── organizations.api.ts
│   │   ├── roles.api.ts
│   │   ├── users.api.ts
│   │   ├── approvals.api.ts
│   │   ├── forms.api.ts
│   │   └── admin.api.ts
│   ├── composables/             # 可複用 Composition Functions
│   │   ├── useForm.ts           # 表單狀態管理
│   │   └── useTable.ts          # 表格分頁、排序
│   ├── layout/
│   │   └── AppLayout.vue        # 主版面（側邊欄 + 頁首）
│   ├── router/
│   │   └── index.ts             # Vue Router 設定（46 條路由）
│   ├── stores/                  # Pinia 狀態儲存
│   │   ├── auth.store.ts        # 認證狀態（Token、使用者資訊）
│   │   └── ui.store.ts          # UI 狀態（選單收合、主題）
│   ├── types/
│   │   └── index.ts             # 全域 TypeScript 型別定義
│   ├── views/                   # 頁面元件
│   │   ├── auth/                # 登入、忘記密碼、重設密碼
│   │   ├── dashboard/           # Dashboard 首頁
│   │   ├── home/                # 員工自助服務
│   │   │   ├── attendance/      # 打卡、出勤記錄
│   │   │   ├── leaves/          # 請假申請
│   │   │   ├── overtime/        # 加班申請
│   │   │   ├── forms/           # 表單申請 / 審批
│   │   │   └── manager/         # 主管審批
│   │   ├── hr/                  # 人事模組
│   │   │   ├── employees/       # 員工管理
│   │   │   ├── attendance/      # 出勤管理
│   │   │   ├── leaves/          # 假勤管理
│   │   │   ├── payroll/         # 薪資管理
│   │   │   └── performance/     # 績效管理
│   │   ├── finance/             # 財務模組
│   │   │   ├── purchase-requests/
│   │   │   ├── reimbursements/
│   │   │   ├── payments/
│   │   │   └── reports/
│   │   ├── admin/               # 系統管理模組
│   │   │   ├── users/           # 帳號管理
│   │   │   ├── roles/           # 角色與權限
│   │   │   ├── org/             # 組織管理（地區/公司/部門）
│   │   │   ├── workflows/       # 審批流程範本
│   │   │   └── audit-logs/      # 稽核日誌
│   │   ├── announcements/       # 公告管理
│   │   └── common/              # 共用佔位頁面
│   ├── App.vue                  # 根元件
│   └── main.ts                  # 應用程式進入點
├── Dockerfile                   # Nginx 生產部署
├── nginx.conf                   # SPA 路由設定
├── index.html
├── .env.example
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 架構設計

### 路由守衛

路由分為兩類：

| 類型 | 範例路徑 | 說明 |
|------|----------|------|
| 公開路由 | `/login`、`/forgot-password` | 無需認證 |
| 受保護路由 | `/home`、`/hr/*`、`/finance/*` | 需要有效 JWT |

首次進入受保護路由時會自動拉取使用者資訊；未登入則重導向至 `/login`。首次啟動系統時會檢查是否需要 Bootstrap（`/setup`）。

### 模組導覽結構

```
AppLayout（側邊欄 + 頂部導航）
├── 首頁（員工自助）
│   ├── 打卡 / 出勤記錄
│   ├── 請假 / 加班申請
│   └── 表單申請 / 主管審批
├── 人事模組（HR）
├── 財務模組（Finance）
├── 行政模組（Administration）
└── 系統模組（System）
    ├── 帳號 / 角色管理
    ├── 組織架構
    └── 審批流程範本
```

### API 層設計

`src/api/client.ts` 建立統一的 Axios 實例，負責：
- 自動在請求 Header 注入 JWT Token
- 統一處理 `401 Unauthorized`（清除 Token 並導向登入）
- 統一錯誤訊息提示

### 狀態管理

| Store | 責任 |
|-------|------|
| `auth.store.ts` | Access Token、使用者資訊、角色權限、登入/登出 |
| `ui.store.ts` | 側邊欄展開/收合、載入狀態 |

---

## 本地啟動指南

### 環境需求

- Node.js >= 20
- npm >= 9
- 後端服務已啟動（預設 `http://localhost:8080`）

### 1. 安裝依賴

```bash
cd oa-frontend
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`：

```env
VITE_API_BASE_URL=http://localhost:8080
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

應用程式啟動後預設開啟於：`http://localhost:5173`

---

## 常用指令

```bash
# 開發模式（Vite HMR）
npm run dev

# 型別檢查
npm run type-check

# 建構生產版本
npm run build

# 預覽生產建構結果
npm run preview
```

---

## Docker 部署

```bash
# 建構映像（需傳入後端 API URL）
docker build \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  -t oa-frontend .

# 執行容器
docker run -p 8080:8080 oa-frontend
```

> 注意：`VITE_API_BASE_URL` 是 Build Time 變數，需在建構階段傳入，執行期無法修改。

---

## 環境變數說明

| 變數 | 說明 | 範例 |
|------|------|------|
| `VITE_API_BASE_URL` | 後端 API Base URL | `http://localhost:8080` |
| `NODE_ENV` | 執行環境 | `development` / `production` |

---

## 開發注意事項

- 所有 API 呼叫集中在 `src/api/` 目錄，禁止在 Vue 元件內直接使用 Axios
- 頁面邏輯使用 Composition API（`<script setup>`），避免 Options API
- 全域型別定義放在 `src/types/index.ts`，避免散落各檔
- 可複用的邏輯（分頁、表單狀態）封裝成 `composables/`
