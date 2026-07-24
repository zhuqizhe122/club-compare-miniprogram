const assert = require('assert')
const { getAllClubs } = require('../data/clubs.js')
const { CORE_QUESTIONS, ADAPTIVE_QUESTIONS } = require('../utils/questions.js')
const { planQuestionnaire } = require('../utils/adaptive-questionnaire.js')
const { evaluateHardConstraint, scoreSoftPreferences } = require('../utils/scoring.js')
const { buildDecisionProfile } = require('../utils/preference-fit.js')
const { compareClubs, runStressScenarioRanking } = require('../utils/compare.js')

const clubs = getAllClubs()
assert.strictEqual(CORE_QUESTIONS.length, 8)
assert.strictEqual(ADAPTIVE_QUESTIONS.length, 6)
assert.strictEqual(planQuestionnaire({ topScoreGaps: [8, 8] }).length, 8)
assert.strictEqual(planQuestionnaire({ forceContinue: true }).length, 14)

const hard = evaluateHardConstraint(clubs[0], {
  id: 'prototype-guard',
  fieldPath: 'decisionProfile.weeklyHoursTypical',
  operator: 'lte',
  value: 100,
})
assert.strictEqual(hard.result, 'UNKNOWN')
assert.strictEqual(hard.reasonCode, 'PROTOTYPE_INFERRED')

const fit = scoreSoftPreferences(clubs[0], {
  interest: { value: clubs[0].category, weight: 1 },
  social: { value: 'no-preference', weight: 100 },
})
assert.strictEqual(fit.dimensions.length, 1)
assert.ok(Number.isInteger(fit.score) && fit.score >= 0 && fit.score <= 100)

const comparison = compareClubs(clubs.slice(0, 3))
assert.strictEqual(comparison.conclusion.type, 'NO_UNIQUE_BEST')
assert.strictEqual(comparison.stressTests.length, 9)

const profile = buildDecisionProfile({
  'core-hours': 4,
  'core-conflict': ['weekday-evening', 'none'],
  'core-entry': 'open-only',
  'adaptive-cost': 300,
  'adaptive-off-campus': 'never',
  'adaptive-equipment': 'none',
})
assert.ok(profile.hardConstraints.length >= 7)
assert.ok(profile.hardConstraints.every((item) => item.id && item.fieldPath && item.operator && item.sourceQuestionId))
const estimated = runStressScenarioRanking(clubs.slice(0, 20), profile, 'busy')
assert.strictEqual(estimated.estimateOnly, true)
assert.strictEqual(estimated.evidenceGrade, 'D')
assert.ok(estimated.ranking.every((item) => item.reason.indexOf('演示估计') !== -1))

console.log('引擎静态校验通过：8–14 题、画像映射、证据门禁、偏好分母和双轨压力规则均有效。')
