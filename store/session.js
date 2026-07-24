const { invalidateAdaptiveAnswers } = require('../utils/adaptive-questionnaire.js')
const { buildDecisionProfile } = require('../utils/preference-fit.js')
const { rankClubs } = require('../utils/scoring.js')

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

const session = {
  answers: {},
  askedQuestionIds: [],
  currentQuestionId: null,
  recommendations: [],
  selectedClubIds: [],
  selectionSource: null,
  compareScenario: null,
  tendency: null,

  reset() {
    this.answers = {}
    this.askedQuestionIds = []
    this.currentQuestionId = null
    this.recommendations = []
    this.selectedClubIds = []
    this.selectionSource = null
    this.compareScenario = null
    this.tendency = null
    return this.snapshot()
  },

  answer(questionId, value) {
    if (!questionId) return this.snapshot()
    if (this.askedQuestionIds.indexOf(questionId) !== -1) {
      const valid = invalidateAdaptiveAnswers(this.askedQuestionIds, this.answers, questionId)
      this.askedQuestionIds = valid.askedQuestionIds
      this.answers = valid.answers
    } else {
      this.askedQuestionIds = this.askedQuestionIds.concat(questionId)
    }
    this.answers[questionId] = Array.isArray(value) ? value.slice() : value
    this.currentQuestionId = questionId
    this.recommendations = []
    this.selectedClubIds = []
    this.selectionSource = null
    this.compareScenario = null
    this.tendency = null
    return this.snapshot()
  },

  invalidateAfter(questionId) {
    const valid = invalidateAdaptiveAnswers(this.askedQuestionIds, this.answers, questionId)
    this.askedQuestionIds = valid.askedQuestionIds
    this.answers = valid.answers
    this.currentQuestionId = questionId || null
    this.recommendations = []
    this.selectedClubIds = []
    this.selectionSource = null
    this.compareScenario = null
    this.tendency = null
    return this.snapshot()
  },

  generateRecommendations(clubs, limit) {
    const profile = buildDecisionProfile(this.answers)
    this.recommendations = rankClubs(clubs, profile).slice(0, limit || 6)
    return this.recommendations
  },

  setSelectedClubIds(ids, source) {
    const unique = (Array.isArray(ids) ? ids : []).filter((id, index, list) => (
      id && list.indexOf(id) === index
    )).slice(0, 3)
    this.selectedClubIds = unique
    this.selectionSource = source || this.selectionSource || 'browse'
    this.tendency = null
    return this.selectionGuard(false)
  },

  toggleClub(clubId, source) {
    const index = this.selectedClubIds.indexOf(clubId)
    if (index !== -1) {
      this.selectedClubIds = this.selectedClubIds.filter((id) => id !== clubId)
    } else if (this.selectedClubIds.length < 3) {
      this.selectedClubIds = this.selectedClubIds.concat(clubId)
    } else {
      return { ok: false, message: '最多选择 3 个候选社团。', count: 3 }
    }
    this.selectionSource = source || this.selectionSource || 'browse'
    this.tendency = null
    return this.selectionGuard(false)
  },

  selectionGuard(requireReady) {
    const count = this.selectedClubIds.length
    if (requireReady && count < 2) {
      return { ok: false, message: '请至少选择 2 个候选社团再继续。', count }
    }
    if (count > 3) {
      return { ok: false, message: '最多选择 3 个候选社团。', count }
    }
    return {
      ok: true,
      ready: count >= 2 && count <= 3,
      message: count < 2 ? `还需选择 ${2 - count} 个候选` : '可以进入下一步',
      count,
    }
  },

  snapshot() {
    return clone({
      answers: this.answers,
      askedQuestionIds: this.askedQuestionIds,
      currentQuestionId: this.currentQuestionId,
      recommendations: this.recommendations,
      selectedClubIds: this.selectedClubIds,
      selectionSource: this.selectionSource,
      compareScenario: this.compareScenario,
      tendency: this.tendency,
    })
  },
}

module.exports = session
