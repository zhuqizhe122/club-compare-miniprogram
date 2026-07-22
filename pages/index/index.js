Page({
  onStart() {
    const app = getApp()
    app.resetSelection()
    wx.navigateTo({ url: '/pages/list/list' })
  },
  onQuizStart() {
    const app = getApp()
    app.resetSelection()
    wx.navigateTo({ url: '/pages/quiz/quiz' })
  },
})
