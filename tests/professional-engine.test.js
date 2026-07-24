const assert = require('assert')
const { getAllClubs } = require('../data/clubs.js')
const { DECISION_FIELDS } = require('../data/schema.js')
const { CORE_QUESTIONS, ADAPTIVE_QUESTIONS } = require('../utils/questions.js')
const {
  evaluateHardConstraint,
  rankClubs,
  scoreSoftPreferences,
} = require('../utils/scoring.js')
const {
  planQuestionnaire,
  selectNextQuestion,
} = require('../utils/adaptive-questionnaire.js')
const { buildDecisionProfile, buildSoftPreferences } = require('../utils/preference-fit.js')
const { compareClubs, runStressScenarioRanking, runStressTest } = require('../utils/compare.js')
const { dimensionLabel, fieldLabel, scenarioLabel } = require('../utils/labels.js')
const { generateBoothQuestions } = require('../utils/booth-questions.js')

const clubs = getAllClubs()
const sample = clubs[0]

assert.strictEqual(CORE_QUESTIONS.length, 8)
assert.strictEqual(ADAPTIVE_QUESTIONS.length, 6)
CORE_QUESTIONS.concat(ADAPTIVE_QUESTIONS).forEach((question) => {
  assert.ok(question.prompt && question.options.length >= 3, `${question.id} 文案或选项不完整`)
})

assert.strictEqual(
  evaluateHardConstraint(sample, {
    id: 'hours',
    fieldPath: 'decisionProfile.weeklyHoursTypical',
    operator: 'lte',
    value: 10,
  }).result,
  'UNKNOWN',
  'prototype-inferred 表面匹配也不得硬 PASS'
)

function verifiedClone(club, fieldPaths) {
  const clone = JSON.parse(JSON.stringify(club))
  fieldPaths.forEach((fieldPath) => {
    clone.evidence[fieldPath] = [{
      id: `verified-${clone.id}-${fieldPath}`,
      fieldPath,
      grade: 'A',
      sourceType: 'official-current',
      sourceRef: '本学期规则页',
      observedAt: '2026-07-20',
      verifiedAt: '2026-07-20',
      validTerm: '2026-fall',
      expiresAt: null,
      note: '测试夹具',
      hardPassEligible: true,
    }]
  })
  return clone
}

const verified = verifiedClone(sample, ['decisionProfile.weeklyHoursTypical'])
assert.strictEqual(evaluateHardConstraint(verified, {
  id: 'hours-pass',
  fieldPath: 'decisionProfile.weeklyHoursTypical',
  operator: 'lte',
  value: 10,
}).result, 'PASS')
assert.strictEqual(evaluateHardConstraint(verified, {
  id: 'hours-fail',
  fieldPath: 'decisionProfile.weeklyHoursTypical',
  operator: 'lte',
  value: 0,
}).result, 'FAIL')

const preferences = buildSoftPreferences({
  'core-interest': sample.category,
  'core-time': sample.decisionProfile.requiredTimeSlots,
  'core-hours': 8,
  'core-social': 'no-preference',
  'core-growth': sample.decisionProfile.goalBenefits,
  'core-mode': sample.decisionProfile.activityModes[0],
})
const fit = scoreSoftPreferences(sample, preferences)
assert.ok(fit.score >= 0 && fit.score <= 100)
assert.ok(fit.confidence >= 0 && fit.confidence <= 100)
assert.ok(fit.omittedDimensions.indexOf('social') !== -1, '无偏好维度不得进入分母')
assert.strictEqual(
  fit.score,
  Math.round(fit.dimensions.reduce((sum, item) => sum + item.weightedContribution, 0)),
  '总分必须能从解释轨迹精确重算'
)

const fullAnswers = {
  'core-interest': { value: sample.category },
  'core-time': { selectedValues: sample.decisionProfile.requiredTimeSlots.concat('none') },
  'core-hours': { value: 4 },
  'core-conflict': { values: ['weekday-evening', 'none'] },
  'core-social': { value: 'no-preference' },
  'core-growth': { values: ['skill', 'friendship'] },
  'core-mode': { value: 'project' },
  'core-entry': { value: 'open-only' },
  'adaptive-cost': { value: 300 },
  'adaptive-off-campus': { value: 'never' },
  'adaptive-equipment': { value: 'none' },
  'adaptive-expression': { value: 2 },
  'adaptive-competition': { value: 4 },
  'adaptive-autonomy': { value: 2 },
}
const decisionProfile = buildDecisionProfile(fullAnswers, { commitment: 3, social: 2 })
assert.strictEqual(decisionProfile.answerTrace.length, 14, '必须明确追踪全部 14 题')
assert.strictEqual(decisionProfile.sourceQuestionIds.length, 14)
assert.strictEqual(new Set(decisionProfile.hardConstraints.map((item) => item.id)).size, decisionProfile.hardConstraints.length)
;[
  'decisionProfile.weeklyHoursTypical',
  'decisionProfile.requiredTimeSlots',
  'decisionProfile.entryPolicy',
  'decisionProfile.selectionRequired',
  'decisionProfile.semesterCostMax',
  'decisionProfile.offCampusFrequency',
  'decisionProfile.equipmentRequired',
].forEach((fieldPath) => {
  assert.ok(decisionProfile.hardConstraints.some((item) => item.fieldPath === fieldPath), `${fieldPath} 未映射为硬约束`)
})
decisionProfile.hardConstraints.forEach((constraint) => {
  assert.ok(constraint.id && constraint.operator && constraint.sourceQuestionId)
})
assert.deepStrictEqual(
  decisionProfile.hardConstraints.find((item) => item.id === 'hard-blocked-time-slots').value,
  ['weekday-evening'],
  'multiple 中的 none 不得成为冲突时段'
)
assert.strictEqual(decisionProfile.softPreferences.social.value, 2, '自适应表达题应覆盖宽泛互动答案')
assert.strictEqual(decisionProfile.softPreferences.competition.value, 4)
assert.strictEqual(decisionProfile.softPreferences.autonomy.value, 2)

