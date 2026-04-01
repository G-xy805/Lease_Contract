// pages/sign-contract/index.js
const app = getApp()
const api = require('../../services/api')

Page({
  data: {
    // 合同信息
    contractInfo: {
      id: '',
      title: '房屋租赁合同',
      contractNo: '',
      partyA: '',
      partyB: '',
      propertyAddress: '',
      leaseStartDate: '',
      leaseEndDate: '',
      monthlyRent: '',
      status: 'pending'
    },

    // 当前用户角色 (true=甲方/出租人, false=乙方/承租人)
    isPartyA: true,

    // 签署提示文本
    signRoleText: '',

    // 签名配置
    currentColor: '#000000',
    currentThickness: '2',
    hasSigned: false,

    // 提交状态
    isSubmitting: false,

    // 签署时间
    signTime: '',

    // 确认弹窗
    showConfirmDialog: false,

    // 结果弹窗
    showResultDialog: false,
    resultType: 'success',
    resultTitle: '',
    resultMessage: ''
  },

  // 签名上下文
  signContext: null,

  onLoad(options) {
    // 获取传入的合同ID
    const contractId = options.contractId || options.id

    if (contractId) {
      this.setData({
        'contractInfo.id': contractId
      })
      // 加载合同详情
      this.loadContractDetail(contractId)
    }

    // 判断用户角色（优先使用URL参数，其次使用app.isLessor()）
    const userRole = app.getUserRole()
    let isPartyA = app.isLessor()
    if (options.isPartyA !== undefined) {
      isPartyA = options.isPartyA === 'true' || options.isPartyA === true
    }
    const signRoleText = isPartyA ? '甲方（出租人）' : '乙方（承租人）'

    this.setData({
      isPartyA: isPartyA,
      signRoleText: signRoleText
    })

    // 初始化签名画布
    this.initCanvas()
  },

  onReady() {
    // 创建签名上下文
    this.signContext = wx.createCanvasContext('signCanvas')
  },

  // 加载合同详情
  loadContractDetail(contractId) {
    wx.showLoading({ title: '加载中...' })

    api.getContractDetail(contractId).then(res => {
      wx.hideLoading()

      if (res.code === 200 && res.data) {
        const contract = res.data.contract || res.data
        const lessor = res.data.lessor || {}
        const lessee = res.data.lessee || {}

        this.setData({
          'contractInfo.id': contract.id || contractId,
          'contractInfo.title': contract.title || '房屋租赁合同',
          'contractInfo.contractNo': contract.contract_no || '',
          'contractInfo.partyA': lessor.name || lessor.company_name || contract.partyA_name || '',
          'contractInfo.partyB': lessee.name || contract.partyB_name || '',
          'contractInfo.propertyAddress': contract.property_address || '',
          'contractInfo.leaseStartDate': contract.lease_start_date || '',
          'contractInfo.leaseEndDate': contract.lease_end_date || '',
          'contractInfo.monthlyRent': contract.monthly_rent || '',
          'contractInfo.status': this.getStatusKey(contract.status)
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('加载合同详情失败', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 将数字状态转换为字符串key
  getStatusKey(status) {
    const statusMap = {
      0: 'draft',
      1: 'pending',
      2: 'pending_tenant',
      3: 'signed',
      4: 'rejected',
      5: 'cancelled',
      6: 'expired'
    }
    return statusMap[status] || 'pending'
  },

  // 初始化画布
  initCanvas() {
    const query = wx.createSelectorQuery().in(this)
    query.select('.canvas-wrapper').boundingClientRect((rect) => {
      if (rect) {
        this.canvasWidth = rect.width
        this.canvasHeight = rect.height
      }
    }).exec()
  },

  // 笔迹粗细变更
  onThicknessChange(e) {
    this.setData({
      currentThickness: e.detail.value
    })
  },

  // 签名颜色变更
  onColorChange(e) {
    this.setData({
      currentColor: e.detail.value
    })
  },

  // 点击选择颜色
  selectColor(e) {
    const color = e.currentTarget.dataset.color
    this.setData({
      currentColor: color
    })
  },

  // 点击选择粗细
  selectThickness(e) {
    const thickness = e.currentTarget.dataset.thickness
    this.setData({
      currentThickness: thickness
    })
  },

  // 触摸开始
  handleTouchStart(e) {
    if (!this.signContext) return

    this.isDrawing = true
    const touch = e.touches[0]
    const point = {
      x: touch.x,
      y: touch.y
    }

    this.points = [point]

    // 设置画笔样式
    this.signContext.setStrokeStyle(this.data.currentColor)
    this.signContext.setLineWidth(parseInt(this.data.currentThickness))
    this.signContext.setLineCap('round')
    this.signContext.setLineJoin('round')

    this.signContext.moveTo(point.x, point.y)
    this.signContext.stroke()
    this.signContext.draw(true)
  },

  // 触摸移动
  handleTouchMove(e) {
    if (!this.isDrawing || !this.signContext) return

    const touch = e.touches[0]
    const point = {
      x: touch.x,
      y: touch.y
    }

    this.points.push(point)

    this.signContext.lineTo(point.x, point.y)
    this.signContext.stroke()
    this.signContext.draw(true)
  },

  // 触摸结束
  handleTouchEnd(e) {
    if (!this.isDrawing) return

    this.isDrawing = false
    this.signContext.draw(true)

    // 标记已有签名
    if (this.points && this.points.length > 0) {
      this.setData({
        hasSigned: true
      })
    }

    this.points = []
  },

  // 点击画布（防止冒泡）
  handleCanvasTap(e) {
    // 阻止事件冒泡
  },

  // 清除签名
  clearSign() {
    if (!this.signContext) return

    this.signContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    this.signContext.draw()

    this.setData({
      hasSigned: false
    })
  },

  // 重签
  reSign() {
    this.clearSign()
  },

  // 获取签名图片
  getSignatureImage() {
    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvasId: 'signCanvas',
        success: (res) => {
          // 读取图片并转为base64
          wx.getFileSystemManager().readFile({
            filePath: res.tempFilePath,
            encoding: 'base64',
            success: (readRes) => {
              resolve(readRes.data)
            },
            fail: (err) => {
              reject(err)
            }
          })
        },
        fail: (err) => {
          reject(err)
        }
      }, this)
    })
  },

  // 点击确认签署按钮
  submitSign() {
    if (!this.data.hasSigned) {
      wx.showToast({
        title: '请先签名',
        icon: 'none'
      })
      return
    }

    // 生成签署时间
    const now = new Date()
    const signTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    this.setData({
      showConfirmDialog: true,
      signTime: signTime
    })
  },

  // 关闭确认弹窗
  closeConfirmDialog() {
    this.setData({
      showConfirmDialog: false
    })
  },

  // 确认签署
  async confirmSign() {
    this.setData({
      showConfirmDialog: false,
      isSubmitting: true
    })

    try {
      // 获取签名图片
      const signatureBase64 = await this.getSignatureImage()
      const signature = 'data:image/png;base64,' + signatureBase64
      const { contractInfo, isPartyA } = this.data

      let res
      if (isPartyA) {
        // 甲方签署
        res = await api.lessorSign(contractInfo.id, signature)
      } else {
        // 乙方签署
        res = await api.tenantSign(contractInfo.id, signature)
      }

      if (res.code === 200) {
        this.setData({
          showResultDialog: true,
          resultType: 'success',
          resultTitle: '签署成功',
          resultMessage: isPartyA ? '甲方签署已完成，请等待乙方签署' : '乙方签署已完成，合同正式生效'
        })
      } else {
        throw new Error(res.message || '签署失败')
      }
    } catch (err) {
      console.error('签署请求失败', err)
      this.setData({
        showResultDialog: true,
        resultType: 'error',
        resultTitle: '签署失败',
        resultMessage: err.message || '签署过程出现错误，请稍后重试'
      })
    } finally {
      this.setData({
        isSubmitting: false
      })
    }
  },

  // 关闭结果弹窗
  closeResultDialog() {
    this.setData({
      showResultDialog: false
    })
    wx.navigateBack()
  },

  // 查看详情（从结果弹窗）
  viewContractDetail() {
    this.setData({
      showResultDialog: false
    })
    wx.navigateTo({
      url: `/pages/contract-detail/index?id=${this.data.contractInfo.id}`
    })
  },

  // 重新签署（从结果弹窗）
  reSignFromResult() {
    this.setData({
      showResultDialog: false
    })
    this.clearSign()
  },

  // 返回首页
  goHome() {
    this.setData({
      showResultDialog: false
    })
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 清除签名确认
  showClearConfirmDialog() {
    if (!this.data.hasSigned) return

    wx.showModal({
      title: '确认清除',
      content: '确定要清除当前签名吗？',
      confirmText: '清除',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          this.clearSign()
        }
      }
    })
  },

  // 计算状态文本
  get statusText() {
    const statusMap = {
      'draft': '草稿',
      'pending': '待签署',
      'pending_tenant': '待乙方签署',
      'signed': '已签署',
      'rejected': '已拒绝',
      'cancelled': '已取消',
      'expired': '已到期'
    }
    return statusMap[this.data.contractInfo.status] || '待签署'
  }
})