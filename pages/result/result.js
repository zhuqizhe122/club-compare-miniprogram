const { getClubsByIds } = require('../../data/clubs.js')
const session = require('../../store/session.js')
const { generateBoothQuestions } = require('../../utils/booth-questions.js')
const { buildDecisionProfile } = require('../../utils/preference-fit.js')
const { getPath, rankClubs } = require('../../utils/scoring.js')
const { compareClubs } = require('../../utils/compare.js')

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
  regular: '稳定出席',
  flexible: '灵活安排',
  open: '开放加入',
  guided: '指导入门',
  high: '高弹性',
  medium: '中等弹性',
  low: '低弹性',
  'peak-based': '高峰期加码',
  steady: '稳定投入',
}

const 问题来源中文 = {
  'hard-risk': '硬条件冲突',
  'hard-unknown': '硬条件未知',
  'stress-risk': '压力情境风险',
  'stress-unknown': '压力情境未知',
  'low-evidence': '低等级证据',
  missing: '资料缺失',
  difference: '候选差异',
  tendency: '当前倾向',
  preference: '当前偏好',
  unconfirmed: '资料待确认',
  baseline: '基础核实',
}

function 当前候选Ids() {
  const snapshotIds = session.snapshot().selectedClubIds
  const legacyIds = (getApp().globalData || {}).selectedClubIds || []
  return snapshotIds.length ? snapshotIds : legacyIds
}

function 当前答案() {
  const answers = session.snapshot().answers || {}
  if (Object.keys(answers).length) return answers
  return (getApp().globalData || {}).preferenceAnswers || {}
}

function 中文列表(values) {
  return (Array.isArray(values) ? values : []).map((value) => 枚举中文[value] || value).join('、') || '待核实'
}

function 构建洞察(clubs, profile) {
  const comparison = compareClubs(clubs)
  const ranked = rankClubs(clubs, profile)
  const hardEvaluations = ranked.reduce((all, item) => all.concat(
    item.hard.evaluations.map((evaluation) => Object.assign({ clubId: item.clubId }, evaluation))
  ), [])
  const unknowns = comparison.summaries.reduce((all, summary) => all.concat(
    summary.unknowns.map((unknown) => Object.assign({ clubId: summary.clubId }, unknown))
  ), [])
  return {
    comparison,
    ranked,
    questionInsights: {
      hardEvaluations,
      stressTests: comparison.stressTests,
      unknowns,
    },
  }
}

function 摘要ById(comparison) {
  return comparison.summaries.reduce((index, item) => {
    index[item.clubId] = item
    return index
  }, {})
}

function 首选卡(club, scored, summary) {
  const strengths = scored.preference.dimensions
    .filter((dimension) => !dimension.isUnknown && dimension.compatibility >= 75)
    .slice(0, 3)
    .map((dimension) => `${dimension.dimensionLabel}与当前偏好较接近（演示兼容度 ${dimension.compatibility}）`)
  const costs = scored.preference.dimensions
    .filter((dimension) => !dimension.isUnknown && dimension.compatibility <= 50)
    .slice(0, 2)
    .map((dimension) => `${dimension.dimensionLabel}可能需要主动让步`)
  summary.costs.slice(0, 2 - costs.length).forEach((item) => {
    costs.push(`${item.fieldLabel}可能带来额外投入`)
  })
  const unknowns = summary.unknowns.slice(0, 3).map((item) => `${item.fieldLabel}仍需核实`)
  const profile = club.decisionProfile
  return {
    type: 'club',
    id: club.id,
    name: club.name,
    kicker: '主倾向预期卡',
    status: '非绑定性倾向',
    scoreText: `偏好匹配 ${scored.score}/100 · 资料等级 D（原型推断）`,
    expectations: [
      `常态投入暂按 ${profile.weeklyHoursTypical} 小时/周理解，高峰期约 ${profile.weeklyHoursPeak} 小时/周`,
      `参与方式暂按“${中文列表(profile.activityModes)}”理解`,
      `加入方式暂按“${枚举中文[profile.entryPolicy] || profile.entryPolicy}”理解`,
    ],
    reasons: strengths.length ? strengths : ['当前没有足够强的单项加分理由，倾向主要来自候选间相对比较'],
    costs: costs.length ? costs : ['尚未识别出明确偏好冲突，但仍需接受真实参与中的时间与协作成本'],
    unknowns: unknowns.length ? unknowns : ['本学期实际规则、活动变动和新成员职责仍需现场确认'],
    reminder: '卡片中的数值和归纳主要来自 D 级原型推断，不是社团承诺。',
  }
}

function 暂缓卡(clubs) {
  return {
    type: 'none',
    id: 'none',
    name: '先都不加',
    kicker: '暂缓加入行动卡',
    status: '保留选择权',
    actions: [
      '先不扫码或报名，避免在关键信息不足时形成沉没成本',
      `带着核实问题询问${clubs.map((club) => club.name).join('、')}`,
      '只在时间、出席、职责和门槛得到明确回答后重新比较',
    ],
    reasons: [
      '当前比较不足以支持一个你愿意承担代价的主倾向',
      'D 级演示资料不能替代本学期真实安排',
    ],
    costs: ['接受短期内没有社团归属，并投入时间继续核实信息'],
    unknowns: ['各候选本学期的真实投入、请假规则和普通成员职责仍未确认'],
    reminder: '暂不选择不是失败，而是对证据不足的主动回应。',
  }
}

