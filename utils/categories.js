/**
 * 社团分类：枚举 + 运行时推断（可不写进 data/clubs.js）。
 */

const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'theory', name: '理论学术' },
  { id: 'sport', name: '体育运动' },
  { id: 'arts', name: '文艺实践' },
  { id: 'service', name: '公益服务' },
  { id: 'culture', name: '文化交流' },
  { id: 'tech', name: '科技实践' },
  { id: 'other', name: '其他兴趣' },
]

const VALID_IDS = {
  theory: true,
  sport: true,
  arts: true,
  service: true,
  culture: true,
  tech: true,
  other: true,
}

function getCategories() {
  return CATEGORIES
}

function getCategoryName(id) {
  const hit = CATEGORIES.find((c) => c.id === id)
  return hit ? hit.name : '其他兴趣'
}

function inferCategory(club) {
  if (club && club.category && VALID_IDS[club.category]) {
    return club.category
  }

  const text = [club && club.name, club && club.tagline, club && club.vibe, club && club.memberRole]
    .join(' ')

  if (/球|跑|滑|泳|瑜伽|健身|剑道|武术|舞蹈|冰|雪|户外|飞盘|橄榄|网球|乒乓|羽毛|排球|足球|田径|操|绳|毽|跆拳|曲棍|台球|高尔夫|裁判|啦啦/.test(text)) {
    return 'sport'
  }
  if (/编程|代码|人工智能|区块链|开源|计算机|Harmony|数字孪生|科技|建模|精算|统计调查|医养技术/.test(text)) {
    return 'tech'
  }
  if (/志愿|公益|动物|红十字|普法|法律援助|服务|关怀|振兴|手语|红丝带|心宇/.test(text)) {
    return 'service'
  }
  if (/语言|交流|文化|跨文化|国际|英语|韩|日|澳门|模拟联合国|胜任力|欧洲研究|樱花/.test(text)) {
    return 'culture'
  }
  if (/马克思主义|讲师|辩论|学术|研讨|法律协会|研学|论道|红色文学|全球研究|可持续发展|政协|日知|未来学者|明理创新|社会研究/.test(text)) {
    return 'theory'
  }
  if (/乐|琴|箫|笛|诗|书|茶|影|漫|戏|舞|唱|摄|画|篆刻|配音|相声|魔术|汉服|写作|棋|天文|博物|营建|编坊|家书|金石|说唱|素食|游研|推理|科幻/.test(text)) {
    return 'arts'
  }
  return 'other'
}

function withCategory(club) {
  const category = inferCategory(club)
  return Object.assign({}, club, {
    category: category,
    categoryName: getCategoryName(category),
  })
}

/**
 * @param {Array} clubs
 * @param {{ categoryId?: string, keyword?: string }} filters
 */
function filterClubs(clubs, filters) {
  const categoryId = (filters && filters.categoryId) || 'all'
  const keyword = String((filters && filters.keyword) || '')
    .trim()
    .toLowerCase()

  return (clubs || [])
    .map(withCategory)
    .filter((c) => {
      if (categoryId !== 'all' && c.category !== categoryId) return false
      if (!keyword) return true
      const hay = [c.name, c.tagline, c.categoryName, c.vibe].join(' ').toLowerCase()
      return hay.indexOf(keyword) !== -1
    })
}

module.exports = {
  CATEGORIES,
  getCategories,
  getCategoryName,
  inferCategory,
  withCategory,
  filterClubs,
}
