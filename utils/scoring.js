const { isHardPassEligible } = require('../data/schema.js')
const { dimensionLabel, fieldLabel } = require('./labels.js')

const GRADE_CONFIDENCE = { A: 100, B: 80, C: 60, D: 30, U: 0 }
const DIMENSIONS = ['interest', 'schedule', 'commitment', 'social', 'growth', 'mode']
const DIMENSION_FIELDS = {
  interest: 'decisionProfile.activityDomains',
  schedule: 'decisionProfile.requiredTimeSlots',
  commitment: 'decisionProfile.weeklyHoursTypical',
  social: 'decisionProfile.publicExpressionLevel',
  growth: 'decisionProfile.goalBenefits',
  mode: 'decisionProfile.activityModes',
}

function getPath(target, path) {
  return String(path || '').split('.').reduce((value, key) => (
    value === null || value === undefined ? undefined : value[key]
  ), target)
}

function evidenceFor(club, fieldPath) {
  return club && club.evidence && Array.isArray(club.evidence[fieldPath])
    ? club.evidence[fieldPath]
    : []
}

function hasConflict(records) {
  return records.some((record) => record.conflicted || record.conflict === true)
}

function compareValue(actual, operator, expected) {
  if (operator === 'lte') return actual <= expected
  if (operator === 'gte') return actual >= expected
  if (operator === 'eq') return actual === expected
  if (operator === 'neq') return actual !== expected
  if (operator === 'includes') return Array.isArray(actual) && actual.indexOf(expected) !== -1
  if (operator === 'not-includes') return Array.isArray(actual) && actual.indexOf(expected) === -1
  if (operator === 'overlaps') {
    const wanted = Array.isArray(expected) ? expected : [expected]
    return Array.isArray(actual) && wanted.some((value) => actual.indexOf(value) !== -1)
  }
  if (operator === 'not-overlaps') {
    const blocked = Array.isArray(expected) ? expected : [expected]
    return Array.isArray(actual) && blocked.every((value) => actual.indexOf(value) === -1)
  }
  if (operator === 'empty') return Array.isArray(actual) && actual.length === 0
  if (operator === 'max-length') return Array.isArray(actual) && actual.length <= Number(expected)
  return false
}

function evaluateHardConstraint(club, constraint, options) {
  const fieldPath = constraint.fieldPath
  const actual = getPath(club, fieldPath)
  const records = evidenceFor(club, fieldPath)
  const evidenceIds = records.map((record) => record.id)
  const base = {
    constraintId: constraint.id,
    fieldPath,
    fieldLabel: fieldLabel(fieldPath),
    expected: constraint.value,
    actual,
    evidenceIds,
  }
  if (actual === null || actual === undefined || records.length === 0) {
    return Object.assign(base, {
      result: 'UNKNOWN', reasonCode: 'MISSING_FACT',
      reason: '字段值或字段级证据缺失，不能判定为满足。',
    })
  }
  if (hasConflict(records)) {
    return Object.assign(base, {
      result: 'UNKNOWN', reasonCode: 'CONFLICTING_EVIDENCE',
      reason: '该字段存在未解决的冲突证据，必须先核实。',
    })
  }
  if (records.some((record) => record.sourceType === 'prototype-inferred')) {
    return Object.assign(base, {
      result: 'UNKNOWN', reasonCode: 'PROTOTYPE_INFERRED',
      reason: '该值尚未核实，即使表面相符也不能视为硬约束通过。',
    })
  }
  const eligible = records.some((record) => (
    record.hardPassEligible === true
    && isHardPassEligible(record, fieldPath, options && options.now)
  ))
  if (!eligible) {
    return Object.assign(base, {
      result: 'UNKNOWN', reasonCode: 'INSUFFICIENT_EVIDENCE',
      reason: '证据等级或可定位性不足，不能作硬约束结论。',
    })
  }
  const passed = compareValue(actual, constraint.operator || 'eq', constraint.value)
  return Object.assign(base, {
    result: passed ? 'PASS' : 'FAIL',
    reasonCode: passed ? 'VERIFIED_MATCH' : 'VERIFIED_CONFLICT',
    reason: passed ? '合格字段证据明确满足该硬约束。' : '合格字段证据明确违反该硬约束。',
  })
}

function evaluateHardConstraints(club, constraints, options) {
  const evaluations = (Array.isArray(constraints) ? constraints : [])
    .map((constraint) => evaluateHardConstraint(club, constraint, options))
  const status = evaluations.some((item) => item.result === 'FAIL')
    ? 'FAIL'
    : (evaluations.some((item) => item.result === 'UNKNOWN') ? 'UNKNOWN' : 'PASS')
  return { clubId: club.id, status, result: status, evaluations, trace: evaluations }
}

function normalizePreferenceInput(preferences) {
  if (Array.isArray(preferences)) {
    return preferences.reduce((result, item) => {
      result[item.dimension || item.id] = item
      return result
    }, {})
  }
  return preferences || {}
}

function preferenceValue(item) {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return item.value === undefined ? item.answer : item.value
  }
  return item
}

function isNoPreference(value) {
  return value === undefined || value === null || value === ''
    || value === 'no-preference'
    || (Array.isArray(value) && value.length === 0)
}

