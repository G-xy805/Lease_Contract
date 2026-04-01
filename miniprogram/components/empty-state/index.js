Component({
  properties: {
    type: {
      type: String,
      value: 'no-data'
    },
    text: {
      type: String,
      value: ''
    },
    showButton: {
      type: Boolean,
      value: false
    },
    buttonText: {
      type: String,
      value: '重新加载'
    }
  },

  data: {
    defaultTextMap: {
      'no-data': '暂无数据',
      'no-contract': '暂无合同',
      'no-result': '未搜索到结果',
      'error': '加载失败'
    },
    iconMap: {
      'no-data': 'empty',
      'no-contract': 'description',
      'no-result': 'search',
      'error': 'warning'
    },
    displayText: '暂无数据'
  },

  observers: {
    'type, text': function(type, text) {
      const displayText = text || this.data.defaultTextMap[type] || '暂无数据';
      this.setData({ displayText });
    }
  },

  lifetimes: {
    attached: function() {
      const type = this.properties.type;
      const text = this.properties.text;
      const displayText = text || this.data.defaultTextMap[type] || '暂无数据';
      this.setData({ displayText });
    }
  },

  methods: {
    onButtonClick() {
      this.triggerEvent('click');
    }
  }
});