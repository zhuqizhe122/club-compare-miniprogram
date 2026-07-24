const { getClubsByIds } = require('../../data/clubs.js')
const session = require('../../store/session.js')
const { presentClub } = require('../../utils/club-view.js')

Page({
  data: {
    club: null,
    selected: false,
    missing: false,
  },

  onLoad(options) {
    this.clubId = options.id || ''
    const club = getClubsByIds([this.clubId])[0]
    if (!club) {
      this.setData({ missing: true })
      return
    }
    this.setData({ club: presentClub(club) })
    wx.setNavigationBarTitle({ title: club.name })
  },

  onShow() {
    if (!this.clubId) return
    this.setData({ selected: session.snapshot().selectedClubIds.indexOf(this.clubId) !== -1 })
  },

  onToggleSelection() {
    const result = session.toggleClub(this.clubId, 'club-detail')
    if (!result.ok) wx.showToast({ title: result.message, icon: 'none' })
    this.setData({ selected: session.snapshot().selectedClubIds.indexOf(this.clubId) !== -1 })
  },

  onBackLibrary() {
    wx.navigateTo({ url: '/pages/library/library' })
  },
})
