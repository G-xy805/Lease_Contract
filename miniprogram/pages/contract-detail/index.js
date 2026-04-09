// pages/contract-detail/index.js
const app = getApp();
const api = require('../../services/api');
const {
  maskPhone,
  maskIdCard,
  deserializeFeeItems,
  deserializeInventoryItems
} = require('../../utils/helpers');
const { CONTRACT_STATUS_TEXT, PaymentMethodText } = require('../../utils/constants');

function sanitizeHtmlForRichText(html) {
  if (!html) return '';
  return html
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/class="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
    .replace(/\s+>/g, '>')
    .trim();
}

function parseHtmlToLines(html) {
  if (!html) return [];

  let text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/class="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  const lines = [];

  const sectionRegex = /(<h[12][^>]*>|class="(?:article-title|table-title)[^"]*"[^>]*>)/gi;
  const parts = text.split(sectionRegex);

  let currentSection = '';
  let sectionContent = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (/<h[12][^>]*>|class="(?:article-title|table-title)[^"]*"/i.test(part)) {
      if (currentSection || sectionContent.length > 0) {
        flushSection(currentSection, sectionContent, lines);
      }
      currentSection = part.replace(/<[^>]+>/g, '').trim();
      sectionContent = [];
    } else {
      const cleaned = part
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/^\s+|\s+$/g, '');

      if (cleaned) {
        sectionContent.push(cleaned);
      }
    }
  }

  if (currentSection || sectionContent.length > 0) {
    flushSection(currentSection, sectionContent, lines);
  }

  const result = [];
  let lastLine = null;
  for (const line of lines) {
    const content = line.content.replace(/\s+/g, ' ').trim();
    if (!content) continue;

    if (lastLine && lastLine.type === line.type && line.type === 'paragraph') {
      lastLine.content += ' ' + content;
    } else {
      result.push({ type: line.type, content });
      lastLine = line;
    }
  }

  return result;
}

function flushSection(title, contentParts, lines) {
  const fullContent = contentParts.join(' ').replace(/\s+/g, ' ').trim();

  if (!title && !fullContent) return;

  const isMainTitle = title.includes('租赁合同') || title.includes('合同');

  if (title) {
    lines.push({
      type: isMainTitle ? 'title' : 'section',
      content: title
    });
  }

  if (!fullContent) return;

  const paragraphs = splitIntoParagraphs(fullContent);
  paragraphs.forEach(p => {
    if (p.trim()) {
      lines.push({ type: 'paragraph', content: p.trim() });
    }
  });
}

