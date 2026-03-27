// components/contract-card/index.js
const { CONTRACT_STATUS_TEXT, CONTRACT_STATUS_COLOR, USER_ROLE } = require('../../utils/constants')

Component({
  properties: {
    contract: {
      type: Object,
      value: {}
    },
    type: {
      type: String,
      value: USER_ROLE.LESSOR
    }
  },

  data: {
    CONTRACT_STATUS_TEXT,
    CONTRACT_STATUS_COLOR,
    USER_ROLE
  },

  methods: {
    onClick() {
      this.triggerEvent('click', { contract: this.data.contract })
    },

    getStatusColor(status) {
      return CONTRACT_STATUS_COLOR[status] || 'default'
    },

    getStatusText(status) {
      return CONTRACT_STATUS_TEXT[status] || '未知状态'
    }
  }
})
