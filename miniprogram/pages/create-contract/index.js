// pages/create-contract/index.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    formData: {
      // 甲方信息（自动填充）
      lessor_name: '',
      lessor_phone: '',
      lessor_phone2: '',
      lessor_contact: '',
      partyA_company: '',
      lessor_idcard: '',
      lessor_account: '',
      // 乙方信息
      lessee_name: '',
      lessee_phone: '',
      lessee_idcard: '',
      // 房屋信息
      house_address: '',
      house_area: '',
      rent_purpose: '',
      // 租赁期限
      lease_start: '',
      lease_end: '',
      lease_months: '',
      // 租金信息
      monthly_rent: '',
      year_rent: '',
      payment_cycle: '',
      payment_method: 1,
      advance_notice_days: '30',
      // 支付计划
      payment_count: 1,
      first_payment_amount: '',
      first_payment_date: '',
      second_payment_amount: '',
      second_payment_date: '',
      third_payment_amount: '',
      third_payment_date: '',
      // 押金
      deposit: '',
      deposit_chinese: '',
      // 费用约定
      fee_water: true,
      fee_electric: true,
      fee_gas: true,
      fee_tv: true,
      fee_network: true,
      fee_property: false,
      fee_heating: false,
      // 居间服务
      partyA_commission: '',
      partyA_commission_chinese: '',
      partyB_commission: '',
      partyB_commission_chinese: '',
      // 水电表
      electricity_meter: '',
      water_meter: '',
      gas_meter: '',
      // 备注
      remark: ''
    },
    // 固定物品清单（按模板顺序）
    fixedItems: [
      { name: '电视', quantity: '', unit: '台', confirmed: false },
      { name: '衣柜', quantity: '', unit: '个', confirmed: false },
      { name: '电视（遥控器）', quantity: '', unit: '个', confirmed: false },
      { name: '机顶盒（遥控器）', quantity: '', unit: '个', confirmed: false },
      { name: '茶几', quantity: '', unit: '个', confirmed: false },
      { name: '餐桌', quantity: '', unit: '张', confirmed: false },
      { name: '餐桌椅', quantity: '', unit: '把', confirmed: false },
      { name: '床', quantity: '', unit: '张', confirmed: false },
      { name: '床头柜', quantity: '', unit: '个', confirmed: false },
      { name: '窗帘', quantity: '', unit: '个', confirmed: false },
      { name: '空调', quantity: '', unit: '台', confirmed: false },
      { name: '空调（遥控器）', quantity: '', unit: '个', confirmed: false },
      { name: '冰箱', quantity: '', unit: '台', confirmed: false },
      { name: '床垫子', quantity: '', unit: '个', confirmed: false },
      { name: '洗衣机', quantity: '', unit: '台', confirmed: false },
      { name: '热水器', quantity: '', unit: '台', confirmed: false },
      { name: '煤气灶', quantity: '', unit: '台', confirmed: false },
      { name: '油烟机', quantity: '', unit: '台', confirmed: false },
      { name: '门禁卡', quantity: '', unit: '个', confirmed: false },
      { name: '水卡', quantity: '', unit: '个', confirmed: false },
      { name: '电卡', quantity: '', unit: '个', confirmed: false },
      { name: '电视柜', quantity: '', unit: '个', confirmed: false },
      { name: '沙发', quantity: '', unit: '个', confirmed: false },
      { name: '电磁灶', quantity: '', unit: '台', confirmed: false }
    ],
    // 自定义物品
    customItems: [],
    errors: {},
    // 日期选择器
    showStartDatePicker: false,
    showEndDatePicker: false,
    showFirstPaymentDatePicker: false,
    showSecondPaymentDatePicker: false,
    showThirdPaymentDatePicker: false,
    showPaymentCyclePicker: false,
    startDate: new Date().getTime(),
    endDate: new Date().getTime(),
    firstPaymentDate: new Date().getTime(),
    secondPaymentDate: new Date().getTime(),
    thirdPaymentDate: new Date().getTime(),
    minDate: new Date().getTime(),
    // 付款周期选项
    paymentCycleColumns: ['月付', '季付', '半年付', '年付'],
    // 用途选项
    purposeColumns: ['居住', '办公', '经营', '仓储', '其他'],
    showPurposePicker: false,
    loading: false
  },

  onLoad(options) {
    const userInfo = app.globalData?.userInfo || {}
    this.setData({ userInfo })

    const defaultLessorName = userInfo.name || '内蒙古恒之寓酒店管理有限公司'
    this.setData({
      'formData.lessor_name': defaultLessorName,
      'formData.lessor_phone': userInfo.phone || '',
      'formData.lessor_idcard': userInfo.idcard || '',
      'formData.lessor_account': userInfo.bankAccount || ''
    })

    if (options.draftId) {
      this.loadDraft(options.draftId)
    } else if (options.data) {
      try {
        const data = JSON.parse(decodeURIComponent(options.data))
        console.log('收到返回的数据:', JSON.stringify(data, null, 2))
        const { fixedItems: originalFixed, customItems: originalCustom, ...formData } = data

        // 恢复 payment_cycle_text
        if (formData.payment_cycle) {
          formData.payment_cycle_text = formData.payment_cycle
        }

        if (data.items && data.items.length > 0) {
          console.log('物品数据:', JSON.stringify(data.items, null, 2))
          const fixedItems = this.data.fixedItems.map(fi => {
            const matched = data.items.find(i => i.name === fi.name)
            console.log(`匹配 ${fi.name}:`, matched ? '成功' : '失败')
            if (matched) {
              return { ...fi, quantity: matched.quantity, confirmed: true }
            }
            return fi
          })
          const customItems = data.items
            .filter(i => !this.data.fixedItems.find(fi => fi.name === i.name))
            .map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit || '个', confirmed: true }))

          console.log('恢复后的fixedItems:', JSON.stringify(fixedItems, null, 2))
          console.log('恢复后的customItems:', JSON.stringify(customItems, null, 2))
          this.setData({ formData: { ...this.data.formData, ...formData }, fixedItems, customItems })
        } else {
          console.log('没有物品数据')
          this.setData({ formData: { ...this.data.formData, ...formData } })
        }
      } catch (e) {
        console.error('解析表单数据失败', e)
      }
    }
  },

  onFieldChange(e) {
    const { field } = e.currentTarget.dataset
    let value = e.detail

    const { errors, formData } = this.data
    if (errors[field]) {
      delete errors[field]
      this.setData({ errors })
    }

    // 押金金额转换大写
    if (field === 'deposit' && value) {
      const depositChinese = this.convertToChinese(value)
      this.setData({
        [`formData.${field}`]: value,
        'formData.deposit_chinese': depositChinese
      })
      return
    }

    // 月租金变化时自动计算合同总租金和第一期付款
    if (field === 'monthly_rent' && value) {
      const monthly = parseFloat(value) || 0
      const months = parseInt(formData.lease_months) || 12
      const yearRent = (monthly * months).toFixed(2)
      this.setData({
        [`formData.${field}`]: value,
        'formData.year_rent': yearRent,
        'formData.first_payment_amount': value
      })
      return
    }

    // 租赁月数变化时重新计算合同总租金
    if (field === 'lease_months' && value) {
      const monthly = parseFloat(formData.monthly_rent) || 0
      const months = parseInt(value) || 0
      if (monthly > 0 && months > 0) {
        const yearRent = (monthly * months).toFixed(2)
        this.setData({
          [`formData.${field}`]: value,
          'formData.year_rent': yearRent
        })
      } else {
        this.setData({ [`formData.${field}`]: value })
      }
      return
    }

    this.setData({ [`formData.${field}`]: value })
  },

  convertToChinese(num) {
    if (!num) return ''
    const chineseDigits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
    const units = ['', '拾', '佰', '仟', '万']

    num = parseFloat(num)
    if (isNaN(num)) return ''

    const parts = num.toString().split('.')
    let integerPart = parseInt(parts[0])
    const decimalPart = parts.length > 1 ? parts[1] : ''

    let result = ''
    let unitIndex = 0

    while (integerPart > 0) {
      result = chineseDigits[integerPart % 10] + units[unitIndex % units.length] + result
      integerPart = Math.floor(integerPart / 10)
      unitIndex++
    }

    if (decimalPart) {
      let decimalStr = '元'
      for (let i = 0; i < Math.min(decimalPart.length, 2); i++) {
        if (decimalPart[i] !== '0') {
          decimalStr += chineseDigits[parseInt(decimalPart[i])]
          decimalStr += i === 0 ? '角' : '分'
        }
      }
      result += decimalStr
    }

    if (!result) return '零元'
    if (!decimalPart) result += '元整'
    return result
  },

  showStartDatePickerModal() {
    if (this.data.formData.lease_start) {
      const timestamp = new Date(this.data.formData.lease_start).getTime()
      this.setData({ startDate: timestamp })
    }
    this.setData({ showStartDatePicker: true })
  },
  closeStartDatePicker() { this.setData({ showStartDatePicker: false }) },
  onStartDateConfirm(e) {
    let timestamp = e.detail
    if (typeof timestamp === 'string') timestamp = new Date(timestamp).getTime()
    const date = this.formatDate(timestamp)
    const months = this.calculateMonths(date, this.data.formData.lease_end)
    const monthly = parseFloat(this.data.formData.monthly_rent) || 0
    const yearRent = monthly > 0 && months > 0 ? (monthly * months).toFixed(2) : ''
    this.setData({
      'formData.lease_start': date,
      'formData.lease_months': months,
      'formData.year_rent': yearRent,
      'formData.first_payment_date': date,
      showStartDatePicker: false
    })
  },

  showEndDatePickerModal() {
    if (this.data.formData.lease_end) {
      const timestamp = new Date(this.data.formData.lease_end).getTime()
      this.setData({ endDate: timestamp })
    }
    this.setData({ showEndDatePicker: true })
  },
  closeEndDatePicker() { this.setData({ showEndDatePicker: false }) },
  onEndDateConfirm(e) {
    let timestamp = e.detail
    if (typeof timestamp === 'string') timestamp = new Date(timestamp).getTime()
    const date = this.formatDate(timestamp)
    const months = this.calculateMonths(this.data.formData.lease_start, date)
    const monthly = parseFloat(this.data.formData.monthly_rent) || 0
    const yearRent = monthly > 0 && months > 0 ? (monthly * months).toFixed(2) : ''
    this.setData({
      'formData.lease_end': date,
      'formData.lease_months': months,
      'formData.year_rent': yearRent,
      showEndDatePicker: false
    })
  },

  calculateMonths(startDate, endDate) {
    if (!startDate || !endDate) return ''
    const start = new Date(startDate)
    const end = new Date(endDate)
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    return months > 0 ? months.toString() : ''
  },

  formatDate(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  showPaymentCyclePicker() { this.setData({ showPaymentCyclePicker: true }) },
  closePaymentCyclePicker() { this.setData({ showPaymentCyclePicker: false }) },
  onPaymentCycleConfirm(e) {
    const value = e.detail?.value
    this.setData({
      'formData.payment_cycle': value,
      'formData.payment_cycle_text': value,
      showPaymentCyclePicker: false
    })
  },

  showPurposePicker() { this.setData({ showPurposePicker: true }) },
  closePurposePicker() { this.setData({ showPurposePicker: false }) },
  onPurposeConfirm(e) {
    const value = e.detail?.value
    this.setData({
      'formData.rent_purpose': value,
      showPurposePicker: false
    })
  },

  showFirstPaymentDatePickerModal() {
    if (this.data.formData.first_payment_date) {
      this.setData({ firstPaymentDate: new Date(this.data.formData.first_payment_date).getTime() })
    }
    this.setData({ showFirstPaymentDatePicker: true })
  },
  closeFirstPaymentDatePicker() { this.setData({ showFirstPaymentDatePicker: false }) },
  onFirstPaymentDateConfirm(e) {
    let ts = typeof e.detail === 'string' ? new Date(e.detail).getTime() : e.detail
    this.setData({
      'formData.first_payment_date': this.formatDate(ts),
      showFirstPaymentDatePicker: false
    })
  },

  showSecondPaymentDatePickerModal() {
    if (this.data.formData.second_payment_date) {
      this.setData({ secondPaymentDate: new Date(this.data.formData.second_payment_date).getTime() })
    }
    this.setData({ showSecondPaymentDatePicker: true })
  },
  closeSecondPaymentDatePicker() { this.setData({ showSecondPaymentDatePicker: false }) },
  onSecondPaymentDateConfirm(e) {
    let ts = typeof e.detail === 'string' ? new Date(e.detail).getTime() : e.detail
    this.setData({
      'formData.second_payment_date': this.formatDate(ts),
      showSecondPaymentDatePicker: false
    })
  },

  showThirdPaymentDatePickerModal() {
    if (this.data.formData.third_payment_date) {
      this.setData({ thirdPaymentDate: new Date(this.data.formData.third_payment_date).getTime() })
    }
    this.setData({ showThirdPaymentDatePicker: true })
  },
  closeThirdPaymentDatePicker() { this.setData({ showThirdPaymentDatePicker: false }) },
  onThirdPaymentDateConfirm(e) {
    let ts = typeof e.detail === 'string' ? new Date(e.detail).getTime() : e.detail
    this.setData({
      'formData.third_payment_date': this.formatDate(ts),
      showThirdPaymentDatePicker: false
    })
  },

  onFeeChange(e) {
    const { fee } = e.currentTarget.dataset
    this.setData({ [`formData.${fee}`]: e.detail })
  },

  onItemFieldChange(e) {
    const { index, field } = e.currentTarget.dataset
    const fixedItems = [...this.data.fixedItems]
    fixedItems[index][field] = e.detail.value || e.detail
    this.setData({ fixedItems })
  },

  onItemConfirm(e) {
    const { index } = e.currentTarget.dataset
    const fixedItems = [...this.data.fixedItems]
    fixedItems[index].confirmed = e.detail
    this.setData({ fixedItems })
  },

  addCustomItem() {
    const customItems = [...this.data.customItems, { name: '', quantity: '', unit: '个', confirmed: false }]
    this.setData({ customItems })
  },

  onCustomItemChange(e) {
    const { index, field } = e.currentTarget.dataset
    const customItems = [...this.data.customItems]
    customItems[index][field] = e.detail
    this.setData({ customItems })
  },

  deleteCustomItem(e) {
    const { index } = e.currentTarget.dataset
    const customItems = [...this.data.customItems]
    customItems.splice(index, 1)
    this.setData({ customItems })
  },

  validateForm() {
    const { formData } = this.data
    const errors = {}
    const required = ['lessee_name', 'lessee_phone', 'lessee_idcard', 'house_address', 'lease_start', 'lease_end', 'monthly_rent', 'deposit']

    console.log('validating formData:', JSON.stringify(formData, null, 2))

    for (const field of required) {
      const value = formData[field]
      console.log(`field ${field}:`, value, typeof value)
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = '必填'
      }
    }

    if (formData.lessee_phone && !/^1[3-9]\d{9}$/.test(formData.lessee_phone)) {
      errors.lessee_phone = '手机号格式错误'
    }

    if (formData.lessee_idcard && !/^\d{17}[\dXx]$/.test(formData.lessee_idcard)) {
      errors.lessee_idcard = '身份证号格式错误'
    }

    console.log('errors:', errors)
    this.setData({ errors: Object.keys(errors).length ? errors : {} })
    return Object.keys(errors).length === 0
  },

  previewContract() {
    if (!this.validateForm()) {
      wx.showToast({ title: '请完善必填信息', icon: 'none' })
      return
    }
    const contractData = this.prepareContractData()
    wx.navigateTo({
      url: `/pages/preview-contract/index?data=${encodeURIComponent(JSON.stringify(contractData))}`
    })
  },

  submitContract() {
    this.setData({ loading: true })
    const contractData = this.prepareContractData()

    wx.request({
      url: `${app.globalData.baseUrl}/api/contracts`,
      method: 'POST',
      data: contractData,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${app.globalData.token || ''}`
      },
      success: (res) => {
        if (res.data.code === 200 || res.statusCode === 200 || res.data.code === 201) {
          wx.showToast({
            title: '合同创建成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({ title: res.data.message || '保存失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  },

  prepareContractData() {
    const { formData, fixedItems } = this.data
    const months = parseInt(formData.lease_months) || 0
    const monthlyRent = parseFloat(formData.monthly_rent) || 0

    // 物品名称到字段名的映射
    const itemMapping = {
      '电视': 'item_tv_qty',
      '衣柜': 'item_wardrobe_qty',
      '电视（遥控器）': 'item_tv_remote_qty',
      '电视柜': 'item_tv_table_qty',
      '机顶盒（遥控器）': 'item_box_qty',
      '沙发': 'item_sofa_qty',
      '茶几': 'item_coffee_table_qty',
      '餐桌': 'item_dining_table_qty',
      '餐桌椅': 'item_chair_qty',
      '床': 'item_bed_qty',
      '床头柜': 'item_nightstand_qty',
      '窗帘': 'item_curtain_qty',
      '空调': 'item_ac_qty',
      '空调（遥控器）': 'item_ac_remote_qty',
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

    // 构建物品清单字段
    const itemFields = {}
    fixedItems.forEach(item => {
      const fieldName = itemMapping[item.name]
      if (fieldName && item.quantity) {
        itemFields[fieldName] = parseInt(item.quantity) || 0
      }
    })

    console.log('准备发送的数据 - itemFields:', JSON.stringify(itemFields, null, 2))

    return {
      title: `房屋租赁合同 - ${formData.house_address || '未命名'}`,
      lessor_name: formData.lessor_name,
      lessor_phone: formData.lessor_phone,
      lessor_phone2: formData.lessor_phone2 || null,
      lessor_contact: formData.lessor_contact || null,
      partyA_company: formData.partyA_company || null,
      lessor_idcard: formData.lessor_idcard || null,
      lessor_account: formData.lessor_account || null,
      lessee_name: formData.lessee_name,
      lessee_phone: formData.lessee_phone,
      lessee_idcard: formData.lessee_idcard || null,
      house_address: formData.house_address,
      house_area: formData.house_area ? parseFloat(formData.house_area) : null,
      rent_purpose: formData.rent_purpose || null,
      lease_start: formData.lease_start,
      lease_end: formData.lease_end,
      lease_months: months || null,
      advance_notice_days: formData.advance_notice_days ? parseInt(formData.advance_notice_days) : null,
      monthly_rent: monthlyRent,
      year_rent: formData.year_rent ? parseFloat(formData.year_rent) : null,
      payment_method: formData.payment_method || 1,
      payment_cycle: formData.payment_cycle || null,
      payment_count: formData.payment_count ? parseInt(formData.payment_count) : 1,
      first_payment_amount: formData.first_payment_amount ? parseFloat(formData.first_payment_amount) : null,
      first_payment_date: formData.first_payment_date || null,
      second_payment_amount: formData.second_payment_amount ? parseFloat(formData.second_payment_amount) : null,
      second_payment_date: formData.second_payment_date || null,
      third_payment_amount: formData.third_payment_amount ? parseFloat(formData.third_payment_amount) : null,
      third_payment_date: formData.third_payment_date || null,
      deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
      deposit_chinese: formData.deposit_chinese || null,
      fee_water: formData.fee_water,
      fee_electric: formData.fee_electric,
      fee_gas: formData.fee_gas,
      fee_tv: formData.fee_tv,
      fee_network: formData.fee_network,
      fee_property: formData.fee_property,
      fee_heating: formData.fee_heating,
      partyA_commission: formData.partyA_commission ? parseFloat(formData.partyA_commission) : null,
      partyA_commission_chinese: formData.partyA_commission_chinese || null,
      partyB_commission: formData.partyB_commission ? parseFloat(formData.partyB_commission) : null,
      partyB_commission_chinese: formData.partyB_commission_chinese || null,
      electricity_meter: formData.electricity_meter || null,
      water_meter: formData.water_meter || null,
      gas_meter: formData.gas_meter || null,
      remark: formData.remark || null,
      // 物品清单字段
      ...itemFields
      // 注意：不设置 status，由后端控制
    }
  },

  loadDraft(draftId) {
    wx.request({
      url: `${app.globalData.baseUrl}/api/contracts/${draftId}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${app.globalData.token || ''}` },
      success: (res) => {
        if (res.data.code === 200) {
          const contract = res.data.data.contract
          this.setData({ formData: { ...this.data.formData, ...contract } })
        }
      }
    })
  }
})
