import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 合同数据结构接口
export interface PartyInfo {
  name: string;
  company?: string;
  contact: string;
  phone: string;
  address: string;
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
}

export interface PdfResult {
  success: boolean;
  filePath?: string;
  filename?: string;
  error?: string;
}

class PdfService {
  private outputDir: string;
  private fontDir: string;
  private hasChineseFont: boolean = false;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'uploads', 'pdfs');
    this.fontDir = path.join(process.cwd(), 'fonts');
    this.ensureDirectoryExists();
    this.checkFonts();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private checkFonts(): void {
    const simHeiPath = path.join(this.fontDir, 'SimHei.ttf');
    const simSunPath = path.join(this.fontDir, 'SimSun.ttf');
    this.hasChineseFont = fs.existsSync(simHeiPath) && fs.existsSync(simSunPath);
    console.log(`[PDF服务] 中文字体检查: ${this.hasChineseFont ? '可用' : '不可用，将使用默认字体'}`);
  }

  private getFontPath(fontName: string): string {
    return path.join(this.fontDir, fontName);
  }

  /**
   * 生成合同PDF
   */
  async generateContractPdf(contractData: ContractData): Promise<PdfResult> {
    try {
      const filename = `contract_${contractData.id}_${uuidv4().substring(0, 8)}.pdf`;
      const filePath = path.join(this.outputDir, filename);

      return new Promise((resolve) => {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 60, right: 60 },
          info: {
            Title: contractData.title,
            Author: '租赁合同系统',
            Subject: `合同编号: ${contractData.contractNumber}`
          }
        });

        const writeStream = fs.createWriteStream(filePath);

        writeStream.on('finish', () => {
          resolve({
            success: true,
            filePath,
            filename
          });
        });

        writeStream.on('error', (err) => {
          resolve({
            success: false,
            error: err.message
          });
        });

        doc.pipe(writeStream);

        // 绘制PDF内容
        this.drawContractContent(doc, contractData);

        doc.end();
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 绘制合同内容
   */
  private drawContractContent(doc: PDFKit.PDFDocument, contract: ContractData): void {
    const pageWidth = doc.page.width - 120; // 左右边距60

    // 根据字体可用性选择字体
    const titleFont = this.hasChineseFont ? this.getFontPath('SimHei.ttf') : 'Helvetica-Bold';
    const bodyFont = this.hasChineseFont ? this.getFontPath('SimSun.ttf') : 'Helvetica';

    // 标题
    doc.font(titleFont).fontSize(18).fillColor('#000000');
    const title = contract.title;
    const titleWidth = doc.widthOfString(title);
    doc.text(title, (doc.page.width - titleWidth) / 2, 50, { align: 'center' });

    // 合同编号
    doc.fontSize(10).fillColor('#666666');
    const contractNum = `合同编号: ${contract.contractNumber}`;
    const contractNumWidth = doc.widthOfString(contractNum);
    doc.text(contractNum, (doc.page.width - contractNumWidth) / 2, 80, { align: 'center' });

    let currentY = 120;

    // 第一条：合同双方信息
    doc.fontSize(12).fillColor('#000000').font(titleFont);
    doc.text('一、合同双方', 60, currentY);
    currentY += 25;

    doc.font(bodyFont).fontSize(10);
    // 甲方信息
    doc.text(`${contract.partyA.name}:`, 70, currentY);
    currentY += 18;
    doc.text(`单位/姓名: ${contract.partyA.company || contract.partyA.contact}`, 90, currentY);
    currentY += 15;
    doc.text(`联系人: ${contract.partyA.contact}`, 90, currentY);
    currentY += 15;
    doc.text(`联系电话: ${contract.partyA.phone}`, 90, currentY);
    currentY += 15;
    doc.text(`地址: ${contract.partyA.address}`, 90, currentY);
    currentY += 25;

    // 乙方信息
    doc.text(`${contract.partyB.name}:`, 70, currentY);
    currentY += 18;
    if (contract.partyB.company) {
      doc.text(`单位: ${contract.partyB.company}`, 90, currentY);
      currentY += 15;
    }
    doc.text(`联系人: ${contract.partyB.contact}`, 90, currentY);
    currentY += 15;
    doc.text(`联系电话: ${contract.partyB.phone}`, 90, currentY);
    currentY += 15;
    doc.text(`地址: ${contract.partyB.address}`, 90, currentY);
    currentY += 30;

    // 第二条：房屋基本信息
    doc.font(titleFont).fontSize(12);
    doc.text('二、房屋基本信息', 60, currentY);
    currentY += 25;

    doc.font(bodyFont).fontSize(10);
    doc.text(`房屋地址: ${contract.property.address}`, 70, currentY);
    currentY += 18;
    doc.text(`建筑面积: ${contract.property.area}`, 70, currentY);
    currentY += 18;
    doc.text(`户型: ${contract.property.roomType}`, 70, currentY);
    currentY += 18;
    if (contract.property.orientation) {
      doc.text(`朝向: ${contract.property.orientation}`, 70, currentY);
      currentY += 18;
    }
    currentY += 15;

    // 第三条：租赁期限
    doc.font(titleFont).fontSize(12);
    doc.text('三、租赁期限', 60, currentY);
    currentY += 25;

    doc.font(bodyFont).fontSize(10);
    doc.text(`租赁开始日期: ${contract.duration.startDate}`, 70, currentY);
    currentY += 18;
    doc.text(`租赁结束日期: ${contract.duration.endDate}`, 70, currentY);
    currentY += 18;
    doc.text(`租赁期限: ${contract.duration.totalMonths}个月`, 70, currentY);
    currentY += 30;

    // 第四条：租金及付款方式
    doc.font(titleFont).fontSize(12);
    doc.text('四、租金及付款方式', 60, currentY);
    currentY += 25;

    doc.font(bodyFont).fontSize(10);
    doc.text(`租金金额: 人民币 ${contract.rent.amount} 元/月`, 70, currentY);
    currentY += 18;
    doc.text(`付款方式: ${contract.rent.paymentCycle}`, 70, currentY);
    currentY += 18;
    doc.text(`付款时间: 每月${contract.rent.paymentDate}`, 70, currentY);
    currentY += 18;
    doc.text(`押金: 人民币 ${contract.rent.deposit} 元`, 70, currentY);
    currentY += 18;
    doc.text(`(租赁期满，房屋设施无损坏情况下，甲方退还全部押金)`, 70, currentY);
    currentY += 30;

    // 第五条：合同条款
    doc.font(titleFont).fontSize(12);
    doc.text('五、合同条款', 60, currentY);
    currentY += 25;

    doc.font(bodyFont).fontSize(10);
    contract.terms.forEach((term, index) => {
      const lines = this.wrapText(term, pageWidth - 90);
      lines.forEach((line) => {
        doc.text(`${index + 1}. ${line}`, 70, currentY, { indent: -10 });
        currentY += 18;
      });
    });

    currentY += 20;

    // 检查是否需要换页
    if (currentY > doc.page.height - 200) {
      doc.addPage();
      currentY = 50;
    }

    // 签署信息
    doc.font(titleFont).fontSize(12);
    doc.text('六、签署信息', 60, currentY);
    currentY += 30;

    doc.font(bodyFont).fontSize(10);
    const currentDate = new Date().toLocaleDateString('zh-CN');
    doc.text(`甲方签字/盖章:_______________________    日期: ${currentDate}`, 70, currentY);
    currentY += 30;
    doc.text(`乙方签字/盖章:_______________________    日期: ${currentDate}`, 70, currentY);

    // 页脚 - 安全处理
    try {
      const totalPages = doc.bufferedPageRange().count;
      if (totalPages > 0) {
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).fillColor('#999999');
          doc.text(
            `第 ${i + 1} 页 / 共 ${totalPages} 页`,
            60,
            doc.page.height - 40,
            { align: 'center', width: pageWidth }
          );
        }
      }
    } catch (e) {
      // 忽略页脚绘制错误
    }
  }

  /**
   * 文本换行处理
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    // 简单实现，实际应该考虑字符宽度
    for (const char of words) {
      const testLine = currentLine + char;
      if (testLine.length > 40) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  /**
   * 删除PDF文件
   */
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
}

// 导出单例
export const pdfService = new PdfService();
