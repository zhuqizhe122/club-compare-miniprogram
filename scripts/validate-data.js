const assert = require('assert')
const {
  CATEGORY_LABELS,
  getAllClubs,
  getClubsByIds,
  searchClubs,
  getExpectationCards,
} = require('../data/clubs.js')
const {
  DECISION_FIELDS,
  EVIDENCE_GRADES,
  LEVEL_FIELDS,
  SOURCE_TYPES,
  isLevel,
} = require('../data/schema.js')

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
const evidenceIds = new Set()

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
  assert.ok(club.decisionProfile && typeof club.decisionProfile === 'object', `${club.id} 缺少 decisionProfile`)
  assert.ok(club.evidence && typeof club.evidence === 'object', `${club.id} 缺少字段 evidence`)
  DECISION_FIELDS.forEach((field) => {
    assert.ok(Object.prototype.hasOwnProperty.call(club.decisionProfile, field), `${club.id}.${field} 缺失`)
    const fieldPath = `decisionProfile.${field}`
    const records = club.evidence[fieldPath]
    assert.ok(Array.isArray(records) && records.length > 0, `${club.id}.${field} 缺少 evidence`)
    records.forEach((record) => {
      assert.ok(!evidenceIds.has(record.id), `${record.id} evidence ID 重复`)
      evidenceIds.add(record.id)
      assert.strictEqual(record.fieldPath, fieldPath, `${record.id} fieldPath 不一致`)
      assert.ok(EVIDENCE_GRADES.indexOf(record.grade) !== -1, `${record.id} grade 无效`)
      assert.ok(SOURCE_TYPES.indexOf(record.sourceType) !== -1, `${record.id} sourceType 无效`)
      assert.strictEqual(record.sourceType, 'prototype-inferred', `${record.id} 不得伪装成已核实来源`)
      assert.strictEqual(record.grade, 'D', `${record.id} 原型推断必须为 D`)
      assert.strictEqual(record.hardPassEligible, false, `${record.id} 原型推断不得支持硬 PASS`)
      ;['sourceRef', 'verifiedAt', 'validTerm', 'note'].forEach((key) => {
        assert.ok(Object.prototype.hasOwnProperty.call(record, key), `${record.id}.${key} 缺失`)
      })
    })
  })
  LEVEL_FIELDS.forEach((field) => {
    assert.ok(isLevel(club.decisionProfile[field]), `${club.id}.${field} 必须为 0..4 整数`)
  })
  assert.ok(club.decisionProfile.weeklyHoursMin <= club.decisionProfile.weeklyHoursTypical, `${club.id} 常态时长下界错误`)
  assert.ok(club.decisionProfile.weeklyHoursTypical <= club.decisionProfile.weeklyHoursPeak, `${club.id} 峰值时长错误`)
  assert.ok(club.decisionProfile.semesterCostMin <= club.decisionProfile.semesterCostMax, `${club.id} 费用区间错误`)
  assert.ok(Number.isInteger(club.decisionProfile.typicalGroupSize) && club.decisionProfile.typicalGroupSize > 0, `${club.id} 典型组规模无效`)
  ;['activityDomains', 'activityModes', 'goalBenefits', 'requiredTimeSlots', 'equipmentRequired'].forEach((field) => {
    assert.ok(Array.isArray(club.decisionProfile[field]), `${club.id}.${field} 必须是数组`)
  })
})

const reversed = getClubsByIds([clubs[7].id, clubs[1].id, clubs[7].id, 'unknown'])
assert.deepStrictEqual(reversed.map((club) => club.id), [clubs[7].id, clubs[1].id], 'ID 获取必须保持输入顺序并首个去重')
assert.strictEqual(searchClubs('', {}).length, 98, '空搜索必须返回全部')
assert.ok(searchClubs('编程', {}).length > 0, '搜索应覆盖简介文案')
assert.ok(searchClubs('', { category: 'sports' }).every((club) => club.category === 'sports'), '分类筛选必须准确')
assert.ok(getExpectationCards([clubs[0].id]).every((card) => card.status === '待社团确认'), '预期卡必须携带确认状态')

console.log('数据静态校验通过：98 社、决策字段、D 级推断证据、枚举、顺序与搜索均有效。')
