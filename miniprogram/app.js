/**
 * @file 租赁合同微信小程序入口文件
 * @author your-name
 */

const { APP_CONFIG } = require('./utils/constants')

App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:3000',
    loginExpiresAt: null
  },

  _tokenTimer: null,

  onLaunch() {
    this.checkLoginStatus()
  },

  onShow() {
    console.log('小程序启动')
    if (this.globalData.token && this.globalData.loginExpiresAt) {
      this.scheduleTokenRefresh()
    }
  },

  onHide() {
    console.log('小程序隐藏')
    this.clearTokenTimer()
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const loginExpiresAt = wx.getStorageSync('loginExpiresAt')

    if (token && userInfo) {
      if (loginExpiresAt && Date.now() > loginExpiresAt) {
        this.logout()
        return
      }
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.loginExpiresAt = loginExpiresAt
      this.scheduleTokenRefresh()
    }
  },

  scheduleTokenRefresh() {
    this.clearTokenTimer()

    const expiresAt = this.globalData.loginExpiresAt
    if (!expiresAt) return

    const remainingTime = expiresAt - Date.now()
    const refreshThreshold = APP_CONFIG.TOKEN_REFRESH_THRESHOLD

    if (remainingTime > 0 && remainingTime < refreshThreshold) {
      this.refreshToken()
    } else if (remainingTime > refreshThreshold) {
      const timeout = remainingTime - refreshThreshold
      this._tokenTimer = setTimeout(() => {
        this.refreshToken()
      }, timeout)
    }
  },

  clearTokenTimer() {
    if (this._tokenTimer) {
      clearTimeout(this._tokenTimer)
      this._tokenTimer = null
    }
  },

  async refreshToken() {
    try {
      const res = await wx.request({
        url: `${this.globalData.baseUrl}/api/refresh-token`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${this.globalData.token}`
        }
      })
      if (res.data && res.data.token) {
        this.login(res.data.userInfo, res.data.token, res.data.expiresIn)
      }
    } catch (err) {
      console.log('Token refresh failed', err)
    }
  },

  login(userInfo, token, expiresIn = 7 * 24 * 60 * 60 * 1000) {
    const loginExpiresAt = Date.now() + expiresIn
    this.globalData.userInfo = userInfo
    this.globalData.token = token
    this.globalData.loginExpiresAt = loginExpiresAt
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('token', token)
    wx.setStorageSync('loginExpiresAt', loginExpiresAt)
  },

  logout() {
    this.globalData.userInfo = null
    this.globalData.token = null
    this.globalData.loginExpiresAt = null
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('token')
    wx.removeStorageSync('loginExpiresAt')
  },

  isLoggedIn() {
    if (!this.globalData.token) return false
    if (this.globalData.loginExpiresAt && Date.now() > this.globalData.loginExpiresAt) {
      this.logout()
      return false
    }
    return true
  },

  getUserInfo() {
    return this.globalData.userInfo
  },

  getToken() {
    return this.globalData.token
  },

  getUserRole() {
    const userInfo = this.globalData.userInfo
    return userInfo?.role || null
  },

  isLessor() {
    const role = (this.getUserRole() || '').toLowerCase()
    return role === 'lessor' || role === 'admin'
  },

  isLessee() {
    return this.getUserRole() === 'lessee'
  }
})
