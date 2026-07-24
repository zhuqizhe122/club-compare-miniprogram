const {
  getClubById,
  displayField,
  normalizeImages,
  normalizeHonors,
} = require('../../data/clubs.js')
const { withCategory } = require('../../utils/categories.js')

Page({
  data: {
    club: null,
    categoryName: '',
    fields: [],
    images: [],
    hasImages: false,
    honors: [],
    hasHonors: false,
    error: '',
    errorText: '加载中...',
    hint: '',
    inBasket: false,
    basketCount: 0,
    basketLabel: '加入比较篮（0/4）',
  },

  onLoad(query) {
    this._id = (query && query.id) || ''
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const club = getClubById(this._id)
    if (!club) {
      this.setData({
        club: null,
        categoryName: '',
        fields: [],
        images: [],
        hasImages: false,
        honors: [],
        hasHonors: false,
        error: '未找到该社团',
        errorText: '未找到该社团',
      })
      return
    }
    const enriched = withCategory(club)
    const defs = [
      { key: 'weeklyHours', label: '每周时间' },
      { key: 'frequency', label: '活动频率' },
      { key: 'memberRole', label: '普通成员职责' },
      { key: 'vibe', label: '氛围标签' },
    ]
    const fields = defs.map((d) => {
      const value = displayField(club[d.key])
      return {
        key: d.key,
        label: d.label,
        value: value,
        missing: value === '未提供',
      }
    })
    const images = normalizeImages(club)
    const honors = normalizeHonors(club)
    const basket = (getApp().globalData && getApp().globalData.basketIds) || []
    const inBasket = basket.indexOf(club.id) !== -1
    const basketCount = basket.length
    this.setData({
      club: club,
      categoryName: enriched.categoryName,
      fields: fields,
      images: images,
      hasImages: images.length > 0,
      honors: honors,
      hasHonors: honors.length > 0,
      error: '',
      errorText: '加载中...',
      inBasket: inBasket,
      basketCount: basketCount,
      basketLabel: (inBasket ? '移出比较篮' : '加入比较篮') + '（' + basketCount + '/4）',
      hint: '',
    })
  },

  onPreviewImage(e) {
    const src = e.currentTarget.dataset.src
    const urls = this.data.images || []
    if (!urls.length) return
    wx.previewImage({ current: src, urls: urls })
  },

  onToggleBasket() {
    const app = getApp()
    const id = this._id
    if (this.data.inBasket) {
      app.removeFromBasket(id)
      const count = app.globalData.basketIds.length
      this.setData({
        inBasket: false,
        basketCount: count,
        basketLabel: '加入比较篮（' + count + '/4）',
        hint: '已移出比较篮',
      })
      return
    }
    const res = app.addToBasket(id)
    if (!res.ok) {
      this.setData({ hint: res.error || '无法加入' })
      return
    }
    this.setData({
      inBasket: true,
      basketCount: res.ids.length,
      basketLabel: '移出比较篮（' + res.ids.length + '/4）',
      hint: '已加入比较篮',
    })
  },

  onCompare() {
    const ids = (getApp().globalData && getApp().globalData.basketIds) || []
    if (ids.length < 2) {
      this.setData({ hint: '请至少选择 2 个社团再对照' })
      return
    }
    wx.navigateTo({ url: '/pages/compare/compare' })
  },
})
