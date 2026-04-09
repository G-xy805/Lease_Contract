// pages/verify-invite/index.js
const app = getApp();
const api = require('../../services/api');

Page({
  data: {
    // ⭐ 核心状态（多状态机）
    verifyStatus: 'loading', // 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'refused'

    // 邀请码
    inviteCode: '',

    // 合同信息
    contractInfo: null,

    // 错误信息
    errorMessage: '',

    // ⭐ 用户状态检查
    isLoggedIn: false,
    isVerified: false, // 实名认证状态
    userInfo: null,

    // UI控制
    showActions: false,
    loading: true
  },

  onLoad(options) {
    const { code } = options;

    if (!code) {
      this.setData({
        verifyStatus: 'invalid',
        errorMessage: '缺少邀请码参数',
        loading: false
      });
      return;
    }

    this.setData({ inviteCode: code });
    this.verifyInviteCode();
  },

  /**
   * ⭐⭐⭐ 验证邀请码（第一步）
   */
  async verifyInviteCode() {
    try {
      const res = await api.verifyInviteCode(this.data.inviteCode);

      if (res.code === 200 && res.data.valid) {
        // 验证通过
        this.setData({
          verifyStatus: 'valid',
          contractInfo: res.data.contract || res.data,
          loading: false
        });

        // ⭐ 检查用户状态（登录+认证）
        this.checkUserStatus();
      } else {
        // 验证失败，判断具体原因
        const msg = res.data?.message || '邀请码无效';
        let status = 'invalid';

        if (msg.includes('过期')) status = 'expired';
        if (msg.includes('已接受')) status = 'accepted';
        if (msg.includes('已拒绝')) status = 'refused';

        this.setData({
          verifyStatus: status,
          errorMessage: msg,
          loading: false
        });
      }
    } catch (err) {
      console.error('[Verify] 验证邀请码失败:', err);
      this.setData({
        verifyStatus: 'invalid',
        errorMessage: err.message || '验证失败',
        loading: false
      });
    }
  },

  /**
   * ⭐ 检查用户登录和实名认证状态
   */
  checkUserStatus() {
    const token = app.globalData.token;
    const userInfo = app.globalData.userInfo;

    if (!token) {
      // 未登录
      this.setData({
        isLoggedIn: false,
        isVerified: false,
        showActions: false,
        userInfo: null
      });
    } else {
      // 已登录，检查实名认证
      const realNameStatus = userInfo?.real_name_status;
      this.setData({
        isLoggedIn: true,
        isVerified: realNameStatus === 2,
        userInfo: userInfo,
        showActions: realNameStatus === 2 // 只有已认证才显示操作按钮
      });
    }
  },

  // ========== 操作方法 ==========

  /**
   * ⭐ 登录操作（记录来源URL以便返回）
   */
  onLogin() {
    // 记录来源URL，登录后自动跳回
    wx.setStorageSync(
      'return_url',
      `/pages/verify-invite?code=${this.data.inviteCode}`
    );
    wx.navigateTo({ url: '/pages/login/index' });
  },

  /**
   * ⭐ 跳转实名认证页（携带来源URL）
   */
  onGoVerify() {
    wx.navigateTo({
      url:
        `/pages/real-name/index?redirect=/pages/verify-invite?code=${this.data.inviteCode}`
    });
  },

  /**
   * ⭐⭐⭐ 接受邀请并签署（核心操作）
   */
  async onAcceptAndSign() {
    // 前置检查1：未登录 → 引导登录
    if (!this.data.isLoggedIn) {
      this.onLogin();
      return;
    }

    // 前置检查2：未认证 → 引导认证
    if (!this.data.isVerified) {
      this.onGoVerify();
      return;
    }

    wx.showModal({
      title: '确认接受',
      content: '确定要接受此合同签署邀请吗？接受后将进入签署流程。',
      confirmText: '接受并签署',
      confirmColor: '#07c160',
      success: async res => {
        if (!res.confirm) return;

        wx.showLoading({ title: '处理中...' });

        try {
          const phone = app.globalData.userInfo?.phone;

          // ⭐⭐⭐ 调用接受邀请接口（使用invitee_phone参数）
          await api.acceptInvitation(this.data.inviteCode, phone);

          wx.hideLoading();
          wx.showToast({ title: '已接受邀请', icon: 'success' });

          // ⭐ 跳转到签署页（传递signRole=LESSEE）
          setTimeout(() => {
            wx.navigateTo({
              url: `/pages/sign-contract/index?contractId=${this.data.contractInfo.id}&signRole=LESSEE`
            });
          }, 1500);
        } catch (err) {
          wx.hideLoading();
          console.error('[Verify] 接受邀请失败:', err);
          wx.showToast({
            title: err.message || '接受邀请失败',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * ⭐⭐⭐ 拒绝邀请（核心操作）
   */
  async onReject() {
    wx.showModal({
      title: '拒绝邀请',
      message: '请输入拒绝原因（可选）',
      editable: true,
      placeholderText: '请输入拒绝原因',
      confirmColor: '#ee0a24',
      success: async res => {
        if (!res.confirm) return;

        wx.showLoading({ title: '提交中...' });

        try {
          const phone = app.globalData.userInfo?.phone;
          const reason = res.content?.trim() || '';

          // ⭐⭐⭐ 调用拒绝邀请接口（使用invitee_phone + refused_reason参数）
          await api.rejectInvitation(this.data.inviteCode, phone, reason);

          wx.hideLoading();
          wx.showToast({ title: '已拒绝邀请', icon: 'success' });

          // 更新状态为"已拒绝"
          this.setData({ verifyStatus: 'refused' });
        } catch (err) {
          wx.hideLoading();
          console.error('[Verify] 拒绝邀请失败:', err);
          wx.showToast({
            title: err.message || '操作失败',
            icon: 'none'
          });
        }
      }
    });
  },

  /**
   * 稍后再说
   */
  onLater() {
    wx.showToast({ title: '您可以稍后再处理', icon: 'none' });
  },

  /**
   * 返回首页
   */
  goBack() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  /**
   * 重试（重新输入邀请码）
   */
  onRetry() {
    // TODO: 可以实现手动输入邀请码的界面
    wx.showToast({ title: '请重新扫描或输入邀请码', icon: 'none' });
  },

  /**
   * 联系甲方
   */
  contactPartyA() {
    const phone =
      this.data.contractInfo?.partyA_phone ||
      this.data.contractInfo?.lessor_phone ||
      '';

    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone,
        fail: () => {
          wx.showToast({ title: '拨打失败', icon: 'none' });
        }
      });
    } else {
      wx.showToast({ title: '暂无甲方联系方式', icon: 'none' });
    }
  },

  onShow() {
    // ⭐ 页面显示时重新检查用户状态（处理从登录/认证页返回的情况）
    if (this.data.verifyStatus === 'valid') {
      this.checkUserStatus();
    }
  }
});
