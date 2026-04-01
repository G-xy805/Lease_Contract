import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import puppeteer from 'puppeteer';
import { inventoryJsonToTemplateData, INVENTORY_MAPPINGS } from '../config/inventoryMapping';

const CHROMIUM_PATH = path.join(__dirname, '..', '..', 'node_modules', 'html-pdf-node', 'node_modules', 'puppeteer', '.local-chromium', 'win64-901912', 'chrome-win', 'chrome.exe');

export interface PartyInfo {
  name: string;
  company?: string;
  contact: string;
  phone: string;
  address: string;
  idCard?: string;
  account?: string;
}

export interface PropertyInfo {
  address: string;
  area: string;
  roomType: string;
  orientation?: string;
}

export interface RentInfo {
  amount: number;
  paymentCycle: string;
  deposit: number;
  paymentDate: string;
  purpose?: string;
  paymentCount?: number;
  firstPaymentAmount?: number;
  secondPaymentAmount?: number;
  secondPaymentDate?: string;
  thirdPaymentAmount?: number;
  fourthPaymentAmount?: number;
}

export interface DurationInfo {
  startDate: string;
  endDate: string;
  totalMonths: number;
}

export interface ContractData {
  id: string;
  contractNumber: string;
  title: string;
  partyA: PartyInfo;
  partyB: PartyInfo;
  property: PropertyInfo;
  rent: RentInfo;
  duration: DurationInfo;
  terms: string[];
  createdAt: string;
  advanceNoticeDays?: number;
  paymentTimes?: number;
  firstPaymentAmount?: number;
  firstPaymentDate?: string;
  secondPaymentAmount?: number;
  secondPaymentDate?: string;
  thirdPaymentAmount?: number;
  thirdPaymentDate?: string;
  fourthPaymentAmount?: number;
  items?: Array<{ name: string; quantity?: string; unit?: string }>;
  electricityMeter?: string;
  waterMeter?: string;
  gasMeter?: string;
  remark?: string;
  lessorAccount?: string;
  lessorIdcard?: string;
  intermediaryName?: string;
  partyACommission?: number;
  partyBCommission?: number;
  depositChinese?: string;
  paymentMethod?: number;
  paymentCycle?: string;
  partyBSignature?: string;
}

export interface PdfResult {
  success: boolean;
  filePath?: string;
  filename?: string;
  error?: string;
}

