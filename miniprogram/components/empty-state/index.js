/**
 * empty-state 空状态组件
 * 展示各种空状态（无数据/网络错误/加载失败等）
 */

Component({
  properties: {
    type: {
      type: String,
      value: 'no-data'
    },
    title: {
      type: String,
      value: ''
    },
    description: {
      type: String,
      value: ''
    },
    actionText: {
      type: String,
      value: ''
    },
    showAction: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 内置配置：根据type自动选择图标和文案
    TYPE_CONFIG: {
      'no-data': {
        icon: 'note',
        title: '暂无数据',
        description: '还没有相关内容'
      },
      'error': {
        icon: 'warn',
        title: '加载失败',
        description: '请稍后重试',
        actionText: '重试'
      },
      'no-network': {
        icon: 'info',
        title: '网络异常',
        description: '请检查网络连接',
        actionText: '刷新'
      },
      'no-permission': {
        icon: 'lock',
        title: '无权限',
        description: '您没有访问权限'
      }
    },
    // 当前显示的配置
    currentIcon: 'note',
    currentTitle: '暂无数据',
    currentDescription: '还没有相关内容',
    currentActionText: ''
  },

  observers: {
    'type, title, description, actionText': function(type, title, description, actionText) {
      this.updateConfig(type, title, description, actionText);
    }
  },

  lifetimes: {
    attached: function() {
      const { type, title, description, actionText } = this.properties;
      this.updateConfig(type, title, description, actionText);
    }
  },

  methods: {
    /**
     * 更新显示配置
     */
    updateConfig(type, title, description, actionText) {
      const config = this.data.TYPE_CONFIG[type] || this.data.TYPE_CONFIG['no-data'];

      this.setData({
        currentIcon: config.icon,
        currentTitle: title || config.title,
        currentDescription: description || config.description,
        currentActionText: actionText || (config.actionText || '')
      });
    },

    /**
     * 点击操作按钮
     */
    onActionTap() {
      this.triggerEvent('action');
    }
  }
});
