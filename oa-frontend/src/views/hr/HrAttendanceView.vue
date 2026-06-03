<template>
  <div>
    <div class="page-header">
      <h2>出勤管理</h2>
    </div>

    <el-tabs v-model="activeTab">
      <!-- ── 出勤記錄 ── -->
      <el-tab-pane label="出勤記錄" name="records">
        <el-card>
          <div class="toolbar">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="開始日期"
              end-placeholder="結束日期"
              value-format="YYYY-MM-DD"
              style="width: 260px"
              @change="onRecordSearch"
            />
            <el-input v-model="userSearch" placeholder="搜尋員工姓名" clearable style="width: 200px" @change="onRecordSearch" />
            <el-select v-model="recordStatus" placeholder="狀態" clearable style="width: 140px" @change="onRecordSearch">
              <el-option label="正常" value="normal" />
              <el-option label="遲到" value="late" />
              <el-option label="缺勤" value="absent" />
              <el-option label="請假" value="leave" />
            </el-select>
          </div>
          <el-table v-loading="recordLoading" :data="recordData" border stripe>
            <el-table-column label="員工" width="120">
              <template #default="{ row }">{{ row.user?.displayName ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="日期" width="120">
              <template #default="{ row }">{{ fmtDate(row.workDate) }}</template>
            </el-table-column>
            <el-table-column label="上班" width="100">
              <template #default="{ row }">{{ row.actualClockIn ? fmtTime(row.actualClockIn) : '—' }}</template>
            </el-table-column>
            <el-table-column label="下班" width="100">
              <template #default="{ row }">{{ row.actualClockOut ? fmtTime(row.actualClockOut) : '—' }}</template>
            </el-table-column>
            <el-table-column label="工時" width="100">
              <template #default="{ row }">{{ fmtMinutes(row.workMinutes) }}</template>
            </el-table-column>
            <el-table-column label="遲到(分)" prop="lateMinutes" width="90" />
            <el-table-column label="狀態" width="90">
              <template #default="{ row }">
                <el-tag :type="attendanceTagType(row.status)" size="small">{{ attendanceLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination v-if="recordTotal > 0" v-model:current-page="recordPage" v-model:page-size="recordLimit"
            :total="recordTotal" layout="total, prev, pager, next" class="pagination"
            @current-change="onRecordSearch" @size-change="onRecordSearch" />
        </el-card>
      </el-tab-pane>

      <!-- ── 補卡申請 ── -->
      <el-tab-pane label="補卡申請" name="patches">
        <el-card>
          <div class="toolbar">
            <el-date-picker v-model="patchMonth" type="month" placeholder="月份篩選" value-format="YYYY-MM" style="width:140px" clearable @change="onPatchSearch" />
            <el-select v-model="patchStatus" placeholder="狀態" clearable style="width:140px" @change="onPatchSearch">
              <el-option label="待審核" value="pending" />
              <el-option label="已核准" value="approved" />
              <el-option label="已駁回" value="rejected" />
            </el-select>
            <el-checkbox v-model="patchIncludeDeleted" @change="onPatchSearch">顯示已刪除</el-checkbox>
          </div>
          <el-table v-loading="patchLoading" :data="patchData" border stripe :row-class-name="deletedRowClass">
            <el-table-column label="員工" width="120">
              <template #default="{ row }">{{ row.user?.displayName ?? '—' }}</template>
            </el-table-column>
            <el-table-column prop="patchRequestNo" label="補卡單號" width="150" />
            <el-table-column label="類型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.clockType === 'clock_in' ? 'success' : 'warning'" size="small">
                  {{ row.clockType === 'clock_in' ? '上班補卡' : '下班補卡' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="補卡日期時間" width="160">
              <template #default="{ row }">{{ fmtDateTime(row.clockTime) }}</template>
            </el-table-column>
            <el-table-column prop="manualReason" label="原因" show-overflow-tooltip />
            <el-table-column label="狀態" width="120">
              <template #default="{ row }">
                <el-tag :type="patchTagType(row.patchStatus)" size="small">{{ patchStatusLabel(row.patchStatus) }}</el-tag>
                <el-tag v-if="row.deletedAt" type="danger" size="small" style="margin-left:4px">已刪除</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <template v-if="row.patchStatus === 'pending' && !row.deletedAt">
                  <el-button size="small" type="success" @click="approvePatch(row)">核准</el-button>
                  <el-button size="small" type="danger" @click="openRejectPatch(row)">駁回</el-button>
                </template>
                <template v-else-if="row.rejectedReason">
                  <el-tooltip :content="row.rejectedReason" placement="top">
                    <el-button size="small" text type="info">駁回原因</el-button>
                  </el-tooltip>
                </template>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination v-if="patchTotal > 0" v-model:current-page="patchPage" v-model:page-size="patchLimit"
            :total="patchTotal" layout="total, prev, pager, next" class="pagination"
            @current-change="onPatchSearch" @size-change="onPatchSearch" />
        </el-card>
      </el-tab-pane>

      <!-- ── 加班申請 ── -->
      <el-tab-pane label="加班申請" name="overtime">
        <el-card>
          <div class="toolbar">
            <el-date-picker v-model="otMonth" type="month" placeholder="月份篩選" value-format="YYYY-MM" style="width:140px" clearable @change="onOtSearch" />
            <el-select v-model="otStatus" placeholder="狀態" clearable style="width:140px" @change="onOtSearch">
              <el-option label="待審核" value="submitted" />
              <el-option label="已核准" value="approved" />
              <el-option label="已駁回" value="rejected" />
            </el-select>
            <el-checkbox v-model="otIncludeDeleted" @change="onOtSearch">顯示已刪除</el-checkbox>
          </div>
          <el-table v-loading="otLoading" :data="otData" border stripe :row-class-name="deletedOtRowClass">
            <el-table-column label="員工" width="120">
              <template #default="{ row }">{{ row.user?.displayName ?? '—' }}</template>
            </el-table-column>
            <el-table-column prop="requestNo" label="申請單號" width="160" />
            <el-table-column label="加班日期" width="110">
              <template #default="{ row }">{{ fmtDate(row.overtimeDate) }}</template>
            </el-table-column>
            <el-table-column label="時間" width="130">
              <template #default="{ row }">{{ fmtTime(row.startTime) }} ~ {{ fmtTime(row.endTime) }}</template>
            </el-table-column>
            <el-table-column prop="totalHours" label="時數" width="70" />
            <el-table-column label="類型" width="90">
              <template #default="{ row }">{{ otTypeLabel(row.overtimeType) }}</template>
            </el-table-column>
            <el-table-column label="補償" width="80">
              <template #default="{ row }">{{ compLabel(row.compensationType) }}</template>
            </el-table-column>
            <el-table-column label="狀態" width="120">
              <template #default="{ row }">
                <el-tag :type="otTagType(row.status)" size="small">{{ otStatusLabel(row.status) }}</el-tag>
                <el-tag v-if="row.deletedAt" type="danger" size="small" style="margin-left:4px">已刪除</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <template v-if="row.status === 'submitted' && !row.deletedAt">
                  <el-button size="small" type="success" @click="approveOt(row)">核准</el-button>
                  <el-button size="small" type="danger" @click="openRejectOt(row)">駁回</el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination v-if="otTotal > 0" v-model:current-page="otPage" v-model:page-size="otLimit"
            :total="otTotal" layout="total, prev, pager, next" class="pagination"
            @current-change="onOtSearch" @size-change="onOtSearch" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 補卡駁回 Dialog -->
    <el-dialog v-model="rejectPatchVisible" title="駁回補卡申請" width="380px">
      <el-form label-width="80px">
        <el-form-item label="駁回原因">
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="請輸入駁回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectPatchVisible = false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" @click="confirmRejectPatch">確定駁回</el-button>
      </template>
    </el-dialog>

    <!-- 加班駁回 Dialog -->
    <el-dialog v-model="rejectOtVisible" title="駁回加班申請" width="380px">
      <el-form label-width="80px">
        <el-form-item label="駁回原因">
          <el-input v-model="rejectOtReason" type="textarea" :rows="3" placeholder="請輸入駁回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectOtVisible = false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" @click="confirmRejectOt">確定駁回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { attendanceApi, overtimeApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
onMounted(() => {
  ui.setBreadcrumbs([{ title: '人事模塊' }, { title: '出勤管理' }])
  loadRecords()
  loadPatches()
  loadOvertimes()
})

const activeTab = ref('records')
const actionLoading = ref(false)

// ── 出勤記錄 ──
const dateRange = ref<[string, string] | null>(null)
const userSearch = ref('')
const recordStatus = ref('')
const recordLoading = ref(false)
const recordData = ref<any[]>([])
const recordTotal = ref(0)
const recordPage = ref(1)
const recordLimit = ref(20)

async function loadRecords() {
  recordLoading.value = true
  try {
    const [s, e] = dateRange.value ?? [undefined, undefined]
    const res = await attendanceApi.getRecords({
      startDate: s || undefined,
      endDate: e || undefined,
      status: recordStatus.value || undefined,
      page: recordPage.value,
      limit: recordLimit.value,
    })
    recordData.value = res?.items ?? []
    recordTotal.value = res?.total ?? 0
  } finally { recordLoading.value = false }
}
function onRecordSearch() { recordPage.value = 1; loadRecords() }

// ── 補卡申請 ──
const patchMonth = ref('')
const patchStatus = ref('')
const patchIncludeDeleted = ref(false)
const patchLoading = ref(false)
const patchData = ref<any[]>([])
const patchTotal = ref(0)
const patchPage = ref(1)
const patchLimit = ref(20)
const rejectPatchVisible = ref(false)
const rejectReason = ref('')
const rejectPatchTarget = ref<any>(null)

async function loadPatches() {
  patchLoading.value = true
  try {
    const res = await attendanceApi.getClockPatches({
      month: patchMonth.value || undefined,
      status: patchStatus.value || undefined,
      includeDeleted: patchIncludeDeleted.value,
      page: patchPage.value,
      limit: patchLimit.value,
    })
    patchData.value = res?.items ?? []
    patchTotal.value = res?.total ?? 0
  } finally { patchLoading.value = false }
}
function onPatchSearch() { patchPage.value = 1; loadPatches() }

async function approvePatch(row: any) {
  actionLoading.value = true
  try {
    await attendanceApi.approveClockPatch(row.id)
    ElMessage.success('已核准補卡申請，出勤記錄已更新')
    loadPatches()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '操作失敗')
  } finally { actionLoading.value = false }
}

function openRejectPatch(row: any) { rejectPatchTarget.value = row; rejectReason.value = ''; rejectPatchVisible.value = true }

async function confirmRejectPatch() {
  if (!rejectReason.value.trim()) { ElMessage.warning('請輸入駁回原因'); return }
  actionLoading.value = true
  try {
    await attendanceApi.rejectClockPatch(rejectPatchTarget.value.id, rejectReason.value)
    ElMessage.success('已駁回')
    rejectPatchVisible.value = false
    loadPatches()
  } catch { ElMessage.error('操作失敗') } finally { actionLoading.value = false }
}

// ── 加班申請 ──
const otMonth = ref('')
const otStatus = ref('')
const otIncludeDeleted = ref(false)
const otLoading = ref(false)
const otData = ref<any[]>([])
const otTotal = ref(0)
const otPage = ref(1)
const otLimit = ref(20)
const rejectOtVisible = ref(false)
const rejectOtReason = ref('')
const rejectOtTarget = ref<any>(null)

async function loadOvertimes() {
  otLoading.value = true
  try {
    const res = await overtimeApi.getAll({
      month: otMonth.value || undefined,
      status: otStatus.value || undefined,
      includeDeleted: otIncludeDeleted.value,
      page: otPage.value,
      limit: otLimit.value,
    })
    otData.value = res?.items ?? []
    otTotal.value = res?.total ?? 0
  } finally { otLoading.value = false }
}
function onOtSearch() { otPage.value = 1; loadOvertimes() }

async function approveOt(row: any) {
  actionLoading.value = true
  try {
    await overtimeApi.approve(row.id)
    ElMessage.success('已核准加班申請')
    loadOvertimes()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message ?? '操作失敗')
  } finally { actionLoading.value = false }
}

function openRejectOt(row: any) { rejectOtTarget.value = row; rejectOtReason.value = ''; rejectOtVisible.value = true }

async function confirmRejectOt() {
  if (!rejectOtReason.value.trim()) { ElMessage.warning('請輸入駁回原因'); return }
  actionLoading.value = true
  try {
    await overtimeApi.reject(rejectOtTarget.value.id, rejectOtReason.value)
    ElMessage.success('已駁回')
    rejectOtVisible.value = false
    loadOvertimes()
  } catch { ElMessage.error('操作失敗') } finally { actionLoading.value = false }
}

// ── 工具函數 ──
function fmtDate(d?: string) { return d ? d.slice(0, 10) : '—' }
function fmtTime(d?: string) { return d ? new Date(d).toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '—' }
function fmtDateTime(d?: string) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${dt.toLocaleDateString('zh-TW')} ${dt.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' })}`
}
function fmtMinutes(m?: number) { if (!m) return '—'; return `${Math.floor(m/60)}h${m%60}m` }

function attendanceLabel(s: string) { return { normal: '正常', late: '遲到', absent: '缺勤', leave: '請假', holiday: '假日' }[s] ?? s }
function attendanceTagType(s: string): any { return { normal: 'success', late: 'warning', absent: 'danger', leave: 'info', holiday: 'info' }[s] ?? 'info' }

const PATCH_STATUS: Record<string, string> = { pending: '待審核', approved: '已核准', rejected: '已駁回', deleted: '已刪除' }
const PATCH_TAG: Record<string, any> = { pending: 'warning', approved: 'success', rejected: 'danger', deleted: 'info' }
function patchStatusLabel(s: string) { return PATCH_STATUS[s] ?? s }
function patchTagType(s: string) { return PATCH_TAG[s] ?? 'info' }
function deletedRowClass({ row }: any) { return row.deletedAt ? 'deleted-row' : '' }

const OT_STATUS: Record<string, string> = { submitted: '待審核', approved: '已核准', rejected: '已駁回' }
const OT_TAG: Record<string, any> = { submitted: 'warning', approved: 'success', rejected: 'danger' }
function otStatusLabel(s: string) { return OT_STATUS[s] ?? s }
function otTagType(s: string) { return OT_TAG[s] ?? 'info' }
function otTypeLabel(t: string) { return { weekday: '平日', weekend: '假日', holiday: '國定假日' }[t] ?? t }
function compLabel(t: string) { return { pay: '加班費', leave: '補休' }[t] ?? t }
function deletedOtRowClass({ row }: any) { return row.deletedAt ? 'deleted-row' : '' }
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.pagination { margin-top: 16px; justify-content: flex-end; }
</style>
<style>
.deleted-row td { opacity: 0.55; text-decoration: line-through; background: #fff5f5 !important; }
</style>
