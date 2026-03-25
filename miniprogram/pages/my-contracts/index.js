// pages/my-contracts/index.js
const app = getApp()

const STATUS_MAP = {
  1: { text: '待甲方签署', color: 'warning' },
  2: { text: '待乙方签署', color: 'primary' },
  3: { text: '已签署', color: 'success' },
  4: { text: '已拒绝', color: 'danger' },
  5: { text: '已取消', color: 'default' },
  6: { text: '已到期', color: 'default' }
}

Page({
  data: {
    contracts: [],
    loading: false,
    refreshing: false,
    loadingMore: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    searchValue: '',
    activeTab: 0,
    tabs: [
      { name: '待甲方签署', status: 1 },
      { name: '待乙方签署', status: 2 },
      { name: '已签署', status: 3 }
    ],
    STATUS_MAP: STATUS_MAP
  },

  onLoad(options) {
    if (options.status) {
      const statusIndex = this.data.tabs.findIndex(tab => tab.status === parseInt(options.status))
      if (statusIndex !== -1) {
        this.setData({ activeTab: statusIndex })
      }
    }
    this.loadContracts(true)
  },

  onShow() {},

  onPullDownRefresh() {
    this.loadContracts(true)
  },

  onReachBottom() {
    if (!this.data.loadingMore && this.data.hasMore) {
      this.loadContracts(false, true)
    }
  },

  loadContracts(isRefresh = false, isLoadMore = false) {
    const { page, pageSize, searchValue, activeTab, tabs } = this.data

    if (isRefresh) {
      this.setData({ refreshing: true, page: 1, hasMore: true })
    } else if (isLoadMore) {
      this.setData({ loadingMore: true })
    } else {
      this.setData({ loading: true })
    }

    const params = {
      page: isRefresh || isLoadMore ? 1 : page,
      pageSize: pageSize
    }

    const currentTab = tabs[activeTab]
    if (currentTab && currentTab.status) {
      params.status = currentTab.status
    }

    if (searchValue) {
      params.keyword = searchValue
    }

    wx.request({
      url: `${app.globalData.baseUrl}/api/contracts/tenant`,
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
            hasMore: result.length >= pageSize && this.data.contracts.length < total,
            page: isRefresh || isLoadMore ? 2 : this.data.page + 1
          })
        } else {
          wx.showToast({
            title: res.data.message || '获取合同列表失败',
            icon: 'none'
          })
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
          hasMore: false
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
    this.setData({
      activeTab: index,
      contracts: [],
      page: 1,
      hasMore: true
    })
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
      content: '确定要签署此合同吗？签署后合同将正式生效。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/sign-contract/index?contractId=${id}&isPartyA=false`
          })
        }
      }
    })
  },

  onRejectContract(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝签署此合同吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/api/contracts/${id}/reject`,
            method: 'POST',
            data: { reason: '乙方拒绝签署' },
            header: {
              'Authorization': `Bearer ${app.globalData.token || wx.getStorageSync('token')}`,
              'Content-Type': 'application/json'
            },
            success: (res) => {
              if (res.data.code === 200) {
                wx.showToast({
                  title: '已拒绝签署',
                  icon: 'success'
                })
                this.loadContracts(true)
              } else {
                wx.showToast({
                  title: res.data.message || '操作失败',
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
        }
      }
    })
  },

  getStatusTagType(status) {
    return STATUS_MAP[status]?.color || 'default'
  },

  getStatusText(status) {
    return STATUS_MAP[status]?.text || '未知'
  }
})