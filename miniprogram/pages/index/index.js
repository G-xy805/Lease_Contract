// pages/index/index.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    loading: false,
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
    this.loadData()
    wx.stopPullDownRefresh()
  },

  loadUserInfo() {
    const userInfo = app.globalData.userInfo
    this.setData({ userInfo })
    if (userInfo) {
      this.loadData()
    }
  },

  loadData() {
    this.setData({ loading: true })
    const role = this.data.userInfo?.role

    if (role === 'PARTY_A') {
      this.loadPartyAData()
    } else if (role === 'PARTY_B') {
      this.loadPartyBData()
    } else {
      this.setData({ loading: false })
    }
  },

  // 加载甲方数据
  loadPartyAData() {
    const token = app.globalData.token
    if (!token) {
      this.setData({ loading: false })
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
          // 取最近5条合同
          const recentContracts = contracts.slice(0, 5).map(c => ({
            ...c,
            statusText: this.getStatusText(c.status)
          }))
          this.setData({ stats, recentContracts })
        }
      },
      fail: () => {
        this.setData({ loading: false })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  // 加载乙方数据
  loadPartyBData() {
    const token = app.globalData.token
    if (!token) {
      this.setData({ loading: false })
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
            pendingInvitationCount: pendingList.length
          })
        }
      },
      fail: () => {
        this.setData({ loading: false })
      },
      complete: () => {
        this.setData({ loading: false })
      }
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

  // 跳转到创建合同
  goToCreateContract() {
    wx.navigateTo({
      url: '/pages/create-contract/index'
    })
  },

  // 跳转到合同列表
  goToContracts(e) {
    const status = e.currentTarget.dataset.status
    wx.navigateTo({
      url: `/pages/contracts/index?status=${status}`
    })
  },

  // 跳转到合同详情
  goToContractDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/contract-detail/index?id=${id}`
    })
  },

  // 跳转到签署邀请列表
  goToInvitations() {
    wx.navigateTo({
      url: '/pages/invitations/index'
    })
  },

  // 跳转到邀请预览
  goToInvitePreview(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/invite-preview/index?id=${id}`
    })
  },

  // 跳转到验证邀请码页面
  goToVerifyInvite() {
    wx.navigateTo({
      url: '/pages/verify-invite/index'
    })
  },

  // 扫码签署
  scanInviteCode() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        console.log('扫码结果', res)
        const result = res.result
        if (result) {
          // 尝试从URL中提取邀请码
          let inviteCode = result
          // 如果是URL，尝试提取code参数
          try {
            const url = new URL(result)
            inviteCode = url.searchParams.get('code') || result
          } catch (e) {
            // 如果不是有效URL，使用原始结果
          }
          wx.navigateTo({
            url: `/pages/verify-invite/index?code=${inviteCode}`
          })
        }
      },
      fail: (err) => {
        console.error('扫码失败', err)
        wx.showToast({
          title: '扫码失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 跳转到登录
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/index'
    })
  }
})
