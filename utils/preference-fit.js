const { scoreSoftPreferences } = require('./scoring.js')

function answerValue(answers, id) {
  const value = (answers || {})[id]
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value.value !== undefined) return value.value
    if (value.values !== undefined) return value.values
    if (value.selectedValues !== undefined) return value.selectedValues
  }
  return value
}

function cleanMultiple(value) {
  const values = Array.isArray(value) ? value : (value === undefined || value === null ? [] : [value])
  return values.filter((item) => item !== 'none' && item !== 'no-preference' && item !== '')
}

function cleanPreference(value) {
  if (Array.isArray(value)) {
    const cleaned = cleanMultiple(value)
    return cleaned.length ? cleaned : 'no-preference'
  }
  return value === 'none' ? 'no-preference' : value
}

function buildSoftPreferences(answers, weights) {
  const source = answers || {}
  const customWeights = weights || {}
  const values = {
    interest: cleanPreference(answerValue(source, 'core-interest')),
    schedule: cleanPreference(answerValue(source, 'core-time')),
    commitment: answerValue(source, 'core-hours'),
    social: answerValue(source, 'adaptive-expression') !== undefined
      ? answerValue(source, 'adaptive-expression')
      : answerValue(source, 'core-social'),
    growth: cleanPreference(answerValue(source, 'core-growth')),
    mode: cleanPreference(answerValue(source, 'core-mode')),
  }
  return Object.keys(values).reduce((result, dimension) => {
    result[dimension] = {
      value: values[dimension],
      weight: customWeights[dimension] === undefined ? 1 : customWeights[dimension],
      sourceQuestionId: dimension === 'social' && answerValue(source, 'adaptive-expression') !== undefined
        ? 'adaptive-expression'
        : {
          interest: 'core-interest',
          schedule: 'core-time',
          commitment: 'core-hours',
          social: 'core-social',
          growth: 'core-growth',
          mode: 'core-mode',
        }[dimension],
    }
    return result
  }, {})
}

function addConstraint(result, id, fieldPath, operator, value, sourceQuestionId) {
  result.push({ id, fieldPath, operator, value, sourceQuestionId })
}

function buildHardConstraints(answers) {
  const constraints = []
  const hours = Number(answerValue(answers, 'core-hours'))
  if (Number.isFinite(hours)) {
    addConstraint(
      constraints,
      'hard-weekly-hours-max',
      'decisionProfile.weeklyHoursTypical',
      'lte',
      hours,
      'core-hours'
    )
  }

  const blockedSlots = cleanMultiple(answerValue(answers, 'core-conflict'))
  if (blockedSlots.length) {
    addConstraint(
      constraints,
      'hard-blocked-time-slots',
      'decisionProfile.requiredTimeSlots',
      'not-overlaps',
      blockedSlots,
      'core-conflict'
    )
  }

  const entry = answerValue(answers, 'core-entry')
  if (entry === 'open-only') {
    addConstraint(constraints, 'hard-entry-open', 'decisionProfile.entryPolicy', 'eq', 'open', 'core-entry')
    addConstraint(constraints, 'hard-no-selection', 'decisionProfile.selectionRequired', 'eq', false, 'core-entry')
  } else if (entry === 'guided-ok') {
    addConstraint(constraints, 'hard-no-selection', 'decisionProfile.selectionRequired', 'eq', false, 'core-entry')
  }

  const cost = Number(answerValue(answers, 'adaptive-cost'))
  if (Number.isFinite(cost) && cost < 1000) {
    addConstraint(
      constraints,
      'hard-semester-cost-max',
      'decisionProfile.semesterCostMax',
      'lte',
      cost,
      'adaptive-cost'
    )
  }

  const offCampus = answerValue(answers, 'adaptive-off-campus')
  if (offCampus === 'never') {
    addConstraint(
      constraints,
      'hard-no-off-campus',
      'decisionProfile.offCampusFrequency',
      'eq',
      'rare',
      'adaptive-off-campus'
    )
  } else if (offCampus === 'occasional') {
    addConstraint(
      constraints,
      'hard-no-frequent-off-campus',
      'decisionProfile.offCampusFrequency',
      'neq',
      'frequent',
      'adaptive-off-campus'
    )
  }

  const equipment = answerValue(answers, 'adaptive-equipment')
  if (equipment === 'none') {
    addConstraint(
      constraints,
      'hard-no-required-equipment',
      'decisionProfile.equipmentRequired',
      'empty',
      true,
      'adaptive-equipment'
    )
  } else if (equipment === 'basic') {
    addConstraint(
      constraints,
      'hard-basic-equipment-only',
      'decisionProfile.equipmentRequired',
      'max-length',
      1,
      'adaptive-equipment'
    )
  }
  return constraints
}

