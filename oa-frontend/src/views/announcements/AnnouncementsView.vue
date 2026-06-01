<template>
  <div>
    <div class="page-header">
      <h2>公告</h2>
    </div>

    <el-card>
      <div v-if="loading" class="skeleton-wrap">
        <el-skeleton :rows="6" animated />
      </div>

      <el-empty v-else-if="items.length === 0" description="目前沒有公告" />

      <div v-else class="announcement-list">
        <div
          v-for="item in items"
          :key="item.id"
          class="announcement-item"
          @click="router.push(`/announcements/${item.id}`)"
        >
          <div class="item-header">
            <el-tag v-if="item.isPinned" type="danger" size="small" effect="plain">置頂</el-tag>
            <span class="item-title">{{ item.title }}</span>
            <el-tag size="small" effect="plain">{{ item.type }}</el-tag>
          </div>
          <div class="item-meta">
            <span>{{ item.authorName }}</span>
            <span class="sep">·</span>
            <span>{{ formatDate(item.publishDate) }}</span>
            <span class="sep">·</span>
            <span>{{ item.category }}</span>
          </div>
          <p v-if="item.contentPreview" class="item-preview">{{ item.contentPreview }}</p>
          <div v-if="item.attachments?.length" class="attachments">
            <a
              v-for="att in item.attachments"
              :key="att.id"
              :href="att.fileUrl"
              target="_blank"
              class="att-pill"
              @click.stop
            >
              <el-icon size="12"><Document /></el-icon>
              {{ att.fileName }}
            </a>
          </div>
        </div>
      </div>

      <div v-if="total > limit" class="pagination">
        <el-pagination
          v-model:current-page="page"
          :page-size="limit"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document } from '@element-plus/icons-vue'
import { useUiStore } from '@/stores/ui.store'
import { announcementsApi } from '@/api/dashboard.api'
import type { AnnouncementItem } from '@/types'

const ui = useUiStore()
const router = useRouter()

const items = ref<AnnouncementItem[]>([])
const loading = ref(true)
const total = ref(0)
const page = ref(1)
const limit = 20

async function loadData() {
  loading.value = true
  try {
    const result = await announcementsApi.getAll({ page: page.value, limit })
    items.value = result.items
    total.value = result.total
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(() => {
  ui.setBreadcrumbs([{ title: '公告' }])
  loadData()
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
.announcement-list {
  display: flex;
  flex-direction: column;
}
.announcement-item {
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.1s;
}
.announcement-item:last-child {
  border-bottom: none;
}
.announcement-item:hover {
  background: #f8fafc;
  margin: 0 -16px;
  padding: 16px;
}
.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  flex: 1;
}
.item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}
.sep {
  color: #d1d5db;
}
.item-preview {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.att-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 11px;
  color: #374151;
  text-decoration: none;
}
.att-pill:hover {
  background: #eff6ff;
}
.skeleton-wrap {
  padding: 12px 0;
}
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
