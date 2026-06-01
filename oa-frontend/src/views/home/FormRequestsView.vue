<template>
  <div>
    <div class="page-header">
      <h2>電子表單申請</h2>
    </div>

    <div class="form-grid">
      <el-card
        v-for="ft in formTypes"
        :key="ft.type"
        class="form-card"
        shadow="hover"
        @click="openDialog(ft)"
      >
        <div class="form-card-inner">
          <el-icon :size="36" class="form-icon" :style="{ color: ft.color }">
            <component :is="ft.icon" />
          </el-icon>
          <div class="form-name">{{ ft.label }}</div>
          <div class="form-desc">{{ ft.desc }}</div>
        </div>
      </el-card>
    </div>

    <!-- 申請 Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="activeFormType?.label"
      width="520px"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="activeRules" label-width="110px">
        <template v-if="activeFormType?.type === 'asset_request'">
          <el-form-item label="資產類型" prop="assetType">
            <el-input v-model="formData.assetType" placeholder="如：筆電、螢幕、辦公椅" />
          </el-form-item>
          <el-form-item label="數量" prop="quantity">
            <el-input-number v-model="formData.quantity" :min="1" style="width:100%" />
          </el-form-item>
          <el-form-item label="預計使用日期" prop="expectedDate">
            <el-date-picker v-model="formData.expectedDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="申請原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" :rows="3" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormType?.type === 'meal_allowance'">
          <el-form-item label="加班日期" prop="workDate">
            <el-date-picker v-model="formData.workDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="加班時數" prop="hours">
            <el-input-number v-model="formData.hours" :min="1" :max="24" style="width:100%" />
          </el-form-item>
          <el-form-item label="申請金額（元）" prop="amount">
            <el-input-number v-model="formData.amount" :min="1" style="width:100%" />
          </el-form-item>
          <el-form-item label="備註" prop="remark">
            <el-input v-model="formData.remark" type="textarea" :rows="2" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormType?.type === 'it_request'">
          <el-form-item label="需求標題" prop="title">
            <el-input v-model="formData.title" placeholder="簡述需求" />
          </el-form-item>
          <el-form-item label="需求描述" prop="description">
            <el-input v-model="formData.description" type="textarea" :rows="4" placeholder="詳述需求內容" />
          </el-form-item>
          <el-form-item label="優先程度" prop="priority">
            <el-select v-model="formData.priority" style="width:100%">
              <el-option label="緊急" value="urgent" />
              <el-option label="一般" value="normal" />
              <el-option label="低" value="low" />
            </el-select>
          </el-form-item>
          <el-form-item label="期望完成日期" prop="expectedDate">
            <el-date-picker v-model="formData.expectedDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormType?.type === 'headcount_request'">
          <el-form-item label="職位名稱" prop="positionName">
            <el-input v-model="formData.positionName" />
          </el-form-item>
          <el-form-item label="招募人數" prop="headcount">
            <el-input-number v-model="formData.headcount" :min="1" style="width:100%" />
          </el-form-item>
          <el-form-item label="招募原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="期望到職日期" prop="expectedDate">
            <el-date-picker v-model="formData.expectedDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
        </template>

        <template v-else-if="activeFormType?.type === 'resignation'">
          <el-form-item label="預計離職日期" prop="resignDate">
            <el-date-picker v-model="formData.resignDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="離職原因" prop="reason">
            <el-input v-model="formData.reason" type="textarea" :rows="4" placeholder="請填寫離職原因" />
          </el-form-item>
          <el-form-item label="交接備註" prop="handoverNote">
            <el-input v-model="formData.handoverNote" type="textarea" :rows="2" placeholder="工作交接事項（選填）" />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">送出申請</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Briefcase, Money, Monitor, User, Remove } from '@element-plus/icons-vue'
import { formsApi } from '@/api/forms.api'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
ui.setBreadcrumbs([{ title: '電子表單' }, { title: '電子表單申請' }])

const formTypes = [
  { type: 'asset_request', label: 'OA資產申請單', desc: '申請辦公室資產設備', icon: 'Briefcase', color: '#409eff' },
  { type: 'meal_allowance', label: '誤餐費申請', desc: '加班誤餐費用補貼申請', icon: 'Money', color: '#67c23a' },
  { type: 'it_request', label: '資訊需求申請', desc: '資訊系統需求或IT支援', icon: 'Monitor', color: '#e6a23c' },
  { type: 'headcount_request', label: '人力需求申請', desc: '部門新增人力招募申請', icon: 'User', color: '#9b59b6' },
  { type: 'resignation', label: '離職申請', desc: '提出離職申請', icon: 'Remove', color: '#f56c6c' },
]

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const activeFormType = ref<typeof formTypes[0] | null>(null)
const formData = ref<Record<string, any>>({})

const rulesMap: Record<string, FormRules> = {
  asset_request: {
    assetType: [{ required: true, message: '請填寫資產類型', trigger: 'blur' }],
    quantity: [{ required: true, message: '請填寫數量', trigger: 'change' }],
    reason: [{ required: true, message: '請填寫申請原因', trigger: 'blur' }],
  },
  meal_allowance: {
    workDate: [{ required: true, message: '請選擇加班日期', trigger: 'change' }],
    hours: [{ required: true, message: '請填寫加班時數', trigger: 'change' }],
    amount: [{ required: true, message: '請填寫申請金額', trigger: 'change' }],
  },
  it_request: {
    title: [{ required: true, message: '請填寫需求標題', trigger: 'blur' }],
    description: [{ required: true, message: '請填寫需求描述', trigger: 'blur' }],
    priority: [{ required: true, message: '請選擇優先程度', trigger: 'change' }],
  },
  headcount_request: {
    positionName: [{ required: true, message: '請填寫職位名稱', trigger: 'blur' }],
    headcount: [{ required: true, message: '請填寫招募人數', trigger: 'change' }],
    reason: [{ required: true, message: '請填寫招募原因', trigger: 'blur' }],
  },
  resignation: {
    resignDate: [{ required: true, message: '請選擇預計離職日期', trigger: 'change' }],
    reason: [{ required: true, message: '請填寫離職原因', trigger: 'blur' }],
  },
}

const activeRules = computed(() => activeFormType.value ? (rulesMap[activeFormType.value.type] ?? {}) : {})

function openDialog(ft: typeof formTypes[0]) {
  activeFormType.value = ft
  formData.value = { quantity: 1, hours: 1, amount: 100, headcount: 1, priority: 'normal' }
  dialogVisible.value = true
}

function resetForm() {
  formData.value = {}
  activeFormType.value = null
  formRef.value?.resetFields()
}

async function submitForm() {
  if (!formRef.value || !activeFormType.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await formsApi.create({ formType: activeFormType.value!.type, content: { ...formData.value } })
      ElMessage.success('申請送出成功，等待主管審核')
      dialogVisible.value = false
    } catch (err: any) {
      ElMessage.error(err?.response?.data?.message ?? '送出失敗，請稍後再試')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.page-header { margin-bottom: 24px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.form-card {
  cursor: pointer;
  transition: transform 0.15s;
}
.form-card:hover { transform: translateY(-3px); }

.form-card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 0 8px;
  text-align: center;
}

.form-name { font-size: 15px; font-weight: 600; color: #303133; }
.form-desc { font-size: 12px; color: #909399; line-height: 1.4; }
</style>
