// pages/real-name/index.js - 实名认证页（v2重构版）
const app = getApp()
const api = require('../../services/api')
const { REAL_NAME_STATUS } = require('../../utils/constants')

Page({
  data: {
    // 认证状态: none-未认证, pending-认证中, certified-已认证, failed-认证失败
    certificationStatus: 'none',
    // 表单数据
    formData: {
      realName: '',
      idCard: ''
    },
    // 身份证图片
    idCardFront: '',
    idCardBack: '',
    // 协议勾选
    agreed: false,
    // 提交状态
    submitting: false,
    // 认证信息
    certifiedInfo: {},
    failedReason: ''
  },

  onLoad(options) {
    this.loadCertificationStatus()
  },

  onShow() {
    this.loadCertificationStatus()
  },

  /**
   * 加载用户认证状态
   */
  loadCertificationStatus() {
    const userInfo = app.globalData.userInfo

    if (userInfo && userInfo.real_name_status !== undefined) {
      const status = userInfo.real_name_status
      let certificationStatus = 'none'

      switch (status) {
        case REAL_NAME_STATUS.NOT_AUTH:
          certificationStatus = 'none'
          break
        case REAL_NAME_STATUS.AUTHENTICATING:
          certificationStatus = 'pending'
          break
        case REAL_NAME_STATUS.AUTHENTICATED:
          certificationStatus = 'certified'
          break
        case REAL_NAME_STATUS.FAILED:
          certificationStatus = 'failed'
          break
      }

      this.setData({ certificationStatus })

      // 根据状态显示不同信息
      if (status === REAL_NAME_STATUS.AUTHENTICATED) {
        this.setData({
          certifiedInfo: {
            realName: userInfo.name || '',
            idCard: this.maskIdCard(userInfo.idcard || ''),
            certifiedAt: userInfo.real_name_at || ''
          }
        })
      } else if (status === REAL_NAME_STATUS.FAILED) {
        this.setData({
          failedReason: userInfo.failed_reason || '信息审核不通过，请重新提交'
        })
      }
    } else {
      this.setData({ certificationStatus: 'none' })
    }
  },

  /**
   * 身份证号脱敏处理
   */
  maskIdCard(idCard) {
    if (idCard && idCard.length === 18) {
      return idCard.substring(0, 6) + '********' + idCard.substring(14)
    }
    return idCard || ''
  },

  /**
   * 姓名输入事件
   */
  onRealNameChange(e) {
    this.setData({
      'formData.realName': e.detail
    })
  },

  /**
   * 身份证号输入事件（自动转换大写X）
   */
  onIdCardChange(e) {
    let value = e.detail
    // 自动转换小写x为大写X
    if (value) {
      value = value.replace(/x$/, 'X').replace(/x/g, 'X')
    }
    this.setData({
      'formData.idCard': value
    })
  },

  /**
   * 选择身份证正面照片
   */
  chooseIdCardFront() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ idCardFront: res.tempFilePaths[0] })
      },
      fail: () => {
        // 用户取消选择，不提示错误
      }
    })
  },

  /**
   * 选择身份证背面照片
   */
  chooseIdCardBack() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ idCardBack: res.tempFilePaths[0] })
      },
      fail: () => {
        // 用户取消选择，不提示错误
      }
    })
  },

  /**
   * 协议勾选事件
   */
  onAgreeChange(e) {
    this.setData({ agreed: e.detail })
  },

  /**
   * 判断是否可以提交
   */
  canSubmit() {
    const { formData, idCardFront, idCardBack, agreed } = this.data
    return (
      formData.realName &&
      formData.idCard &&
      formData.idCard.length === 18 &&
      idCardFront &&
      idCardBack &&
      agreed
    )
  },

  /**
   * 提交实名认证
   */
  async submitCertification() {
    const { formData, idCardFront, idCardBack } = this.data

    // 表单验证
    if (!formData.realName) {
      wx.showToast({ title: '请输入真实姓名', icon: 'none' })
      return
    }

    if (!formData.idCard || formData.idCard.length !== 18) {
      wx.showToast({ title: '请输入正确的身份证号', icon: 'none' })
      return
    }

    if (!idCardFront || !idCardBack) {
      wx.showToast({ title: '请上传身份证正反面', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      // 上传身份证图片到服务器
      const [frontResult, backResult] = await Promise.all([
        api.uploadImage(idCardFront),
        api.uploadImage(idCardBack)
      ])

      // 提交实名认证请求
      const res = await api.realNameVerify({
        name: formData.realName,
        idcard: formData.idCard,
        idcard_front: frontResult.url,
        idcard_back: backResult.url
      })

      // 更新全局用户信息状态为"认证中"
      if (app.globalData.userInfo) {
        app.globalData.userInfo.real_name_status = REAL_NAME_STATUS.AUTHENTICATING
      }

      this.setData({ submitting: false })

      wx.showToast({
        title: '提交成功，请等待审核',
        icon: 'success'
      })

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      console.error('提交认证失败', err)
      this.setData({ submitting: false })
      wx.showToast({
        title: err.message || '提交失败，请重试',
        icon: 'none'
      })
    }
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack()
  },

  /**
   * 重新认证（清除已有数据）
   */
  retryCertification() {
    this.setData({
      certificationStatus: 'none',
      formData: { realName: '', idCard: '' },
      idCardFront: '',
      idCardBack: '',
      agreed: false
    })
  },

  /**
   * 联系客服
   */
  contactSupport() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-xxx-xxxx\n工作时间：周一至周五 9:00-18:00',
      showCancel: true,
      confirmText: '拨打',
      confirmColor: 'var(--primary-color)',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400xxxxxxx'
          })
        }
      }
    })
  }
})
