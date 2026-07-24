const LABELS = {
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
  flexible: '灵活安排',
  high: '高弹性',
  medium: '中等弹性',
  low: '低弹性',
  regular: '需要稳定出席',
  'peak-based': '高峰期加码',
  steady: '稳定投入',
  open: '开放加入',
  guided: '建议在指导下入门',
  occasional: '偶尔需要',
  rare: '通常不需要',
}

function text(value) {
  return LABELS[value] || value || '待核实'
}

function list(values) {
  return (values || []).map(text).join('、') || '待核实'
}

function makeBar(label, level, note) {
  return { label, level, value: Number(level) * 25, note: `${level}/4 · ${note}` }
}

function presentClub(club) {
  if (!club) return null
  const profile = club.decisionProfile || {}
  return Object.assign({}, club, {
    images: Array.isArray(club.images) && club.images.length
      ? club.images
      : [
        { src: '', caption: '活动现场示意（占位）', isPlaceholder: true },
        { src: '', caption: '日常活动示意（占位）', isPlaceholder: true },
        { src: '', caption: '成果展示示意（占位）', isPlaceholder: true },
      ],
    normalHours: `${profile.weeklyHoursTypical != null ? profile.weeklyHoursTypical : '—'} 小时/周`,
    peakHours: `${profile.weeklyHoursPeak != null ? profile.weeklyHoursPeak : '—'} 小时/周`,
    slotsText: list(profile.requiredTimeSlots),
    modesText: list(profile.activityModes),
    benefitsText: list(profile.goalBenefits),
    flexibilityText: text(profile.scheduleFlexibility),
    attendanceText: text(profile.attendancePolicy),
    commitmentText: text(profile.commitmentPattern),
    entryText: text(profile.entryPolicy),
    selectionText: profile.selectionRequired ? '推测需要试训、试音或选拔' : '推测无需选拔',
    costText: `0～${profile.semesterCostMax != null ? profile.semesterCostMax : '—'} 元/学期`,
    equipmentText: (profile.equipmentRequired || []).length
      ? profile.equipmentRequired.join('；')
      : '未列出必需器材，仍需现场确认',
    offCampusText: text(profile.offCampusFrequency),
    bars: [
      makeBar('公开表达', profile.publicExpressionLevel || 1, '越高越常需要展示或发言'),
      makeBar('团队协作', profile.collaborationLevel || 1, '越高越依赖共同配合'),
      makeBar('比赛对抗', profile.competitionLevel || 1, '越高竞技或对抗越多'),
      makeBar('成员自主', profile.autonomyLevel || 1, '越高越可自主安排参与'),
      makeBar('身体强度', profile.physicalIntensityLevel || 1, '越高体能负荷越大'),
    ],
  })
}

module.exports = {
  LABELS,
  presentClub,
}
