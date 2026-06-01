import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const data = [
    {
      title: '教育訓練管理辦法',
      category: '人資公告',
      type: '制度文件',
      content: 'Dear all, 此為「教育訓練管理辦法」，煩請各位詳閱，如有問題請洽人資組，謝謝。',
      contentPreview: 'Dear all, 此為「教育訓練管理辦法」，煩請各位詳閱，如有問題請洽人資組，謝謝。',
      authorName: 'HR-1',
      publishDate: new Date('2026-04-24'),
      isPinned: true,
      scopeType: 'global',
    },
    {
      title: '員工離職、資遣、留職停薪及退職休管理辦法',
      category: '人資公告',
      type: '制度文件',
      content: '本辦法訂定員工離職各類程序，請相關人員詳閱執行。',
      contentPreview: '本辦法訂定員工離職各類程序，請相關人員詳閱執行。',
      authorName: 'HR-1',
      publishDate: new Date('2026-04-22'),
      isPinned: false,
      scopeType: 'global',
    },
    {
      title: '員工手冊',
      category: '行政公告',
      type: '制度文件',
      content: '本員工手冊包含公司各項規定及員工應知事項，請詳閱後簽名確認。',
      contentPreview: '本員工手冊包含公司各項規定及員工應知事項，請詳閱後簽名確認。',
      authorName: 'HR-1',
      publishDate: new Date('2026-04-20'),
      isPinned: false,
      scopeType: 'global',
    },
    {
      title: '健康檢查管理辦法',
      category: '行政公告',
      type: '一般公告',
      content: '年度健康檢查安排通知，請各同仁配合預約時間，相關費用由公司全額負擔。',
      contentPreview: '年度健康檢查安排通知，請各同仁配合預約時間。',
      authorName: 'HR-2',
      publishDate: new Date('2026-04-10'),
      isPinned: false,
      scopeType: 'global',
    },
    {
      title: '2026年薪資發放日通知',
      category: '財務公告',
      type: '重要公告',
      content: '敬告全體同仁：本年度薪資發放日定於每月5日，若遇假日則提前至前一個工作日發放。',
      contentPreview: '本年度薪資發放日定於每月5日，若遇假日則提前至前一個工作日。',
      authorName: '財務部',
      publishDate: new Date('2026-04-01'),
      isPinned: true,
      scopeType: 'global',
    },
  ]

  for (const a of data) {
    const exists = await prisma.announcement.findFirst({ where: { title: a.title } })
    if (!exists) {
      await prisma.announcement.create({ data: a })
      console.log('Created:', a.title)
    } else {
      console.log('Exists:', a.title)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