function 四周复盘标准(tendency, preferredClub) {
  if (tendency === 'none') {
    return [
      '是否已获得至少两项可定位、可复述的本学期规则信息',
      '是否出现愿意接受其时间与职责代价的新候选',
      '是否仍因关键未知而无法做决定；若是，继续暂缓',
      '若没有新增可靠信息，不因“大家都加了”而改变结论',
    ]
  }
  const hours = getPath(preferredClub, 'decisionProfile.weeklyHoursTypical')
  return [
    `实际平均投入是否大致在 ${hours} 小时/周的预期范围内`,
    '请假、缺席和高峰任务规则是否与现场答复一致',
    '普通成员做的事情是否符合你期待的参与方式',
    '四周后获得的成长是否值得已承担的时间与协作代价',
  ]
}

function 构建结果(tendency, options, clubs, profile) {
  const insights = 构建洞察(clubs, profile)
  const preferredId = tendency.indexOf('club:') === 0 ? tendency.slice(5) : ''
  const preferredClub = clubs.find((club) => club.id === preferredId)
  const preferredScore = insights.ranked.find((item) => item.clubId === preferredId)
  const summaryIndex = 摘要ById(insights.comparison)
  const actionCard = tendency === 'none'
    ? 暂缓卡(clubs)
    : 首选卡(preferredClub, preferredScore, summaryIndex[preferredId])
  const option = options.find((item) => item.value === tendency)
  const questionLimit = Object.keys(当前答案()).length ? 5 : 3
  const questions = generateBoothQuestions(clubs, {
    tendency,
    insights: insights.questionInsights,
  }).slice(0, questionLimit).map((item) => Object.assign({}, item, {
    sourceText: 问题来源中文[item.source] || '现场核实',
  }))
  return {
    tendency,
    confirmed: true,
    confirmText: tendency === 'none'
      ? '当前结论：先都不加，先补足证据再决定。'
      : `当前主倾向：${option ? option.name : preferredClub.name}。这不是报名，也不是最终承诺。`,
    actionCard,
    expectationCards: [actionCard],
    boothQuestions: questions,
    reviewStandards: 四周复盘标准(tendency, preferredClub),
    evidenceNotice: '所有匹配、取舍和压力结论均为当前会话的决策辅助；D 级推断必须逐项现场核实。',
    error: '',
  }
}

Page({
  data: {
    options: [],
    tendency: '',
    confirmed: false,
    confirmText: '',
    actionCard: null,
    expectationCards: [],
    boothQuestions: [],
    reviewStandards: [],
    evidenceNotice: '',
    guardMessage: '',
    error: '',
  },

  onShow() {
    const ids = 当前候选Ids()
    if (ids.length < 2 || ids.length > 3) {
      this.setData({ guardMessage: '结果页需要有效的 2～3 个比较候选，请返回候选篮重新选择。' })
      return
    }
    const clubs = getClubsByIds(ids)
    if (clubs.length !== ids.length) {
      this.setData({ guardMessage: '部分候选资料已不可用，请返回候选篮重新选择。' })
      return
    }
    const options = clubs.map((c) => ({
      value: `club:${c.id}`,
      name: c.name,
      label: `更倾向：${c.name}`,
    }))
    options.push({ value: 'none', label: '先都不加' })
    const savedTendency = session.snapshot().tendency || (getApp().globalData || {}).tendency
    const profile = buildDecisionProfile(当前答案())
    this.clubs = clubs
    this.decisionProfile = profile
    if (savedTendency && options.some((item) => item.value === savedTendency)) {
      this.setData(Object.assign(
        { options, guardMessage: '' },
        构建结果(savedTendency, options, clubs, profile)
      ))
      return
    }
    session.tendency = null
    this.setData({
      options,
      tendency: '',
      confirmed: false,
      confirmText: '',
      actionCard: null,
      expectationCards: [],
      boothQuestions: [],
      reviewStandards: [],
      evidenceNotice: '',
      guardMessage: '',
      error: '',
    })
  },

  onTendencyChange(e) {
    this.setData({ tendency: e.detail.value, error: '' })
  },

  onConfirm() {
    const { tendency, options } = this.data
    if (!tendency) {
      this.setData({ error: '请先选择一项倾向' })
      return
    }
    session.tendency = tendency
    getApp().globalData.tendency = tendency
    this.setData(构建结果(
      tendency,
      options,
      this.clubs || getClubsByIds(当前候选Ids()),
      this.decisionProfile || buildDecisionProfile(当前答案())
    ))
  },

  onAdjust() {
    wx.navigateBack({ delta: 1 })
  },

  onRestart() {
    const app = getApp()
    if (typeof app.resetSession === 'function') app.resetSession()
    else session.reset()
    wx.reLaunch({ url: '/pages/index/index' })
  },
})
