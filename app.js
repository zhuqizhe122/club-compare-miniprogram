const session = require('./store/session.js')

App({
  globalData: {
    session,
  },

  getSession() {
    return this.globalData.session
  },

  resetSession() {
    return this.globalData.session.reset()
  },
})
