const assert = require('assert')
const {
  CATEGORY_LABELS,
  getAllClubs,
  getClubsByIds,
  searchClubs,
  getExpectationCards,
} = require('../data/clubs.js')

const clubs = getAllClubs()
const enums = {
  category: Object.keys(CATEGORY_LABELS),
  timeBand: ['weekday-evening', 'weekend', 'flexible'],
  intensity: ['low', 'medium', 'high'],
  socialStyle: ['quiet', 'collaborative', 'expressive'],
  skillBarrier: ['beginner', 'guided', 'experienced'],
  commitment: ['casual', 'regular', 'project'],
}
const requiredStrings = [
  'id', 'name', 'tagline', 'category', 'categoryLabel', 'timeBand', 'intensity', 'socialStyle',
  'skillBarrier', 'commitment', 'dataStatus',
]
const optionalCompareStrings = ['weeklyHours', 'frequency', 'memberRole', 'vibe']

assert.strictEqual(clubs.length, 98, '必须保留 98 个社团')
assert.strictEqual(new Set(clubs.map((club) => club.id)).size, 98, '社团 ID 必须唯一')
assert.strictEqual(new Set(clubs.map((club) => club.name)).size, 98, '社团名称必须唯一')

clubs.forEach((club) => {
  requiredStrings.forEach((field) => {
    assert.strictEqual(typeof club[field], 'string', `${club.id}.${field} 必须是字符串`)
    assert.ok(club[field].trim(), `${club.id}.${field} 不得为空`)
  })
  optionalCompareStrings.forEach((field) => {
    const value = club[field]
    assert.ok(
      value === null || value === undefined || typeof value === 'string',
      `${club.id}.${field} 必须是字符串或契约允许的缺失值`
    )
  })
  assert.ok(Array.isArray(club.tags) && club.tags.length > 0, `${club.id}.tags 必须是非空数组`)
  assert.ok(Array.isArray(club.searchAliases) && club.searchAliases.length > 0, `${club.id}.searchAliases 必须是非空数组`)
  Object.keys(enums).forEach((field) => {
    assert.ok(enums[field].indexOf(club[field]) !== -1, `${club.id}.${field} 枚举无效`)
  })
  assert.strictEqual(club.categoryLabel, CATEGORY_LABELS[club.category], `${club.id} 分类显示名不一致`)
  assert.strictEqual(club.dataStatus, '待社团确认', `${club.id} 必须明确待社团确认`)
})

const reversed = getClubsByIds([clubs[7].id, clubs[1].id, clubs[7].id, 'unknown'])
assert.deepStrictEqual(reversed.map((club) => club.id), [clubs[7].id, clubs[1].id], 'ID 获取必须保持输入顺序并首个去重')
assert.strictEqual(searchClubs('', {}).length, 98, '空搜索必须返回全部')
assert.ok(searchClubs('编程', {}).length > 0, '搜索应覆盖简介文案')
assert.ok(searchClubs('', { category: 'sports' }).every((club) => club.category === 'sports'), '分类筛选必须准确')
assert.ok(getExpectationCards([clubs[0].id]).every((card) => card.status === '待社团确认'), '预期卡必须携带确认状态')

console.log('数据静态校验通过：98 社、字段、枚举、顺序、搜索与确认状态均有效。')
