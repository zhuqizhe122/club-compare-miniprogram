App({
  globalData: {
    selectedClubIds: [],
    preferenceAnswers: {},
    recommendations: [],
    tendency: null, // 'club:<id>' | 'none' | null
  },
  resetSelection() {
    this.globalData.selectedClubIds = []
    this.globalData.preferenceAnswers = {}
    this.globalData.recommendations = []
    this.globalData.tendency = null
  },
})
