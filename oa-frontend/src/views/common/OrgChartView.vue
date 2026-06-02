<template>
  <div class="org-chart-page">
    <div class="page-header">
      <h2>集團組織架構</h2>
      <div class="header-actions">
        <div class="legend">
          <span v-for="item in LEGEND" :key="item.type" class="legend-item">
            <span class="legend-dot" :style="{ background: item.color }" />
            {{ item.label }}
          </span>
        </div>
        <el-button-group>
          <el-button size="small" :icon="ZoomIn" @click="zoomIn" />
          <el-button size="small" :icon="ZoomOut" @click="zoomOut" />
          <el-button size="small" :icon="Refresh" @click="resetZoom">還原</el-button>
        </el-button-group>
        <el-button size="small" :icon="RefreshRight" :loading="loading" @click="loadData">重新整理</el-button>
      </div>
    </div>

    <el-card class="chart-card" v-loading="loading" element-loading-text="載入組織資料…">
      <div v-if="!loading && !chartData" class="empty-state">
        <el-empty description="暫無組織資料" />
      </div>
      <div v-else ref="chartEl" class="chart-container" />
    </el-card>

    <!-- Node detail tooltip -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="360px" direction="rtl">
      <div v-if="drawerNode" class="drawer-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="類型">
            <el-tag :color="nodeColor(drawerNode._type)" style="color:#fff">
              {{ nodeTypeLabel(drawerNode._type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="drawerNode._code" label="代碼">{{ drawerNode._code }}</el-descriptions-item>
          <el-descriptions-item label="名稱">{{ drawerNode._name }}</el-descriptions-item>
          <el-descriptions-item v-if="drawerNode._person" label="負責人">{{ drawerNode._person }}</el-descriptions-item>
          <el-descriptions-item label="成員人數">{{ drawerNode._count }} 人</el-descriptions-item>
        </el-descriptions>

        <template v-if="drawerNode._members?.length">
          <div class="member-title">成員列表</div>
          <div class="member-list">
            <div v-for="m in drawerNode._members" :key="m.id" class="member-item">
              <el-avatar :size="32" :src="m.avatarUrl">{{ m.displayName?.[0] }}</el-avatar>
              <div class="member-info">
                <div class="member-name">{{ m.displayName }}</div>
                <div class="member-meta">{{ m.position ?? '' }}{{ m.jobLevel ? `  ${m.jobLevel.name}` : '' }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ZoomIn, ZoomOut, Refresh, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts/core'
import { TreeChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { orgChartApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'

echarts.use([TreeChart, TooltipComponent, SVGRenderer])

// ── 常數 ───────────────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  group:         '#1D4ED8',
  business_unit: '#2563EB',
  project:       '#059669',
  department:    '#B45309',
}

const NODE_SIZES: Record<string, [number, number]> = {
  group:         [140, 44],
  business_unit: [172, 66],
  project:       [162, 64],
  department:    [160, 62],
}

const LEGEND = [
  { type: 'business_unit', color: NODE_COLORS.business_unit, label: '事業部' },
  { type: 'project',       color: NODE_COLORS.project,       label: '項目'   },
  { type: 'department',    color: NODE_COLORS.department,     label: '部門'   },
]

// ── State ─────────────────────────────────────────────
const ui = useUiStore()
const chartEl  = ref<HTMLElement>()
const loading  = ref(false)
const chartData = ref<any>(null)
let chart: echarts.ECharts | null = null

const drawerVisible = ref(false)
const drawerTitle   = ref('')
const drawerNode    = ref<any>(null)

// ── Data helpers ──────────────────────────────────────
function nodeColor(type: string) { return NODE_COLORS[type] ?? '#6B7280' }
function nodeTypeLabel(type: string) {
  const m: Record<string, string> = {
    group: '集團', business_unit: '事業部', project: '項目', department: '部門',
  }
  return m[type] ?? type
}

function getPerson(node: any): string {
  if (node.type === 'business_unit') return node.headUser?.displayName ?? ''
  if (node.type === 'project')       return node.projectOwner?.displayName ?? ''
  if (node.type === 'department')    return node.manager?.displayName ?? ''
  return ''
}

function transformNode(node: any, depth = 0): any {
  const type    = node.type as string
  const color   = NODE_COLORS[type] ?? '#6B7280'
  const size    = NODE_SIZES[type]  ?? [150, 58]
  const person  = getPerson(node)
  const code    = node.code ?? ''
  const count   = node.memberCount ?? 0

  const eNode: any = {
    name: node.name,
    // store extra for click handler
    _type:    type,
    _code:    code,
    _name:    node.name,
    _person:  person,
    _count:   count,
    _members: node.members ?? [],

    symbolSize: size,
    symbol:     'roundRect',
    itemStyle:  { color, borderWidth: 0 },
    label: {
      show:     true,
      position: 'inside',
      color:    '#fff',
      formatter: () => {
        const codePart = code ? `{code|${code}}  ` : ''
        const nameLine = `{name|${codePart}${node.name}}`
        const sub2 = person ? `{sub|${person}  ·  ${count}人}` : `{sub|${count}人}`
        return `${nameLine}\n${sub2}`
      },
      rich: {
        code: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 'normal' },
        name: { fontSize: 12, color: '#fff', fontWeight: 'bold',  lineHeight: 20 },
        sub:  { fontSize: 10, color: 'rgba(255,255,255,0.85)', lineHeight: 16 },
      },
    },
    // collapse departments & below by default
    collapsed: depth >= 3,
    children: (node.children ?? []).map((c: any) => transformNode(c, depth + 1)),
  }

  return eNode
}

// ── Chart lifecycle ───────────────────────────────────
function buildOption(raw: any) {
  const tree = transformNode(raw)
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const d = params.data
        const lines = [`<b>${d._name}</b>`]
        if (d._code)   lines.push(`代碼：${d._code}`)
        if (d._person) lines.push(`負責人：${d._person}`)
        lines.push(`成員：${d._count} 人`)
        return lines.join('<br/>')
      },
    },
    series: [
      {
        type: 'tree',
        data: [tree],
        orient: 'TB',
        layout: 'orthogonal',
        roam: true,
        expandAndCollapse: true,
        initialTreeDepth: 3,
        symbolSize: 10,
        lineStyle: { color: '#CBD5E1', width: 1.5, curveness: 0 },
        leaves: { label: { show: true } },
        animationDuration: 300,
      },
    ],
  }
}

function initChart() {
  if (!chartEl.value) return
  chart = echarts.init(chartEl.value, undefined, { renderer: 'svg' })
  chart.on('click', (params: any) => {
    const d = params.data
    if (!d?._type) return
    drawerNode.value    = d
    drawerTitle.value   = `${nodeTypeLabel(d._type)}：${d._name}`
    drawerVisible.value = true
  })
  window.addEventListener('resize', handleResize)
}

function handleResize() { chart?.resize() }

function zoomIn()    { chart?.dispatchAction({ type: 'zoom', zoomFactor: 1.2 }) }
function zoomOut()   { chart?.dispatchAction({ type: 'zoom', zoomFactor: 0.8 }) }
function resetZoom() { chart?.dispatchAction({ type: 'restore' }) }

async function loadData() {
  loading.value = true
  try {
    const raw = await orgChartApi.getGroupChart()
    chartData.value = raw
    await nextTick()
    if (!chart) initChart()
    chart?.setOption(buildOption(raw), true)
    chart?.resize()
  } catch {
    ElMessage.error('載入組織架構失敗')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  ui.setBreadcrumbs([{ title: '資訊中心' }, { title: '組織架構' }])
  loadData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.org-chart-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.legend {
  display: flex;
  align-items: center;
  gap: 12px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #606266;
}
.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.chart-card {
  flex: 1;
  min-height: 0;
}
.chart-card :deep(.el-card__body) {
  height: calc(100vh - 180px);
  padding: 0;
}

.chart-container {
  width: 100%;
  height: 100%;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* Drawer */
.drawer-content { padding: 4px 0; }

.member-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #EBEEF5;
}

.member-list { display: flex; flex-direction: column; gap: 10px; }
.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.member-info { flex: 1; min-width: 0; }
.member-name { font-size: 13px; font-weight: 500; color: #303133; }
.member-meta { font-size: 11px; color: #909399; margin-top: 1px; }
</style>
