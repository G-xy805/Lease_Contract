// pages/index/index.js
const app = getApp()
const api = require('../../services/api')
const { USER_ROLE, CONTRACT_STATUS_TEXT } = require('../../utils/constants')

Page({
  data: {
    userInfo: null,
    loading: false,
    USER_ROLE: USER_ROLE,
    // 骨架屏显示
    skeletonVisible: false,
    // 甲方统计数据
    stats: {
      totalCount: 0,
      pendingSignCount: 0,
      signedCount: 0
    },
    // 最近合同列表（甲方）
    recentContracts: [],
    // 乙方待签署数量
    pendingSignCount: 0
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    if (this.data.userInfo) {
      this.loadData()
    }
  },

  onPullDownRefresh() {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.navigateTo({
        url: '/pages/login/index'
      })
      return
    }
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    this.setData({ skeletonVisible: true })
    api.getProfile().then(res => {
      if (res.data) {
        const userInfo = res.data
        const roleName = userInfo.role === 'LESSOR' ? '甲方' : userInfo.role === 'ADMIN' ? '管理员' : '乙方'
        userInfo.roleName = roleName
        app.globalData.userInfo = userInfo
        this.setData({ userInfo }, () => {
          this.loadData()
        })
      }
    }).catch(err => {
      console.error('获取用户信息失败', err)
      this.setData({ skeletonVisible: false })
      if (err.code === 401) {
        wx.navigateTo({ url: '/pages/login/index' })
      }
    })
  },

  // 统一数据加载入口
  loadData() {
    this.setData({ loading: true, errorInfo: null })
    const role = this.data.userInfo?.role

    if (role === 'LESSOR' || role === 'ADMIN') {
      this.loadContracts('landlord', { page: 1, page_size: 3 })
    } else if (role === 'LESSEE') {
      this.loadContracts('tenant', { page: 1, page_size: 3 })
    } else {
      this.setData({ loading: false, skeletonVisible: false })
    }
  },

  // 通用合同数据加载
  loadContracts(type, params) {
    const apiFunc = type === 'landlord' ? api.getLandlordContracts : api.getTenantContracts
    
    apiFunc(params).then(res => {
      const contracts = res.data?.list || []
      
      let stats = {}
      let recentContracts = []
      let pendingSignCount = 0
      
      if (type === 'landlord') {
        // 甲方统计数据
        stats = {
          totalCount: contracts.length,
          pendingSignCount: contracts.filter(c => c.status === 2).length,
          signedCount: contracts.filter(c => c.status === 3).length
        }
        recentContracts = contracts.slice(0, 3).map(c => ({
          ...c,
          statusText: CONTRACT_STATUS_TEXT[c.status] || '未知'
        }))
        this.setData({
          stats,
          recentContracts,
          loading: false,
          skeletonVisible: false
        })
      } else if (type === 'tenant') {
        // 乙方待签署数量
        pendingSignCount = contracts.filter(c => c.lessee_sign_status === 0 && c.status === 2).length
        recentContracts = contracts.slice(0, 3).map(c => ({
          ...c,
          statusText: CONTRACT_STATUS_TEXT[c.status] || '未知'
        }))
        this.setData({
          pendingSignCount,
          recentContracts,
          loading: false,
          skeletonVisible: false
        })
      }
    }).catch(err => {
      console.error(`${type}数据加载失败`, err)
      this.setData({ loading: false, skeletonVisible: false })
    })
  },

  // 跳转到创建合同
  goToCreateContract() {
    wx.navigateTo({
      url: '/pages/create-contract/index'
    })
  },

  // 跳转到合同列表
  goToContracts() {
    wx.navigateTo({
      url: '/pages/contracts/index'
    })
  },

  // 跳转到我的合同（乙方）
  goToMyContracts() {
    wx.navigateTo({
      url: '/pages/my-contracts/index'
    })
  },

  // 跳转到合同详情
  goToContractDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/contract-detail/index?id=${id}`
    })
  },

  // 跳转到登录
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/index'
    })
  }
})