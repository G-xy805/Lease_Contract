// pages/create-contract/index.js
const app = getApp();
const api = require('../../services/api');
const helpers = require('../../utils/helpers');
const { PAYMENT_METHODS, APP_CONFIG } = require('../../utils/constants');
const { INVENTORY_ITEMS } = require('../../utils/inventoryConfig');
const { FEE_ITEMS } = require('../../utils/feeConfig');

// 草稿存储键名
const STORAGE_KEY = APP_CONFIG.CONTRACT_DRAFT_KEY;
// 自动保存间隔（毫秒）
const AUTO_SAVE_INTERVAL = APP_CONFIG.AUTO_SAVE_INTERVAL;

Page({
  data: {
    userInfo: null,
    // 表单数据 - 按8个步骤组织（v2格式：日期字段拆分）
    formData: {
      // Step 1 - 甲方信息
      partyA_company: '',
      partyA_phone: '',
      partyA_phone2: '',
      partyA_idcard: '',
      partyA_contact: '',
      partyA_account: '',
      // Step 2 - 乙方信息
      partyB_name: '',
      partyB_phone: '',
      partyB_idCard: '',
      partyB_contact: '',
      // Step 3 - 房屋信息
      house_address: '',
      house_area: '',
      rent_purpose: '',
      // Step 4 - 租赁期限 ⭐⭐⭐ v2拆分格式
      lease_start_year: null,
      lease_start_month: null,
      lease_start_day: null,
      lease_end_year: null,
      lease_end_month: null,
      lease_end_day: null,
      lease_months: '',
      advance_notice_days: '30',
      // Step 5 - 租金信息
      monthly_rent: '',
      year_rent: '',
      payment_method: 1,
      payment_count: '',
      payment_cycle: '',
      first_payment_amount: '',
      second_payment_amount: '',
      second_payment_date: '',
      third_payment_amount: '',
      fourth_payment_amount: '',
      deposit: '',
      deposit_chinese: '',
      total_amount: '',
      partyA_account_for_rent: '', // 新增字段
      // Step 6 - 费用约定（数组）
      fee_items: [],
      // Step 7 - 居间服务费
      partyA_commission: '',
      partyA_commission_chinese: '',
      partyB_commission: '',
      partyB_commission_chinese: '',
      // Step 8 - 水电表读数
      electricity_meter: '',
      water_meter: '',
      gas_meter: '',
      // Step 9 - 物品清单（数组）
      inventory_items: [],
      // Step 10 - 备注
      remark: ''
    },
    // 显示用的日期属性（供用户阅读）
    startDateDisplay: '',
    endDateDisplay: '',
    minEndDate: '',
    leaseMonths: 0,

    // 表单验证错误信息
    errors: {},
    // 字段是否被修改过
    touched: {},
    // 提交状态
    loading: false,
    // 当前步骤 (0-9)
    currentStep: 0,
    // 步骤配置
    steps: [
      { title: '甲方信息', desc: '出租方信息' },
      { title: '乙方信息', desc: '承租方信息' },
      { title: '房屋信息', desc: '租赁标的' },
      { title: '租赁期限', desc: '起止时间' },
      { title: '租金信息', desc: '金额约定' },
      { title: '费用约定', desc: '杂项费用' },
      { title: '居间服务', desc: '佣金信息' },
      { title: '水电表', desc: '初始读数' },
      { title: '物品清单', desc: '设施确认' },
      { title: '备注', desc: '其他约定' }
    ],
    // 用途选项
    purposeColumns: ['居住', '办公', '经营', '仓储', '其他'],
    showPurposePicker: false,
    // 支付方式选项
    paymentMethodColumns: ['月付', '季付', '半年付', '年付'],
    paymentMethodValues: [1, 3, 6, 12],
    showPaymentMethodPicker: false,
    // 物品清单弹窗
    showAddItemPopup: false,
    newItemName: '',
    newItemQuantity: '1',
    newItemUnit: '个',
    // 预定义物品列表
    inventoryOptions: INVENTORY_ITEMS,
    // 物品选择器
    showInventoryPicker: false,
    selectedInventoryIndex: -1,
    // 物品数量映射 (templateField -> quantity)
    inventoryQuantities: {},
    // 已添加物品摘要
    inventorySummary: [],
    // 预定义费用列表
    feeOptions: FEE_ITEMS.map(item => ({ name: item.name, checked: item.defaultChecked }))
  },

  // 自动保存定时器
  autoSaveTimer: null,
  // 编辑模式合同ID
  editContractId: null,

  onLoad(options) {
    const userInfo = app.globalData?.userInfo || {};
    this.setData({ userInfo });

    // 编辑模式
    if (options.contractId) {
      this.editContractId = options.contractId;
      this.setData({ navigationBarTitleText: '编辑合同' });
      this.loadExistingContract(options.contractId);
      return;
    }

    // 自动填充甲方信息
    this.setData({
      'formData.partyA_company': userInfo.name || userInfo.company || APP_CONFIG.DEFAULT_COMPANY_NAME,
      'formData.partyA_phone': userInfo.phone || '',
      'formData.partyA_idcard': userInfo.idcard || ''
    });

    // 加载本地草稿
    this.loadDraft();

    // 启动自动保存
    this.startAutoSave();
  },

  onUnload() {
    this.stopAutoSave();
    this.checkUnsavedBeforeLeave();
  },

  onHide() {
    this.autoSaveToStorage();
  },

  // ========== 自动保存 ==========
  startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.autoSaveTimer = setInterval(() => {
      this.autoSaveToStorage();
    }, AUTO_SAVE_INTERVAL);
  },

  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  },

  autoSaveToStorage() {
    const { formData, touched } = this.data;
    const hasChanges = Object.keys(touched).some(key => touched[key]);
    if (!hasChanges) return;

    const draftData = {
      ...formData,
      savedAt: new Date().toISOString(),
      currentStep: this.data.currentStep
    };

    try {
      wx.setStorageSync(STORAGE_KEY, draftData);
      console.log('草稿保存成功:', draftData.savedAt);
      this.setData({ touched: {} });
    } catch (e) {
      console.error('草稿保存失败:', e);
    }
  },

  loadDraft() {
    try {
      const draft = wx.getStorageSync(STORAGE_KEY);
      if (!draft) return false;

      const savedTime = new Date(draft.savedAt);
      const now = new Date();
      const diffMinutes = Math.floor((now - savedTime) / 60000);

      if (diffMinutes < 60) {
        wx.showModal({
          title: '发现未保存的草稿',
          content: `您有${diffMinutes}分钟前未保存的草稿，是否恢复？`,
          confirmText: '恢复',
          cancelText: '不恢复',
          success: (res) => {
            if (res.confirm) {
              // 草稿恢复时转换旧格式为新格式
              const convertedDraft = this.convertDraftFormat(draft);
              this.setData({
                formData: convertedDraft,
                currentStep: draft.currentStep || 0,
                startDateDisplay: this.combineToDate(
                  convertedDraft.lease_start_year,
                  convertedDraft.lease_start_month,
                  convertedDraft.lease_start_day
                ),
                endDateDisplay: this.combineToDate(
                  convertedDraft.lease_end_year,
                  convertedDraft.lease_end_month,
                  convertedDraft.lease_end_day
                ),
                minEndDate: this.combineToDate(
                  convertedDraft.lease_start_year,
                  convertedDraft.lease_start_month,
                  convertedDraft.lease_start_day
                )
              });
              this.calculateLeaseMonths();
              wx.showToast({ title: '已恢复草稿', icon: 'success' });
            } else {
              wx.removeStorageSync(STORAGE_KEY);
            }
          }
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error('加载草稿失败:', e);
      return false;
    }
  },

  // 转换旧版草稿格式为v2格式
  convertDraftFormat(draft) {
    const result = { ...draft };

    // 如果是旧版草稿（有lease_start字符串），转换为新版格式
    if (draft.lease_start && typeof draft.lease_start === 'string' && draft.lease_start.includes('-')) {
      const parts = draft.lease_start.split('-');
      result.lease_start_year = parseInt(parts[0]);
      result.lease_start_month = parseInt(parts[1]);
      result.lease_start_day = parseInt(parts[2]);
      delete result.lease_start; // 删除旧字段
    }

    if (draft.lease_end && typeof draft.lease_end === 'string' && draft.lease_end.includes('-')) {
      const parts = draft.lease_end.split('-');
      result.lease_end_year = parseInt(parts[0]);
      result.lease_end_month = parseInt(parts[1]);
      result.lease_end_day = parseInt(parts[2]);
      delete result.lease_end; // 删除旧字段
    }

    return result;
  },

  checkUnsavedBeforeLeave() {
    const { touched } = this.data;
    const hasUnsaved = Object.keys(touched).some(key => touched[key]);
    if (hasUnsaved) {
      this.autoSaveToStorage();
    }
  },

  markAsUnsaved(field) {
    this.setData({
      touched: { ...this.data.touched, [field]: true }
    });
  },

  // ========== 字段变更处理 ==========
  onFieldChange(e) {
    const { field } = e.currentTarget.dataset;
    let value = e.detail;

    this.markAsUnsaved(field);

    const { errors } = this.data;
    if (errors[field]) {
      delete errors[field];
      this.setData({ errors });
    }

    // 更新字段值
    this.setData({ [`formData.${field}`]: value });

    // 自动计算逻辑
    this.autoCalculate(field, value);
  },

  onFieldBlur(e) {
    const { field } = e.currentTarget.dataset;
    let value = e.detail;
    if (typeof value === 'string') {
      value = value.trim().replace(/\s+/g, '');
    }
    const error = this.validateField(field, value);

    const { errors } = this.data;
    if (error) {
      this.setData({ errors: { ...errors, [field]: error } });
    } else {
      if (errors[field]) {
        delete errors[field];
        this.setData({ errors });
      }
    }
  },

  // 自动计算：押金大写、租赁月数、合同总金额、支付计划
  autoCalculate(field, value) {
    const { formData } = this.data;

    // 押金 -> 大写
    if (field === 'deposit' && value) {
      const depositChinese = helpers.digitToChinese(value);
      this.setData({ 'formData.deposit_chinese': depositChinese });
    }

    // 甲方佣金 -> 大写
    if (field === 'partyA_commission' && value !== undefined) {
      const commissionChinese = helpers.digitToChinese(value);
      this.setData({ 'formData.partyA_commission_chinese': commissionChinese });
    }

    // 乙方佣金 -> 大写
    if (field === 'partyB_commission' && value !== undefined) {
      const commissionChinese = helpers.digitToChinese(value);
      this.setData({ 'formData.partyB_commission_chinese': commissionChinese });
    }

    // 结束日期变化 -> 重新计算支付计划
    if (field === 'lease_end_year' || field === 'lease_end_month' || field === 'lease_end_day') {
      this.calculatePaymentPlan(formData);
    }

    // 月租金或租赁月数变化 -> 合同总金额 + 支付计划
    if (field === 'monthly_rent' || field === 'lease_months') {
      const monthlyRent = field === 'monthly_rent' ? parseFloat(value) || 0 : parseFloat(formData.monthly_rent) || 0;
      const months = field === 'lease_months' ? parseInt(value) || 0 : parseInt(formData.lease_months) || 0;
      const total = monthlyRent * months;
      this.setData({ 'formData.total_amount': total > 0 ? total.toFixed(2) : '' });
      // 计算年租金
      this.setData({ 'formData.year_rent': total > 0 ? total.toFixed(2) : '' });
      // 重新计算支付计划
      this.calculatePaymentPlan({ ...formData, monthly_rent: String(monthlyRent), lease_months: String(months) });
    }

    // 支付方式变化 -> 重新计算支付计划
    if (field === 'payment_method') {
      this.calculatePaymentPlan(formData);
    }
  },

  calculateTotalAmount(formData) {
    const monthlyRent = parseFloat(formData.monthly_rent) || 0;
    const months = parseInt(formData.lease_months) || 0;
    const total = monthlyRent * months;
    this.setData({ 'formData.total_amount': total > 0 ? total.toFixed(2) : '' });
    this.setData({ 'formData.year_rent': total > 0 ? total.toFixed(2) : '' });
  },

  // 计算支付计划
  calculatePaymentPlan(formData) {
    const paymentMethod = parseInt(formData.payment_method) || 1;
    const monthlyRent = parseFloat(formData.monthly_rent) || 0;
    const months = parseInt(formData.lease_months) || 0;
    
    // 使用组合后的开始日期
    const leaseStart = this.combineToDate(
      formData.lease_start_year,
      formData.lease_start_month,
      formData.lease_start_day
    );

    if (!months || !monthlyRent) {
      this.setData({
        'formData.payment_count': '',
        'formData.payment_cycle': '',
        'formData.first_payment_amount': '',
        'formData.second_payment_amount': '',
        'formData.second_payment_date': '',
        'formData.third_payment_amount': '',
        'formData.fourth_payment_amount': ''
      });
      return;
    }

    // 计算支付周期和次数
    let cycle = 1;
    if (paymentMethod === 3) cycle = 3;
    else if (paymentMethod === 6) cycle = 6;
    else if (paymentMethod === 12) cycle = 12;

    const count = Math.ceil(months / cycle);
    const amountPerPay = monthlyRent * cycle;
    const totalRent = monthlyRent * months;
    const firstAmount = totalRent - amountPerPay * (count - 1);

    // 计算各期支付日期
    let secondDate = '';
    if (count >= 2 && leaseStart) {
      const parts = leaseStart.split('-');
      if (parts.length === 3) {
        const startYear = parseInt(parts[0]);
        const startMonth = parseInt(parts[1]);
        const targetMonth = startMonth + cycle;
        const targetYear = startYear + Math.floor(targetMonth / 12);
        const finalMonth = ((targetMonth - 1) % 12) + 1;
        secondDate = `${targetYear}-${String(finalMonth).padStart(2, '0')}-${parts[2]}`;
      }
    }

    this.setData({
      'formData.payment_count': String(count),
      'formData.payment_cycle': String(cycle),
      'formData.first_payment_amount': firstAmount.toFixed(2),
      'formData.second_payment_amount': count >= 2 ? amountPerPay.toFixed(2) : '',
      'formData.second_payment_date': secondDate,
      'formData.third_payment_amount': count >= 3 ? amountPerPay.toFixed(2) : '',
      'formData.fourth_payment_amount': count >= 4 ? amountPerPay.toFixed(2) : ''
    });
  },

  onPaymentCountChange(e) {
    const value = parseInt(e.detail) || 0;
    const count = Math.min(Math.max(value, 1), 4);
    const { formData } = this.data;
    const monthlyRent = parseFloat(formData.monthly_rent) || 0;
    const months = parseInt(formData.lease_months) || 0;
    const cycle = parseInt(formData.payment_cycle) || 1;
    const amountPerPay = monthlyRent * cycle;

    this.setData({
      'formData.payment_count': String(count),
      'formData.second_payment_amount': count >= 2 ? (amountPerPay > 0 ? amountPerPay.toFixed(2) : '') : '',
      'formData.third_payment_amount': count >= 3 ? (amountPerPay > 0 ? amountPerPay.toFixed(2) : '') : '',
      'formData.fourth_payment_amount': count >= 4 ? (amountPerPay > 0 ? amountPerPay.toFixed(2) : '') : ''
    });
    this.markAsUnsaved('payment_count');
  },

  // ========== 验证 ==========
  validateField(field, value) {
    let strValue = value;
    if (typeof strValue === 'string') {
      strValue = strValue.trim().replace(/\s+/g, '');
    } else if (strValue !== null && strValue !== undefined) {
      strValue = String(strValue).trim().replace(/\s+/g, '');
    } else {
      strValue = '';
    }

    // 必填字段（v2格式验证日期字段）
    const requiredFields = [
      'partyA_company', 'partyA_phone',
      'partyB_name', 'partyB_phone',
      'house_address',
      'lease_start_year', 'lease_start_month', 'lease_start_day',
      'lease_end_year', 'lease_end_month', 'lease_end_day',
      'lease_months',
      'monthly_rent', 'deposit'
    ];

    if (requiredFields.includes(field) && !strValue) {
      return '必填';
    }

    // 手机号格式
    if (field === 'partyA_phone' && strValue && !/^1[3-9]\d{9}$/.test(strValue)) {
      return '手机号格式错误';
    }
    if (field === 'partyB_phone' && strValue && !/^1[3-9]\d{9}$/.test(strValue)) {
      return '手机号格式错误';
    }

    // 身份证格式
    if ((field === 'partyA_idcard' || field === 'partyB_idCard') && strValue && !/^\d{17}[\dXx]$/.test(strValue)) {
      return '身份证号格式错误';
    }

    return '';
  },

  validateForm() {
    const { formData } = this.data;
    const errors = {};

    const required = [
      'partyA_company', 'partyA_phone',
      'partyB_name', 'partyB_phone',
      'house_address',
      'lease_start_year', 'lease_start_month', 'lease_start_day',
      'lease_end_year', 'lease_end_month', 'lease_end_day',
      'lease_months',
      'monthly_rent', 'deposit'
    ];

    for (const field of required) {
      let value = formData[field];
      let strValue = typeof value === 'string' ? value.trim().replace(/\s+/g, '') : String(value || '').trim();
      if (!strValue) {
        errors[field] = '必填';
      }
    }

    // 手机号验证
    const partyAPhone = String(formData.partyA_phone || '').trim();
    if (partyAPhone && !/^1[3-9]\d{9}$/.test(partyAPhone)) {
      errors.partyA_phone = '手机号格式错误';
    }

    const partyBPhone = String(formData.partyB_phone || '').trim();
    if (partyBPhone && !/^1[3-9]\d{9}$/.test(partyBPhone)) {
      errors.partyB_phone = '手机号格式错误';
    }

    // 身份证验证
    const partyAIdCard = String(formData.partyA_idcard || '').trim();
    if (partyAIdCard && !/^\d{17}[\dXx]$/.test(partyAIdCard)) {
      errors.partyA_idcard = '身份证号格式错误';
    }

    const partyBIdCard = String(formData.partyB_idCard || '').trim();
    if (partyBIdCard && !/^\d{17}[\dXx]$/.test(partyBIdCard)) {
      errors.partyB_idCard = '身份证号格式错误';
    }

    // 日期验证（使用拆分后的字段）
    if (formData.lease_start_year && formData.lease_end_year) {
      const startDate = new Date(formData.lease_start_year, formData.lease_start_month - 1, formData.lease_start_day).getTime();
      const endDate = new Date(formData.lease_end_year, formData.lease_end_month - 1, formData.lease_end_day).getTime();
      if (endDate < startDate) {
        errors.lease_end_year = '结束日期不得早于开始日期';
      }
    }

    // 租金必须为正数
    const monthlyRent = parseFloat(formData.monthly_rent);
    if (formData.monthly_rent && (isNaN(monthlyRent) || monthlyRent <= 0)) {
      errors.monthly_rent = '租金必须为正数';
    }

    // 押金必须为正数
    const deposit = parseFloat(formData.deposit);
    if (formData.deposit && (isNaN(deposit) || deposit <= 0)) {
      errors.deposit = '押金必须为正数';
    }

    this.setData({ errors: Object.keys(errors).length ? errors : {} });
    return Object.keys(errors).length === 0;
  },

  // ========== 日期选择（原生picker）⭐⭐⭐ v2新实现 ==========
  
  onStartDateChange(e) {
    const dateStr = e.detail.value; // '2026-05-01'
    const parts = dateStr.split('-');

    this.setData({
      'formData.lease_start_year': parseInt(parts[0]),
      'formData.lease_start_month': parseInt(parts[1]),
      'formData.lease_start_day': parseInt(parts[2]),
      startDateDisplay: dateStr,
      minEndDate: dateStr, // 结束日期不能早于开始日期
      endDateDisplay: '', // 清空结束日期让用户重新选
      'formData.lease_end_year': null,
      'formData.lease_end_month': null,
      'formData.lease_end_day': null
    });

    this.markAsUnsaved('lease_start_year');
    this.calculateLeaseMonths();
    this.saveDraft();
  },

  onEndDateChange(e) {
    const dateStr = e.detail.value;
    const parts = dateStr.split('-');
    const startDate = new Date(this.data.startDateDisplay);
    const endDate = new Date(dateStr);

    if (endDate <= startDate) {
      wx.showToast({ title: '结束日期必须晚于开始日期', icon: 'none' });
      return;
    }

    this.setData({
      'formData.lease_end_year': parseInt(parts[0]),
      'formData.lease_end_month': parseInt(parts[1]),
      'formData.lease_end_day': parseInt(parts[2]),
      endDateDisplay: dateStr
    });

    this.markAsUnsaved('lease_end_year');
    this.calculateLeaseMonths();
    this.autoCalculate('lease_end_year', parts[0]);
    this.saveDraft();
  },

  // 计算租赁月数
  calculateLeaseMonths() {
    const { lease_start_year, lease_start_month, lease_start_day,
            lease_end_year, lease_end_month, lease_end_day } = this.data.formData;

    if (lease_start_year && lease_end_year) {
      const start = new Date(lease_start_year, lease_start_month - 1, lease_start_day);
      const end = new Date(lease_end_year, lease_end_month - 1, lease_end_day);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      
      this.setData({
        leaseMonths: months,
        'formData.lease_months': months
      });
      
      // 触发自动计算总金额和支付计划
      if (months > 0) {
        this.autoCalculate('lease_months', months);
      }
    }
  },

  // 组合日期为字符串（用于显示和API兼容）
  combineToDate(year, month, day) {
    if (year && month && day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return '';
  },

  // ========== Picker选择 ==========
  showPurposePicker() {
    this.setData({ showPurposePicker: true });
  },
  closePurposePicker() {
    this.setData({ showPurposePicker: false });
  },
  onPurposeConfirm(e) {
    const value = e.detail?.value;
    this.setData({
      'formData.rent_purpose': value,
      showPurposePicker: false
    });
    this.markAsUnsaved('rent_purpose');
  },

  showPaymentMethodPicker() {
    this.setData({ showPaymentMethodPicker: true });
  },
  closePaymentMethodPicker() {
    this.setData({ showPaymentMethodPicker: false });
  },
  onPaymentMethodConfirm(e) {
    const { value } = e.detail;
    const methodValue = this.data.paymentMethodValues[value];
    this.setData({
      'formData.payment_method': methodValue,
      showPaymentMethodPicker: false
    });
    this.markAsUnsaved('payment_method');
  },

  // ========== 费用勾选 ==========
  onFeeChange(e) {
    const { index } = e.currentTarget.dataset;
    const feeOptions = [...this.data.feeOptions];
    feeOptions[index].checked = e.detail;
    const fee_items = feeOptions.filter(item => item.checked).map(item => ({
      name: item.name,
      checked: true
    }));
    this.setData({
      feeOptions,
      'formData.fee_items': fee_items
    });
    this.markAsUnsaved('fee_items');
  },

  initFeeFromItems(feeItems) {
    if (!Array.isArray(feeItems)) {
      return FEE_ITEMS.map(item => ({ name: item.name, checked: item.defaultChecked }));
    }
    const feeOptions = FEE_ITEMS.map(defaultItem => {
      const found = feeItems.find(fee => fee.name === defaultItem.name);
      return {
        name: defaultItem.name,
        checked: found ? found.checked : defaultItem.defaultChecked
      };
    });
    return feeOptions;
  },

  // ========== 物品清单 ==========
  showAddItemModal() {
    this.setData({
      showAddItemPopup: true,
      newItemName: '',
      newItemQuantity: '1',
      newItemUnit: '个',
      selectedInventoryIndex: -1
    });
  },
  closeAddItemPopup() {
    this.setData({ showAddItemPopup: false });
  },
  onNewItemNameChange(e) {
    this.setData({ newItemName: e.detail });
  },
  onNewItemQuantityChange(e) {
    this.setData({ newItemQuantity: e.detail });
  },
  onNewItemUnitChange(e) {
    this.setData({ newItemUnit: e.detail || '个' });
  },
  showInventoryPicker() {
    this.setData({ showInventoryPicker: true });
  },
  closeInventoryPicker() {
    this.setData({ showInventoryPicker: false });
  },
  onInventoryPickerConfirm(e) {
    const { index } = e.currentTarget.dataset;
    const selectedItem = this.data.inventoryOptions[index];
    if (selectedItem) {
      this.setData({
        newItemName: selectedItem.name,
        newItemUnit: selectedItem.unit,
        selectedInventoryIndex: index,
        showInventoryPicker: false
      });
    }
  },
  confirmAddItem() {
    const { newItemName, newItemQuantity, newItemUnit } = this.data;
    if (!newItemName || !newItemName.trim()) {
      wx.showToast({ title: '请输入物品名称', icon: 'none' });
      return;
    }
    const inventory_items = [...this.data.formData.inventory_items, {
      name: newItemName.trim(),
      quantity: parseInt(newItemQuantity) || 1,
      unit: newItemUnit || '个'
    }];
    this.setData({
      'formData.inventory_items': inventory_items,
      showAddItemPopup: false
    });
    this.markAsUnsaved('inventory_items');
    wx.showToast({ title: '添加成功', icon: 'success' });
  },
  deleteInventoryItem(e) {
    const { index } = e.currentTarget.dataset;
    const inventory_items = [...this.data.formData.inventory_items];
    inventory_items.splice(index, 1);
    this.setData({ 'formData.inventory_items': inventory_items });
    this.markAsUnsaved('inventory_items');
  },
  onInventoryItemChange(e) {
    const { index, field } = e.currentTarget.dataset;
    const inventory_items = [...this.data.formData.inventory_items];
    inventory_items[index][field] = e.detail;
    this.setData({ 'formData.inventory_items': inventory_items });
    this.markAsUnsaved('inventory_items');
  },
  onInventoryQuantityChange(e) {
    const { index } = e.currentTarget.dataset;
    const value = parseInt(e.detail) || 0;
    const inventory_items = [...this.data.formData.inventory_items];
    inventory_items[index].quantity = value;
    this.setData({ 'formData.inventory_items': inventory_items });
    this.markAsUnsaved('inventory_items');
  },

  onInventoryStepperChange(e) {
    const { field, name, unit } = e.currentTarget.dataset;
    const quantity = parseInt(e.detail) || 0;
    const inventoryQuantities = { ...this.data.inventoryQuantities };
    inventoryQuantities[field] = quantity;
    const inventorySummary = this.buildInventorySummary(inventoryQuantities);
    const inventory_items = inventorySummary.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      templateField: item.templateField
    }));
    this.setData({
      inventoryQuantities,
      inventorySummary,
      'formData.inventory_items': inventory_items
    });
    this.markAsUnsaved('inventory_items');
  },

  buildInventorySummary(inventoryQuantities) {
    const summary = [];
    for (const item of this.data.inventoryOptions) {
      const qty = inventoryQuantities[item.templateField] || 0;
      if (qty > 0) {
        summary.push({
          name: item.name,
          quantity: qty,
          unit: item.unit,
          templateField: item.templateField
        });
      }
    }
    return summary;
  },

  initInventoryFromItems(inventoryItems) {
    if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
      return { inventoryQuantities: {}, inventorySummary: [] };
    }
    const inventoryQuantities = {};
    for (const item of inventoryItems) {
      const field = item.templateField || this.findTemplateFieldByName(item.name);
      if (field) {
        inventoryQuantities[field] = item.quantity || 0;
      }
    }
    const inventorySummary = this.buildInventorySummary(inventoryQuantities);
    return { inventoryQuantities, inventorySummary };
  },

  findTemplateFieldByName(name) {
    const item = this.data.inventoryOptions.find(opt => opt.name === name);
    return item ? item.templateField : null;
  },

  // ========== 步骤切换 ==========
  onStepChange(e) {
    const { step } = e.detail;
    this.setData({ currentStep: step });
  },

  onStepClick(e) {
    const { step } = e.currentTarget.dataset;
    this.setData({ currentStep: step });
  },

  // ========== 保存草稿 ==========
  onSaveDraft() {
    this.autoSaveToStorage();
    wx.showToast({ title: '草稿已保存', icon: 'success' });
  },

  // ========== 预览 ==========
  onPreview() {
    if (!this.validateForm()) {
      wx.showToast({
        title: '请完善必填信息',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    const contractData = this.prepareContractData();
    wx.navigateTo({
      url: `/pages/preview-contract/index?data=${encodeURIComponent(JSON.stringify(contractData))}`
    });
  },

  // ========== 下一步 ==========
  onNextStep() {
    const { currentStep, steps } = this.data;
    if (currentStep < steps.length - 1) {
      this.setData({ currentStep: currentStep + 1 });
    } else {
      // Last step: submit the form
      this.onSubmit();
    }
  },

  // ========== 提交 ==========
  onSubmit() {
    if (!this.validateForm()) {
      const { errors } = this.data;
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        const firstError = errors[errorFields[0]];
        const fieldNames = {
          partyA_company: '甲方名称',
          partyA_phone: '甲方手机号',
          partyA_idcard: '甲方身份证号',
          partyB_name: '乙方姓名',
          partyB_phone: '乙方手机号',
          partyB_idCard: '乙方身份证号',
          house_address: '房屋地址',
          lease_start_year: '租赁开始日期',
          lease_end_year: '租赁结束日期',
          lease_months: '租赁月数',
          monthly_rent: '月租金',
          deposit: '押金'
        };
        const fieldName = fieldNames[errorFields[0]] || errorFields[0];
        wx.showToast({
          title: `${fieldName}${firstError}`,
          icon: 'none',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: '请完善必填信息',
          icon: 'none',
          duration: 2000
        });
      }
      return;
    }

    this.setData({ loading: true });

    const contractData = this.prepareContractData();
    const isEditMode = !!this.editContractId;

    const requestPromise = isEditMode
      ? api.updateContract(this.editContractId, contractData)
      : api.createContract(contractData);

    requestPromise.then(res => {
      if (res.code === 200 || res.code === 201) {
        wx.removeStorageSync(STORAGE_KEY);
        wx.showToast({
          title: isEditMode ? '合同更新成功' : '合同创建成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        });
      } else {
        wx.showToast({
          title: res.message || (isEditMode ? '更新失败，请重试' : '创建失败，请重试'),
          icon: 'none',
          duration: 2500
        });
        this.setData({ loading: false });
      }
    }).catch(err => {
      console.error('提交失败:', err);
      wx.showToast({
        title: '网络错误，请检查网络连接',
        icon: 'none',
        duration: 2500
      });
      this.setData({ loading: false });
    });
  },

  // ⭐⭐⭐ prepareContractData 完全重写 - 输出v2格式数据
  prepareContractData() {
    const { formData } = this.data;
    const appInstance = getApp();

    const data = {
      // 基本信息
      title: formData.title || '房屋租赁合同',
      lessor_user_id: appInstance.globalData.userInfo?.id,
      lessee_user_id: null,

      // 甲乙双方
      partyA_company: formData.partyA_company,
      partyA_phone: formData.partyA_phone,
      partyA_contact: formData.partyA_contact || null,
      partyA_phone2: formData.partyA_phone2 || null,
      partyA_account: formData.partyA_account || null,
      partyA_idcard: formData.partyA_idcard || null,
      partyB_name: formData.partyB_name,
      partyB_idCard: formData.partyB_idCard || null,
      partyB_phone: formData.partyB_phone,
      partyB_contact: formData.partyB_contact || null,

      // 房屋信息
      house_address: formData.house_address,
      house_area: formData.house_area ? parseFloat(formData.house_area) : null,

      // ⭐⭐⭐ v2日期格式：三个独立字段
      lease_start_year: formData.lease_start_year,
      lease_start_month: formData.lease_start_month,
      lease_start_day: formData.lease_start_day,
      lease_end_year: formData.lease_end_year,
      lease_end_month: formData.lease_end_month,
      lease_end_day: formData.lease_end_day,
      lease_months: formData.lease_months || null,
      rent_purpose: formData.rent_purpose || null,
      advance_notice_days: formData.advance_notice_days ? parseInt(formData.advance_notice_days) : null,

      // 租金支付
      monthly_rent: parseFloat(formData.monthly_rent) || 0,
      year_rent: formData.year_rent ? parseFloat(formData.year_rent) : null,
      payment_method: parseInt(formData.payment_method) || 1,
      payment_cycle: formData.payment_cycle ? parseInt(formData.payment_cycle) : null,
      payment_count: parseInt(formData.payment_count) || 1,
      first_payment_amount: formData.first_payment_amount ? parseFloat(formData.first_payment_amount) : null,
      second_payment_amount: formData.second_payment_amount ? parseFloat(formData.second_payment_amount) : null,
      third_payment_amount: formData.third_payment_amount ? parseFloat(formData.third_payment_amount) : null,
      fourth_payment_amount: formData.fourth_payment_amount ? parseFloat(formData.fourth_payment_amount) : null,
      partyA_account_for_rent: formData.partyA_account_for_rent || null,

      // 押金
      deposit: parseFloat(formData.deposit) || 0,

      // ⭐⭐⭐ v2 JSON格式：直接传数组（api.js内部会序列化）
      fee_items: formData.fee_items || [],
      inventory_items: formData.inventory_items || [],

      // 居间服务
      intermediary_name: formData.intermediary_name || null,
      partyA_commission: formData.partyA_commission ? parseFloat(formData.partyA_commission) : null,
      partyB_commission: formData.partyB_commission ? parseFloat(formData.partyB_commission) : null,

      // 水电表
      electricity_meter: formData.electricity_meter || null,
      water_meter: formData.water_meter || null,
      gas_meter: formData.gas_meter || null,

      // 备注
      remark: formData.remark || null
    };

    console.log('[CreateContract] 提交数据(v2格式):', JSON.stringify(data, null, 2));
    return data;
  },

  // ========== 编辑模式加载 ==========
  loadExistingContract(contractId) {
    wx.showLoading({ title: '加载中...' });

    api.getContractDetail(contractId).then(res => {
      wx.hideLoading();
      if (res.code === 200) {
        const contract = res.data.contract;
        console.log('加载合同数据:', JSON.stringify(contract, null, 2));

        const formData = { ...this.data.formData };

        // 字段映射（后端旧字段 -> 前端新字段）
        const fieldMapping = {
          lessor_name: 'partyA_company',
          lessor_phone: 'partyA_phone',
          lessor_idcard: 'partyA_idcard',
          lessee_name: 'partyB_name',
          lessee_phone: 'partyB_phone',
          lessee_idcard: 'partyB_idCard',
          lessee_contact: 'partyB_contact'
        };

        // 直接复制合同字段
        Object.keys(contract).forEach(key => {
          if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
            if (fieldMapping[key]) {
              formData[fieldMapping[key]] = contract[key];
            } else {
              formData[key] = contract[key];
            }
          }
        });

        // 处理物品清单
        if (contract.inventory_items) {
          if (typeof contract.inventory_items === 'string') {
            try {
              formData.inventory_items = JSON.parse(contract.inventory_items);
            } catch (e) {
              formData.inventory_items = [];
            }
          } else if (Array.isArray(contract.inventory_items)) {
            formData.inventory_items = contract.inventory_items;
          }
        }

        // 处理费用约定
        let feeItems = formData.fee_items;
        if (contract.fee_items) {
          if (typeof contract.fee_items === 'string') {
            try {
              feeItems = JSON.parse(contract.fee_items);
            } catch (e) {
              feeItems = [];
            }
          } else if (Array.isArray(contract.fee_items)) {
            feeItems = contract.fee_items;
          }
        }
        formData.fee_items = feeItems || [];
        const feeOptions = this.initFeeFromItems(formData.fee_items);

        // 初始化物品数量映射
        const { inventoryQuantities, inventorySummary } = this.initInventoryFromItems(formData.inventory_items);

        // 处理日期字段（兼容新旧格式）
        let startDateDisplay = '';
        let endDateDisplay = '';

        // 如果是v2格式（有拆分字段），直接使用
        if (contract.lease_start_year) {
          startDateDisplay = this.combineToDate(
            contract.lease_start_year,
            contract.lease_start_month,
            contract.lease_start_day
          );
          endDateDisplay = this.combineToDate(
            contract.lease_end_year,
            contract.lease_end_month,
            contract.lease_end_day
          );
        } 
        // 兼容旧格式（完整日期字符串）
        else if (contract.lease_start) {
          const startParts = contract.lease_start.split('-');
          if (startParts.length === 3) {
            formData.lease_start_year = parseInt(startParts[0]);
            formData.lease_start_month = parseInt(startParts[1]);
            formData.lease_start_day = parseInt(startParts[2]);
            startDateDisplay = contract.lease_start.split('T')[0];
          }
          
          if (contract.lease_end) {
            const endParts = contract.lease_end.split('-');
            if (endParts.length === 3) {
              formData.lease_end_year = parseInt(endParts[0]);
              formData.lease_end_month = parseInt(endParts[1]);
              formData.lease_end_day = parseInt(endParts[2]);
              endDateDisplay = contract.lease_end.split('T')[0];
            }
          }
        }

        this.setData({
          formData,
          inventoryQuantities,
          inventorySummary,
          feeOptions,
          startDateDisplay,
          endDateDisplay,
          minEndDate: startDateDisplay
        });

        // 计算租赁月数
        this.calculateLeaseMonths();

        wx.showToast({ title: '已加载合同信息', icon: 'success' });
      } else {
        wx.showToast({ title: res.message || '加载失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('加载合同失败:', err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    });
  }
});
