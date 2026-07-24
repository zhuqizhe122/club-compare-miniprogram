const { GRADE_CONFIDENCE, getPath, rankClubs } = require('./scoring.js')
const { fieldLabel, scenarioLabel } = require('./labels.js')

const STRESS_SCENARIOS = [
  {
    id: 'busy',
    label: '考试周时间减半',
    requiredFieldPaths: [
      'decisionProfile.weeklyHoursTypical',
      'decisionProfile.scheduleFlexibility',
    ],
    ruleId: 'busy-half-time-v1',
  },
  {
    id: 'deep',
    label: '任务临时加码',
    requiredFieldPaths: [
      'decisionProfile.weeklyHoursPeak',
      'decisionProfile.commitmentPattern',
    ],
    ruleId: 'deep-work-spike-v1',
  },
  {
    id: 'social',
    label: '连续两次无法参加',
    requiredFieldPaths: [
      'decisionProfile.attendancePolicy',
      'decisionProfile.collaborationLevel',
    ],
    ruleId: 'social-absence-v1',
  },
]

function evidenceFor(club, fieldPath) {
  return club && club.evidence && Array.isArray(club.evidence[fieldPath])
    ? club.evidence[fieldPath]
    : []
}

function reliableEvidence(records, fieldPath) {
  return records.some((record) => (
    ['A', 'B', 'C'].indexOf(record.grade) !== -1
    && record.sourceType !== 'prototype-inferred'
    && record.fieldPath === fieldPath
    && !record.conflicted
  ))
}

function runStressTest(club, scenarioId, context) {
  const scenario = STRESS_SCENARIOS.find((item) => item.id === scenarioId)
  if (!scenario) throw new Error(`未知压力情境：${scenarioId}`)
  const evidenceIds = []
  const values = {}
  const unavailable = scenario.requiredFieldPaths.some((fieldPath) => {
    values[fieldPath] = getPath(club, fieldPath)
    const records = evidenceFor(club, fieldPath)
    evidenceIds.push(...records.map((record) => record.id))
    return values[fieldPath] === null || values[fieldPath] === undefined
      || !reliableEvidence(records, fieldPath)
  })
  if (unavailable) {
    return {
      scenarioId, clubId: club.id, result: 'UNKNOWN',
      scenarioLabel: scenario.label,
      requiredFieldPaths: scenario.requiredFieldPaths.slice(),
      evidenceIds, ruleId: scenario.ruleId,
      reason: '必需字段缺失、冲突或尚未核实，无法作可靠压力判断。',
    }
  }
  const settings = context || {}
  let atRisk = false
  if (scenarioId === 'busy') {
    const available = Number(settings.busyWeeklyHours === undefined ? 2 : settings.busyWeeklyHours)
    atRisk = values['decisionProfile.weeklyHoursTypical'] > available
      && values['decisionProfile.scheduleFlexibility'] !== 'high'
  } else if (scenarioId === 'deep') {
    const peakLimit = Number(settings.peakWeeklyHours === undefined ? 6 : settings.peakWeeklyHours)
    atRisk = values['decisionProfile.weeklyHoursPeak'] > peakLimit
      || values['decisionProfile.commitmentPattern'] === 'peak-based'
  } else {
    atRisk = values['decisionProfile.attendancePolicy'] === 'regular'
      && values['decisionProfile.collaborationLevel'] >= 3
  }
  return {
    scenarioId, clubId: club.id, result: atRisk ? 'AT_RISK' : 'RESILIENT',
    scenarioLabel: scenario.label,
    requiredFieldPaths: scenario.requiredFieldPaths.slice(),
    evidenceIds, ruleId: scenario.ruleId,
    reason: atRisk ? '已核实字段表明该情境可能触发明显代价。' : '已核实字段在该情境下仍处于给定容忍范围。',
  }
}

function runStressTests(clubs, context) {
  return (Array.isArray(clubs) ? clubs : []).reduce((results, club) => (
    results.concat(STRESS_SCENARIOS.map((scenario) => runStressTest(club, scenario.id, context)))
  ), [])
}