const ranking = rankClubs([clubs[2], clubs[1], clubs[0]], { softPreferences: preferences })
assert.deepStrictEqual(
  ranking,
  rankClubs([clubs[2], clubs[1], clubs[0]], { softPreferences: preferences }),
  '相同输入必须稳定'
)
for (let index = 1; index < ranking.length; index += 1) {
  const previous = ranking[index - 1]
  const current = ranking[index]
  if (previous.score === current.score && previous.confidence === current.confidence) {
    assert.ok(previous.clubId.localeCompare(current.clubId) <= 0, '同分必须按稳定 ID 排序')
  }
}

const minimum = planQuestionnaire({ topScoreGaps: [8, 8], dimensionConfidence: {} })
assert.strictEqual(minimum.length, 8, '确定性满足时应在 8 题停止')
const maximum = planQuestionnaire({ forceContinue: true, hardUnknownFields: ['cost'] })
assert.strictEqual(maximum.length, 14, '持续不确定时最多 14 题')
assert.strictEqual(new Set(maximum.map((question) => question.id)).size, maximum.length, '题目不得重复')
const hardFirst = selectNextQuestion({
  askedQuestionIds: CORE_QUESTIONS.map((question) => question.id),
  hardUnknownFields: ['cost'],
  candidates: clubs.slice(0, 6),
  forceContinue: true,
})
assert.strictEqual(hardFirst.question.id, 'adaptive-cost', '未解决硬约束必须优先')

const comparison = compareClubs(clubs.slice(0, 3))
assert.strictEqual(comparison.conclusion.type, 'NO_UNIQUE_BEST')
assert.ok(comparison.tradeoffs.length > 0)
assert.ok(comparison.stressTests.every((item) => item.result === 'UNKNOWN'), '推断证据压力测试必须未知')

const stressFields = [
  'decisionProfile.weeklyHoursTypical',
  'decisionProfile.scheduleFlexibility',
]
const verifiedStress = verifiedClone(sample, stressFields)
assert.ok(['RESILIENT', 'AT_RISK'].indexOf(runStressTest(verifiedStress, 'busy').result) !== -1)

const estimatedRanking = runStressScenarioRanking(clubs.slice(0, 24), decisionProfile, 'busy')
assert.strictEqual(estimatedRanking.estimateOnly, true)
assert.strictEqual(estimatedRanking.evidenceGrade, 'D')
assert.strictEqual(estimatedRanking.ranking.length, 24)
assert.ok(estimatedRanking.ranking.every((item) => (
  Number.isInteger(item.baseScore)
  && Number.isInteger(item.scenarioScore)
  && item.delta === item.scenarioScore - item.baseScore
  && item.estimateOnly === true
  && item.evidenceGrade === 'D'
  && item.reason.indexOf('演示估计') !== -1
)))
assert.ok(estimatedRanking.ranking.some((item) => item.delta !== 0), '情境变换应实际改变至少一个候选分数')
assert.ok(
  estimatedRanking.ranking.some((item) => item.baseRank !== item.scenarioRank),
  '演示情境应能改变候选排序'
)
assert.ok(['busy', 'deep', 'social'].every((id) => scenarioLabel(id).indexOf(id) === -1))
assert.strictEqual(dimensionLabel('commitment'), '时间投入')
assert.strictEqual(fieldLabel('decisionProfile.weeklyHoursTypical'), '每周常态投入')
assert.ok(comparison.tradeoffs.every((item) => item.fieldLabel && item.message.indexOf('decisionProfile.') === -1))

const insights = {
  hardEvaluations: [{
    clubId: sample.id,
    fieldPath: 'decisionProfile.weeklyHoursTypical',
    result: 'UNKNOWN',
    evidenceIds: sample.evidence['decisionProfile.weeklyHoursTypical'].map((item) => item.id),
  }],
  stressTests: comparison.stressTests.slice(0, 2),
  unknowns: DECISION_FIELDS.slice(0, 2).map((field) => ({ clubId: sample.id, fieldPath: `decisionProfile.${field}` })),
}
const boothQuestions = generateBoothQuestions(clubs.slice(0, 2), {
  insights,
  tendency: `club:${sample.id}`,
  answers: { 'core-hours': 4, 'core-entry': 'guided-ok' },
})
assert.ok(boothQuestions.length >= 3 && boothQuestions.length <= 5)
assert.strictEqual(boothQuestions[0].source, 'hard-unknown')
assert.ok(boothQuestions.every((item) => !item.clubId || item.clubId === sample.id))
assert.ok(boothQuestions.some((item) => item.source === 'preference'))

console.log('专业决策引擎测试通过：证据门禁、MCDA、自适应、比较、压力与追问均有效。')
