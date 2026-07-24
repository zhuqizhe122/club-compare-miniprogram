const { getClubsByIds } = require('../../data/clubs.js')
const session = require('../../store/session.js')
const { generateBoothQuestions } = require('../../utils/booth-questions.js')
const { buildDecisionProfile } = require('../../utils/preference-fit.js')
const { getPath, rankClubs } = require('../../utils/scoring.js')
const { compareClubs } = require('../../utils/compare.js')
const { presentClub } = require('../../utils/club-view.js')

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
  'low-evidence': '资料待核实',
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

function 构建洞察(clubs, profile, preferredId) {
  const comparison = compareClubs(clubs)
  const ranked = rankClubs(clubs, profile)
  const hardEvaluations = ranked.reduce((all, item) => {
    if (preferredId && item.clubId !== preferredId) return all
    return all.concat(
      item.hard.evaluations.map((evaluation) => Object.assign({ clubId: item.clubId }, evaluation))
    )
  }, [])
  const unknowns = comparison.summaries.reduce((all, summary) => {
    if (preferredId && summary.clubId !== preferredId) return all
    return all.concat(
      summary.unknowns.map((unknown) => Object.assign({ clubId: summary.clubId }, unknown))
    )
  }, [])
  const stressTests = (comparison.stressTests || []).filter((item) => (
    !preferredId || item.clubId === preferredId
  ))
  return {
    comparison,
    ranked,
    questionInsights: {
      hardEvaluations,
      stressTests,
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

function normalizeTendency(value, clubs) {
  if (!value) return ''
  if (value === 'none') return 'none'
  let id = String(value)
  if (id.indexOf('club:') === 0) id = id.slice(5)
  if ((clubs || []).some((club) => club.id === id)) return id
  return ''
}

function emptyScore(club) {
  return {
    clubId: club && club.id,
    score: 0,
    preference: { dimensions: [], score: 0, confidence: 0, reasons: [], conflicts: [] },
  }
}

function emptySummary(club) {
  return { clubId: club && club.id, strengths: [], costs: [], unknowns: [] }
}

function 首选卡(club, scored, summary) {
  if (!club) {
    return {
      type: 'club',
      id: '',
      name: '未知社团',
      kicker: '主倾向预期卡',
      status: '非绑定性倾向',
      scoreText: '',
      expectations: ['请返回重新选择一个有效候选'],
      reasons: ['当前倾向对应的社团资料不可用'],
      costs: [],
      unknowns: ['需要重新选择候选后再确认'],
      reminder: '请返回比较页重新形成倾向。',
    }
  }
  const scoreCard = scored || emptyScore(club)
  const summaryCard = summary || emptySummary(club)
  const dimensions = (scoreCard.preference && scoreCard.preference.dimensions) || []
  const strengths = dimensions
    .filter((dimension) => !dimension.isUnknown && dimension.compatibility >= 75)
    .slice(0, 3)
    .map((dimension) => `${dimension.dimensionLabel}与当前偏好较接近（演示兼容度 ${dimension.compatibility}）`)
  const costs = dimensions
    .filter((dimension) => !dimension.isUnknown && dimension.compatibility <= 50)
    .slice(0, 2)
    .map((dimension) => `${dimension.dimensionLabel}可能需要主动让步`)
  ;(summaryCard.costs || []).slice(0, 2 - costs.length).forEach((item) => {
    costs.push(`${item.fieldLabel}可能带来额外投入`)
  })
  const unknowns = (summaryCard.unknowns || []).slice(0, 3).map((item) => `${item.fieldLabel}仍需核实`)
  const profile = club.decisionProfile || {}
  return {
    type: 'club',
    id: club.id,
    name: club.name,
    kicker: '主倾向预期卡',
    status: '非绑定性倾向',
    scoreText: `偏好匹配 ${scoreCard.score}/100 · 演示资料待核实`,
    expectations: [
      `常态投入暂按 ${profile.weeklyHoursTypical != null ? profile.weeklyHoursTypical : '—'} 小时/周理解，高峰期约 ${profile.weeklyHoursPeak != null ? profile.weeklyHoursPeak : '—'} 小时/周`,
      `参与方式暂按“${中文列表(profile.activityModes)}”理解`,
      `加入方式暂按“${枚举中文[profile.entryPolicy] || profile.entryPolicy || '待核实'}”理解`,
    ],
    reasons: strengths.length ? strengths : ['当前没有足够强的单项加分理由，倾向主要来自候选间相对比较'],
    costs: costs.length ? costs : ['尚未识别出明确偏好冲突，但仍需接受真实参与中的时间与协作成本'],
    unknowns: unknowns.length ? unknowns : ['本学期实际规则、活动变动和新成员职责仍需现场确认'],
    reminder: '卡片中的数值和归纳为演示资料，不是社团承诺。',
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
      '演示资料不能替代本学期真实安排',
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
  const normalized = normalizeTendency(tendency, clubs)
  const preferredId = normalized === 'none' ? '' : normalized
  const preferredClub = clubs.find((club) => club.id === preferredId)
  const answers = 当前答案()
  const hasAnswers = Object.keys(answers).length > 0
  const insights = 构建洞察(clubs, profile, preferredId || null)
  const preferredScore = preferredId
    ? (insights.ranked.find((item) => item.clubId === preferredId) || emptyScore(preferredClub))
    : null
  const summaryIndex = 摘要ById(insights.comparison)
  const actionCard = normalized === 'none'
    ? 暂缓卡(clubs)
    : 首选卡(preferredClub, preferredScore, summaryIndex[preferredId] || emptySummary(preferredClub))
  const option = options.find((item) => item.value === normalized)
  const questionLimit = hasAnswers ? 5 : 3
  const questions = generateBoothQuestions(clubs, {
    tendency: normalized,
    answers,
    decisionProfile: profile,
    insights: insights.questionInsights,
    limit: questionLimit,
  }).map((item) => Object.assign({}, item, {
    sourceText: 问题来源中文[item.source] || '现场核实',
  }))
  const questionLead = preferredClub
    ? (hasAnswers
      ? `问题围绕你最终倾向的「${preferredClub.name}」，并结合问卷里的时间、门槛与偏好提出。`
      : `问题围绕你最终倾向的「${preferredClub.name}」提出，便于现场逐项核实。`)
    : (hasAnswers
      ? '你选择了先都不加；问题结合问卷答案，帮助你继续核实当前候选。'
      : '你选择了先都不加；先带这些问题补足关键证据。')
  return {
    tendency: normalized,
    confirmed: true,
    confirmText: normalized === 'none'
      ? '当前结论：先都不加，先补足证据再决定。'
      : `当前主倾向：${option ? option.name : (preferredClub && preferredClub.name) || '已选社团'}。这不是报名，也不是最终承诺。`,
    actionCard,
    clubDetail: preferredClub ? presentClub(preferredClub) : null,
    expectationCards: [actionCard],
    boothQuestions: questions,
    questionTitle: preferredClub
      ? `针对「${preferredClub.name}」的 ${questions.length} 个现场问题`
      : `继续核实用的 ${questions.length} 个问题`,
    questionLead,
    reviewStandards: 四周复盘标准(normalized, preferredClub),
    evidenceNotice: '所有匹配、取舍和压力结论均为当前会话的决策辅助；请逐项现场核实后再做真实加入决定。',
    error: '',
    guardMessage: '',
  }
}

Page({
  data: {
    options: [],
    tendency: '',
    confirmed: false,
    confirmText: '',
    actionCard: null,
    clubDetail: null,
    expectationCards: [],
    boothQuestions: [],
    questionTitle: '',
    questionLead: '',
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
    // 使用社团 id / none，避免 radio value 含冒号时微信端取值异常
    const options = clubs.map((c) => ({
      value: c.id,
      name: c.name,
      label: `更倾向：${c.name}`,
    }))
    options.push({ value: 'none', label: '先都不加' })
    const rawTendency = session.snapshot().tendency || (getApp().globalData || {}).tendency
    const savedTendency = normalizeTendency(rawTendency, clubs)
    const profile = buildDecisionProfile(当前答案())
    this.clubs = clubs
    this.decisionProfile = profile
    if (savedTendency && options.some((item) => item.value === savedTendency)) {
      try {
        this.setData(Object.assign(
          { options, guardMessage: '' },
          构建结果(savedTendency, options, clubs, profile)
        ))
      } catch (error) {
        console.error('result restore failed', error)
        this.setData({
          options,
          tendency: savedTendency,
          confirmed: false,
          guardMessage: '',
          error: '上次结果恢复失败，请重新确认倾向',
        })
      }
      return
    }
    session.tendency = null
    this.setData({
      options,
      tendency: '',
      confirmed: false,
      confirmText: '',
      actionCard: null,
      clubDetail: null,
      expectationCards: [],
      boothQuestions: [],
      questionTitle: '',
      questionLead: '',
      reviewStandards: [],
      evidenceNotice: '',
      guardMessage: '',
      error: '',
    })
  },

  onTendencyChange(e) {
    const value = normalizeTendency(e.detail.value, this.clubs || [])
    this.setData({ tendency: value || e.detail.value, error: '' })
  },

  onPickTendency(e) {
    const value = normalizeTendency(e.currentTarget.dataset.value, this.clubs || [])
    if (!value) return
    this.setData({ tendency: value, error: '' })
  },

  onConfirm() {
    const clubs = this.clubs || getClubsByIds(当前候选Ids())
    const options = this.data.options || []
    const tendency = normalizeTendency(this.data.tendency, clubs)
    if (!tendency) {
      this.setData({ error: '请先选择一项倾向' })
      wx.showToast({ title: '请先选择一项倾向', icon: 'none' })
      return
    }
    try {
      const profile = this.decisionProfile || buildDecisionProfile(当前答案())
      const next = 构建结果(tendency, options, clubs, profile)
      session.tendency = next.tendency
      getApp().globalData.tendency = next.tendency
      this.setData(next)
      if (typeof wx.pageScrollTo === 'function') {
        wx.pageScrollTo({ scrollTop: 0, duration: 200 })
      }
    } catch (error) {
      console.error('result confirm failed', error)
      this.setData({ error: '生成行动卡失败，请重试或返回比较页' })
      wx.showToast({ title: '生成失败，请重试', icon: 'none' })
    }
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
