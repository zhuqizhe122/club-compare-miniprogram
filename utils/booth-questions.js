/**
 * 现场核实问题生成（v2：主倾向 + 问卷答案驱动）。
 * 兼容旧调用名 addInsightQuestions，避免开发者工具热更新残留引用报错。
 */
const {
  getClubsByIds,
  getDifferenceSummary,
} = require('../data/clubs.js')
const { fieldLabel } = require('./labels.js')
const { getQuestion } = require('./questions.js')

const REQUIRED_CONFIRM_FIELDS = [
  { key: 'weeklyHours', label: '每周实际投入' },
  { key: 'frequency', label: '活动频率' },
  { key: 'memberRole', label: '普通成员职责' },
  { key: 'skillBarrier', label: '零基础要求' },
]

const SLOT_LABELS = {
  'weekday-evening': '工作日晚间',
  'weekend-day': '周末白天',
  'weekend-evening': '周末晚间',
  flexible: '灵活时段',
}

const GROWTH_LABELS = {
  skill: '技能成长',
  portfolio: '作品或项目经历',
  service: '公益服务',
  leadership: '组织与领导练习',
  friendship: '稳定同伴关系',
  competition: '比赛与挑战',
}

const MODE_LABELS = {
  discussion: '讨论分享',
  practice: '规律练习',
  project: '项目推进',
  service: '服务行动',
  performance: '排练展示',
  competition: '训练比赛',
}

const SOCIAL_LABELS = {
  quiet: '安静专注、少量交流',
  collaborative: '和固定伙伴协作',
  expressive: '公开表达或展示',
}

function resolveClubs(selected) {
  if (!Array.isArray(selected)) return []
  if (selected.length > 0 && typeof selected[0] === 'object') return selected
  return getClubsByIds(selected)
}

function isMissing(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

function answerValue(answers, id) {
  const value = (answers || {})[id]
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value.value !== undefined) return value.value
    if (value.values !== undefined) return value.values
    if (value.selectedValues !== undefined) return value.selectedValues
  }
  return value
}

function asList(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== 'none' && item !== 'no-preference' && item !== '')
  if (value === undefined || value === null || value === '' || value === 'none' || value === 'no-preference') return []
  return [value]
}

function optionLabel(questionId, value) {
  const question = getQuestion(questionId)
  if (!question) return String(value)
  const found = (question.options || []).find((item) => String(item.value) === String(value))
  return found ? found.label : String(value)
}

function listLabels(map, values) {
  return asList(values).map((value) => map[value] || value).join('、')
}

function addUnique(result, item, limit) {
  if (result.length >= (limit || 3)) return
  if (!result.some((existing) => existing.question === item.question)) result.push(item)
}

function resolvePreferred(clubs, tendency) {
  let id = tendency || ''
  if (id.indexOf('club:') === 0) id = id.slice(5)
  if (!id || id === 'none') return null
  return clubs.find((club) => club.id === id) || null
}

function filterByClub(items, clubId) {
  return [].concat(items || []).filter((item) => {
    if (!clubId) return true
    if (!item) return false
    return !item.clubId || item.clubId === clubId
  })
}

function addHardInsightQuestions(result, clubs, insights, preferred, limit) {
  if (!insights) return
  const focusId = preferred ? preferred.id : null

  filterByClub(insights.hardEvaluations || insights.hardConstraints || [], focusId)
    .filter((item) => item && (item.result === 'UNKNOWN' || item.result === 'FAIL'))
    .forEach((item) => {
      const club = clubs.find((candidate) => candidate.id === (item.clubId || focusId)) || preferred
      addUnique(result, {
        source: item.result === 'FAIL' ? 'hard-risk' : 'hard-unknown',
        priority: 1,
        clubId: club && club.id,
        field: item.fieldPath,
        evidenceIds: item.evidenceIds || [],
        question: `${club ? club.name : '这个社团'}在“${fieldLabel(item.fieldPath)}”上的本学期实际规则是什么？能否提供明确时间或书面说明？`,
      }, limit)
    })
}

