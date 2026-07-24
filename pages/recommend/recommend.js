const session = require('../../store/session.js')
const { getClubsByIds } = require('../../data/clubs.js')

const GRADE_RANK = { U: 0, D: 1, C: 2, B: 3, A: 4 }

function bestEvidenceGrade(recommendation) {
  const grades = recommendation.preference.dimensions.map((item) => item.evidenceGrade || 'U')
  return grades.sort((left, right) => GRADE_RANK[right] - GRADE_RANK[left])[0] || 'U'
}

function matchingReasons(recommendation) {
  const reasons = recommendation.preference.reasons.slice(0, 2).map((item) => (
    String(item).replace(/兼容度为\s*/g, '兼容 ')
  ))
  if (reasons.length < 2 && recommendation.club.categoryLabel) {
    reasons.push(`方向：${recommendation.club.categoryLabel}`)
  }
  if (reasons.length < 2) {
    reasons.push(`综合匹配 ${recommendation.score}`)
  }
  return reasons.slice(0, 2)
}

function uniqueUnknowns(recommendation) {
  return recommendation.hard.evaluations.reduce((items, evaluation) => {
    if (evaluation.result === 'UNKNOWN' && items.indexOf(evaluation.fieldLabel) === -1) {
      items.push(evaluation.fieldLabel)
    }
    return items
  }, [])
}

function presentRecommendation(recommendation, index, selectedIds) {
  const unknowns = uniqueUnknowns(recommendation)
  const conflicts = recommendation.preference.conflicts
  return {
    club: recommendation.club,
    rank: index + 1,
    score: recommendation.score,
    evidenceGrade: bestEvidenceGrade(recommendation),
    reasons: matchingReasons(recommendation),
    selected: selectedIds.indexOf(recommendation.clubId) !== -1,
    costText: `时间约 ${recommendation.club.weeklyHours || '未提供'} · ${recommendation.club.frequency || '频率待核实'}`,
    unknownText: unknowns.length
      ? `待核实：${unknowns.slice(0, 3).join('、')}`
      : '硬条件暂无未知项，关键安排仍建议现场复核',
    caution: conflicts[0] || (unknowns.length ? `有 ${unknowns.length} 项硬条件尚不能判定` : ''),
  }
}

Page({
  data: {
    recommendations: [],
    selectedClubs: [],
    hasRecommendations: false,
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const snapshot = session.snapshot()
    this.setData({
      recommendations: snapshot.recommendations.map((item, index) => (
        presentRecommendation(item, index, snapshot.selectedClubIds)
      )),
      selectedClubs: getClubsByIds(snapshot.selectedClubIds),
      hasRecommendations: snapshot.recommendations.length > 0,
    })
  },

  onSelect(event) {
    const result = session.toggleClub(event.detail.id, 'recommend')
    if (!result.ok) {
      wx.showToast({ title: result.message, icon: 'none' })
    }
    this.refresh()
  },

  onRemove(event) {
    session.toggleClub(event.detail.id, 'recommend')
    this.refresh()
  },

  onDetail(event) {
    wx.navigateTo({ url: `/pages/club/club?id=${event.detail.id}` })
  },

  onEditAnswers() {
    wx.redirectTo({ url: '/pages/assessment/assessment?edit=1' })
  },

  onStartAssessment() {
    wx.redirectTo({ url: '/pages/assessment/assessment' })
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
