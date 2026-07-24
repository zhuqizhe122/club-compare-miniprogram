const { getQuestions, matchClubs } = require('../../utils/match.js')
const { getAllClubs } = require('../../data/clubs.js')

Page({
  data: {
    questions: [],
    answers: {},
    answered: 0,
    total: 0,
    error: '',
  },

  onShow() {
    const questions = getQuestions()
    const saved = getApp().globalData.quizAnswers || {}
    const answers = {}
    Object.keys(saved).forEach((k) => {
      answers[k] = saved[k]
    })
    this.setData({
      questions,
      answers,
      total: questions.length,
      answered: Object.keys(answers).length,
      error: '',
    })
  },

  onPick(e) {
    const qid = e.currentTarget.dataset.qid
    const oid = e.currentTarget.dataset.oid
    const answers = Object.assign({}, this.data.answers)
    answers[qid] = oid
    getApp().globalData.quizAnswers = answers
    this.setData({
      answers,
      answered: Object.keys(answers).length,
      error: '',
    })
  },

  onSubmit() {
    const { questions, answers } = this.data
    const missing = questions.find((q) => !answers[q.id])
    if (missing) {
      this.setData({ error: `请先完成：${missing.title}` })
      return
    }
    const result = matchClubs(answers, getAllClubs())
    getApp().globalData.recommendation = result
    getApp().globalData.basketIds = []
    wx.navigateTo({ url: '/pages/recommend/recommend' })
  },
})
