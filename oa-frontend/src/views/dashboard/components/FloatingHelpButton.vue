<template>
  <div class="floating-help">
    <transition name="fade">
      <div v-if="open" class="help-popup">
        <div class="popup-header">
          <span>{{ t('shell.dashboard.assistantTitle') }}</span>
          <button class="close-btn" @click="open = false">×</button>
        </div>
        <p class="popup-text">
          {{ t('shell.dashboard.assistantGreeting') }}<br>
          {{ t('shell.dashboard.assistantHelp') }}
        </p>
        <div class="popup-actions">
          <el-button size="small" plain>{{ t('shell.dashboard.goToFaq') }}</el-button>
          <el-button size="small" type="primary">{{ t('shell.dashboard.contactIt') }}</el-button>
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
import { useI18n } from 'vue-i18n'
import { QuestionFilled } from '@element-plus/icons-vue'
const open = ref(false)
const { t } = useI18n()
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
  background: var(--oa-primary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 7px 18px rgba(15, 118, 110, 0.32);
  transition: transform 0.2s;
}
.help-btn:hover {
  transform: scale(1.08);
}
.help-popup {
  background: var(--oa-surface);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 16px;
  width: 240px;
  border: 1px solid var(--oa-border);
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--oa-text);
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

@media (max-width: 767px) {
  .floating-help {
    right: 14px;
    bottom: 82px;
  }

  .help-btn {
    width: 44px;
    height: 44px;
  }
}
</style>
