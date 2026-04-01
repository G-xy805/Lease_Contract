// pages/verify-invite/index.js
const app = getApp()
const api = require('../../services/api')

Page({
  data: {
    inviteCode: '',
    contractInfo: null,
    loading: false,
    verified: false,
    errorMessage: '',
    isPhoneMatched: false,
    isExpired: false,
    isInvalid: false,
    statusType: 'info',
    statusText: '',
    userPhone: ''
  },

  onLoad(options) {
    // 从 URL 参数或扫码获取邀请码
    const code = options.code || options.inviteCode || ''
    if (code) {
      this.setData({ inviteCode: code })
      this.verifyInviteCode()
    } else {
      this.setData({ errorMessage: '无效的邀请码' })
    }

    // 获取当前用户手机号
    const userInfo = app.globalData.userInfo
    if (userInfo && userInfo.phone) {
      this.setData({ userPhone: userInfo.phone })
    }
  },

  async verifyInviteCode() {
    const { inviteCode } = this.data

    if (!inviteCode || inviteCode.trim().length < 6) {
      this.setData({
        errorMessage: '请输入正确的邀请码',
        isInvalid: true
      })
      return
    }

    this.setData({ loading: true, errorMessage: '' })

    try {
      const res = await api.verifyInviteCode(inviteCode.trim())

      if (res.code === 200) {
        const data = res.data

        // 检查合同状态
        const isExpired = data.expired || data.status === 6
        const isInvalid = data.invalid || data.status === 4 || data.status === 5

        // 检查手机号匹配（如果返回了 expected_phone）
        const userPhone = this.data.userPhone
        const expectedPhone = data.expected_phone || data.partyB_phone || data.lessee_phone
        const isPhoneMatched = !expectedPhone || userPhone === expectedPhone

        // 设置状态文本
        let statusType = 'info'
        let statusText = ''

        if (isExpired) {
          statusType = 'warning'
          statusText = '邀请码已过期'
        } else if (isInvalid) {
          statusType = 'danger'
          statusText = '邀请码无效'
        } else if (!isPhoneMatched) {
          statusType = 'warning'
          statusText = '此邀请码不属于您的手机号'
        }

        this.setData({
          contractInfo: data,
          verified: true,
          isPhoneMatched: isPhoneMatched && !isExpired && !isInvalid,
          isExpired: isExpired,
          isInvalid: isInvalid,
          statusType: statusType,
          statusText: statusText,
          loading: false
        })
      } else {
        this.setData({
          errorMessage: res.message || '邀请码无效',
          isInvalid: true,
          loading: false
        })
      }
    } catch (error) {
      console.error('验证邀请码失败', error)
      this.setData({
        errorMessage: '验证失败，请稍后重试',
        isInvalid: true,
        loading: false
      })
    }
  },

  // 点击接受签署按钮
  onAcceptSign() {
    const userInfo = app.globalData.userInfo

    // 未登录，跳转到登录页
    if (!userInfo || !userInfo.phone) {
      wx.navigateTo({
        url: '/pages/login/index?redirect=/pages/verify-invite/index?code=' + this.data.inviteCode
      })
      return
    }

    // 已登录，跳转到签署页面
    wx.navigateTo({
      url: '/pages/sign-contract/index?contractId=' + this.data.contractInfo.contract_id + '&isPartyA=false&inviteCode=' + this.data.inviteCode
    })
  },

  // 返回首页
  goBack() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  // 联系甲方
  contactPartyA() {
    const phone = this.data.contractInfo.partyA_phone || this.data.contractInfo.lessor_phone || ''
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone,
        fail: () => {
          wx.showToast({ title: '拨打失败', icon: 'none' })
        }
      })
    } else {
      wx.showToast({ title: '暂无甲方联系方式', icon: 'none' })
    }
  }
})