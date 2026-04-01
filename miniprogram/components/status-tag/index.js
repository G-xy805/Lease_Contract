Component({
  properties: {
    status: {
      type: Number,
      value: 1
    },
    size: {
      type: String,
      value: 'medium'
    }
  },

  data: {
    statusMap: {
      1: { color: '#FF976A', text: '待甲方签署' },
      2: { color: '#FF976A', text: '待乙方签署' },
      3: { color: '#07c160', text: '已签署' },
      4: { color: '#FF4D4F', text: '已拒绝' },
      5: { color: '#999999', text: '已取消' },
      6: { color: '#999999', text: '已到期' }
    },
    tagColor: '#999999',
    tagText: '未知状态'
  },

  observers: {
    'status': function(status) {
      const map = this.data.statusMap;
      const info = map[status] || { color: '#999999', text: '未知状态' };
      this.setData({
        tagColor: info.color,
        tagText: info.text
      });
    }
  },

  lifetimes: {
    attached: function() {
      const status = this.properties.status;
      const map = this.data.statusMap;
      const info = map[status] || { color: '#999999', text: '未知状态' };
      this.setData({
        tagColor: info.color,
        tagText: info.text
      });
    }
  }
});