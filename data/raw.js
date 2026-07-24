/**
 * 原始资料层的稳定入口。
 *
 * 当前名单仍物理保存在 clubs.js，以避免一次迁移同时改写 98 条人工文案。
 * getRawClubs 延迟读取兼容模块，避免初始化环；调用方应视返回值为只读。
 */
function getRawClubs() {
  return require('./clubs.js').RAW_CLUBS
}

module.exports = { getRawClubs }
