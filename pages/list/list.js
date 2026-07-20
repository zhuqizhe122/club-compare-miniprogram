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

  applySelection(selectedIds, error) {
    const all = getAllClubs()
    if (!all.length) {
      getApp().globalData.selectedClubIds = []
      this.setData({
        clubs: [],
        selectedIds: [],
        error: '暂无可用社团，无法开始比较',
      })
      return
    }

    const capped = selectedIds.slice(0, 3)
    const selectedSet = {}
    capped.forEach((id) => {
      selectedSet[id] = true
    })
    const clubs = all.map((c) => ({
      ...c,
      checked: !!selectedSet[c.id],
    }))
    getApp().globalData.selectedClubIds = capped
    this.setData({
      clubs,
      selectedIds: capped,
      error: error || '',
    })
  },

  onCheckChange(e) {
    let values = e.detail.value || []
    let error = ''
    if (values.length > 3) {
      values = values.slice(0, 3)
      error = '最多选择 3 个社团；请先取消已选再换其他'
    }
    this.applySelection(values, error)
  },

  onCompare() {
    const { selectedIds, clubs } = this.data
    if (!clubs.length) {
      this.setData({ error: '暂无可用社团，无法开始比较' })
      return
    }
    if (selectedIds.length < 2) {
      this.setData({ error: '请至少选择 2 个社团再比较' })
      return
    }
    getApp().globalData.selectedClubIds = selectedIds
    wx.navigateTo({ url: '/pages/compare/compare' })
  },
})
