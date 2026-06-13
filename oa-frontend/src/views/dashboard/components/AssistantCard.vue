<template>
  <div v-if="!dismissed" class="assistant-card">
    <button class="close-btn" @click="dismiss">×</button>
    <div class="assistant-avatar">
      <el-icon size="24" color="#fff"><ChatDotRound /></el-icon>
    </div>
    <div class="assistant-body">
      <div class="assistant-title">{{ t('shell.dashboard.assistantTitle') }}</div>
      <div class="assistant-desc">{{ t('shell.dashboard.assistantDescription') }}</div>
    </div>
    <el-button size="small" type="primary" plain class="assistant-btn">
      {{ t('shell.dashboard.contactIt') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatDotRound } from '@element-plus/icons-vue'

const STORAGE_KEY = 'oa_assistant_dismissed'
const dismissed = ref(localStorage.getItem(STORAGE_KEY) === '1')
const { t } = useI18n()

function dismiss() {
  dismissed.value = true
  localStorage.setItem(STORAGE_KEY, '1')
}
</script>

<style scoped>
.assistant-card {
  background:
    radial-gradient(circle at 100% 0%, rgba(255,255,255,0.17), transparent 36%),
    linear-gradient(135deg, #173e4b 0%, #0f766e 100%);
  border-radius: 15px;
  padding: 18px;
  color: #fff;
  position: relative;
  box-shadow: 0 12px 26px rgba(13, 72, 72, 0.16);
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
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.assistant-title {
  font-size: 15px;
  font-weight: 700;
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
