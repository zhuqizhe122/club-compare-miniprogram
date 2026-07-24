/**
 * ≥10 题问卷 + 规则匹配（非 LLM）。
 */
const { inferTags } = require('./infer-tags.js')

const QUESTIONS = [
  {
    id: 'time',
    title: '你每周大概能投入多少时间？',
    options: [
      { id: 'low', label: '大约 2 小时以内', tags: ['low_time'], reason: '时间投入较轻' },
      { id: 'mid', label: '大约 2～4 小时', tags: ['mid_time', 'low_time'], reason: '中等时间投入' },
      { id: 'high', label: '可以 4 小时以上', tags: ['high_time', 'mid_time'], reason: '可接受较高投入' },
    ],
  },
  {
    id: 'intensity',
    title: '你更能接受哪种参与强度？',
    options: [
      { id: 'loose', label: '松散，偶尔缺席影响小', tags: ['loose'], reason: '节奏偏松散' },
      { id: 'steady', label: '稳定例会/训练，需基本到场', tags: ['steady'], reason: '需要稳定到场' },
      { id: 'intense', label: '项目/赛前会明显加压', tags: ['intense', 'steady'], reason: '能接受阶段性高压' },
    ],
  },
  {
    id: 'vibe',
    title: '你更想要的氛围是？',
    options: [
      { id: 'quiet', label: '安静、偏个人沉淀', tags: ['quiet'], reason: '氛围偏安静' },
      { id: 'expressive', label: '表达输出、互评展示', tags: ['expressive'], reason: '偏表达输出' },
      { id: 'competitive', label: '竞技/对抗、比拼感', tags: ['competitive'], reason: '偏竞技对抗' },
    ],
  },
  {
    id: 'domain',
    title: '你更想参与哪类内容？（主兴趣）',
    options: [
      { id: 'theory', label: '理论学习 / 思辨研讨', tags: ['theory'], reason: '偏理论思辨' },
      { id: 'sport', label: '运动健身', tags: ['sport'], reason: '偏运动' },
      { id: 'arts', label: '文艺赏析 / 技艺练习', tags: ['arts'], reason: '偏文艺技艺' },
      { id: 'service', label: '公益服务', tags: ['service'], reason: '偏公益服务' },
      { id: 'culture', label: '语言 / 跨文化交流', tags: ['culture'], reason: '偏文化交流' },
      { id: 'tech', label: '科技 / 编程实践', tags: ['tech'], reason: '偏技术实践' },
    ],
  },
  {
    id: 'domain2',
    title: '如果还有第二兴趣，更接近？',
    options: [
      { id: 'none', label: '没有特别的第二兴趣', tags: [], reason: '' },
      { id: 'theory', label: '理论 / 思辨', tags: ['theory'], reason: '兼顾理论' },
      { id: 'sport', label: '运动', tags: ['sport'], reason: '兼顾运动' },
      { id: 'arts', label: '文艺', tags: ['arts'], reason: '兼顾文艺' },
      { id: 'service', label: '公益', tags: ['service'], reason: '兼顾公益' },
      { id: 'culture', label: '文化交流', tags: ['culture'], reason: '兼顾交流' },
      { id: 'tech', label: '科技', tags: ['tech'], reason: '兼顾技术' },
    ],
  },
  {
    id: 'social',
    title: '你更希望通过社团获得什么社交体验？',
    options: [
      { id: 'few', label: '小圈子、深度交流即可', tags: ['quiet'], reason: '适合小圈子深度交流' },
      { id: 'team', label: '稳定团队协作', tags: ['steady', 'expressive'], reason: '适合团队协作' },
      { id: 'broad', label: '认识更多新朋友', tags: ['loose', 'culture'], reason: '适合拓展交际' },
    ],
  },
  {
    id: 'output',
    title: '你是否愿意有「作品/表演/比赛」类输出？',
    options: [
      { id: 'no', label: '更想轻松参与，不强求输出', tags: ['loose', 'quiet'], reason: '参与门槛偏低' },
      { id: 'some', label: '可以有阶段性小成果', tags: ['steady', 'expressive'], reason: '有适度成果要求' },
      { id: 'yes', label: '很想比赛、演出或作品展示', tags: ['expressive', 'competitive', 'intense'], reason: '强调展示与竞技' },
    ],
  },
  {
    id: 'schedule',
    title: '你的课业安排灵活度如何？',
    options: [
      { id: 'tight', label: '课业较满，社团要可预期', tags: ['low_time', 'loose'], reason: '需要可预期、低负担' },
      { id: 'ok', label: '一般，能保证每周固定时段', tags: ['mid_time', 'steady'], reason: '能配合固定安排' },
      { id: 'flex', label: '较灵活，忙时也能加投入', tags: ['high_time', 'intense'], reason: '忙时也能加码' },
    ],
  },
  {
    id: 'risk',
    title: '面对「值班/轮值/请假规则」你的态度？',
    options: [
      { id: 'avoid', label: '尽量少硬性值班', tags: ['loose'], reason: '避免硬性排班' },
      { id: 'ok', label: '可以接受合理轮值', tags: ['steady', 'service'], reason: '可接受轮值责任' },
      { id: 'fine', label: '责任到人没问题', tags: ['steady', 'service', 'intense'], reason: '接受明确责任' },
    ],
  },
  {
    id: 'learning',
    title: '你更想「学知识」还是「动手练」？',
    options: [
      { id: 'learn', label: '阅读讨论、听赏析为主', tags: ['theory', 'quiet', 'arts'], reason: '偏学习讨论' },
      { id: 'both', label: '学练结合', tags: ['steady', 'mid_time'], reason: '学练结合' },
      { id: 'do', label: '训练、排练、项目实操为主', tags: ['sport', 'tech', 'expressive', 'intense'], reason: '偏动手实操' },
    ],
  },
  {
    id: 'outdoor',
    title: '活动形态上你更偏好？',
    options: [
      { id: 'indoor', label: '室内、校园内为主', tags: ['quiet', 'theory', 'arts'], reason: '偏室内活动' },
      { id: 'mix', label: '室内外都可', tags: ['mid_time', 'steady'], reason: '形态较综合' },
      { id: 'out', label: '更想户外/出行类', tags: ['sport', 'service'], reason: '偏户外出行' },
    ],
  },
  {
    id: 'fresh',
    title: '作为新人，你更希望？',
    options: [
      { id: 'easy', label: '低门槛先体验，再决定深浅', tags: ['loose', 'low_time'], reason: '新人体验友好' },
      { id: 'guide', label: '有带教/系统入门', tags: ['steady', 'mid_time'], reason: '有系统入门' },
      { id: 'challenge', label: '尽快进入正式训练或项目', tags: ['intense', 'high_time', 'competitive'], reason: '希望快速进入正式节奏' },
    ],
  },
]

