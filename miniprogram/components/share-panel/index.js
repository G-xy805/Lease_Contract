/**
 * share-panel 分享面板组件
 * 展示分享选项面板（邀请码、二维码、复制链接等）
 */

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    inviteCode: {
      type: String,
      value: ''
    },
    qrCodeUrl: {
      type: String,
      value: ''
    },
    shareUrl: {
      type: String,
      value: ''
    },
    expiresAt: {
      type: String,
      value: ''
    }
  },

  data: {
    visible: false,
    copied: false
  },

  observers: {
    'show': function(show) {
      if (show) {
        // 延迟显示，确保过渡动画生效
        setTimeout(() => {
          this.setData({ visible: true, copied: false });
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
      this.closePanel();
    },

    /**
     * 复制邀请码
     */
    onCopyCode() {
      if (!this.properties.inviteCode) return;

      wx.setClipboardData({
        data: this.properties.inviteCode,
        success: () => {
          this.setData({ copied: true });
          wx.showToast({
            title: '复制成功',
            icon: 'success'
          });
          this.triggerEvent('copy-code', { code: this.properties.inviteCode });
        },
        fail: () => {
          wx.showToast({
            title: '复制失败',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 保存二维码到相册
     */
    onSaveQr() {
      if (!this.properties.qrCodeUrl) {
        wx.showToast({
          title: '暂无二维码',
          icon: 'none'
        });
        return;
      }

      // 判断是URL还是Base64
      if (this.properties.qrCodeUrl.startsWith('data:image')) {
        // Base64 图片，先保存为临时文件再保存到相册
        this.saveBase64ToAlbum(this.properties.qrCodeUrl);
      } else {
        // URL图片，直接下载保存
        this.saveUrlToAlbum(this.properties.qrCodeUrl);
      }

      this.triggerEvent('save-qr');
    },

    /**
     * 保存Base64图片到相册
     */
    saveBase64ToAlbum(base64Data) {
      const fs = wx.getFileSystemManager();
      const tempPath = `${wx.env.USER_DATA_PATH}/qrcode_${Date.now()}.png`;

      try {
        // 将Base64写入临时文件
        fs.writeFileSync(tempPath, base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');

        // 保存到相册
        wx.saveImageToPhotosAlbum({
          filePath: tempPath,
          success: () => {
            wx.showToast({
              title: '已保存到相册',
              icon: 'success'
            });
          },
          fail: (err) => {
            console.error('保存失败:', err);
            if (err.errMsg.indexOf('auth deny') !== -1 || err.errMsg.indexOf('authorize') !== -1) {
              wx.showModal({
                title: '提示',
                content: '需要您授权保存相册权限',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
          }
        });
      } catch (e) {
        console.error('文件操作失败:', e);
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    },

    /**
     * 保存URL图片到相册
     */
    saveUrlToAlbum(url) {
      wx.downloadFile({
        url: url,
        success: (res) => {
          if (res.statusCode === 200) {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                wx.showToast({
                  title: '已保存到相册',
                  icon: 'success'
                });
              },
              fail: (err) => {
                console.error('保存失败:', err);
                wx.showToast({
                  title: '保存失败',
                  icon: 'none'
                });
              }
            });
          }
        },
        fail: () => {
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 微信分享
     */
    onShareWechat() {
      this.triggerEvent('share-wechat', {
        inviteCode: this.properties.inviteCode,
        shareUrl: this.properties.shareUrl
      });

      // 关闭面板
      this.closePanel();
    },

    /**
     * 关闭面板
     */
    closePanel() {
      this.setData({
        show: false,
        visible: false
      });
      this.triggerEvent('close');
    },

    /**
     * 阻止事件冒泡
     */
    stopPropagation() {
      // 空方法，仅用于阻止事件冒泡
    }
  }
});
