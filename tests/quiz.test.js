const assert = require('assert')
const { getAllClubs } = require('../data/clubs.js')
const { questions, clubDomains, domainLabels } = require('../data/quiz.js')
const { areAnswersComplete, buildClubProfile, rankClubs } = require('../utils/quiz.js')

function answersFor(domain, level) {
  const value = level || 'medium'
  return {
    interest: `interest-${domain}`,
    time: `time-${value}`,
    physical: `physical-${value}`,
    collaboration: `collaboration-${value}`,
    expression: `expression-${value}`,
    practice: `practice-${value}`,
    competition: `competition-${value}`,
    structure: `structure-${value}`,
  }
}

const clubs = getAllClubs()
const clubIds = clubs.map((club) => club.id).sort()
const profileIds = Object.keys(clubDomains).sort()

assert.strictEqual(clubs.length, 98)
assert.strictEqual(questions.length, 8)
assert.deepStrictEqual(profileIds, clubIds, '兴趣领域映射必须覆盖全部社团且不能包含未知 ID')
assert.strictEqual(new Set(questions.map((question) => question.id)).size, questions.length)

questions.forEach((question) => {
  assert.ok(question.options.length >= 3)
  assert.strictEqual(new Set(question.options.map((option) => option.id)).size, question.options.length)
})

Object.keys(domainLabels).forEach((domain) => {
  assert.ok(Object.values(clubDomains).some((domains) => domains.indexOf(domain) >= 0), `${domain} 必须有候选社团`)
})

clubs.forEach((club) => {
  const profile = buildClubProfile(club)
  ;['time', 'physical', 'collaboration', 'expression', 'practice', 'competition', 'structure'].forEach((key) => {
    assert.ok(profile[key] >= 1 && profile[key] <= 3, `${club.id}.${key} 必须在 1–3 之间`)
  })
})

assert.strictEqual(areAnswersComplete({}), false)
assert.deepStrictEqual(rankClubs({}, 3), [])

;['theory', 'culture', 'arts', 'sports', 'technology', 'service', 'international', 'outdoor'].forEach((domain) => {
  ;['low', 'medium', 'high'].forEach((level) => {
    const answers = answersFor(domain, level)
    const first = rankClubs(answers, 3)
    const second = rankClubs(answers, 3)
    assert.strictEqual(first.length, 3)
    assert.strictEqual(new Set(first.map((item) => item.club.id)).size, 3)
    assert.deepStrictEqual(
      first.map((item) => item.club.id),
      second.map((item) => item.club.id),
      `${domain}/${level} 的结果必须确定`,
    )
    first.forEach((item) => {
      assert.ok(clubDomains[item.club.id].indexOf(domain) >= 0, `${domain}/${level} 的前三名必须匹配兴趣领域`)
      assert.ok(item.reasons.length >= 2)
    })
  })
})

const dimensions = ['time', 'physical', 'collaboration', 'expression', 'practice', 'competition', 'structure']
const levels = ['low', 'medium', 'high']
let combinationCount = 0

function verifyCombinations(domain, dimensionIndex, answers) {
  if (dimensionIndex === dimensions.length) {
    const results = rankClubs(answers, 3)
    assert.strictEqual(results.length, 3)
    assert.strictEqual(new Set(results.map((item) => item.clubId)).size, 3)
    results.forEach((item) => {
      assert.ok(clubDomains[item.clubId].indexOf(domain) >= 0)
      assert.ok(item.reasons.length >= 2)
    })
    combinationCount += 1
    return
  }

  const dimension = dimensions[dimensionIndex]
  levels.forEach((level) => {
    answers[dimension] = `${dimension}-${level}`
    verifyCombinations(domain, dimensionIndex + 1, answers)
  })
}

Object.keys(domainLabels).forEach((domain) => {
  verifyCombinations(domain, 0, { interest: `interest-${domain}` })
})
assert.strictEqual(combinationCount, 17496)

console.log('quiz.test.js: all checks passed')
