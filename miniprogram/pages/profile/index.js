// pages/profile/index.js
const app = getApp()
const api = require('../../services/api')
const { USER_ROLE } = require('../../utils/constants')

Page({
  data: {
    loading: true,
    userInfo: null,
    showIdInfoPopup: false,
    version: '1.0.0',
    USER_ROLE: USER_ROLE
  },

  onLoad() {
    this.loadUserProfile()
  },

  onShow() {
    if (!this.data.loading) {
      this.loadUserProfile()
    }
  },

  onPullDownRefresh() {
    this.loadUserProfile()
    wx.stopPullDownRefresh()
  },

  loadUserProfile() {
    this.setData({ loading: true })

    api.getUserProfile().then(res => {
      this.setData({ loading: false })

      if (res.code === 200 || res.code === 0) {
        this.setData({
          userInfo: res.data
        })
      } else {
        wx.showToast({
          title: res.message || '获取用户信息失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      this.setData({ loading: false })
      wx.showToast({
        title: '网络请求失败',
        icon: 'none'
      })
      console.error('获取用户信息失败', err)
    })
  },

  goToRealNameAuth() {
    wx.navigateTo({
      url: '/pages/real-name/index'
    })
  },

  goToMyCreatedContracts() {
    wx.navigateTo({
      url: '/pages/my-contracts/index?type=created'
    })
  },

  goToMySignedContracts() {
    wx.navigateTo({
      url: '/pages/my-contracts/index?type=signed'
    })
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/index'
    })
  },

  goToHelp() {
    wx.navigateTo({
      url: '/pages/help/index'
    })
  },

  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/index'
    })
  },

  showIdInfo() {
    this.setData({
      showIdInfoPopup: true
    })
  },

  onApplyLessor() {
    wx.showModal({
      title: '申请成为甲方',
      content: '确定要申请成为甲方（出租方）吗？申请提交后需要管理员审核。',
      confirmText: '确认申请',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...' })
          api.applyLessor().then(result => {
            wx.hideLoading()
            if (result.code === 200) {
              wx.showToast({ title: '申请已提交，请等待审核', icon: 'success' })
            } else {
              wx.showToast({ title: result.message || '申请失败', icon: 'none' })
            }
          }).catch(() => {
            wx.hideLoading()
            wx.showToast({ title: '网络错误', icon: 'none' })
          })
        }
      }
    })
  },

  closeIdInfoPopup() {
    this.setData({
      showIdInfoPopup: false
    })
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          app.logout()

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })

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