function compatibility(dimension, expected, actual) {
  if (actual === null || actual === undefined) return 50
  if (dimension === 'commitment') {
    const target = Number(expected)
    const value = Number(actual)
    if (!Number.isFinite(target) || !Number.isFinite(value)) return 50
    if (value <= target) return 100
    if (value <= target + 1) return 75
    if (value <= target + 2) return 50
    if (value <= target + 4) return 25
    return 0
  }
  if (dimension === 'social' && typeof expected === 'number' && typeof actual === 'number') {
    return [100, 75, 50, 25, 0][Math.min(4, Math.abs(expected - actual))]
  }
  const wanted = Array.isArray(expected) ? expected : [expected]
  const offered = Array.isArray(actual) ? actual : [actual]
  const overlap = wanted.filter((value) => offered.indexOf(value) !== -1).length
  if (overlap === 0) return 0
  if (overlap === wanted.length) return 100
  return overlap * 2 >= wanted.length ? 75 : 50
}

function scoreSoftPreferences(club, preferences) {
  const input = normalizePreferenceInput(preferences)
  const active = DIMENSIONS.filter((dimension) => !isNoPreference(preferenceValue(input[dimension])))
  const rawWeights = active.map((dimension) => {
    const item = input[dimension]
    const weight = item && typeof item === 'object' ? Number(item.weight) : 1
    return Number.isFinite(weight) && weight > 0 ? weight : 1
  })
  const denominator = rawWeights.reduce((sum, value) => sum + value, 0)
  const dimensions = active.map((dimension, index) => {
    const fieldPath = DIMENSION_FIELDS[dimension]
    const actual = getPath(club, fieldPath)
    const records = evidenceFor(club, fieldPath)
    const inferredOnly = records.length > 0 && records.every((record) => record.sourceType === 'prototype-inferred')
    const isUnknown = actual === null || actual === undefined || records.length === 0 || hasConflict(records)
    const normalizedWeight = denominator ? (rawWeights[index] * 100) / denominator : 0
    const value = compatibility(dimension, preferenceValue(input[dimension]), actual)
    const bestGrade = records.reduce((best, record) => (
      GRADE_CONFIDENCE[record.grade] > GRADE_CONFIDENCE[best] ? record.grade : best
    ), 'U')
    return {
      dimension,
      dimensionLabel: dimensionLabel(dimension),
      fieldPath,
      fieldLabel: fieldLabel(fieldPath),
      expected: preferenceValue(input[dimension]),
      actual,
      normalizedWeight,
      compatibility: isUnknown ? 50 : value,
      weightedContribution: (normalizedWeight * (isUnknown ? 50 : value)) / 100,
      isUnknown,
      inferredOnly,
      evidenceIds: records.map((record) => record.id),
      evidenceGrade: bestGrade,
      confidenceContribution: (normalizedWeight * GRADE_CONFIDENCE[bestGrade]) / 100,
    }
  })
  const score = denominator
    ? Math.round(dimensions.reduce((sum, item) => sum + item.weightedContribution, 0))
    : 0
  const confidence = denominator
    ? Math.round(dimensions.reduce((sum, item) => sum + item.confidenceContribution, 0))
    : 0
  const reasons = dimensions.filter((item) => !item.isUnknown && item.compatibility >= 75)
    .sort((a, b) => b.weightedContribution - a.weightedContribution || a.dimension.localeCompare(b.dimension))
    .slice(0, 3)
    .map((item) => `${item.dimensionLabel}兼容度为 ${item.compatibility}`)
  const conflicts = dimensions.filter((item) => !item.isUnknown && item.compatibility <= 25)
    .sort((a, b) => a.compatibility - b.compatibility || a.dimension.localeCompare(b.dimension))
    .slice(0, 3)
    .map((item) => `${item.dimensionLabel}与候选存在明显差异`)
  return {
    clubId: club.id,
    score,
    confidence,
    dimensions,
    trace: dimensions,
    reasons,
    conflicts,
    omittedDimensions: DIMENSIONS.filter((dimension) => active.indexOf(dimension) === -1),
    usedDefaultWeights: false,
  }
}

function scoreClub(club, decisionProfile, options) {
  const profile = decisionProfile || {}
  const hard = evaluateHardConstraints(club, profile.hardConstraints, options)
  const preference = scoreSoftPreferences(club, profile.softPreferences || profile.preferences)
  return { club, clubId: club.id, hard, preference, score: preference.score, confidence: preference.confidence }
}

function rankClubs(clubs, decisionProfile, options) {
  const rank = { PASS: 0, UNKNOWN: 1, FAIL: 2 }
  return (Array.isArray(clubs) ? clubs : [])
    .map((club) => scoreClub(club, decisionProfile, options))
    .sort((left, right) => (
      rank[left.hard.status] - rank[right.hard.status]
      || right.score - left.score
      || right.confidence - left.confidence
      || left.clubId.localeCompare(right.clubId)
    ))
}

module.exports = {
  DIMENSIONS,
  DIMENSION_FIELDS,
  GRADE_CONFIDENCE,
  compareValue,
  evaluateHardConstraint,
  evaluateHardConstraints,
  getPath,
  rankClubs,
  scoreClub,
  scoreSoftPreferences,
}
