const assert = require('assert')
const {
  displayField,
  displayStructured,
  getAllClubs,
  getClubsByIds,
  getDifferenceSummary,
  getExpectationCards,
  searchClubs,
} = require('../data/clubs.js')
const { MATCH_QUESTIONS, matchClubs, scoreClub } = require('../utils/match.js')
const { generateBoothQuestions } = require('../utils/booth-questions.js')

const clubs = getAllClubs()

assert.strictEqual(displayField('  '), '未提供')
assert.strictEqual(displayField(null), '未提供')
assert.strictEqual(displayField('已提供'), '已提供')
assert.strictEqual(displayStructured('project'), '项目期投入增加')

const ids = [clubs[10].id, clubs[2].id, clubs[10].id]
assert.deepStrictEqual(getClubsByIds(ids).map((club) => club.id), [clubs[10].id, clubs[2].id])

const technology = searchClubs('', { category: 'technology' })
assert.ok(technology.length > 0)
assert.ok(technology.every((club) => club.category === 'technology'))
assert.ok(searchClubs('OpenHarmony', {}).some((club) => club.id === 'openharmony'))

const answers = {
  category: 'sports',
  timeBand: 'weekend',
  intensity: 'medium',
  socialStyle: 'collaborative',
}
const first = matchClubs(answers)
const second = matchClubs(answers)
assert.strictEqual(first.length, 6)
assert.deepStrictEqual(first.map((item) => item.club.id), second.map((item) => item.club.id), '匹配必须确定')
first.forEach((item, index) => {
  assert.ok(item.reasons.length >= 2 && item.reasons.length <= 3, '每项必须有 2–3 条理由')
  assert.strictEqual(item.trace.length, MATCH_QUESTIONS.length, '必须保留四题轨迹')
  assert.strictEqual(item.dataStatus, '待社团确认')
  if (index > 0) assert.ok(first[index - 1].score >= item.score, '分数必须降序')
})

const synthetic = Object.assign({}, clubs[0], {
  category: 'sports',
  timeBand: 'weekend',
  intensity: 'medium',
  socialStyle: 'collaborative',
})
const scored = scoreClub(synthetic, answers)
assert.strictEqual(scored.score, 11, '四题全匹配应得到 11 分')
assert.deepStrictEqual(scored.trace.map((item) => item.points), [4, 3, 2, 2])

const pair = [clubs[0], clubs.filter((club) => club.intensity === 'high')[0]]
const differences = getDifferenceSummary(pair)
assert.ok(differences.length > 0, '不同候选应产生差异摘要')
differences.forEach((difference) => assert.strictEqual(difference.values.length, 2))

const cards = getExpectationCards(pair)
assert.strictEqual(cards.length, 2)
cards.forEach((card) => {
  assert.strictEqual(card.status, '待社团确认')
  assert.ok(card.reminder.indexOf('确认') !== -1)
  assert.ok(
    card.expectations.every((line) => !/\b(project|regular|casual|quiet|collaborative|expressive)\b/.test(line)),
    '预期卡不应暴露内部英文枚举'
  )
})

const missing = Object.assign({}, pair[0], { weeklyHours: '' })
const questions = generateBoothQuestions([missing, pair[1]], {
  tendency: `club:${pair[1].id}`,
  answers: {
    'core-hours': 4,
    'core-conflict': ['weekday-evening'],
    'core-entry': 'open-only',
    'core-growth': ['skill', 'friendship'],
  },
})
assert.strictEqual(questions.length, 5, '有测评答案且确认主倾向时应生成 5 条')
assert.ok(questions.every((item) => !item.clubId || item.clubId === pair[1].id), '问题必须围绕最终倾向社团')
assert.ok(questions.some((item) => item.source === 'preference'), '应结合问卷答案生成问题')
assert.ok(questions.some((item) => item.question.indexOf(pair[1].name) !== -1), '问题文案应点名主倾向社团')

const fallbackQuestions = generateBoothQuestions([clubs[0], clubs[1]], {
  tendency: 'none',
  answers: {},
})
assert.strictEqual(fallbackQuestions.length, 3, '无测评答案时应补足 3 条现场问题')

console.log('决策规则测试通过：搜索、顺序、差异、预期卡、Top 6 与摊位追问均有效。')
