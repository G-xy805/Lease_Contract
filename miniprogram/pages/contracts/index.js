// pages/contracts/index.js
const app = getApp()
const { CONTRACT_STATUS, CONTRACT_STATUS_TEXT, CONTRACT_STATUS_COLOR } = require('../../utils/constants')

// Tab空状态文案配置
const EMPTY_CONFIG = {
  all: { text: '暂无合同', subText: '点击下方按钮创建您的第一份合同' },
  pending: { text: '暂无待签署的合同', subText: '所有合同都已签署完毕' },
  pending_lessor: { text: '暂无待甲方签署的合同', subText: '' },
  pending_lessee: { text: '暂无待乙方签署的合同', subText: '' },
  signed: { text: '暂无已签署的合同', subText: '已签署的合同将显示在这里' },
  expired: { text: '暂无已终止的合同', subText: '已过期、已取消或已拒绝的合同' }
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
    searchValue: '',
    activeTab: 0,
    activeTabKey: 'all',
    scrollTop: 0,
    tabs: [
      { title: '全部', name: 'all', statuses: null },
      { title: '待签署', name: 'pending', statuses: [CONTRACT_STATUS.PENDING_LESSOR_SIGN, CONTRACT_STATUS.PENDING_LESSEE_SIGN] },
      { title: '待甲方签署', name: 'pending_lessor', statuses: CONTRACT_STATUS.PENDING_LESSOR_SIGN },
      { title: '待乙方签署', name: 'pending_lessee', statuses: CONTRACT_STATUS.PENDING_LESSEE_SIGN },
      { title: '已签署', name: 'signed', statuses: CONTRACT_STATUS.SIGNED },
      { title: '已过期', name: 'expired', statuses: [CONTRACT_STATUS.REJECTED, CONTRACT_STATUS.CANCELLED, CONTRACT_STATUS.EXPIRED] }
    ]
  },

  onLoad(options) {
    // 恢复上次查看的Tab
    const savedTab = wx.getStorageSync('contracts_last_tab')
    if (savedTab !== '') {
      const tabIndex = this.data.tabs.findIndex(tab => tab.name === savedTab)
      if (tabIndex !== -1) {
        this.setData({ activeTab: tabIndex, activeTabKey: savedTab })
      }
    }
    if (options.status) {
      const statusIndex = this.data.tabs.findIndex(tab => tab.name === options.status)
      if (statusIndex !== -1) {
        this.setData({ activeTab: statusIndex, activeTabKey: options.status })
      }
    }
    this.loadContracts(true)
  },

  onShow() {
    // 检查是否有合同被编辑更新
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

  // 记录滚动位置
  onScroll(e) {
    this.scrollY = e.detail.scrollTop
  },

  loadContracts(isRefresh = false, isLoadMore = false) {
    const { page, pageSize, searchValue, activeTab, tabs } = this.data

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
      pageSize: pageSize
    }

    if (currentTab && currentTab.statuses !== null) {
      if (Array.isArray(currentTab.statuses)) {
        params.status = currentTab.statuses.join(',')
      } else {
        params.status = currentTab.statuses
      }
    }

    if (searchValue) {
      params.keyword = searchValue
    }

    wx.request({
      url: `${app.globalData.baseUrl}/api/contracts/landlord`,
      method: 'GET',
      data: params,
      header: {
        'Authorization': `Bearer ${app.globalData.token || wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 200) {
          const result = res.data.data?.list || []
          const total = res.data.data?.total || 0

          this.setData({
            contracts: isRefresh || isLoadMore ? result : [...this.data.contracts, ...result],
            hasMore: result.length >= pageSize && (isRefresh || isLoadMore ? result.length < total : this.data.contracts.length < total),
            page: isRefresh || isLoadMore ? 2 : this.data.page + 1,
            skeletonLoading: false
          })
        } else {
          wx.showToast({
            title: res.data.message || '获取合同列表失败',
            icon: 'none'
          })
          this.setData({ skeletonLoading: false })
        }
      },
      fail: (err) => {
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
      },
      complete: () => {
        this.setData({
          loading: false,
          refreshing: false,
          loadingMore: false
        })
        wx.stopPullDownRefresh()
      }
    })
  },

  onTabChange(e) {
    const index = e.detail.index !== undefined ? e.detail.index : e.currentTarget.dataset.index
    const tab = this.data.tabs[index]

    // 记录当前滚动位置
    if (this.scrollY !== undefined) {
      this.setData({ scrollTop: this.scrollY })
    }

    this.setData({
      activeTab: index,
      activeTabKey: tab.name,
      contracts: [],
      page: 1,
      hasMore: true
    })

    // 记住用户查看的Tab
    wx.setStorageSync('contracts_last_tab', tab.name)

    // 显示微loading
    this.setData({ skeletonLoading: true })
    this.loadContracts(true)
  },

  onSearchChange(e) {
    this.setData({ searchValue: e.detail })
  },

  onSearch(e) {
    const { value } = e.detail
    this.setData({
      searchValue: value,
      contracts: [],
      page: 1,
      hasMore: true
    })
    this.loadContracts(true)
  },

  onSearchClear() {
    this.setData({
      searchValue: '',
      contracts: [],
      page: 1,
      hasMore: true
    })
    this.loadContracts(true)
  },

  goToContractDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/contract-detail/index?id=${id}`
    })
  },

  onSignContract(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认签署',
      content: '确定要签署此合同吗？签署后乙方将收到签署通知。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/sign-contract/index?contractId=${id}&isPartyA=true`
          })
        }
      }
    })
  },

  // 左滑操作 - 编辑合同
  onEditContract(e) {
    const { id } = e.currentTarget.dataset
    // 跳转到创建合同页面并加载数据
    wx.navigateTo({
      url: `/pages/create-contract/index?id=${id}`
    })
  },

  // 左滑操作 - 删除合同
  onDeleteContract(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定删除该合同吗？删除后不可恢复',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          this.doDeleteContract(id)
        }
      }
    })
  },

  doDeleteContract(id) {
    wx.request({
      url: `${app.globalData.baseUrl}/api/contracts/${id}`,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${app.globalData.token || wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          // 从列表中移除
          const contracts = this.data.contracts.filter(c => c.id !== id)
          this.setData({ contracts })
        } else {
          wx.showToast({
            title: res.data.message || '删除失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      }
    })
  },

  goToCreateContract() {
    wx.navigateTo({
      url: '/pages/create-contract/index'
    })
  },

  getEmptyConfig() {
    return EMPTY_CONFIG[this.data.activeTabKey] || EMPTY_CONFIG['all']
  },

  getStatusTagType(status) {
    return CONTRACT_STATUS_COLOR[status] || 'default'
  },

  getStatusText(status) {
    return CONTRACT_STATUS_TEXT[status] || '未知状态'
  }
})
