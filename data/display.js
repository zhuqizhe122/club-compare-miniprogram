const STRUCTURED_LABELS = {
  'weekday-evening': '工作日晚间',
  weekend: '周末为主',
  flexible: '灵活安排',
  low: '轻量投入',
  medium: '适中投入',
  high: '较高投入',
  quiet: '安静专注',
  collaborative: '团队协作',
  expressive: '表达互动',
  beginner: '零基础可尝试',
  guided: '建议跟随指导入门',
  casual: '灵活参与',
  regular: '需要稳定出席',
  project: '项目期投入增加',
}

function displayField(value) {
  if (value === null || value === undefined || String(value).trim() === '') return '未提供'
  return value
}

function displayStructured(value) {
  return STRUCTURED_LABELS[value] || displayField(value)
}

function getExpectationCards(selected) {
  return (Array.isArray(selected) ? selected : []).map((club) => ({
    id: club.id,
    name: club.name,
    title: '加入前预期',
    expectations: [
      `投入：${displayField(club.weeklyHours)}，${displayStructured(club.commitment)}`,
      `互动：${displayStructured(club.socialStyle)}；入门：${displayStructured(club.skillBarrier)}`,
      `时段：${displayStructured(club.timeBand)}`,
    ],
    status: club.dataStatus,
    reminder: '以上为演示级推测，请在招新摊位逐项确认。',
  }))
}

module.exports = {
  STRUCTURED_LABELS,
  displayField,
  displayStructured,
  getExpectationCards,
}