function addSoftInsightQuestions(result, clubs, insights, preferred, limit) {
  if (!insights) return
  const focusId = preferred ? preferred.id : null

  filterByClub(insights.stressTests || [], focusId)
    .filter((item) => item && (item.result === 'UNKNOWN' || item.result === 'AT_RISK'))
    .forEach((item) => {
      const club = clubs.find((candidate) => candidate.id === item.clubId) || preferred
      addUnique(result, {
        source: item.result === 'AT_RISK' ? 'stress-risk' : 'stress-unknown',
        priority: 2,
        clubId: item.clubId || (club && club.id),
        field: (item.requiredFieldPaths || [])[0],
        evidenceIds: item.evidenceIds || [],
        question: `遇到“${item.scenarioLabel || item.scenarioId || '课业压力'}”时，${club ? club.name : '社团'}允许请假、降频或调整任务吗？`,
      }, limit)
    })

  filterByClub(insights.unknowns || insights.lowConfidence || [], focusId).forEach((item) => {
    const field = typeof item === 'string' ? item : item.fieldPath
    const clubId = typeof item === 'string' ? focusId : (item.clubId || focusId)
    const club = clubs.find((candidate) => candidate.id === clubId) || preferred
    addUnique(result, {
      source: 'low-evidence',
      priority: 3,
      clubId,
      field,
      question: `${club ? club.name : '这个社团'}的“${fieldLabel(field)}”目前依据什么？本学期是否已经确认？`,
    }, limit)
  })
}

/** 保留旧名，避免开发者工具缓存仍调用 addInsightQuestions 时崩溃 */
function addInsightQuestions(result, clubs, insights, preferred, limit) {
  addHardInsightQuestions(result, clubs, insights, preferred, limit)
  addSoftInsightQuestions(result, clubs, insights, preferred, limit)
}

function addAnswerDrivenQuestions(result, club, answers, limit) {
  if (!club) return
  const name = club.name
  const hours = Number(answerValue(answers, 'core-hours'))
  if (Number.isFinite(hours)) {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.weeklyHoursTypical',
      question: `我在问卷里写每周最多大约 ${hours} 小时；${name} 本学期常态和高峰分别大概需要投入多少？是否已经包含筹备？`,
    }, limit)
  }

  const conflicts = asList(answerValue(answers, 'core-conflict'))
  if (conflicts.length) {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.requiredTimeSlots',
      question: `我绝对不能参加的时段是${listLabels(SLOT_LABELS, conflicts)}；${name} 的固定活动或训练是否会撞上这些时段？`,
    }, limit)
  }

  const timeSlots = asList(answerValue(answers, 'core-time'))
  if (timeSlots.length) {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.requiredTimeSlots',
      question: `我比较方便的时段是${listLabels(SLOT_LABELS, timeSlots)}；${name} 普通成员主要活动通常安排在什么时候？`,
    }, limit)
  }

  const entry = answerValue(answers, 'core-entry')
  if (entry && entry !== 'no-preference') {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.entryPolicy',
      question: `我问卷里选择了“${optionLabel('core-entry', entry)}”；${name} 本学期实际入门方式、是否需要试训/选拔分别是什么？`,
    }, limit)
  }

  const growth = asList(answerValue(answers, 'core-growth'))
  if (growth.length) {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.goalBenefits',
      question: `我最希望获得${listLabels(GROWTH_LABELS, growth)}；普通成员在${name}里前四周有机会接触到这些吗？`,
    }, limit)
  }

  const mode = answerValue(answers, 'core-mode')
  if (mode && mode !== 'no-preference') {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.activityModes',
      question: `我更想以“${MODE_LABELS[mode] || mode}”方式参与；${name} 普通成员日常主要在做什么？`,
    }, limit)
  }

  const social = answerValue(answers, 'adaptive-expression') !== undefined
    ? answerValue(answers, 'adaptive-expression')
    : answerValue(answers, 'core-social')
  if (social !== undefined && social !== null && social !== 'no-preference') {
    const socialText = SOCIAL_LABELS[social] || optionLabel('adaptive-expression', social) || optionLabel('core-social', social)
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.publicExpressionLevel',
      question: `关于参与方式，我倾向“${socialText}”；${name} 是否经常要求公开发言、展示或高频协作？`,
    }, limit)
  }

  const cost = Number(answerValue(answers, 'adaptive-cost'))
  if (Number.isFinite(cost) && cost < 1000) {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.semesterCostMax',
      question: `我这学期费用上限大约是 ${cost} 元；${name} 必需费用、可选费用分别大概多少？`,
    }, limit)
  }

  const offCampus = answerValue(answers, 'adaptive-off-campus')
  if (offCampus === 'never' || offCampus === 'occasional') {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.offCampusFrequency',
      question: `我就离校活动的接受度是“${optionLabel('adaptive-off-campus', offCampus)}”；${name} 本学期是否有必须离校的安排？`,
    }, limit)
  }

  const equipment = answerValue(answers, 'adaptive-equipment')
  if (equipment === 'none' || equipment === 'basic') {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.equipmentRequired',
      question: `我对自备器材的接受度是“${optionLabel('adaptive-equipment', equipment)}”；${name} 是否要求自备器材，有没有社团可借用的替代？`,
    }, limit)
  }

  const competition = answerValue(answers, 'adaptive-competition')
  if (competition !== undefined && competition !== null) {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.competitionLevel',
      question: `我对比赛对抗的期待是“${optionLabel('adaptive-competition', competition)}”；${name} 普通成员必须参赛吗，频率大概怎样？`,
    }, limit)
  }

  const autonomy = answerValue(answers, 'adaptive-autonomy')
  if (autonomy !== undefined && autonomy !== null) {
    addUnique(result, {
      source: 'preference',
      clubId: club.id,
      field: 'decisionProfile.autonomyLevel',
      question: `我希望安排灵活度接近“${optionLabel('adaptive-autonomy', autonomy)}”；${name} 对请假、任务选择和新成员自主空间有什么规则？`,
    }, limit)
  }
}

