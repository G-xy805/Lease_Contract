// pages/preview-contract/index.js
const app = getApp()
const { formatDate, digitToChinese } = require('../../utils/helpers')
const { CONTRACT_STATUS_TEXT, CONTRACT_STATUS_COLOR, APP_CONFIG } = require('../../utils/constants')

Page({
  data: {
    loading: true,
    contractData: null,
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
    // 优先从 URL 参数获取
    if (options.data) {
      try {
        const decodedData = decodeURIComponent(options.data);
        if (!decodedData || decodedData.length < 1) {
          wx.showToast({ title: '无效的合同数据', icon: 'none' });
          setTimeout(() => { wx.navigateBack() }, 1500);
          return;
        }
        const contractData = JSON.parse(decodedData)
        console.log('预览合同数据:', contractData)
        this.processContractData(contractData)
        return
      } catch (err) {
        console.error('解析合同数据失败:', err)
        wx.showToast({ title: '合同数据解析失败', icon: 'none' });
        setTimeout(() => { wx.navigateBack() }, 1500);
        return;
      }
    }

    // 从 globalData 获取
    const globalContractData = app.globalData?.previewContractData
    if (globalContractData) {
      this.processContractData(globalContractData)
      return
    }

    wx.showToast({ title: '缺少合同数据', icon: 'none' })
    setTimeout(() => wx.navigateBack(), 1500)
  },

  processContractData(data) {
    // 生成合同编号
    const contractNo = data.contract_no || data.title?.split(' - ')[1] || this.generateContractNo()

    // 合同状态
    const status = data.status || 1
    const statusText = CONTRACT_STATUS_TEXT[status] || '待签署'
    const statusColor = CONTRACT_STATUS_COLOR[status] || '#FF976A'

    // 甲方信息（兼容旧字段名）
    const lessorInfo = {
      name: data.partyA_contact || data.lessor_contact || '',
      company: data.partyA_company || data.lessor_name || APP_CONFIG.DEFAULT_COMPANY_NAME,
      phone: data.partyA_phone || data.lessor_phone || '',
      phone2: data.partyA_phone2 || '',
      contact: data.partyA_contact || data.lessor_contact || '',
      idcard: data.partyA_idcard || '',
      account: data.partyA_account || ''
    }

    // 乙方信息（兼容旧字段名）
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

    // 租赁期限信息（年月日拆分显示）
    const leaseInfo = {
      leaseStart: this.formatDateForDisplay(data.lease_start),
      leaseEnd: this.formatDateForDisplay(data.lease_end),
      months: data.lease_months || 0,
      advanceNoticeDays: data.advance_notice_days || 30,
      // 年月日拆分
      startYear: data.lease_start_year || '',
      startMonth: data.lease_start_month || '',
      startDay: data.lease_start_day || '',
      endYear: data.lease_end_year || '',
      endMonth: data.lease_end_month || '',
      endDay: data.lease_end_day || ''
    }

    // 租金信息
    const rentInfo = {
      monthlyRent: data.monthly_rent || 0,
      yearRent: data.year_rent || (data.monthly_rent && data.lease_months ? data.monthly_rent * data.lease_months : 0),
      paymentMethod: data.payment_method || 1,
      paymentCycleText: this.getPaymentMethodText(data.payment_method),
      paymentCycle: data.payment_cycle || 1,
      paymentCount: data.payment_count || 1
    }

    // 押金信息
    const depositInfo = {
      amount: data.deposit || 0,
      chinese: data.deposit_chinese || digitToChinese(data.deposit) || ''
    }

    // 支付计划信息
    const paymentInfo = {
      count: data.payment_count || 1,
      cycle: data.payment_cycle || 1,
      firstAmount: data.first_payment_amount || data.monthly_rent || 0,
      firstDate: this.formatDateForDisplay(data.lease_start),
      secondAmount: data.second_payment_amount || 0,
      secondDate: this.formatDateForDisplay(data.second_payment_date),
      thirdAmount: data.third_payment_amount || 0
    }

    // 处理物品清单
    const inventoryItems = this.processInventoryItems(data)

    // 处理费用约定
    const fees = this.processFees(data)

    // 处理水电表
    const meters = this.processMeters(data)

    // 处理居间服务费
    const commissions = this.processCommissions(data)

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

  // 获取支付方式文本
  getPaymentMethodText(method) {
    const methodMap = { 1: '月付', 3: '季付', 6: '半年付', 12: '年付' }
    return methodMap[method] || '月付'
  },

  // 生成合同编号
  generateContractNo() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    return `HT${year}${month}${day}${random}`
  },

  // 格式化日期显示
  formatDateForDisplay(dateStr) {
    if (!dateStr) return ''
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      const d = new Date(dateStr)
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    }
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`
      }
    }
    return dateStr
  },

  // 处理物品清单
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
      { key: 'item_tv_remote_qty', label: '电视遥控器', unit: '个' },
      { key: 'item_tv_table_qty', label: '电视柜', unit: '个' },
      { key: 'item_box_qty', label: '机顶盒', unit: '个' },
      { key: 'item_sofa_qty', label: '沙发', unit: '个' },
      { key: 'item_coffee_table_qty', label: '茶几', unit: '个' },
      { key: 'item_dining_table_qty', label: '餐桌', unit: '张' },
      { key: 'item_chair_qty', label: '餐桌椅', unit: '把' },
      { key: 'item_bed_qty', label: '床', unit: '张' },
      { key: 'item_nightstand_qty', label: '床头柜', unit: '个' },
      { key: 'item_curtain_qty', label: '窗帘', unit: '个' },
      { key: 'item_ac_qty', label: '空调', unit: '台' },
      { key: 'item_ac_remote_qty', label: '空调遥控器', unit: '个' },
      { key: 'item_fridge_qty', label: '冰箱', unit: '台' },
      { key: 'item_mattress_qty', label: '床垫子', unit: '个' },
      { key: 'item_washer_qty', label: '洗衣机', unit: '台' },
      { key: 'item_water_heater_qty', label: '热水器', unit: '台' },
      { key: 'item_gas_stove_qty', label: '煤气灶', unit: '台' },
      { key: 'item_hood_qty', label: '油烟机', unit: '台' },
      { key: 'item_induction_qty', label: '电磁灶', unit: '台' },
      { key: 'item_door_card_qty', label: '门禁卡', unit: '个' },
      { key: 'item_water_card_qty', label: '水卡', unit: '个' },
      { key: 'item_power_card_qty', label: '电卡', unit: '个' }
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

  // 处理费用约定
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

  // 处理水电表
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

  // 处理居间服务费
  processCommissions(data) {
    const commissions = []
    if (data.partyA_commission) {
      commissions.push({
        party: '甲方',
        amount: data.partyA_commission,
        chinese: data.partyA_commission_chinese || digitToChinese(data.partyA_commission) || ''
      })
    }
    if (data.partyB_commission) {
      commissions.push({
        party: '乙方',
        amount: data.partyB_commission,
        chinese: data.partyB_commission_chinese || digitToChinese(data.partyB_commission) || ''
      })
    }
    return commissions
  },

  // 返回修改
  goBackToEdit() {
    const { contractData } = this.data
    if (contractData) {
      app.globalData.previewContractData = contractData
    }
    wx.navigateBack()
  },

  // 将合同数据转换为HTML模板格式
  contractToTemplateData(data) {
    // 日期拆分
    const startParts = this.splitDate(data.lease_start)
    const endParts = this.splitDate(data.lease_end)

    // 处理物品清单 -> 模板字段
    const inventoryTemplateData = this.inventoryItemsToTemplateFields(data.inventory_items)

    // 构建完整的模板数据
    return {
      // 甲方信息
      partyA_company: data.partyA_company || '',
      partyA_phone: data.partyA_phone || '',
      partyA_phone2: data.partyA_phone2 || '',
      partyA_contact: data.partyA_contact || '',
      partyA_idcard: data.partyA_idcard || '',
      partyA_account: data.partyA_account || '',

      // 乙方信息
      partyB_name: data.partyB_name || '',
      partyB_idCard: data.partyB_idCard || '',
      partyB_phone: data.partyB_phone || '',
      partyB_contact: data.partyB_contact || '',

      // 房屋信息
      house_address: data.house_address || '',
      house_area: data.house_area || '',

      // 租赁期限（拆分）
      lease_start_year: startParts.year,
      lease_start_month: startParts.month,
      lease_start_day: startParts.day,
      lease_end_year: endParts.year,
      lease_end_month: endParts.month,
      lease_end_day: endParts.day,
      lease_months: data.lease_months || '',

      // 租金信息
      monthly_rent: data.monthly_rent || '',
      year_rent: data.year_rent || '',
      advance_notice_days: data.advance_notice_days || '',
      payment_count: data.payment_count || '',
      payment_cycle: data.payment_cycle || '',
      first_payment_amount: data.first_payment_amount || '',
      second_payment_amount: data.second_payment_amount || '',
      second_payment_date: data.second_payment_date || '',
      third_payment_amount: data.third_payment_amount || '',

      // 押金
      deposit: data.deposit || '',
      deposit_chinese: data.deposit_chinese || '',

      // 居间服务费
      partyA_commission: data.partyA_commission || '',
      partyA_commission_chinese: data.partyA_commission_chinese || '',
      partyB_commission: data.partyB_commission || '',
      partyB_commission_chinese: data.partyB_commission_chinese || '',

      // 水电表
      electricity_meter: data.electricity_meter || '',
      water_meter: data.water_meter || '',
      gas_meter: data.gas_meter || '',

      // 物品清单
      ...inventoryTemplateData,

      // 其他
      remark: data.remark || '',
      sign_date: data.sign_date || ''
    }
  },

  // 拆分日期为年月日
  splitDate(dateStr) {
    if (!dateStr) return { year: '', month: '', day: '' }
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      const d = new Date(dateStr)
      return {
        year: String(d.getFullYear()),
        month: String(d.getMonth() + 1).padStart(2, '0'),
        day: String(d.getDate()).padStart(2, '0')
      }
    }
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return {
        year: parts[0],
        month: parts[1],
        day: parts[2]
      }
    }
    return { year: '', month: '', day: '' }
  },

  // 物品清单数组转换为模板字段
  inventoryItemsToTemplateFields(inventoryItems) {
    // 初始化所有模板字段为0
    const templateFields = {
      item_tv_qty: '0',
      item_wardrobe_qty: '0',
      item_tv_remote_qty: '0',
      item_tv_table_qty: '0',
      item_box_qty: '0',
      item_sofa_qty: '0',
      item_coffee_table_qty: '0',
      item_dining_table_qty: '0',
      item_chair_qty: '0',
      item_bed_qty: '0',
      item_nightstand_qty: '0',
      item_curtain_qty: '0',
      item_ac_qty: '0',
      item_ac_remote_qty: '0',
      item_fridge_qty: '0',
      item_mattress_qty: '0',
      item_washer_qty: '0',
      item_water_heater_qty: '0',
      item_gas_stove_qty: '0',
      item_hood_qty: '0',
      item_induction_qty: '0',
      item_door_card_qty: '0',
      item_water_card_qty: '0',
      item_power_card_qty: '0'
    }

    // 名称到模板字段的映射
    const nameToField = {
      '电视': 'item_tv_qty',
      '衣柜': 'item_wardrobe_qty',
      '电视遥控器': 'item_tv_remote_qty',
      '电视柜': 'item_tv_table_qty',
      '机顶盒': 'item_box_qty',
      '沙发': 'item_sofa_qty',
      '茶几': 'item_coffee_table_qty',
      '餐桌': 'item_dining_table_qty',
      '餐桌椅': 'item_chair_qty',
      '床': 'item_bed_qty',
      '床头柜': 'item_nightstand_qty',
      '窗帘': 'item_curtain_qty',
      '空调': 'item_ac_qty',
      '空调遥控器': 'item_ac_remote_qty',
      '冰箱': 'item_fridge_qty',
      '床垫子': 'item_mattress_qty',
      '洗衣机': 'item_washer_qty',
      '热水器': 'item_water_heater_qty',
      '煤气灶': 'item_gas_stove_qty',
      '油烟机': 'item_hood_qty',
      '电磁灶': 'item_induction_qty',
      '门禁卡': 'item_door_card_qty',
      '水卡': 'item_water_card_qty',
      '电卡': 'item_power_card_qty'
    }

    if (!inventoryItems || !Array.isArray(inventoryItems)) {
      return templateFields
    }

    inventoryItems.forEach(item => {
      const field = nameToField[item.name]
      if (field && item.quantity) {
        templateFields[field] = String(item.quantity)
      }
    })

    return templateFields
  },

  // 确认签署
  goToSign() {
    const { contractData, contractNo } = this.data
    if (!contractData) {
      wx.showToast({ title: '缺少合同数据', icon: 'none' })
      return
    }

    // 准备签署页面需要的参数
    const signParams = {
      contractId: contractData.id || '',
      contractNo: contractNo,
      title: contractData.title || '房屋租赁合同',
      partyA: contractData.partyA_company || contractData.lessor_name || '',
      partyB: contractData.partyB_name || contractData.lessee_name || '',
      isPartyA: app.isLessor() ? 'true' : 'false'
    }

    // 构建 URL 参数
    const queryString = Object.entries(signParams)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')

    wx.navigateTo({
      url: `/pages/sign-contract/index?${queryString}`
    })
  }
})
