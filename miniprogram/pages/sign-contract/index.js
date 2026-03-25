// pages/sign-contract/index.js
const app = getApp()
const api = require('../../services/api')

Page({
  data: {
    // 合同信息
    contractInfo: {
      id: '',
      title: '房屋租赁合同',
      contractNo: 'HT202403150001',
      partyA: '张三',
      partyB: '李四',
      status: 'pending'
    },

    // 当前用户角色 (true=甲方, false=乙方)
    isPartyA: true,

    // 邀请码（乙方访问时使用）
    inviteCode: '',

    // 签名配置
    currentColor: '#000000',  // 黑色
    currentThickness: 2,     // 细
    hasSigned: false,

    // 提交状态
    isSubmitting: false,

    // 结果弹窗
    showResult: false,
    resultType: 'success',  // success / error
    resultTitle: '',
    resultMessage: '',

    // 签名数据
    signatureImage: ''
  },

  // 签名上下文
  signContext: null,
  // 签名路径
  points: [],
  isDrawing: false,

  onLoad(options) {
    // 获取传入的合同信息
    // 兼容两种参数格式：contractId/id 和 isPartyA/role
    const contractId = options.contractId || options.id
    const isPartyA = options.isPartyA !== undefined
      ? (options.isPartyA === 'true' || options.isPartyA === true)
      : (options.role === 'partyA' || options.role === 'lessor')

    if (contractId) {
      this.setData({
        'contractInfo.id': contractId
      })
    }
    if (options.title) {
      this.setData({
        'contractInfo.title': decodeURIComponent(options.title)
      })
    }
    if (options.contractNo) {
      this.setData({
        'contractInfo.contractNo': options.contractNo
      })
    }
    if (options.partyA) {
      this.setData({
        'contractInfo.partyA': decodeURIComponent(options.partyA)
      })
    }
    if (options.partyB) {
      this.setData({
        'contractInfo.partyB': decodeURIComponent(options.partyB)
      })
    }

    this.setData({
      isPartyA: isPartyA,
      inviteCode: options.inviteCode || ''
    })

    if (options.status) {
      this.setData({
        'contractInfo.status': options.status
      })
    }

    // 如果有合同ID，就加载合同信息
    if (contractId) {
      this.loadContractInfo(contractId)
    } else if (!isPartyA && options.inviteCode) {
      // 乙方通过邀请码访问
      this.loadContractByInviteCode(options.inviteCode)
    }

    // 初始化签名画布
    this.initCanvas()
  },

  onReady() {
    // 创建签名上下文
    this.signContext = wx.createCanvasContext('signCanvas', this)
  },

  // 通过邀请码加载合同信息
  loadContractByInviteCode(inviteCode) {
    wx.showLoading({ title: '加载中...' })
    wx.request({
      url: `${app.globalData.baseUrl}/api/invitations/${inviteCode}/verify`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 200) {
          const contract = res.data.data.contract
          this.setData({
            'contractInfo.id': contract.id,
            'contractInfo.title': contract.title || '房屋租赁合同',
            'contractInfo.contractNo': contract.contract_no || '',
            'contractInfo.partyA': contract.lessor_name || '',
            'contractInfo.partyB': contract.lessee_name || '',
            'contractInfo.status': 'pending_sign'
          })
        } else {
          wx.showToast({ title: res.data.message || '无效的邀请码', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 加载合同详情
  loadContractInfo(contractId) {
    wx.showLoading({ title: '加载中...' })
    wx.request({
      url: `${app.globalData.baseUrl}/api/contracts/${contractId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 200) {
          const contract = res.data.data.contract
          this.setData({
            'contractInfo.id': contract.id,
            'contractInfo.title': contract.title || '房屋租赁合同',
            'contractInfo.contractNo': contract.contract_no || '',
            'contractInfo.partyA': contract.lessor_name || '',
            'contractInfo.partyB': contract.lessee_name || '',
            'contractInfo.status': contract.status === 3 ? 'pending_sign' : 'pending'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
      }
    })
  },

  // 初始化画布
  initCanvas() {
    // 设置画布尺寸
    const query = wx.createSelectorQuery().in(this)
    query.select('.canvas-wrapper').boundingClientRect((rect) => {
      if (rect) {
        this.canvasWidth = rect.width
        this.canvasHeight = rect.height
      }
    }).exec()
  },

  // 选择颜色
  selectColor(e) {
    const color = e.currentTarget.dataset.color
    this.setData({
      currentColor: color
    })
  },

  // 选择粗细
  selectThickness(e) {
    const thickness = e.currentTarget.dataset.thickness
    this.setData({
      currentThickness: parseInt(thickness)
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
    this.signContext.setLineWidth(this.data.currentThickness)
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
    if (this.points.length > 0) {
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
      hasSigned: false,
      signatureImage: ''
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

  // 提交签署
  async submitSign() {
    if (!this.data.hasSigned) {
      wx.showToast({
        title: '请先签名',
        icon: 'none'
      })
      return
    }

    this.setData({
      isSubmitting: true
    })

    try {
      // 获取签名图片
      const signatureBase64 = await this.getSignatureImage()
      const signature = 'data:image/png;base64,' + signatureBase64
      const { contractInfo, isPartyA } = this.data

      if (isPartyA) {
        // 甲方签署
        const res = await api.signContract(contractInfo.id, signature)
        if (res.code === 200) {
          this.showResultPopup('success', '签署成功', '甲方签署已完成，请分享邀请码给乙方进行签署。')
        }
      } else {
        // 乙方签署
        const res = await api.tenantSign(contractInfo.id, signature)
        if (res.code === 200) {
          this.showResultPopup('success', '签署成功', '合同双方签署已完成，合同正式生效！')
        }
      }
    } catch (err) {
      console.error('签署请求失败', err)
      this.showResultPopup('error', '签署失败', err.message || '签署过程出现错误，请稍后重试。')
    } finally {
      this.setData({
        isSubmitting: false
      })
    }
  },

  // 显示结果弹窗
  showResultPopup(type, title, message) {
    this.setData({
      showResult: true,
      resultType: type,
      resultTitle: title,
      resultMessage: message
    })
  },

  // 关闭弹窗并跳转
  goToResult() {
    this.setData({
      showResult: false
    })

    if (this.data.resultType === 'success') {
      // 跳转到合同详情页
      wx.redirectTo({
        url: `/pages/contract-detail/index?id=${this.data.contractInfo.id}`
      })
    } else {
      // 留在当前页，可重试
      wx.showToast({
        title: '请重试签署',
        icon: 'none'
      })
    }
  },

  // 计算状态文本
  get statusText() {
    const statusMap = {
      'pending': '待签署',
      'pending_sign': '待乙方签署',
      'signed': '已签署',
      'completed': '已完成'
    }
    return statusMap[this.data.contractInfo.status] || '待签署'
  }
})