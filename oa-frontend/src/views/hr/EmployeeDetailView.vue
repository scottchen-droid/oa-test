<template>
  <div v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <el-button text :icon="ArrowLeft" @click="router.back()">返回</el-button>
        <h2>{{ employee?.displayName }}</h2>
        <el-tag v-if="employee" :type="statusTagType(employee.status)" size="small">{{ statusLabel(employee.status) }}</el-tag>
      </div>
    </div>

    <template v-if="employee">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本資訊" name="basic">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>帳號資訊</span>
                <el-button text size="small" @click="openEditBasic">編輯</el-button>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="員工編號">{{ employee.employeeNo ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="電子郵件">{{ employee.email }}</el-descriptions-item>
              <el-descriptions-item label="顯示名稱">{{ employee.displayName }}</el-descriptions-item>
              <el-descriptions-item label="中文姓名">{{ employee.nameZh ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="英文姓名">{{ employee.nameEn ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="最後登入">{{ formatDate(employee.lastLoginAt) }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card style="margin-top: 20px">
            <template #header>
              <div class="card-header">
                <span>人事資料</span>
                <el-button text size="small" @click="openEditProfile">編輯</el-button>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="到職日">{{ profile?.hireDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="試用期結束">{{ profile?.probationEndDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="轉正日">{{ profile?.regularDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="僱用類型">{{ profile?.employmentType ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="合約開始">{{ profile?.contractStartDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="合約結束">{{ profile?.contractEndDate ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="個人Email">{{ profile?.personalEmail ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="手機">{{ profile?.mobilePhone ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="辦公室電話">{{ profile?.workPhone ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="現居地址" :span="2">{{ profile?.currentAddress ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="緊急聯絡人">{{ profile?.emergencyContactName ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="緊急聯絡電話">{{ profile?.emergencyContactPhone ?? '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="組織配置" name="org">
          <el-card>
            <template #header>組織配置</template>
            <el-table :data="employee.orgAssignments ?? []" border>
              <el-table-column label="主要" width="80" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.isPrimary" color="#67c23a"><Check /></el-icon>
                </template>
              </el-table-column>
              <el-table-column label="公司">
                <template #default="{ row }">{{ row.company?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="部門">
                <template #default="{ row }">{{ row.department?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="職位">
                <template #default="{ row }">{{ row.position?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="職級">
                <template #default="{ row }">{{ row.jobLevel?.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="直屬主管">
                <template #default="{ row }">{{ row.directManager?.displayName ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="開始日期" width="120">
                <template #default="{ row }">{{ row.startedAt ?? '—' }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="角色權限" name="roles">
          <el-card>
            <template #header>已指派角色</template>
            <el-table :data="employee.userRoles ?? []" border>
              <el-table-column label="角色">
                <template #default="{ row }">{{ row.role?.name }}</template>
              </el-table-column>
              <el-table-column label="範圍類型" prop="scopeType" />
              <el-table-column label="範圍ID" prop="scopeId" />
            </el-table>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </template>

    <el-dialog v-model="editBasicDialog" title="編輯基本資訊" width="480px">
      <el-form ref="basicFormRef" :model="basicForm" label-width="100px">
        <el-form-item label="顯示名稱" :rules="[{ required: true }]">
          <el-input v-model="basicForm.displayName" />
        </el-form-item>
        <el-form-item label="中文姓名">
          <el-input v-model="basicForm.nameZh" />
        </el-form-item>
        <el-form-item label="英文姓名">
          <el-input v-model="basicForm.nameEn" />
        </el-form-item>
        <el-form-item label="員工編號">
          <el-input v-model="basicForm.employeeNo" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editBasicDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveBasic">確定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editProfileDialog" title="編輯人事資料" width="600px">
      <el-form :model="profileForm" label-width="120px">
        <el-form-item label="個人Email"><el-input v-model="profileForm.personalEmail" /></el-form-item>
        <el-form-item label="手機"><el-input v-model="profileForm.mobilePhone" /></el-form-item>
        <el-form-item label="辦公室電話"><el-input v-model="profileForm.workPhone" /></el-form-item>
        <el-form-item label="現居地址"><el-input v-model="profileForm.currentAddress" /></el-form-item>
        <el-form-item label="緊急聯絡人"><el-input v-model="profileForm.emergencyContactName" /></el-form-item>
        <el-form-item label="緊急聯絡電話"><el-input v-model="profileForm.emergencyContactPhone" /></el-form-item>
        <el-form-item label="試用期結束">
          <el-date-picker v-model="profileForm.probationEndDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="轉正日">
          <el-date-picker v-model="profileForm.regularDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="合約開始">
          <el-date-picker v-model="profileForm.contractStartDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="合約結束">
          <el-date-picker v-model="profileForm.contractEndDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editProfileDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveProfile">確定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { employeesApi } from '@/api/employees.api'
import { useUiStore } from '@/stores/ui.store'
import type { User } from '@/types'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const loading = ref(false)
const saving = ref(false)
const employee = ref<User | null>(null)
const activeTab = ref('basic')

const editBasicDialog = ref(false)
const editProfileDialog = ref(false)
const basicFormRef = ref()

const basicForm = reactive({ displayName: '', nameZh: '', nameEn: '', employeeNo: '' })
const profileForm = reactive({
  personalEmail: '', mobilePhone: '', workPhone: '', currentAddress: '',
  emergencyContactName: '', emergencyContactPhone: '',
  probationEndDate: '', regularDate: '', contractStartDate: '', contractEndDate: '',
})

const profile = computed(() => employee.value?.employeeProfile)

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '員工管理', path: '/hr/employees' }, { title: '員工詳情' }])
  await load()
})

async function load() {
  loading.value = true
  try {
    employee.value = await employeesApi.getOne(route.params.id as string)
  } finally {
    loading.value = false
  }
}

function openEditBasic() {
  if (!employee.value) return
  Object.assign(basicForm, {
    displayName: employee.value.displayName,
    nameZh: employee.value.nameZh ?? '',
    nameEn: employee.value.nameEn ?? '',
    employeeNo: employee.value.employeeNo ?? '',
  })
  editBasicDialog.value = true
}

function openEditProfile() {
  const p = profile.value
  Object.assign(profileForm, {
    personalEmail: p?.personalEmail ?? '',
    mobilePhone: p?.mobilePhone ?? '',
    workPhone: p?.workPhone ?? '',
    currentAddress: p?.currentAddress ?? '',
    emergencyContactName: p?.emergencyContactName ?? '',
    emergencyContactPhone: p?.emergencyContactPhone ?? '',
    probationEndDate: p?.probationEndDate ?? '',
    regularDate: p?.regularDate ?? '',
    contractStartDate: p?.contractStartDate ?? '',
    contractEndDate: p?.contractEndDate ?? '',
  })
  editProfileDialog.value = true
}

async function saveBasic() {
  saving.value = true
  try {
    await employeesApi.update(employee.value!.id, basicForm)
    ElMessage.success('更新成功')
    editBasicDialog.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await employeesApi.update(employee.value!.id, profileForm)
    ElMessage.success('更新成功')
    editProfileDialog.value = false
    await load()
  } finally {
    saving.value = false
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = { pending_activation: '待啟用', active: '啟用', suspended: '停用', resigned: '離職', terminated: '終止' }
  return map[status] ?? status
}

function statusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = { active: 'success', pending_activation: 'warning', suspended: 'danger', resigned: 'info', terminated: 'info' }
  return map[status] ?? 'info'
}

function formatDate(date?: string) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '—'
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