function getQuestions() {
  return QUESTIONS
}

function matchClubs(answers, clubs) {
  const weight = {}

  QUESTIONS.forEach((q) => {
    const optId = answers && answers[q.id]
    const opt = (q.options || []).find((o) => o.id === optId)
    if (!opt) return
    ;(opt.tags || []).forEach((t, i) => {
      weight[t] = (weight[t] || 0) + (i === 0 ? 3 : 1)
    })
  })

  const scored = (clubs || []).map((c) => {
    const tags = inferTags(c)
    let score = 0
    const hitReasons = []
    tags.forEach((t) => {
      if (weight[t]) score += weight[t]
    })
    QUESTIONS.forEach((q) => {
      const optId = answers && answers[q.id]
      const opt = (q.options || []).find((o) => o.id === optId)
      if (!opt || !opt.reason) return
      const hit = (opt.tags || []).some((t) => tags.indexOf(t) !== -1)
      if (hit) hitReasons.push(opt.reason)
    })
    const unique = []
    hitReasons.forEach((r) => {
      if (r && unique.indexOf(r) === -1) unique.push(r)
    })
    return {
      id: c.id,
      name: c.name,
      tagline: c.tagline,
      score,
      reason:
        unique.length > 0
          ? `匹配：${unique.slice(0, 3).join('；')}`
          : '综合匹配一般，可点开详情自行判断',
    }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return String(a.name).localeCompare(String(b.name), 'zh')
  })

  let top = scored.filter((s) => s.score > 0).slice(0, 8)
  if (top.length < 3) top = scored.slice(0, Math.min(8, scored.length))

  return { clubIds: top.map((t) => t.id), items: top }
}

module.exports = { getQuestions, matchClubs }
