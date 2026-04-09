// pages/profile/index.js - 个人中心页（v2重构版）
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
    REAL_NAME_STATUS: REAL_NAME_STATUS,

    // 功能菜单配置
    menuList: [
      {
        group: 'account',
        title: '账户设置',
        icon: 'setting-o',
        items: [
          { id: 'profile', title: '个人资料', icon: 'user-o', desc: '编辑用户信息' },
          { id: 'security', title: '账号安全', icon: 'shield-o', desc: '修改密码/绑定手机' }
        ]
      },
      {
        group: 'system',
        title: '系统设置',
        icon: 'tools-o',
        items: [
          { id: 'clearCache', title: '清除缓存', icon: 'delete-o', desc: '释放存储空间' },
          { id: 'about', title: '关于我们', icon: 'info-o', desc: '版本号、版权信息' }
        ]
      }
    ]
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

  /**
   * 加载用户信息
   */
  async loadUserProfile() {
    this.setData({ loading: true })

    try {
      const res = await api.getProfile()

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
    } catch (err) {
      console.error('获取用户信息失败', err)
      wx.showToast({
        title: '网络请求失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 获取角色显示文本
   */
  getRoleText(role) {
    const roleMap = {
      [USER_ROLE.LESSOR]: '甲方',
      [USER_ROLE.LESSEE]: '乙方',
      [USER_ROLE.ADMIN]: '管理员'
    }
    return roleMap[role] || '未知'
  },

  /**
   * 获取实名认证状态文本
   */
  getRealNameStatusText(status) {
    const statusMap = {
      [REAL_NAME_STATUS.NOT_AUTH]: '未认证',
      [REAL_NAME_STATUS.AUTHENTICATING]: '认证中',
      [REAL_NAME_STATUS.AUTHENTICATED]: '已认证',
      [REAL_NAME_STATUS.FAILED]: '认证失败'
    }
    return statusMap[status] || '未知'
  },

  /**
   * 跳转到实名认证页面
   */
  goToRealNameAuth() {
    wx.navigateTo({
      url: '/pages/real-name/index'
    })
  },

  /**
   * 菜单项点击处理
   */
  onMenuItemTap(e) {
    const { id } = e.currentTarget.dataset

    switch (id) {
      case 'profile':
        // TODO: 跳转到个人资料编辑页
        wx.showToast({ title: '功能开发中', icon: 'none' })
        break

      case 'security':
        // TODO: 跳转到账号安全设置页
        wx.showToast({ title: '功能开发中', icon: 'none' })
        break

      case 'clearCache':
        this.clearCache()
        break

      case 'about':
        this.showAbout()
        break

      default:
        break
    }
  },

  /**
   * 清除缓存
   */
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有本地缓存数据吗？这将删除已保存的临时文件。',
      confirmColor: 'var(--primary-color)',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清除中...', mask: true })

          try {
            // 清除本地存储中的非关键数据
            const keysToRemove = ['contract_updated', 'preview_contract_data']
            keysToRemove.forEach(key => {
              try {
                wx.removeStorageSync(key)
              } catch (e) {
                console.warn(`清除 ${key} 失败`, e)
              }
            })

            wx.hideLoading()
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            })
          } catch (err) {
            wx.hideLoading()
            console.error('清除缓存失败', err)
            wx.showToast({
              title: '清除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  /**
   * 显示关于我们信息
   */
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: `契约之约 - 房屋租赁合同签署平台\n\n版本：${this.data.version}\n\n© 2024 契约之约 版权所有\n\n本平台为用户提供安全、便捷的电子合同签署服务。`,
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /**
   * 切换用户角色
   */
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
          if (app.globalData.userInfo) {
            app.globalData.userInfo.currentRole = newRole
          }

          this.setData({ currentRole: newRole })

          // 根据角色跳转到对应页面
          if (newRole === USER_ROLE.LESSOR) {
            wx.switchTab({
              url: '/pages/index/index'
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

  /**
   * 退出登录（带二次确认）
   */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？退出后需要重新登录才能使用。',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          // 调用全局 logout 方法清除状态
          if (app.logout) {
            app.logout()
          } else {
            // 备用方案：手动清除关键数据
            wx.removeStorageSync('token')
            wx.removeStorageSync('userInfo')
            wx.removeStorageSync('loginExpiresAt')
          }

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })

          // 延迟跳转到登录页
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
