function normalizeList(value) {
  if (Array.isArray(value)) return value
  if (value === null || value === undefined || value === '') return []
  return [value]
}

function createRepository(clubs) {
  const source = Array.isArray(clubs) ? clubs : []
  const byId = source.reduce((index, club) => {
    index[club.id] = club
    return index
  }, {})

  function getAllClubs() {
    return source
  }

  function getClubsByIds(ids) {
    const seen = {}
    return (Array.isArray(ids) ? ids : []).reduce((result, id) => {
      if (byId[id] && !seen[id]) {
        result.push(byId[id])
        seen[id] = true
      }
      return result
    }, [])
  }

  function searchClubs(query, filters) {
    const keyword = String(query || '').trim().toLowerCase()
    const rules = filters || {}
    return source.filter((club) => {
      const searchable = [
        club.name, club.tagline, club.categoryLabel, club.vibe,
      ].concat(club.tags || [], club.searchAliases || []).join(' ').toLowerCase()
      if (keyword && searchable.indexOf(keyword) === -1) return false
      return ['category', 'timeBand', 'intensity', 'socialStyle', 'skillBarrier', 'commitment']
        .every((key) => {
          const accepted = normalizeList(rules[key])
          return accepted.length === 0 || accepted.indexOf(club[key]) !== -1
        })
    })
  }

  return { getAllClubs, getClubsByIds, searchClubs }
}

module.exports = { createRepository, normalizeList }