function splitIntoParagraphs(text) {
  const result = [];
  const sentences = text.split(/(?<=[。！？；])/);

  let current = '';
  for (const s of sentences) {
    if (current.length + s.length > 200) {
      if (current.trim()) result.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) result.push(current.trim());

  return result;
}

function splitLongParagraph(text) {
  const maxLen = 150;
  const sentences = text.split(/([。！？；])/);
  const result = [];
  let current = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (current.length + sentence.length <= maxLen) {
      current += sentence;
    } else {
      if (current.trim()) {
        result.push(current.trim());
      }
      current = sentence;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

Page({
  data: {
    contractId: '',
    contractInfo: null,
    loading: false,
    // 操作按钮数组（动态生成）
    buttons: [],
    // 签名数据（从signatures数组获取）
    lessorSignature: null,
    lesseeSignature: null,
    partyASigned: false,
    partyBSigned: false,
    // 分享相关
    inviteCode: '',
    showShareModal: false,
    shareQrCode: '',
    shareUrl: '',
    qrCode: '',
    // 展示模式
    displayMode: 'overview',
    hasFullContent: false,
    // 分组折叠状态
    expandedSections: {
      partyInfo: true,
      houseInfo: true,
      leaseInfo: true,
      paymentInfo: true,
      feeInfo: false,
      intermediaryInfo: false,
      remarkInfo: false
    }
  },

  onLoad(options) {
    const contractId = options.id || options.contractId;
    if (contractId) {
      this.setData({ contractId });
      this.loadContractInfo(contractId);
    }
  },

  onShow() {
    if (this.data.contractId) {
      this.loadContractInfo(this.data.contractId);
    }
  },

  onShareAppMessage() {
    const { contractInfo, inviteCode } = this.data;
    if (contractInfo) {
      return {
        title: `房屋租赁合同 - ${contractInfo.title}`,
        path: `/pages/verify-invite/index?code=${inviteCode}`,
        imageUrl: ''
      };
    }
  },

  onShareTimeline() {
    const { contractInfo, inviteCode } = this.data;
    if (contractInfo) {
      return {
        title: `房屋租赁合同 - ${contractInfo.title}`,
        query: `code=${inviteCode}`
      };
    }
  },

  /**
   * ⭐⭐⭐ 核心变更：完全重写transformContractData方法
   * 从signatures数组获取签署状态，替代原来的partyA/B_sign_status字段
   *
   * @param {Object} rawContract - 原始合同数据（来自API响应）
   * @returns {Object|null} 转换后的合同展示数据
   */
  transformContractData(rawContract) {
    if (!rawContract) return null;

    // ⭐ 核心变更：从 signatures 数组获取签署状态和签名信息
    const signatures = rawContract.signatures || [];
    const lessorSignature = signatures.find(s => s.sign_role === 'LESSOR');
    const lesseeSignature = signatures.find(s => s.sign_role === 'LESSEE');

    const partyASigned = lessorSignature ? lessorSignature.sign_status === 1 : false;
    const partyBSigned = lesseeSignature ? lesseeSignature.sign_status === 1 : false;

    /**
     * ⭐ 日期字段组合工具函数
     * 从 year/month/day 拆分字段组合为可读字符串
     */
    const formatDateFields = (contract) => {
      const {
        lease_start_year,
        lease_start_month,
        lease_start_day,
        lease_end_year,
        lease_end_month,
        lease_end_day
      } = contract;

      return {
        leaseStart:
          lease_start_year && lease_start_month && lease_start_day
            ? `${lease_start_year}年${lease_start_month}月${lease_start_day}日`
            : '未设置',
        leaseEnd:
          lease_end_year && lease_end_month && lease_end_day
            ? `${lease_end_year}年${lease_end_month}月${lease_end_day}日`
            : '未设置'
      };
    };

    const dates = formatDateFields(rawContract);

    const rawContent = rawContract.rendered_content ||
      rawContract.content ||
      rawContract.template_content ||
      rawContract.full_text ||
      '';

    return {
      // ===== 基本信息 =====
      id: rawContract.id,
      contractNo: rawContract.contract_no,
      title: rawContract.title || '房屋租赁合同',
      status: rawContract.status,
      statusText: CONTRACT_STATUS_TEXT[rawContract.status] || '未知',
      createdAt: rawContract.created_at ? rawContract.created_at.split('T')[0] : '',
      effectiveAt: rawContract.effective_at,
      expiresAt: rawContract.expires_at,

      // ⭐ 签署状态（来自signatures数组，非partyA_sign_status字段）
      partyASigned,
      partyBSigned,
      lessorSignature,
      lesseeSignature,

      // ===== 甲乙双方信息（带脱敏处理）=====
      partyA: {
        company: rawContract.partyA_company,
        phone: maskPhone(rawContract.partyA_phone),
        contact: rawContract.partyA_contact,
        phone2: rawContract.partyA_phone2
          ? maskPhone(rawContract.partyA_phone2)
          : null,
        account: rawContract.partyA_account,
        idcard: rawContract.partyA_idcard
          ? maskIdCard(rawContract.partyA_idcard)
          : null,
        // 甲方委托代理人信息
        agent: {
          name: rawContract.partyA_agent_name,
          phone: rawContract.partyA_agent_phone
            ? maskPhone(rawContract.partyA_agent_phone)
            : null,
          idCard: rawContract.partyA_agent_idcard
            ? maskIdCard(rawContract.partyA_agent_idcard)
            : null
        }
      },

      partyB: {
        name: rawContract.partyB_name,
        idCard: rawContract.partyB_idCard
          ? maskIdCard(rawContract.partyB_idCard)
          : null,
        phone: maskPhone(rawContract.partyB_phone),
        contact: rawContract.partyB_contact
      },

      // ===== 房屋信息 =====
      house: {
        address: rawContract.house_address,
        area: rawContract.house_area
      },

      // ⭐ 租赁期限（组合显示）
      leasePeriod: {
        start: dates.leaseStart,
        end: dates.leaseEnd,
        months: rawContract.lease_months,
        purpose: rawContract.rent_purpose,
        advanceNoticeDays: rawContract.advance_notice_days
      },

      // ===== 租金信息 =====
      rent: {
        monthly: rawContract.monthly_rent,
        yearly: rawContract.year_rent,
        paymentMethod:
          PaymentMethodText[rawContract.payment_method] || '未知',
        paymentCount: rawContract.payment_count,
        amounts: {
          first: rawContract.first_payment_amount,
          second: rawContract.second_payment_amount,
          third: rawContract.third_payment_amount,
          fourth: rawContract.fourth_payment_amount
        },
        account: rawContract.partyA_account_for_rent
      },

      // ===== 押金 =====
      deposit: {
        amount: rawContract.deposit,
        chinese: rawContract.deposit_chinese
      },

      // ⭐ 费用约定（JSON反序列化）
      feeItems: deserializeFeeItems(rawContract.fee_items),

      // ===== 居间服务 =====
      intermediary: {
        name: rawContract.intermediary_name,
        commissionA: rawContract.partyA_commission,
        commissionB: rawContract.partyB_commission
      },

      // ⭐ 物品清单（JSON反序列化）
      inventoryItems: deserializeInventoryItems(
        rawContract.inventory_items
      ),

      // ===== 水电表 =====
      meters: {
        electricity: rawContract.electricity_meter,
        water: rawContract.water_meter,
        gas: rawContract.gas_meter
      },

      // ===== 备注 =====
      remark: rawContract.remark,

      // ===== PDF路径 =====
      pdfPath: rawContract.contract_pdf_path,

      // ===== 邀请码 =====
      inviteCode: rawContract.invite_code || '',

      content: sanitizeHtmlForRichText(rawContent),
      contentLines: parseHtmlToLines(rawContent)
    };
  },

  async loadContractInfo(id) {
    this.setData({ loading: true });

    try {
      const userInfo = app.globalData.userInfo;
      const userRole = userInfo?.role;

      const contractRes = await api.getContractDetail(id);
      const rawContract = contractRes?.data?.contract;
      const contractInfo = this.transformContractData(rawContract);

      if (contractInfo) {
        // ⭐ 调用新的按钮权限控制方法（返回buttons数组）
        const buttons = this.getButtonsByStatus(
          contractInfo.status,
          userRole,
          contractInfo.partyASigned,
          contractInfo.partyBSigned
        );

        this.setData({
          contractInfo,
          loading: false,
          buttons,
          inviteCode: contractInfo.inviteCode || '',
          displayMode: this.data.displayMode || 'overview',
          hasFullContent:
            !!(contractInfo.content && contractInfo.content.trim().length > 10)
        });
      } else {
        this.setData({ contractInfo: null, loading: false });
      }
    } catch (err) {
      console.error('加载合同详情失败', err);
      this.setData({ contractInfo: null, loading: false });
    }
  },

  /**
   * ⭐⭐⭐ 完全重写的按钮权限控制方法
   * 返回标准化的按钮配置数组（替代原来的多个showXxxBtn布尔值）
   *
   * @param {number} status - 合同状态码 (1-6)
   * @param {string} userRole - 用户角色 ('LESSOR' | 'LESSEE' | 'ADMIN' | null)
   * @param {boolean} partyASigned - 甲方是否已签署
   * @param {boolean} partyBSigned - 乙方是否已签署
   * @returns {Array<Object>} 按钮配置数组 [{text, type, action}]
   */
  getButtonsByStatus(status, userRole, partyASigned, partyBSigned) {
    const buttons = [];

    switch (status) {
      case 1: // 待甲方签
        if (userRole === 'LESSOR' || userRole === 'ADMIN') {
          buttons.push({ text: '签署', type: 'primary', action: 'sign' });
          buttons.push({ text: '编辑', type: 'default', action: 'edit' });
          buttons.push({ text: '删除', type: 'danger', action: 'delete' });
        }
        break;

      case 2: // 待乙方签
        if (userRole === 'LESSOR' || userRole === 'ADMIN') {
          buttons.push({
            text: '分享邀请',
            type: 'primary',
            action: 'share'
          });
          buttons.push({
            text: '取消合同',
            type: 'warning',
            action: 'cancel'
          });
        }
        if (userRole === 'LESSEE' || userRole === 'ADMIN') {
          buttons.push({ text: '签署', type: 'primary', action: 'sign' });
          buttons.push({
            text: '拒绝',
            type: 'danger',
            action: 'reject'
          });
        }
        break;

      case 3: // 已签署
        buttons.push({
          text: '下载PDF',
          type: 'default',
          action: 'downloadPdf'
        });
        break;

      case 4: // 已拒绝
        // 无操作按钮（只读展示）
        if (userRole === 'ADMIN') {
          buttons.push({ text: '删除', type: 'danger', action: 'delete' });
        }
        break;

      case 5: // 已取消
        if (userRole === 'ADMIN' || this.isCreator()) {
          buttons.push({ text: '删除', type: 'danger', action: 'delete' });
        }
        break;

      case 6: // 已到期
        buttons.push({
          text: '下载PDF',
          type: 'default',
          action: 'downloadPdf'
        });
        break;
    }

    return buttons;
  },

  /**
   * 判断当前用户是否是合同创建者
   */
  isCreator() {
    // TODO: 根据实际业务逻辑实现
    return false;
  },

  // ==================== 操作按钮统一处理 ====================

  /**
   * ⭐ 统一的操作按钮点击处理
   * 根据 action 类型分发到具体方法
   */
  onActionTap(e) {
    const { action } = e.currentTarget.dataset;

    switch (action) {
      case 'sign':
        this.onSign();
        break;
      case 'edit':
        this.onEditContract();
        break;
      case 'delete':
        this.onDeleteContract();
        break;
      case 'share':
        this.onGenerateShare();
        break;
      case 'cancel':
        this.onCancelContract();
        break;
      case 'reject':
        this.onRejectContract();
        break;
      case 'downloadPdf':
        this.onDownloadPdf();
        break;
      default:
        console.warn('未知操作类型:', action);
    }
  },

  // ==================== 签署操作 ====================

  /**
   * ⭐⭐⭐ 核心变更：onSign() 方法重写
   * 传递 signRole='LESSOR'|'LESSEE' 参数（替代 isPartyA 布尔值）
   */
  onSign() {
    const userRole = app.globalData.userInfo?.role;
    const contractInfo = this.data.contractInfo;

    // ⭐ 确定当前用户的签署角色
    let signRole;
    if (userRole === 'LESSOR' || userRole === 'ADMIN') {
      // 管理员或房东，如果甲方未签则作为甲方签署
      signRole = !contractInfo.partyASigned ? 'LESSOR' : null;
    } else if (userRole === 'LESSEE') {
      // 租客作为乙方签署
      signRole = 'LESSEE';
    }

    if (!signRole) {
      wx.showToast({ title: '您不是本次签署方', icon: 'none' });
      return;
    }

    // ⭐ 传递 signRole 参数（替代原来的 isPartyA）
    wx.navigateTo({
      url: `/pages/sign-contract/index?contractId=${contractInfo.id}&signRole=${signRole}`
    });
  },

  // ==================== 编辑操作 ====================

  onEditContract() {
    const contractId = this.data.contractInfo?.id;
    if (!contractId) {
      wx.showToast({ title: '合同ID不存在', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/create-contract/index?contractId=${contractId}`
    });
  },

  // ==================== 删除操作 ====================

  onDeleteContract() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此合同吗？删除后不可恢复。',
      confirmColor: '#ee0a24',
      success: async res => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          try {
            await api.deleteContract(this.data.contractId);
            wx.hideLoading();
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => {
              wx.redirectTo({ url: '/pages/contracts/index' });
            }, 1500);
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ==================== 生成分享操作 ====================

  onGenerateShare() {
    const { contractId } = this.data;
    wx.showLoading({ title: '生成中...' });
    api
      .shareContract(contractId)
      .then(res => {
        wx.hideLoading();
        if (res.code === 200 || res.data) {
          const inviteCode =
            res.data?.invite_code || res.invite_code || '';
          const shareUrl = res.data?.share_url || res.share_url || '';
          const qrCode = res.data?.qr_code || res.qr_code || '';
          this.setData({
            showShareModal: true,
            inviteCode,
            shareUrl,
            qrCode,
            shareQrCode: qrCode
          });
        } else {
          wx.showToast({
            title: res.message || '生成分享链接失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('生成分享链接失败', err);
        wx.showToast({ title: '生成分享链接失败', icon: 'none' });
      });
  },

  onCloseShareModal() {
    this.setData({ showShareModal: false });
  },

  onCopyInviteCode() {
    const inviteCode = this.data.inviteCode;
    wx.setClipboardData({
      data: inviteCode,
      success: () => {
        wx.showToast({ title: '已复制邀请码', icon: 'success' });
      }
    });
  },

  async onSaveQrCode() {
    const { shareQrCode } = this.data;
    if (!shareQrCode) {
      wx.showToast({ title: '暂无二维码', icon: 'none' });
      return;
    }

    wx.downloadFile({
      url: shareQrCode,
      success: res => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '已保存', icon: 'success' });
            },
            fail: () => {
              wx.showToast({ title: '保存失败', icon: 'none' });
            }
          });
        }
      },
      fail: () => {
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  },

  onShareToChat() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    wx.showToast({ title: '点击右上角分享', icon: 'none' });
  },

  // ==================== 取消操作 ====================

  onCancelContract() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消此合同吗？取消后合同将无法恢复。',
      confirmColor: '#ee0a24',
      success: async res => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' });
          try {
            await api.cancelContract(this.data.contractId);
            wx.hideLoading();
            wx.showToast({ title: '已取消', icon: 'success' });
            setTimeout(() => {
              this.loadContractInfo(this.data.contractId);
            }, 1500);
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '取消失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ==================== 拒绝操作 ====================

  onRejectContract() {
    wx.showModal({
      title: '拒绝签署',
      message: '请输入拒绝原因（选填）',
      editable: true,
      placeholderText: '请输入拒绝原因',
      confirmColor: '#07c160',
      success: async res => {
        if (res.confirm) {
          const reason = res.content?.trim() || '';
          wx.showLoading({ title: '提交中...' });
          try {
            await api.rejectContract(this.data.contractId, reason);
            wx.hideLoading();
            wx.showToast({ title: '已拒绝', icon: 'success' });
            setTimeout(() => {
              this.loadContractInfo(this.data.contractId);
            }, 1500);
          } catch (err) {
            wx.hideLoading();
            wx.showToast({ title: '提交失败', icon: 'none' });
          }
        }
      }
    });
  },

  // ==================== 下载PDF操作 ====================

  async onDownloadPdf() {
    const contractId = this.data.contractInfo?.id;
    if (!contractId) {
      wx.showToast({ title: '合同ID不存在', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在生成PDF...' });

    try {
      const tempFilePath = await api.downloadContractPdf(contractId);

      wx.hideLoading();

      wx.openDocument({
        filePath: tempFilePath,
        fileType: 'pdf',
        success: () => {
          console.log('打开PDF成功');
        },
        fail: err => {
          console.error('打开PDF失败:', err);
          wx.showToast({ title: '打开失败，请重试', icon: 'none' });
        }
      });
    } catch (err) {
      wx.hideLoading();
      console.error('下载PDF失败:', err);
      wx.showToast({ title: err.message || '下载失败', icon: 'none' });
    }
  },

  // ==================== 其他操作 ====================

  onCopyCode() {
    const verifyCode = this.data.contractInfo?.contractNo;
    wx.setClipboardData({
      data: verifyCode,
      success: () => {
        wx.showToast({ title: '合同编号已复制', icon: 'success' });
      }
    });
  },

  // ==================== 展示模式切换 ====================

  switchToOverview() {
    this.setData({ displayMode: 'overview' });
  },

  switchToFull() {
    this.setData({ displayMode: 'full' });
  },

  toggleSection(e) {
    const { section } = e.currentTarget.dataset;
    this.setData({
      [`expandedSections.${section}`]: !this.data.expandedSections[section]
    });
  }
});
