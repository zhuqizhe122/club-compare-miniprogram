const session = require('../../store/session.js')
const { getClubsByIds } = require('../../data/clubs.js')

const GRADE_RANK = { U: 0, D: 1, C: 2, B: 3, A: 4 }

function bestEvidenceGrade(recommendation) {
  const grades = recommendation.preference.dimensions.map((item) => item.evidenceGrade || 'U')
  return grades.sort((left, right) => GRADE_RANK[right] - GRADE_RANK[left])[0] || 'U'
}

function matchingReasons(recommendation) {
  const reasons = recommendation.preference.reasons.slice(0, 2)
  if (reasons.length < 2 && recommendation.club.categoryLabel) {
    reasons.push(`活动方向属于“${recommendation.club.categoryLabel}”，可作为偏好候选`)
  }
  if (reasons.length < 2) {
    reasons.push(`综合偏好匹配分为 ${recommendation.score}，建议结合详情继续判断`)
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
    costText: `时间代价：${recommendation.club.weeklyHours || '未提供'}；活动频率：${recommendation.club.frequency || '未提供'}`,
    unknownText: unknowns.length
      ? `待核实的硬条件：${unknowns.join('、')}`
      : '当前硬条件未发现未知项，但 D 级原型资料仍需现场复核。',
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
