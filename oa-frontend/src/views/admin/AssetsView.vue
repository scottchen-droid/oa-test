<template>
  <div>
    <div class="page-header">
      <h2>資產管理</h2>
    </div>

    <el-alert
      title="資產管理功能正在規劃中，資料表設計尚未完成，敬請期待"
      type="warning"
      :closable="false"
      style="margin-bottom: 20px"
    />

    <el-card style="margin-bottom: 20px">
      <template #header>預計功能說明</template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="資產登記">
          公司資產（電腦、設備、車輛）的新增與管理
        </el-descriptions-item>
        <el-descriptions-item label="資產分配">
          記錄資產分配給哪位員工使用
        </el-descriptions-item>
        <el-descriptions-item label="維護紀錄">
          資產維護、保修紀錄追蹤
        </el-descriptions-item>
        <el-descriptions-item label="盤點管理">
          定期資產盤點作業
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card>
      <template #header>
        <span style="color: #c0c4cc">資料表預覽（開發中）</span>
      </template>
      <el-table :data="[]" border stripe class="preview-table">
        <el-table-column prop="assetNo" label="資產編號" width="140" />
        <el-table-column prop="name" label="資產名稱" />
        <el-table-column prop="category" label="類別" width="120" />
        <el-table-column prop="holder" label="持有人" width="120" />
        <el-table-column prop="purchaseDate" label="購入日期" width="130" />
        <el-table-column prop="status" label="狀態" width="100" />
        <el-table-column label="操作" width="120" />
      </el-table>
      <el-empty description="資產管理功能尚未開放" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()

onMounted(() => {
  ui.setBreadcrumbs([{ title: '行政模塊' }, { title: '資產管理' }])
})
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
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
.preview-table {
  opacity: 0.45;
}
</style>
