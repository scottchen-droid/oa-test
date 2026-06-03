<template>
  <div class="org-chart-page">
    <div class="page-header">
      <h2>{{ $t('nav.orgChart') }}</h2>
      <div class="header-actions">
        <div class="legend">
          <span v-for="item in legend" :key="item.type" class="legend-item">
            <span class="legend-dot" :style="{ background: item.color }" />
            {{ item.label }}
          </span>
        </div>
        <el-button-group>
          <el-button size="small" :icon="ZoomIn"  @click="zoomIn" />
          <el-button size="small" :icon="ZoomOut" @click="zoomOut" />
          <el-button size="small" :icon="Refresh" @click="resetZoom">{{ $t('common.refresh') }}</el-button>
        </el-button-group>
        <el-button size="small" :icon="RefreshRight" :loading="loading" @click="loadData">
          {{ $t('common.refresh') }}
        </el-button>
      </div>
    </div>

    <el-card class="chart-card" v-loading="loading" :element-loading-text="$t('common.loading')">
      <div v-if="!loading && !chartData" class="empty-state">
        <el-empty :description="$t('common.noData')" />
      </div>
      <div v-else ref="chartEl" class="chart-container" />
    </el-card>

    <!-- 節點詳情側抽屜 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="380px" direction="rtl">
      <div v-if="drawerNode" class="drawer-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item :label="$t('common.type')">
            <el-tag :color="nodeColor(drawerNode._type)" style="color:#fff">
              {{ nodeTypeLabel(drawerNode._type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="drawerNode._code" :label="$t('common.code')">
            {{ drawerNode._code }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('common.name')">{{ drawerNode._name }}</el-descriptions-item>
          <el-descriptions-item v-if="drawerNode._person" :label="$t('user.directManager')">
            {{ drawerNode._person }}
          </el-descriptions-item>
          <el-descriptions-item :label="$t('hr.totalEmployees')">
            {{ drawerNode._count }} 人
          </el-descriptions-item>
        </el-descriptions>

        <template v-if="drawerNode._members?.length">
          <div class="member-title">{{ $t('manager.applicant') }}</div>
          <div class="member-list">
            <div v-for="m in drawerNode._members" :key="m.id" class="member-item">
              <el-avatar :size="32" :src="m.avatarUrl">{{ m.displayName?.[0] }}</el-avatar>
              <div class="member-info">
                <div class="member-name">{{ m.displayName }}</div>
                <div class="member-meta">
                  {{ m.position ?? '' }}{{ m.jobLevel ? `  ·  ${m.jobLevel.name}` : '' }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ZoomIn, ZoomOut, Refresh, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts/core'
import { TreeChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { orgChartApi } from '@/api/organizations.api'
import { useUiStore } from '@/stores/ui.store'

echarts.use([TreeChart, TooltipComponent, SVGRenderer])

const { t } = useI18n()
const ui = useUiStore()

// ── 顏色配置 ─────────────────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  group:         '#1e3a5f',
  business_unit: '#1D4ED8',
  project:       '#059669',
  department:    '#B45309',
  virtual:       '#64748B',
}

const legend = computed(() => [
  { type: 'business_unit', color: NODE_COLORS.business_unit, label: t('org.businessUnit') },
  { type: 'project',       color: NODE_COLORS.project,       label: t('org.project') },
  { type: 'department',    color: NODE_COLORS.department,     label: t('org.department') },
])

// ── State ─────────────────────────────────────────────────────
const chartEl   = ref<HTMLElement>()
const loading   = ref(false)
const chartData = ref<any>(null)
let chart: echarts.ECharts | null = null

const drawerVisible = ref(false)
const drawerTitle   = ref('')
const drawerNode    = ref<any>(null)

// ── Helpers ───────────────────────────────────────────────────
function nodeColor(type: string) { return NODE_COLORS[type] ?? '#6B7280' }

function nodeTypeLabel(type: string) {
  const m: Record<string, string> = {
    group: t('org.orgStructure'), business_unit: t('org.businessUnit'),
    project: t('org.project'), department: t('org.department'),
  }
  return m[type] ?? type
}

function getPerson(node: any): string {
  if (node.type === 'business_unit') return node.headUser?.displayName ?? ''
  if (node.type === 'project')       return node.projectOwner?.displayName ?? ''
  if (node.type === 'department')    return node.manager?.displayName ?? ''
  return ''
}

// ── Tree transform ────────────────────────────────────────────
function transformNode(node: any, depth = 0): any {
  const type   = node.isVirtual ? 'virtual' : (node.type as string)
  const color  = NODE_COLORS[type] ?? '#6B7280'
  const person = getPerson(node)
  const code   = node.code ?? ''
  const count  = node.memberCount ?? 0

  // Node dimensions — compact and proportional
  const nodeW = type === 'group' ? 100 : type === 'business_unit' ? 120 : type === 'project' ? 110 : 100
  const nodeH = 48

  const eNode: any = {
    name: `${node.id ?? node.name}_${depth}`, // unique name for echarts
    _type:    type,
    _code:    code,
    _name:    node.name,
    _person:  person,
    _count:   count,
    _members: node.members ?? [],

    symbolSize: [nodeW, nodeH],
    symbol:     'roundRect',
    itemStyle:  { color, borderWidth: 0, borderRadius: 6 },
    label: {
      show:     true,
      position: 'inside',
      color:    '#fff',
      formatter: () => {
        const namePart = node.name.length > 8 ? node.name.slice(0, 7) + '…' : node.name
        const sub = person
          ? `{sub|${person.slice(0, 8)} · ${count}人}`
          : `{sub|${count} 人}`
        return `{name|${namePart}}\n${sub}`
      },
      rich: {
        name: { fontSize: 12, color: '#fff', fontWeight: 'bold', lineHeight: 18 },
        sub:  { fontSize: 10, color: 'rgba(255,255,255,0.85)', lineHeight: 14 },
      },
    },
    collapsed: depth >= 2,
    children: (node.children ?? []).map((c: any) => transformNode(c, depth + 1)),
  }

  return eNode
}

// ── Chart option ──────────────────────────────────────────────
function buildOption(raw: any) {
  const tree = transformNode(raw)

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const d = params.data
        if (!d?._name) return ''
        const lines = [`<b>${d._name}</b>`]
        if (d._code)   lines.push(`${t('common.code')}：${d._code}`)
        if (d._person) lines.push(`負責人：${d._person}`)
        lines.push(`${t('hr.totalEmployees')}：${d._count} 人`)
        return lines.join('<br/>')
      },
    },
    series: [
      {
        type:    'tree',
        data:    [tree],
        orient:  'LR',               // 改為左右佈局，避免寬度方向重疊
        layout:  'orthogonal',
        roam:    true,
        expandAndCollapse: true,
        initialTreeDepth:  2,

        // 節點間距設定
        edgeShape:    'curve',
        edgeForkPosition: '63%',
        lineStyle:    { color: '#CBD5E1', width: 1.5, curveness: 0.5 },

        // 葉節點自動收摺提示
        leaves: {
          label: { show: true, position: 'inside' },
        },

        // 讓 ECharts 自動計算佈局時給足空間
        top:    '5%',
        bottom: '5%',
        left:   '3%',
        right:  '20%',

        animationDuration:     300,
        animationDurationUpdate: 500,
      },
    ],
  }
}

// ── Chart lifecycle ───────────────────────────────────────────
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

function zoomIn()    { chart?.dispatchAction({ type: 'zoom', zoomFactor: 1.25 }) }
function zoomOut()   { chart?.dispatchAction({ type: 'zoom', zoomFactor: 0.8 }) }
function resetZoom() {
  if (!chart || !chartData.value) return
  chart.setOption(buildOption(chartData.value), true)
  chart.resize()
}

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
    ElMessage.error(t('msg.loadFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  ui.setBreadcrumbs([{ title: t('nav.infoCenter') }, { title: t('nav.orgChart') }])
  loadData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.org-chart-page { display: flex; flex-direction: column; height: 100%; }

.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
}
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }

.header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.legend { display: flex; align-items: center; gap: 14px; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #606266; }
.legend-dot  { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }

.chart-card { flex: 1; min-height: 0; }
.chart-card :deep(.el-card__body) {
  height: calc(100vh - 200px);
  padding: 0;
  overflow: hidden;
}

.chart-container { width: 100%; height: 100%; }

.empty-state { display: flex; align-items: center; justify-content: center; height: 100%; }

/* Drawer */
.drawer-content { padding: 4px 0; }
.member-title {
  font-size: 13px; font-weight: 600; color: #303133;
  margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #EBEEF5;
}
.member-list  { display: flex; flex-direction: column; gap: 10px; }
.member-item  { display: flex; align-items: center; gap: 10px; }
.member-info  { flex: 1; min-width: 0; }
.member-name  { font-size: 13px; font-weight: 500; color: #303133; }
.member-meta  { font-size: 11px; color: #909399; margin-top: 1px; }
</style>
