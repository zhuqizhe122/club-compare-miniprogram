Page({
  data: {
    recommendations: [],
  },

  onShow() {
    const recommendations = getApp().globalData.quizRecommendations || []
    if (recommendations.length !== 3) {
      wx.showToast({ title: '请先完成测试', icon: 'none' })
      wx.navigateBack({ delta: 1 })
      return
    }
    this.setData({ recommendations })
  },

  onCompare() {
    const ids = this.data.recommendations.map((item) => item.club.id)
    getApp().globalData.selectedClubIds = ids
    getApp().globalData.tendency = null
    wx.navigateTo({ url: '/pages/compare/compare' })
  },

  onRetake() {
    getApp().resetSelection()
    wx.reLaunch({ url: '/pages/quiz/quiz' })
  },
})