class HtmlPdfService {
  private outputDir: string;
  private templatePath: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'uploads', 'pdfs');
    this.templatePath = path.join(process.cwd(), '..', 'lease_contract_template.html');
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private loadTemplate(): string {
    try {
      return fs.readFileSync(this.templatePath, 'utf-8');
    } catch (error) {
      console.error('读取HTML模板失败:', error);
      throw new Error('HTML模板文件不存在');
    }
  }

  private fillTemplate(template: string, data: ContractData): string {
    const startDate = new Date(data.duration.startDate);
    const endDate = new Date(data.duration.endDate);

    // 使用 inventoryJsonToTemplateData 将 inventory_items JSON 转为模板数据
    const inventoryTemplateData = inventoryJsonToTemplateData(
      data.items && data.items.length > 0
        ? JSON.stringify(data.items.map(item => ({
            name: item.name,
            quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 0)
          })))
        : null
    );

    const placeholders: Record<string, string> = {
      '{{partyA_company}}': data.partyA.company || data.partyA.name || '',
      '{{partyA_name}}': data.partyA.name || '',
      '{{partyA_contact}}': data.partyA.contact || '',
      '{{partyA_phone}}': data.partyA.phone || '',
      '{{partyA_phone2}}': data.partyA.phone || '',
      '{{partyA_account}}': data.partyA.account || '',
      '{{partyA_idCard}}': data.partyA.idCard || '',

      '{{partyB_name}}': data.partyB.name || data.partyB.contact || '',
      '{{partyB_contact}}': data.partyB.contact || '',
      '{{partyB_phone}}': data.partyB.phone || '',
      '{{partyB_idCard}}': data.partyB.idCard || '',

      '{{house_address}}': data.property.address || '',
      '{{house_area}}': data.property.area || '',

      '{{lease_start_year}}': startDate.getFullYear().toString(),
      '{{lease_start_month}}': (startDate.getMonth() + 1).toString().padStart(2, '0'),
      '{{lease_start_day}}': startDate.getDate().toString().padStart(2, '0'),
      '{{lease_end_year}}': endDate.getFullYear().toString(),
      '{{lease_end_month}}': (endDate.getMonth() + 1).toString().padStart(2, '0'),
      '{{lease_end_day}}': endDate.getDate().toString().padStart(2, '0'),
      '{{lease_months}}': data.duration.totalMonths.toString(),

      '{{rent_purpose}}': data.rent.purpose || '居住使用',

      '{{monthly_rent}}': data.rent.amount.toString(),
      '{{year_rent}}': (data.rent.amount * data.duration.totalMonths).toString(),

      '{{advance_notice_days}}': (data.advanceNoticeDays || 30).toString(),

      '{{payment_count}}': (data.paymentTimes || 1).toString(),
      '{{payment_cycle}}': this.getPaymentCycleText(data.paymentCycle || data.rent.paymentCycle),

      '{{first_payment_amount}}': (data.firstPaymentAmount || data.rent.amount).toString(),
      '{{second_payment_amount}}': (data.secondPaymentAmount || data.rent.amount).toString(),
      '{{second_payment_date}}': data.secondPaymentDate || '',
      '{{third_payment_amount}}': (data.thirdPaymentAmount || 0).toString(),
      '{{fourth_payment_amount}}': (data.fourthPaymentAmount || 0).toString(),

      '{{partyA_commission}}': (data.partyACommission || 0).toString(),
      '{{partyA_commission_chinese}}': this.numberToChinese(data.partyACommission || 0),
      '{{partyB_commission}}': (data.partyBCommission || 0).toString(),
      '{{partyB_commission_chinese}}': this.numberToChinese(data.partyBCommission || 0),

      '{{deposit}}': data.rent.deposit.toString(),
      '{{deposit_chinese}}': data.depositChinese || this.numberToChinese(data.rent.deposit),

      '{{electricity_meter}}': data.electricityMeter !== undefined ? data.electricityMeter : '',
      '{{water_meter}}': data.waterMeter !== undefined ? data.waterMeter : '',
      '{{gas_meter}}': data.gasMeter !== undefined ? data.gasMeter : '',

      '{{remark}}': data.remark || '',

      '{{sign_date}}': data.createdAt || new Date().toLocaleDateString('zh-CN'),
      '{{contract_no}}': data.contractNumber || '',
      '{{partyB_signature}}': data.partyBSignature || '',

      '{{item_tv_qty}}': inventoryTemplateData['item_tv_qty'] || '0',
      '{{item_wardrobe_qty}}': inventoryTemplateData['item_wardrobe_qty'] || '0',
      '{{item_tv_remote_qty}}': inventoryTemplateData['item_tv_remote_qty'] || '0',
      '{{item_tv_table_qty}}': inventoryTemplateData['item_tv_table_qty'] || '0',
      '{{item_box_qty}}': inventoryTemplateData['item_box_qty'] || '0',
      '{{item_sofa_qty}}': inventoryTemplateData['item_sofa_qty'] || '0',
      '{{item_coffee_table_qty}}': inventoryTemplateData['item_coffee_table_qty'] || '0',
      '{{item_dining_table_qty}}': inventoryTemplateData['item_dining_table_qty'] || '0',
      '{{item_chair_qty}}': inventoryTemplateData['item_chair_qty'] || '0',
      '{{item_bed_qty}}': inventoryTemplateData['item_bed_qty'] || '0',
      '{{item_nightstand_qty}}': inventoryTemplateData['item_nightstand_qty'] || '0',
      '{{item_curtain_qty}}': inventoryTemplateData['item_curtain_qty'] || '0',
      '{{item_ac_qty}}': inventoryTemplateData['item_ac_qty'] || '0',
      '{{item_ac_remote_qty}}': inventoryTemplateData['item_ac_remote_qty'] || '0',
      '{{item_fridge_qty}}': inventoryTemplateData['item_fridge_qty'] || '0',
      '{{item_mattress_qty}}': inventoryTemplateData['item_mattress_qty'] || '0',
      '{{item_washer_qty}}': inventoryTemplateData['item_washer_qty'] || '0',
      '{{item_water_heater_qty}}': inventoryTemplateData['item_water_heater_qty'] || '0',
      '{{item_gas_stove_qty}}': inventoryTemplateData['item_gas_stove_qty'] || '0',
      '{{item_hood_qty}}': inventoryTemplateData['item_hood_qty'] || '0',
      '{{item_induction_qty}}': inventoryTemplateData['item_induction_qty'] || '0',
      '{{item_door_card_qty}}': inventoryTemplateData['item_door_card_qty'] || '0',
      '{{item_water_card_qty}}': inventoryTemplateData['item_water_card_qty'] || '0',
      '{{item_power_card_qty}}': inventoryTemplateData['item_power_card_qty'] || '0',
    };

    let result = template;
    for (const [placeholder, value] of Object.entries(placeholders)) {
      result = result.split(placeholder).join(value);
    }

    result = result.replace(/\{\{[^}]+\}\}/g, '');

    return result;
  }

  private getPaymentCycleText(paymentCycle: string | number): string {
    const cycleMap: Record<string, string> = {
      '1': '月付',
      '2': '季付',
      '3': '半年付',
      '4': '年付',
      'month': '月付',
      'quarter': '季付',
      'half_year': '半年付',
      'year': '年付'
    };
    return cycleMap[paymentCycle.toString()] || '月付';
  }

  private numberToChinese(num: number): string {
    if (num === 0) return '零';
    const units = ['', '拾', '佰', '仟', '万'];
    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const str = num.toString();
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const n = parseInt(str[i]);
      result += digits[n] + units[str.length - i - 1];
    }
    return result;
  }

  private async findExistingPdf(contractId: string): Promise<PdfResult | null> {
    try {
      const fs = require('fs');
      const filename = `contract_${contractId}.pdf`;
      const filePath = path.join(this.outputDir, filename);

      if (fs.existsSync(filePath)) {
        return {
          success: true,
          filePath,
          filename
        };
      }
      return null;
    } catch (error) {
      console.error('[PDF服务] 检查已有PDF失败:', error);
      return null;
    }
  }

  async generateContractPdf(contractData: ContractData): Promise<PdfResult> {
    try {
      const existingPdf = await this.findExistingPdf(contractData.id);
      if (existingPdf) {
        console.log(`[PDF服务] 复用已有PDF: ${existingPdf.filename}`);
        return existingPdf;
      }

      const filename = `contract_${contractData.id}.pdf`;
      const filePath = path.join(this.outputDir, filename);

      const template = this.loadTemplate();
      const filledHtml = this.fillTemplate(template, contractData);

      const browser = await puppeteer.launch({
        headless: true,
        executablePath: CHROMIUM_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      });

      const page = await browser.newPage();
      await page.setContent(filledHtml, { waitUntil: 'domcontentloaded', timeout: 60000 });

      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          bottom: '10mm',
          left: '15mm',
          right: '15mm'
        }
      });

      await browser.close();

      return {
        success: true,
        filePath,
        filename
      };
    } catch (error) {
      console.error('生成PDF错误:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  async deletePdf(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.outputDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  renderContractHtml(contractData: ContractData): string {
    const template = this.loadTemplate();
    return this.fillTemplate(template, contractData);
  }
}

export const htmlPdfService = new HtmlPdfService();