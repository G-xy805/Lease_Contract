// pages/preview-contract/index.js - 预览合同页（v2重构版）
const app = getApp()
const { formatDate, digitToChinese, formatNumber } = require('../../utils/helpers')
const { CONTRACT_STATUS_TEXT, CONTRACT_STATUS_COLOR, APP_CONFIG } = require('../../utils/constants')

Page({
  data: {
    loading: true,
    contractData: null,
    // 合同基本信息
    contractNo: '',
    contractStatus: '',
    statusText: '',
    statusColor: '',

    // 甲方信息
    lessorInfo: null,
    // 乙方信息
    lesseeInfo: null,
    // 房屋信息
    houseInfo: null,
    // 租赁期限信息
    leaseInfo: null,
    // 租金信息
    rentInfo: null,
    // 押金信息
    depositInfo: null,
    // 支付信息
    paymentInfo: null,
    // 费用约定
    fees: [],
    // 物品清单
    inventoryItems: [],
    // 水电表
    meters: [],
    // 居间服务费
    commissions: [],
    // 备注
    remark: ''
  },

  onLoad(options) {
    this.loadPreviewData()
  },

  /**
   * 加载预览合同数据（优先从Storage读取）
   */
  loadPreviewData() {
    let contractData = null

    // 方式1：从 Storage 读取（推荐方式）
    try {
      const storageData = wx.getStorageSync('preview_contract_data')
      if (storageData) {
        contractData = storageData
        console.log('从Storage加载预览数据:', contractData)
      }
    } catch (err) {
      console.warn('从Storage读取预览数据失败:', err)
    }

    // 方式2：从 globalData 获取（兼容旧逻辑）
    if (!contractData && app.globalData?.previewContractData) {
      contractData = app.globalData.previewContractData
      console.log('从globalData加载预览数据:', contractData)
    }

    if (!contractData) {
      wx.showToast({ title: '缺少合同数据', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.processContractData(contractData)
  },

  /**
   * 处理并格式化合同数据
   */
  processContractData(data) {
    // 生成合同编号
    const contractNo = data.contract_no || this.generateContractNo()

    // 合同状态
    const status = data.status || 1
    const statusText = CONTRACT_STATUS_TEXT[status] || '待签署'
    const statusColor = CONTRACT_STATUS_COLOR[status] || '#FF976A'

    // 甲方信息（兼容新旧字段名）
    const lessorInfo = {
      name: data.partyA_contact || data.lessor_contact || '',
      company: data.partyA_company || data.lessor_name || APP_CONFIG.DEFAULT_COMPANY_NAME,
      phone: data.partyA_phone || data.lessor_phone || '',
      phone2: data.partyA_phone2 || '',
      contact: data.partyA_contact || data.lessor_contact || '',
      idcard: data.partyA_idcard || '',
      account: data.partyA_account || ''
    }

    // 乙方信息（兼容新旧字段名）
    const lesseeInfo = {
      name: data.partyB_name || data.lessee_name || '',
      phone: data.partyB_phone || data.lessee_phone || '',
      idcard: data.partyB_idCard || data.lessee_idcard || '',
      contact: data.partyB_contact || ''
    }

    // 房屋信息
    const houseInfo = {
      address: data.house_address || '',
      area: data.house_area || '',
      purpose: data.rent_purpose || ''
    }

    // 租赁期限信息
    const leaseInfo = {
      leaseStart: this.formatDateForDisplay(data.lease_start),
      leaseEnd: this.formatDateForDisplay(data.lease_end),
      months: data.lease_months || 0,
      advanceNoticeDays: data.advance_notice_days || 30,
      startYear: data.lease_start_year || '',
      startMonth: data.lease_start_month || '',
      startDay: data.lease_start_day || '',
      endYear: data.lease_end_year || '',
      endMonth: data.lease_end_month || '',
      endDay: data.lease_end_day || ''
    }

    // 租金信息（带千分位格式化）
    const monthlyRent = data.monthly_rent || 0
    const rentInfo = {
      monthlyRent: monthlyRent,
      monthlyRentFormatted: formatNumber(monthlyRent),
      yearRent: data.year_rent || (monthlyRent && data.lease_months ? monthlyRent * data.lease_months : 0),
      yearRentFormatted: formatNumber(data.year_rent || (monthlyRent * data.lease_months)),
      paymentMethod: data.payment_method || 1,
      paymentCycleText: this.getPaymentMethodText(data.payment_method),
      paymentCycle: data.payment_cycle || 1,
      paymentCount: data.payment_count || 1
    }

    // 押金信息（带大写金额）
    const deposit = data.deposit || 0
    const depositInfo = {
      amount: deposit,
      formatted: formatNumber(deposit),
      chinese: data.deposit_chinese || digitToChinese(deposit) || ''
    }

    // 支付计划信息
    const paymentInfo = {
      count: data.payment_count || 1,
      cycle: data.payment_cycle || 1,
      firstAmount: data.first_payment_amount || monthlyRent,
      firstAmountFormatted: formatNumber(data.first_payment_amount || monthlyRent),
      firstDate: this.formatDateForDisplay(data.lease_start),
      secondAmount: data.second_payment_amount || 0,
      secondAmountFormatted: formatNumber(data.second_payment_amount || 0),
      secondDate: this.formatDateForDisplay(data.second_payment_date),
      thirdAmount: data.third_payment_amount || 0,
      thirdAmountFormatted: formatNumber(data.third_payment_amount || 0)
    }

    // 处理物品清单
    const inventoryItems = this.processInventoryItems(data)

    // 处理费用约定
    const fees = this.processFees(data)

    // 处理水电表
    const meters = this.processMeters(data)

    // 处理居间服务费
    const commissions = this.processCommissions(data)

    // 更新页面数据
    this.setData({
      loading: false,
      contractData: data,
      contractNo,
      contractStatus: status,
      statusText,
      statusColor,
      lessorInfo,
      lesseeInfo,
      houseInfo,
      leaseInfo,
      rentInfo,
      depositInfo,
      paymentInfo,
      inventoryItems,
      fees,
      meters,
      commissions,
      remark: data.remark || ''
    })
  },

  /**
   * 获取支付方式文本
   */
  getPaymentMethodText(method) {
    const methodMap = { 1: '月付', 3: '季付', 6: '半年付', 12: '年付' }
    return methodMap[method] || '月付'
  },

  /**
   * 生成合同编号
   */
  generateContractNo() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    return `HT${year}${month}${day}${random}`
  },

  /**
   * 格式化日期显示为中文格式
   */
  formatDateForDisplay(dateStr) {
    if (!dateStr) return ''

    if (typeof dateStr === 'string') {
      // ISO格式日期
      if (dateStr.includes('T')) {
        const d = new Date(dateStr)
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
      }
      // 标准格式 YYYY-MM-DD
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-')
        if (parts.length === 3) {
          return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`
        }
      }
    }

    return dateStr
  },

  /**
   * 处理物品清单数据（支持数组格式和分散字段格式）
   */
  processInventoryItems(data) {
    const items = []

    // 优先使用 inventory_items 数组格式
    if (data.inventory_items && Array.isArray(data.inventory_items)) {
      data.inventory_items.forEach(item => {
        if (item.quantity && parseInt(item.quantity) > 0) {
          items.push({
            name: item.name,
            quantity: parseInt(item.quantity),
            unit: item.unit || '个'
          })
        }
      })
      return items
    }

    // 兼容旧的分散字段格式
    const inventoryFields = [
      { key: 'item_tv_qty', label: '电视', unit: '台' },
      { key: 'item_wardrobe_qty', label: '衣柜', unit: '个' },
      { key: 'item_sofa_qty', label: '沙发', unit: '个' },
      { key: 'item_bed_qty', label: '床', unit: '张' },
      { key: 'item_ac_qty', label: '空调', unit: '台' },
      { key: 'item_fridge_qty', label: '冰箱', unit: '台' },
      { key: 'item_washer_qty', label: '洗衣机', unit: '台' },
      { key: 'item_water_heater_qty', label: '热水器', unit: '台' }
    ]

    inventoryFields.forEach(item => {
      const qty = data[item.key]
      if (qty && parseInt(qty) > 0) {
        items.push({
          name: item.label,
          quantity: parseInt(qty),
          unit: item.unit
        })
      }
    })

    return items
  },

  /**
   * 处理费用约定数据
   */
  processFees(data) {
    const feeLabels = {
      fee_water: '水费',
      fee_electric: '电费',
      fee_gas: '燃气费',
      fee_tv: '有线电视',
      fee_network: '网络费',
      fee_property: '物业费',
      fee_heating: '暖气费'
    }

    return Object.entries(feeLabels)
      .filter(([key]) => data[key] !== undefined)
      .map(([key, label]) => ({
        label,
        tenant: data[key] ? '乙方承担' : '甲方承担'
      }))
  },

  /**
   * 处理水电表读数
   */
  processMeters(data) {
    const meters = []
    if (data.electricity_meter) {
      meters.push({ label: '电表读数', value: data.electricity_meter })
    }
    if (data.water_meter) {
      meters.push({ label: '水表读数', value: data.water_meter })
    }
    if (data.gas_meter) {
      meters.push({ label: '燃气表读数', value: data.gas_meter })
    }
    return meters
  },

  /**
   * 处理居间服务费
   */
  processCommissions(data) {
    const commissions = []
    if (data.partyA_commission) {
      commissions.push({
        party: '甲方',
        amount: data.partyA_commission,
        formatted: formatNumber(data.partyA_commission),
        chinese: data.partyA_commission_chinese || digitToChinese(data.partyA_commission) || ''
      })
    }
    if (data.partyB_commission) {
      commissions.push({
        party: '乙方',
        amount: data.partyB_commission,
        formatted: formatNumber(data.partyB_commission),
        chinese: data.partyB_commission_chinese || digitToChinese(data.partyB_commission) || ''
      })
    }
    return commissions
  },

  /**
   * 返回编辑页面
   */
  goBackToEdit() {
    const { contractData } = this.data
    if (contractData) {
      // 将数据保存回 globalData 以便编辑页面恢复
      app.globalData.previewContractData = contractData
    }
    wx.navigateBack()
  },

  /**
   * 确认提交合同
   */
  async onSubmit() {
    const { contractData, contractNo } = this.data

    if (!contractData) {
      wx.showToast({ title: '缺少合同数据', icon: 'none' })
      return
    }

    wx.showLoading({ title: '正在提交...', mask: true })

    try {
      // 调用创建合同API
      const res = await api.createContract(contractData)

      wx.hideLoading()

      if (res.code === 200) {
        wx.showToast({
          title: '合同创建成功',
          icon: 'success'
        })

        // 延迟跳转到合同列表
        setTimeout(() => {
          wx.navigateBack()
          // 可选：标记需要刷新列表
          wx.setStorageSync('need_refresh_contracts', true)
        }, 1500)
      } else {
        wx.showToast({
          title: res.message || '创建失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('提交合同失败', err)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    }
  }
})
