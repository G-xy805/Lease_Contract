/**
 * confirm-dialog 确认对话框组件
 * 统一的确认对话框，支持自定义按钮样式
 */

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '提示'
    },
    content: {
      type: String,
      value: ''
    },
    confirmText: {
      type: String,
      value: '确认'
    },
    cancelText: {
      type: String,
      value: '取消'
    },
    confirmColor: {
      type: String,
      value: '#ee0a24'
    },
    asyncClose: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 控制动画状态
    visible: false
  },

  observers: {
    'show': function(show) {
      if (show) {
        // 延迟显示，确保过渡动画生效
        setTimeout(() => {
          this.setData({ visible: true });
        }, 50);
      } else {
        this.setData({ visible: false });
      }
    }
  },

  methods: {
    /**
     * 点击遮罩层关闭
     */
    onMaskTap() {
      this.handleCancel();
    },

    /**
     * 点击取消按钮
     */
    onCancelTap() {
      this.handleCancel();
    },

    /**
     * 点击确认按钮
     */
    onConfirmTap() {
      if (this.properties.asyncClose) {
        // 异步关闭模式：触发事件但不自动关闭
        this.triggerEvent('confirm');
      } else {
        // 同步关闭模式：先触发事件再关闭
        this.triggerEvent('confirm');
        this.closeDialog();
      }
    },

    /**
     * 处理取消操作
     */
    handleCancel() {
      this.triggerEvent('cancel');
      this.closeDialog();
    },

    /**
     * 关闭对话框
     */
    closeDialog() {
      this.setData({
        show: false,
        visible: false
      });
      this.triggerEvent('close');
    },

    /**
     * 阻止事件冒泡（防止点击内容区域时触发遮罩关闭）
     */
    stopPropagation() {
      // 空方法，仅用于阻止事件冒泡
    }
  }
});
