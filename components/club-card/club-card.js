Component({
  properties: {
    club: { type: Object, value: {} },
    rank: { type: Number, value: 0 },
    score: { type: null, value: null },
    evidenceGrade: { type: String, value: 'U' },
    selected: { type: Boolean, value: false },
    reasons: { type: Array, value: [] },
    caution: { type: String, value: '' },
    costText: { type: String, value: '' },
    unknownText: { type: String, value: '' },
    selectable: { type: Boolean, value: true },
  },
  data: {
    showScore: false,
  },
  observers: {
    score(value) {
      this.setData({
        showScore: value !== '' && value !== undefined && value !== null,
      })
    },
  },
  methods: {
    onSelect() {
      this.triggerEvent('select', { id: this.data.club.id })
    },
    onDetail() {
      this.triggerEvent('detail', { id: this.data.club.id })
    },
  },
})
