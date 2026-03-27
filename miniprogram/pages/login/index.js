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
  },

  onCodeChange(e) {
    this.setData({ code: e.detail })
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
    switch (role) {
      case USER_ROLE.ADMIN:
        wx.reLaunch({ url: '/pages/admin/index' })
        break
      case USER_ROLE.LESSOR:
        wx.reLaunch({ url: '/pages/contracts/index' })
        break
      case USER_ROLE.LESSEE:
      default:
        wx.reLaunch({ url: '/pages/my-contracts/index' })
    }
  }
})