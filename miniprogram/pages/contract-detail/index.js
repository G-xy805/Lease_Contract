// pages/contract-detail/index.js
const app = getApp()
const api = require('../../services/api')
const { CONTRACT_STATUS_TEXT, CONTRACT_STATUS_COLOR, PAYMENT_METHODS, CONTRACT_STATUS, USER_ROLE } = require('../../utils/constants')

Page({
  data: {
    contractId: '',
    contractInfo: null,
    loading: false,
    pdfLoading: false,
    signLoading: false,
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
    canDelete: false,
    showVerifyInfo: false
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

    const itemMapping = {
      item_tv_qty: '电视',
      item_wardrobe_qty: '衣柜',
      item_tv_remote_qty: '电视遥控器',
      item_tv_table_qty: '电视柜',
      item_box_qty: '机顶盒',
      item_sofa_qty: '沙发',
      item_coffee_table_qty: '茶几',
      item_dining_table_qty: '餐桌',
      item_chair_qty: '餐桌椅',
      item_bed_qty: '床',
      item_nightstand_qty: '床头柜',
      item_curtain_qty: '窗帘',
      item_ac_qty: '空调',
      item_ac_remote_qty: '空调遥控器',
      item_fridge_qty: '冰箱',
      item_mattress_qty: '床垫子',
      item_washer_qty: '洗衣机',
      item_water_heater_qty: '热水器',
      item_gas_stove_qty: '煤气灶',
      item_hood_qty: '油烟机',
      item_induction_qty: '电磁灶',
      item_door_card_qty: '门禁卡',
      item_water_card_qty: '水卡',
      item_power_card_qty: '电卡'
    }

    let items = []
    // 支持新的 inventory_items JSON数组格式
    if (rawContract.inventory_items && Array.isArray(rawContract.inventory_items)) {
      items = rawContract.inventory_items.map(item => ({
        name: item.name || itemMapping[item.templateField] || item.templateField,
        quantity: item.quantity
      }))
    } else {
      // 兼容旧的分散字段格式
      for (const [key, label] of Object.entries(itemMapping)) {
        if (rawContract[key] && rawContract[key] > 0) {
          items.push({ name: label, quantity: rawContract[key] })
        }
      }
    }

    const feeLabels = {
      fee_water: '水费',
      fee_electric: '电费',
      fee_gas: '燃气费',
      fee_tv: '电视费',
      fee_network: '网络费',
      fee_property: '物业费',
      fee_heating: '暖气费'
    }
    const fees = []
    for (const [key, label] of Object.entries(feeLabels)) {
      if (rawContract[key] !== undefined) {
        fees.push({ label, tenant: rawContract[key] ? '乙方承担' : '甲方承担' })
      }
    }

    const meters = []
    if (rawContract.electricity_meter !== undefined && rawContract.electricity_meter !== null) meters.push({ label: '电表读数', value: rawContract.electricity_meter })
    if (rawContract.water_meter !== undefined && rawContract.water_meter !== null) meters.push({ label: '水表读数', value: rawContract.water_meter })
    if (rawContract.gas_meter !== undefined && rawContract.gas_meter !== null) meters.push({ label: '燃气表读数', value: rawContract.gas_meter })

    // 字段映射：兼容旧字段（lessor_*/lessee_*）和新字段（partyA_*/partyB_*）
    const getField = (newField, oldField) => {
      return rawContract[newField] || rawContract[oldField] || ''
    }

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
        name: getField('partyA_company', 'lessor_name') || getField('partyA_company', 'partyA_company'),
        company: getField('partyA_company', 'lessor_name'),
        phone: getField('partyA_phone', 'lessor_phone'),
        phone2: getField('partyA_phone2', 'lessor_phone2'),
        contact: getField('partyA_contact', 'lessor_contact'),
        idCard: getField('partyA_idcard', 'lessor_idcard'),
        account: getField('partyA_account', 'lessor_account')
      },

      partyB: {
        name: getField('partyB_name', 'lessee_name'),
        idCard: getField('partyB_idCard', 'lessee_idcard'),
        phone: getField('partyB_phone', 'lessee_phone'),
        contact: getField('partyB_contact', 'lessee_contact')
      },

      property: {
        address: rawContract.house_address || '',
        area: rawContract.house_area || '0',
        purpose: rawContract.rent_purpose || ''
      },

      lease: {
        startDate: rawContract.lease_start || '',
        endDate: rawContract.lease_end || '',
        months: rawContract.lease_months || 0,
        advanceNoticeDays: rawContract.advance_notice_days || 30,
        purpose: rawContract.rent_purpose || '居住使用'
      },

      rent: {
        monthly: rawContract.monthly_rent || 0,
        yearly: rawContract.year_rent || (rawContract.monthly_rent || 0) * 12,
        paymentMethod: PAYMENT_METHODS[rawContract.payment_method] || '押一付一',
        paymentCycle: rawContract.payment_cycle || '',
        paymentCount: rawContract.payment_count || 1,
        firstPaymentAmount: rawContract.first_payment_amount || 0,
        firstPaymentDate: rawContract.first_payment_date || '',
        secondPaymentAmount: rawContract.second_payment_amount || 0,
        secondPaymentDate: rawContract.second_payment_date || '',
        thirdPaymentAmount: rawContract.third_payment_amount || 0,
        thirdPaymentDate: rawContract.third_payment_date || '',
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

      fees,
      feesMap: {
        water: fees.find(f => f.label === '水费')?.tenant || '甲方承担',
        electric: fees.find(f => f.label === '电费')?.tenant || '甲方承担',
        gas: fees.find(f => f.label === '燃气费')?.tenant || '甲方承担',
        tv: fees.find(f => f.label === '电视费')?.tenant || '甲方承担',
        network: fees.find(f => f.label === '网络费')?.tenant || '甲方承担',
        property: fees.find(f => f.label === '物业费')?.tenant || '甲方承担',
        heating: fees.find(f => f.label === '暖气费')?.tenant || '甲方承担'
      },
      meters,
      items,

      remark: rawContract.remark || '',
      inviteCode: rawContract.invite_code || '',
      rejectReason: rawContract.reject_reason || ''
    }
  },

  async loadContractInfo(id) {
    this.setData({ loading: true })

    const userInfo = app.globalData.userInfo
    const userRole = userInfo?.role
    const isPartyA = userRole === USER_ROLE.LESSOR

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
        let canEdit = false
        const inviteCode = contractInfo.inviteCode || ''

        if (contractStatus === CONTRACT_STATUS.PENDING_LESSOR_SIGN) {
          needPartyASign = isPartyA
          canDelete = isPartyA
          canEdit = isPartyA
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
          canDelete,
          canEdit
        })
      }

      this.setData({ contractInfo, loading: false })
    } catch (err) {
      console.error('加载合同详情失败', err)
      this.setData({ contractInfo: null, loading: false })
    }
  },

  onEditContract() {
    const contractId = this.data.contractInfo?.id
    if (!contractId) {
      wx.showToast({ title: '合同ID不存在', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/create-contract/index?contractId=${contractId}`
    })
  },

  onCopyCode() {
    const verifyCode = this.data.contractInfo.verifyCode
    wx.setClipboardData({
      data: verifyCode,
      success: () => {
        wx.showToast({ title: '验证码已复制', icon: 'success' })
      }
    })
  },

  async onDownloadPdf() {
    const contractId = this.data.contractInfo?.id
    if (!contractId) {
      wx.showToast({ title: '合同ID不存在', icon: 'none' })
      return
    }

    wx.showLoading({ title: '正在生成PDF...' })

    try {
      const tempFilePath = await api.downloadContractPdf(contractId)

      wx.hideLoading()

      // 打开PDF文档
      wx.openDocument({
        filePath: tempFilePath,
        fileType: 'pdf',
        success: () => {
          console.log('打开PDF成功')
        },
        fail: (err) => {
          console.error('打开PDF失败:', err)
          wx.showToast({ title: '打开失败，请重试', icon: 'none' })
        }
      })
    } catch (err) {
      wx.hideLoading()
      console.error('下载PDF失败:', err)
      wx.showToast({ title: err.message || '下载失败', icon: 'none' })
    }
  },

  onToggleVerifyInfo() {
    this.setData({ showVerifyInfo: !this.data.showVerifyInfo })
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

  async onGenerateShare() {
    const { contractId } = this.data
    wx.showLoading({ title: '生成中...' })
    try {
      const res = await api.shareContract(contractId)
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
    this.setData({ showShareModal: false, showSharePopup: false })
  },

  onShareToChat() {
    const { inviteCode, contractInfo } = this.data
    const shareContent = `房屋租赁合同邀请\n合同名称：${contractInfo?.title || '房屋租赁合同'}\n邀请码：${inviteCode}\n点击链接查看并签署合同`

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })

    wx.updateShareMenu({
      withShareTicket: true,
      isPrivacyAuthorized: true,
      success: () => {
        wx.showToast({ title: '点击右上角分享', icon: 'none' })
      }
    })
  },

  onShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    wx.showToast({ title: '点击右上角分享给好友', icon: 'none' })
  },

  async onGenerateShare() {
    const { contractId } = this.data
    wx.showLoading({ title: '生成中...' })
    try {
      const res = await api.shareContract(contractId)
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
      confirmColor: '#07c160',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发送中...' })
          try {
            // 提醒功能已移除，直接使用生成分享链接
            // await api.sendInvite(contractId).catch(() => null)
            wx.hideLoading()
            wx.showToast({ title: '提醒已发送', icon: 'success' })
          } catch (err) {
            wx.hideLoading()
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
      confirmColor: '#ee0a24',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          try {
            await api.deleteContract(this.data.contractId).catch(() => null)
            wx.hideLoading()
            wx.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => { wx.navigateBack() }, 1500)
          } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  onPartyASign() {
    const { contractId } = this.data
    wx.showModal({
      title: '确认签署甲方',
      content: '确定要签署此合同吗？签署后合同将等待乙方签署。',
      confirmText: '确认签署',
      confirmColor: '#07c160',
      success: (res) => {
        if (res.confirm) {
          this.setData({ signLoading: true })
          wx.navigateTo({
            url: `/pages/sign-contract/index?contractId=${contractId}&isPartyA=true`,
            fail: () => {
              this.setData({ signLoading: false })
            }
          })
          setTimeout(() => { this.setData({ signLoading: false }) }, 1000)
        }
      }
    })
  },

  onPartyBSign() {
    const { contractId, inviteCode } = this.data
    wx.showModal({
      title: '确认签署乙方',
      content: '确定要签署此合同吗？签署后合同将正式生效。',
      confirmText: '确认签署',
      confirmColor: '#07c160',
      success: (res) => {
        if (res.confirm) {
          this.setData({ signLoading: true })
          wx.navigateTo({
            url: `/pages/sign-contract/index?contractId=${contractId}&isPartyA=false&inviteCode=${inviteCode}`,
            fail: () => {
              this.setData({ signLoading: false })
            }
          })
          setTimeout(() => { this.setData({ signLoading: false }) }, 1000)
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
          wx.showLoading({ title: '生成中...' })
          api.shareContract(contractId).then(res => {
            wx.hideLoading()
            if (res.code === 200) {
              wx.showToast({ title: '生成成功', icon: 'success' })
              this.setData({ inviteCode: res.data?.invite_code })
              this.loadContractInfo(contractId)
            } else {
              wx.showToast({ title: res.message || '生成失败', icon: 'none' })
            }
          }).catch(err => {
            wx.hideLoading()
            wx.showToast({ title: '网络错误', icon: 'none' })
          })
        }
      }
    })
  }
})
