// pages/index/index.js
const app = getApp();
const api = require('../../services/api');
const { maskPhone, CONTRACT_STATUS_TEXT } = require('../../utils/helpers');
const { ContractStatus, UserRole } = require('../../utils/constants');

Page({
  data: {
    // 用户信息
    userInfo: null,
    userRole: '',
    isRealNameVerified: false,

    // 统计数据
    stats: {
      totalContracts: 0,
      pendingSignCount: 0,
      completedCount: 0
    },

    // 最近合同列表
    recentContracts: [],

    // UI状态
    loading: true,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 5
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    // 页面显示时刷新数据（如果已登录）
    if (this.data.userInfo && !this.data.loading) {
      this.setData({ page: 1, recentContracts: [] });
      this.loadRecentContracts();
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true, page: 1 });
    api.clearCache(); // 清除API缓存
    this.initData().then(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 });
    this.loadMoreContracts();
  },

  // 初始化数据
  async initData() {
    await this.loadUserInfo();
    if (!this.data.userInfo) return;
    
    await Promise.all([
      this.loadStatistics(),
      this.loadRecentContracts()
    ]);
    
    this.setData({ loading: false });
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = app.globalData.userInfo;
      if (userInfo) {
        this.setData({
          userInfo,
          userRole: userInfo.role || '',
          isRealNameVerified: userInfo.real_name_status === 2
        });
      } else {
        // 尝试从API获取用户信息
        const res = await api.getProfile();
        if (res.data) {
          const info = res.data;
          app.globalData.userInfo = info;
          this.setData({
            userInfo: info,
            userRole: info.role || '',
            isRealNameVerified: info.real_name_status === 2
          });
        }
      }
    } catch (e) {
      console.error('加载用户信息失败:', e);
      // 未登录，跳转到登录页
      const token = wx.getStorageSync('token');
      if (!token) {
        wx.navigateTo({ url: '/pages/login/index' });
      }
    }
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      const isLandlord = this.data.userRole === UserRole.LESSOR || this.data.userRole === 'ADMIN';
      const apiMethod = isLandlord ? api.getLandlordContracts : api.getTenantContracts;
      
      // 只请求第一页获取总数
      const res = await apiMethod({ status: '', page: 1, page_size: 1 });
      const total = res.data?.total || 0;
      
      // 根据角色计算统计
      let stats = {
        totalContracts: total,
        pendingSignCount: 0,
        completedCount: 0
      };
      
      // 如果需要更精确的统计，可以额外请求或从列表中计算
      // 这里先使用基础统计，后续可根据实际API返回优化
      this.setData({ stats });
    } catch (e) {
      console.error('加载统计失败:', e);
    }
  },

  // 加载最近合同列表
  async loadRecentContracts() {
    try {
      const isLandlord = this.data.userRole === UserRole.LESSOR || this.data.userRole === 'ADMIN';
      const apiMethod = isLandlord ? api.getLandlordContracts : api.getTenantContracts;
      
      const res = await apiMethod({
        page: this.data.page,
        page_size: this.data.pageSize
      });
      
      const contracts = (res.data?.list || []).map(c => ({
        id: c.id,
        title: c.title || '房屋租赁合同',
        address: c.house_address,
        status: c.status,
        monthlyRent: c.monthly_rent,
        partyA: c.partyA_company,
        partyB: c.partyB_name,
        createdAt: c.created_at ? c.created_at.split('T')[0] : '',
        leaseStart: this.combineDateField(c),
        leaseEnd: this.combineEndDateField(c)
      }));
      
      this.setData({
        recentContracts: contracts,
        hasMore: contracts.length >= this.data.pageSize
      });
    } catch (e) {
      console.error('加载合同失败:', e);
    }
  },

  // 加载更多合同（上拉触底）
  async loadMoreContracts() {
    wx.showLoading({ title: '加载中' });
    try {
      const isLandlord = this.data.userRole === UserRole.LESSOR || this.data.userRole === 'ADMIN';
      const apiMethod = isLandlord ? api.getLandlordContracts : api.getTenantContracts;
      
      const res = await apiMethod({
        page: this.data.page,
        page_size: this.data.pageSize
      });
      
      const newContracts = (res.data?.list || []).map(c => ({
        id: c.id,
        title: c.title || '房屋租赁合同',
        address: c.house_address,
        status: c.status,
        monthlyRent: c.monthly_rent,
        partyA: c.partyA_company,
        partyB: c.partyB_name,
        createdAt: c.created_at ? c.created_at.split('T')[0] : '',
        leaseStart: this.combineDateField(c),
        leaseEnd: this.combineEndDateField(c)
      }));
      
      this.setData({
        recentContracts: [...this.data.recentContracts, ...newContracts],
        hasMore: newContracts.length >= this.data.pageSize
      });
    } catch (e) {
      console.error('加载更多失败:', e);
    }
    wx.hideLoading();
  },

  // 组合开始日期字段（从year/month/day组合）
  combineDateField(contract) {
    const { lease_start_year, lease_start_month, lease_start_day } = contract;
    if (lease_start_year && lease_start_month && lease_start_day) {
      return `${lease_start_year}-${String(lease_start_month).padStart(2, '0')}-${String(lease_start_day).padStart(2, '0')}`;
    }
    // 兼容旧格式
    if (contract.lease_start) {
      return contract.lease_start.split('T')[0];
    }
    return '';
  },

  // 组合结束日期字段（从year/month/day组合）
  combineEndDateField(contract) {
    const { lease_end_year, lease_end_month, lease_end_day } = contract;
    if (lease_end_year && lease_end_month && lease_end_day) {
      return `${lease_end_year}-${String(lease_end_month).padStart(2, '0')}-${String(lease_end_day).padStart(2, '0')}`;
    }
    // 兼容旧格式
    if (contract.lease_end) {
      return contract.lease_end.split('T')[0];
    }
    return '';
  },

  // 导航：创建合同
  onCreateContract() {
    wx.navigateTo({ url: '/pages/create-contract/index' });
  },

  // 导航：查看全部合同
  onViewAll() {
    wx.switchTab({ url: '/pages/my-contracts/index' });
  },

  // 导航：查看我的合同（乙方）
  onViewMyContracts() {
    wx.navigateTo({ url: '/pages/my-contracts/index' });
  },

  // 导航：合同详情
  onContractTap(e) {
    const { id } = e.currentTarget.dataset;
    if (id) {
      wx.navigateTo({ url: `/pages/contract-detail/index?id=${id}` });
    }
  }
});
