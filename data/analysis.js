const { displayField } = require('./display.js')

const DIFFERENCE_FIELDS = [
  { key: 'weeklyHours', label: '每周投入' },
  { key: 'timeBand', label: '常见时段' },
  { key: 'intensity', label: '投入强度' },
  { key: 'socialStyle', label: '互动方式' },
  { key: 'skillBarrier', label: '入门门槛' },
  { key: 'commitment', label: '参与承诺' },
]

function getDifferenceSummary(selected) {
  const clubs = Array.isArray(selected) ? selected : []
  return DIFFERENCE_FIELDS.reduce((items, field) => {
    const values = clubs.map((club) => displayField(club[field.key]))
    if (values.some((value) => value !== values[0])) {
      items.push({
        field: field.key,
        label: field.label,
        values: clubs.map((club, index) => ({
          id: club.id,
          name: club.name,
          value: values[index],
        })),
      })
    }
    return items
  }, [])
}

module.exports = { DIFFERENCE_FIELDS, getDifferenceSummary }
