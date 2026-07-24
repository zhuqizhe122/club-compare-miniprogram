Component({
  properties: {
    club: { type: Object, value: {} },
    rank: { type: Number, value: 0 },
    score: { type: Number, value: 0 },
    evidenceGrade: { type: String, value: 'U' },
    selected: { type: Boolean, value: false },
    reasons: { type: Array, value: [] },
    caution: { type: String, value: '' },
    selectable: { type: Boolean, value: true },
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
