const { CONTRACT_STATUS_TEXT, CONTRACT_STATUS_COLOR, USER_ROLE } = require('../../utils/constants')

Component({
  properties: {
    contract: {
      type: Object,
      value: {}
    },
    role: {
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
      this.triggerEvent('click', { id: this.data.contract.id })
    },

    getStatusColor(status) {
      return CONTRACT_STATUS_COLOR[status] || 'default'
    },

    getStatusText(status) {
      return CONTRACT_STATUS_TEXT[status] || '未知状态'
    },

    getCounterpartyName() {
      const { contract, role } = this.data
      if (role === USER_ROLE.LESSOR) {
        return contract.partyB_name || contract.lessee_name || '未知'
      } else {
        return contract.partyA_name || contract.lessor_name || '未知'
      }
    },

    getLessorSigned() {
      const status = this.data.contract.lessor_sign_status ?? this.data.contract.lessor_signed
      return status === 1
    },

    getLesseeSigned() {
      const status = this.data.contract.lessee_sign_status ?? this.data.contract.lessee_signed
      return status === 1
    }
  }
})