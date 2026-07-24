const assert = require('assert')
const path = require('path')
const session = require('../store/session.js')
const { getAllClubs } = require('../data/clubs.js')

const navigation = []
const app = {
  globalData: { session },
  getSession: () => session,
  resetSession: () => session.reset(),
}

global.getApp = () => app
global.wx = {
  navigateTo: (options) => navigation.push(options.url),
  redirectTo: (options) => navigation.push(options.url),
  reLaunch: (options) => navigation.push(options.url),
  navigateBack() {},
  showToast() {},
  setNavigationBarTitle() {},
}

function loadPage(relativePath) {
  let definition
  global.Page = (config) => {
    definition = config
  }
  const target = path.resolve(__dirname, '..', relativePath)
  delete require.cache[target]
  require(target)
  return definition
}

function createContext(definition) {
  const context = Object.assign({}, definition, {
    data: JSON.parse(JSON.stringify(definition.data || {})),
  })
  context.setData = function setData(patch, callback) {
    this.data = Object.assign({}, this.data, patch)
    if (callback) callback()
  }
  return context
}

session.reset()
const assessment = createContext(loadPage('pages/assessment/assessment.js'))
assessment.onLoad({})
assert.strictEqual(assessment.data.question.id, 'core-interest')

let safety = 0
while (navigation.indexOf('/pages/recommend/recommend') === -1 && safety < 20) {
  const question = assessment.data.question
  const firstOption = question.options[0]
  assessment.onChoose({ currentTarget: { dataset: { value: firstOption.value } } })
  assessment.onNext()
  safety += 1
}
assert.ok(safety >= 8 && safety <= 14, '专业问卷必须在 8–14 题内完成')
assert.ok(navigation.indexOf('/pages/recommend/recommend') !== -1)
assert.strictEqual(session.recommendations.length, 6)

const library = createContext(loadPage('pages/library/library.js'))
library.onShow()
assert.strictEqual(library.data.visibleClubs.length, 12, '社团库首屏只能渲染 12 项')
assert.strictEqual(library.data.total, 98)
assert.strictEqual(library.data.hasMore, true)

const clubs = getAllClubs()
session.setSelectedClubIds([clubs[0].id, clubs[1].id, clubs[2].id], 'library')
const selection = createContext(loadPage('pages/selection/selection.js'))
selection.onShow()
assert.strictEqual(selection.data.clubs.length, 3)
assert.strictEqual(selection.data.ready, true)
selection.onCompare()
assert.ok(navigation.indexOf('/pages/compare/compare') !== -1)

const compare = createContext(loadPage('pages/compare/compare.js'))
compare.onShow()
assert.strictEqual(compare.data.columns.length, 3)
assert.strictEqual(compare.data.keyTradeoffs.length, 3)
assert.ok(compare.data.scenarioResult.ranking.every((item) => typeof item.deltaText === 'string'))

const result = createContext(loadPage('pages/result/result.js'))
result.onShow()
result.data.tendency = `club:${clubs[0].id}`
result.onConfirm()
assert.strictEqual(result.data.confirmed, true)
assert.strictEqual(result.data.actionCard.id, clubs[0].id)
assert.ok(result.data.boothQuestions.length >= 3 && result.data.boothQuestions.length <= 5)
assert.strictEqual(result.data.reviewStandards.length, 4)

console.log('专业版页面状态测试通过：自适应问卷、分页、候选、压力比较与行动报告均有效。')
