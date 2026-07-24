/**
 * 摊位提问清单（规则模板，非 AI）。
 * 结合问卷答案定制问题内容，但措辞为可直接当面提问的短句（不带「根据你的问卷…」前缀）。
 */
function isMissing(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

/**
 * @param {{ clubs: Array, tendency: string, quizAnswers: Record<string,string> }} input
 * @returns {string[]}
 */
function buildBoothQuestions({ clubs, tendency, quizAnswers }) {
  const list = clubs || []
  const answers = quizAnswers || {}
  const questions = []
  const seen = {}

  function push(q) {
    if (!q || seen[q] || questions.length >= 6) return
    seen[q] = true
    questions.push(q)
  }

  let focus = null
  if (tendency && tendency.indexOf('club:') === 0) {
    focus = list.find((c) => c.id === tendency.slice(5)) || null
  }
  if (!focus && list[0]) focus = list[0]
  const focusName = focus ? focus.name : list.map((c) => c.name).join('、') || '贵社'

  if (answers.time === 'low') {
    push(`请问「${focusName}」普通成员平时每周大概投入几小时？会不会经常超过 2 小时？`)
  } else if (answers.time === 'mid') {
    push(`请问「${focusName}」平时每周投入是否大致在 2～4 小时？有没有额外准备时间？`)
  } else if (answers.time === 'high') {
    push(`请问「${focusName}」高投入成员通常时间花在哪里？新人第一学期要不要立刻跟上？`)
  }

  if (answers.intensity === 'loose') {
    push(`请问「${focusName}」对请假和缺席的要求是什么？偶尔缺席会不会影响成员身份？`)
  } else if (answers.intensity === 'steady') {
    push(`请问「${focusName}」每周固定活动是哪几天、大概几点？迟到或请假怎么沟通？`)
  } else if (answers.intensity === 'intense') {
    push(`请问「${focusName}」赛前或项目期通常会加到什么强度？大概持续多久？`)
  }

  if (answers.vibe === 'quiet') {
    push(`请问「${focusName}」日常更偏个人练习或阅读，还是经常需要公开表达？`)
  } else if (answers.vibe === 'expressive') {
    push(`请问「${focusName}」普通成员多久会有一次分享、试讲或展示？新人大概第几次能轮到？`)
  } else if (answers.vibe === 'competitive') {
    push(`请问「${focusName}」普通成员多久能参加正式比赛或对抗？选拔标准是什么？`)
  }

  if (answers.output === 'no') {
    push(`请问「${focusName}」是否允许只参与活动、不强制交作业或参赛？`)
  } else if (answers.output === 'yes') {
    push(`请问「${focusName}」本学期有哪些面向普通成员的展示或比赛节点？`)
  }

  if (answers.schedule === 'tight') {
    push(`请问「${focusName}」活动时间是否相对固定？临时加会多不多？`)
  }

  if (answers.risk === 'avoid') {
    push(`请问「${focusName}」有没有排班或轮值？新人第一学期是否必须值班？`)
  } else if (answers.risk === 'fine' || answers.risk === 'ok') {
    push(`请问「${focusName}」普通成员的固定职责和轮值频率具体是怎样的？`)
  }

  if (answers.fresh === 'easy') {
    push(`请问「${focusName}」新人前四周通常实际在做什么？什么时候需要正式承诺加入？`)
  } else if (answers.fresh === 'challenge') {
    push(`请问「${focusName}」新人多久能进入正式训练或项目小组？有没有试用期？`)
  }

  if (answers.learning === 'learn') {
    push(`请问「${focusName}」活动里动手训练或排练占比大概多少？会不会经常需要上台？`)
  } else if (answers.learning === 'do') {
    push(`请问「${focusName}」新人需要自备器材或软件吗？入门练习强度如何？`)
  }

  if (answers.outdoor === 'out') {
    push(`请问「${focusName}」本学期户外或集体出行大概几次？费用和安全培训怎么安排？`)
  }

  list.forEach((c) => {
    if (isMissing(c.weeklyHours)) {
      push(`请问「${c.name}」平时与活动周各自大约要投入几小时？`)
    }
  })

  if (list.length >= 2 && focus) {
    const other = list.find((c) => c.id !== focus.id)
    if (other) {
      push(
        `请问「${focus.name}」和「${other.name}」相比，时间投入与到场要求上最大的差别是什么？`
      )
    }
  }

  if (tendency === 'none') {
    push('如果只再确认一条信息，更建议优先问每周时间，还是普通成员要做什么？')
  }

  if (questions.length < 3 && focus) {
    push(`请问「${focus.name}」普通成员第一学期最主要的固定任务是什么？`)
  }

  return questions.slice(0, 6)
}

module.exports = {
  buildBoothQuestions,
  isMissing,
}
