/**
 * form-section 表单分组容器组件
 * 表单区域的分组容器，带标题和必填标记
 * 支持折叠功能
 */

Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    description: {
      type: String,
      value: ''
    },
    required: {
      type: Boolean,
      value: false
    },
    collapsible: {
      type: Boolean,
      value: false
    },
    defaultExpanded: {
      type: Boolean,
      value: true
    }
  },

  data: {
    expanded: true
  },

  observers: {
    'defaultExpanded': function(defaultExpanded) {
      this.setData({
        expanded: defaultExpanded
      });
    }
  },

  lifetimes: {
    attached: function() {
      this.setData({
        expanded: this.properties.defaultExpanded
      });
    }
  },

  methods: {
    /**
     * 切换折叠状态
     */
    toggleCollapse() {
      if (!this.properties.collapsible) return;

      this.setData({
        expanded: !this.data.expanded
      });

      // 触发折叠/展开事件
      this.triggerEvent('toggle', { expanded: this.data.expanded });
    }
  }
});
