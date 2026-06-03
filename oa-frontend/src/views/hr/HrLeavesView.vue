<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('nav.hrLeaves') }}</h2>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 請假申請列表 -->
      <el-tab-pane :label="$t('attendance.leaveRequest')" name="requests">
        <el-card>
          <div class="toolbar">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              :start-placeholder="$t('common.startDate')"
              :end-placeholder="$t('common.endDate')"
              value-format="YYYY-MM-DD"
              style="width: 260px"
              @change="onSearch"
            />
            <el-select v-model="leaveTypeFilter" :placeholder="$t('attendance.leaveType')" clearable style="width: 160px" @change="onSearch">
              <el-option v-for="t in leaveTypes" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
            <el-select v-model="statusFilter" :placeholder="$t('common.filter')" clearable style="width: 140px" @change="onSearch">
              <el-option label="草稿" value="draft" />
              <el-option label="審核中" value="submitted" />
              <el-option label="核准" value="approved" />
              <el-option label="駁回" value="rejected" />
              <el-option label="取消" value="canceled" />
            </el-select>
          </div>

          <el-table v-loading="loading" :data="data" border stripe>
            <el-table-column label="員工姓名" width="120">
              <template #default="{ row }">{{ row.user?.displayName ?? '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('attendance.leaveType')" width="120">
              <template #default="{ row }">{{ row.leaveType?.name ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="起訖日期" width="200">
              <template #default="{ row }">{{ formatDate(row.startDate) }} ~ {{ formatDate(row.endDate) }}</template>
            </el-table-column>
            <el-table-column prop="totalDays" :label="$t('attendance.totalDays')" width="80" />
            <el-table-column prop="reason" label="事由" show-overflow-tooltip />
            <el-table-column :label="$t('common.status')" width="100">
              <template #default="{ row }">
                <el-tag :type="leaveTagType(row.status)" size="small">{{ leaveLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.actions')" width="160" fixed="right">
              <template #default="{ row }">
                <template v-if="row.status === 'submitted'">
                  <el-button size="small" type="success" @click="handleApprove(row)">核准</el-button>
                  <el-button size="small" type="danger" @click="handleRejectPrompt(row)">駁回</el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-if="total > 0"
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :total="total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            class="pagination"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </el-card>
      </el-tab-pane>

      <!-- 假期餘額 -->
      <el-tab-pane label="假期餘額" name="balances">
        <el-card>
          <div class="toolbar">
            <el-input v-model="balanceSearch" :placeholder="$t('common.search')" clearable style="width: 220px" @change="loadBalances" />
            <el-date-picker v-model="balanceYear" type="year" placeholder="年份" value-format="YYYY" style="width: 140px" @change="loadBalances" />
          </div>
          <el-table v-loading="balanceLoading" :data="balances" border stripe>
            <el-table-column label="員工" width="140">
              <template #default="{ row }">{{ row.user?.displayName ?? '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('attendance.leaveType')" width="100">
              <template #default="{ row }">{{ row.leaveType?.name ?? '—' }}</template>
            </el-table-column>
            <el-table-column prop="year" label="年度" width="80" />
            <el-table-column label="應給" width="80">
              <template #default="{ row }">{{ row.entitledDays }}</template>
            </el-table-column>
            <el-table-column label="遞延" width="80">
              <template #default="{ row }">{{ row.carryOverDays }}</template>
            </el-table-column>
            <el-table-column label="調整" width="80">
              <template #default="{ row }">{{ row.adjustedDays }}</template>
            </el-table-column>
            <el-table-column label="已用" width="80">
              <template #default="{ row }">{{ row.usedDays }}</template>
            </el-table-column>
            <el-table-column label="待審" width="80">
              <template #default="{ row }">{{ row.pendingDays }}</template>
            </el-table-column>
            <el-table-column label="剩餘" width="80">
              <template #default="{ row }">
                {{ (Number(row.entitledDays) + Number(row.carryOverDays) + Number(row.adjustedDays) - Number(row.usedDays) - Number(row.pendingDays)).toFixed(1) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 假別設定 -->
      <el-tab-pane label="假別設定" name="types">
        <el-card>
          <el-table :data="leaveTypes" border stripe>
            <el-table-column prop="code" label="代碼" width="120" />
            <el-table-column prop="name" label="假別名稱" width="120" />
            <el-table-column label="需審核" width="90">
              <template #default="{ row }">
                <el-tag :type="row.requiresApproval ? 'warning' : 'success'" size="small">{{ row.requiresApproval ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="支薪" width="80">
              <template #default="{ row }">
                <el-tag :type="row.isPaid ? 'success' : 'info'" size="small">{{ row.isPaid ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="年度假" width="90">
              <template #default="{ row }">{{ row.isAnnual ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column prop="description" label="說明" show-overflow-tooltip />
            <el-table-column :label="$t('common.status')" width="80">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">{{ row.isActive ? $t('status.active') : $t('status.inactive') }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- Reject Dialog -->
    <el-dialog v-model="rejectDialogVisible" title="駁回請假申請" width="400px">
      <el-form>
        <el-form-item label="駁回原因">
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="請輸入駁回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="danger" :loading="actionLoading" @click="confirmReject">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { leavesApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const { t } = useI18n()
const activeTab = ref('requests')
const dateRange = ref<[string, string] | null>(null)
const leaveTypeFilter = ref('')
const statusFilter = ref('')
const leaveTypes = ref<any[]>([])

const balanceSearch = ref('')
const balanceYear = ref(String(new Date().getFullYear()))
const balances = ref<any[]>([])
const balanceLoading = ref(false)

const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const rejectTarget = ref<any>(null)
const actionLoading = ref(false)

const { loading, data, total, pagination, fetch, handlePageChange, handleSizeChange } = useTable<any>({
  fetchFn: (params) => leavesApi.getAll(params as any),
})

onMounted(async () => {
  ui.setBreadcrumbs([{ title: t('nav.hrModule') }, { title: t('nav.hrLeaves') }])
  try {
    const result = await leavesApi.getTypes()
    leaveTypes.value = result?.items ?? result ?? []
  } catch {
    leaveTypes.value = []
  }
  fetch()
  loadBalances()
})

function onSearch() {
  pagination.page = 1
  const [startDate, endDate] = dateRange.value ?? [undefined, undefined]
  fetch({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    leaveTypeId: leaveTypeFilter.value || undefined,
    status: statusFilter.value || undefined,
  })
}

async function loadBalances() {
  balanceLoading.value = true
  try {
    const result = await leavesApi.getBalances({ year: balanceYear.value ? Number(balanceYear.value) : undefined })
    balances.value = result?.items ?? result ?? []
  } catch {
    balances.value = []
    ElMessage.error(t('msg.loadFailed'))
  } finally {
    balanceLoading.value = false
  }
}

async function handleApprove(row: any) {
  actionLoading.value = true
  try {
    await leavesApi.approve(row.id)
    ElMessage.success(t('msg.approveSuccess'))
    fetch()
    loadBalances()
  } catch {
    ElMessage.error(t('msg.operationFailed'))
  } finally {
    actionLoading.value = false
  }
}

function handleRejectPrompt(row: any) {
  rejectTarget.value = row
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('請輸入駁回原因')
    return
  }
  actionLoading.value = true
  try {
    await leavesApi.reject(rejectTarget.value.id, rejectReason.value)
    ElMessage.success(t('msg.rejectSuccess'))
    rejectDialogVisible.value = false
    fetch()
    loadBalances()
  } catch {
    ElMessage.error(t('msg.operationFailed'))
  } finally {
    actionLoading.value = false
  }
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  return iso.slice(0, 10)
}

function leaveLabel(status: string): string {
  const map: Record<string, string> = { draft: '草稿', submitted: '審核中', approved: '核准', rejected: '駁回', canceled: '取消' }
  return map[status] ?? status
}

function leaveTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    draft: 'info', submitted: 'warning', approved: 'success', rejected: 'danger', canceled: 'info',
  }
  return map[status] ?? 'info'
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
