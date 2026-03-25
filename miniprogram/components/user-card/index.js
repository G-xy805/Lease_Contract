// components/user-card/index.js
Component({
  properties: {
    user: {
      type: Object,
      value: null
    }
  },

  methods: {
    onClick() {
      this.triggerEvent('click')
    }
  }
})
