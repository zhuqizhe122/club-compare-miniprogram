Component({
  properties: {
    label: { type: String, value: '' },
    value: {
      type: Number,
      value: 0,
      observer(value) {
        const normalized = Math.max(0, Math.min(100, Number(value) || 0))
        this.setData({ normalized })
      },
    },
    note: { type: String, value: '' },
    unknown: { type: Boolean, value: false },
  },
  data: {
    normalized: 0,
  },
})
