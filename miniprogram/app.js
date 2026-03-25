/**
 * @file 租赁合同微信小程序入口文件
 * @author your-name
 */

App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:3000'
  },

  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    console.log('小程序启动')
  },

  onHide() {
    console.log('小程序隐藏')
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')

    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
  },

  login(userInfo, token) {
    this.globalData.userInfo = userInfo
    this.globalData.token = token
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('token', token)
  },

  logout() {
    this.globalData.userInfo = null
    this.globalData.token = null
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('token')
  },

  isLoggedIn() {
    return !!this.globalData.token
  }
})
