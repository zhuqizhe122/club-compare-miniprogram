const {
  getClubsByIds,
  getDifferenceSummary,
} = require('../data/clubs.js')

const REQUIRED_CONFIRM_FIELDS = [
  { key: 'weeklyHours', label: '每周实际投入' },
  { key: 'frequency', label: '活动频率' },
  { key: 'memberRole', label: '普通成员职责' },
  { key: 'skillBarrier', label: '零基础要求' },
]

function resolveClubs(selected) {
  if (!Array.isArray(selected)) return []
  if (selected.length > 0 && typeof selected[0] === 'object') return selected
  return getClubsByIds(selected)
}

function isMissing(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

function addUnique(result, item) {
  if (result.length >= 3) return
  if (!result.some((existing) => existing.question === item.question)) result.push(item)
}

/**
 * 根据资料缺失、候选差异和用户倾向，生成最多三条现场追问。
 * 返回 source/field 供页面解释“为什么问这题”。
 */
function generateBoothQuestions(selected, options) {
  const clubs = resolveClubs(selected)
  const settings = options || {}
  const result = []

  clubs.some((club) => {
    let found = false
    REQUIRED_CONFIRM_FIELDS.forEach((field) => {
      if (!found && isMissing(club[field.key])) {
        addUnique(result, {
          source: 'missing',
          clubId: club.id,
          field: field.key,
          question: `请问${club.name}的${field.label}目前怎样？`,
        })
        found = true
      }
    })
    return found
  })

  const differences = getDifferenceSummary(clubs)
  differences.slice(0, 1).forEach((difference) => {
    const names = clubs.map((club) => club.name).join('、')
    addUnique(result, {
      source: 'difference',
      field: difference.field,
      question: `这几项原型资料在“${difference.label}”上不同；${names}的实际情况分别是什么？`,
    })
  })

  let tendency = settings.tendency || ''
  if (tendency.indexOf('club:') === 0) tendency = tendency.slice(5)
  const preferred = clubs.filter((club) => club.id === tendency)[0]
  if (preferred) {
    addUnique(result, {
      source: 'tendency',
      clubId: preferred.id,
      field: 'commitment',
      question: `我目前更倾向${preferred.name}；新成员最容易低估的长期投入或职责是什么？`,
    })
  } else if (settings.preference && settings.preference.socialStyle) {
    addUnique(result, {
      source: 'preference',
      field: 'socialStyle',
      question: '我很在意日常互动方式；普通活动中独立参与和团队协作各占多少？',
    })
  }

  clubs.filter((club) => club.dataStatus === '待社团确认').forEach((club) => {
    addUnique(result, {
      source: 'unconfirmed',
      clubId: club.id,
      field: 'dataStatus',
      question: `${club.name}的时间、门槛和成员职责均为原型估计，哪些与本学期实际安排不同？`,
    })
  })

  const primary = clubs[0]
  if (primary) {
    addUnique(result, {
      source: 'baseline',
      clubId: primary.id,
      field: 'memberRole',
      question: `${primary.name}的新成员前四周通常会实际参与哪些活动或任务？`,
    })
    addUnique(result, {
      source: 'baseline',
      clubId: primary.id,
      field: 'weeklyHours',
      question: `${primary.name}所说的每周投入，是否已经包含活动筹备和大型活动周？`,
    })
    addUnique(result, {
      source: 'baseline',
      clubId: primary.id,
      field: 'commitment',
      question: `如果课业临时变忙，${primary.name}是否允许请假或降低一段时间的参与强度？`,
    })
  }

  return result.slice(0, 3)
}

module.exports = {
  generateBoothQuestions,
}
