// pages/contract-detail/index.js
const app = getApp()
const api = require('../../services/api')
const { CONTRACT_STATUS_TEXT, CONTRACT_STATUS_COLOR, PAYMENT_METHODS } = require('../../utils/constants')

Page({
  data: {
    contractId: '',
    contractInfo: null,
    loading: false,
    pdfLoading: false,
    partyASigned: false,
    partyBSigned: false,
    partyASignTime: '',
    partyBSignTime: '',
    signedAt: '',
    statusTagType: 'primary',
    statusText: '待甲方签署',
    canRemind: false,
    isPartyA: false,
    needPartyASign: false,
    needPartyBSign: false,
    needShare: false,
    inviteCode: '',
    showShareModal: false,
    shareQrCode: '',
    shareUrl: '',
    showSharePopup: false,
    qrCode: '',
    canDelete: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ contractId: options.id })
      this.loadContractInfo(options.id)
    }
  },

  onShow() {
    if (this.data.contractId) {
      this.loadContractInfo(this.data.contractId)
    }
  },

  onShareAppMessage() {
    const { contractInfo, inviteCode } = this.data
    if (contractInfo) {
      return {
        title: `房屋租赁合同 - ${contractInfo.title}`,
        path: `/pages/verify-invite/index?code=${inviteCode}`,
        imageUrl: ''
      }
    }
  },

  onShareTimeline() {
    const { contractInfo, inviteCode } = this.data
    if (contractInfo) {
      return {
        title: `房屋租赁合同 - ${contractInfo.title}`,
        query: `code=${inviteCode}`
      }
    }
  },

  transformContractData(rawContract) {
    if (!rawContract) return null

    return {
      id: rawContract.id,
      title: rawContract.title || '房屋租赁合同',
      contractNo: rawContract.contract_no || '',
      verifyCode: rawContract.verify_code || rawContract.invite_code || '',
      createTime: rawContract.created_at || '',
      signedAt: rawContract.sign_date || rawContract.effective_at || '',
      status: rawContract.status,

      lessorSignStatus: rawContract.lessor_sign_status || 0,
      lesseeSignStatus: rawContract.lessee_sign_status || 0,
      lessorSignedAt: rawContract.lessor_signed_at || '',
      lesseeSignedAt: rawContract.lessee_signed_at || '',

      partyA: {
        name: rawContract.lessor_name || '',
        company: rawContract.partyA_company || '',
        phone: rawContract.lessor_phone || '',
        phone2: rawContract.lessor_phone2 || '',
        contact: rawContract.lessor_contact || '',
        idCard: rawContract.lessor_idcard || '',
        account: rawContract.lessor_account || ''
      },

      partyB: {
        name: rawContract.lessee_name || '',
        idCard: rawContract.lessee_idcard || '',
        phone: rawContract.lessee_phone || ''
      },

      property: {
        address: rawContract.house_address || '',
        area: rawContract.house_area || '0'
      },

      lease: {
        startDate: rawContract.lease_start || '',
        endDate: rawContract.lease_end || '',
        purpose: rawContract.rent_purpose || '居住使用'
      },

      rent: {
        monthly: rawContract.monthly_rent || 0,
        yearly: rawContract.year_rent || (rawContract.monthly_rent || 0) * 12,
        paymentMethod: PAYMENT_METHODS[rawContract.payment_method] || '押一付一',
        deposit: rawContract.deposit || 0,
        depositChinese: rawContract.deposit_chinese || ''
      },

      intermediary: {
        name: rawContract.intermediary_name || '',
        partyACommission: rawContract.partyA_commission || '',
        partyACommissionChinese: rawContract.partyA_commission_chinese || '',
        partyBCommission: rawContract.partyB_commission || '',
        partyBCommissionChinese: rawContract.partyB_commission_chinese || ''
      },

      items: rawContract.items ? (typeof rawContract.items === 'string' ? JSON.parse(rawContract.items) : rawContract.items) : [],
      agreements: rawContract.agreements ? (typeof rawContract.agreements === 'string' ? JSON.parse(rawContract.agreements) : rawContract.agreements) : [],
      remark: rawContract.remark || '',
      inviteCode: rawContract.invite_code || '',
      rejectReason: rawContract.reject_reason || ''
    }
  },

  async loadContractInfo(id) {
    this.setData({ loading: true })

    const userInfo = app.globalData.userInfo
    const userRole = userInfo?.role
    const isPartyA = userRole === 'PARTY_A'

    try {
      const contractRes = await api.getContractDetail(id).catch(() => null)
      const rawContract = contractRes?.data?.contract
      const contractInfo = this.transformContractData(rawContract)

      if (contractInfo) {
        const partyASigned = rawContract.lessor_sign_status === 1
        const partyBSigned = rawContract.lessee_sign_status === 1
        const contractStatus = rawContract.status || 1

        const statusTagType = CONTRACT_STATUS_COLOR[contractStatus] || 'primary'
        const statusText = CONTRACT_STATUS_TEXT[contractStatus] || '待签署'

        let canRemind = false
        let needPartyASign = false
        let needPartyBSign = false
        let needShare = false
        let canDelete = false
        const inviteCode = contractInfo.inviteCode || ''

        if (contractStatus === CONTRACT_STATUS.PENDING_LESSOR_SIGN) {
          needPartyASign = isPartyA
          canDelete = isPartyA
        } else if (contractStatus === CONTRACT_STATUS.PENDING_LESSEE_SIGN) {
          canRemind = isPartyA
          needPartyBSign = !isPartyA
          needShare = isPartyA
        }

        this.setData({
          partyASigned,
          partyBSigned,
          partyASignTime: rawContract.lessor_signed_at || '',
          partyBSignTime: rawContract.lessee_signed_at || '',
          signedAt: rawContract.sign_date || rawContract.effective_at || '',
          statusTagType,
          statusText,
          canRemind,
          isPartyA,
          needPartyASign,
          needPartyBSign,
          needShare,
          inviteCode,
          canDelete
        })
      }

      this.setData({ contractInfo, loading: false })
    } catch (err) {
      console.error('加载合同详情失败', err)
      this.setData({ contractInfo: null, loading: false })
    }
  },

  onCopyCode() {
    const verifyCode = this.data.contractInfo.verifyCode
    wx.setClipboardData({
      data: verifyCode,
      success: () => {
        wx.showToast({ title: '已复制验证码', icon: 'success' })
      }
    })
  },

  onCopyInviteCode() {
    const inviteCode = this.data.inviteCode
    wx.setClipboardData({
      data: inviteCode,
      success: () => {
        wx.showToast({ title: '已复制邀请码', icon: 'success' })
      }
    })
  },

  async onDownloadPdf() {
    const { contractId } = this.data
    this.setData({ pdfLoading: true })

    try {
      const pdfData = await api.getContractPdf(contractId).catch(() => null)

      if (pdfData && pdfData.data && pdfData.data.url) {
        const baseUrl = app.globalData.baseUrl || 'http://localhost:3000'
        const fullUrl = baseUrl + pdfData.data.url

        wx.downloadFile({
          url: fullUrl,
          success: (res) => {
            if (res.statusCode === 200) {
              const tempFilePath = res.tempFilePath
              wx.openDocument({
                filePath: tempFilePath,
                fileType: 'pdf',
                success: () => {
                  wx.showToast({ title: 'PDF已打开，请在文档界面点击右上角保存', icon: 'none', duration: 3000 })
                },
                fail: (err) => {
                  console.error('打开PDF失败', err)
                  wx.showToast({ title: '打开失败', icon: 'none' })
                }
              })
            } else {
              wx.showToast({ title: '下载失败', icon: 'none' })
            }
            this.setData({ pdfLoading: false })
          },
          fail: (err) => {
            console.error('下载PDF失败', err)
            wx.showToast({ title: '下载失败，请稍后重试', icon: 'none' })
            this.setData({ pdfLoading: false })
          }
        })
      } else {
        wx.showToast({ title: 'PDF生成失败', icon: 'none' })
        this.setData({ pdfLoading: false })
      }
    } catch (err) {
      console.error('PDF操作失败', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
      this.setData({ pdfLoading: false })
    }
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    wx.showToast({ title: '点击右上角分享', icon: 'none' })
  },

  async onGenerateShare() {
    const { contractId } = this.data
    wx.showLoading({ title: '生成中...' })
    try {
      const res = await api.generateShareLink(contractId)
      wx.hideLoading()

      if (res.code === 200 || res.data) {
        this.setData({
          showSharePopup: true,
          showShareModal: true,
          inviteCode: res.data?.invite_code || res.invite_code || '',
          shareUrl: res.data?.share_url || res.share_url || '',
          qrCode: res.data?.qr_code || res.qr_code || '',
          shareQrCode: res.data?.qr_code || res.qr_code || ''
        })
      } else {
        wx.showToast({ title: '生成分享链接失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('生成分享链接失败', err)
      wx.showToast({ title: '生成分享链接失败', icon: 'none' })
    }
  },

  onCloseShareModal() {
    this.setData({ showShareModal: false })
  },

  async onSaveQrCode() {
    const { shareQrCode } = this.data
    if (!shareQrCode) {
      wx.showToast({ title: '暂无二维码', icon: 'none' })
      return
    }

    wx.downloadFile({
      url: shareQrCode,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '已保存', icon: 'success' })
            },
            fail: () => {
              wx.showToast({ title: '保存失败', icon: 'none' })
            }
          })
        }
      },
      fail: () => {
        wx.showToast({ title: '下载失败', icon: 'none' })
      }
    })
  },

  async onSendReminder() {
    const { contractId } = this.data
    wx.showModal({
      title: '发送提醒',
      content: '确定要向未签署方发送签署提醒吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.sendInvite(contractId).catch(() => null)
            wx.showToast({ title: '提醒已发送', icon: 'success' })
          } catch (err) {
            wx.showToast({ title: '发送失败', icon: 'none' })
          }
        }
      }
    })
  },

  onDeleteContract() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此合同吗？删除后不可恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteContract(this.data.contractId).catch(() => null)
            wx.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => { wx.navigateBack() }, 1500)
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  onPartyASign() {
    const { contractId } = this.data
    wx.showModal({
      title: '确认签署',
      content: '确定要签署此合同吗？签署后合同将等待乙方签署。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: `/pages/sign-contract/index?contractId=${contractId}&isPartyA=true` })
        }
      }
    })
  },

  onPartyBSign() {
    const { contractId, inviteCode } = this.data
    wx.showModal({
      title: '确认签署',
      content: '确定要签署此合同吗？签署后合同将正式生效。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: `/pages/sign-contract/index?contractId=${contractId}&isPartyA=false&inviteCode=${inviteCode}` })
        }
      }
    })
  },

  onSendInvite() {
    const { contractId } = this.data
    wx.showModal({
      title: '发送签署邀请',
      content: '确定要发送签署邀请吗？发送后乙方可以通过邀请码访问合同。',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/api/contracts/${contractId}/lessor-sign`,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${wx.getStorageSync('token') || ''}`,
              'Content-Type': 'application/json'
            },
            data: { action: 'generate_invite' },
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({ title: '生成成功', icon: 'success' })
                this.setData({ inviteCode: res.data.invite_code })
                this.loadContractInfo(contractId)
              } else {
                wx.showToast({ title: res.data.message || '生成失败', icon: 'none' })
              }
            },
            fail: () => {
              wx.showToast({ title: '网络错误', icon: 'none' })
            }
          })
        }
      }
    })
  }
})
