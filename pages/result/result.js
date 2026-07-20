const { getClubsByIds } = require('../../data/clubs.js')

Page({
  data: {
    options: [],
    tendency: '',
    confirmed: false,
    confirmText: '',
    error: '',
  },

  onShow() {
    const ids = getApp().globalData.selectedClubIds || []
    if (ids.length < 2) {
      wx.navigateBack({ delta: 1 })
      return
    }
    const clubs = getClubsByIds(ids)
    const options = clubs.map((c) => ({
      value: `club:${c.id}`,
      label: `更倾向：${c.name}`,
    }))
    options.push({ value: 'none', label: '先都不加' })
    this.setData({
      options,
      tendency: '',
      confirmed: false,
      confirmText: '',
      error: '',
    })
  },

  onTendencyChange(e) {
    this.setData({ tendency: e.detail.value, error: '' })
  },

  onConfirm() {
    const { tendency, options } = this.data
    if (!tendency) {
      this.setData({ error: '请先选择一项倾向' })
      return
    }
    getApp().globalData.tendency = tendency
    const opt = options.find((o) => o.value === tendency)
    const confirmText =
      tendency === 'none'
        ? '已记录：你选择先都不加。可以稍后再比较。'
        : `已记录：${opt ? opt.label : tendency}`
    this.setData({ confirmed: true, confirmText })
  },

  onRestart() {
    getApp().resetSelection()
    wx.reLaunch({ url: '/pages/index/index' })
  },
})
