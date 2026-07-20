const { getAllClubs } = require('../../data/clubs.js')

Page({
  data: {
    clubs: [],
    selectedIds: [],
    error: '',
  },

  onShow() {
    const app = getApp()
    const selected = app.globalData.selectedClubIds || []
    this.applySelection(selected)
  },

  applySelection(selectedIds) {
    const capped = selectedIds.slice(0, 3)
    const selectedSet = {}
    capped.forEach((id) => {
      selectedSet[id] = true
    })
    const clubs = getAllClubs().map((c) => ({
      ...c,
      checked: !!selectedSet[c.id],
    }))
    getApp().globalData.selectedClubIds = capped
    this.setData({
      clubs,
      selectedIds: capped,
      error: '',
    })
  },

  onCheckChange(e) {
    let values = e.detail.value || []
    if (values.length > 3) {
      values = values.slice(0, 3)
      this.setData({ error: '最多选择 3 个社团' })
    } else {
      this.setData({ error: '' })
    }
    this.applySelection(values)
  },

  onCompare() {
    const { selectedIds } = this.data
    if (selectedIds.length < 2) {
      this.setData({ error: '请至少选择 2 个社团再比较' })
      return
    }
    getApp().globalData.selectedClubIds = selectedIds
    wx.navigateTo({ url: '/pages/compare/compare' })
  },
})
