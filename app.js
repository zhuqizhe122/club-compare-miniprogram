App({
  globalData: {
    selectedClubIds: [],
    tendency: null, // 'club:<id>' | 'none' | null
  },
  resetSelection() {
    this.globalData.selectedClubIds = []
    this.globalData.tendency = null
  },
})
