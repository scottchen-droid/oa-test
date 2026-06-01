<template>
  <div v-if="!dismissed" class="assistant-card">
    <button class="close-btn" @click="dismiss">×</button>
    <div class="assistant-avatar">
      <el-icon size="24" color="#fff"><ChatDotRound /></el-icon>
    </div>
    <div class="assistant-body">
      <div class="assistant-title">OA 系統小助手</div>
      <div class="assistant-desc">有系統操作問題可聯繫資訊部</div>
    </div>
    <el-button size="small" type="primary" plain class="assistant-btn">
      聯繫資訊部
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'

const STORAGE_KEY = 'oa_assistant_dismissed'
const dismissed = ref(localStorage.getItem(STORAGE_KEY) === '1')

function dismiss() {
  dismissed.value = true
  localStorage.setItem(STORAGE_KEY, '1')
}
</script>

<style scoped>
.assistant-card {
  background: linear-gradient(135deg, #4d7cfe 0%, #6c47ff 100%);
  border-radius: 8px;
  padding: 14px;
  color: #fff;
  position: relative;
  margin-bottom: 12px;
}
.close-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}
.close-btn:hover {
  color: #fff;
}
.assistant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.assistant-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}
.assistant-desc {
  font-size: 12px;
  opacity: 0.85;
  margin-bottom: 12px;
}
.assistant-btn {
  background: rgba(255,255,255,0.15) !important;
  border-color: rgba(255,255,255,0.4) !important;
  color: #fff !important;
}
</style>