function addFallbackQuestions(result, clubs, preferred, limit) {
  const focus = preferred ? [preferred] : clubs

  focus.some((club) => {
    let found = false
    REQUIRED_CONFIRM_FIELDS.forEach((field) => {
      if (!found && isMissing(club[field.key])) {
        addUnique(result, {
          source: 'missing',
          clubId: club.id,
          field: field.key,
          question: `请问${club.name}的${field.label}目前怎样？`,
        }, limit)
        found = true
      }
    })
    return found
  })

  if (!preferred) {
    const differences = getDifferenceSummary(clubs)
    differences.slice(0, 1).forEach((difference) => {
      const names = clubs.map((club) => club.name).join('、')
      addUnique(result, {
        source: 'difference',
        field: difference.field,
        question: `这几项演示资料在“${difference.label}”上不同；${names}的实际情况分别是什么？`,
      }, limit)
    })
  }

  if (preferred) {
    addUnique(result, {
      source: 'tendency',
      clubId: preferred.id,
      field: 'commitment',
      question: `我目前更倾向${preferred.name}；新成员最容易低估的长期投入或职责是什么？`,
    }, limit)
  }

  focus.filter((club) => club.dataStatus === '待社团确认').forEach((club) => {
    addUnique(result, {
      source: 'unconfirmed',
      clubId: club.id,
      field: 'dataStatus',
      question: `${club.name}的时间、门槛和成员职责仍待确认，哪些与本学期实际安排不同？`,
    }, limit)
  })

  const primary = preferred || clubs[0]
  if (primary) {
    addUnique(result, {
      source: 'baseline',
      clubId: primary.id,
      field: 'memberRole',
      question: `${primary.name}的新成员前四周通常会实际参与哪些活动或任务？`,
    }, limit)
    addUnique(result, {
      source: 'baseline',
      clubId: primary.id,
      field: 'weeklyHours',
      question: `${primary.name}所说的每周投入，是否已经包含活动筹备和大型活动周？`,
    }, limit)
    addUnique(result, {
      source: 'baseline',
      clubId: primary.id,
      field: 'commitment',
      question: `如果课业临时变忙，${primary.name}是否允许请假或降低一段时间的参与强度？`,
    }, limit)
  }
}

/**
 * 根据主倾向、问卷答案与比较洞察，生成现场核实问题。
 * 有测评答案时最多 5 条；无答案时最多 3 条。
 * 若已确认某社团主倾向，问题只围绕该社团展开。
 */
function generateBoothQuestions(selected, options) {
  const clubs = resolveClubs(selected)
  const settings = options || {}
  const answers = settings.answers || settings.preference || {}
  const hasAnswers = Object.keys(answers || {}).length > 0
  const limit = settings.limit || (hasAnswers ? 5 : 3)
  const preferred = resolvePreferred(clubs, settings.tendency)
  const insights = settings.insights || null
  const result = []

  // 硬条件 → 问卷偏好 → 压力/未知 → 兜底
  addHardInsightQuestions(result, clubs, insights, preferred, limit)
  if (preferred) {
    addAnswerDrivenQuestions(result, preferred, answers, limit)
  } else if (hasAnswers) {
    clubs.slice(0, 2).forEach((club) => addAnswerDrivenQuestions(result, club, answers, limit))
  }
  addSoftInsightQuestions(result, clubs, insights, preferred, limit)
  addFallbackQuestions(result, clubs, preferred, limit)

  return result.slice(0, limit)
}

module.exports = {
  generateBoothQuestions,
  addInsightQuestions,
  addHardInsightQuestions,
  addSoftInsightQuestions,
}
