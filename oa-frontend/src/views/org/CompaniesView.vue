<template>
  <div>
    <div class="page-header">
      <h2>公司管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增公司</el-button>
    </div>

    <el-card>
      <div class="toolbar">
        <el-select v-model="regionFilter" placeholder="篩選地區" clearable style="width: 180px" @change="load">
          <el-option v-for="r in regions" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="companies" border stripe>
        <el-table-column prop="code" label="代碼" width="120" />
        <el-table-column prop="name" label="公司名稱" />
        <el-table-column prop="legalName" label="法定名稱" />
        <el-table-column label="地區" width="120">
          <template #default="{ row }">{{ row.region?.name }}</template>
        </el-table-column>
        <el-table-column prop="currencyCode" label="貨幣" width="100" />
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

    <el-dialog v-model="dialogVisible" :title="editing ? '編輯公司' : '新增公司'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="所屬地區" prop="regionId">
          <el-select v-model="form.regionId" style="width: 100%">
            <el-option v-for="r in regions" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="代碼" prop="code">
          <el-input v-model="form.code" :disabled="!!editing" />
        </el-form-item>
        <el-form-item label="公司名稱" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="法定名稱">
          <el-input v-model="form.legalName" />
        </el-form-item>
        <el-form-item label="統一編號">
          <el-input v-model="form.taxId" />
        </el-form-item>
        <el-form-item label="貨幣代碼">
          <el-input v-model="form.currencyCode" />
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
import { companiesApi, regionsApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'
import type { Company, Region } from '@/types'

const ui = useUiStore()
const loading = ref(false)
const companies = ref<Company[]>([])
const regions = ref<Region[]>([])
const regionFilter = ref('')
const dialogVisible = ref(false)
const editing = ref<Company | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ regionId: '', code: '', name: '', legalName: '', taxId: '', currencyCode: '', isActive: true })

const rules: FormRules = {
  regionId: [{ required: true, message: '請選擇地區', trigger: 'change' }],
  code: [{ required: true, message: '請輸入代碼', trigger: 'blur' }],
  name: [{ required: true, message: '請輸入公司名稱', trigger: 'blur' }],
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '組織架構' }, { title: '公司管理' }])
  regions.value = await regionsApi.getAll()
  await load()
})

async function load() {
  loading.value = true
  try {
    companies.value = await companiesApi.getAll({ regionId: regionFilter.value || undefined })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { regionId: '', code: '', name: '', legalName: '', taxId: '', currencyCode: '', isActive: true })
  dialogVisible.value = true
}

function openEdit(c: Company) {
  editing.value = c
  Object.assign(form, { regionId: c.regionId, code: c.code, name: c.name, legalName: c.legalName ?? '', taxId: c.taxId ?? '', currencyCode: c.currencyCode ?? '', isActive: c.isActive })
  dialogVisible.value = true
}

async function handleToggle(c: Company) {
  try {
    await companiesApi.toggleActive(c.id)
    ElMessage.success(`已${c.isActive ? '停用' : '啟用'}`)
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
    if (editing.value) {
      await companiesApi.update(editing.value.id, form)
    } else {
      await companiesApi.create(form)
    }
    ElMessage.success('儲存成功')
    dialogVisible.value = false
    await load()
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

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.toolbar {
  margin-bottom: 16px;
}
</style>
