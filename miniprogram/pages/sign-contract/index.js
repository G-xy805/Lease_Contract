// pages/sign-contract/index.js
const app = getApp();
const api = require('../../services/api');

Page({
  data: {
    // ⭐ 核心变更：使用 signRole 替代 isPartyA
    contractId: null,
    signRole: null, // 'LESSOR' | 'LESSEE'
    signTitle: '', // '甲方签署' 或 '乙方签署'

    // 合同信息
    contractInfo: null,

    // 状态控制
    loading: true,
    canSign: true,
    errorMessage: '',

    // 签名配置
    currentColor: '#000000',
    currentThickness: '3',
    hasSigned: false,

    // 提交状态
    isSubmitting: false
  },

  // 签名上下文（Canvas相关）
  signContext: null,
  canvasNode: null,

  /**
   * ⭐⭐⭐ 页面加载 - 接收 signRole 参数（替代 isPartyA）
   */
  onLoad(options) {
    const { contractId, signRole } = options;

    // 参数校验
    if (!contractId || !signRole) {
      wx.showToast({ title: '参数缺失', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // ⭐ 验证 signRole 参数有效性
    if (!['LESSOR', 'LESSEE'].includes(signRole)) {
      wx.showToast({ title: '无效的签署角色', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.setData({
      contractId: parseInt(contractId),
      signRole: signRole, // 直接存 role 字符串
      signTitle: signRole === 'LESSOR' ? '甲方签署' : '乙方签署'
    });

    // ⭐ 执行前置检查链
    this.preCheckAndLoad();
  },

  onReady() {
    const query = wx.createSelectorQuery().in(this);
    query
      .select('#signCanvas')
      .fields({ node: true, size: true })
      .exec(res => {
        if (res[0]) {
          this.canvasNode = res[0].node;
          this.signContext = this.canvasNode.getContext('2d');

          const dpr = wx.getSystemInfoSync().pixelRatio;
          this.canvasNode.width = res[0].width * dpr;
          this.canvasNode.height = res[0].height * dpr;

          this.signContext.scale(dpr, dpr);
        }
      });
  },

  /**
   * ⭐⭐⭐ 前置检查链（按顺序执行）
   * 1. 检查登录状态
   * 2. 检查实名认证
   * 3. 检查合同状态和签署权限
   * 4. 加载合同详情
   */
  async preCheckAndLoad() {
    try {
      await this.checkLogin();
      await this.checkRealNameVerify();
      await this.checkContractStatus();
      await this.loadContractDetail();
      this.setData({ loading: false });
    } catch (err) {
      console.error('[Sign] 前置检查失败:', err);
      this.setData({ loading: false, errorMessage: err.message });
    }
  },

  /**
   * 检查登录状态
   */
  checkLogin() {
    const token = app.globalData.token;
    if (!token) {
      throw new Error('请先登录后再进行签署操作');
    }
  },

  /**
   * 检查实名认证状态
   * 未认证则弹窗引导至认证页
   */
  checkRealNameVerify() {
    const realNameStatus = app.globalData.userInfo?.real_name_status;
    if (realNameStatus !== 2) {
      wx.showModal({
        title: '需要实名认证',
        content: '进行签署操作前需要先完成实名认证',
        confirmText: '去认证',
        success: res => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/real-name/index' });
          } else {
            wx.navigateBack();
          }
        }
      });
      throw new Error('未完成实名认证');
    }
  },

  /**
   * ⭐ 检查合同状态和当前用户签署权限
   */
  async checkContractStatus() {
    const res = await api.getContractDetail(this.data.contractId);
    const contract = res.data.contract;

    // 检查合同状态是否允许签署
    if (![1, 2].includes(contract.status)) {
      throw new Error(`当前合同状态不允许签署(状态码:${contract.status})`);
    }

    // ⭐ 检查当前用户是否是对应的签署方
    const userRole = app.globalData.userInfo?.role;
    const signRole = this.data.signRole;

    if (signRole === 'LESSOR' && userRole !== 'LESSOR' && userRole !== 'ADMIN') {
      throw new Error('您无权以甲方身份签署此合同');
    }

    if (signRole === 'LESSEE' && userRole !== 'LESSEE' && userRole !== 'ADMIN') {
      throw new Error('您无权以乙方身份签署此合同');
    }

    // 检查是否已经签署过
    const signatures = res.data.signatures || [];
    const mySignature = signatures.find(s => s.sign_role === signRole);

    if (mySignature && mySignature.sign_status === 1) {
      throw new Error('您已经签署过此合同');
    }
  },

  /**
   * 加载合同详情（用于展示）
   */
  async loadContractDetail() {
    const res = await api.getContractDetail(this.data.contractId);
    this.setData({ contractInfo: res.data.contract });
  },

  // ========== 签名画布操作 ==========

  handleTouchStart(e) {
    if (!this.signContext || !this.canvasNode) return;

    this.isDrawing = true;
    const touch = e.touches[0];
    const point = { x: touch.x, y: touch.y };

    this.points = [point];

    this.signContext.strokeStyle = this.data.currentColor;
    this.signContext.lineWidth = parseInt(this.data.currentThickness);
    this.signContext.lineCap = 'round';
    this.signContext.lineJoin = 'round';

    this.signContext.beginPath();
    this.signContext.moveTo(point.x, point.y);
    this.signContext.stroke();
  },

  handleTouchMove(e) {
    if (!this.isDrawing || !this.signContext || !this.canvasNode) return;

    const touch = e.touches[0];
    const point = { x: touch.x, y: touch.y };

    this.points.push(point);

    this.signContext.lineTo(point.x, point.y);
    this.signContext.stroke();
  },

  handleTouchEnd() {
    if (!this.isDrawing) return;

    this.isDrawing = false;

    // 标记已有签名
    if (this.points && this.points.length > 0) {
      this.setData({ hasSigned: true });
    }

    this.points = [];
  },

  handleCanvasTap() {
    // 阻止事件冒泡
  },

  selectColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({ currentColor: color });
  },

  selectThickness(e) {
    const thickness = e.currentTarget.dataset.thickness;
    this.setData({ currentThickness: thickness });
  },

  clearSign() {
    if (!this.signContext || !this.canvasNode) return;

    const dpr = wx.getSystemInfoSync().pixelRatio;
    this.signContext.clearRect(
      0,
      0,
      this.canvasNode.width / dpr,
      this.canvasNode.height / dpr
    );

    this.setData({ hasSigned: false });
  },

  reSign() {
    this.clearSign();
  },

  /**
   * 获取签名图片（Base64格式）
   */
  getSignatureImage() {
    return new Promise((resolve, reject) => {
      if (!this.canvasNode) {
        reject(new Error('Canvas未初始化'));
        return;
      }

      wx.canvasToTempFilePath({
        canvas: this.canvasNode,
        success: res => {
          wx.getFileSystemManager().readFile({
            filePath: res.tempFilePath,
            encoding: 'base64',
            success: readRes => {
              resolve(readRes.data);
            },
            fail: err => {
              reject(err);
            }
          });
        },
        fail: err => {
          reject(err);
        }
      }, this);
    });
  },

  // ========== 提交签署操作 ==========

  /**
   * ⭐⭐⭐ 提交签名（调用统一API）
   */
  async onSubmitSignature(e) {
    const { signatureData } = e.detail; // 从 signature-pad 组件获取

    if (!signatureData) {
      wx.showToast({ title: '请先完成签名', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认签署',
      content: `您将以${this.data.signTitle}身份签署此合同，确认后不可撤销`,
      confirmColor: '#1989fa',
      success: async res => {
        if (!res.confirm) return;

        wx.showLoading({ title: '提交中...', mask: true });

        try {
          // ⭐⭐⭐ 调用统一的签署接口
          const result = await api.signContract(
            this.data.contractId,
            this.data.signRole, // 'LESSOR' 或 'LESSEE'
            signatureData // Base64 PNG
          );

          wx.hideLoading();
          wx.showToast({ title: '签署成功', icon: 'success' });

          setTimeout(() => {
            wx.navigateBack(); // 返回详情页会自动刷新
          }, 1500);
        } catch (err) {
          wx.hideLoading();
          wx.showToast({
            title: err.message || '签署失败',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 备用提交方法（如果使用内置画布而非组件）
   */
  async submitSign() {
    if (!this.data.hasSigned) {
      wx.showToast({ title: '请先签名', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认签署',
      content: `您将以${this.data.signTitle}身份签署此合同，确认后不可撤销`,
      confirmColor: '#1989fa',
      success: async res => {
        if (!res.confirm) return;

        this.setData({ isSubmitting: true });
        wx.showLoading({ title: '提交中...', mask: true });

        try {
          // 获取签名图片
          const signatureBase64 = await this.getSignatureImage();
          const signature = 'data:image/png;base64,' + signatureBase64;

          // ⭐⭐⭐ 调用统一的签署接口
          const result = await api.signContract(
            this.data.contractId,
            this.data.signRole,
            signature
          );

          wx.hideLoading();
          wx.showToast({ title: '签署成功', icon: 'success' });

          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } catch (err) {
          wx.hideLoading();
          wx.showToast({
            title: err.message || '签署失败',
            icon: 'none'
          });
        } finally {
          this.setData({ isSubmitting: false });
        }
      }
    });
  },

  onCancelSign() {
    wx.navigateBack();
  },

  showClearConfirmDialog() {
    if (!this.data.hasSigned) return;

    wx.showModal({
      title: '确认清除',
      content: '确定要清除当前签名吗？',
      confirmText: '清除',
      confirmColor: '#ee0a24',
      success: res => {
        if (res.confirm) {
          this.clearSign();
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
