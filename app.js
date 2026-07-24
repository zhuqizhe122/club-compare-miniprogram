App({
  globalData: {
    quizAnswers: {},
    recommendation: null,
    basketIds: [],
    tendency: null,
  },

  resetSession() {
    this.globalData.quizAnswers = {}
    this.globalData.recommendation = null
    this.globalData.basketIds = []
    this.globalData.tendency = null
  },

  addToBasket(id) {
    const ids = this.globalData.basketIds || []
    if (ids.indexOf(id) !== -1) return { ok: true, ids }
    if (ids.length >= 4) {
      return { ok: false, ids, error: '最多选择 4 个社团进行比较' }
    }
    const next = ids.concat([id])
    this.globalData.basketIds = next
    return { ok: true, ids: next }
  },

  removeFromBasket(id) {
    const next = (this.globalData.basketIds || []).filter((x) => x !== id)
    this.globalData.basketIds = next
    return next
  },

  setBasket(ids) {
    const capped = (ids || []).slice(0, 4)
    this.globalData.basketIds = capped
    return capped
  },
})