function preferenceItem(value, fallback) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return Object.assign({}, value)
  return { value: value === undefined ? fallback : value, weight: 1 }
}

function transformProfileForScenario(decisionProfile, scenarioId) {
  const source = decisionProfile || {}
  const transformed = Object.assign({}, source, {
    softPreferences: Object.assign({}, source.softPreferences || source.preferences || {}),
    hardConstraints: (source.hardConstraints || []).slice(),
  })
  const soft = transformed.softPreferences
  if (scenarioId === 'busy') {
    const commitment = preferenceItem(soft.commitment, 4)
    const baseHours = Number(commitment.value)
    commitment.value = Number.isFinite(baseHours) ? Math.max(1, Math.floor(baseHours / 2)) : 2
    commitment.weight = Math.max(1, Number(commitment.weight) || 1) * 3
    commitment.sourceQuestionId = 'scenario:busy'
    soft.commitment = commitment
  } else if (scenarioId === 'deep') {
    const commitment = preferenceItem(soft.commitment, 6)
    commitment.weight = Math.max(1, Number(commitment.weight) || 1) * 2
    commitment.sourceQuestionId = 'scenario:deep'
    soft.commitment = commitment
    const mode = preferenceItem(soft.mode, 'project')
    mode.value = 'project'
    mode.weight = Math.max(1, Number(mode.weight) || 1) * 3
    mode.sourceQuestionId = 'scenario:deep'
    soft.mode = mode
  } else if (scenarioId === 'social') {
    const social = preferenceItem(soft.social, 2)
    const levelMap = { quiet: 0, collaborative: 2, expressive: 4 }
    if (levelMap[social.value] !== undefined) social.value = levelMap[social.value]
    if (typeof social.value !== 'number') social.value = 2
    social.weight = Math.max(1, Number(social.weight) || 1) * 3
    social.sourceQuestionId = 'scenario:social'
    soft.social = social
  } else {
    throw new Error(`未知压力情境：${scenarioId}`)
  }
  return transformed
}

/**
 * 使用 D 级演示估计进行“如果……会怎样”的排序重算。
 * 它只改变偏好权重/容忍值，不产生 RESILIENT 或 AT_RISK 事实判断。
 */
function runStressScenarioRanking(clubs, decisionProfile, scenarioId, options) {
  const source = Array.isArray(clubs) ? clubs : []
  if (!STRESS_SCENARIOS.some((scenario) => scenario.id === scenarioId)) {
    throw new Error(`未知压力情境：${scenarioId}`)
  }
  const baseRanking = rankClubs(source, decisionProfile || {}, options)
  const transformedProfile = transformProfileForScenario(decisionProfile, scenarioId)
  const scenarioRanking = rankClubs(source, transformedProfile, options)
  const baseById = baseRanking.reduce((index, item, rankIndex) => {
    index[item.clubId] = { score: item.score, rank: rankIndex + 1 }
    return index
  }, {})
  const reasonByScenario = {
    busy: '演示估计：把可用时间减半，并提高“时间投入”的权重；这不是社团已确认的忙周安排。',
    deep: '演示估计：提高“时间投入”和“项目参与”的权重；这不是对临时任务量的可靠预测。',
    social: '演示估计：提高“互动与表达”的权重；这不是对缺席后果的可靠判断。',
  }
  return {
    scenarioId,
    scenarioLabel: scenarioLabel(scenarioId),
    estimateOnly: true,
    evidenceGrade: 'D',
    reason: reasonByScenario[scenarioId],
    transformedProfile,
    ranking: scenarioRanking.map((item, rankIndex) => ({
      clubId: item.clubId,
      clubName: item.club.name,
      baseScore: baseById[item.clubId].score,
      scenarioScore: item.score,
      delta: item.score - baseById[item.clubId].score,
      baseRank: baseById[item.clubId].rank,
      scenarioRank: rankIndex + 1,
      estimateOnly: true,
      evidenceGrade: 'D',
      reason: reasonByScenario[scenarioId],
      trace: item.preference.trace,
    })),
  }
}

