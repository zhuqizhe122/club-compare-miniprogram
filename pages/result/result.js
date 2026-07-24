const {
  getClubsByIds,
  getExpectationCards,
} = require('../../data/clubs.js')
const { generateBoothQuestions } = require('../../utils/booth-questions.js')

function buildOutcome(tendency, options, app) {
  const opt = options.find((item) => item.value === tendency)
  const confirmText = tendency === 'none'
    ? '已记录：你选择先都不加。可以稍后再比较。'
    : `已记录：${opt ? opt.label : tendency}。先去现场核实，再决定是否加入。`
  const ids = app.globalData.selectedClubIds || []
  const expectationCards = tendency === 'none'
    ? [{
      id: 'none',
      name: '先都不加',
      title: '加入前决定',
      expectations: [
        '对照后暂未找到足够匹配的候选',
        '先带着问题去摊位核实，不在信息不足时仓促加入',
        '获得新信息后，可以随时回来重新比较',
      ],
      status: '保留选择权',
      reminder: '暂不加入也是经过比较后的有效决定。',
    }]
    : getExpectationCards([tendency.replace(/^club:/, '')])
  return {
    tendency,
    confirmed: true,
    confirmText,
    expectationCards,
    boothQuestions: generateBoothQuestions(ids, {
      tendency,
      preference: app.globalData.preferenceAnswers || {},
    }),
    error: '',
  }
}

Page({
  data: {
    options: [],
    tendency: '',
    confirmed: false,
    confirmText: '',
    expectationCards: [],
    boothQuestions: [],
    error: '',
  },

  onShow() {
    const app = getApp()
    const ids = app.globalData.selectedClubIds || []
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
    const savedTendency = app.globalData.tendency
    if (savedTendency && options.some((item) => item.value === savedTendency)) {
      this.setData(Object.assign({ options }, buildOutcome(savedTendency, options, app)))
      return
    }
    app.globalData.tendency = null
    this.setData({
      options,
      tendency: '',
      confirmed: false,
      confirmText: '',
      expectationCards: [],
      boothQuestions: [],
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
    const app = getApp()
    app.globalData.tendency = tendency
    this.setData(buildOutcome(tendency, options, app))
  },

  onAdjust() {
    wx.navigateBack({ delta: 2 })
  },

  onRestart() {
    getApp().resetSelection()
    wx.reLaunch({ url: '/pages/index/index' })
  },
})
