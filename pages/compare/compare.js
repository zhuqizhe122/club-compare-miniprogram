const {
  getClubsByIds,
  displayStructured,
  getDifferenceSummary,
} = require('../../data/clubs.js')
const { scoreClub } = require('../../utils/match.js')

function readable(value) {
  return displayStructured(value)
}

Page({
  data: {
    columns: [],
    rows: [],
    keyDifferences: [],
    hasPreference: false,
  },

  onShow() {
    const ids = getApp().globalData.selectedClubIds || []
    if (ids.length < 2) {
      wx.showToast({ title: '请先选择社团', icon: 'none' })
      wx.navigateBack({ delta: 1 })
      return
    }
    const app = getApp()
    const preference = app.globalData.preferenceAnswers || {}
    const hasPreference = Object.keys(preference).length > 0
    const columns = getClubsByIds(ids).map((club) => {
      const scored = scoreClub(club, preference)
      return Object.assign({}, club, {
        matchReasons: hasPreference ? scored.reasons.slice(0, 2) : [],
      })
    })
    const fields = [
      { key: 'weeklyHours', label: '每周投入' },
      { key: 'frequency', label: '活动频率' },
      { key: 'memberRole', label: '普通成员职责' },
      { key: 'vibe', label: '互动氛围' },
    ]
    const rows = fields.map((field) => {
      const values = columns.map((club) => readable(club[field.key]))
      return {
        key: field.key,
        label: field.label,
        values,
        different: values.some((value) => value !== values[0]),
      }
    })
    const keyDifferences = getDifferenceSummary(columns).slice(0, 2).map((difference) => ({
      label: difference.label,
      summary: difference.values.map((item) => item.name + '：' + readable(item.value)).join('；'),
    }))
    this.setData({ columns, rows, keyDifferences, hasPreference })
  },

  onAdjust() {
    wx.navigateBack({ delta: 1 })
  },

  onNext() {
    wx.navigateTo({ url: '/pages/result/result' })
  },
})
