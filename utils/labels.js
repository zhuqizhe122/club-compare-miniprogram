const DIMENSION_LABELS = {
  interest: '活动兴趣',
  schedule: '可用时段',
  commitment: '时间投入',
  social: '互动与表达',
  growth: '成长目标',
  mode: '参与方式',
  competition: '竞技偏好',
  autonomy: '自主程度',
}

const FIELD_LABELS = {
  'decisionProfile.activityDomains': '活动方向',
  'decisionProfile.activityModes': '参与方式',
  'decisionProfile.goalBenefits': '成长收益',
  'decisionProfile.weeklyHoursMin': '每周最低投入',
  'decisionProfile.weeklyHoursTypical': '每周常态投入',
  'decisionProfile.weeklyHoursPeak': '高峰期投入',
  'decisionProfile.requiredTimeSlots': '必须参加时段',
  'decisionProfile.scheduleFlexibility': '时间调整弹性',
  'decisionProfile.attendancePolicy': '出席要求',
  'decisionProfile.commitmentPattern': '投入模式',
  'decisionProfile.entryPolicy': '入门方式',
  'decisionProfile.selectionRequired': '是否需要选拔',
  'decisionProfile.semesterCostMax': '学期必要费用上限',
  'decisionProfile.equipmentRequired': '必需器材',
  'decisionProfile.offCampusFrequency': '校外活动频率',
  'decisionProfile.publicExpressionLevel': '公开表达程度',
  'decisionProfile.collaborationLevel': '团队协作程度',
  'decisionProfile.competitionLevel': '比赛与对抗程度',
  'decisionProfile.autonomyLevel': '成员自主程度',
  'decisionProfile.physicalIntensityLevel': '身体活动强度',
  'decisionProfile.typicalGroupSize': '典型活动人数',
}

const SCENARIO_LABELS = {
  busy: '课业繁忙：可用时间减半',
  deep: '深度投入：任务临时加码',
  social: '社交中断：连续两次无法参加',
}

function dimensionLabel(dimension) {
  return DIMENSION_LABELS[dimension] || '其他偏好'
}

function fieldLabel(fieldPath) {
  return FIELD_LABELS[fieldPath] || '待核实信息'
}

function scenarioLabel(scenarioId) {
  return SCENARIO_LABELS[scenarioId] || '自定义压力情境'
}

module.exports = {
  DIMENSION_LABELS,
  FIELD_LABELS,
  SCENARIO_LABELS,
  dimensionLabel,
  fieldLabel,
  scenarioLabel,
}
