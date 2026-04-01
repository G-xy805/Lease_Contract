const app = getApp()
const api = require('../../services/api')
const { USER_ROLE, REAL_NAME_STATUS } = require('../../utils/constants')

Page({
  data: {
    loading: true,
    userInfo: null,
    currentRole: 'LESSOR',
    version: '1.0.0',
    USER_ROLE: USER_ROLE,
    REAL_NAME_STATUS: REAL_NAME_STATUS
  },

  onLoad() {
    this.loadUserProfile()
  },

  onShow() {
    // 每次显示时刷新用户信息
    this.loadUserProfile()
  },

  onPullDownRefresh() {
    this.loadUserProfile()
    wx.stopPullDownRefresh()
  },

  loadUserProfile() {
    this.setData({ loading: true })

    api.getProfile().then(res => {
      this.setData({ loading: false })

      if (res.code === 200) {
        const userInfo = res.data
        const currentRole = app.globalData.userInfo?.currentRole || userInfo.role || USER_ROLE.LESSOR

        this.setData({
          userInfo: userInfo,
          currentRole: currentRole
        })

        // 更新 globalData 中的用户信息
        app.globalData.userInfo = userInfo
      } else {
        wx.showToast({
          title: res.message || '获取用户信息失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      this.setData({ loading: false })
      wx.showToast({
        title: '网络请求失败',
        icon: 'none'
      })
      console.error('获取用户信息失败', err)
    })
  },

  // 跳转到实名认证页面
  goToRealNameAuth() {
    wx.navigateTo({
      url: '/pages/real-name/index'
    })
  },

  // 跳转到身份信息页面
  goToIdInfo() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到我的创建合同页面
  goToMyCreatedContracts() {
    wx.navigateTo({
      url: '/pages/contracts/index?type=created'
    })
  },

  // 跳转到我的签署合同页面
  goToMySignedContracts() {
    wx.navigateTo({
      url: '/pages/my-contracts/index?type=signed'
    })
  },

  // 跳转到设置页面
  goToSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到帮助页面
  goToHelp() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到关于我们页面
  goToAbout() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 切换角色
  switchRole(e) {
    const newRole = e.currentTarget.dataset.role
    const { currentRole, userInfo } = this.data

    if (newRole === currentRole) return

    // 检查用户是否拥有该角色
    if (newRole === USER_ROLE.LESSOR && !userInfo.has_lessor_role) {
      wx.showToast({
        title: '您没有甲方身份',
        icon: 'none'
      })
      return
    }
    if (newRole === USER_ROLE.LESSEE && !userInfo.has_lessee_role) {
      wx.showToast({
        title: '您没有乙方身份',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '切换角色',
      content: `确定切换为${newRole === USER_ROLE.LESSOR ? '甲方' : '乙方'}身份吗？`,
      success: (res) => {
        if (res.confirm) {
          // 更新 globalData
          app.globalData.userInfo = {
            ...app.globalData.userInfo,
            currentRole: newRole
          }

          this.setData({ currentRole: newRole })

          // 根据角色跳转到对应页面
          if (newRole === USER_ROLE.LESSOR) {
            wx.switchTab({
              url: '/pages/contracts/index'
            })
          } else {
            wx.switchTab({
              url: '/pages/my-contracts/index'
            })
          }
        }
      }
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          app.logout()

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })

          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/index'
            })
          }, 1500)
        }
      }
    })
  }
})