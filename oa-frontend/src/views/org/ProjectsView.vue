<template>
  <div>
    <div class="page-header">
      <h2>項目管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增項目</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select v-model="buFilter" placeholder="篩選業務單位" clearable style="width: 200px" @change="load">
          <el-option v-for="bu in businessUnits" :key="bu.id" :label="bu.name" :value="bu.id" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="projects" border stripe>
        <el-table-column prop="code" label="代碼" width="120" />
        <el-table-column prop="name" label="項目名稱" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="業務單位" width="140">
          <template #default="{ row }">{{ row.businessUnit?.name ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="開始日期" width="120">
          <template #default="{ row }">{{ row.startDate ? row.startDate.slice(0, 10) : '-' }}</template>
        </el-table-column>
        <el-table-column label="結束日期" width="120">
          <template #default="{ row }">{{ row.endDate ? row.endDate.slice(0, 10) : '-' }}</template>
        </el-table-column>
        <el-table-column prop="isActive" label="狀態" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '啟用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openEdit(row)">編輯</el-button>
            <el-button text size="small" :type="row.isActive ? 'warning' : 'success'" @click="handleToggle(row)">
              {{ row.isActive ? '停用' : '啟用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing ? '編輯項目' : '新增項目'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="代碼" prop="code">
          <el-input v-model="form.code" :disabled="!!editing" placeholder="唯一識別代碼" />
        </el-form-item>
        <el-form-item label="項目名稱" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="業務單位">
          <el-select v-model="form.businessUnitId" clearable placeholder="選擇業務單位（可選）" style="width: 100%">
            <el-option v-for="bu in businessUnits" :key="bu.id" :label="bu.name" :value="bu.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="開始日期">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" placeholder="選擇開始日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="結束日期">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" placeholder="選擇結束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="狀態">
          <el-switch v-model="form.isActive" active-text="啟用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">確定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { projectsApi, businessUnitsApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'
import type { Project, BusinessUnit } from '@/types'

const ui = useUiStore()
const loading = ref(false)
const projects = ref<Project[]>([])
const businessUnits = ref<BusinessUnit[]>([])
const buFilter = ref('')
const dialogVisible = ref(false)
const editing = ref<Project | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  code: '',
  name: '',
  businessUnitId: '',
  description: '',
  startDate: '',
  endDate: '',
  isActive: true,
})

const rules: FormRules = {
  code: [{ required: true, message: '請輸入代碼', trigger: 'blur' }],
  name: [{ required: true, message: '請輸入項目名稱', trigger: 'blur' }],
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '組織架構' }, { title: '項目管理' }])
  businessUnits.value = await businessUnitsApi.getAll()
  await load()
})

async function load() {
  loading.value = true
  try {
    projects.value = await projectsApi.getAll({ businessUnitId: buFilter.value || undefined })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { code: '', name: '', businessUnitId: '', description: '', startDate: '', endDate: '', isActive: true })
  dialogVisible.value = true
}

function openEdit(p: Project) {
  editing.value = p
  Object.assign(form, {
    code: p.code,
    name: p.name,
    businessUnitId: p.businessUnitId ?? '',
    description: p.description ?? '',
    startDate: p.startDate ?? '',
    endDate: p.endDate ?? '',
    isActive: p.isActive,
  })
  dialogVisible.value = true
}

async function handleToggle(p: Project) {
  try {
    await projectsApi.toggleActive(p.id)
    ElMessage.success(`已${p.isActive ? '停用' : '啟用'}`)
    await load()
  } catch {
    ElMessage.error('操作失敗')
  }
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = {
      ...form,
      businessUnitId: form.businessUnitId || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    }
    if (editing.value) {
      await projectsApi.update(editing.value.id, payload)
    } else {
      await projectsApi.create(payload)
    }
    ElMessage.success('儲存成功')
    dialogVisible.value = false
    await load()
  } catch {
    ElMessage.error('儲存失敗，請確認代碼是否重複')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { margin-bottom: 16px; }
</style>
