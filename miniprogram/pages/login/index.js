// pages/login/index.js
const app = getApp()
const api = require('../../services/api')
const { USER_ROLE } = require('../../utils/constants')

Page({
  data: {
    phone: '',
    code: '',
    loading: false,
    sendingCode: false,
    codeSent: false,
    countdown: 0,
    timer: null,
    agreed: false,
    canLogin: false,
    USER_ROLE: USER_ROLE
  },

  onLoad(options) {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.redirectBasedOnRole(userInfo.role)
    }
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  },

  onPhoneChange(e) {
    this.setData({ phone: e.detail })
    this.updateCanLogin()
  },

  onCodeChange(e) {
    this.setData({ code: e.detail })
    this.updateCanLogin()
  },

  onAgreementChange(e) {
    this.setData({ agreed: e.detail })
    this.updateCanLogin()
  },

  updateCanLogin() {
    const { phone, code, agreed } = this.data
    const canLogin = phone.length === 11 && code.length === 6 && agreed
    this.setData({ canLogin })
  },

  showAgreement() {
    wx.showModal({
      title: '用户服务协议',
      content: '这里是用户服务协议的内容...',
      showCancel: false
    })
  },

  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策的内容...',
      showCancel: false
    })
  },

  async onSendCode() {
    const { phone } = this.data

    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    this.setData({ sendingCode: true })

    try {
      const res = await api.sendCode(phone)

      if (res.code === 200) {
        wx.showToast({ title: '验证码已发送', icon: 'success' })
        this.setData({
          codeSent: true,
          countdown: 60
        })

        const timer = setInterval(() => {
          const countdown = this.data.countdown - 1
          if (countdown <= 0) {
            clearInterval(timer)
            this.setData({
              codeSent: false,
              countdown: 0,
              timer: null
            })
          } else {
            this.setData({ countdown })
          }
        }, 1000)

        this.setData({ timer })
      } else {
        wx.showToast({ title: res.message || '发送失败', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({ title: '发送失败', icon: 'none' })
    } finally {
      this.setData({ sendingCode: false })
    }
  },

  async handleLogin() {
    const { phone, code } = this.data

    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    if (!code || code.length !== 6) {
      wx.showToast({ title: '请输入6位验证码', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const res = await api.phoneLogin({
        phone,
        code,
        role: USER_ROLE.LESSEE
      })

      if (res.code === 200) {
        const user = res.data.user
        app.login(user, res.data.token)
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          this.redirectBasedOnRole(user.role)
        }, 1500)
      } else {
        wx.showToast({ title: res.message || '登录失败', icon: 'none' })
      }
    } catch (error) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onWechatLogin() {
    wx.showLoading({ title: '正在获取...', mask: true })

    wx.login({
      success: async (loginRes) => {
        if (!loginRes.code) {
          wx.hideLoading()
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          return
        }

        try {
          const res = await api.wechatLogin({
            code: loginRes.code,
            role: USER_ROLE.LESSEE
          })

          wx.hideLoading()

          if (res.code === 200) {
            const user = res.data.user
            app.login(user, res.data.token)
            wx.showToast({ title: '登录成功', icon: 'success' })
            setTimeout(() => {
              this.redirectBasedOnRole(user.role)
            }, 1500)
          } else {
            wx.showToast({ title: res.message || '登录失败', icon: 'none' })
          }
        } catch (error) {
          wx.hideLoading()
          wx.showToast({ title: '微信登录失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '微信登录失败', icon: 'none' })
      }
    })
  },

  redirectBasedOnRole(role) {
    let url = '/pages/my-contracts/index'

    if (role === USER_ROLE.LESSOR) {
      url = '/pages/index/index'
    }

    if (role === USER_ROLE.ADMIN) {
      url = '/pages/index/index'
    }

    wx.switchTab({ url })
  }
})