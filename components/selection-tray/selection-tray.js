Component({
  properties: {
    clubs: { type: Array, value: [] },
    min: { type: Number, value: 2 },
    max: { type: Number, value: 3 },
    buttonText: { type: String, value: '进入候选确认' },
  },
  methods: {
    onRemove(event) {
      this.triggerEvent('remove', { id: event.currentTarget.dataset.id })
    },
    onContinue() {
      this.triggerEvent('continue')
    },
  },
})
