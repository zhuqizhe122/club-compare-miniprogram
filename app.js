const session = require('./store/session.js')

// 强制纳入 data 依赖链，避免开发者工具“过滤无依赖文件”误删 inference/schema
require('./data/schema.js')
require('./data/inference.js')
require('./data/clubs.js')

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
