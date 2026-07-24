const { getAllClubs, getClubsByIds } = require('../../data/clubs.js')
const session = require('../../store/session.js')

const PAGE_SIZE = 12
const CATEGORIES = [
  { value: '', label: '全部' },
  { value: 'academic', label: '学术思辨' },
  { value: 'arts', label: '文化艺术' },
  { value: 'sports', label: '体育运动' },
  { value: 'service', label: '公益实践' },
  { value: 'technology', label: '科技创新' },
  { value: 'international', label: '语言与国际交流' },
  { value: 'interest', label: '兴趣生活' },
]
const INTENSITIES = [
  { value: '', label: '不限投入' },
  { value: 'low', label: '轻量投入' },
  { value: 'medium', label: '适中投入' },
  { value: 'high', label: '较高投入' },
]
const MODES = [
  { value: '', label: '不限形式' },
  { value: 'discussion', label: '讨论交流' },
  { value: 'practice', label: '训练实践' },
  { value: 'project', label: '项目协作' },
  { value: 'performance', label: '表演展示' },
  { value: 'competition', label: '比赛竞技' },
  { value: 'service', label: '公益服务' },
]
const BARRIERS = [
  { value: '', label: '不限门槛' },
  { value: 'beginner', label: '零基础可尝试' },
  { value: 'guided', label: '建议指导入门' },
]

function hasMode(club, mode) {
  return !mode || (club.decisionProfile.activityModes || []).indexOf(mode) !== -1
}

Page({
  data: {
    categories: CATEGORIES,
    intensities: INTENSITIES,
    modes: MODES,
    barriers: BARRIERS,
    category: '',
    intensity: '',
    activityMode: '',
    skillBarrier: '',
    keyword: '',
    advancedOpen: false,
    visibleClubs: [],
    selectedClubs: [],
    total: 0,
    visibleCount: PAGE_SIZE,
    hasMore: false,
  },

  onShow() {
    this.refresh()
  },

  onKeyword(event) {
    this.setData({ keyword: event.detail.value, visibleCount: PAGE_SIZE })
    this.refresh()
  },

  onCategory(event) {
    this.setData({ category: event.currentTarget.dataset.value, visibleCount: PAGE_SIZE })
    this.refresh()
  },

  onFilter(event) {
    const key = event.currentTarget.dataset.key
    this.setData({ [key]: event.currentTarget.dataset.value, visibleCount: PAGE_SIZE })
    this.refresh()
  },

  onToggleAdvanced() {
    this.setData({ advancedOpen: !this.data.advancedOpen })
  },

  onResetFilters() {
    this.setData({
      intensity: '',
      activityMode: '',
      skillBarrier: '',
      visibleCount: PAGE_SIZE,
    })
    this.refresh()
  },

  onResetAll() {
    this.setData({
      keyword: '',
      category: '',
      intensity: '',
      activityMode: '',
      skillBarrier: '',
      visibleCount: PAGE_SIZE,
    })
    this.refresh()
  },

  refresh() {
    const keyword = this.data.keyword.trim().toLowerCase()
    const filtered = getAllClubs().filter((club) => {
      const text = [club.name, club.tagline, club.categoryLabel]
        .concat(club.tags || [], club.searchAliases || []).join(' ').toLowerCase()
      return (!keyword || text.indexOf(keyword) !== -1)
        && (!this.data.category || club.category === this.data.category)
        && (!this.data.intensity || club.intensity === this.data.intensity)
        && (!this.data.skillBarrier || club.skillBarrier === this.data.skillBarrier)
        && hasMode(club, this.data.activityMode)
    })
    const snapshot = session.snapshot()
    const selectedIds = snapshot.selectedClubIds
    const visibleClubs = filtered.slice(0, this.data.visibleCount).map((club) => ({
      id: club.id,
      club,
      selected: selectedIds.indexOf(club.id) !== -1,
      evidenceGrade: 'D',
      reasons: [club.weeklyHours, club.frequency],
    }))
    this.setData({
      visibleClubs,
      selectedClubs: getClubsByIds(selectedIds),
      total: filtered.length,
      hasMore: visibleClubs.length < filtered.length,
    })
  },

  onLoadMore() {
    this.setData({ visibleCount: this.data.visibleCount + PAGE_SIZE })
    this.refresh()
  },

  onSelect(event) {
    const result = session.toggleClub(event.detail.id, 'library')
    if (!result.ok) wx.showToast({ title: result.message, icon: 'none' })
    this.refresh()
  },

  onRemove(event) {
    session.toggleClub(event.detail.id, 'library')
    this.refresh()
  },

  onDetail(event) {
    wx.navigateTo({ url: `/pages/club/club?id=${event.detail.id}` })
  },

  onOpenSelection() {
    const guard = session.selectionGuard(true)
    if (!guard.ok) {
      wx.showToast({ title: guard.message, icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/selection/selection' })
  },
})
