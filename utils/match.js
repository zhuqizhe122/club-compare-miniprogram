/**
 * 四题本地确定性匹配。无网络、无随机数、无模型调用。
 * 所有字段均来自演示数据，结果只用于缩小候选范围。
 */
const { getAllClubs } = require('../data/clubs.js')

const MATCH_QUESTIONS = [
  {
    key: 'category',
    title: '你更想体验哪类活动？',
    weight: 4,
    options: ['academic', 'arts', 'sports', 'service', 'technology', 'international', 'interest'],
  },
  {
    key: 'timeBand',
    title: '你通常何时方便？',
    weight: 3,
    options: ['weekday-evening', 'weekend', 'flexible'],
  },
  {
    key: 'intensity',
    title: '你能接受多大投入？',
    weight: 2,
    options: ['low', 'medium', 'high'],
  },
  {
    key: 'socialStyle',
    title: '你偏好怎样的互动？',
    weight: 2,
    options: ['quiet', 'collaborative', 'expressive'],
  },
]

const LABELS = {
  academic: '学术思辨',
  arts: '文化艺术',
  sports: '体育运动',
  service: '公益实践',
  technology: '科技创新',
  international: '语言与国际交流',
  interest: '兴趣生活',
  'weekday-evening': '工作日晚间',
  weekend: '周末',
  flexible: '灵活安排',
  low: '轻量投入',
  medium: '适中投入',
  high: '较高投入',
  quiet: '安静专注',
  collaborative: '团队协作',
  expressive: '表达互动',
}

function normalizeAnswers(answers) {
  if (Array.isArray(answers)) {
    return MATCH_QUESTIONS.reduce((result, question, index) => {
      result[question.key] = answers[index]
      return result
    }, {})
  }
  return answers || {}
}

function scoreClub(club, answers) {
  const normalized = normalizeAnswers(answers)
  const trace = MATCH_QUESTIONS.map((question) => {
    const expected = normalized[question.key]
    const actual = club[question.key]
    const matched = Boolean(expected) && expected === actual
    return {
      question: question.key,
      expected,
      actual,
      matched,
      points: matched ? question.weight : 0,
    }
  })
  const matchedTrace = trace.filter((item) => item.matched)
  const reasons = matchedTrace.slice(0, 3).map((item) => {
    if (item.question === 'category') return `活动方向符合“${LABELS[item.actual]}”偏好`
    if (item.question === 'timeBand') return `常见时段符合“${LABELS[item.actual]}”偏好`
    if (item.question === 'intensity') return `投入强度符合“${LABELS[item.actual]}”偏好`
    return `互动方式符合“${LABELS[item.actual]}”偏好`
  })

  if (reasons.length < 2) {
    reasons.push(`活动方向为“${club.categoryLabel}”，可作为补充候选`)
  }
  if (reasons.length < 2) {
    reasons.push(`原型估计投入为“${LABELS[club.intensity]}”，需现场确认`)
  }

  return {
    club,
    score: trace.reduce((sum, item) => sum + item.points, 0),
    reasons: reasons.slice(0, 3),
    trace,
    dataStatus: club.dataStatus,
  }
}

function matchClubs(answers, sourceClubs) {
  const source = Array.isArray(sourceClubs) ? sourceClubs : getAllClubs()
  return source
    .map((club, index) => {
      const result = scoreClub(club, answers)
      result.sourceIndex = index
      return result
    })
    .sort((left, right) => right.score - left.score || left.sourceIndex - right.sourceIndex)
    .slice(0, 6)
    .map((result) => {
      delete result.sourceIndex
      return result
    })
}

module.exports = {
  MATCH_QUESTIONS,
  LABELS,
  scoreClub,
  matchClubs,
}
