/**
 * seed-employees.ts — 每間公司建立 30 位員工
 *
 * 員工編號規則（純數字，5 位，全系統唯一）：
 *   JP_TY     → 10001 ~ 10030
 *   TW_CODE   → 20001 ~ 20030
 *   TW_TIANBAO→ 30001 ~ 30030
 *   TW_TIANQI → 40001 ~ 40030
 *   UK_ROYCE  → 50001 ~ 50030
 *
 * 組織歸屬（user_org_assignments）：
 *   - 每位員工有 isPrimary=true 的主要歸屬
 *   - 包含: regionId, companyId, businessUnitId, jobLevelId
 *
 * Run: npm run db:seed-employees
 */
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const DEFAULT_PASSWORD = '!Aa123456'

// ── 職級分配（30 人）───────────────────────────────────────────
const LEVEL_DIST: string[] = [
  ...Array(3).fill('P1'),
  ...Array(3).fill('P2'),
  ...Array(3).fill('P3'),
  ...Array(3).fill('P4'),
  ...Array(3).fill('P5'),
  ...Array(3).fill('P6'),
  ...Array(2).fill('P7'),
  ...Array(2).fill('P8'),
  ...Array(2).fill('P9'),
  ...Array(1).fill('P10'),
  ...Array(1).fill('P11'),
  ...Array(1).fill('P12'),
  ...Array(1).fill('P13'),
  ...Array(1).fill('M1'),
  ...Array(1).fill('M2'),
] // 3×6 + 2×3 + 1×5 = 18+6+5 = 29... let me recount
// 3+3+3+3+3+3+2+2+2+1+1+1+1+1+1 = 30 ✓

// ── 姓名池 ────────────────────────────────────────────────────
const JP_NAMES = [
  '山田太郎','鈴木花子','田中一郎','佐藤美咲','伊藤浩二','渡辺麻衣','中村健太','小林沙耶',
  '加藤雄介','吉田由紀','山本拓也','松本理恵','井上慎一','木村奈緒','林勇太','清水葵',
  '山口亮介','池田千春','橋本翔平','阿部沙紀','石川大輔','前田真由美','岡田晃','長谷川愛',
  '近藤昌也','坂本麻里','藤田健','石田みゆき','西村義人','福田のぞみ',
]
const TW_NAMES = [
  '陳志豪','林雅琪','張明峰','黃怡寧','王俊偉','李佳蓉','吳建宏','劉姿妤',
  '許智翔','蔡欣怡','鄭文彬','楊佩珊','謝宗憲','洪雅雯','曾冠廷','邱雅婷',
  '羅志偉','方美玲','盧建宇','蘇怡萱','江俊名','徐靜怡','余昌霖','崔詩涵',
  '趙大偉','廖宜珊','鍾明哲','高思穎','郭啟明','蕭雅欣',
]
const UK_NAMES = [
  'James Smith','Emma Jones','Oliver Brown','Sophia Williams','Harry Taylor',
  'Isabella Davies','Jack Wilson','Mia Evans','George Thomas','Amelia Roberts',
  'Noah Johnson','Lily White','Charlie Lewis','Emily Martin','Freddie Lee',
  'Grace Harris','Ethan Clark','Hannah Walker','Max Hall','Chloe Robinson',
  'Sebastian Hill','Zoe Allen','Archie Young','Ella King','Benjamin Wright',
  'Layla Scott','Mason Green','Poppy Baker','Logan Adams','Ellie Nelson',
]

// ── 公司設定 ──────────────────────────────────────────────────
interface CompanyCfg {
  code: string
  empNoStart: number        // 員工編號起始（純數字）
  buCode: string            // 所屬事業部
  names: string[]
  regionCode: string
}

