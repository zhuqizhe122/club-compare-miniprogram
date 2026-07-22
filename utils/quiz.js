const { getAllClubs } = require('../data/clubs.js')
const { questions, clubDomains, domainLabels } = require('../data/quiz.js')

const traitLabels = {
  time: '可投入时间接近',
  physical: '活动强度偏好接近',
  collaboration: '协作方式接近',
  expression: '表达参与方式接近',
  practice: '活动方式接近',
  competition: '挑战程度偏好接近',
  structure: '活动节奏偏好接近',
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.indexOf(keyword) >= 0)
}

function findOption(question, optionId) {
  return question.options.find((option) => option.id === optionId)
}

function buildPreferences(answers) {
  const preferences = {}
  for (let i = 0; i < questions.length; i += 1) {
    const question = questions[i]
    const option = findOption(question, answers && answers[question.id])
    if (!option) return null
    preferences[question.dimension] = option.value
  }
  return preferences
}

function areAnswersComplete(answers) {
  return !!buildPreferences(answers)
}

function getTimeLevel(weeklyHours) {
  const numbers = String(weeklyHours).match(/\d+/g) || []
  const maxHours = numbers.reduce((max, value) => Math.max(max, Number(value)), 0)
  if (maxHours >= 4) return 3
  if (maxHours >= 3 || String(weeklyHours).indexOf('更高') >= 0) return 2
  return 1
}

function buildClubProfile(club) {
  const domains = clubDomains[club.id] || []
  const text = [club.name, club.tagline, club.frequency, club.memberRole, club.vibe].join('')
  const isSportOrOutdoor = domains.indexOf('sports') >= 0 || domains[0] === 'outdoor'
  const physical = isSportOrOutdoor
    ? 3
    : includesAny(text, ['舞蹈', '舞步', '体能', '外拍', '营造', '出行'])
      ? 2
      : 1
  const collaboration = includesAny(text, [
    '团队', '协作', '配合', '小组', '集体', '合排', '合练', '合奏', '搭档', '分组', '值班', '服务',
  ])
    ? 3
    : includesAny(text, ['自主', '个人', '阅读', '赏析', '临帖', '聆听'])
      ? 1
      : 2
  const expression = includesAny(text, [
    '舞台', '演出', '表演', '演讲', '试讲', '辩论', '说唱', '配音', '主持', '戏剧', '展示',
  ])
    ? 3
    : includesAny(text, ['讨论', '分享', '交流', '研讨', '互评', '汇报', '语言角'])
      ? 2
      : 1
  const practice = includesAny(text, [
    '训练', '练习', '制作', '开发', '实践', '服务', '调研', '照护', '排练', '比赛', '手作', '搭建', '外拍', '出行',
  ])
    ? 3
    : includesAny(text, ['体验', '游戏', '创作', '项目'])
      ? 2
      : 1
  const competition = includesAny(text, ['比赛', '竞技', '对抗', '赛前', '竞赛'])
    ? 3
    : isSportOrOutdoor || includesAny(text, ['挑战', '切磋', '提升'])
      ? 2
      : 1
  const structure = includesAny(text, ['每周训练2次', '固定', '值班', '项目期', '赛前', '演出前', '纪律', '责任'])
    ? 3
    : includesAny(text, ['每周', '双周', '定期'])
      ? 2
      : 1

  return {
    domains,
    time: getTimeLevel(club.weeklyHours),
    physical,
    collaboration,
    expression,
    practice,
    competition,
    structure,
  }
}

function traitScore(actual, preferred) {
  return 6 - Math.abs(actual - preferred) * 2
}

function buildReasons(profile, preferences) {
  const reasons = []
  const domainIndex = profile.domains.indexOf(preferences.domain)
  if (domainIndex >= 0) {
    reasons.push(`符合你对“${domainLabels[preferences.domain]}”的兴趣`)
  }

  const traits = Object.keys(traitLabels).map((key, index) => ({
    key,
    difference: Math.abs(profile[key] - preferences[key]),
    index,
  }))
  traits.sort((a, b) => a.difference - b.difference || a.index - b.index)
  for (let i = 0; i < traits.length && reasons.length < 3; i += 1) {
    if (traits[i].difference <= 1) reasons.push(traitLabels[traits[i].key])
  }
  return reasons.slice(0, 3)
}

function rankClubs(answers, limit) {
  const preferences = buildPreferences(answers)
  if (!preferences) return []

  const clubs = getAllClubs()
  const ranked = clubs.map((club, index) => {
    const profile = buildClubProfile(club)
    const domainIndex = profile.domains.indexOf(preferences.domain)
    const domainScore = domainIndex === 0 ? 32 : domainIndex > 0 ? 26 : 0
    const score = Object.keys(traitLabels).reduce(
      (total, key) => total + traitScore(profile[key], preferences[key]),
      domainScore,
    )
    return {
      club,
      score,
      reasons: buildReasons(profile, preferences),
      sourceIndex: index,
    }
  })

  ranked.sort((a, b) => b.score - a.score || a.sourceIndex - b.sourceIndex)
  return ranked.slice(0, limit || 3).map((item) => ({
    clubId: item.club.id,
    club: item.club,
    score: item.score,
    reasons: item.reasons,
  }))
}

module.exports = {
  areAnswersComplete,
  buildPreferences,
  buildClubProfile,
  rankClubs,
}
