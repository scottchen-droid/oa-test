<template>
  <div class="floating-help">
    <transition name="fade">
      <div v-if="open" class="help-popup">
        <div class="popup-header">
          <span>OA 小助手</span>
          <button class="close-btn" @click="open = false">×</button>
        </div>
        <p class="popup-text">Hi，我是 OA 小助手！<br>有任何 OA 系統問題都可以問我，<br>我會協助你找到相關說明。</p>
        <div class="popup-actions">
          <el-button size="small" plain>前往 FAQ</el-button>
          <el-button size="small" type="primary">聯繫資訊部</el-button>
        </div>
      </div>
    </transition>
    <button class="help-btn" @click="open = !open">
      <el-icon size="20" color="#fff"><QuestionFilled /></el-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
const open = ref(false)
</script>

<style scoped>
.floating-help {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.help-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #4d7cfe;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(77,124,254,0.4);
  transition: transform 0.2s;
}
.help-btn:hover {
  transform: scale(1.08);
}
.help-popup {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 16px;
  width: 240px;
  border: 1px solid #e5e7eb;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 10px;
}
.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}
.popup-text {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 12px;
}
.popup-actions {
  display: flex;
  gap: 8px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
