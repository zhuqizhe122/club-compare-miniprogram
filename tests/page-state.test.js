const assert = require('assert')
const path = require('path')
const { getAllClubs } = require('../data/clubs.js')

const clubs = getAllClubs()
const app = {
  globalData: {
    selectedClubIds: [clubs[0].id, clubs[1].id],
    preferenceAnswers: {},
    recommendations: [{ club: clubs[0] }],
    tendency: null,
  },
}

global.getApp = () => app
global.wx = {
  navigateBack() {},
  navigateTo() {},
  reLaunch() {},
  showToast() {},
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

const list = createContext(loadPage('pages/list/list.js'))
list.data.recommendations = app.globalData.recommendations
list.data.questionnaireComplete = true
list.onEditAnswers()
assert.deepStrictEqual(app.globalData.recommendations, [], '改答案必须使旧推荐失效')
assert.strictEqual(list.data.questionnaireComplete, false)

const compare = createContext(loadPage('pages/compare/compare.js'))
compare.onShow()
assert.strictEqual(compare.data.hasPreference, false, '直接搜索进入比较时不应伪造偏好上下文')
assert.ok(compare.data.columns.every((club) => club.matchReasons.length === 0))

const result = createContext(loadPage('pages/result/result.js'))
result.onShow()
result.data.tendency = `club:${clubs[0].id}`
result.onConfirm()
assert.strictEqual(result.data.confirmed, true)
assert.strictEqual(result.data.boothQuestions.length, 3)
assert.ok(result.data.expectationCards[0].expectations.every((line) => !/\b(project|regular|casual)\b/.test(line)))

result.onShow()
assert.strictEqual(result.data.confirmed, true, '页面再次 onShow 时必须恢复已确认行动卡')
assert.strictEqual(result.data.tendency, `club:${clubs[0].id}`)
assert.strictEqual(result.data.boothQuestions.length, 3)

console.log('页面状态测试通过：推荐失效、直接搜索、行动卡恢复与三条追问均有效。')
