const { getAllClubs, displayField } = require('../../data/clubs.js')
const { getCategories, filterClubs } = require('../../utils/categories.js')

Page({
  data: {
    categories: [],
    categoryId: 'all',
    keyword: '',
    clubs: [],
    total: 0,
    shown: 0,
    error: '',
  },

  onShow() {
    this._all = getAllClubs()
    this.setData({
      categories: getCategories(),
      total: this._all.length,
    })
    this.applyFilters()
  },

  applyFilters() {
    const list = filterClubs(this._all || [], {
      categoryId: this.data.categoryId,
      keyword: this.data.keyword,
    }).map((c) => ({
      id: c.id,
      name: c.name,
      tagline: c.tagline,
      categoryName: c.categoryName,
      preview: `${displayField(c.weeklyHours)} · ${displayField(c.vibe)}`,
    }))

    this.setData({
      clubs: list,
      shown: list.length,
      error: list.length ? '' : '没有符合条件的社团，试试其他分类或关键字',
    })
  },

  onCategory(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ categoryId: id })
    this.applyFilters()
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value || '' })
    this.applyFilters()
  },

  onClearSearch() {
    this.setData({ keyword: '' })
    this.applyFilters()
  },

  onOpen(e) {
    wx.navigateTo({ url: `/pages/club/club?id=${e.currentTarget.dataset.id}` })
  },
})
