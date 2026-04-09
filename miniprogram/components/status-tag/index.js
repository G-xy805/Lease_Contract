/**
 * status-tag 状态标签组件
 * 显示带颜色的状态标签，自动映射颜色和文字
 */

Component({
  properties: {
    status: {
      type: Number,
      value: 0
    },
    size: {
      type: String,
      value: 'md'
    },
    customText: {
      type: String,
      value: ''
    }
  },

  data: {
    // 状态映射配置
    STATUS_MAP: {
      1: { text: '待甲方签', type: 'primary', color: '#1989fa', bg: '#e8f4ff' },
      2: { text: '待乙方签', type: 'warning', color: '#ff976a', bg: '#fff7eb' },
      3: { text: '已签署', type: 'success', color: '#07c160', bg: '#e8fbe8' },
      4: { text: '已拒绝', type: 'danger', color: '#ee0a24', bg: '#ffece8' },
      5: { text: '已取消', type: 'default', color: '#969799', bg: '#f7f8fa' },
      6: { text: '已到期', type: 'default', color: '#969799', bg: '#f7f8fa' }
    },
    // 当前显示的状态信息
    currentColor: '#969799',
    currentBg: '#f7f8fa',
    currentText: '未知状态'
  },

  observers: {
    'status, customText': function(status, customText) {
      this.updateStatusInfo(status, customText);
    }
  },

  lifetimes: {
    attached: function() {
      const status = this.properties.status;
      const customText = this.properties.customText;
      this.updateStatusInfo(status, customText);
    }
  },

  methods: {
    /**
     * 更新状态信息
     * @param {number} status - 状态值
     * @param {string} customText - 自定义文字
     */
    updateStatusInfo(status, customText) {
      const map = this.data.STATUS_MAP;
      const info = map[status] || { color: '#969799', bg: '#f7f8fa', text: '未知状态' };

      this.setData({
        currentColor: info.color,
        currentBg: info.bg,
        currentText: customText || info.text
      });
    }
  }
});
