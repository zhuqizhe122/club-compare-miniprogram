const { getClubsByIds } = require('../../data/clubs.js')
const session = require('../../store/session.js')

const SOURCE_LABELS = {
  library: '社团资料库',
  'club-detail': '社团详情页',
  recommend: '个性化推荐',
  browse: '自主浏览',
}

function presentClub(club, index) {
  const profile = club.decisionProfile
  const risks = [
    '真实考勤与请假规则尚未核验',
    profile.selectionRequired ? '是否需要选拔及选拔标准尚未核验' : '是否完全免选拔尚未核验',
    profile.semesterCostMax > 100 ? '费用、器材或校外活动成本尚未核验' : '实际费用与器材要求尚未核验',
  ]
  return {
    id: club.id,
    order: index + 1,
    name: club.name,
    categoryLabel: club.categoryLabel,
    tagline: club.tagline,
    durationText: profile.commitment.duration === 'term' ? '通常按学期或项目持续' : '参与周期较灵活',
    hoursText: `普通周约 ${profile.weeklyHoursTypical} 小时`,
    peakText: `高峰周约 ${profile.weeklyHoursPeak} 小时`,
    evidenceGrade: 'D',
    riskText: risks.join('；'),
  }
}

Page({
  data: {
    clubs: [],
    sourceText: '自主浏览',
    guardMessage: '',
    ready: false,
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const snapshot = session.snapshot()
    const guard = session.selectionGuard(false)
    const clubs = getClubsByIds(snapshot.selectedClubIds).map(presentClub)
    this.setData({
      clubs,
      sourceText: SOURCE_LABELS[snapshot.selectionSource] || '自主浏览',
      guardMessage: guard.message,
      ready: guard.ready,
    })
  },

  onRemove(event) {
    session.toggleClub(event.currentTarget.dataset.id, session.snapshot().selectionSource)
    this.refresh()
  },

  onBackLibrary() {
    wx.navigateTo({ url: '/pages/library/library' })
  },

  onCompare() {
    const guard = session.selectionGuard(true)
    if (!guard.ok) {
      wx.showToast({ title: guard.message, icon: 'none' })
      return
    }
    const app = getApp()
    app.globalData = app.globalData || {}
    app.globalData.selectedClubIds = session.snapshot().selectedClubIds.slice()
    wx.navigateTo({ url: '/pages/compare/compare' })
  },
})