const COMPANIES: CompanyCfg[] = [
  { code: 'JP_TY',      empNoStart: 10001, buCode: 'RND', names: JP_NAMES, regionCode: 'JP' },
  { code: 'TW_CODE',    empNoStart: 20001, buCode: 'BU1', names: TW_NAMES, regionCode: 'TW' },
  { code: 'TW_TIANBAO', empNoStart: 30001, buCode: 'BU2', names: TW_NAMES, regionCode: 'TW' },
  { code: 'TW_TIANQI',  empNoStart: 40001, buCode: 'BU3', names: TW_NAMES, regionCode: 'TW' },
  { code: 'UK_ROYCE',   empNoStart: 50001, buCode: 'BU4', names: UK_NAMES, regionCode: 'UK' },
]

function staggeredHireDates(count: number): Date[] {
  const start = new Date('2023-01-01').getTime()
  const end   = new Date('2025-12-01').getTime()
  const step  = (end - start) / (count - 1)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start + Math.round(i * step))
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  // 載入職級
  const allJL = await prisma.jobLevel.findMany()
  const jlMap  = new Map(allJL.map(j => [j.code, j.id]))

  // 載入公司（含地區）
  const allCo = await prisma.company.findMany({ include: { region: true } })
  const coMap  = new Map(allCo.map(c => [c.code, c]))

  // 載入事業部
  const allBU = await prisma.businessUnit.findMany()
  const buMap  = new Map(allBU.map(b => [b.code, b.id]))

  const summary: Record<string, { created: number; skipped: number }> = {}

  for (const cfg of COMPANIES) {
    const company = coMap.get(cfg.code)
    if (!company) { console.warn(`[SKIP] Company ${cfg.code} not found`); continue }

    const buId = buMap.get(cfg.buCode)
    if (!buId) { console.warn(`[SKIP] BusinessUnit ${cfg.buCode} not found`); continue }

    const regionId = company.regionId
    const hireDates = staggeredHireDates(30)
    let created = 0, skipped = 0

    for (let i = 0; i < 30; i++) {
      const empNo    = String(cfg.empNoStart + i)           // 純數字字串
      const fullName = cfg.names[i]
      const isEn     = cfg.regionCode === 'UK'
      const nameEn   = isEn ? fullName : undefined
      const nameZh   = isEn ? undefined : fullName
      const email    = `${empNo}@oa-system.com`
      const jlCode   = LEVEL_DIST[i]
      const jlId     = jlMap.get(jlCode)
      const hireDate = hireDates[i]

      if (!jlId) { console.warn(`[SKIP] JobLevel ${jlCode} not found`); continue }

      const existing = await prisma.user.findFirst({ where: { employeeNo: empNo } })
      if (existing) { skipped++; continue }

      await prisma.$transaction(async tx => {
        const user = await tx.user.create({
          data: {
            employeeNo: empNo,
            email,
            displayName: fullName,
            nameZh, nameEn,
            passwordHash,
            status: 'active',
            passwordChangedAt: hireDate,
          },
        })

        await tx.employeeProfile.create({
          data: { userId: user.id, hireDate, employmentType: 'full_time' },
        })

        await tx.userOrgAssignment.create({
          data: {
            userId: user.id,
            regionId,
            companyId:      company.id,
            businessUnitId: buId,
            jobLevelId:     jlId,
            isPrimary:      true,
            assignmentType: 'primary',
            isActive:       true,
            startedAt:      hireDate,
          },
        })
      })

      created++
    }

    summary[cfg.code] = { created, skipped }
    console.log(`[${cfg.code}] created=${created}  skipped=${skipped}`)
  }

  console.log('\n========== Seed Summary ==========')
  let tc = 0, ts = 0
  for (const [code, s] of Object.entries(summary)) {
    console.log(`  ${code.padEnd(14)} created: ${s.created}  skipped: ${s.skipped}`)
    tc += s.created; ts += s.skipped
  }
  console.log(`  TOTAL          created: ${tc}  skipped: ${ts}`)
  console.log('===================================')
  console.log('\n📌 預設密碼：', DEFAULT_PASSWORD)
}

main()
  .catch(e => { console.error('[ERROR]', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
