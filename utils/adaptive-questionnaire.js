const { CORE_QUESTIONS, ADAPTIVE_QUESTIONS, QUESTIONS } = require('./questions.js')

const QUESTION_FIELDS = {
  'adaptive-cost': 'decisionProfile.semesterCostMax',
  'adaptive-off-campus': 'decisionProfile.offCampusFrequency',
  'adaptive-equipment': 'decisionProfile.equipmentRequired',
  'adaptive-expression': 'decisionProfile.publicExpressionLevel',
  'adaptive-competition': 'decisionProfile.competitionLevel',
  'adaptive-autonomy': 'decisionProfile.autonomyLevel',
}

function stableValue(value) {
  return JSON.stringify(value === undefined ? null : value)
}

function getPath(target, path) {
  return String(path || '').split('.').reduce((value, key) => (
    value === null || value === undefined ? undefined : value[key]
  ), target)
}

function answeredIds(context) {
  const answers = context && context.answers ? context.answers : {}
  const asked = Array.isArray(context && context.askedQuestionIds) ? context.askedQuestionIds : Object.keys(answers)
  return asked.filter((id, index) => asked.indexOf(id) === index)
}

function candidateDiscrimination(question, candidates) {
  const fieldPath = QUESTION_FIELDS[question.id]
  if (!fieldPath || !Array.isArray(candidates) || candidates.length < 2) return 0
  return new Set(candidates.map((club) => stableValue(getPath(club, fieldPath)))).size - 1
}

function hasUnresolvedHardRisk(question, context) {
  if (!question.hardConstraint) return false
  const unknowns = Array.isArray(context.hardUnknownFields) ? context.hardUnknownFields : []
  const field = QUESTION_FIELDS[question.id]
  return unknowns.length > 0 && unknowns.some((unknown) => (
    unknown === question.dimension || unknown === field || String(unknown).indexOf(question.dimension) !== -1
  ))
}

function questionUtility(question, context) {
  const confidence = (context.dimensionConfidence || {})[question.dimension]
  const coverageGap = confidence === undefined ? 50 : Math.max(0, 100 - confidence)
  const top6Change = Number((context.top6ChangesByQuestion || {})[question.id]) || 0
  return {
    hardPriority: hasUnresolvedHardRisk(question, context) ? 1 : 0,
    discrimination: candidateDiscrimination(question, context.candidates),
    top6Change,
    coverageGap,
    cost: Number(question.cost) || 1,
  }
}

function compareUtility(left, right) {
  return right.utility.hardPriority - left.utility.hardPriority
    || right.utility.discrimination - left.utility.discrimination
    || right.utility.top6Change - left.utility.top6Change
    || right.utility.coverageGap - left.utility.coverageGap
    || left.utility.cost - right.utility.cost
    || left.question.order - right.question.order
    || left.question.id.localeCompare(right.question.id)
}

function topCandidatesStable(context) {
  if (context.forceContinue) return false
  const gaps = Array.isArray(context.topScoreGaps) ? context.topScoreGaps : []
  const hardResolved = !Array.isArray(context.hardUnknownFields) || context.hardUnknownFields.length === 0
  const confidence = context.dimensionConfidence || {}
  const covered = ['interest', 'schedule', 'commitment', 'social', 'growth', 'mode']
    .every((dimension) => confidence[dimension] === undefined || confidence[dimension] >= 60)
  return hardResolved && gaps.length >= 2 && gaps.every((gap) => gap >= 8) && covered
}

function shouldStop(context) {
  const asked = answeredIds(context)
  if (asked.length < 8) return { stop: false, reason: 'CORE_INCOMPLETE' }
  if (asked.length >= 14) return { stop: true, reason: 'MAX_QUESTIONS' }
  const remaining = QUESTIONS.filter((question) => asked.indexOf(question.id) === -1)
  if (!remaining.length) return { stop: true, reason: 'NO_QUESTION_AVAILABLE' }
  if (topCandidatesStable(context || {})) return { stop: true, reason: 'TOP_CANDIDATES_STABLE' }
  return { stop: false, reason: 'MORE_INFORMATION_NEEDED' }
}

function selectNextQuestion(context) {
  const state = context || {}
  const asked = answeredIds(state)
  const unansweredCore = CORE_QUESTIONS.filter((question) => asked.indexOf(question.id) === -1)
  if (unansweredCore.length) {
    return {
      question: unansweredCore[0],
      triggerReason: 'CORE_REQUIRED',
      utility: null,
    }
  }
  const stop = shouldStop(state)
  if (stop.stop) return { question: null, triggerReason: stop.reason, utility: null }
  const ranked = ADAPTIVE_QUESTIONS
    .filter((question) => asked.indexOf(question.id) === -1)
    .map((question) => ({ question, utility: questionUtility(question, state) }))
    .sort(compareUtility)
  if (!ranked.length) return { question: null, triggerReason: 'NO_QUESTION_AVAILABLE', utility: null }
  const choice = ranked[0]
  const triggerReason = choice.utility.hardPriority
    ? 'HARD_CONSTRAINT_UNKNOWN'
    : (choice.utility.discrimination || choice.utility.top6Change ? 'TOP_CANDIDATE_DIFFERENTIATION' : 'PREFERENCE_COVERAGE')
  return { question: choice.question, triggerReason, utility: choice.utility }
}

function planQuestionnaire(context) {
  const state = Object.assign({}, context || {})
  const sequence = answeredIds(state).slice(0, 14)
  while (sequence.length < 14) {
    const next = selectNextQuestion(Object.assign({}, state, { askedQuestionIds: sequence }))
    if (!next.question) break
    sequence.push(next.question.id)
    if (sequence.length >= 8 && !state.forceContinue) {
      const stop = shouldStop(Object.assign({}, state, { askedQuestionIds: sequence }))
      if (stop.stop) break
    }
  }
  return sequence.map((id) => QUESTIONS.find((question) => question.id === id))
}

function invalidateAdaptiveAnswers(askedQuestionIds, answers, changedQuestionId) {
  const asked = Array.isArray(askedQuestionIds) ? askedQuestionIds : []
  const changedIndex = asked.indexOf(changedQuestionId)
  if (changedIndex === -1) return { askedQuestionIds: asked.slice(), answers: Object.assign({}, answers) }
  const keptIds = asked.slice(0, changedIndex + 1)
  const keptAnswers = keptIds.reduce((result, id) => {
    if (Object.prototype.hasOwnProperty.call(answers || {}, id)) result[id] = answers[id]
    return result
  }, {})
  return { askedQuestionIds: keptIds, answers: keptAnswers }
}

module.exports = {
  MAX_QUESTIONS: 14,
  MIN_QUESTIONS: 8,
  QUESTION_FIELDS,
  candidateDiscrimination,
  getNextQuestion: selectNextQuestion,
  invalidateAdaptiveAnswers,
  planQuestionnaire,
  selectNextQuestion,
  shouldStop,
}
