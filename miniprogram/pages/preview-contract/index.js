// pages/preview-contract/index.js
const app = getApp()

Page({
  data: {
    loading: true,
    contractData: null,
    lessorInfo: null,
    lesseeInfo: null,
    houseInfo: null,
    rentInfo: null,
    depositInfo: null,
    paymentInfo: null,
    inventoryItems: [],
    remark: ''
  },

  onLoad(options) {
    try {
      if (options.data) {
        const contractData = JSON.parse(decodeURIComponent(options.data))
        console.log('预览合同数据:', contractData)
        this.processContractData(contractData)
      } else {
        wx.showToast({ title: '缺少合同数据', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
      }
    } catch (err) {
      console.error('解析合同数据失败:', err)
      wx.showToast({ title: '数据解析失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  processContractData(data) {
    const lessorInfo = {
      name: data.lessor_name || '',
      phone: data.lessor_phone || '',
      phone2: data.lessor_phone2 || '',
      contact: data.lessor_contact || '',
      company: data.partyA_company || '',
      idcard: data.lessor_idcard || '',
      account: data.lessor_account || ''
    }

    const lesseeInfo = {
      name: data.lessee_name || '',
      phone: data.lessee_phone || '',
      idcard: data.lessee_idcard || '',
      contact: data.lessee_contact || ''
    }

    const houseInfo = {
      address: data.house_address || '',
      area: data.house_area || '',
      purpose: data.rent_purpose || ''
    }

    const months = data.lease_months || 0
    const rentInfo = {
      monthlyRent: data.monthly_rent || 0,
      yearRent: data.year_rent || 0,
      leaseStart: data.lease_start || '',
      leaseEnd: data.lease_end || '',
      months: months,
      advanceNoticeDays: data.advance_notice_days || 30
    }

    const depositInfo = {
      amount: data.deposit || 0,
      chinese: data.deposit_chinese || ''
    }

    const paymentMethodMap = { 1: '月付', 3: '季付', 6: '半年付', 12: '年付' }
    const paymentInfo = {
      method: paymentMethodMap[data.payment_method] || '月付',
      cycle: data.payment_cycle || months,
      count: data.payment_count || 1,
      firstAmount: data.first_payment_amount || data.monthly_rent || 0,
      firstDate: data.first_payment_date || data.lease_start || '',
      secondAmount: data.second_payment_amount || 0,
      secondDate: data.second_payment_date || '',
      thirdAmount: data.third_payment_amount || 0,
      thirdDate: data.third_payment_date || ''
    }

    const inventoryFields = [
      { key: 'item_tv_qty', label: '电视' },
      { key: 'item_wardrobe_qty', label: '衣柜' },
      { key: 'item_tv_remote_qty', label: '电视遥控器' },
      { key: 'item_tv_table_qty', label: '电视柜' },
      { key: 'item_box_qty', label: '机顶盒' },
      { key: 'item_sofa_qty', label: '沙发' },
      { key: 'item_coffee_table_qty', label: '茶几' },
      { key: 'item_dining_table_qty', label: '餐桌' },
      { key: 'item_chair_qty', label: '餐桌椅' },
      { key: 'item_bed_qty', label: '床' },
      { key: 'item_nightstand_qty', label: '床头柜' },
      { key: 'item_curtain_qty', label: '窗帘' },
      { key: 'item_ac_qty', label: '空调' },
      { key: 'item_ac_remote_qty', label: '空调遥控器' },
      { key: 'item_fridge_qty', label: '冰箱' },
      { key: 'item_mattress_qty', label: '床垫子' },
      { key: 'item_washer_qty', label: '洗衣机' },
      { key: 'item_water_heater_qty', label: '热水器' },
      { key: 'item_gas_stove_qty', label: '煤气灶' },
      { key: 'item_hood_qty', label: '油烟机' },
      { key: 'item_induction_qty', label: '电磁灶' },
      { key: 'item_door_card_qty', label: '门禁卡' },
      { key: 'item_water_card_qty', label: '水卡' },
      { key: 'item_power_card_qty', label: '电卡' }
    ]

    const inventoryItems = inventoryFields
      .filter(item => data[item.key] && data[item.key] > 0)
      .map(item => ({
        name: item.label,
        quantity: data[item.key]
      }))

    const feeLabels = {
      fee_water: '水费',
      fee_electric: '电费',
      fee_gas: '燃气费',
      fee_tv: '电视费',
      fee_network: '网络费',
      fee_property: '物业费',
      fee_heating: '暖气费'
    }

    const fees = Object.entries(feeLabels)
      .filter(([key]) => data[key] !== undefined)
      .map(([key, label]) => ({
        label,
        tenant: data[key] ? '乙方承担' : '甲方承担'
      }))

    const meters = []
    if (data.electricity_meter) meters.push({ label: '电表读数', value: data.electricity_meter })
    if (data.water_meter) meters.push({ label: '水表读数', value: data.water_meter })
    if (data.gas_meter) meters.push({ label: '燃气表读数', value: data.gas_meter })

    this.setData({
      loading: false,
      contractData: data,
      lessorInfo,
      lesseeInfo,
      houseInfo,
      rentInfo,
      depositInfo,
      paymentInfo,
      inventoryItems,
      fees,
      meters,
      remark: data.remark || ''
    })
  },

  formatDate(dateStr) {
    if (!dateStr) return ''
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      const d = new Date(dateStr)
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    }
    return dateStr
  }
})
