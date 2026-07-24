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
  pageScrollTo() {},
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
const index = createContext(loadPage('pages/index/index.js'))
index.onConditionFilter()
assert.ok(navigation.indexOf('/pages/library/library?mode=filter') !== -1)

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
assert.strictEqual(library.data.advancedOpen, false, '直接浏览资料必须保持默认浏览态')
library.onLoad({ mode: 'filter' })
assert.strictEqual(library.data.advancedOpen, true, '条件筛选入口必须默认展开筛选器')
library.onShow()
assert.strictEqual(library.data.visibleClubs.length, 12, '社团库首屏只能渲染 12 项')
assert.strictEqual(library.data.total, 98)
assert.strictEqual(library.data.hasMore, true)

const clubs = getAllClubs()
const filterFixture = clubs[0]
const fixtureMode = filterFixture.decisionProfile.activityModes[0]
library.setData({
  category: filterFixture.category,
  timeBand: filterFixture.timeBand,
  intensity: filterFixture.intensity,
  socialStyle: filterFixture.socialStyle,
  commitment: filterFixture.commitment,
  activityMode: fixtureMode,
  skillBarrier: filterFixture.skillBarrier,
  evidenceGrade: 'D',
})
library.refresh()
assert.ok(library.data.total > 0)
assert.ok(library.data.visibleClubs.every((item) => (
  item.club.category === filterFixture.category
  && item.club.timeBand === filterFixture.timeBand
  && item.club.intensity === filterFixture.intensity
  && item.club.socialStyle === filterFixture.socialStyle
  && item.club.commitment === filterFixture.commitment
  && item.club.skillBarrier === filterFixture.skillBarrier
  && item.club.decisionProfile.activityModes.indexOf(fixtureMode) !== -1
)), '资料库多维条件必须取交集')
library.onSelect({ detail: { id: filterFixture.id } })
library.onDetail({ detail: { id: filterFixture.id } })
assert.ok(navigation.indexOf(`/pages/club/club?id=${filterFixture.id}`) !== -1)
assert.strictEqual(library.data.category, filterFixture.category, '进入详情不得清空筛选条件')
const clubDetail = createContext(loadPage('pages/club/club.js'))
clubDetail.onLoad({ id: filterFixture.id })
clubDetail.onShow()
assert.strictEqual(clubDetail.data.club.id, filterFixture.id)
assert.strictEqual(clubDetail.data.selected, true, '详情页必须读取共享候选状态')
library.onShow()
assert.strictEqual(library.data.category, filterFixture.category, '从详情返回不得清空筛选条件')
assert.ok(library.data.selectedClubs.some((club) => club.id === filterFixture.id), '从详情返回必须保留候选')
library.setData({ evidenceGrade: 'A' })
library.refresh()
assert.strictEqual(library.data.total, 0, '当前全 D 数据选择 A 级证据时必须进入可恢复空态')
library.onResetAll()
assert.strictEqual(library.data.total, 98)

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
result.data.tendency = clubs[0].id
result.onConfirm()
assert.strictEqual(result.data.confirmed, true)
assert.strictEqual(result.data.actionCard.id, clubs[0].id)
assert.ok(result.data.clubDetail)
assert.strictEqual(result.data.clubDetail.id, clubs[0].id)
assert.ok(result.data.clubDetail.images.length >= 2)
assert.ok(!/原型推断|D\s*级/.test(result.data.actionCard.scoreText || ''))
assert.ok(!/原型推断|D\s*级/.test(result.data.evidenceNotice || ''))
assert.ok(result.data.boothQuestions.length >= 3 && result.data.boothQuestions.length <= 5)
assert.ok(result.data.boothQuestions.every((item) => (
  !item.clubId || item.clubId === clubs[0].id
)), '现场问题必须围绕最终主倾向社团')
assert.ok(result.data.boothQuestions.some((item) => (
  item.source === 'preference' || item.question.indexOf(clubs[0].name) !== -1
)))
assert.ok(result.data.questionTitle.indexOf(clubs[0].name) !== -1)
assert.strictEqual(result.data.reviewStandards.length, 4)

console.log('专业版页面状态测试通过：自适应问卷、分页、候选、压力比较与行动报告均有效。')
