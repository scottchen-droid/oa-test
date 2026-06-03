<template>
  <div class="status-panel">
    <div class="request-info">
      <span class="no">{{ requestNo }}</span>
      <el-tag :type="tagType" size="default">{{ statusLabel }}</el-tag>
      <el-tag v-if="isDeleted" type="danger" size="small">已刪除</el-tag>
    </div>

    <el-timeline class="timeline">
      <el-timeline-item
        v-for="step in steps"
        :key="step.key"
        :type="step.type"
        :timestamp="step.time ?? ''"
        placement="top"
      >
        <div class="step-content">
          <span class="step-label">{{ step.label }}</span>
          <span v-if="step.person" class="step-person">— {{ step.person }}</span>
          <div v-if="step.note" class="step-note">{{ step.note }}</div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
  row: Record<string, any>
  type: 'leave' | 'overtime' | 'clock_patch'
}>()

function fmt(d?: string | null) {
  return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : null
}

const isDeleted = computed(() => !!props.row.deletedAt)

const requestNo = computed(() => {
  if (props.type === 'leave') return props.row.requestNo ?? ''
  if (props.type === 'overtime') return props.row.requestNo ?? ''
  return props.row.patchRequestNo ?? ''
})

const statusLabel = computed(() => {
  const s = props.type === 'clock_patch' ? props.row.patchStatus : props.row.status
  const m: Record<string, string> = {
    draft: '草稿', submitted: '待審核', approved: '已核准', rejected: '已駁回',
    canceled: '已取消', pending: '待審核', deleted: '已刪除',
  }
  return m[s] ?? s
})

const tagType = computed((): 'success' | 'warning' | 'danger' | 'info' => {
  const s = props.type === 'clock_patch' ? props.row.patchStatus : props.row.status
  const m: Record<string, any> = {
    draft: 'info', submitted: 'warning', pending: 'warning',
    approved: 'success', rejected: 'danger', canceled: 'info', deleted: 'danger',
  }
  return m[s] ?? 'info'
})

const steps = computed(() => {
  const list: Array<{ key: string; label: string; time: string | null; type: string; person?: string; note?: string }> = []

  if (props.type === 'clock_patch') {
    list.push({ key: 'submit', label: '提交補卡申請', time: fmt(props.row.createdAt), type: 'primary' })
    if (props.row.deletedAt) {
      list.push({ key: 'deleted', label: '申請人已刪除', time: fmt(props.row.deletedAt), type: 'danger' })
    } else if (props.row.patchStatus === 'approved') {
      list.push({ key: 'approved', label: '審核通過 — 出勤已更新', time: fmt(props.row.approvedAt), type: 'success', person: props.row.approver?.displayName })
    } else if (props.row.patchStatus === 'rejected') {
      list.push({ key: 'rejected', label: '審核駁回', time: fmt(props.row.approvedAt), type: 'danger', person: props.row.approver?.displayName, note: props.row.rejectedReason })
    } else {
      list.push({ key: 'pending', label: '等待審核', time: null, type: 'info' })
    }
    return list
  }

  // Leave / Overtime common flow
  list.push({ key: 'submit', label: '送出申請', time: fmt(props.row.submittedAt ?? props.row.createdAt), type: 'primary' })

  if (props.row.deletedAt) {
    list.push({ key: 'deleted', label: '申請人已刪除', time: fmt(props.row.deletedAt), type: 'danger' })
    return list
  }
  if (props.row.canceledAt) {
    list.push({ key: 'canceled', label: '已取消', time: fmt(props.row.canceledAt), type: 'info' })
    return list
  }

  const s = props.row.status
  if (s === 'approved') {
    list.push({ key: 'approved', label: '核准通過', time: fmt(props.row.approvedAt), type: 'success', person: props.row.approver?.displayName })
  } else if (s === 'rejected') {
    list.push({ key: 'rejected', label: '駁回', time: fmt(props.row.rejectedAt), type: 'danger', person: props.row.approver?.displayName, note: props.row.rejectedReason })
  } else {
    list.push({ key: 'pending', label: '等待主管審核', time: null, type: 'info' })
  }

  return list
})
</script>

<style scoped>
.status-panel { padding: 4px 0; }
.request-info { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.no { font-weight: 600; font-size: 14px; color: #303133; }
.timeline { margin-top: 0; }
.step-content { line-height: 1.5; }
.step-label { font-weight: 500; }
.step-person { color: #409eff; font-size: 13px; }
.step-note { margin-top: 4px; font-size: 12px; color: #f56c6c; background: #fef0f0; padding: 4px 8px; border-radius: 4px; }
</style>
