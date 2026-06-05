<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('org.orgStructure') }}</h2>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="org-tabs" @tab-click="onTabClick">

      <!-- ── 地區 ─────────────────────────────────────────────── -->
      <el-tab-pane :label="$t('org.region')" name="regions">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" size="small" @click="openCreate('region')">
            {{ $t('org.createRegion') }}
          </el-button>
        </div>
        <el-table v-loading="loading.regions" :data="data.regions" border stripe size="small">
          <el-table-column prop="code" :label="$t('common.code')" width="100" />
          <el-table-column prop="name" :label="$t('common.name')" width="140" />
          <el-table-column prop="timezone" :label="$t('org.timezone')" />
          <el-table-column prop="currencyCode" :label="$t('org.currencyCode')" width="80" />
          <el-table-column prop="defaultLocale" :label="$t('org.defaultLocale')" width="110">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ localeLabel(row.defaultLocale) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.status')" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                {{ row.isActive ? $t('status.active') : $t('status.inactive') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="140" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="openEdit('region', row)">{{ $t('common.edit') }}</el-button>
              <el-button text size="small" :type="row.isActive ? 'danger' : 'success'" @click="doToggle('region', row)">
                {{ row.isActive ? $t('common.disable') : $t('common.enable') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ── 公司 ─────────────────────────────────────────────── -->
      <el-tab-pane :label="$t('org.company')" name="companies">
        <div class="tab-toolbar">
          <el-select v-model="filters.regionId" :placeholder="`${$t('common.filter')} ${$t('org.region')}`" clearable size="small" style="width:160px" @change="loadCompanies">
            <el-option v-for="r in data.regions" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
          <el-button type="primary" :icon="Plus" size="small" @click="openCreate('company')">{{ $t('org.createCompany') }}</el-button>
        </div>
        <el-table v-loading="loading.companies" :data="data.companies" border stripe size="small">
          <el-table-column prop="code" :label="$t('common.code')" width="120" />
          <el-table-column prop="name" :label="$t('org.companyName')" />
          <el-table-column prop="legalName" :label="$t('org.legalName')" show-overflow-tooltip />
          <el-table-column :label="$t('org.region')" width="100">
            <template #default="{ row }">{{ row.region?.name ?? '—' }}</template>
          </el-table-column>
          <el-table-column prop="currencyCode" :label="$t('org.currencyCode')" width="80" />
          <el-table-column :label="$t('common.status')" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
                {{ row.isActive ? $t('status.active') : $t('status.inactive') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="140" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="openEdit('company', row)">{{ $t('common.edit') }}</el-button>
              <el-button text size="small" :type="row.isActive ? 'danger' : 'success'" @click="doToggle('company', row)">
                {{ row.isActive ? $t('common.disable') : $t('common.enable') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ── 事業部 ──────────────────────────────────────────── -->
      <el-tab-pane :label="$t('org.businessUnit')" name="business-units">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" size="small" @click="openCreate('bu')">{{ $t('org.createBU') }}</el-button>
        </div>
        <el-table v-loading="loading.bus" :data="data.bus" border stripe size="small">
          <el-table-column prop="code" :label="$t('common.code')" width="120" />
          <el-table-column prop="name" :label="$t('common.name')" />
          <el-table-column prop="description" :label="$t('common.description')" show-overflow-tooltip />
          <el-table-column :label="$t('common.status')" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? $t('status.active') : $t('status.inactive') }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="140" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="openEdit('bu', row)">{{ $t('common.edit') }}</el-button>
              <el-button text size="small" :type="row.isActive ? 'danger' : 'success'" @click="doToggle('bu', row)">
                {{ row.isActive ? $t('common.disable') : $t('common.enable') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ── 項目 ─────────────────────────────────────────────── -->
      <el-tab-pane :label="$t('org.project')" name="projects">
        <div class="tab-toolbar">
          <el-select v-model="filters.businessUnitId" :placeholder="`${$t('common.filter')} ${$t('org.businessUnit')}`" clearable size="small" style="width:180px" @change="loadProjects">
            <el-option v-for="b in data.bus" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
          <el-button type="primary" :icon="Plus" size="small" @click="openCreate('project')">{{ $t('org.createProject') }}</el-button>
        </div>
        <el-table v-loading="loading.projects" :data="data.projects" border stripe size="small">
          <el-table-column prop="code" :label="$t('common.code')" width="100" />
          <el-table-column prop="name" :label="$t('common.name')" />
          <el-table-column :label="$t('org.businessUnit')" width="140">
            <template #default="{ row }">{{ row.businessUnit?.name ?? '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('common.startDate')" width="110">
            <template #default="{ row }">{{ row.startDate?.slice(0,10) ?? '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('common.status')" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? $t('status.active') : $t('status.inactive') }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="140" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="openEdit('project', row)">{{ $t('common.edit') }}</el-button>
              <el-button text size="small" :type="row.isActive ? 'danger' : 'success'" @click="doToggle('project', row)">
                {{ row.isActive ? $t('common.disable') : $t('common.enable') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ── 部門 ─────────────────────────────────────────────── -->
      <el-tab-pane :label="$t('org.department')" name="departments">
        <div class="tab-toolbar">
          <el-select v-model="filters.deptCompanyId" :placeholder="`${$t('common.filter')} ${$t('org.company')}`" clearable size="small" style="width:200px" @change="loadDepts">
            <el-option v-for="c in data.companies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-button v-if="filters.deptCompanyId" type="primary" :icon="Plus" size="small" @click="openCreate('dept')">{{ $t('org.createDept') }}</el-button>
        </div>
        <el-empty v-if="!filters.deptCompanyId" :description="$t('org.selectCompanyFirst')" />
        <el-table v-else v-loading="loading.depts" :data="data.depts" border stripe size="small">
          <el-table-column prop="code" :label="$t('common.code')" width="120" />
          <el-table-column prop="name" :label="$t('common.name')" />
          <el-table-column :label="$t('common.actions')" width="80" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="openEdit('dept', row)">{{ $t('common.edit') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ── 職位 ─────────────────────────────────────────────── -->
      <el-tab-pane :label="$t('org.position')" name="positions">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" size="small" @click="openCreate('position')">{{ $t('org.createPosition') }}</el-button>
        </div>
        <el-table v-loading="loading.positions" :data="data.positions" border stripe size="small">
          <el-table-column prop="code" :label="$t('common.code')" width="120" />
          <el-table-column prop="name" :label="$t('common.name')" />
          <el-table-column :label="$t('org.company')" width="140">
            <template #default="{ row }">{{ row.company?.name ?? '（全局通用）' }}</template>
          </el-table-column>
          <el-table-column prop="description" :label="$t('common.description')" show-overflow-tooltip />
          <el-table-column :label="$t('common.actions')" width="80" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="openEdit('position', row)">{{ $t('common.edit') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ── 職級 ─────────────────────────────────────────────── -->
      <el-tab-pane :label="$t('org.jobLevel')" name="job-levels">
        <div class="tab-toolbar">
          <el-button type="primary" :icon="Plus" size="small" @click="openCreate('jobLevel')">{{ $t('org.createJobLevel') }}</el-button>
        </div>
        <el-table v-loading="loading.jobLevels" :data="data.jobLevels" border stripe size="small">
          <el-table-column prop="code" :label="$t('common.code')" width="100" />
          <el-table-column prop="name" :label="$t('common.name')" width="100" />
          <el-table-column prop="levelOrder" :label="$t('org.levelOrder')" width="80" align="center" />
          <el-table-column prop="description" :label="$t('common.description')" show-overflow-tooltip />
          <el-table-column :label="$t('common.status')" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? $t('status.active') : $t('status.inactive') }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="80" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="openEdit('jobLevel', row)">{{ $t('common.edit') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

    </el-tabs>

    <!-- ── 地區 Dialog ──────────────────────────────────────── -->
    <el-dialog v-model="dialogs.region" :title="editRow.region ? $t('org.editRegion') : $t('org.createRegion')" width="620px">
      <el-tabs v-model="dialogTab">
        <el-tab-pane label="基本資訊" name="info">
          <el-form ref="regionRef" :model="forms.region" :rules="baseRules" label-width="110px" style="margin-top:8px">
            <el-form-item :label="$t('common.code')" prop="code">
              <el-input v-model="forms.region.code" :disabled="!!editRow.region" />
            </el-form-item>
            <el-form-item :label="$t('common.name')" prop="name">
              <el-input v-model="forms.region.name" />
            </el-form-item>
            <el-form-item :label="$t('org.timezone')">
              <el-input v-model="forms.region.timezone" placeholder="如 Asia/Taipei" />
            </el-form-item>
            <el-form-item :label="$t('org.currencyCode')">
              <el-input v-model="forms.region.currencyCode" placeholder="如 TWD" />
            </el-form-item>
            <el-form-item :label="$t('org.defaultLocale')">
              <el-select v-model="forms.region.defaultLocale" style="width:100%">
                <el-option label="繁體中文 (zh-TW)" value="zh-TW" />
                <el-option label="简体中文 (zh-CN)" value="zh-CN" />
                <el-option label="English (en)"      value="en" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane v-if="editRow.region" label="審批職能" name="assignments">
          <ApprovalAssignmentPanel scope-type="region" :scope-id="editRow.region.id" style="margin-top:8px" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogs.region = false">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="dialogTab === 'info'" type="primary" :loading="saving" @click="doSave('region')">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- ── 公司 Dialog ──────────────────────────────────────── -->
    <el-dialog v-model="dialogs.company" :title="editRow.company ? $t('org.editCompany') : $t('org.createCompany')" width="620px">
      <el-tabs v-model="dialogTab">
        <el-tab-pane label="基本資訊" name="info">
          <el-form ref="companyRef" :model="forms.company" :rules="baseRules" label-width="110px" style="margin-top:8px">
            <el-form-item :label="$t('common.code')" prop="code">
              <el-input v-model="forms.company.code" :disabled="!!editRow.company" />
            </el-form-item>
            <el-form-item :label="$t('org.companyName')" prop="name">
              <el-input v-model="forms.company.name" />
            </el-form-item>
            <el-form-item :label="$t('org.legalName')">
              <el-input v-model="forms.company.legalName" />
            </el-form-item>
            <el-form-item :label="$t('org.region')" prop="regionId">
              <el-select v-model="forms.company.regionId" style="width:100%">
                <el-option v-for="r in data.regions" :key="r.id" :label="r.name" :value="r.id" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('org.taxId')">
              <el-input v-model="forms.company.taxId" />
            </el-form-item>
            <el-form-item :label="$t('org.currencyCode')">
              <el-input v-model="forms.company.currencyCode" placeholder="如 TWD" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane v-if="editRow.company" label="審批職能" name="assignments">
          <ApprovalAssignmentPanel scope-type="company" :scope-id="editRow.company.id" style="margin-top:8px" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogs.company = false">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="dialogTab === 'info'" type="primary" :loading="saving" @click="doSave('company')">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- ── 事業部 Dialog ────────────────────────────────────── -->
    <el-dialog v-model="dialogs.bu" :title="editRow.bu ? $t('org.editBU') : $t('org.createBU')" width="620px">
      <el-tabs v-model="dialogTab">
        <el-tab-pane label="基本資訊" name="info">
          <el-form ref="buRef" :model="forms.bu" :rules="baseRules" label-width="100px" style="margin-top:8px">
            <el-form-item :label="$t('common.code')" prop="code">
              <el-input v-model="forms.bu.code" :disabled="!!editRow.bu" />
            </el-form-item>
            <el-form-item :label="$t('common.name')" prop="name">
              <el-input v-model="forms.bu.name" />
            </el-form-item>
            <el-form-item :label="$t('common.description')">
              <el-input v-model="forms.bu.description" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item label="事業部負責人">
              <el-select v-model="forms.bu.headUserId" clearable filterable remote
                :remote-method="searchEmployees" :loading="empSearchLoading" style="width:100%" placeholder="搜尋員工">
                <el-option v-for="u in empSearchResults" :key="u.id" :label="`${u.displayName} (${u.employeeNo})`" :value="u.id" />
              </el-select>
              <div class="field-note">設定後審批流「事業部負責人」節點將以此人為主要審批人</div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane v-if="editRow.bu" label="審批職能" name="assignments">
          <ApprovalAssignmentPanel scope-type="business_unit" :scope-id="editRow.bu.id" style="margin-top:8px" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogs.bu = false">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="dialogTab === 'info'" type="primary" :loading="saving" @click="doSave('bu')">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- ── 項目 Dialog ──────────────────────────────────────── -->
    <el-dialog v-model="dialogs.project" :title="editRow.project ? $t('org.editProject') : $t('org.createProject')" width="620px">
      <el-tabs v-model="dialogTab">
        <el-tab-pane label="基本資訊" name="info">
          <el-form ref="projectRef" :model="forms.project" :rules="baseRules" label-width="100px" style="margin-top:8px">
            <el-form-item :label="$t('common.code')" prop="code">
              <el-input v-model="forms.project.code" :disabled="!!editRow.project" />
            </el-form-item>
            <el-form-item :label="$t('common.name')" prop="name">
              <el-input v-model="forms.project.name" />
            </el-form-item>
            <el-form-item :label="$t('org.businessUnit')">
              <el-select v-model="forms.project.businessUnitId" clearable style="width:100%">
                <el-option v-for="b in data.bus" :key="b.id" :label="b.name" :value="b.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="項目負責人">
              <el-select v-model="forms.project.projectOwnerUserId" clearable filterable remote
                :remote-method="searchEmployees" :loading="empSearchLoading" style="width:100%" placeholder="搜尋員工">
                <el-option v-for="u in empSearchResults" :key="u.id" :label="`${u.displayName} (${u.employeeNo})`" :value="u.id" />
              </el-select>
              <div class="field-note">設定後審批流「項目負責人」節點將以此人為主要審批人</div>
            </el-form-item>
            <el-form-item :label="$t('common.description')">
              <el-input v-model="forms.project.description" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item :label="$t('common.startDate')">
              <el-date-picker v-model="forms.project.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
            <el-form-item :label="$t('common.endDate')">
              <el-date-picker v-model="forms.project.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane v-if="editRow.project" label="審批職能" name="assignments">
          <ApprovalAssignmentPanel scope-type="project" :scope-id="editRow.project.id" style="margin-top:8px" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogs.project = false">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="dialogTab === 'info'" type="primary" :loading="saving" @click="doSave('project')">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- ── 部門 Dialog ──────────────────────────────────────── -->
    <el-dialog v-model="dialogs.dept" :title="editRow.dept ? $t('org.editDept') : $t('org.createDept')" width="620px">
      <el-tabs v-model="dialogTab">
        <el-tab-pane label="基本資訊" name="info">
          <el-form ref="deptRef" :model="forms.dept" :rules="baseRules" label-width="110px" style="margin-top:8px">
            <el-form-item :label="$t('org.company')">
              <el-select v-model="forms.dept.companyId" style="width:100%">
                <el-option v-for="c in data.companies" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('org.parentDept')">
              <el-select v-model="forms.dept.parentDepartmentId" clearable placeholder="無（頂層部門）" style="width:100%">
                <el-option v-for="d in data.depts.filter((d: any) => d.id !== editRow.dept?.id)" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('common.code')" prop="code">
              <el-input v-model="forms.dept.code" />
            </el-form-item>
            <el-form-item :label="$t('common.name')" prop="name">
              <el-input v-model="forms.dept.name" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane v-if="editRow.dept" label="審批職能" name="assignments">
          <ApprovalAssignmentPanel scope-type="department" :scope-id="editRow.dept.id" style="margin-top:8px" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogs.dept = false">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="dialogTab === 'info'" type="primary" :loading="saving" @click="doSave('dept')">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- ── 職位 Dialog ──────────────────────────────────────── -->
    <el-dialog v-model="dialogs.position" :title="editRow.position ? $t('org.editPosition') : $t('org.createPosition')" width="460px">
      <el-form ref="positionRef" :model="forms.position" :rules="baseRules" label-width="110px">
        <el-form-item :label="$t('org.company')">
          <el-select v-model="forms.position.companyId" clearable placeholder="不限（全局通用）" style="width:100%">
            <el-option v-for="c in data.companies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('common.code')" prop="code">
          <el-input v-model="forms.position.code" />
        </el-form-item>
        <el-form-item :label="$t('common.name')" prop="name">
          <el-input v-model="forms.position.name" />
        </el-form-item>
        <el-form-item :label="$t('common.description')">
          <el-input v-model="forms.position.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogs.position = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="doSave('position')">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- ── 職級 Dialog ──────────────────────────────────────── -->
    <el-dialog v-model="dialogs.jobLevel" :title="editRow.jobLevel ? $t('org.editJobLevel') : $t('org.createJobLevel')" width="460px">
      <el-form ref="jobLevelRef" :model="forms.jobLevel" :rules="baseRules" label-width="100px">
        <el-form-item :label="$t('common.code')" prop="code">
          <el-input v-model="forms.jobLevel.code" :disabled="!!editRow.jobLevel" placeholder="如 P1 / M3" />
        </el-form-item>
        <el-form-item :label="$t('common.name')" prop="name">
          <el-input v-model="forms.jobLevel.name" />
        </el-form-item>
        <el-form-item :label="$t('org.levelOrder')">
          <el-input-number v-model="forms.jobLevel.levelOrder" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('common.description')">
          <el-input v-model="forms.jobLevel.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogs.jobLevel = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="doSave('jobLevel')">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import {
  regionsApi, companiesApi, businessUnitsApi, projectsApi,
  departmentsApi, positionsApi, jobLevelsApi,
} from '@/api/organizations.api'
import { usersApi } from '@/api/users.api'
import { useUiStore } from '@/stores/ui.store'
import ApprovalAssignmentPanel from '@/components/ApprovalAssignmentPanel.vue'

const { t } = useI18n()
const ui = useUiStore()

const empSearchLoading = ref(false)
const empSearchResults = ref<any[]>([])
async function searchEmployees(q: string) {
  if (!q) return
  empSearchLoading.value = true
  try { const r = await usersApi.getAll({ search: q, limit: 20 }); empSearchResults.value = r.items ?? [] }
  finally { empSearchLoading.value = false }
}

const activeTab  = ref('regions')
const saving     = ref(false)
const dialogTab  = ref('info')

// ── Loading flags ─────────────────────────────────────────────
const loading = reactive({
  regions: false, companies: false, bus: false, projects: false,
  depts: false, positions: false, jobLevels: false,
})

// ── Data lists ────────────────────────────────────────────────
const data = reactive<Record<string, any[]>>({
  regions: [], companies: [], bus: [], projects: [],
  depts: [], positions: [], jobLevels: [],
})

// ── Filters ───────────────────────────────────────────────────
const filters = reactive({ regionId: '', businessUnitId: '', deptCompanyId: '' })

// ── Dialogs & editing rows ────────────────────────────────────
const dialogs = reactive<Record<string, boolean>>({
  region: false, company: false, bu: false, project: false,
  dept: false, position: false, jobLevel: false,
})
const editRow = reactive<Record<string, any>>({
  region: null, company: null, bu: null, project: null,
  dept: null, position: null, jobLevel: null,
})

// ── Form refs ─────────────────────────────────────────────────
const regionRef   = ref<FormInstance>()
const companyRef  = ref<FormInstance>()
const buRef       = ref<FormInstance>()
const projectRef  = ref<FormInstance>()
const deptRef     = ref<FormInstance>()
const positionRef = ref<FormInstance>()
const jobLevelRef = ref<FormInstance>()

const formRefs: Record<string, any> = {
  region: regionRef, company: companyRef, bu: buRef, project: projectRef,
  dept: deptRef, position: positionRef, jobLevel: jobLevelRef,
}

// ── Forms (only DTO-relevant fields — no id/createdAt/etc.) ──
const forms = reactive<Record<string, any>>({
  region:   { code: '', name: '', timezone: '', currencyCode: '', defaultLocale: 'zh-TW' },
  company:  { regionId: '', code: '', name: '', legalName: '', taxId: '', currencyCode: '' },
  bu:       { code: '', name: '', description: '', headUserId: '' },
  project:  { businessUnitId: '', code: '', name: '', projectOwnerUserId: '', description: '', startDate: '', endDate: '' },
  dept:     { companyId: '', parentDepartmentId: '', code: '', name: '' },
  position: { companyId: '', code: '', name: '', description: '' },
  jobLevel: { code: '', name: '', levelOrder: 1, description: '' },
})

const baseRules: FormRules = {
  code: [{ required: true, message: t('common.required'), trigger: 'blur' }],
  name: [{ required: true, message: t('common.required'), trigger: 'blur' }],
  regionId: [{ required: true, message: t('common.required'), trigger: 'change' }],
}

// ── Helpers ───────────────────────────────────────────────────
function localeLabel(locale?: string) {
  const m: Record<string, string> = { 'zh-TW': '繁體中文', 'zh-CN': '简体中文', en: 'English' }
  return m[locale ?? ''] ?? locale ?? '—'
}

// ── Loaders ───────────────────────────────────────────────────
async function loadRegions() {
  loading.regions = true
  try { data.regions = await regionsApi.getAll() } finally { loading.regions = false }
}
async function loadCompanies() {
  loading.companies = true
  try { data.companies = await companiesApi.getAll(filters.regionId ? { regionId: filters.regionId } : {}) }
  finally { loading.companies = false }
}
async function loadBus() {
  loading.bus = true
  try { data.bus = await businessUnitsApi.getAll() } finally { loading.bus = false }
}
async function loadProjects() {
  loading.projects = true
  try { data.projects = await projectsApi.getAll(filters.businessUnitId ? { businessUnitId: filters.businessUnitId } : {}) }
  finally { loading.projects = false }
}
async function loadDepts() {
  if (!filters.deptCompanyId) { data.depts = []; return }
  loading.depts = true
  try { data.depts = await departmentsApi.getTree(filters.deptCompanyId) }
  finally { loading.depts = false }
}
async function loadPositions() {
  loading.positions = true
  try { data.positions = await positionsApi.getAll() } finally { loading.positions = false }
}
async function loadJobLevels() {
  loading.jobLevels = true
  try { data.jobLevels = await jobLevelsApi.getAll() } finally { loading.jobLevels = false }
}

const tabLoaders: Record<string, () => Promise<void> | void> = {
  regions: loadRegions, companies: loadCompanies, 'business-units': loadBus,
  projects: loadProjects, departments: loadDepts, positions: loadPositions, 'job-levels': loadJobLevels,
}

const loaded = new Set<string>()

function onTabClick(tab: any) {
  const name = tab.paneName ?? tab
  if (!loaded.has(name)) { tabLoaders[name]?.(); loaded.add(name) }
}

onMounted(async () => {
  ui.setBreadcrumbs([{ title: t('nav.systemModule') }, { title: t('nav.orgStructure') }])
  await Promise.all([loadRegions(), loadBus()])
  loaded.add('regions')
  loaded.add('business-units')
  await loadCompanies()
  loaded.add('companies')
})

// ── Open dialogs (map only DTO fields, not entire row) ───────
function openCreate(type: string) {
  editRow[type] = null
  resetForm(type)
  dialogTab.value = 'info'
  dialogs[type] = true
}

function openEdit(type: string, row: any) {
  editRow[type] = row
  mapRowToForm(type, row)
  dialogTab.value = 'info'
  dialogs[type] = true
}

function resetForm(type: string) {
  const defaults: Record<string, any> = {
    region:   { code: '', name: '', timezone: '', currencyCode: '', defaultLocale: 'zh-TW' },
    company:  { regionId: '', code: '', name: '', legalName: '', taxId: '', currencyCode: '' },
    bu:       { code: '', name: '', description: '', headUserId: '' },
    project:  { businessUnitId: '', code: '', name: '', projectOwnerUserId: '', description: '', startDate: '', endDate: '' },
    dept:     { companyId: filters.deptCompanyId, parentDepartmentId: '', code: '', name: '' },
    position: { companyId: '', code: '', name: '', description: '' },
    jobLevel: { code: '', name: '', levelOrder: 1, description: '' },
  }
  Object.assign(forms[type], defaults[type] ?? {})
}

function mapRowToForm(type: string, row: any) {
  // Only map DTO fields — never spread the whole row (avoids forbidNonWhitelisted errors)
  const maps: Record<string, (r: any) => Record<string, any>> = {
    region:   r => ({ code: r.code, name: r.name, timezone: r.timezone ?? '', currencyCode: r.currencyCode ?? '', defaultLocale: r.defaultLocale ?? 'zh-TW' }),
    company:  r => ({ regionId: r.regionId ?? r.region?.id ?? '', code: r.code, name: r.name, legalName: r.legalName ?? '', taxId: r.taxId ?? '', currencyCode: r.currencyCode ?? '' }),
    bu:       r => ({ code: r.code, name: r.name, description: r.description ?? '', headUserId: r.headUserId ?? r.headUser?.id ?? '' }),
    project:  r => ({ businessUnitId: r.businessUnitId ?? r.businessUnit?.id ?? '', code: r.code, name: r.name, projectOwnerUserId: r.projectOwnerUserId ?? r.projectOwner?.id ?? '', description: r.description ?? '', startDate: r.startDate?.slice(0,10) ?? '', endDate: r.endDate?.slice(0,10) ?? '' }),
    dept:     r => ({ companyId: r.companyId ?? r.company?.id ?? '', parentDepartmentId: r.parentDepartmentId ?? '', code: r.code, name: r.name }),
    position: r => ({ companyId: r.companyId ?? r.company?.id ?? '', code: r.code, name: r.name, description: r.description ?? '' }),
    jobLevel: r => ({ code: r.code, name: r.name, levelOrder: r.levelOrder, description: r.description ?? '' }),
  }
  Object.assign(forms[type], maps[type]?.(row) ?? {})
}

// ── Save ──────────────────────────────────────────────────────
async function doSave(type: string) {
  const ref = formRefs[type]?.value
  const valid = await ref?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    // Build payload: copy form, remove empty strings (send undefined for optional fields)
    const raw = { ...forms[type] }
    const payload: Record<string, any> = {}
    for (const [k, v] of Object.entries(raw)) {
      if (v !== '' && v !== null && v !== undefined) payload[k] = v
    }

    const row = editRow[type]
    if (type === 'region')    row ? await regionsApi.update(row.id, payload)       : await regionsApi.create(payload as any)
    else if (type === 'company')  row ? await companiesApi.update(row.id, payload)     : await companiesApi.create(payload as any)
    else if (type === 'bu')       row ? await businessUnitsApi.update(row.id, payload) : await businessUnitsApi.create(payload as any)
    else if (type === 'project')  row ? await projectsApi.update(row.id, payload)      : await projectsApi.create(payload as any)
    else if (type === 'dept')     row ? await departmentsApi.update(row.id, payload)   : await departmentsApi.create(payload as any)
    else if (type === 'position') row ? await positionsApi.update(row.id, payload)     : await positionsApi.create(payload as any)
    else if (type === 'jobLevel') row ? await jobLevelsApi.update(row.id, payload)     : await jobLevelsApi.create(payload as any)

    ElMessage.success(t('msg.saveSuccess'))
    dialogs[type] = false

    // Reload the affected tab
    const tabMap: Record<string, string> = {
      region: 'regions', company: 'companies', bu: 'business-units',
      project: 'projects', dept: 'departments', position: 'positions', jobLevel: 'job-levels',
    }
    tabLoaders[tabMap[type]]?.()
  } catch {
    ElMessage.error(t('msg.saveFailed'))
  } finally {
    saving.value = false
  }
}

// ── Toggle active ─────────────────────────────────────────────
async function doToggle(type: string, row: any) {
  try {
    if (type === 'region')   await regionsApi.toggleActive(row.id)
    else if (type === 'company')  await companiesApi.toggleActive(row.id)
    else if (type === 'bu')       await businessUnitsApi.toggleActive(row.id)
    else if (type === 'project')  await projectsApi.toggleActive(row.id)
    ElMessage.success(t('msg.toggleSuccess'))
    const tabMap: Record<string, string> = { region: 'regions', company: 'companies', bu: 'business-units', project: 'projects' }
    tabLoaders[tabMap[type]]?.()
  } catch {
    ElMessage.error(t('msg.operationFailed'))
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; margin-bottom: 16px; }
.page-header h2 { font-size: 20px; font-weight: 600; margin: 0; }
.org-tabs { min-height: 400px; }
.tab-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; }
.field-note { font-size: 11px; color: #909399; margin-top: 4px; }
</style>
