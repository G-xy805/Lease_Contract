// pages/my-contracts/index.js - 我的合同页（v2重构版 - TabBar页面）
const app = getApp()
const api = require('../../services/api')
const { ContractStatus, CONTRACT_STATUS_TEXT } = require('../../utils/constants')
const navigation = require('../../utils/navigation')

// 空状态文案配置
const EMPTY_CONFIG = {
  all: { text: '暂无合同', subText: '您还没有任何合同' },
  pending: { text: '暂无待签署的合同', subText: '待您签署的合同将显示在这里' },
  signed: { text: '暂无已签署的合同', subText: '已签署的合同将显示在这里' },
  rejected: { text: '暂无已拒绝/已取消的合同', subText: '已拒绝或已取消的合同' }
}

// 筛选Tab配置（与contracts页保持一致）
const FILTER_TABS = [
  { title: '全部', name: 'all', statuses: null },
  { title: '待签署', name: 'pending', statuses: [ContractStatus.PENDING_LESSOR_SIGN, ContractStatus.PENDING_LESSEE_SIGN] },
  { title: '已签署', name: 'signed', statuses: ContractStatus.SIGNED },
  { title: '已拒绝/取消', name: 'rejected', statuses: [ContractStatus.REJECTED, ContractStatus.CANCELLED] }
]

Page({
  data: {
    // 合同列表数据
    contracts: [],
    // 加载状态
    loading: false,
    refreshing: false,
    loadingMore: false,
    skeletonLoading: true,
    // 分页参数
    page: 1,
    pageSize: 10,
    hasMore: true,
    // 筛选状态
    activeTab: 0,
    tabs: FILTER_TABS
  },

  onLoad(options) {
    const token = wx.getStorageSync('token')
    if (!token) {
      navigation.navigateTo('/pages/login/index', { delay: 1500, showToast: '请先登录' })
      return
    }
    this.loadContracts(true)
  },

  onShow() {
    // Tab切换时检查是否需要刷新数据
    if (this.data.contracts.length > 0) {
      // 检查是否有合同被更新
      const updatedContract = wx.getStorageSync('contract_updated')
      if (updatedContract) {
        wx.removeStorageSync('contract_updated')
        const index = this.data.contracts.findIndex(c => c.id === updatedContract.id)
        if (index !== -1) {
          const contracts = [...this.data.contracts]
          contracts[index] = { ...contracts[index], ...updatedContract }
          this.setData({ contracts })
        }
      }
    } else if (!this.data.loading && !this.data.skeletonLoading) {
      // 首次进入且没有数据时加载
      this.loadContracts(true)
    }
  },

  onPullDownRefresh() {
    this.loadContracts(true)
  },

  onReachBottom() {
    if (!this.data.loadingMore && this.data.hasMore) {
      this.loadContracts(false, true)
    }
  },

  /**
   * 加载合同列表（根据用户角色自动选择API）
   */
  async loadContracts(isRefresh = false, isLoadMore = false) {
    const { page, pageSize, activeTab, tabs } = this.data

    // 设置加载状态
    if (isRefresh) {
      this.setData({ refreshing: true, page: 1, hasMore: true, skeletonLoading: false })
    } else if (isLoadMore) {
      this.setData({ loadingMore: true })
    } else {
      this.setData({ loading: true, skeletonLoading: true })
    }

    try {
      const currentTab = tabs[activeTab]
      const params = {
        page: isRefresh || isLoadMore ? 1 : page,
        page_size: pageSize
      }

      // 添加筛选条件
      if (currentTab && currentTab.statuses !== null) {
        if (Array.isArray(currentTab.statuses)) {
          params.status = currentTab.statuses.join(',')
        } else {
          params.status = currentTab.statuses
        }
      }

      // 根据用户角色调用不同API
      const isLessor = app.isLessor()
      const contractApi = isLessor ? api.getLandlordContracts : api.getTenantContracts
      const res = await contractApi(params)

      if (res.code === 200) {
        const result = res.data?.list || []
        const total = res.data?.total || 0

        // 转换合同数据格式
        const transformedList = result.map(item => ({
          id: item.id,
          title: item.title || '房屋租赁合同',
          status: item.status,
          statusText: CONTRACT_STATUS_TEXT[item.status] || '未知状态',
          contract_no: item.contract_no,
          houseAddress: item.house_address || '',
          house_address: item.house_address || '',
          leaseStart: item.lease_start || '',
          lease_start: item.lease_start || '',
          leaseEnd: item.lease_end || '',
          lease_end: item.lease_end || '',
          monthlyRent: item.monthly_rent || 0,
          monthly_rent: item.monthly_rent || 0,
          deposit: item.deposit || 0,
          leaseMonths: item.lease_months || 0,
          lease_months: item.lease_months || 0,
          partyA_company: item.partyA_company || '',
          partyA_name: item.partyA_name || item.partyA_company || '',
          partyB_name: item.partyB_name || '',
          partyA_phone: item.partyA_phone || '',
          partyB_phone: item.partyB_phone || '',
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
          updateTime: item.updated_at || item.created_at || '',
          lessor_sign_status: item.partyA_sign_status || 0,
          lessee_sign_status: item.partyB_sign_status || 0,
          partyA_sign_status: item.partyA_sign_status || 0,
          partyB_sign_status: item.partyB_sign_status || 0
        }))

        // 更新列表数据
        this.setData({
          contracts: isRefresh || isLoadMore ? transformedList : [...this.data.contracts, ...transformedList],
          hasMore: result.length >= pageSize && (isRefresh || isLoadMore ? result.length < total : this.data.contracts.length < total),
          page: isRefresh || isLoadMore ? 2 : this.data.page + 1,
          skeletonLoading: false
        })
      } else {
        wx.showToast({
          title: res.message || '获取合同列表失败',
          icon: 'none'
        })
        this.setData({ skeletonLoading: false })
      }
    } catch (err) {
      console.error('获取合同列表失败', err)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })

      // 错误处理
      if (isRefresh) {
        this.setData({ hasMore: false, skeletonLoading: false })
      } else if (isLoadMore) {
        this.setData({ page: this.data.page - 1, skeletonLoading: false })
      } else {
        this.setData({
          contracts: [],
          hasMore: false,
          skeletonLoading: false
        })
      }
    } finally {
      this.setData({
        loading: false,
        refreshing: false,
        loadingMore: false
      })
      wx.stopPullDownRefresh()
    }
  },

  /**
   * 切换筛选Tab
   */
  onTabChange(e) {
    const index = e.detail.index !== undefined ? e.detail.index : e.currentTarget.dataset.index

    this.setData({
      activeTab: index,
      contracts: [],
      page: 1,
      hasMore: true,
      skeletonLoading: true
    })

    this.loadContracts(true)
  },

  /**
   * 跳转到合同详情页
   */
  goToContractDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/contract-detail/index?id=${id}`
    })
  },

  /**
   * 获取当前空状态配置
   */
  getEmptyConfig() {
    return EMPTY_CONFIG[this.data.tabs[this.data.activeTab].name] || EMPTY_CONFIG['all']
  },

  /**
   * 获取状态标签类型（用于兼容性）
   */
  getStatusTagType(status) {
    const statusMap = {
      1: 'warning',
      2: 'primary',
      3: 'success',
      4: 'danger',
      5: 'default'
    }
    return statusMap[status] || 'default'
  },

  /**
   * 获取状态文本（用于兼容性）
   */
  getStatusText(status) {
    return CONTRACT_STATUS_TEXT[status] || '未知状态'
  }
})
