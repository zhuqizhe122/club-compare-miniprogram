function option(value, label, description) {
  return { value, label, description: description || '' }
}

const CORE_QUESTIONS = [
  {
    id: 'core-interest',
    order: 1,
    core: true,
    dimension: 'interest',
    prompt: '你最想把课余时间花在哪类活动上？',
    options: [
      option('academic', '学术讨论与知识探索'), option('arts', '文化艺术与创作'),
      option('sports', '体育锻炼与运动'), option('service', '公益服务与社会实践'),
      option('technology', '科技创新与项目'), option('international', '语言与国际交流'),
      option('interest', '轻松兴趣与生活体验'), option('no-preference', '暂时没有明确偏好'),
    ],
  },
  {
    id: 'core-time',
    order: 2,
    core: true,
    dimension: 'schedule',
    prompt: '哪些时段通常适合你参加社团？',
    multiple: true,
    options: [
      option('weekday-evening', '工作日晚间'), option('weekend-day', '周末白天'),
      option('weekend-evening', '周末晚间'), option('flexible', '时间比较灵活'),
    ],
  },
  {
    id: 'core-hours',
    order: 3,
    core: true,
    dimension: 'commitment',
    hardConstraint: true,
    prompt: '平常一周最多能稳定投入多少小时？',
    options: [option(2, '最多 2 小时'), option(4, '最多 4 小时'), option(6, '最多 6 小时'), option(10, '6 小时以上')],
  },
  {
    id: 'core-conflict',
    order: 4,
    core: true,
    dimension: 'schedule',
    hardConstraint: true,
    prompt: '有没有绝对不能参加的时段？',
    multiple: true,
    options: [
      option('weekday-evening', '工作日晚间不能参加'), option('weekend-day', '周末白天不能参加'),
      option('weekend-evening', '周末晚间不能参加'), option('none', '没有固定冲突'),
    ],
  },
  {
    id: 'core-social',
    order: 5,
    core: true,
    dimension: 'social',
    prompt: '你更喜欢怎样参与活动？',
    options: [
      option('quiet', '安静专注，少量交流'), option('collaborative', '和固定伙伴协作'),
      option('expressive', '公开表达或展示'), option('no-preference', '都可以'),
    ],
  },
  {
    id: 'core-growth',
    order: 6,
    core: true,
    dimension: 'growth',
    prompt: '你最希望从社团获得什么？',
    multiple: true,
    options: [
      option('skill', '学会一项技能'), option('portfolio', '做出作品或项目'),
      option('service', '参与公益服务'), option('leadership', '练习组织与领导'),
      option('friendship', '认识稳定的伙伴'), option('competition', '参加比赛与挑战'),
    ],
  },
  {
    id: 'core-mode',
    order: 7,
    core: true,
    dimension: 'mode',
    prompt: '你更愿意以哪种方式长期参与？',
    options: [
      option('discussion', '讨论和分享'), option('practice', '规律练习'),
      option('project', '完成一个项目'), option('service', '参加服务行动'),
      option('performance', '排练和展示'), option('competition', '训练和比赛'),
      option('no-preference', '暂时没有偏好'),
    ],
  },
  {
    id: 'core-entry',
    order: 8,
    core: true,
    dimension: 'entry',
    hardConstraint: true,
    prompt: '对于入门门槛，你能接受哪种情况？',
    options: [
      option('open-only', '只考虑零基础可直接加入'), option('guided-ok', '有指导即可'),
      option('selection-ok', '可以参加选拔或试训'), option('no-preference', '都可以'),
    ],
  },
]

const ADAPTIVE_QUESTIONS = [
  {
    id: 'adaptive-cost', order: 9, core: false, dimension: 'cost', hardConstraint: true,
    prompt: '一个学期最多愿意为必要费用花多少钱？',
    options: [option(0, '不接受必要费用'), option(100, '最多 100 元'), option(300, '最多 300 元'), option(1000, '费用不是硬限制')],
  },
  {
    id: 'adaptive-off-campus', order: 10, core: false, dimension: 'location', hardConstraint: true,
    prompt: '你能接受需要离校参加的活动吗？',
    options: [option('never', '不能离校参加'), option('occasional', '偶尔可以'), option('frequent', '经常也可以')],
  },
  {
    id: 'adaptive-equipment', order: 11, core: false, dimension: 'equipment', hardConstraint: true,
    prompt: '如果需要自备器材，你的接受程度如何？',
    options: [option('none', '不能自备器材'), option('basic', '可准备简单用品'), option('specialized', '专业器材也可考虑')],
  },
  {
    id: 'adaptive-expression', order: 12, core: false, dimension: 'social',
    prompt: '公开发言、表演或展示对你来说怎样？',
    options: [option(0, '尽量避免'), option(2, '偶尔可以'), option(4, '很享受公开表达')],
  },
  {
    id: 'adaptive-competition', order: 13, core: false, dimension: 'mode',
    prompt: '你希望活动里有多少比赛或对抗？',
    options: [option(0, '不要比赛'), option(2, '偶尔挑战'), option(4, '希望经常参赛')],
  },
  {
    id: 'adaptive-autonomy', order: 14, core: false, dimension: 'commitment',
    prompt: '你希望社团安排得多具体？',
    options: [option(0, '希望有明确安排'), option(2, '安排与自主各半'), option(4, '希望高度自主')],
  },
]

const QUESTIONS = CORE_QUESTIONS.concat(ADAPTIVE_QUESTIONS)

function getQuestion(id) {
  return QUESTIONS.find((question) => question.id === id) || null
}

module.exports = {
  ADAPTIVE_QUESTIONS,
  CORE_QUESTIONS,
  QUESTIONS,
  getQuestion,
}
