App({
  globalData: {
    selectedClubIds: [],
    tendency: null, // 'club:<id>' | 'none' | null
    quizRecommendations: [],
  },
  resetSelection() {
    this.globalData.selectedClubIds = []
    this.globalData.tendency = null
    this.globalData.quizRecommendations = []
  },
})
