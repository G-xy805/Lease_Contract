// pages/login/index.js
const app = getApp()
const api = require('../../services/api')

Page({
  data: {
    phone: '',
    code: '',
    loading: false,
    sendingCode: false,
    isRegister: false,
    codeSent: false,
    countdown: 0,
    timer: null,
    selectedRole: 'PARTY_A' // 默认角色为甲方
  },

  onLoad() {},

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

  switchMode() {
    this.setData({
      isRegister: !this.data.isRegister,
      code: '',
      codeSent: false,
      countdown: 0
    })
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.setData({ timer: null })
    }
  },

  onRoleChange(e) {
    this.setData({
      selectedRole: e.detail
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
    const { phone, code, isRegister } = this.data

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
      const res = await api.phoneLogin({ phone, code, role: this.data.selectedRole })

      if (res.code === 200) {
        app.login(res.data.user, res.data.token)
        wx.showToast({ title: isRegister ? '注册成功' : '登录成功', icon: 'success' })

        setTimeout(() => {
          if (this.data.selectedRole === 'PARTY_A') {
            wx.reLaunch({ url: '/pages/contracts/index' })
          } else {
            wx.reLaunch({ url: '/pages/my-contracts/index' })
          }
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
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: async (res) => {
        console.log('微信登录', res)
        try {
          const result = await api.wechatLogin({
            code: Date.now(),
            openid: `wx_${Date.now()}`,
            role: this.data.selectedRole
          })

          if (result.code === 200) {
            app.login(result.data.user, result.data.token)
            wx.showToast({ title: '登录成功', icon: 'success' })

            setTimeout(() => {
              if (this.data.selectedRole === 'PARTY_A') {
                wx.reLaunch({ url: '/pages/contracts/index' })
              } else {
                wx.reLaunch({ url: '/pages/my-contracts/index' })
              }
            }, 1500)
          }
        } catch (error) {
          wx.showToast({ title: '微信登录失败', icon: 'none' })
        }
      }
    })
  }
})