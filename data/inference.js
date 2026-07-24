const { DECISION_FIELDS, makeInferredEvidence } = require('./schema.js')

const ACTIVE = /训练|运动|球|舞|轮滑|滑雪|游泳|健身|瑜伽|剑道|跆拳道/
const EXPRESSIVE = /表达|演出|表演|舞台|辩论|讲师|配音|说唱|戏剧|相声/
const COMPETITIVE = /比赛|竞赛|对抗|辩论|球|裁判/
const OFF_CAMPUS = /出行|户外|田野|乡村|冰场|球场|外拍|观测|水上/
const EQUIPMENT = /器材|装备|护具|乐器|球拍|个人用品|用具/

function parseHours(text) {
  const values = String(text || '').match(/\d+/g)
  const numbers = (values || []).map(Number)
  if (!numbers.length) return { min: 1, typical: 2, peak: 3 }
  const min = numbers[0]
  const typical = numbers.length > 1 ? Math.round((numbers[0] + numbers[1]) / 2) : numbers[0]
  const peak = Math.max(typical, numbers[numbers.length - 1]) + (/增加|更高|集中/.test(text) ? 2 : 0)
  return { min, typical, peak }
}

function unique(values) {
  return values.filter((value, index) => values.indexOf(value) === index)
}

function inferDecisionProfile(club) {
  const allText = [club.name, club.tagline, club.frequency, club.memberRole, club.vibe].join(' ')
  const hours = parseHours(club.weeklyHours)
  const active = ACTIVE.test(allText)
  const expressive = EXPRESSIVE.test(allText)
  const competitive = COMPETITIVE.test(allText)
  const offCampus = OFF_CAMPUS.test(allText)
  const project = /项目|筹备|作品|调研|实践/.test(allText)
  const service = /公益|服务|关怀|援助/.test(allText)
  const activityModes = unique([
    active ? 'practice' : 'discussion',
    project ? 'project' : null,
    expressive ? 'performance' : null,
    competitive ? 'competition' : null,
    service ? 'service' : null,
  ].filter(Boolean))
  const requiredTimeSlots = club.timeBand === 'weekend'
    ? ['weekend-day']
    : (club.timeBand === 'weekday-evening' ? ['weekday-evening'] : ['flexible'])
  const goalBenefits = unique([
    project ? 'portfolio' : 'skill',
    service ? 'service' : null,
    competitive ? 'competition' : null,
    /协作|团队|交流|互动|同伴|互助/.test(allText) ? 'friendship' : null,
    /组织|负责|执行|筹备/.test(allText) ? 'leadership' : null,
  ].filter(Boolean))

  return {
    activityDomains: [club.category],
    activityModes,
    goalBenefits,
    weeklyHoursMin: hours.min,
    weeklyHoursTypical: hours.typical,
    weeklyHoursPeak: hours.peak,
    requiredTimeSlots,
    scheduleFlexibility: club.timeBand === 'flexible' ? 'high' : (offCampus ? 'low' : 'medium'),
    attendancePolicy: /排班|必须|训练2次|每周/.test(allText) ? 'regular' : 'flexible',
    commitmentPattern: /项目|比赛|演出|赛事|实践/.test(allText) ? 'peak-based' : 'steady',
    entryPolicy: club.skillBarrier === 'guided' ? 'guided' : 'open',
    selectionRequired: expressive || competitive ? true : false,
    semesterCostMin: 0,
    semesterCostMax: (offCampus || EQUIPMENT.test(allText)) ? 300 : 100,
    equipmentRequired: EQUIPMENT.test(allText) ? ['活动相关个人器材（具体清单待核实）'] : [],
    offCampusFrequency: offCampus ? 'occasional' : 'rare',
    publicExpressionLevel: expressive ? 4 : (/分享|讨论|交流/.test(allText) ? 2 : 1),
    collaborationLevel: /团队|协作|配合|合练|小组|同伴|搭档/.test(allText) ? 4 : 2,
    competitionLevel: competitive ? 4 : 1,
    autonomyLevel: /自主|灵活|量力/.test(allText) ? 4 : (project ? 3 : 2),
    physicalIntensityLevel: active ? (/体能|对抗|训练2次/.test(allText) ? 4 : 3) : 0,
    typicalGroupSize: /团队|合练|比赛|演出|小组/.test(allText) ? 12 : 8,
  }
}

function attachDecisionData(club) {
  const profile = inferDecisionProfile(club)
  profile.categories = profile.activityDomains
  profile.interestTags = club.tags
  profile.searchAliases = club.searchAliases
  profile.growthGoals = profile.goalBenefits
  profile.schedule = {
    typicalWindows: profile.requiredTimeSlots,
    fixedWindows: profile.requiredTimeSlots,
    noticeDays: null,
  }
  profile.commitment = {
    weeklyHoursMin: profile.weeklyHoursMin,
    weeklyHoursMax: profile.weeklyHoursTypical,
    mandatoryAttendance: profile.attendancePolicy === 'regular' ? 'some' : 'none',
    allowedAbsences: null,
    peakPeriods: profile.commitmentPattern === 'peak-based' ? ['项目或活动高峰期'] : [],
    peakHoursMax: profile.weeklyHoursPeak,
    duration: profile.commitmentPattern === 'peak-based' ? 'term' : 'flexible',
  }
  profile.cost = {
    feeCnyMin: profile.semesterCostMin,
    feeCnyMax: profile.semesterCostMax,
    extraCostNote: profile.equipmentRequired.length ? profile.equipmentRequired.join('；') : null,
  }
  profile.location = {
    campusAreas: null,
    offCampusRequired: profile.offCampusFrequency !== 'rare',
  }
  profile.entry = {
    skillBarrier: club.skillBarrier,
    selectionRequired: profile.selectionRequired,
    deadline: null,
    equipmentRequired: profile.equipmentRequired,
  }
  profile.accessibility = { notes: null }
  profile.socialStyle = [club.socialStyle]
  profile.structureLevel = profile.attendancePolicy === 'regular' ? 'structured' : 'balanced'

  const evidence = {}
  DECISION_FIELDS.forEach((field) => {
    const path = `decisionProfile.${field}`
    evidence[path] = [makeInferredEvidence(club.id, path)]
  })
  return Object.assign({}, club, { decisionProfile: profile, evidence })
}

module.exports = {
  attachDecisionData,
  inferDecisionProfile,
  parseHours,
}
