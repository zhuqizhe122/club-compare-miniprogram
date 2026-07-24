Page({
  data: {
    items: [],
    selectedIds: [],
    selectedCount: 0,
    error: '',
  },

  onShow() {
    const rec = getApp().globalData.recommendation
    if (!rec || !rec.items || !rec.items.length) {
      this.setData({ items: [], error: '请先完成问卷' })
      return
    }
    const selectedIds = getApp().globalData.basketIds || []
    const selectedSet = {}
    selectedIds.forEach((id) => {
      selectedSet[id] = true
    })
    const items = rec.items.map((it) =>
      Object.assign({}, it, { checked: !!selectedSet[it.id] })
    )
    this.setData({
      items,
      selectedIds,
      selectedCount: selectedIds.length,
      error: '',
    })
  },

  onToggle(e) {
    const id = e.currentTarget.dataset.id
    let ids = (getApp().globalData.basketIds || []).slice()
    const idx = ids.indexOf(id)
    if (idx !== -1) {
      ids.splice(idx, 1)
    } else {
      if (ids.length >= 4) {
        this.setData({ error: '最多选择 4 个社团进行比较' })
        return
      }
      ids.push(id)
    }
    getApp().setBasket(ids)
    const selectedSet = {}
    ids.forEach((x) => {
      selectedSet[x] = true
    })
    const items = this.data.items.map((it) =>
      Object.assign({}, it, { checked: !!selectedSet[it.id] })
    )
    this.setData({
      items,
      selectedIds: ids,
      selectedCount: ids.length,
      error: '',
    })
  },

  onOpenDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/club/club?id=${id}` })
  },

  onCompare() {
    const n = (getApp().globalData.basketIds || []).length
    if (n < 2) {
      this.setData({ error: '请至少勾选 2 个社团再比较' })
      return
    }
    wx.navigateTo({ url: '/pages/compare/compare' })
  },

  onQuestions() {
    const n = (getApp().globalData.basketIds || []).length
    if (n < 1) {
      this.setData({ error: '请先勾选至少 1 个关注的社团' })
      return
    }
    wx.navigateTo({ url: '/pages/result/result' })
  },
})
