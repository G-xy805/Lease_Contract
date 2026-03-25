// pages/create-contract/index.js
const app = getApp()

// 自动保存键名
const STORAGE_KEY = 'create_contract_draft'
// 自动保存间隔（毫秒）
const AUTO_SAVE_INTERVAL = 30000

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
    // 表单验证错误信息
    errors: {},
    // 字段是否被修改过（用于标记未保存状态）
    touched: {},
    // 是否显示未保存提示
    showUnsavedTip: false,
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
    // 提交状态
    loading: false,
    // 进度步骤
    currentStep: 0,
    steps: [
      { desc: '基本信息', icon: 'edit' },
      { desc: '房屋信息', icon: 'home-o' },
      { desc: '租赁期限', icon: 'clock' },
      { desc: '租金条款', icon: 'gold-coin' },
      { desc: '物品清单', icon: 'orders-o' },
      { desc: '提交确认', icon: 'checked' }
    ],
    // 新增物品弹窗
    showAddItemPopup: false,
    newItemName: '',
    newItemQuantity: '',
    newItemUnit: '个'
  },

  // 自动保存定时器
  autoSaveTimer: null,

  // 编辑模式：合同ID
  editContractId: null,

  onLoad(options) {
    const userInfo = app.globalData?.userInfo || {}
    this.setData({ userInfo })

    // 编辑模式：加载现有合同
    if (options.contractId) {
      this.editContractId = options.contractId
      this.loadExistingContract(options.contractId)
      return
    }

    const defaultLessorName = userInfo.name || '内蒙古恒之寓酒店管理有限公司'
    this.setData({
      'formData.lessor_name': defaultLessorName,
      'formData.lessor_phone': userInfo.phone || '',
      'formData.lessor_idcard': userInfo.idcard || '',
      'formData.lessor_account': userInfo.bankAccount || ''
    })

    // 从本地存储加载自动保存的草稿
    this.loadAutoSaveDraft()

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

    // 启动自动保存定时器
    this.startAutoSave()
  },

  onUnload() {
    // 停止自动保存定时器
    this.stopAutoSave()
    // 离开页面时检查未保存提示
    this.checkUnsavedBeforeLeave()
  },

  onHide() {
    // 页面隐藏时保存一次
    this.autoSaveToStorage()
  },

  // 启动自动保存
  startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    this.autoSaveTimer = setInterval(() => {
      this.autoSaveToStorage()
    }, AUTO_SAVE_INTERVAL)
  },

  // 停止自动保存
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  },

  // 自动保存到本地存储
  autoSaveToStorage() {
    const { formData, fixedItems, customItems, touched } = this.data
    // 只有当有修改时才保存
    const hasChanges = Object.keys(touched).some(key => touched[key])
    if (!hasChanges) return

    const draftData = {
      formData,
      fixedItems,
      customItems,
      savedAt: new Date().toISOString()
    }

    try {
      wx.setStorageSync(STORAGE_KEY, draftData)
      console.log('自动保存成功:', draftData.savedAt)
      // 清除touched状态
      this.setData({ touched: {} })
    } catch (e) {
      console.error('自动保存失败:', e)
    }
  },

  // 加载自动保存的草稿
  loadAutoSaveDraft() {
    try {
      const draft = wx.getStorageSync(STORAGE_KEY)
      if (draft && draft.savedAt) {
        const savedTime = new Date(draft.savedAt)
        const now = new Date()
        const diffMinutes = Math.floor((now - savedTime) / 60000)

        if (diffMinutes < 60) {
          // 1小时内保存的草稿，询问是否恢复
          wx.showModal({
            title: '发现未保存的草稿',
            content: `您有${diffMinutes}分钟前未保存的草稿，是否恢复？`,
            confirmText: '恢复',
            cancelText: '不恢复',
            success: (res) => {
              if (res.confirm) {
                this.setData({
                  formData: { ...this.data.formData, ...draft.formData },
                  fixedItems: draft.fixedItems || this.data.fixedItems,
                  customItems: draft.customItems || []
                })
                wx.showToast({ title: '已恢复草稿', icon: 'success' })
              } else {
                // 清除旧草稿
                wx.removeStorageSync(STORAGE_KEY)
              }
            }
          })
        }
      }
    } catch (e) {
      console.error('加载自动保存草稿失败:', e)
    }
  },

  // 检查未保存状态并提示
  checkUnsavedBeforeLeave() {
    const { touched } = this.data
    const hasUnsaved = Object.keys(touched).some(key => touched[key])

    if (hasUnsaved) {
      // 离开前自动保存
      this.autoSaveToStorage()
    }
  },

  // 字段修改时标记未保存状态
  markAsUnsaved(field) {
    this.setData({
      touched: { ...this.data.touched, [field]: true }
    })
  },

  // 验证单个字段
  validateField(field, value) {
    const { formData } = this.data
    let error = ''

    // 必填字段验证
    const requiredFields = ['lessee_name', 'lessee_phone', 'lessee_idcard', 'house_address', 'lease_start', 'lease_end', 'monthly_rent', 'deposit']
    if (requiredFields.includes(field)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        error = '必填'
      }
    }

    // 手机号格式验证
    if (field === 'lessee_phone' && value && !/^1[3-9]\d{9}$/.test(value.trim())) {
      error = '手机号格式错误'
    }

    // 身份证格式验证
    if (field === 'lessee_idcard' && value && !/^\d{17}[\dXx]$/.test(value.trim())) {
      error = '身份证号格式错误'
    }

    return error
  },

  // 字段失去焦点时验证
  onFieldBlur(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail
    const error = this.validateField(field, value)

    if (error) {
      this.setData({
        errors: { ...this.data.errors, [field]: error }
      })
    } else {
      const { errors } = this.data
      delete errors[field]
      this.setData({ errors })
    }
  },

  onFieldChange(e) {
    const { field } = e.currentTarget.dataset
    let value = e.detail

    // 标记为未保存
    this.markAsUnsaved(field)

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

  // 更新步骤指示器
  updateSteps() {
    const { formData } = this.data
    let step = 0

    // 根据已填写的字段判断当前步骤
    if (formData.lessee_name && formData.lessee_phone && formData.lessee_idcard) {
      step = 1
    }
    if (step >= 1 && formData.house_address) {
      step = 2
    }
    if (step >= 2 && formData.lease_start && formData.lease_end) {
      step = 3
    }
    if (step >= 3 && formData.monthly_rent && formData.deposit) {
      step = 4
    }

    this.setData({ currentStep: step })
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
    this.markAsUnsaved('lease_start')
    this.updateSteps()
  },

  showEndDatePickerModal() {
    if (this.data.formData.lease_end) {
      const timestamp = new Date(this.data.formData.lease_end).getTime()
      this.setData({ endDate: timestamp })
    }
    // 设置结束日期的最小值为开始日期
    if (this.data.formData.lease_start) {
      this.setData({ minEndDate: new Date(this.data.formData.lease_start).getTime() })
    }
    this.setData({ showEndDatePicker: true })
  },
  closeEndDatePicker() { this.setData({ showEndDatePicker: false }) },
  onEndDateConfirm(e) {
    let timestamp = e.detail
    if (typeof timestamp === 'string') timestamp = new Date(timestamp).getTime()

    // 验证结束日期不得早于开始日期
    if (this.data.formData.lease_start) {
      const startTimestamp = new Date(this.data.formData.lease_start).getTime()
      if (timestamp < startTimestamp) {
        wx.showToast({ title: '结束日期不得早于开始日期', icon: 'none' })
        return
      }
    }

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
    this.markAsUnsaved('lease_end')
    this.updateSteps()
  },

  calculateMonths(startDate, endDate) {
    if (!startDate || !endDate) return ''
    const start = new Date(startDate)
    const end = new Date(endDate)
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    // 如果结束日期的"日"小于开始日期的"日"，说明不满整月，需要加1
    // 例如：3月25日到4月20日，不满1个月，但跨月了
    if (end.getDate() < start.getDate()) {
      months += 1
    }
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
    this.markAsUnsaved('payment_cycle')
  },

  showPurposePicker() { this.setData({ showPurposePicker: true }) },
  closePurposePicker() { this.setData({ showPurposePicker: false }) },
  onPurposeConfirm(e) {
    const value = e.detail?.value
    this.setData({
      'formData.rent_purpose': value,
      showPurposePicker: false
    })
    this.markAsUnsaved('rent_purpose')
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
    this.markAsUnsaved('first_payment_date')
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
    this.markAsUnsaved('second_payment_date')
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
    this.markAsUnsaved('third_payment_date')
  },

  onFeeChange(e) {
    const { fee } = e.currentTarget.dataset
    this.setData({ [`formData.${fee}`]: e.detail })
    this.markAsUnsaved(fee)
  },

  onItemFieldChange(e) {
    const { index, field } = e.currentTarget.dataset
    const fixedItems = [...this.data.fixedItems]
    fixedItems[index][field] = e.detail.value || e.detail
    this.setData({ fixedItems })
    this.markAsUnsaved('fixedItems')
  },

  onItemConfirm(e) {
    const { index } = e.currentTarget.dataset
    const fixedItems = [...this.data.fixedItems]
    fixedItems[index].confirmed = e.detail
    this.setData({ fixedItems })
    this.markAsUnsaved('fixedItems')
  },

  // 物品数量快速调整
  onItemQuantityChange(e) {
    const { index } = e.currentTarget.dataset
    const value = e.detail
    const fixedItems = [...this.data.fixedItems]
    fixedItems[index].quantity = value
    this.setData({ fixedItems })
    this.markAsUnsaved('fixedItems')
  },

  // 删除固定物品（标记为删除）
  deleteFixedItem(e) {
    const { index } = e.currentTarget.dataset
    const fixedItems = [...this.data.fixedItems]
    fixedItems[index].deleted = true
    this.setData({ fixedItems })
    this.markAsUnsaved('fixedItems')
    wx.showToast({ title: '已删除', icon: 'success' })
  },

  // 恢复删除的物品
  restoreFixedItem(e) {
    const { index } = e.currentTarget.dataset
    const fixedItems = [...this.data.fixedItems]
    fixedItems[index].deleted = false
    this.setData({ fixedItems })
    this.markAsUnsaved('fixedItems')
  },

  // 添加自定义物品弹窗
  showAddItemModal() {
    this.setData({
      showAddItemPopup: true,
      newItemName: '',
      newItemQuantity: '',
      newItemUnit: '个'
    })
  },
  closeAddItemPopup() {
    this.setData({ showAddItemPopup: false })
  },
  onNewItemNameChange(e) {
    this.setData({ newItemName: e.detail })
  },
  onNewItemQuantityChange(e) {
    this.setData({ newItemQuantity: e.detail })
  },
  onNewItemUnitChange(e) {
    this.setData({ newItemUnit: e.detail || '个' })
  },
  confirmAddItem() {
    const { newItemName, newItemQuantity, newItemUnit } = this.data
    if (!newItemName || !newItemName.trim()) {
      wx.showToast({ title: '请输入物品名称', icon: 'none' })
      return
    }
    const customItems = [...this.data.customItems, {
      name: newItemName.trim(),
      quantity: newItemQuantity || '',
      unit: newItemUnit || '个',
      confirmed: true
    }]
    this.setData({
      customItems,
      showAddItemPopup: false
    })
    this.markAsUnsaved('customItems')
    wx.showToast({ title: '添加成功', icon: 'success' })
  },

  addCustomItem() {
    this.showAddItemModal()
  },

  onCustomItemChange(e) {
    const { index, field } = e.currentTarget.dataset
    const customItems = [...this.data.customItems]
    customItems[index][field] = e.detail
    this.setData({ customItems })
    this.markAsUnsaved('customItems')
  },

  deleteCustomItem(e) {
    const { index } = e.currentTarget.dataset
    const customItems = [...this.data.customItems]
    customItems.splice(index, 1)
    this.setData({ customItems })
    this.markAsUnsaved('customItems')
  },

  // 验证表单
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

    if (formData.lessee_phone && !/^1[3-9]\d{9}$/.test(formData.lessee_phone.trim())) {
      errors.lessee_phone = '手机号格式错误'
    }

    if (formData.lessee_idcard && !/^\d{17}[\dXx]$/.test(formData.lessee_idcard.trim())) {
      errors.lessee_idcard = '身份证号格式错误'
    }

    // 验证结束日期不早于开始日期
    if (formData.lease_start && formData.lease_end) {
      const startDate = new Date(formData.lease_start).getTime()
      const endDate = new Date(formData.lease_end).getTime()
      if (endDate < startDate) {
        errors.lease_end = '结束日期不得早于开始日期'
      }
    }

    console.log('errors:', errors)
    this.setData({ errors: Object.keys(errors).length ? errors : {} })
    return Object.keys(errors).length === 0
  },

  // 滚动到第一个错误字段
  scrollToFirstError(errors) {
    const errorFields = Object.keys(errors)
    if (errorFields.length === 0) return

    wx.showToast({
      title: `请完善${errorFields.length}个必填信息`,
      icon: 'none',
      duration: 2000
    })
  },

  previewContract() {
    if (!this.validateForm()) {
      this.scrollToFirstError(this.data.errors)
      return
    }
    const contractData = this.prepareContractData()
    wx.navigateTo({
      url: `/pages/preview-contract/index?data=${encodeURIComponent(JSON.stringify(contractData))}`
    })
  },

  submitContract() {
    // 提交前验证全部字段
    if (!this.validateForm()) {
      this.scrollToFirstError(this.data.errors)
      return
    }

    this.setData({
      loading: true,
      currentStep: 5  // 设置为提交确认步骤
    })

    const contractData = this.prepareContractData()

    const isEditMode = !!this.editContractId
    const requestUrl = isEditMode
      ? `${app.globalData.baseUrl}/api/contracts/${this.editContractId}`
      : `${app.globalData.baseUrl}/api/contracts`
    const requestMethod = isEditMode ? 'PUT' : 'POST'

    wx.request({
      url: requestUrl,
      method: requestMethod,
      data: contractData,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${app.globalData.token || ''}`
      },
      success: (res) => {
        if (res.data.code === 200 || res.statusCode === 200 || res.data.code === 201) {
          // 清除本地保存的草稿
          wx.removeStorageSync(STORAGE_KEY)

          wx.showToast({
            title: isEditMode ? '合同更新成功' : '合同创建成功',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            }
          })
        } else {
          wx.showToast({
            title: res.data.message || (isEditMode ? '更新失败，请重试' : '创建失败，请重试'),
            icon: 'none',
            duration: 2500
          })
          this.setData({ loading: false })
        }
      },
      fail: (err) => {
        console.error('提交失败:', err)
        wx.showToast({
          title: '网络错误，请检查网络连接',
          icon: 'none',
          duration: 2500
        })
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

    // 构建物品清单字段（排除已删除的）
    const itemFields = {}
    fixedItems.forEach(item => {
      if (item.deleted) return
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
  },

  loadExistingContract(contractId) {
    wx.showLoading({ title: '加载中...' })
    wx.request({
      url: `${app.globalData.baseUrl}/api/contracts/${contractId}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${app.globalData.token || ''}` },
      success: (res) => {
        wx.hideLoading()
        if (res.data.code === 200) {
          const contract = res.data.data.contract
          console.log('加载合同原始数据:', JSON.stringify(contract, null, 2))

          const formData = { ...this.data.formData }
          // 直接复制所有合同字段（字段名一致）
          Object.keys(contract).forEach(key => {
            if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
              formData[key] = contract[key]
            }
          })

          // 恢复 payment_cycle_text
          if (formData.payment_cycle) {
            formData.payment_cycle_text = formData.payment_cycle
          }

          // 恢复固定物品清单的数量
          const itemFieldMapping = {
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

          const fixedItems = this.data.fixedItems.map(item => {
            const fieldName = itemFieldMapping[item.name]
            if (fieldName && contract[fieldName] !== undefined && contract[fieldName] !== null) {
              return { ...item, quantity: String(contract[fieldName]), confirmed: true }
            }
            return item
          })

          console.log('恢复后的formData:', JSON.stringify(formData, null, 2))
          console.log('恢复后的fixedItems:', JSON.stringify(fixedItems, null, 2))

          this.setData({ formData, fixedItems })
          wx.showToast({ title: '已加载合同信息', icon: 'success' })
        } else {
          wx.showToast({ title: res.data.message || '加载失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})