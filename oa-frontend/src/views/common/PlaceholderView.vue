<template>
  <div class="placeholder-page">
    <el-empty :image-size="120">
      <template #description>
        <p class="placeholder-title">{{ title }}</p>
        <p class="placeholder-sub">此功能正在建置中，敬請期待</p>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'

const route = useRoute()
const ui = useUiStore()

const title = computed(() => (route.meta?.title as string) ?? route.name as string ?? '功能建置中')

onMounted(() => {
  ui.setBreadcrumbs([{ title: title.value }])
})
</script>

<style scoped>
.placeholder-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
.placeholder-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 6px;
}
.placeholder-sub {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}
</style>
