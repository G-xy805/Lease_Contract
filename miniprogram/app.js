/**
 * @file 租赁合同微信小程序入口文件
 * @author your-name
 */

const { APP_CONFIG } = require('./utils/constants')

App({
  globalData: {
    // === 现有字段保持不变 ===
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:3000',
    loginExpiresAt: null,

    // === 新增缓存系统 ===
    contractListCache: {},
    templateCache: [],
    dictionaryCache: {},

    // === 新增UI状态 ===
    networkStatus: 'online',
    lastSyncTime: null
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
    const loginExpiresAt = Date.now() + expiresIn;
    this.globalData.userInfo = userInfo;
    this.globalData.token = token;
    this.globalData.loginExpiresAt = loginExpiresAt;

    // 同步写入本地存储
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('token', token);
    wx.setStorageSync('loginExpiresAt', loginExpiresAt);

    // 初始化缓存结构
    this.globalData.contractListCache = {};
    this.globalData.templateCache = [];
    this.globalData.dictionaryCache = {};

    console.log('用户登录成功:', userInfo?.username || userInfo?.phone || '未知用户');
  },

  logout() {
    // 清除所有缓存数据
    this.clearCache();

    // 清除用户状态
    this.globalData.userInfo = null;
    this.globalData.token = null;
    this.globalData.loginExpiresAt = null;
    this.globalData.lastSyncTime = null;

    // 清除本地存储
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
    wx.removeStorageSync('loginExpiresAt');

    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/login/index'
    });

    console.log('用户已登出');
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
  },

  // ===== 缓存管理方法 =====

  /**
   * 清除所有缓存
   */
  clearCache() {
    this.globalData.contractListCache = {};
    this.globalData.templateCache = [];
    this.globalData.dictionaryCache = {};
    try {
      wx.removeStorageSync('contractListCache');
      wx.removeStorageSync('templateCache');
    } catch (e) {
      console.error('清除缓存失败:', e);
    }
  },

  /**
   * 获取合同列表缓存
   * @param {string} type - 缓存类型（landlord/tenant）
   * @returns {Array|null} 缓存的数据或null
   */
  getContractListCache(type) {
    const cached = this.globalData.contractListCache[type];
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }
    return null;
  },

  /**
   * 设置合同列表缓存
   * @param {string} type - 缓存类型（landlord/tenant）
   * @param {Array} data - 合同列表数据
   */
  setContractListCache(type, data) {
    this.globalData.contractListCache[type] = {
      data: data,
      timestamp: Date.now()
    };
  },

  /**
   * 强制刷新用户数据
   * 从服务器重新获取用户信息并更新本地存储
   */
  async refreshUserData() {
    if (!this.globalData.token) return;
    try {
      const api = require('./services/api').default;
      const res = await api.getProfile();
      if (res.code === 200) {
        this.globalData.userInfo = res.data;
        wx.setStorageSync('userInfo', res.data);
      }
    } catch (e) {
      console.error('刷新用户数据失败:', e);
    }
  }
})
