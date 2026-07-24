const session = require('../../store/session.js')
const { getAllClubs } = require('../../data/clubs.js')
const { getQuestion } = require('../../utils/questions.js')
const {
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  selectNextQuestion,
} = require('../../utils/adaptive-questionnaire.js')
const { buildDecisionProfile } = require('../../utils/preference-fit.js')
const { rankClubs } = require('../../utils/scoring.js')

const CLUBS = getAllClubs()
const GRADE_CONFIDENCE = { A: 100, B: 80, C: 60, D: 30, U: 0 }
const TRIGGER_LABELS = {
  CORE_REQUIRED: '这是建立基本决策画像所需的核心问题。',
  HARD_CONSTRAINT_UNKNOWN: '候选社团的硬条件仍有未知项，需要补充你的边界。',
  TOP_CANDIDATE_DIFFERENTIATION: '当前头部候选接近，这个问题有助于拉开差异。',
  PREFERENCE_COVERAGE: '你的偏好画像仍有空白，这个问题用于补足判断依据。',
}

function sameAnswer(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function buildAdaptiveContext(snapshot) {
  const profile = buildDecisionProfile(snapshot.answers)
  const rankings = rankClubs(CLUBS, profile)
  const candidates = rankings.slice(0, 6).map((item) => item.club)
  const hardUnknownFields = rankings.slice(0, 6).reduce((fields, item) => {
    item.hard.evaluations.forEach((evaluation) => {
      if (evaluation.result === 'UNKNOWN' && fields.indexOf(evaluation.fieldPath) === -1) {
        fields.push(evaluation.fieldPath)
      }
    })
    return fields
  }, [])
  const dimensionTotals = {}
  const dimensionCounts = {}
  rankings.slice(0, 6).forEach((item) => {
    item.preference.dimensions.forEach((dimension) => {
      dimensionTotals[dimension.dimension] = (dimensionTotals[dimension.dimension] || 0)
        + (GRADE_CONFIDENCE[dimension.evidenceGrade] || 0)
      dimensionCounts[dimension.dimension] = (dimensionCounts[dimension.dimension] || 0) + 1
    })
  })
  const dimensionConfidence = Object.keys(dimensionTotals).reduce((result, key) => {
    result[key] = Math.round(dimensionTotals[key] / dimensionCounts[key])
    return result
  }, {})
  const topScoreGaps = rankings.slice(0, 3).map((item, index, list) => (
    index < list.length - 1 ? item.score - list[index + 1].score : null
  )).filter((value) => value !== null)
  return Object.assign({}, snapshot, {
    candidates,
    dimensionConfidence,
    hardUnknownFields,
    topScoreGaps,
  })
}

function presentQuestion(question, answer) {
  const selectedValues = Array.isArray(answer) ? answer : [answer]
  return Object.assign({}, question, {
    typeLabel: question.multiple ? '多选' : '单选',
    options: question.options.map((option) => Object.assign({}, option, {
      selected: selectedValues.indexOf(option.value) !== -1,
    })),
  })
}

Page({
  data: {
    question: null,
    questionIndex: 0,
    answeredCount: 0,
    minQuestions: MIN_QUESTIONS,
    maxQuestions: MAX_QUESTIONS,
    draftAnswer: null,
    triggerReason: '',
    canPrevious: false,
    canNext: false,
    isLastAllowed: false,
  },

  onLoad(options) {
    const editing = options && options.edit === '1'
    if (!editing) session.reset()
    const snapshot = session.snapshot()
    if (editing && snapshot.askedQuestionIds.length) {
      this.showQuestion(snapshot.askedQuestionIds[0], 0, '正在修改已有答案；改动后，后续自适应问题会重新计算。')
      return
    }
    const next = selectNextQuestion(buildAdaptiveContext(snapshot))
    this.showQuestion(next.question.id, 0, TRIGGER_LABELS[next.triggerReason])
  },

  showQuestion(questionId, index, reason) {
    const snapshot = session.snapshot()
    const question = getQuestion(questionId)
    if (!question) return
    const answer = snapshot.answers[questionId]
    const hasAnswer = Array.isArray(answer) ? answer.length > 0 : answer !== undefined
    this.setData({
      question: presentQuestion(question, answer),
      questionIndex: index,
      answeredCount: snapshot.askedQuestionIds.length,
      draftAnswer: answer === undefined ? (question.multiple ? [] : null) : answer,
      triggerReason: reason || (question.core ? TRIGGER_LABELS.CORE_REQUIRED : TRIGGER_LABELS.PREFERENCE_COVERAGE),
      canPrevious: index > 0,
      canNext: hasAnswer,
      isLastAllowed: index + 1 >= MAX_QUESTIONS,
    })
  },

  onChoose(event) {
    const value = event.currentTarget.dataset.value
    const question = this.data.question
    let draft
    if (!question.multiple) {
      draft = value
    } else {
      const current = Array.isArray(this.data.draftAnswer) ? this.data.draftAnswer.slice() : []
      if (value === 'none') {
        draft = current.length === 1 && current[0] === 'none' ? [] : ['none']
      } else {
        const withoutNone = current.filter((item) => item !== 'none')
        const index = withoutNone.indexOf(value)
        if (index === -1) withoutNone.push(value)
        else withoutNone.splice(index, 1)
        draft = withoutNone
      }
    }
    this.setData({
      draftAnswer: draft,
      question: presentQuestion(question, draft),
      canNext: Array.isArray(draft) ? draft.length > 0 : draft !== null && draft !== undefined,
    })
  },

  onPrevious() {
    if (!this.data.canPrevious) return
    const ids = session.snapshot().askedQuestionIds
    const previousIndex = this.data.questionIndex - 1
    this.showQuestion(ids[previousIndex], previousIndex, '返回检查上一题；若修改，后续问题将按新答案重新计算。')
  },

  onNext() {
    if (!this.data.canNext) return
    const questionId = this.data.question.id
    let snapshot = session.snapshot()
    if (!sameAnswer(snapshot.answers[questionId], this.data.draftAnswer)) {
      snapshot = session.answer(questionId, this.data.draftAnswer)
    }

    const currentIndex = snapshot.askedQuestionIds.indexOf(questionId)
    const existingNextId = snapshot.askedQuestionIds[currentIndex + 1]
    if (existingNextId) {
      this.showQuestion(existingNextId, currentIndex + 1, '这是你此前回答过的问题，可继续检查或修改。')
      return
    }

    const next = selectNextQuestion(buildAdaptiveContext(snapshot))
    if (!next.question) {
      this.completeAssessment()
      return
    }
    this.showQuestion(next.question.id, snapshot.askedQuestionIds.length, TRIGGER_LABELS[next.triggerReason])
  },

  completeAssessment() {
    session.generateRecommendations(CLUBS, 6)
    wx.redirectTo({ url: '/pages/recommend/recommend' })
  },
})
