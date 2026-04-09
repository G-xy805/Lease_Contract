/**
 * contract-card 合同卡片组件
 * 在合同列表中展示单个合同的摘要信息卡片
 */

Component({
  properties: {
    id: {
      type: Number,
      value: null
    },
    title: {
      type: String,
      value: ''
    },
    address: {
      type: String,
      value: ''
    },
    status: {
      type: Number,
      value: 0
    },
    monthlyRent: {
      type: Number,
      value: 0
    },
    partyA: {
      type: String,
      value: ''
    },
    partyB: {
      type: String,
      value: ''
    },
    createdAt: {
      type: String,
      value: ''
    },
    leaseStart: {
      type: String,
      value: ''
    },
    leaseEnd: {
      type: String,
      value: ''
    }
  },

  methods: {
    /**
     * 点击卡片事件
     */
    onTap() {
      this.triggerEvent('tap', { id: this.properties.id });
    }
  }
});