function scalar(value) {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (Array.isArray(value)) return value.length
  return value === null || value === undefined ? null : String(value)
}

function differenceMagnitude(values) {
  const usable = values.filter((value) => value !== null)
  if (usable.length < 2) return 0
  if (usable.every((value) => typeof value === 'number')) {
    const max = Math.max(...usable)
    const min = Math.min(...usable)
    return max === min ? 0 : Math.min(100, (max - min) * 25)
  }
  return new Set(usable).size > 1 ? 100 : 0
}

function compareClubs(clubs, options) {
  const source = Array.isArray(clubs) ? clubs : []
  const settings = options || {}
  const fields = settings.fields || [
    'decisionProfile.weeklyHoursTypical',
    'decisionProfile.weeklyHoursPeak',
    'decisionProfile.scheduleFlexibility',
    'decisionProfile.publicExpressionLevel',
    'decisionProfile.collaborationLevel',
    'decisionProfile.competitionLevel',
    'decisionProfile.autonomyLevel',
    'decisionProfile.physicalIntensityLevel',
  ]
  const weights = settings.weights || {}
  const differences = fields.map((fieldPath) => {
    const values = source.map((club) => ({
      clubId: club.id,
      value: getPath(club, fieldPath),
      evidenceIds: evidenceFor(club, fieldPath).map((record) => record.id),
    }))
    const magnitude = differenceMagnitude(values.map((item) => scalar(item.value)))
    const weight = Number(weights[fieldPath] === undefined ? 1 : weights[fieldPath])
    return { fieldPath, fieldLabel: fieldLabel(fieldPath), weight, magnitude, weightedDifference: magnitude * weight, values }
  }).filter((item) => item.magnitude > 0)
    .sort((left, right) => right.weightedDifference - left.weightedDifference || left.fieldPath.localeCompare(right.fieldPath))

  const summaries = source.map((club) => {
    const strengths = []
    const costs = []
    const unknowns = []
    fields.forEach((fieldPath) => {
      const value = getPath(club, fieldPath)
      const records = evidenceFor(club, fieldPath)
      if (value === null || value === undefined || !records.length || records.some((record) => record.conflicted)) {
        unknowns.push({ fieldPath, fieldLabel: fieldLabel(fieldPath), reason: '值或证据不完整' })
        return
      }
      const confidence = records.reduce((best, record) => Math.max(best, GRADE_CONFIDENCE[record.grade] || 0), 0)
      if (confidence <= 30) unknowns.push({ fieldPath, fieldLabel: fieldLabel(fieldPath), reason: '仅有低可靠度或演示资料' })
      else if (/Flexibility|autonomyLevel/.test(fieldPath) && (value === 'high' || value >= 3)) {
        strengths.push({ fieldPath, fieldLabel: fieldLabel(fieldPath), value })
      } else if (/Hours|Intensity|competitionLevel/.test(fieldPath) && Number(value) >= 3) {
        costs.push({ fieldPath, fieldLabel: fieldLabel(fieldPath), value })
      }
    })
    return { clubId: club.id, strengths, costs, unknowns }
  })

  const tradeoffs = differences.slice(0, 5).map((difference) => ({
    fieldPath: difference.fieldPath,
    fieldLabel: difference.fieldLabel,
    message: `候选在“${difference.fieldLabel}”上存在需要权衡的差异。`,
    values: difference.values,
  }))
  return {
    clubIds: source.map((club) => club.id),
    differences,
    weightedDifferences: differences,
    tradeoffs,
    summaries,
    stressTests: runStressTests(source, settings.stressContext),
    conclusion: {
      type: 'NO_UNIQUE_BEST',
      message: '这些候选各有优势、代价与未知项；不存在脱离个人取舍的唯一最优。',
    },
  }
}

module.exports = {
  STRESS_SCENARIOS,
  compareClubs,
  runStressScenarioRanking,
  runStressTest,
  runStressTests,
  stressTest: runStressTests,
  transformProfileForScenario,
}
