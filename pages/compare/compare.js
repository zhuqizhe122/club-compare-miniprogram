const { getClubsByIds } = require('../../data/clubs.js')
const session = require('../../store/session.js')
const { buildDecisionProfile } = require('../../utils/preference-fit.js')
const { getPath, rankClubs } = require('../../utils/scoring.js')
const {
  STRESS_SCENARIOS,
  compareClubs,
  runStressScenarioRanking,
} = require('../../utils/compare.js')
const { fieldLabel, scenarioLabel } = require('../../utils/labels.js')

const 枚举中文 = {
  discussion: '讨论交流',
  practice: '训练实践',
  project: '项目协作',
  performance: '表演展示',
  competition: '比赛竞技',
  service: '公益服务',
  skill: '技能成长',
  portfolio: '作品与项目经历',
  friendship: '同伴关系',
  leadership: '组织与领导力',
  'weekday-evening': '工作日晚间',
  'weekend-day': '周末白天',
  weekend: '周末为主',
  flexible: '灵活安排',
  high: '高',
  medium: '中',
  low: '低',
  regular: '需要稳定出席',
  'peak-based': '高峰期加码',
  steady: '稳定投入',
  open: '开放加入',
  guided: '指导入门',
  rare: '通常不需要',
  occasional: '偶尔需要',
}

const 对比分组 = [
  {
    id: 'time',
    title: '时间承诺',
    description: '看常态、高峰与安排弹性，而不只看一次活动时长。',
    fields: [
      'decisionProfile.weeklyHoursTypical',
      'decisionProfile.weeklyHoursPeak',
      'decisionProfile.scheduleFlexibility',
      'decisionProfile.attendancePolicy',
    ],
  },
  {
    id: 'experience',
    title: '参与体验',
    description: '看日常参与方式、表达和协作强度。',
    fields: [
      'decisionProfile.activityModes',
      'decisionProfile.publicExpressionLevel',
      'decisionProfile.collaborationLevel',
      'decisionProfile.autonomyLevel',
    ],
  },
  {
    id: 'growth',
    title: '成长门槛',
    description: '把成长收益与加入门槛、选拔要求放在一起判断。',
    fields: [
      'decisionProfile.goalBenefits',
      'decisionProfile.entryPolicy',
      'decisionProfile.selectionRequired',
      'decisionProfile.semesterCostMax',
    ],
  },
]

const 等级顺序 = { U: 0, D: 1, C: 2, B: 3, A: 4 }

function 证据等级(club, fieldPath) {
  const records = club.evidence && club.evidence[fieldPath]
  if (!Array.isArray(records) || !records.length) return 'U'
  return records.reduce((best, record) => (
    等级顺序[record.grade] > 等级顺序[best] ? record.grade : best
  ), 'U')
}

function 中文值(fieldPath, value) {
  if (value === null || value === undefined || value === '') return '待核实'
  if (Array.isArray(value)) return value.length ? value.map((item) => 枚举中文[item] || item).join('、') : '无'
  if (typeof value === 'boolean') return value ? '需要' : '不需要'
  if (/weeklyHours/.test(fieldPath)) return `${value} 小时/周`
  if (/Level$/.test(fieldPath)) return `${value} / 4`
  if (/semesterCostMax/.test(fieldPath)) return `不高于 ${value} 元/学期`
  return 枚举中文[value] || String(value)
}

function 有偏好答案(answers) {
  return Object.keys(answers || {}).length > 0
}

function 降级文案(grade) {
  return grade === 'U' ? 'U 级 · 暂无可定位证据' : `${grade} 级 · 演示资料`
}

function 构建分组(clubs) {
  return 对比分组.map((group) => ({
    id: group.id,
    title: group.title,
    description: group.description,
    rows: group.fields.map((fieldPath) => ({
      fieldPath,
      label: fieldLabel(fieldPath),
      entries: clubs.map((club) => {
        const grade = 证据等级(club, fieldPath)
        return {
          clubId: club.id,
          clubName: club.name,
          valueText: 中文值(fieldPath, getPath(club, fieldPath)),
          evidenceGrade: grade,
          evidenceText: 降级文案(grade),
        }
      }),
    })),
  }))
}

function 构建关键权衡(clubs, comparison) {
  const result = comparison.tradeoffs.slice(0, 3).map((item, index) => ({
    order: index + 1,
    label: item.fieldLabel,
    message: item.message,
    values: item.values.map((entry) => {
      const club = clubs.find((candidate) => candidate.id === entry.clubId)
      return {
        clubId: entry.clubId,
        clubName: club ? club.name : '候选社团',
        valueText: 中文值(item.fieldPath, entry.value),
      }
    }),
  }))
  const fallbackFields = 对比分组.reduce((all, group) => all.concat(group.fields), [])
  fallbackFields.some((fieldPath) => {
    if (result.length >= 3) return true
    if (result.some((item) => item.label === fieldLabel(fieldPath))) return false
    result.push({
      order: result.length + 1,
      label: fieldLabel(fieldPath),
      message: `候选在“${fieldLabel(fieldPath)}”上的演示值接近，仍应核实本学期实际安排。`,
      values: clubs.map((club) => ({
        clubId: club.id,
        clubName: club.name,
        valueText: 中文值(fieldPath, getPath(club, fieldPath)),
      })),
    })
    return result.length >= 3
  })
  return result
}

