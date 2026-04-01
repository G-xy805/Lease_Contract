// pages/my-contracts/index.js
const app = getApp()
const api = require('../../services/api')
const { CONTRACT_STATUS, CONTRACT_STATUS_TEXT, CONTRACT_STATUS_COLOR } = require('../../utils/constants')

// Tab空状态文案配置
const EMPTY_CONFIG = {
  all: { text: '暂无合同', subText: '您还没有任何合同' },
  pending: { text: '暂无待签署的合同', subText: '待您签署的合同将显示在这里' },
  signed: { text: '暂无已签署的合同', subText: '已签署的合同将显示在这里' },
  rejected: { text: '暂无已拒绝/已取消的合同', subText: '已拒绝或已取消的合同' }
}

Page({
  data: {
    contracts: [],
    loading: false,
    refreshing: false,
    loadingMore: false,
    skeletonLoading: true,
    page: 1,
    pageSize: 10,
    hasMore: true,
    activeTab: 0,
    tabs: [
      { title: '全部', name: 'all', statuses: null },
      { title: '待签署', name: 'pending', statuses: [CONTRACT_STATUS.PENDING_LESSOR_SIGN, CONTRACT_STATUS.PENDING_LESSEE_SIGN] },
      { title: '已签署', name: 'signed', statuses: CONTRACT_STATUS.SIGNED },
      { title: '已拒绝/取消', name: 'rejected', statuses: [CONTRACT_STATUS.REJECTED, CONTRACT_STATUS.CANCELLED] }
    ]
  },

  onLoad(options) {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/login/login' })
      }, 1500)
      return
    }
    this.loadContracts(true)
  },

  onShow() {
    // 检查是否有合同被签署/更新
    const updatedContract = wx.getStorageSync('contract_updated')
    if (updatedContract && this.data.contracts.length > 0) {
      wx.removeStorageSync('contract_updated')
      const index = this.data.contracts.findIndex(c => c.id === updatedContract.id)
      if (index !== -1) {
        const contracts = [...this.data.contracts]
        contracts[index] = { ...contracts[index], ...updatedContract }
        this.setData({ contracts })
      }
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

  loadContracts(isRefresh = false, isLoadMore = false) {
    const { page, pageSize, activeTab, tabs } = this.data

    if (isRefresh) {
      this.setData({ refreshing: true, page: 1, hasMore: true })
    } else if (isLoadMore) {
      this.setData({ loadingMore: true })
    } else {
      this.setData({ loading: true, skeletonLoading: true })
    }

    const requestPage = isRefresh || isLoadMore ? 1 : page
    const currentTab = tabs[activeTab]

    const params = {
      page: requestPage,
      page_size: pageSize
    }

    if (currentTab && currentTab.statuses !== null) {
      if (Array.isArray(currentTab.statuses)) {
        params.status = currentTab.statuses.join(',')
      } else {
        params.status = currentTab.statuses
      }
    }

    const isLessor = app.isLessor()
    const contractApi = isLessor ? api.getLandlordContracts : api.getTenantContracts

    contractApi(params).then(res => {
      if (res.code === 200) {
        const result = res.data?.list || []
        const total = res.data?.total || 0

        const transformContract = (item) => ({
          id: item.id,
          title: item.title || '房屋租赁合同',
          status: item.status,
          statusText: this.getStatusText(item.status),
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
          partyB_sign_status: item.partyB_sign_status || 0,
        })

        const transformedList = result.map(transformContract)

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
    }).catch(err => {
      console.error('获取合同列表失败', err)
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      })
      this.setData({
        contracts: [],
        hasMore: false,
        skeletonLoading: false
      })
    }).finally(() => {
      this.setData({
        loading: false,
        refreshing: false,
        loadingMore: false
      })
      wx.stopPullDownRefresh()
    })
  },

  onTabChange(e) {
    const index = e.detail.index !== undefined ? e.detail.index : e.currentTarget.dataset.index
    const tab = this.data.tabs[index]

    this.setData({
      activeTab: index,
      contracts: [],
      page: 1,
      hasMore: true
    })

    this.setData({ skeletonLoading: true })
    this.loadContracts(true)
  },

  goToContractDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/contract-detail/index?id=${id}`
    })
  },

  getEmptyConfig() {
    return EMPTY_CONFIG[this.data.tabs[this.data.activeTab].name] || EMPTY_CONFIG['all']
  },

  getStatusTagType(status) {
    return CONTRACT_STATUS_COLOR[status] || 'default'
  },

  getStatusText(status) {
    return CONTRACT_STATUS_TEXT[status] || '未知状态'
  }
})