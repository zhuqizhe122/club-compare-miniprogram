/**
 * 从社团文案启发式推断匹配 tags（不写入数据文件）。
 */
function inferTags(club) {
  const text = [
    club.weeklyHours,
    club.frequency,
    club.memberRole,
    club.vibe,
    club.tagline,
    club.name,
  ]
    .join(' ')
    .toLowerCase()

  const tags = []
  const add = (t) => {
    if (tags.indexOf(t) === -1) tags.push(t)
  }

  if (/约\s*1|约1|1～2|1-2|不到\s*2|以内/.test(text) || /约\s*2小时|约2小时/.test(text)) {
    add('low_time')
  }
  if (/3～4|3-4|约3|约\s*3|2～4|2-4|约2～3/.test(text)) add('mid_time')
  if (/4～6|4-6|5～|约5|约6|更高|明显增加|密集|高压|备赛/.test(text)) add('high_time')
  if (!tags.some((t) => /_time$/.test(t))) add('mid_time')

  if (/松散|自愿|可不参加|量力|轻松|开放交流/.test(text)) add('loose')
  if (/每周|训练|排班|值班|稳定|例会|合练/.test(text)) add('steady')
  if (/赛前|比赛|密集|高压|选拔|对抗/.test(text)) add('intense')

  if (/安静|细读|研读|沉静|平和|耐心/.test(text)) add('quiet')
  if (/表达|试讲|宣讲|演出|舞台|写词|配音|表演/.test(text)) add('expressive')
  if (/竞技|对抗|比赛|训练.*赛|友谊赛/.test(text)) add('competitive')

  if (/理论|马克思主义|研读|辩论|学术|研讨|法律|精算|建模/.test(text)) add('theory')
  if (/球|跑|滑|泳|瑜伽|健身|剑道|武术|舞蹈|冰|雪|户外|飞盘|橄榄/.test(text)) {
    add('sport')
  }
  if (/乐|琴|箫|笛|诗|书|茶|影|漫|戏|舞|唱|摄|画|篆刻|配音/.test(text)) add('arts')
  if (/志愿|公益|动物|红十字|普法|服务|关怀|振兴/.test(text)) add('service')
  if (/语言|交流|文化|跨文化|国际|英语|韩|日/.test(text)) add('culture')
  if (/编程|代码|人工智能|区块链|开源|技术|Harmony|数字/.test(text)) add('tech')

  if (tags.length === 0) add('loose')
  return tags
}

module.exports = { inferTags }
