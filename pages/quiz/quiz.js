const { questions } = require('../../data/quiz.js')
const { rankClubs } = require('../../utils/quiz.js')

Page({
  data: {
    currentIndex: 0,
    currentQuestion: questions[0],
    answers: {},
    selectedOptionId: '',
    progressText: `1 / ${questions.length}`,
    progressPercent: Math.round(100 / questions.length),
    isFirst: true,
    isLast: questions.length === 1,
    error: '',
  },

  onLoad() {
    getApp().globalData.quizRecommendations = []
  },

  showQuestion(index, answers) {
    const question = questions[index]
    this.setData({
      currentIndex: index,
      currentQuestion: question,
      answers,
      selectedOptionId: answers[question.id] || '',
      progressText: `${index + 1} / ${questions.length}`,
      progressPercent: Math.round(((index + 1) / questions.length) * 100),
      isFirst: index === 0,
      isLast: index === questions.length - 1,
      error: '',
    })
  },

  onOptionTap(e) {
    const optionId = e.currentTarget.dataset.id
    const answers = Object.assign({}, this.data.answers, {
      [this.data.currentQuestion.id]: optionId,
    })
    this.setData({
      answers,
      selectedOptionId: optionId,
      error: '',
    })
  },

  onPrevious() {
    if (this.data.currentIndex <= 0) return
    this.showQuestion(this.data.currentIndex - 1, this.data.answers)
  },

  onNext() {
    if (!this.data.selectedOptionId) {
      this.setData({ error: '请选择一个最接近你的选项' })
      return
    }

    if (!this.data.isLast) {
      this.showQuestion(this.data.currentIndex + 1, this.data.answers)
      return
    }

    const recommendations = rankClubs(this.data.answers, 3)
    if (recommendations.length !== 3) {
      this.setData({ error: '暂时无法生成结果，请重新检查答案' })
      return
    }
    getApp().globalData.quizRecommendations = recommendations
    wx.navigateTo({ url: '/pages/quiz-result/quiz-result' })
  },
})
