const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.resolve(__dirname, '..')
const pageRoot = path.join(root, 'pages')
const forbidden = /wx\.(request|login|setStorage|setStorageSync|cloud|scanCode)\b|https?:\/\//

function walk(dir, extension) {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((files, entry) => {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) return files.concat(walk(target, extension))
    if (!extension || target.endsWith(extension)) files.push(target)
    return files
  }, [])
}

walk(root, '.json').forEach((file) => {
  assert.doesNotThrow(
    () => JSON.parse(fs.readFileSync(file, 'utf8')),
    `${path.relative(root, file)} 不是合法 JSON`
  )
})

walk(root, '.js').forEach((file) => {
  const source = fs.readFileSync(file, 'utf8')
  assert.doesNotThrow(
    () => new vm.Script(source, { filename: file }),
    `${path.relative(root, file)} 存在 JavaScript 语法错误`
  )
  assert.ok(!forbidden.test(source), `${path.relative(root, file)} 使用了禁止的网络、登录、存储或扫码能力`)
})

walk(pageRoot, '.wxml').forEach((wxmlFile) => {
  const source = fs.readFileSync(wxmlFile, 'utf8')
  const jsFile = wxmlFile.replace(/\.wxml$/, '.js')
  const pageScript = fs.readFileSync(jsFile, 'utf8')
  const handlers = []
  const binding = /\b(?:bind|catch)(?:tap|input|change|confirm)="([^"]+)"/g
  let match = binding.exec(source)
  while (match) {
    handlers.push(match[1])
    match = binding.exec(source)
  }
  handlers.forEach((handler) => {
    assert.ok(
      new RegExp(`\\b${handler}\\s*\\(`).test(pageScript),
      `${path.relative(root, wxmlFile)} 引用了不存在的处理函数 ${handler}`
    )
  })
  assert.strictEqual(
    (source.match(/\{\{/g) || []).length,
    (source.match(/\}\}/g) || []).length,
    `${path.relative(root, wxmlFile)} 的数据绑定括号不平衡`
  )
})

const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))
const legacyCheckpointPages = [
  'pages/index/index',
  'pages/list/list',
  'pages/compare/compare',
  'pages/result/result',
]
const professionalTargetPages = [
  'pages/index/index',
  'pages/assessment/assessment',
  'pages/recommend/recommend',
  'pages/library/library',
  'pages/club/club',
  'pages/selection/selection',
  'pages/compare/compare',
  'pages/result/result',
]
const migrationApprovedPages = new Set([
  ...legacyCheckpointPages,
  ...professionalTargetPages,
])
const pages = appConfig.pages
const isLegacyCheckpoint = JSON.stringify(pages) === JSON.stringify(legacyCheckpointPages)
const isProfessionalTarget = JSON.stringify(pages) === JSON.stringify(professionalTargetPages)
const isOrderedMigration = pages.length >= legacyCheckpointPages.length
  && pages[0] === 'pages/index/index'
  && pages.includes('pages/compare/compare')
  && pages.includes('pages/result/result')
  && pages.every((page, index) => (
    migrationApprovedPages.has(page)
    && pages.indexOf(page) === index
    && (page === 'pages/list/list'
      || professionalTargetPages.indexOf(page) >= professionalTargetPages.indexOf(
        pages.slice(0, index).filter((previous) => previous !== 'pages/list/list').slice(-1)[0]
          || 'pages/index/index'
      ))
  ))

assert.ok(
  isLegacyCheckpoint || isProfessionalTarget || isOrderedMigration,
  '顶层页面只能是 001/002 四页 checkpoint、003 八页目标，或由这些批准路由组成的有序迁移态'
)

const routePhase = isLegacyCheckpoint
  ? '001/002 四页 checkpoint'
  : (isProfessionalTarget ? '003 八页目标' : '003 有序迁移态')
console.log(`项目静态校验通过：JSON、JS、WXML 事件、系统边界与${routePhase}均有效。`)
