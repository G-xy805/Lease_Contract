// pages/index/index.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    loading: false,
    // 加载状态细分
    loadingStates: {
      stats: false,
      contracts: false
    },
    // 骨架屏显示
    skeletonVisible: false,
    // 点击反馈
    activeType: null,
    // 错误状态
    errorInfo: null,
    // 甲方统计数据
    stats: {
      draftCount: 0,
      pendingSignCount: 0,
      signedCount: 0
    },
    // 甲方最近合同
    recentContracts: [],
    // 乙方待签署列表
    pendingList: [],
    // 乙方已签署列表
    signedList: [],
    // 乙方待签署邀请数量
    pendingInvitationCount: 0
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
  },

  onPullDownRefresh() {
    this.loadData(true)
    wx.stopPullDownRefresh()
  },

  // 用户信息加载
  loadUserInfo() {
    const userInfo = app.globalData.userInfo
    this.setData({ userInfo })
    if (userInfo) {
      this.loadData()
    } else {
      this.setData({ skeletonVisible: false, loading: false })
    }
  },

  // 统一数据加载入口
  loadData(isRefresh = false) {
    this.setData({
      loading: true,
      skeletonVisible: !isRefresh,
      errorInfo: null,
      [`loadingStates.stats`]: true,
      [`loadingStates.contracts`]: true
    })
    const role = this.data.userInfo?.role

    if (role === 'PARTY_A') {
      this.loadPartyAData()
    } else if (role === 'PARTY_B') {
      this.loadPartyBData()
    } else {
      this.setData({ loading: false, skeletonVisible: false })
    }
  },

  // 重新加载数据（用于错误重试）
  reloadData() {
    this.setData({ errorInfo: null })
    this.loadData(true)
  },

  // 甲方数据加载
  loadPartyAData() {
    const token = app.globalData.token
    if (!token) {
      this.handleLoadError('未登录，请先登录')
      return
    }

    wx.request({
      url: `${app.globalData.baseUrl}/api/contracts/landlord`,
      header: { Authorization: `Bearer ${token}` },
      success: (res) => {
        if (res.data.code === 200) {
          const contracts = res.data.data?.list || []
          const stats = {
            draftCount: contracts.filter(c => c.status === 1).length,
            pendingSignCount: contracts.filter(c => c.status === 2 || c.status === 3).length,
            signedCount: contracts.filter(c => c.status === 4).length
          }
          const recentContracts = contracts.slice(0, 5).map(c => ({
            ...c,
            statusText: this.getStatusText(c.status)
          }))
          this.setData({
            stats,
            recentContracts,
            [`loadingStates.stats`]: false,
            [`loadingStates.contracts`]: false
          }, () => {
            this.setData({ loading: false, skeletonVisible: false })
          })
        } else {
          this.handleLoadError(res.data.message || '加载失败')
        }
      },
      fail: (err) => {
        this.handleLoadError('网络请求失败，请检查网络连接')
        console.error('甲方数据加载失败', err)
      }
    })
  },

  // 乙方数据加载
  loadPartyBData() {
    const token = app.globalData.token
    if (!token) {
      this.handleLoadError('未登录，请先登录')
      return
    }

    wx.request({
      url: `${app.globalData.baseUrl}/api/invitations`,
      header: { Authorization: `Bearer ${token}` },
      success: (res) => {
        if (res.data.code === 0) {
          const invitations = res.data.data || []
          const pendingList = invitations
            .filter(i => i.status === 'pending')
            .map(i => ({
              id: i.id,
              title: i.contractTitle,
              partyAName: i.partyA,
              status: i.status
            }))
          const signedList = invitations
            .filter(i => i.status === 'signed')
            .map(i => ({
              id: i.id,
              title: i.contractTitle,
              signedAt: i.signedAt || i.updatedAt
            }))
          this.setData({
            pendingList,
            signedList,
            pendingInvitationCount: pendingList.length,
            [`loadingStates.stats`]: false,
            [`loadingStates.contracts`]: false
          }, () => {
            this.setData({ loading: false, skeletonVisible: false })
          })
        } else {
          this.handleLoadError(res.data.message || '加载失败')
        }
      },
      fail: (err) => {
        this.handleLoadError('网络请求失败，请检查网络连接')
        console.error('乙方数据加载失败', err)
      }
    })
  },

  // 处理加载错误
  handleLoadError(message) {
    this.setData({
      loading: false,
      skeletonVisible: false,
      errorInfo: message,
      [`loadingStates.stats`]: false,
      [`loadingStates.contracts`]: false
    })
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      1: '草稿',
      2: '待甲方签署',
      3: '待乙方签署',
      4: '已签署',
      5: '已取消',
      6: '已拒绝',
      7: '已到期'
    }
    return statusMap[status] || status
  },

  // 设置点击反馈
  setActiveFeedback(type, callback) {
    this.setData({ activeType: type })
    if (callback) {
      setTimeout(() => {
        this.setData({ activeType: null })
        callback()
      }, 150)
    } else {
      setTimeout(() => {
        this.setData({ activeType: null })
      }, 150)
    }
  },

  // 跳转到创建合同（带点击反馈和loading）
  goToCreateContract() {
    this.setActiveFeedback('create', () => {
      wx.navigateTo({
        url: '/pages/create-contract/index'
      })
    })
  },

  // 跳转到合同列表（带点击反馈和loading）
  goToContracts(e) {
    const status = e.currentTarget.dataset.status
    const type = e.currentTarget.dataset.type
    this.setActiveFeedback(`contracts-${type || status}`, () => {
      wx.navigateTo({
        url: `/pages/contracts/index?status=${status}`
      })
    })
  },

  // 跳转到合同详情（带点击反馈和loading）
  goToContractDetail(e) {
    const { id } = e.currentTarget.dataset
    this.setActiveFeedback('contract-item', () => {
      // 显示loading提示
      wx.showLoading({ title: '加载中...', mask: true })
      wx.navigateTo({
        url: `/pages/contract-detail/index?id=${id}`,
        fail: () => {
          wx.hideLoading()
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    })
  },

  // 跳转到签署邀请列表
  goToInvitations() {
    this.setActiveFeedback('invitations', () => {
      wx.navigateTo({
        url: '/pages/invitations/index'
      })
    })
  },

  // 跳转到邀请预览
  goToInvitePreview(e) {
    const { id } = e.currentTarget.dataset
    this.setActiveFeedback('invite-item', () => {
      wx.showLoading({ title: '加载中...', mask: true })
      wx.navigateTo({
        url: `/pages/invite-preview/index?id=${id}`,
        fail: () => {
          wx.hideLoading()
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    })
  },

  // 跳转到验证邀请码页面
  goToVerifyInvite() {
    this.setActiveFeedback('verify-invite', () => {
      wx.navigateTo({
        url: '/pages/verify-invite/index'
      })
    })
  },

  // 扫码签署
  scanInviteCode() {
    this.setActiveFeedback('scan')
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        console.log('扫码结果', res)
        const result = res.result
        if (result) {
          let inviteCode = result
          try {
            const url = new URL(result)
            inviteCode = url.searchParams.get('code') || result
          } catch (e) {
            // 非有效URL，使用原始结果
          }
          wx.navigateTo({
            url: `/pages/verify-invite/index?code=${inviteCode}`
          })
        } else {
          wx.showToast({
            title: '未识别到邀请码',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('扫码失败', err)
        // 用户取消扫码不显示错误提示
        if (err.errMsg !== 'scanCode:fail cancel') {
          wx.showToast({
            title: '扫码失败，请重试',
            icon: 'none'
          })
        }
      }
    })
  },

  // 跳转到登录
  goToLogin() {
    this.setActiveFeedback('login', () => {
      wx.navigateTo({
        url: '/pages/login/index'
      })
    })
  }
})
