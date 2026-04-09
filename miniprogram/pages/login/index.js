// pages/login/index.js - 登录页（v2重构版）
const app = getApp()
const api = require('../../services/api')
const { USER_ROLE } = require('../../utils/constants')

Page({
  data: {
    // 表单数据
    phone: '',
    code: '',
    // 状态控制
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
    // 检查是否已登录，如果已登录则直接跳转
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.redirectBasedOnRole(userInfo.role)
    }
  },

  onUnload() {
    // 清除定时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
  },

  /**
   * 手机号输入事件
   */
  onPhoneChange(e) {
    this.setData({ phone: e.detail })
    this.updateCanLogin()
  },

  /**
   * 验证码输入事件
   */
  onCodeChange(e) {
    this.setData({ code: e.detail })
    this.updateCanLogin()
  },

  /**
   * 协议勾选状态变更
   */
  onAgreementChange(e) {
    this.setData({ agreed: e.detail })
    this.updateCanLogin()
  },

  /**
   * 更新登录按钮可用状态
   */
  updateCanLogin() {
    const { phone, code, agreed } = this.data
    const canLogin = phone.length === 11 && code.length === 6 && agreed
    this.setData({ canLogin })
  },

  /**
   * 显示用户服务协议
   */
  showAgreement() {
    wx.showModal({
      title: '用户服务协议',
      content: '欢迎使用契约之约租赁合同平台。本平台为用户提供电子合同签署服务，请仔细阅读以下条款...',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /**
   * 显示隐私政策
   */
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私保护。我们将按照本隐私政策收集、使用和保护您的个人信息...',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /**
   * 发送验证码（带60秒倒计时）
   */
  async onSendCode() {
    const { phone } = this.data

    // 验证手机号格式
    if (!phone || phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    this.setData({ sendingCode: true })

    try {
      const res = await api.sendCode(phone)

      if (res.code === 200) {
        wx.showToast({ title: '验证码已发送', icon: 'success' })

        // 开始60秒倒计时
        this.setData({
          codeSent: true,
          countdown: 60
        })

        const timer = setInterval(() => {
          const newCountdown = this.data.countdown - 1
          if (newCountdown <= 0) {
            clearInterval(timer)
            this.setData({
              codeSent: false,
              countdown: 0,
              timer: null
            })
          } else {
            this.setData({ countdown: newCountdown })
          }
        }, 1000)

        this.setData({ timer })
      } else {
        wx.showToast({ title: res.message || '发送失败', icon: 'none' })
      }
    } catch (error) {
      console.error('发送验证码失败', error)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
    } finally {
      this.setData({ sendingCode: false })
    }
  },

  /**
   * 执行手机号+验证码登录
   */
  async handleLogin() {
    const { phone, code } = this.data

    // 表单验证
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

        // 更新全局状态
        app.login(user, res.data.token)

        wx.showToast({ title: '登录成功', icon: 'success' })

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          this.redirectBasedOnRole(user.role)
        }, 1500)
      } else {
        wx.showToast({ title: res.message || '登录失败', icon: 'none' })
      }
    } catch (error) {
      console.error('登录失败', error)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 微信一键登录
   */
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

            // 更新全局状态
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
          console.error('微信登录失败', error)
          wx.showToast({ title: '微信登录失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '微信登录失败', icon: 'none' })
      }
    })
  },

  /**
   * 根据用户角色跳转到对应页面
   */
  redirectBasedOnRole(role) {
    let url = '/pages/my-contracts/index'

    if (role === USER_ROLE.LESSOR || role === USER_ROLE.ADMIN) {
      url = '/pages/index/index'
    }

    wx.switchTab({ url })
  }
})
