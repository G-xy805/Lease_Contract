// pages/profile/index.js
const app = getApp()

Page({
  data: {
    loading: true,
    userInfo: null,
    showIdInfoPopup: false,
    version: '1.0.0'
  },

  onLoad() {
    this.loadUserProfile()
  },

  onShow() {
    // 每次显示页面时刷新用户信息
    if (!this.data.loading) {
      this.loadUserProfile()
    }
  },

  onPullDownRefresh() {
    this.loadUserProfile()
    wx.stopPullDownRefresh()
  },

  /**
   * 加载用户信息
   */
  loadUserProfile() {
    this.setData({ loading: true })

    wx.request({
      url: `${app.globalData.baseUrl}/api/users/profile`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        this.setData({ loading: false })

        if (res.data.code === 200 || res.data.code === 0) {
          this.setData({
            userInfo: res.data.data
          })
        } else {
          wx.showToast({
            title: res.data.message || '获取用户信息失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        this.setData({ loading: false })
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        console.error('获取用户信息失败', err)
      }
    })
  },

  /**
   * 跳转到实名认证页面
   */
  goToRealNameAuth() {
    wx.navigateTo({
      url: '/pages/real-name/index'
    })
  },

  /**
   * 跳转到我创建的合同
   */
  goToMyCreatedContracts() {
    wx.navigateTo({
      url: '/pages/my-contracts/index?type=created'
    })
  },

  /**
   * 跳转到我签署的合同
   */
  goToMySignedContracts() {
    wx.navigateTo({
      url: '/pages/my-contracts/index?type=signed'
    })
  },

  /**
   * 跳转设置页面
   */
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/index'
    })
  },

  /**
   * 跳转帮助与反馈页面
   */
  goToHelp() {
    wx.navigateTo({
      url: '/pages/help/index'
    })
  },

  /**
   * 跳转关于我们页面
   */
  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/index'
    })
  },

  /**
   * 显示身份信息弹窗
   */
  showIdInfo() {
    this.setData({
      showIdInfoPopup: true
    })
  },

  /**
   * 关闭身份信息弹窗
   */
  closeIdInfoPopup() {
    this.setData({
      showIdInfoPopup: false
    })
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息
          app.logout()

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })

          // 跳转登录页
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/index'
            })
          }, 1500)
        }
      }
    })
  }
})
