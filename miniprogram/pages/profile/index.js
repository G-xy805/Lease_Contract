// pages/profile/index.js
const app = getApp()

Page({
  data: {
    loading: true,
    userInfo: null,
    showNicknamePopup: false,
    showIdCardPopup: false,
    editNickname: '',
    idCardFrontList: [],
    idCardBackList: [],
    idCardFront: '',
    idCardBack: ''
  },

  onLoad() {
    this.loadUserProfile()
  },

  onShow() {
    // 每次显示页面时刷新用户信息
    if (!this.data.loading) {
      this.loadUserProfile()
    }
  },

  onPullDownRefresh() {
    this.loadUserProfile()
    wx.stopPullDownRefresh()
  },

  /**
   * 加载用户信息
   */
  loadUserProfile() {
    this.setData({ loading: true })

    wx.request({
      url: `${app.globalData.baseUrl}/api/users/profile`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        this.setData({ loading: false })

        if (res.data.code === 200 || res.data.code === 0) {
          this.setData({
            userInfo: res.data.data
          })
        } else {
          wx.showToast({
            title: res.data.message || '获取用户信息失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        this.setData({ loading: false })
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        console.error('获取用户信息失败', err)
      }
    })
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
   * 显示修改昵称弹窗
   */
  showEditNickname() {
    this.setData({
      showNicknamePopup: true,
      editNickname: this.data.userInfo.name || ''
    })
  },

  /**
   * 关闭修改昵称弹窗
   */
  closeNicknamePopup() {
    this.setData({
      showNicknamePopup: false,
      editNickname: ''
    })
  },

  /**
   * 确认修改昵称
   */
  confirmEditNickname() {
    const { editNickname } = this.data

    if (!editNickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    wx.request({
      url: `${app.globalData.baseUrl}/api/users/profile`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: editNickname.trim()
      },
      success: (res) => {
        wx.hideLoading()

        if (res.data.code === 200 || res.data.code === 0) {
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          })

          // 更新本地数据
          const userInfo = { ...this.data.userInfo, name: editNickname.trim() }
          this.setData({
            userInfo,
            showNicknamePopup: false,
            editNickname: ''
          })

          // 更新全局数据
          app.globalData.userInfo = userInfo
          wx.setStorageSync('userInfo', userInfo)
        } else {
          wx.showToast({
            title: res.data.message || '修改失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        console.error('修改昵称失败', err)
      }
    })
  },

  /**
   * 显示上传身份证弹窗
   */
  showUploadIdCard() {
    const { userInfo } = this.data
    const idCardFrontList = userInfo.idcard_front ? [{ url: userInfo.idcard_front }] : []
    const idCardBackList = userInfo.idcard_back ? [{ url: userInfo.idcard_back }] : []

    this.setData({
      showIdCardPopup: true,
      idCardFrontList,
      idCardBackList,
      idCardFront: userInfo.idcard_front || '',
      idCardBack: userInfo.idcard_back || ''
    })
  },

  /**
   * 关闭上传身份证弹窗
   */
  closeIdCardPopup() {
    this.setData({
      showIdCardPopup: false,
      idCardFrontList: [],
      idCardBackList: [],
      idCardFront: '',
      idCardBack: ''
    })
  },

  /**
   * 上传身份证正面照片
   */
  afterReadIdCardFront(event) {
    const { file } = event.detail
    this.uploadIdCardImage(file, 'front')
  },

  /**
   * 上传身份证反面照片
   */
  afterReadIdCardBack(event) {
    const { file } = event.detail
    this.uploadIdCardImage(file, 'back')
  },

  /**
   * 上传身份证图片
   */
  uploadIdCardImage(file, type) {
    wx.showLoading({ title: '上传中...' })

    wx.uploadFile({
      url: `${app.globalData.baseUrl}/api/upload`,
      filePath: file.url,
      name: 'file',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        wx.hideLoading()
        const data = JSON.parse(res.data)

        if (data.code === 200 || data.code === 0) {
          if (type === 'front') {
            this.setData({
              idCardFront: data.data.url,
              idCardFrontList: [{ url: data.data.url }]
            })
          } else {
            this.setData({
              idCardBack: data.data.url,
              idCardBackList: [{ url: data.data.url }]
            })
          }

          wx.showToast({
            title: '上传成功',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: data.message || '上传失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
        console.error('上传身份证图片失败', err)
      }
    })
  },

  /**
   * 删除身份证正面照片
   */
  deleteIdCardFront() {
    this.setData({
      idCardFront: '',
      idCardFrontList: []
    })
  },

  /**
   * 删除身份证反面照片
   */
  deleteIdCardBack() {
    this.setData({
      idCardBack: '',
      idCardBackList: []
    })
  },

  /**
   * 确认上传身份证
   */
  confirmUploadIdCard() {
    const { idCardFront, idCardBack } = this.data

    if (!idCardFront || !idCardBack) {
      wx.showToast({
        title: '请上传身份证正反面照片',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    wx.request({
      url: `${app.globalData.baseUrl}/api/users/profile`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        idCardFront,
        idCardBack
      },
      success: (res) => {
        wx.hideLoading()

        if (res.data.code === 200 || res.data.code === 0) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })

          // 更新本地数据
          const userInfo = {
            ...this.data.userInfo,
            idCardFront,
            idCardBack
          }
          this.setData({
            userInfo,
            showIdCardPopup: false
          })

          // 更新全局数据
          app.globalData.userInfo = userInfo
          wx.setStorageSync('userInfo', userInfo)
        } else {
          wx.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        console.error('保存身份证信息失败', err)
      }
    })
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息
          app.logout()

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })

          // 跳转登录页
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