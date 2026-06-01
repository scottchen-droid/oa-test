<template>
  <div>
    <div class="page-header">
      <h2>績效管理</h2>
      <el-button v-if="activeTab === 'cycles'" type="primary" @click="openCreateCycle">
        新增週期
      </el-button>
    </div>

    <el-card>
      <el-tabs v-model="activeTab">

        <!-- Tab 1: 考核週期 -->
        <el-tab-pane label="考核週期" name="cycles">
          <el-table v-loading="cyclesLoading" :data="cyclesData" border stripe>
            <el-table-column prop="code" label="代碼" width="120" />
            <el-table-column prop="name" label="名稱" />
            <el-table-column label="類型" width="110">
              <template #default="{ row }">
                {{ cycleTypeLabel(row.cycleType) }}
              </template>
            </el-table-column>
            <el-table-column prop="startDate" label="開始日期" width="120" />
            <el-table-column prop="endDate" label="結束日期" width="120" />
            <el-table-column label="狀態" width="120">
              <template #default="{ row }">
                <el-tag :type="cycleTagType(row.status)" size="small">
                  {{ cycleStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'draft'"
                  size="small"
                  type="primary"
                  :loading="activatingId === row.id"
                  @click="handleActivate(row)"
                >
                  啟動
                </el-button>
                <el-button
                  v-if="['goal_setting', 'reviewing'].includes(row.status)"
                  size="small"
                  type="success"
                  :loading="completingId === row.id"
                  @click="handleComplete(row)"
                >
                  完成
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-if="cyclesTotal > 0"
            v-model:current-page="cyclesPagination.page"
            v-model:page-size="cyclesPagination.limit"
            :total="cyclesTotal"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            class="pagination"
            @current-change="handleCyclesPageChange"
            @size-change="handleCyclesSizeChange"
          />
        </el-tab-pane>

        <!-- Tab 2: 考核記錄 -->
        <el-tab-pane label="考核記錄" name="reviews">
          <div class="toolbar">
            <el-select
              v-model="selectedCycleId"
              placeholder="選擇考核週期"
              clearable
              style="width: 220px"
              @change="onSearchReviews"
            >
              <el-option
                v-for="c in cyclesData"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </div>

          <el-table v-loading="reviewsLoading" :data="reviewsData" border stripe>
            <el-table-column label="被考核人" width="120">
              <template #default="{ row }">{{ row.reviewee?.displayName ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="考核人" width="120">
              <template #default="{ row }">{{ row.reviewer?.displayName ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="週期" width="160">
              <template #default="{ row }">{{ row.cycle?.name ?? '—' }}</template>
            </el-table-column>
            <el-table-column prop="finalRating" label="最終評分" width="100" />
            <el-table-column prop="ratingLabel" label="評級" width="100" />
            <el-table-column label="狀態" width="100">
              <template #default="{ row }">
                <el-tag :type="reviewTagType(row.status)" size="small">
                  {{ reviewStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-if="reviewsTotal > 0"
            v-model:current-page="reviewsPagination.page"
            v-model:page-size="reviewsPagination.limit"
            :total="reviewsTotal"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            class="pagination"
            @current-change="handleReviewsPageChange"
            @size-change="handleReviewsSizeChange"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增週期 Dialog -->
    <el-dialog v-model="createDialogVisible" title="新增考核週期" width="480px">
      <el-form ref="createFormRef" :model="createForm" label-width="100px">
        <el-form-item label="代碼" prop="code" :rules="[{ required: true, message: '請輸入代碼' }]">
          <el-input v-model="createForm.code" />
        </el-form-item>
        <el-form-item label="名稱" prop="name" :rules="[{ required: true, message: '請輸入名稱' }]">
          <el-input v-model="createForm.name" />
        </el-form-item>
        <el-form-item label="類型" prop="cycleType">
          <el-select v-model="createForm.cycleType" style="width: 100%">
            <el-option label="年度" value="annual" />
            <el-option label="半年度" value="semi_annual" />
            <el-option label="季度" value="quarterly" />
          </el-select>
        </el-form-item>
        <el-form-item label="開始日期" prop="startDate">
          <el-date-picker v-model="createForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="結束日期" prop="endDate">
          <el-date-picker v-model="createForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createSaving" @click="handleCreateCycle">確定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { performanceApi } from '@/api/hr.api'
import { useUiStore } from '@/stores/ui.store'
import { useTable } from '@/composables/useTable'

const ui = useUiStore()
const activeTab = ref('cycles')
const selectedCycleId = ref('')

const {
  loading: cyclesLoading,
  data: cyclesData,
  total: cyclesTotal,
  pagination: cyclesPagination,
  fetch: fetchCycles,
  handlePageChange: handleCyclesPageChange,
  handleSizeChange: handleCyclesSizeChange,
} = useTable<any>({
  fetchFn: (params) => performanceApi.getCycles(params as any),
})

const {
  loading: reviewsLoading,
  data: reviewsData,
  total: reviewsTotal,
  pagination: reviewsPagination,
  fetch: fetchReviews,
  handlePageChange: handleReviewsPageChange,
  handleSizeChange: handleReviewsSizeChange,
} = useTable<any>({
  fetchFn: (params) => performanceApi.getReviews(params as any),
})

const activatingId = ref<string | null>(null)
const completingId = ref<string | null>(null)

async function handleActivate(row: any) {
  activatingId.value = row.id
  try {
    await performanceApi.activateCycle(row.id)
    ElMessage.success('週期已啟動')
    fetchCycles()
  } catch {
    ElMessage.error('操作失敗')
  } finally {
    activatingId.value = null
  }
}

async function handleComplete(row: any) {
  completingId.value = row.id
  try {
    await performanceApi.completeCycle(row.id)
    ElMessage.success('週期已完成')
    fetchCycles()
  } catch {
    ElMessage.error('操作失敗')
  } finally {
    completingId.value = null
  }
}

const createDialogVisible = ref(false)
const createSaving = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({ code: '', name: '', cycleType: 'annual', startDate: '', endDate: '' })

onMounted(() => {
  ui.setBreadcrumbs([{ title: '人事模塊' }, { title: '績效管理' }])
  fetchCycles()
  fetchReviews()
})

function onSearchReviews() {
  reviewsPagination.page = 1
  try {
    fetchReviews({ cycleId: selectedCycleId.value || undefined })
  } catch {
    ElMessage.error('載入考核記錄失敗')
  }
}

function openCreateCycle() {
  Object.assign(createForm, { code: '', name: '', cycleType: 'annual', startDate: '', endDate: '' })
  createDialogVisible.value = true
}

async function handleCreateCycle() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  createSaving.value = true
  try {
    await performanceApi.createCycle({ ...createForm })
    ElMessage.success('考核週期建立成功')
    createDialogVisible.value = false
    fetchCycles()
  } catch {
    ElMessage.error('建立失敗，請稍後再試')
  } finally {
    createSaving.value = false
  }
}

function cycleTypeLabel(type: string): string {
  const map: Record<string, string> = { annual: '年度', semi_annual: '半年度', quarterly: '季度' }
  return map[type] ?? type
}

function cycleStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿',
    goal_setting: '目標設定',
    reviewing: '考核中',
    completed: '已完成',
  }
  return map[status] ?? status
}

function cycleTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    draft: 'info',
    goal_setting: 'warning',
    reviewing: 'warning',
    completed: 'success',
  }
  return map[status] ?? 'info'
}

function reviewStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: '待填寫', in_progress: '進行中', completed: '已完成' }
  return map[status] ?? status
}

function reviewTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
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