const ANSWER_TARGETS = {
  'core-interest': ['softPreferences.interest'],
  'core-time': ['softPreferences.schedule'],
  'core-hours': ['softPreferences.commitment', 'hardConstraints.hard-weekly-hours-max'],
  'core-conflict': ['hardConstraints.hard-blocked-time-slots'],
  'core-social': ['softPreferences.social'],
  'core-growth': ['softPreferences.growth'],
  'core-mode': ['softPreferences.mode'],
  'core-entry': ['hardConstraints.hard-entry-open', 'hardConstraints.hard-no-selection'],
  'adaptive-cost': ['hardConstraints.hard-semester-cost-max'],
  'adaptive-off-campus': ['hardConstraints.hard-no-off-campus'],
  'adaptive-equipment': ['hardConstraints.hard-no-required-equipment'],
  'adaptive-expression': ['softPreferences.social'],
  'adaptive-competition': ['softPreferences.competition'],
  'adaptive-autonomy': ['softPreferences.autonomy'],
}

function buildDecisionProfile(answers, weights) {
  const source = answers || {}
  const softPreferences = buildSoftPreferences(source, weights)
  softPreferences.competition = {
    value: cleanPreference(answerValue(source, 'adaptive-competition')),
    weight: (weights || {}).competition === undefined ? 1 : (weights || {}).competition,
    sourceQuestionId: 'adaptive-competition',
    fieldPath: 'decisionProfile.competitionLevel',
  }
  softPreferences.autonomy = {
    value: cleanPreference(answerValue(source, 'adaptive-autonomy')),
    weight: (weights || {}).autonomy === undefined ? 1 : (weights || {}).autonomy,
    sourceQuestionId: 'adaptive-autonomy',
    fieldPath: 'decisionProfile.autonomyLevel',
  }
  const hardConstraints = buildHardConstraints(source)
  const activeConstraintIds = hardConstraints.map((constraint) => constraint.id)
  const answerTrace = Object.keys(ANSWER_TARGETS).map((questionId) => ({
    questionId,
    answer: answerValue(source, questionId),
    targets: ANSWER_TARGETS[questionId].slice(),
    included: Object.prototype.hasOwnProperty.call(source, questionId),
    activeTargets: ANSWER_TARGETS[questionId].filter((target) => (
      target.indexOf('softPreferences.') === 0
      || activeConstraintIds.some((id) => target === `hardConstraints.${id}`)
    )),
  }))
  return {
    softPreferences,
    hardConstraints,
    answerTrace,
    sourceQuestionIds: answerTrace.filter((item) => item.included).map((item) => item.questionId),
  }
}

function calculatePreferenceFit(club, preferences) {
  return scoreSoftPreferences(club, preferences)
}

function fitPreferences(clubs, preferences) {
  return (Array.isArray(clubs) ? clubs : [])
    .map((club) => calculatePreferenceFit(club, preferences))
    .sort((left, right) => right.score - left.score || right.confidence - left.confidence || left.clubId.localeCompare(right.clubId))
}

module.exports = {
  ANSWER_TARGETS,
  buildDecisionProfile,
  buildHardConstraints,
  buildSoftPreferences,
  calculatePreferenceFit,
  fitPreferences,
  scorePreferenceFit: calculatePreferenceFit,
}
