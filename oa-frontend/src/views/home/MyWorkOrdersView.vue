<template>
  <div>
    <div class="page-header">
      <h2>我的工作單</h2>
    </div>

    <!-- 狀態 Tab 篩選 -->
    <el-tabs v-model="activeStatus" class="status-tabs" @tab-change="loadOrders">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="待處理" name="pending" />
      <el-tab-pane label="處理中" name="processing" />
      <el-tab-pane label="已完成" name="completed" />
      <el-tab-pane label="無法處理" name="failed" />
      <el-tab-pane label="已退回" name="returned" />
    </el-tabs>

    <el-table v-loading="loading" :data="orders" border>
      <el-table-column label="資源項目" min-width="130">
        <template #default="{ row }">{{ row.resourceItem?.name }}</template>
      </el-table-column>
      <el-table-column label="申請對象" min-width="120">
        <template #default="{ row }">
          {{ row.request?.targetUser?.displayName }}
          <span class="emp-no">{{ row.request?.targetUser?.employeeNo }}</span>
        </template>
      </el-table-column>
      <el-table-column label="申請類型" width="110">
        <template #default="{ row }">
          <el-tag :type="requestTypeTag(row.request?.requestType)" size="small">
            {{ REQUEST_TYPE_LABELS[row.request?.requestType] ?? row.request?.requestType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="狀態" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">
            {{ STATUS_LABELS[row.status] ?? row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="處理群組" min-width="120">
        <template #default="{ row }">{{ row.workOrderGroup?.name ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="建立時間" width="160">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分頁 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadOrders"
      />
    </div>

    <!-- 工作單詳情 Dialog -->
    <el-dialog
      v-model="detailVisible"
      :title="activeOrder ? `工作單詳情 — ${activeOrder.resourceItem?.name}` : '工作單詳情'"
      width="680px"
      :close-on-click-modal="false"
      @closed="closeDetail"
    >
      <template v-if="activeOrder">
        <!-- 基本資訊 -->
        <el-descriptions :column="2" border size="small" class="info-desc">
          <el-descriptions-item label="資源項目">{{ activeOrder.resourceItem?.name }}</el-descriptions-item>
          <el-descriptions-item label="申請對象">
            {{ activeOrder.request?.targetUser?.displayName }}（{{ activeOrder.request?.targetUser?.employeeNo }}）
          </el-descriptions-item>
          <el-descriptions-item label="申請類型">
            <el-tag :type="requestTypeTag(activeOrder.request?.requestType)" size="small">
              {{ REQUEST_TYPE_LABELS[activeOrder.request?.requestType] ?? '' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="狀態">
            <el-tag :type="statusTag(activeOrder.status)" size="small">
              {{ STATUS_LABELS[activeOrder.status] ?? activeOrder.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="處理群組">{{ activeOrder.workOrderGroup?.name ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="建立時間">{{ formatDate(activeOrder.createdAt) }}</el-descriptions-item>
          <el-descriptions-item v-if="activeOrder.dispatchErrorMsg" label="派發錯誤" :span="2">
            <span class="error-text">{{ activeOrder.dispatchErrorMsg }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 操作按鈕 -->
        <div class="action-row">
          <el-button
            v-if="activeOrder.status === 'pending'"
            type="primary"
            :loading="actioning"
            @click="handleStart"
          >
            開始處理
          </el-button>
          <template v-if="activeOrder.status === 'processing'">
            <el-button type="success" :loading="actioning" @click="openCompleteDialog">完成</el-button>
            <el-button type="danger" :loading="actioning" @click="openReasonDialog('fail')">標記失敗</el-button>
            <el-button type="warning" :loading="actioning" @click="openReasonDialog('return')">退回</el-button>
          </template>
          <el-button :loading="actioning" @click="openNoteDialog">補充備註</el-button>
        </div>

        <!-- 操作歷史 -->
        <div class="history-section">
          <div class="section-title">操作歷史</div>
          <el-timeline v-if="activeOrder.histories?.length">
            <el-timeline-item
              v-for="h in activeOrder.histories"
              :key="h.id"
              :timestamp="formatDate(h.createdAt)"
              placement="top"
            >
              <div class="history-item">
                <span class="history-operator">{{ h.operatorUser?.displayName }}</span>
                <span class="history-action">{{ h.action }}</span>
                <span v-if="h.fromStatus && h.toStatus" class="history-status">
                  {{ STATUS_LABELS[h.fromStatus] ?? h.fromStatus }} → {{ STATUS_LABELS[h.toStatus] ?? h.toStatus }}
                </span>
                <div v-if="h.content" class="history-content">{{ h.content }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="尚無操作記錄" :image-size="60" />
        </div>
      </template>

      <template #footer>
        <el-button @click="detailVisible = false">關閉</el-button>
      </template>
    </el-dialog>

    <!-- 完成 Dialog -->
    <el-dialog
      v-model="completeDialogVisible"
      title="完成工作單"
      width="480px"
      :close-on-click-modal="false"
    >
      <template v-if="activeOrder?.resourceItem?.requiresAccountFill">
        <p class="hint-text">此資源項目需要回填帳號資訊：</p>
        <el-form :model="completeForm" label-width="90px">
          <el-form-item label="帳號/卡號">
            <el-input v-model="completeForm.account" placeholder="請輸入帳號或卡號" />
          </el-form-item>
          <el-form-item label="分機">
            <el-input v-model="completeForm.extension" placeholder="分機號碼（選填）" />
          </el-form-item>
          <el-form-item label="Email">
            <el-input v-model="completeForm.email" placeholder="Email（選填）" />
          </el-form-item>
          <el-form-item label="已啟用">
            <el-switch v-model="completeForm.isActivated" />
          </el-form-item>
        </el-form>
      </template>
      <p v-else>確定要將此工作單標記為已完成？</p>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actioning" @click="handleComplete">確認完成</el-button>
      </template>
    </el-dialog>

    <!-- 原因輸入 Dialog（失敗/退回） -->
    <el-dialog
      v-model="reasonDialogVisible"
      :title="reasonDialogType === 'fail' ? '標記失敗' : '退回工作單'"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form>
        <el-form-item label="原因" label-width="50px">
          <el-input
            v-model="reasonText"
            type="textarea"
            :rows="4"
            :placeholder="reasonDialogType === 'fail' ? '請說明無法處理的原因' : '請說明退回原因'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reasonDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actioning" @click="handleReasonSubmit">確認</el-button>
      </template>
    </el-dialog>

    <!-- 備註 Dialog -->
    <el-dialog
      v-model="noteDialogVisible"
      title="補充備註"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form>
        <el-form-item label="備註" label-width="50px">
          <el-input v-model="noteText" type="textarea" :rows="4" placeholder="請輸入備註內容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="noteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actioning" @click="handleAddNote">送出備註</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { workOrdersApi, type WorkOrder } from '@/api/work-orders.api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
ui.setBreadcrumbs([{ title: '工作單中心' }, { title: '我的工作單' }])

const STATUS_LABELS: Record<string, string> = {
  pending_dispatch: '待派發',
  dispatch_error: '派發異常',
  pending: '待處理',
  processing: '處理中',
  completed: '已完成',
  failed: '無法處理',
  returned: '已退回',
  canceled: '已取消',
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  onboard: '入職開通',
  add: '在職新增',
  change: '在職變更',
  offboard: '離職回收',
}

function statusTag(status: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending_dispatch: 'info',
    dispatch_error: 'danger',
    pending: 'warning',
    processing: '',
    completed: 'success',
    failed: 'danger',
    returned: 'warning',
    canceled: 'info',
  }
  return map[status] ?? 'info'
}

function requestTypeTag(type: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    onboard: 'success',
    add: '',
    change: 'warning',
    offboard: 'danger',
  }
  return map[type] ?? 'info'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('zh-TW', { hour12: false })
}

// ─── 列表狀態 ─────────────────────────────────────────────────────────────────
const loading = ref(false)
const orders = ref<WorkOrder[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const activeStatus = ref('')

async function loadOrders() {
  loading.value = true
  try {
    const result = await workOrdersApi.getMine({
      status: activeStatus.value || undefined,
      page: currentPage.value,
      limit: pageSize.value,
    })
    orders.value = result.items
    total.value = result.total
  } catch {
    ElMessage.error('載入工作單失敗')
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)

// ─── 詳情 Dialog ──────────────────────────────────────────────────────────────
const detailVisible = ref(false)
const activeOrder = ref<WorkOrder | null>(null)
const actioning = ref(false)

function openDetail(row: WorkOrder) {
  activeOrder.value = { ...row }
  detailVisible.value = true
}

function closeDetail() {
  activeOrder.value = null
}

// ─── 開始處理 ─────────────────────────────────────────────────────────────────
async function handleStart() {
  if (!activeOrder.value) return
  actioning.value = true
  try {
    const updated = await workOrdersApi.start(activeOrder.value.id)
    activeOrder.value = updated
    await loadOrders()
    ElMessage.success('已開始處理')
  } catch {
    ElMessage.error('操作失敗')
  } finally {
    actioning.value = false
  }
}

// ─── 完成 Dialog ──────────────────────────────────────────────────────────────
const completeDialogVisible = ref(false)
const completeForm = ref({ account: '', extension: '', email: '', isActivated: false })

function openCompleteDialog() {
  completeForm.value = { account: '', extension: '', email: '', isActivated: false }
  completeDialogVisible.value = true
}

async function handleComplete() {
  if (!activeOrder.value) return
  actioning.value = true
  try {
    let resultData: Record<string, string> | undefined
    if (activeOrder.value.resourceItem?.requiresAccountFill) {
      resultData = {
        account: completeForm.value.account,
        extension: completeForm.value.extension,
        email: completeForm.value.email,
        isActivated: String(completeForm.value.isActivated),
      }
    }
    const updated = await workOrdersApi.complete(activeOrder.value.id, resultData)
    activeOrder.value = updated
    completeDialogVisible.value = false
    await loadOrders()
    ElMessage.success('工作單已完成')
  } catch {
    ElMessage.error('操作失敗')
  } finally {
    actioning.value = false
  }
}

// ─── 失敗/退回 Dialog ─────────────────────────────────────────────────────────
const reasonDialogVisible = ref(false)
const reasonDialogType = ref<'fail' | 'return'>('fail')
const reasonText = ref('')

function openReasonDialog(type: 'fail' | 'return') {
  reasonDialogType.value = type
  reasonText.value = ''
  reasonDialogVisible.value = true
}

async function handleReasonSubmit() {
  if (!activeOrder.value) return
  if (!reasonText.value.trim()) {
    ElMessage.warning('請輸入原因')
    return
  }
  actioning.value = true
  try {
    let updated: WorkOrder
    if (reasonDialogType.value === 'fail') {
      updated = await workOrdersApi.fail(activeOrder.value.id, reasonText.value.trim())
    } else {
      updated = await workOrdersApi.return(activeOrder.value.id, reasonText.value.trim())
    }
    activeOrder.value = updated
    reasonDialogVisible.value = false
    await loadOrders()
    ElMessage.success('操作成功')
  } catch {
    ElMessage.error('操作失敗')
  } finally {
    actioning.value = false
  }
}

// ─── 備註 Dialog ──────────────────────────────────────────────────────────────
const noteDialogVisible = ref(false)
const noteText = ref('')

function openNoteDialog() {
  noteText.value = ''
  noteDialogVisible.value = true
}

async function handleAddNote() {
  if (!activeOrder.value) return
  if (!noteText.value.trim()) {
    ElMessage.warning('請輸入備註內容')
    return
  }
  actioning.value = true
  try {
    const updated = await workOrdersApi.addNote(activeOrder.value.id, noteText.value.trim())
    activeOrder.value = updated
    noteDialogVisible.value = false
    ElMessage.success('備註已新增')
  } catch {
    ElMessage.error('操作失敗')
  } finally {
    actioning.value = false
  }
}
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }

.status-tabs { margin-bottom: 16px; }

.emp-no { color: #909399; font-size: 12px; margin-left: 4px; }

.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; }

.info-desc { margin-bottom: 16px; }

.action-row {
  margin: 16px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.history-section { margin-top: 16px; }

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.history-item { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }

.history-operator { font-weight: 600; color: #303133; }

.history-action { color: #409eff; }

.history-status { color: #909399; font-size: 12px; }

.history-content {
  width: 100%;
  margin-top: 4px;
  font-size: 13px;
  color: #606266;
  background: #f5f7fa;
  padding: 6px 10px;
  border-radius: 4px;
}

.error-text { color: #f56c6c; }

.hint-text { color: #606266; margin-bottom: 12px; }
</style>
