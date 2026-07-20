const { getClubsByIds, displayField } = require('../../data/clubs.js')

Page({
  data: {
    columns: [],
    rows: [],
  },

  onShow() {
    const ids = getApp().globalData.selectedClubIds || []
    if (ids.length < 2) {
      wx.showToast({ title: '请先选择社团', icon: 'none' })
      wx.navigateBack({ delta: 1 })
      return
    }
    const columns = getClubsByIds(ids)
    const fields = [
      { key: 'weeklyHours', label: '每周时间' },
      { key: 'frequency', label: '活动频率' },
      { key: 'memberRole', label: '普通成员职责' },
      { key: 'vibe', label: '氛围标签' },
    ]
    const rows = fields.map((f) => ({
      key: f.key,
      label: f.label,
      values: columns.map((c) => displayField(c[f.key])),
    }))
    this.setData({ columns, rows })
  },

  onNext() {
    wx.navigateTo({ url: '/pages/result/result' })
  },
})
