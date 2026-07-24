const EVIDENCE_GRADES = ['A', 'B', 'C', 'D', 'U']
const SOURCE_TYPES = [
  'official-current', 'leader-confirmed', 'cross-checked', 'member-interview',
  'public-secondary', 'prototype-inferred', 'unknown',
]

const DECISION_FIELDS = [
  'activityDomains', 'activityModes', 'goalBenefits',
  'weeklyHoursMin', 'weeklyHoursTypical', 'weeklyHoursPeak',
  'requiredTimeSlots', 'scheduleFlexibility', 'attendancePolicy',
  'commitmentPattern', 'entryPolicy', 'selectionRequired',
  'semesterCostMin', 'semesterCostMax', 'equipmentRequired',
  'offCampusFrequency', 'publicExpressionLevel', 'collaborationLevel',
  'competitionLevel', 'autonomyLevel', 'physicalIntensityLevel',
  'typicalGroupSize',
]

const LEVEL_FIELDS = [
  'publicExpressionLevel', 'collaborationLevel', 'competitionLevel',
  'autonomyLevel', 'physicalIntensityLevel',
]

function isLevel(value) {
  return Number.isInteger(value) && value >= 0 && value <= 4
}

function isHardPassEligible(evidence, fieldPath, now) {
  if (!evidence || ['A', 'B'].indexOf(evidence.grade) === -1) return false
  if (['official-current', 'leader-confirmed', 'cross-checked'].indexOf(evidence.sourceType) === -1) return false
  if (!evidence.sourceRef || !evidence.observedAt || !evidence.verifiedAt) return false
  if (evidence.fieldPath !== fieldPath || evidence.conflicted) return false
  if (evidence.expiresAt && evidence.expiresAt < (now || new Date().toISOString().slice(0, 10))) return false
  return true
}

function makeInferredEvidence(clubId, fieldPath, note) {
  return {
    id: `ev-${clubId}-${fieldPath.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`,
    fieldPath,
    grade: 'D',
    sourceType: 'prototype-inferred',
    sourceRef: null,
    observedAt: null,
    verifiedAt: null,
    validTerm: null,
    expiresAt: null,
    note: note || '依据旧版原型文案与分类规则推断，仅用于演示，必须现场核实。',
    hardPassEligible: false,
  }
}

module.exports = {
  DECISION_FIELDS,
  EVIDENCE_GRADES,
  LEVEL_FIELDS,
  SOURCE_TYPES,
  isHardPassEligible,
  isLevel,
  makeInferredEvidence,
}
