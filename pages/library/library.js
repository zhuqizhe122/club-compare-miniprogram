const { getClubsByIds, searchClubs } = require('../../data/clubs.js')
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
const TIME_BANDS = [
  { value: '', label: '不限时段' },
  { value: 'weekday-evening', label: '工作日晚间' },
  { value: 'weekend', label: '周末为主' },
  { value: 'flexible', label: '时间灵活' },
]
const SOCIAL_STYLES = [
  { value: '', label: '不限互动' },
  { value: 'quiet', label: '安静专注' },
  { value: 'collaborative', label: '团队协作' },
  { value: 'expressive', label: '表达互动' },
]
const COMMITMENTS = [
  { value: '', label: '不限节奏' },
  { value: 'casual', label: '灵活参与' },
  { value: 'regular', label: '稳定出席' },
  { value: 'project', label: '项目期加码' },
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
const EVIDENCE_GRADES = [
  { value: '', label: '不限证据' },
  { value: 'A', label: 'A 级' },
  { value: 'B', label: 'B 级' },
  { value: 'C', label: 'C 级' },
  { value: 'D', label: 'D · 演示资料' },
  { value: 'U', label: 'U 未知' },
]

function hasMode(club, mode) {
  return !mode || (club.decisionProfile.activityModes || []).indexOf(mode) !== -1
}

function hasEvidenceGrade(club, grade) {
  if (!grade) return true
  return Object.keys(club.evidence || {}).some((fieldPath) => (
    (club.evidence[fieldPath] || []).some((record) => record.grade === grade)
  ))
}

Page({
  data: {
    categories: CATEGORIES,
    timeBands: TIME_BANDS,
    intensities: INTENSITIES,
    socialStyles: SOCIAL_STYLES,
    commitments: COMMITMENTS,
    modes: MODES,
    barriers: BARRIERS,
    evidenceGrades: EVIDENCE_GRADES,
    category: '',
    timeBand: '',
    intensity: '',
    socialStyle: '',
    commitment: '',
    activityMode: '',
    skillBarrier: '',
    evidenceGrade: '',
    keyword: '',
    advancedOpen: false,
    libraryTitle: '浏览全部社团',
    entryHint: '可以搜索名称或使用条件逐步缩小范围。',
    activeConditionCount: 0,
    visibleClubs: [],
    selectedClubs: [],
    total: 0,
    visibleCount: PAGE_SIZE,
    hasMore: false,
  },

  onLoad(options) {
    if (options && options.mode === 'filter') {
      this.setData({
        advancedOpen: true,
        libraryTitle: '按条件筛选社团',
        entryHint: '多项条件需要同时满足；每个结果都可以继续查看详情。',
      })
    }
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
      timeBand: '',
      intensity: '',
      socialStyle: '',
      commitment: '',
      activityMode: '',
      skillBarrier: '',
      evidenceGrade: '',
      visibleCount: PAGE_SIZE,
    })
    this.refresh()
  },

  onResetAll() {
    this.setData({
      keyword: '',
      category: '',
      timeBand: '',
      intensity: '',
      socialStyle: '',
      commitment: '',
      activityMode: '',
      skillBarrier: '',
      evidenceGrade: '',
      visibleCount: PAGE_SIZE,
    })
    this.refresh()
  },

  refresh() {
    const filters = {
      category: this.data.category,
      timeBand: this.data.timeBand,
      intensity: this.data.intensity,
      socialStyle: this.data.socialStyle,
      commitment: this.data.commitment,
      skillBarrier: this.data.skillBarrier,
    }
    const filtered = searchClubs(this.data.keyword, filters)
      .filter((club) => hasMode(club, this.data.activityMode))
      .filter((club) => hasEvidenceGrade(club, this.data.evidenceGrade))
    const activeConditionCount = [
      this.data.keyword.trim(),
      this.data.category,
      this.data.timeBand,
      this.data.intensity,
      this.data.socialStyle,
      this.data.commitment,
      this.data.activityMode,
      this.data.skillBarrier,
      this.data.evidenceGrade,
    ].filter(Boolean).length
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
      activeConditionCount,
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
