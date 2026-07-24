const {
  CATEGORY_LABELS,
  getClubsByIds,
  searchClubs,
} = require('../../data/clubs.js')
const {
  MATCH_QUESTIONS,
  LABELS,
  matchClubs,
} = require('../../utils/match.js')

function buildQuestions() {
  return MATCH_QUESTIONS.map((question) => ({
    key: question.key,
    title: question.title,
    options: question.options.map((value) => ({
      value,
      label: LABELS[value],
    })),
  }))
}

function buildCategories() {
  const items = [{ value: '', label: '全部' }]
  Object.keys(CATEGORY_LABELS).forEach((value) => {
    items.push({ value, label: CATEGORY_LABELS[value] })
  })
  return items
}

function markSelected(items, selectedIds, nested) {
  return (items || []).map((item) => {
    const id = nested ? item.club.id : item.id
    return Object.assign({}, item, {
      id,
      selected: selectedIds.indexOf(id) !== -1,
    })
  })
}

Page({
  data: {
    mode: 'guide',
    questions: buildQuestions(),
    currentQuestion: 0,
    answers: {},
    questionnaireComplete: false,
    recommendations: [],
    query: '',
    categories: buildCategories(),
    category: '',
    results: [],
    selectedIds: [],
    selectedClubs: [],
    canCompare: false,
    compareButtonText: '再选 1 个开始比较',
    error: '',
  },

  onShow() {
    const app = getApp()
    const answers = app.globalData.preferenceAnswers || {}
    const recommendations = app.globalData.recommendations || []
    const selectedIds = app.globalData.selectedClubIds || []
    this.setData({
      answers,
      recommendations,
      questionnaireComplete: recommendations.length > 0,
    })
    this.applySelection(selectedIds)
    this.runSearch()
  },

  onModeChange(e) {
    this.setData({ mode: e.currentTarget.dataset.mode, error: '' })
  },

  onAnswer(e) {
    const questionIndex = Number(e.currentTarget.dataset.question)
    const value = e.currentTarget.dataset.value
    const question = this.data.questions[questionIndex]
    const answers = Object.assign({}, this.data.answers)
    answers[question.key] = value
    getApp().globalData.preferenceAnswers = answers
    if (questionIndex < this.data.questions.length - 1) {
      this.setData({ answers, currentQuestion: questionIndex + 1, error: '' })
      return
    }
    const recommendations = markSelected(matchClubs(answers), this.data.selectedIds, true)
    getApp().globalData.recommendations = recommendations
    this.setData({
      answers,
      recommendations,
      questionnaireComplete: true,
      error: '',
    })
  },

  onEditAnswers() {
    getApp().globalData.recommendations = []
    this.setData({
      recommendations: [],
      questionnaireComplete: false,
      currentQuestion: 0,
      error: '',
    })
  },

  onClearAnswers() {
    const app = getApp()
    app.globalData.preferenceAnswers = {}
    app.globalData.recommendations = []
    this.setData({
      answers: {},
      recommendations: [],
      questionnaireComplete: false,
      currentQuestion: 0,
      error: '',
    })
  },

  onQueryInput(e) {
    this.setData({ query: e.detail.value }, () => this.runSearch())
  },

  onCategoryChange(e) {
    this.setData({ category: e.currentTarget.dataset.value }, () => this.runSearch())
  },

  runSearch() {
    const filters = this.data.category ? { category: this.data.category } : {}
    const results = searchClubs(this.data.query, filters)
    this.setData({ results: markSelected(results, this.data.selectedIds, false) })
  },

  applySelection(selectedIds, error) {
    const capped = (selectedIds || []).slice(0, 3)
    getApp().globalData.selectedClubIds = capped
    this.setData({
      selectedIds: capped,
      selectedClubs: getClubsByIds(capped),
      canCompare: capped.length >= 2,
      compareButtonText: capped.length < 2
        ? '再选 1 个开始比较'
        : '比较这 ' + capped.length + ' 个社团',
      recommendations: markSelected(this.data.recommendations, capped, true),
      results: markSelected(this.data.results, capped, false),
      error: error || '',
    })
  },

  onToggleClub(e) {
    const id = e.currentTarget.dataset.id
    const selected = this.data.selectedIds.slice()
    const index = selected.indexOf(id)
    if (index !== -1) {
      selected.splice(index, 1)
      this.applySelection(selected)
      return
    }
    if (selected.length >= 3) {
      this.setData({ error: '最多选择 3 个，请先移除一个候选' })
      return
    }
    selected.push(id)
    this.applySelection(selected)
  },

  onClearSelection() {
    this.applySelection([])
  },

  onCompare() {
    const { selectedIds } = this.data
    if (selectedIds.length < 2) {
      this.setData({ error: '再选 ' + (2 - selectedIds.length) + ' 个，就能开始比较' })
      return
    }
    getApp().globalData.selectedClubIds = selectedIds
    wx.navigateTo({ url: '/pages/compare/compare' })
  },
})
