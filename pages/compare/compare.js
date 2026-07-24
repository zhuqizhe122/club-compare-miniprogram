const { getClubsByIds, displayField } = require('../../data/clubs.js')

Page({
  data: {
    columns: [],
    rows: [],
    error: '',
  },

  onShow() {
    const ids = getApp().globalData.basketIds || []
    if (ids.length < 2) {
      this.setData({
        columns: [],
        rows: [],
        error: '请先勾选至少 2 个社团',
      })
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
    this.setData({ columns, rows, error: '' })
  },

  onOpen(e) {
    wx.navigateTo({ url: `/pages/club/club?id=${e.currentTarget.dataset.id}` })
  },

  onQuestions() {
    wx.navigateTo({ url: '/pages/result/result' })
  },
})
