const { getClubsByIds, getClubById, displayField } = require('../../data/clubs.js')
const { buildBoothQuestions } = require('../../utils/booth-questions.js')

function toClubCard(club) {
  if (!club) return null
  return {
    id: club.id,
    name: club.name,
    tagline: club.tagline,
    weeklyHours: displayField(club.weeklyHours),
    frequency: displayField(club.frequency),
    memberRole: displayField(club.memberRole),
    vibe: displayField(club.vibe),
  }
}

function toClubCards(clubs) {
  return (clubs || []).map(toClubCard)
}

Page({
  data: {
    step: 'pick',
    pickOptions: [],
    pickClubs: [],
    tendency: '',
    focusCard: null,
    boothQuestions: [],
    confirmText: '',
    error: '',
  },

  onShow() {
    const ids = getApp().globalData.basketIds || []
    let clubs = getClubsByIds(ids)
    if (!clubs.length) {
      const rec = getApp().globalData.recommendation
      if (rec && rec.clubIds) clubs = getClubsByIds(rec.clubIds.slice(0, 4))
    }
    this._clubs = clubs
    const pickOptions = clubs.map((c) => ({
      value: `club:${c.id}`,
      label: c.name,
      tagline: c.tagline,
    }))
    pickOptions.push({
      value: 'none',
      label: '暂时先都不加',
      tagline: '先记下问题，稍后再决定',
    })
    this.setData({
      step: 'pick',
      pickOptions,
      pickClubs: toClubCards(clubs),
      tendency: '',
      focusCard: null,
      boothQuestions: [],
      confirmText: '',
      error: '',
    })
  },

  onTendencyChange(e) {
    this.setData({ tendency: e.detail.value, error: '' })
  },

  onConfirmPick() {
    const { tendency, pickOptions } = this.data
    if (!tendency) {
      this.setData({ error: '请先选择一个感兴趣的社团，或选择「暂时先都不加」' })
      return
    }

    getApp().globalData.tendency = tendency
    const opt = pickOptions.find((o) => o.value === tendency)
    const quizAnswers = getApp().globalData.quizAnswers || {}
    let clubs = this._clubs || []
    let focusCard = null

    if (tendency.indexOf('club:') === 0) {
      const one = getClubById(tendency.slice(5))
      if (one) {
        focusCard = toClubCard(one)
        clubs = [one].concat(clubs.filter((c) => c.id !== one.id))
      }
    }

    const boothQuestions = buildBoothQuestions({
      clubs: clubs,
      tendency,
      quizAnswers,
    })

    this.setData({
      step: 'advice',
      confirmText: opt
        ? tendency === 'none'
          ? opt.label
          : `你感兴趣的社团：${opt.label}`
        : tendency,
      focusCard,
      boothQuestions,
      error: '',
    })
  },

  onOpenClub(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/pages/club/club?id=${id}` })
  },

  onBackPick() {
    this.setData({
      step: 'pick',
      focusCard: null,
      boothQuestions: [],
      confirmText: '',
      error: '',
    })
  },

  onHome() {
    getApp().resetSession()
    wx.reLaunch({ url: '/pages/index/index' })
  },
})
