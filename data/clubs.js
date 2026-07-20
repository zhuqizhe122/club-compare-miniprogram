/**
 * 本地样例社团（假数据）。无后端、无 AI。
 */
const clubs = [
  {
    id: 'anime',
    name: '动漫社',
    tagline: '一起追番、做展板的松散社团',
    weeklyHours: '约 2 小时',
    frequency: '双周一次社团夜',
    memberRole: '一起追番、做展板',
    vibe: '松散社交',
  },
  {
    id: 'volunteer',
    name: '志愿者协会',
    tagline: '组织志愿活动，需要可靠到场',
    weeklyHours: '约 5 小时',
    frequency: '每月一次大型志愿',
    memberRole: '搬物资、现场指引',
    vibe: '任务导向',
  },
  {
    id: 'basketball',
    name: '篮球社',
    tagline: '每周训练，偏竞技氛围',
    weeklyHours: '约 4 小时',
    frequency: '每周训练',
    memberRole: '打球、轮值器材',
    vibe: '竞技训练',
  },
  {
    id: 'photo',
    name: '摄影协会',
    tagline: '外拍与后期分享为主',
    weeklyHours: '约 3 小时',
    frequency: '隔周外拍',
    memberRole: '跟拍活动、整理成片',
    vibe: '创作协作',
  },
  {
    id: 'debate',
    name: '辩论队',
    tagline: '高强度准备与比赛',
    weeklyHours: '', // 演示缺项 →「未提供」
    frequency: '赛前集训密集',
    memberRole: '写稿、对练、担任评委助理',
    vibe: '竞争思辨',
  },
]

function getAllClubs() {
  return clubs
}

function getClubsByIds(ids) {
  const set = {}
  ;(ids || []).forEach((id) => {
    set[id] = true
  })
  return clubs.filter((c) => set[c.id])
}

function displayField(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return '未提供'
  }
  return value
}

module.exports = {
  getAllClubs,
  getClubsByIds,
  displayField,
}
