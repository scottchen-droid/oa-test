<template>
  <div>
    <div class="page-header">
      <h2>財務報表</h2>
    </div>

    <!-- Filter bar -->
    <el-card style="margin-bottom: 20px">
      <div class="toolbar">
        <el-select v-model="reportType" placeholder="報表類型" style="width: 200px">
          <el-option label="採購申請月報" value="purchase_monthly" />
          <el-option label="報銷費用月報" value="reimbursement_monthly" />
          <el-option label="部門費用分析" value="department_analysis" />
        </el-select>
        <el-date-picker
          v-model="yearFilter"
          type="year"
          placeholder="選擇年份"
          value-format="YYYY"
          style="width: 140px"
        />
        <el-select v-model="companyFilter" placeholder="選擇公司" clearable style="width: 180px">
        </el-select>
        <el-button type="primary">查詢</el-button>
      </div>
    </el-card>

    <!-- Summary stat cards -->
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value primary">0</div>
          <div class="stat-label">本月採購申請總額</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value primary">0</div>
          <div class="stat-label">本月報銷總額</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value warning">0</div>
          <div class="stat-label">待審核筆數</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value success">0</div>
          <div class="stat-label">本月付款金額</div>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      title="完整報表功能開發中，敬請期待"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    />

    <!-- Report table placeholder -->
    <el-card>
      <el-table :data="reportRows" border stripe>
        <el-table-column prop="month" label="月份" width="100" />
        <el-table-column prop="purchaseCount" label="採購申請筆數" width="130" align="right" />
        <el-table-column prop="purchaseAmount" label="採購申請金額" width="140" align="right">
          <template #default="{ row }">
            <span class="amount">{{ row.purchaseAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reimbursementCount" label="報銷筆數" width="100" align="right" />
        <el-table-column prop="reimbursementAmount" label="報銷金額" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">{{ row.reimbursementAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="付款金額" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">{{ row.paidAmount }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
const reportType = ref('purchase_monthly')
const yearFilter = ref(new Date().getFullYear().toString())
const companyFilter = ref('')

// Placeholder rows for all 12 months of the selected year
const reportRows = Array.from({ length: 12 }, (_, i) => ({
  month: `${yearFilter.value}-${String(i + 1).padStart(2, '0')}`,
  purchaseCount: 0,
  purchaseAmount: 0,
  reimbursementCount: 0,
  reimbursementAmount: 0,
  paidAmount: 0,
}))

onMounted(() => {
  ui.setBreadcrumbs([{ title: '財務模塊' }, { title: '財務報表' }])
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.amount { font-weight: 600; color: #409eff; }
.stat-card { text-align: center; }
.stat-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.stat-value.warning { color: #e6a23c; }
.stat-value.success { color: #67c23a; }
.stat-value.primary { color: #409eff; }
.stat-label { font-size: 13px; color: #909399; margin-top: 6px; }
</style>
