const app = getApp()

Page({
  data: {
    // 认证状态: none-未认证, pending-认证中, certified-已认证, failed-认证失败
    certificationStatus: 'none',
    // 步骤配置
    steps: [
      { desc: '填写信息' },
      { desc: '上传证件' },
      { desc: '人脸核身' },
      { desc: '提交审核' }
    ],
    currentStep: 0,
    // 表单数据
    formData: {
      realName: '',
      idCard: ''
    },
    // 身份证图片
    idCardFront: '',
    idCardBack: '',
    // 人脸核身
    faceVerified: false,
    // 协议勾选
    agreed: false,
    // 提交状态
    submitting: false,
    // 认证信息
    submittedAt: '',
    certifiedInfo: {},
    failedReason: ''
  },

  onLoad(options) {
    // 从全局数据获取认证状态
    this.loadCertificationStatus()
  },

  onShow() {
    // 每次打开页面时刷新认证状态
    this.loadCertificationStatus()
  },

  // 加载认证状态
  loadCertificationStatus() {
    const userInfo = app.globalData.userInfo
    if (userInfo && userInfo.real_name_status) {
      const status = userInfo.real_name_status
      let certificationStatus = 'none'
      
      switch (status) {
        case 0: certificationStatus = 'none'; break
        case 1: certificationStatus = 'pending'; break
        case 2: certificationStatus = 'certified'; break
        case 3: certificationStatus = 'failed'; break
      }
      
      this.setData({ certificationStatus })

      if (status === 1) {
        this.setData({ submittedAt: userInfo.real_name_at || '' })
      } else if (status === 2) {
        this.setData({
          certifiedInfo: {
            realName: userInfo.name || '',
            idCard: this.maskIdCard(userInfo.idcard || ''),
            certifiedAt: userInfo.real_name_at || ''
          }
        })
      } else if (status === 3) {
        this.setData({ failedReason: userInfo.failed_reason || '信息审核不通过，请重新提交' })
      }
    } else {
      this.setData({ certificationStatus: 'none' })
    }
  },

  // 身份证号脱敏
  maskIdCard(idCard) {
    if (idCard.length === 18) {
      return idCard.substring(0, 6) + '********' + idCard.substring(14)
    }
    return idCard
  },

  // 字段变更
  onFieldChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail
    })
    this.updateStep()
  },

  // 协议勾选
  onAgreeChange(e) {
    this.setData({ agreed: e.detail })
  },

  // 更新步骤
  updateStep() {
    const { formData, idCardFront, idCardBack, faceVerified } = this.data
    let step = 0
    if (formData.realName && formData.idCard) step = 1
    if (idCardFront && idCardBack) step = 2
    if (faceVerified) step = 3
    this.setData({ currentStep: step })
  },

  // 是否可提交
  canSubmit() {
    const { formData, idCardFront, idCardBack, faceVerified, agreed } = this.data
    return formData.realName && formData.idCard && idCardFront && idCardBack && faceVerified && agreed
  },

  // 选择图片
  chooseImage(e) {
    const type = e.currentTarget.dataset.type
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        if (type === 'front') {
          this.setData({ idCardFront: tempFilePath })
        } else {
          this.setData({ idCardBack: tempFilePath })
        }
        this.updateStep()
        this.updateCanSubmit()
      }
    })
  },

  // 更新提交按钮状态
  updateCanSubmit() {
    this.setData({ canSubmit: this.canSubmit() })
  },

  // 开始人脸核身
  startFaceVerification() {
    wx.checkIsSupportFacialRecognition({
      success: (res) => {
        if (res.errMsg === 'checkIsSupportFacialRecognition:ok') {
          this.doFaceVerify()
        } else {
          wx.showToast({ title: '当前版本不支持人脸核身', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '人脸核身调用失败', icon: 'none' })
      }
    })
  },

  // 执行人脸核身
  doFaceVerify() {
    const self = this
    wx.startFacialRecognitionVerify({
      name: self.data.formData.realName,
      idCardNumber: self.data.formData.idCard,
      success: (res) => {
        if (res.errMsg === 'startFacialRecognitionVerify:ok') {
          if (res.verify_result === true) {
            self.setData({ faceVerified: true })
            self.updateStep()
            self.updateCanSubmit()
            wx.showToast({ title: '核身通过', icon: 'success' })
          } else {
            wx.showToast({ title: '人脸核身失败，请重试', icon: 'none' })
          }
        }
      },
      fail: (res) => {
        wx.showToast({ title: res.errMsg || '人脸核身失败', icon: 'none' })
      }
    })
  },

  // 显示协议
  showAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/index?type=realName'
    })
  },

  // 提交认证
  submitCertification() {
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

    // 上传身份证图片并提交认证
    this.uploadImagesAndSubmit()
  },

  // 上传图片并提交认证
  uploadImagesAndSubmit() {
    const { idCardFront, idCardBack, formData } = this.data
    const token = app.globalData.token

    // 并行上传两张图片
    Promise.all([
      this.uploadImage(idCardFront, 'id_card_front'),
      this.uploadImage(idCardBack, 'id_card_back')
    ]).then(([frontResult, backResult]) => {
      // 提交认证
      this.submitVerify(frontResult.url, backResult.url)
    }).catch((err) => {
      this.setData({ submitting: false })
      wx.showToast({ title: '图片上传失败，请重试', icon: 'none' })
    })
  },

  // 上传单张图片
  uploadImage(filePath, type) {
    return new Promise((resolve, reject) => {
      const token = app.globalData.token
      wx.uploadFile({
        url: `${app.globalData.baseUrl}/api/upload`,
        filePath: filePath,
        name: 'file',
        header: { Authorization: `Bearer ${token}` },
        formData: { type: type },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            resolve({ url: data.url })
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        },
        fail: (err) => {
          wx.showToast({ title: '图片上传失败', icon: 'none' })
          reject(err)
        }
      })
    })
  },

  // 提交实名认证
  submitVerify(idCardFrontUrl, idCardBackUrl) {
    const { formData } = this.data
    const token = app.globalData.token

    const requestData = {
      name: formData.realName,
      idcard: formData.idCard,
      idcard_front: idCardFrontUrl,
      idcard_back: idCardBackUrl
    }

    wx.request({
      url: `${app.globalData.baseUrl}/api/users/real-name/verify`,
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: requestData,
      success: (res) => {
        this.setData({ submitting: false })
        if (res.data.code === 0) {
          // 认证结果由后台推送
          wx.showToast({ title: '提交成功，请等待审核', icon: 'success' })
        } else {
          wx.showToast({ title: res.data.message || '提交失败', icon: 'none' })
        }
      },
      fail: () => {
        this.setData({ submitting: false })
        wx.showToast({ title: '提交失败', icon: 'none' })
      }
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 重新认证
  retryCertification() {
    this.setData({
      certificationStatus: 'none',
      formData: { realName: '', idCard: '' },
      idCardFront: '',
      idCardBack: '',
      faceVerified: false,
      agreed: false,
      currentStep: 0
    })
  },

  // 联系客服
  contactSupport() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-xxx-xxxx\n工作时间：周一至周五 9:00-18:00',
      showCancel: true,
      confirmText: '拨打',
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
