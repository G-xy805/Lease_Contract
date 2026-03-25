// pages/verify-invite/index.js
const app = getApp()
const api = require('../../services/api')

Page({
  data: {
    inviteCode: '',
    contractInfo: null,
    loading: false,
    verified: false,
    errorMessage: ''
  },

  onLoad(options) {
    if (options.code) {
      this.setData({ inviteCode: options.code })
      this.verifyInviteCode()
    }
  },

  onInviteCodeInput(e) {
    this.setData({
      inviteCode: e.detail.value,
      errorMessage: ''
    })
  },

  async verifyInviteCode() {
    const { inviteCode } = this.data

    if (!inviteCode || inviteCode.length < 6) {
      this.setData({ errorMessage: '请输入正确的邀请码' })
      return
    }

    this.setData({ loading: true, errorMessage: '' })

    try {
      const res = await api.verifyInviteCode(inviteCode)

      if (res.code === 200) {
        this.setData({
          contractInfo: res.data,
          verified: true,
          loading: false
        })
      } else {
        this.setData({
          errorMessage: res.message || '邀请码无效',
          loading: false
        })
      }
    } catch (error) {
      console.error('验证邀请码失败', error)
      this.setData({
        errorMessage: '验证失败，请稍后重试',
        loading: false
      })
    }
  },

  async acceptInvitation() {
    const { inviteCode, contractInfo } = this.data
    const userInfo = app.globalData.userInfo

    if (!userInfo) {
      wx.navigateTo({ url: '/pages/login/index' })
      return
    }

    this.setData({ loading: true })

    try {
      const res = await api.acceptInvitation(inviteCode, userInfo.phone)

      if (res.code === 200) {
        wx.showToast({ title: '已接受邀请', icon: 'success' })
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/sign-contract/index?contractId=${contractInfo.contract_id}&isPartyA=false`
          })
        }, 1500)
      } else {
        wx.showToast({ title: res.message || '接受失败', icon: 'none' })
        this.setData({ loading: false })
      }
    } catch (error) {
      console.error('接受邀请失败', error)
      wx.showToast({ title: '操作失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  async rejectInvitation() {
    const { inviteCode, contractInfo } = this.data
    const userInfo = app.globalData.userInfo

    if (!userInfo) {
      wx.navigateTo({ url: '/pages/login/index' })
      return
    }

    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝签署此合同吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ loading: true })
          try {
            const result = await api.rejectInvitation(inviteCode, userInfo.phone)

            if (result.code === 200) {
              wx.showToast({ title: '已拒绝', icon: 'success' })
              setTimeout(() => {
                wx.switchTab({ url: '/pages/my-contracts/index' })
              }, 1500)
            } else {
              wx.showToast({ title: result.message || '操作失败', icon: 'none' })
              this.setData({ loading: false })
            }
          } catch (error) {
            console.error('拒绝邀请失败', error)
            wx.showToast({ title: '操作失败', icon: 'none' })
            this.setData({ loading: false })
          }
        }
      }
    })
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  }
})