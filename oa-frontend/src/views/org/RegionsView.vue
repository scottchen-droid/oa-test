<template>
  <div>
    <div class="page-header">
      <h2>地區管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增地區</el-button>
    </div>

    <el-card>
      <el-table v-loading="loading" :data="regions" border stripe>
        <el-table-column prop="code" label="代碼" width="120" />
        <el-table-column prop="name" label="名稱" />
        <el-table-column prop="timezone" label="時區" />
        <el-table-column prop="currencyCode" label="貨幣" width="100" />
        <el-table-column prop="isActive" label="狀態" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openEdit(row)">編輯</el-button>
            <el-button text size="small" :type="row.isActive ? 'danger' : 'success'" @click="toggleActive(row)">
              {{ row.isActive ? '停用' : '啟用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing ? '編輯地區' : '新增地區'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="代碼" prop="code">
          <el-input v-model="form.code" :disabled="!!editing" />
        </el-form-item>
        <el-form-item label="名稱" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="時區">
          <el-input v-model="form.timezone" placeholder="如: Asia/Taipei" />
        </el-form-item>
        <el-form-item label="貨幣代碼">
          <el-input v-model="form.currencyCode" placeholder="如: TWD" />
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
import { regionsApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'
import type { Region } from '@/types'

const ui = useUiStore()
const loading = ref(false)
const regions = ref<Region[]>([])
const dialogVisible = ref(false)
const editing = ref<Region | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ code: '', name: '', timezone: '', currencyCode: '' })

const rules: FormRules = {
  code: [{ required: true, message: '請輸入代碼', trigger: 'blur' }],
  name: [{ required: true, message: '請輸入名稱', trigger: 'blur' }],
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: '組織架構' }, { title: '地區管理' }])
  await load()
})

async function load() {
  loading.value = true
  try {
    regions.value = await regionsApi.getAll()
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { code: '', name: '', timezone: '', currencyCode: '' })
  dialogVisible.value = true
}

function openEdit(region: Region) {
  editing.value = region
  Object.assign(form, { code: region.code, name: region.name, timezone: region.timezone ?? '', currencyCode: region.currencyCode ?? '' })
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editing.value) {
      await regionsApi.update(editing.value.id, form)
    } else {
      await regionsApi.create(form)
    }
    ElMessage.success('儲存成功')
    dialogVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function toggleActive(region: Region) {
  await regionsApi.toggleActive(region.id)
  ElMessage.success('狀態已更新')
  await load()
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
</style>