function 构建候选摘要(clubs, profile, comparison, hasAnswers) {
  const ranked = rankClubs(clubs, profile)
  const comparisonById = comparison.summaries.reduce((index, item) => {
    index[item.clubId] = item
    return index
  }, {})
  return ranked.map((item, index) => {
    const summary = comparisonById[item.clubId] || { strengths: [], costs: [], unknowns: [] }
    const strengths = item.preference.dimensions
      .filter((dimension) => !dimension.isUnknown && dimension.compatibility >= 75)
      .slice(0, 2)
      .map((dimension) => `${dimension.dimensionLabel}与当前偏好较接近（演示兼容度 ${dimension.compatibility}）`)
    const costs = item.preference.dimensions
      .filter((dimension) => !dimension.isUnknown && dimension.compatibility <= 50)
      .slice(0, 2)
      .map((dimension) => `${dimension.dimensionLabel}可能需要你让步（演示兼容度 ${dimension.compatibility}）`)
    summary.costs.slice(0, 2 - costs.length).forEach((cost) => {
      costs.push(`${cost.fieldLabel}可能带来额外投入`)
    })
    const unknowns = summary.unknowns.slice(0, 2).map((unknown) => `${unknown.fieldLabel}：${unknown.reason}`)
    return {
      id: item.clubId,
      name: item.club.name,
      baseRank: index + 1,
      matchScore: item.score,
      confidence: item.confidence,
      hardStatus: { PASS: '已核实通过', FAIL: '存在硬冲突', UNKNOWN: '硬条件待核实' }[item.hard.status],
      hasPreference: hasAnswers,
      matchReasons: hasAnswers ? item.preference.reasons.slice(0, 3) : [],
      strengths: strengths.length ? strengths : ['暂无足够强的加分项，建议结合现场信息判断'],
      costs: costs.length ? costs : ['当前未识别出明显偏好冲突，但不代表没有代价'],
      unknowns: unknowns.length ? unknowns : ['关键字段仍应向社团核实本学期安排'],
    }
  })
}

function 构建场景选项() {
  return STRESS_SCENARIOS.map((scenario) => ({
    id: scenario.id,
    label: scenarioLabel(scenario.id),
  }))
}

function 构建场景结果(clubs, profile, scenarioId) {
  const result = runStressScenarioRanking(clubs, profile, scenarioId)
  return {
    id: scenarioId,
    label: result.scenarioLabel,
    reason: result.reason,
    evidenceGrade: result.evidenceGrade,
    ranking: result.ranking.map((item) => ({
      clubId: item.clubId,
      clubName: item.clubName,
      baseScore: item.baseScore,
      scenarioScore: item.scenarioScore,
      deltaText: item.delta > 0 ? `+${item.delta}` : String(item.delta),
      deltaClass: item.delta > 0 ? 'up' : (item.delta < 0 ? 'down' : 'same'),
      baseRank: item.baseRank,
      scenarioRank: item.scenarioRank,
      rankText: item.baseRank === item.scenarioRank
        ? `第 ${item.baseRank} 名 → 第 ${item.scenarioRank} 名（不变）`
        : `第 ${item.baseRank} 名 → 第 ${item.scenarioRank} 名`,
    })),
  }
}

function 当前候选Ids() {
  const snapshotIds = session.snapshot().selectedClubIds
  const legacyIds = (getApp().globalData || {}).selectedClubIds || []
  return snapshotIds.length ? snapshotIds : legacyIds
}

Page({
  data: {
    columns: [],
    comparisonGroups: [],
    keyTradeoffs: [],
    scenarioOptions: 构建场景选项(),
    selectedScenarioId: 'busy',
    scenarioResult: null,
    hasPreference: false,
    guardMessage: '',
  },

  onShow() {
    const ids = 当前候选Ids()
    const snapshot = session.snapshot()
    const sessionGuard = snapshot.selectedClubIds.length ? session.selectionGuard(true) : null
    const guard = sessionGuard ? sessionGuard.ok : (ids.length >= 2 && ids.length <= 3)
    if (!guard) {
      this.setData({ guardMessage: '深度比较需要 2～3 个候选，请先返回候选篮调整。' })
      wx.showToast({ title: '请先选择 2～3 个候选', icon: 'none' })
      return
    }
    const clubs = getClubsByIds(ids)
    if (clubs.length !== ids.length) {
      this.setData({ guardMessage: '部分候选资料已不可用，请返回候选篮重新选择。' })
      return
    }
    const answers = Object.keys(snapshot.answers || {}).length
      ? snapshot.answers
      : ((getApp().globalData || {}).preferenceAnswers || {})
    const profile = buildDecisionProfile(answers)
    const comparison = compareClubs(clubs)
    const allowedScenarios = STRESS_SCENARIOS.map((item) => item.id)
    const selectedScenarioId = allowedScenarios.indexOf(snapshot.compareScenario) !== -1
      ? snapshot.compareScenario
      : 'busy'
    this.clubs = clubs
    this.decisionProfile = profile
    this.setData({
      columns: 构建候选摘要(clubs, profile, comparison, 有偏好答案(answers)),
      comparisonGroups: 构建分组(clubs),
      keyTradeoffs: 构建关键权衡(clubs, comparison),
      selectedScenarioId,
      scenarioResult: 构建场景结果(clubs, profile, selectedScenarioId),
      hasPreference: 有偏好答案(answers),
      guardMessage: '',
    })
  },

  onScenarioChange(event) {
    const scenarioId = event.currentTarget.dataset.id
    if (!STRESS_SCENARIOS.some((scenario) => scenario.id === scenarioId)) return
    session.compareScenario = scenarioId
    this.setData({
      selectedScenarioId: scenarioId,
      scenarioResult: 构建场景结果(this.clubs || [], this.decisionProfile || {}, scenarioId),
    })
  },

  onAdjust() {
    wx.navigateBack({ delta: 1 })
  },

  onNext() {
    if (this.data.guardMessage) return
    wx.navigateTo({ url: '/pages/result/result' })
  },
})
