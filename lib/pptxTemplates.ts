/**
 * PPTX Generation Templates using pptxgenjs
 * Creates Lazard-style professional pitch deck slides
 */

import PptxGenJS from 'pptxgenjs';
import {
  CompanyData,
  FormData,
  SlideContent,
  PPTXTheme,
  Rating,
} from './types';
import {
  formatLargeNumber,
  formatPercentage,
  formatRatio,
  condenseDescription,
} from './fmpClient';
import { ChartExportResult } from './chartHelpers';

// ============================================
// Helper Functions
// ============================================

/**
 * Ensure text is always a string (prevents pptxgenjs errors)
 */
function safeText(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'number') {
    if (isNaN(value)) return 'N/A';
    return String(value);
  }
  if (typeof value === 'string') {
    return value || 'N/A';
  }
  return String(value) || 'N/A';
}

/**
 * Validate and fix table rows before passing to pptxgenjs
 */
function validateTableRows(rows: any[][]): any[][] {
  return rows.map((row, rowIdx) => 
    row.map((cell, cellIdx) => {
      // If cell is just a string, wrap it
      if (typeof cell === 'string') {
        return { text: cell };
      }
      // If cell is an object with text property
      if (cell && typeof cell === 'object') {
        const textValue = cell.text;
        // Ensure text is a string
        if (typeof textValue !== 'string') {
          console.warn(`Invalid cell text at row ${rowIdx}, cell ${cellIdx}:`, textValue);
          return { ...cell, text: safeText(textValue) };
        }
        return cell;
      }
      // Fallback
      console.warn(`Invalid cell at row ${rowIdx}, cell ${cellIdx}:`, cell);
      return { text: 'N/A' };
    })
  );
}

// ============================================
// Theme Configuration
// ============================================

export function createLazardTheme(accentColor: string): PPTXTheme {
  return {
    primaryColor: '1a2744',
    secondaryColor: '3d4f5f',
    accentColor: accentColor.replace('#', ''),
    textColor: '1a2744',
    backgroundColor: 'ffffff',
    fontFamily: {
      heading: 'Georgia',
      body: 'Arial',
    },
  };
}

// ============================================
// PPTX Builder Class
// ============================================

export class PitchDeckBuilder {
  private pptx: PptxGenJS;
  private theme: PPTXTheme;
  private companyData: CompanyData;
  private formData: FormData;
  private charts: ChartExportResult[];
  private generatedDate: string;

  constructor(
    companyData: CompanyData,
    formData: FormData,
    charts: ChartExportResult[]
  ) {
    this.pptx = new PptxGenJS();
    this.theme = createLazardTheme(formData.themeColor);
    this.companyData = companyData;
    this.formData = formData;
    this.charts = charts;
    this.generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    this.setupPresentation();
  }

  private setupPresentation(): void {
    this.pptx.layout = 'LAYOUT_16x9';
    this.pptx.author = this.formData.authorName || 'QuickBuy Generator';
    this.pptx.company = 'QuickBuy';
    this.pptx.subject = `${this.companyData.profile?.companyName} - Buy-Side Pitch`;
    this.pptx.title = `${this.companyData.profile?.symbol} Stock Pitch`;
  }

  private addFooter(slide: PptxGenJS.Slide): void {
    slide.addText(
      `Generated with QuickBuy • Data: Financial Modeling Prep (FMP) • ${this.generatedDate}`,
      {
        x: 0.5,
        y: 5.2,
        w: 9,
        h: 0.3,
        fontSize: 8,
        color: '9ca8b3',
        fontFace: this.theme.fontFamily.body,
      }
    );
  }

  // ============================================
  // Slide 1: Cover - Lazard Style with Images
  // ============================================
  private addCoverSlide(): void {
    const slide = this.pptx.addSlide();
    const profile = this.companyData.profile;

    // LEFT SIDE - Dark background with text
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: 6,
      h: '100%',
      fill: { color: this.theme.primaryColor },
    });

    // RIGHT SIDE - Image area (lighter for photo placeholder)
    slide.addShape('rect', {
      x: 6,
      y: 0,
      w: 4,
      h: '100%',
      fill: { color: '1e3354' },
    });

    // Company Logo - prominent on right side
    try {
      if (profile?.image && !profile.defaultImage) {
        // Add logo in center-right area
        slide.addImage({
          path: profile.image,
          x: 6.8,
          y: 1.5,
          w: 2.4,
          h: 2.4,
        });
      } else {
        // Placeholder for logo
        slide.addShape('rect', {
          x: 6.8,
          y: 1.5,
          w: 2.4,
          h: 2.4,
          fill: { color: '2a4a6a' },
        });
        slide.addText(profile?.symbol || 'LOGO', {
          x: 6.8,
          y: 2.4,
          w: 2.4,
          h: 0.6,
          fontSize: 24,
          bold: true,
          color: '6b8eb8',
          fontFace: this.theme.fontFamily.body,
          align: 'center',
        });
      }
    } catch (e) {
      console.log('Could not add company logo');
    }

    // Photo placeholder text on right
    slide.addText('[ Company HQ / Product Image ]', {
      x: 6.3,
      y: 4.2,
      w: 3.2,
      h: 0.4,
      fontSize: 8,
      italic: true,
      color: '5a7a9a',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    // Accent bar at top
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.12,
      fill: { color: this.theme.accentColor },
    });

    // Rating Badge - top right of left section
    const ratingColor = this.getRatingColor(this.formData.rating);
    slide.addShape('rect', {
      x: 4.3,
      y: 0.35,
      w: 1.4,
      h: 0.55,
      fill: { color: ratingColor },
    });
    slide.addText(this.formData.rating.toUpperCase(), {
      x: 4.3,
      y: 0.38,
      w: 1.4,
      h: 0.5,
      fontSize: 14,
      bold: true,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    // BUY-SIDE EQUITY RESEARCH header
    slide.addText('BUY-SIDE EQUITY RESEARCH', {
      x: 0.5,
      y: 0.5,
      w: 3.5,
      h: 0.3,
      fontSize: 9,
      color: '9ca8b3',
      fontFace: this.theme.fontFamily.body,
      bold: true,
    });

    // Company Name - large
    slide.addText(profile?.companyName || 'Company Name', {
      x: 0.5,
      y: 1.2,
      w: 5.3,
      h: 0.9,
      fontSize: 36,
      bold: true,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.heading,
    });

    // Ticker and Exchange
    const exchangeName = profile?.exchangeShortName || (profile as any)?.exchange || '';
    slide.addText(safeText(`${profile?.symbol || ''} : ${exchangeName}`), {
      x: 0.5,
      y: 2.05,
      w: 5.3,
      h: 0.35,
      fontSize: 16,
      color: 'e8ecef',
      fontFace: this.theme.fontFamily.body,
    });

    // Sector/Industry
    slide.addText(safeText(`${profile?.sector || ''} | ${profile?.industry || ''}`), {
      x: 0.5,
      y: 2.4,
      w: 5.3,
      h: 0.3,
      fontSize: 11,
      color: '9ca8b3',
      fontFace: this.theme.fontFamily.body,
    });

    // Divider line
    slide.addShape('rect', {
      x: 0.5,
      y: 2.85,
      w: 1.5,
      h: 0.03,
      fill: { color: this.theme.accentColor },
    });

    // Key stats in 2x3 grid
    const mktCap = profile?.mktCap ? formatLargeNumber(profile.mktCap) : 'N/A';
    const priceVal = profile?.price || 0;
    const price = priceVal > 0 ? `$${priceVal.toFixed(2)}` : 'N/A';
    const targetVal = this.formData.targetPrice || 0;
    const target = targetVal > 0 ? `$${targetVal.toFixed(2)}` : 'TBD';
    const upside = priceVal > 0 && targetVal > 0
      ? `${(((targetVal - priceVal) / priceVal) * 100).toFixed(0)}%`
      : 'N/A';
    
    const statsGrid = [
      [{ label: 'PRICE', value: price }, { label: 'TARGET', value: target }],
      [{ label: 'MARKET CAP', value: mktCap }, { label: 'UPSIDE', value: upside }],
      [{ label: 'HORIZON', value: `${this.formData.timeHorizon} Months` }, { label: 'BETA', value: profile?.beta?.toFixed(2) || 'N/A' }],
    ];

    statsGrid.forEach((row, rowIdx) => {
      row.forEach((stat, colIdx) => {
        const x = 0.5 + (colIdx * 2.6);
        const y = 3.05 + (rowIdx * 0.6);
        
        slide.addText(stat.label, {
          x,
          y,
          w: 2.4,
          h: 0.22,
          fontSize: 7,
          color: '7a8a9a',
          fontFace: this.theme.fontFamily.body,
        });
        slide.addText(stat.value, {
          x,
          y: y + 0.2,
          w: 2.4,
          h: 0.35,
          fontSize: 14,
          bold: true,
          color: 'ffffff',
          fontFace: this.theme.fontFamily.body,
        });
      });
    });

    // Bottom info bar
    slide.addShape('rect', {
      x: 0,
      y: 4.9,
      w: 6,
      h: 0.55,
      fill: { color: '0f1d2d' },
    });

    slide.addText(
      `Prepared by ${this.formData.authorName || 'Analyst'} | ${this.generatedDate} | Confidential`,
      {
        x: 0.5,
        y: 5,
        w: 5.3,
        h: 0.35,
        fontSize: 8,
        color: '6b7c8a',
        fontFace: this.theme.fontFamily.body,
      }
    );

    // Location info on right side
    if (profile?.city || profile?.country) {
      slide.addText(safeText(`HQ: ${profile?.city || ''}, ${profile?.state || profile?.country || ''}`), {
        x: 6.3,
        y: 4.6,
        w: 3.2,
        h: 0.3,
        fontSize: 9,
        color: '8aaaca',
        fontFace: this.theme.fontFamily.body,
        align: 'center',
      });
    }
  }

  private getRatingColor(rating: Rating): string {
    switch (rating) {
      case 'Buy':
        return '16a34a';
      case 'Outperform':
        return '22c55e';
      case 'Hold':
        return 'f59e0b';
      case 'Sell':
        return 'dc2626';
    }
  }

  // ============================================
  // Slide 2: Table of Contents
  // ============================================
  private addTableOfContents(): void {
    const slide = this.pptx.addSlide();

    slide.addText('Table of Contents', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.heading,
    });

    const items = [
      'Investment Summary',
      'Company Overview',
      'Industry Overview',
      'Key Metrics',
      'Financial Summary',
      'Revenue & Growth Analysis',
      'Price Performance',
      'Peer Comparison',
      'Market Position',
      'Growth Drivers',
      'Investment Thesis',
      'Valuation',
      'Risks & Mitigants',
      'Appendix',
    ];

    const tocText = items.map((item, i) => `${i + 1}. ${item}`).join('\n');

    slide.addText(safeText(tocText), {
      x: 0.5,
      y: 1.3,
      w: 5,
      h: 4,
      fontSize: 12,
      color: this.theme.secondaryColor,
      fontFace: this.theme.fontFamily.body,
      lineSpacingMultiple: 1.5,
    });

    this.addFooter(slide);
  }

  // ============================================
  // Slide 3: Investment Summary - Dense Lazard Style
  // ============================================
  private addInvestmentSummary(): void {
    const slide = this.pptx.addSlide();
    const profile = this.companyData.profile;
    const ratios = this.companyData.ratiosTTM;
    const income = this.companyData.incomeStatements || [];

    // Header bar
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.5,
      fill: { color: this.theme.primaryColor },
    });
    slide.addText(safeText(`${profile?.companyName || 'Company'} (${profile?.symbol || ''}) | Investment Summary`), {
      x: 0.3,
      y: 0.1,
      w: 8,
      h: 0.3,
      fontSize: 14,
      bold: true,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.heading,
    });

    // Rating badge in header
    const ratingColor = this.getRatingColor(this.formData.rating);
    slide.addShape('rect', {
      x: 8.5,
      y: 0.08,
      w: 1,
      h: 0.34,
      fill: { color: ratingColor },
    });
    slide.addText(this.formData.rating.toUpperCase(), {
      x: 8.5,
      y: 0.1,
      w: 1,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    // LEFT COLUMN - Recommendation & Pricing
    slide.addText('RECOMMENDATION', {
      x: 0.3,
      y: 0.6,
      w: 3,
      h: 0.2,
      fontSize: 7,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    const currentPrice = Number(profile?.price) || 0;
    const targetPrice = Number(this.formData.targetPrice) || 0;
    const upside = currentPrice > 0 && targetPrice > 0 ? ((targetPrice - currentPrice) / currentPrice * 100) : 0;

    const pricingData = [
      ['Rating', safeText(this.formData.rating), ratingColor],
      ['Target Price', safeText(targetPrice > 0 ? `$${targetPrice.toFixed(2)}` : 'TBD'), ''],
      ['Current Price', safeText(currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : 'N/A'), ''],
      ['Upside/(Downside)', safeText(currentPrice > 0 && targetPrice > 0 ? `${upside >= 0 ? '+' : ''}${upside.toFixed(1)}%` : 'N/A'), upside >= 0 ? '16a34a' : 'dc2626'],
      ['Time Horizon', safeText(`${this.formData.timeHorizon} months`), ''],
      ['52-Week Range', safeText(profile?.range || 'N/A'), ''],
    ];

    pricingData.forEach((row, i) => {
      const y = 0.82 + (i * 0.28);
      slide.addText(safeText(row[0]), {
        x: 0.3,
        y,
        w: 1.4,
        h: 0.25,
        fontSize: 8,
        color: '6b7c8a',
        fontFace: this.theme.fontFamily.body,
      });
      slide.addText(safeText(row[1]), {
        x: 1.7,
        y,
        w: 1.3,
        h: 0.25,
        fontSize: 8,
        bold: true,
        color: row[2] || this.theme.textColor,
        fontFace: this.theme.fontFamily.body,
      });
    });

    // MIDDLE COLUMN - Valuation Metrics
    slide.addText('VALUATION METRICS', {
      x: 3.2,
      y: 0.6,
      w: 3,
      h: 0.2,
      fontSize: 7,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    const valuationData = [
      ['Market Cap', safeText(profile?.mktCap ? formatLargeNumber(profile.mktCap) : 'N/A')],
      ['Enterprise Value', safeText(ratios?.enterpriseValueMultipleTTM ? 'See metrics' : 'N/A')],
      ['P/E (TTM)', safeText(ratios?.peRatioTTM ? `${ratios.peRatioTTM.toFixed(1)}x` : 'N/A')],
      ['EV/EBITDA', safeText(ratios?.enterpriseValueMultipleTTM ? `${ratios.enterpriseValueMultipleTTM.toFixed(1)}x` : 'N/A')],
      ['P/S (TTM)', safeText(ratios?.priceToSalesRatioTTM ? `${ratios.priceToSalesRatioTTM.toFixed(1)}x` : 'N/A')],
      ['P/B (TTM)', safeText(ratios?.priceToBookRatioTTM ? `${ratios.priceToBookRatioTTM.toFixed(1)}x` : 'N/A')],
    ];

    valuationData.forEach((row, i) => {
      const y = 0.82 + (i * 0.28);
      slide.addText(safeText(row[0]), {
        x: 3.2,
        y,
        w: 1.4,
        h: 0.25,
        fontSize: 8,
        color: '6b7c8a',
        fontFace: this.theme.fontFamily.body,
      });
      slide.addText(safeText(row[1]), {
        x: 4.6,
        y,
        w: 1.2,
        h: 0.25,
        fontSize: 8,
        bold: true,
        color: this.theme.textColor,
        fontFace: this.theme.fontFamily.body,
      });
    });

    // RIGHT COLUMN - Operating Metrics
    slide.addText('OPERATING METRICS', {
      x: 6.2,
      y: 0.6,
      w: 3.3,
      h: 0.2,
      fontSize: 7,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    const latestIncome = income[0];
    const operatingData = [
      ['Revenue (LTM)', safeText(latestIncome ? formatLargeNumber(latestIncome.revenue) : 'N/A')],
      ['Gross Margin', safeText(ratios?.grossProfitMarginTTM ? `${(ratios.grossProfitMarginTTM * 100).toFixed(1)}%` : 'N/A')],
      ['EBITDA Margin', safeText(latestIncome && latestIncome.revenue > 0 && latestIncome.ebitda ? `${((latestIncome.ebitda / latestIncome.revenue) * 100).toFixed(1)}%` : 'N/A')],
      ['Net Margin', safeText(ratios?.netProfitMarginTTM ? `${(ratios.netProfitMarginTTM * 100).toFixed(1)}%` : 'N/A')],
      ['ROE', safeText(ratios?.returnOnEquityTTM ? `${(ratios.returnOnEquityTTM * 100).toFixed(1)}%` : 'N/A')],
      ['Debt/Equity', safeText(ratios?.debtEquityRatioTTM ? `${ratios.debtEquityRatioTTM.toFixed(2)}x` : 'N/A')],
    ];

    operatingData.forEach((row, i) => {
      const y = 0.82 + (i * 0.28);
      slide.addText(safeText(row[0]), {
        x: 6.2,
        y,
        w: 1.5,
        h: 0.25,
        fontSize: 8,
        color: '6b7c8a',
        fontFace: this.theme.fontFamily.body,
      });
      slide.addText(safeText(row[1]), {
        x: 7.7,
        y,
        w: 1.5,
        h: 0.25,
        fontSize: 8,
        bold: true,
        color: this.theme.textColor,
        fontFace: this.theme.fontFamily.body,
      });
    });

    // Divider line
    slide.addShape('rect', {
      x: 0.3,
      y: 2.55,
      w: 9.2,
      h: 0.02,
      fill: { color: 'e8ecef' },
    });

    // INVESTMENT THESIS SUMMARY
    slide.addText('INVESTMENT THESIS SUMMARY', {
      x: 0.3,
      y: 2.65,
      w: 9,
      h: 0.2,
      fontSize: 7,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    slide.addShape('rect', {
      x: 0.3,
      y: 2.85,
      w: 9.2,
      h: 0.9,
      fill: { color: 'f5f6f8' },
    });

    const companyName = profile?.companyName || 'Company';
    const sector = profile?.sector || 'Technology';
    const industry = profile?.industry || 'the industry';
    const mktCapStr = profile?.mktCap ? formatLargeNumber(profile.mktCap) : 'significant';
    const peStr = ratios?.peRatioTTM ? ratios.peRatioTTM.toFixed(1) + 'x' : 'current';

    const thesisBullets = [
      safeText(`${companyName} is a ${sector} company operating in ${industry}`),
      safeText(`Strong competitive position with ${mktCapStr} market cap and established market presence`),
      safeText('Key catalysts include [user to add: product launches, market expansion, margin improvement initiatives]'),
      safeText(`Attractive valuation at ${peStr} P/E vs. historical average and peers`),
    ];

    // Add each bullet point separately to avoid pptxgenjs text parsing issues
    thesisBullets.forEach((bullet, i) => {
      slide.addText(safeText('• ' + bullet), {
        x: 0.4,
        y: 2.9 + (i * 0.25),
        w: 9,
        h: 0.25,
        fontSize: 8,
        color: this.theme.secondaryColor,
        fontFace: this.theme.fontFamily.body,
      });
    });

    // COMPANY SNAPSHOT - Bottom section
    slide.addText('COMPANY SNAPSHOT', {
      x: 0.3,
      y: 3.85,
      w: 4.5,
      h: 0.2,
      fontSize: 7,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    const snapshotData = [
      ['Sector', safeText(profile?.sector || 'N/A')],
      ['Industry', safeText(profile?.industry || 'N/A')],
      ['Headquarters', safeText(`${profile?.city || ''}, ${profile?.state || profile?.country || ''}`)],
      ['CEO', safeText(profile?.ceo || 'N/A')],
      ['Employees', safeText(profile?.fullTimeEmployees && !isNaN(parseInt(profile.fullTimeEmployees)) ? parseInt(profile.fullTimeEmployees).toLocaleString() : 'N/A')],
      ['Founded/IPO', safeText(profile?.ipoDate || 'N/A')],
    ];

    snapshotData.forEach((row, i) => {
      const col = i % 2;
      const rowNum = Math.floor(i / 2);
      const x = 0.3 + (col * 2.3);
      const y = 4.05 + (rowNum * 0.28);
      slide.addText(safeText(row[0] + ':'), {
        x,
        y,
        w: 1,
        h: 0.25,
        fontSize: 7,
        color: '6b7c8a',
        fontFace: this.theme.fontFamily.body,
      });
      slide.addText(safeText(row[1]), {
        x: x + 1,
        y,
        w: 1.3,
        h: 0.25,
        fontSize: 7,
        bold: true,
        color: this.theme.textColor,
        fontFace: this.theme.fontFamily.body,
      });
    });

    // KEY RISKS - right side of bottom
    slide.addText('KEY RISKS', {
      x: 5,
      y: 3.85,
      w: 4.5,
      h: 0.2,
      fontSize: 7,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    const risks = [
      'Market/macro volatility and economic uncertainty',
      'Competitive pressures and pricing dynamics',
      'Execution risk on strategic initiatives',
      'Regulatory and compliance considerations',
    ];

    // Add each risk bullet separately
    risks.forEach((risk, i) => {
      slide.addText(safeText('• ' + risk), {
        x: 5,
        y: 4.05 + (i * 0.2),
        w: 4.5,
        h: 0.2,
        fontSize: 7,
        color: this.theme.secondaryColor,
        fontFace: this.theme.fontFamily.body,
      });
    });

    this.addFooter(slide);
  }

  // ============================================
  // Slide 4: Company Overview - Dense Lazard Style
  // ============================================
  private addCompanyOverview(): void {
    const slide = this.pptx.addSlide();
    const profile = this.companyData.profile;
    const ratios = this.companyData.ratiosTTM;

    // Header bar
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.45,
      fill: { color: this.theme.primaryColor },
    });
    slide.addText(safeText(`Company Overview | ${profile?.companyName || 'Company'}`), {
      x: 0.3,
      y: 0.08,
      w: 9,
      h: 0.3,
      fontSize: 14,
      bold: true,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.heading,
    });

    // THREE COLUMN LAYOUT

    // COLUMN 1 - Corporate Profile
    slide.addShape('rect', {
      x: 0.3,
      y: 0.55,
      w: 3,
      h: 0.25,
      fill: { color: 'e8ecef' },
    });
    slide.addText('CORPORATE PROFILE', {
      x: 0.3,
      y: 0.57,
      w: 3,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    const exchangeName = profile?.exchangeShortName || (profile as any)?.exchange || 'N/A';
    const corpData = [
      ['Ticker', `${profile?.symbol || 'N/A'} (${exchangeName})`],
      ['Sector', profile?.sector || 'N/A'],
      ['Industry', profile?.industry || 'N/A'],
      ['Sub-Industry', profile?.industry || 'N/A'],
      ['HQ Location', `${profile?.city || 'N/A'}, ${profile?.state || ''}`],
      ['Country', profile?.country || 'N/A'],
      ['Website', profile?.website?.replace('https://', '').substring(0, 25) || 'N/A'],
      ['Fiscal Year End', 'December'],
    ];

    corpData.forEach((row, i) => {
      const y = 0.85 + (i * 0.24);
      slide.addText(row[0], { x: 0.35, y, w: 1.1, h: 0.22, fontSize: 7, color: '6b7c8a', fontFace: this.theme.fontFamily.body });
      slide.addText(row[1], { x: 1.45, y, w: 1.8, h: 0.22, fontSize: 7, bold: true, color: this.theme.textColor, fontFace: this.theme.fontFamily.body });
    });

    // COLUMN 2 - Management & Ownership
    slide.addShape('rect', {
      x: 3.4,
      y: 0.55,
      w: 3,
      h: 0.25,
      fill: { color: 'e8ecef' },
    });
    slide.addText('MANAGEMENT & KEY DATA', {
      x: 3.4,
      y: 0.57,
      w: 3,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    const mgmtData = [
      ['CEO', profile?.ceo || 'N/A'],
      ['Employees', profile?.fullTimeEmployees && !isNaN(parseInt(profile.fullTimeEmployees)) ? parseInt(profile.fullTimeEmployees).toLocaleString() : 'N/A'],
      ['IPO Date', profile?.ipoDate || 'N/A'],
      ['Shares Out', profile?.mktCap && profile?.price && profile.price > 0 ? `${(profile.mktCap / profile.price / 1e9).toFixed(2)}B` : 'N/A'],
      ['Float', 'N/A'],
      ['Insider Own %', 'N/A'],
      ['Inst. Own %', 'N/A'],
      ['Short Interest', 'N/A'],
    ];

    mgmtData.forEach((row, i) => {
      const y = 0.85 + (i * 0.24);
      slide.addText(row[0], { x: 3.45, y, w: 1.2, h: 0.22, fontSize: 7, color: '6b7c8a', fontFace: this.theme.fontFamily.body });
      slide.addText(row[1], { x: 4.65, y, w: 1.7, h: 0.22, fontSize: 7, bold: true, color: this.theme.textColor, fontFace: this.theme.fontFamily.body });
    });

    // COLUMN 3 - Trading Data
    slide.addShape('rect', {
      x: 6.5,
      y: 0.55,
      w: 3,
      h: 0.25,
      fill: { color: 'e8ecef' },
    });
    slide.addText('TRADING DATA', {
      x: 6.5,
      y: 0.57,
      w: 3,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    const tradingData = [
      ['Stock Price', profile?.price ? `$${profile.price.toFixed(2)}` : 'N/A'],
      ['Market Cap', profile?.mktCap ? formatLargeNumber(profile.mktCap) : 'N/A'],
      ['52-Week High', profile?.range ? `$${profile.range.split('-')[1]}` : 'N/A'],
      ['52-Week Low', profile?.range ? `$${profile.range.split('-')[0]}` : 'N/A'],
      ['Avg Volume', profile?.volAvg ? `${(profile.volAvg / 1e6).toFixed(1)}M` : 'N/A'],
      ['Beta', profile?.beta ? profile.beta.toFixed(2) : 'N/A'],
      ['Div Yield', ratios?.dividendYieldTTM ? `${(ratios.dividendYieldTTM * 100).toFixed(2)}%` : 'N/A'],
      ['P/E (TTM)', ratios?.peRatioTTM ? `${ratios.peRatioTTM.toFixed(1)}x` : 'N/A'],
    ];

    tradingData.forEach((row, i) => {
      const y = 0.85 + (i * 0.24);
      slide.addText(row[0], { x: 6.55, y, w: 1.2, h: 0.22, fontSize: 7, color: '6b7c8a', fontFace: this.theme.fontFamily.body });
      slide.addText(row[1], { x: 7.75, y, w: 1.7, h: 0.22, fontSize: 7, bold: true, color: this.theme.textColor, fontFace: this.theme.fontFamily.body });
    });

    // BUSINESS DESCRIPTION - Full width bottom section
    slide.addShape('rect', {
      x: 0.3,
      y: 2.85,
      w: 9.2,
      h: 0.25,
      fill: { color: this.theme.primaryColor },
    });
    slide.addText('BUSINESS DESCRIPTION', {
      x: 0.3,
      y: 2.87,
      w: 9.2,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    slide.addShape('rect', {
      x: 0.3,
      y: 3.1,
      w: 9.2,
      h: 1.4,
      fill: { color: 'f5f6f8' },
    });

    const description = profile?.description
      ? condenseDescription(profile.description, 200)
      : 'Company description not available. Please refer to company SEC filings (10-K, 10-Q) for detailed business overview and segment information.';

    slide.addText(description, {
      x: 0.4,
      y: 3.15,
      w: 9,
      h: 1.3,
      fontSize: 8,
      color: this.theme.secondaryColor,
      fontFace: this.theme.fontFamily.body,
      valign: 'top',
      lineSpacingMultiple: 1.25,
    });

    // KEY PRODUCTS/SEGMENTS - bottom left
    slide.addText('KEY BUSINESS SEGMENTS', {
      x: 0.3,
      y: 4.55,
      w: 2.8,
      h: 0.2,
      fontSize: 7,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    const segments = ['• Primary segment', '• Secondary segment', '• Other markets'];
    slide.addText(segments.join('\n'), {
      x: 0.3,
      y: 4.75,
      w: 2.8,
      h: 0.5,
      fontSize: 7,
      color: this.theme.secondaryColor,
      fontFace: this.theme.fontFamily.body,
      lineSpacingMultiple: 1.15,
    });

    // COMPANY IMAGE PLACEHOLDER - center bottom
    slide.addShape('rect', {
      x: 3.3,
      y: 4.55,
      w: 3.2,
      h: 0.75,
      fill: { color: 'e8ecef' },
    });

    // Add company logo if available
    try {
      if (profile?.image && !profile.defaultImage) {
        slide.addImage({
          path: profile.image,
          x: 4.4,
          y: 4.6,
          w: 0.65,
          h: 0.65,
        });
      }
    } catch (e) {
      console.log('Could not add logo to overview');
    }

    slide.addText('[ Add product/facility images ]', {
      x: 3.3,
      y: 4.75,
      w: 3.2,
      h: 0.3,
      fontSize: 7,
      italic: true,
      color: '9ca8b3',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    // COMPETITIVE POSITION - bottom right
    slide.addText('COMPETITIVE MOATS', {
      x: 6.7,
      y: 4.55,
      w: 2.8,
      h: 0.2,
      fontSize: 7,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    const competitive = ['• Brand strength', '• Scale advantages', '• IP / Technology'];
    slide.addText(competitive.join('\n'), {
      x: 6.7,
      y: 4.75,
      w: 2.8,
      h: 0.5,
      fontSize: 7,
      color: this.theme.secondaryColor,
      fontFace: this.theme.fontFamily.body,
      lineSpacingMultiple: 1.15,
    });

    this.addFooter(slide);
  }

  // ============================================
  // Slide 5: Industry Overview
  // ============================================
  private addIndustryOverview(): void {
    const slide = this.pptx.addSlide();
    const profile = this.companyData.profile;

    slide.addText('Industry Overview', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.heading,
    });

    slide.addText(safeText(`Sector: ${profile?.sector || 'N/A'}`), {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: this.theme.accentColor,
      fontFace: this.theme.fontFamily.body,
    });

    slide.addText(safeText(`Industry: ${profile?.industry || 'N/A'}`), {
      x: 0.5,
      y: 1.6,
      w: 9,
      h: 0.4,
      fontSize: 12,
      color: this.theme.secondaryColor,
      fontFace: this.theme.fontFamily.body,
    });

    // Industry analysis placeholder
    const industryBullets = [
      'Total Addressable Market (TAM): [User to add market size data]',
      'Key industry trends: [User to add relevant trends]',
      'Competitive landscape: See peer comparison slide for key competitors',
      'Regulatory environment: [User to add if applicable]',
      'Growth drivers: [User to add industry-specific growth catalysts]',
    ];

    // Add each bullet separately
    industryBullets.forEach((bullet, i) => {
      slide.addText(safeText(`• ${bullet}`), {
        x: 0.5,
        y: 2.2 + (i * 0.45),
        w: 9,
        h: 0.4,
        fontSize: 11,
        color: this.theme.secondaryColor,
        fontFace: this.theme.fontFamily.body,
      });
    });

    slide.addText(
      'Note: Industry data may require manual verification and supplementation from industry reports.',
      {
        x: 0.5,
        y: 4.8,
        w: 9,
        h: 0.3,
        fontSize: 9,
        italic: true,
        color: '9ca8b3',
        fontFace: this.theme.fontFamily.body,
      }
    );

    this.addFooter(slide);
  }

  // ============================================
  // Slide 6: Key Metrics - Lazard Style
  // ============================================
  private addKeyMetrics(): void {
    const slide = this.pptx.addSlide();
    const income = this.companyData.incomeStatements || [];
    const ratios = this.companyData.ratiosTTM;
    const profile = this.companyData.profile;

    // Header with accent bar
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.08,
      fill: { color: this.theme.accentColor },
    });

    slide.addText('Key Metrics at a Glance', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.heading,
    });

    // Top KPI boxes - 6 metrics in a row
    const kpiY = 0.55;
    const kpis = [
      { label: 'MKT CAP', value: profile?.mktCap ? formatLargeNumber(profile.mktCap) : 'N/A', color: this.theme.primaryColor },
      { label: 'PRICE', value: profile?.price ? `$${profile.price.toFixed(2)}` : 'N/A', color: this.theme.accentColor },
      { label: 'P/E', value: ratios?.peRatioTTM ? `${ratios.peRatioTTM.toFixed(1)}x` : 'N/A', color: '3d4f5f' },
      { label: 'EV/EBITDA', value: ratios?.enterpriseValueMultipleTTM ? `${ratios.enterpriseValueMultipleTTM.toFixed(1)}x` : 'N/A', color: '6b7c8a' },
      { label: 'DIV YIELD', value: ratios?.dividendYieldTTM ? `${(ratios.dividendYieldTTM * 100).toFixed(1)}%` : 'N/A', color: '16a34a' },
      { label: 'BETA', value: profile?.beta ? profile.beta.toFixed(2) : 'N/A', color: '9ca8b3' },
    ];

    kpis.forEach((kpi, i) => {
      const x = 0.3 + (i * 1.55);
      slide.addShape('rect', {
        x,
        y: kpiY,
        w: 1.45,
        h: 0.65,
        fill: { color: kpi.color },
      });
      slide.addText(kpi.label, {
        x,
        y: kpiY + 0.05,
        w: 1.45,
        h: 0.18,
        fontSize: 6,
        color: 'ffffff',
        fontFace: this.theme.fontFamily.body,
        align: 'center',
      });
      slide.addText(kpi.value, {
        x,
        y: kpiY + 0.25,
        w: 1.45,
        h: 0.35,
        fontSize: 12,
        bold: true,
        color: 'ffffff',
        fontFace: this.theme.fontFamily.body,
        align: 'center',
      });
    });

    // If no income statements, show alternative metrics
    if (income.length === 0) {
      slide.addText('VALUATION & TRADING METRICS', {
        x: 0.5,
        y: 2,
        w: 9,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: '6b7c8a',
        fontFace: this.theme.fontFamily.body,
      });

      slide.addShape('rect', {
        x: 0.5,
        y: 2.3,
        w: 9,
        h: 2.5,
        fill: { color: 'f5f6f8' },
      });

      const altMetrics = [
        ['Beta', profile?.beta ? profile.beta.toFixed(2) : 'N/A'],
        ['52-Week Range', profile?.range || 'N/A'],
        ['Average Volume', profile?.volAvg && !isNaN(Number(profile.volAvg)) ? Number(profile.volAvg).toLocaleString() : 'N/A'],
        ['Dividend Yield', ratios?.dividendYieldTTM ? formatPercentage(ratios.dividendYieldTTM * 100) : 'N/A'],
        ['ROE', ratios?.returnOnEquityTTM ? formatPercentage(ratios.returnOnEquityTTM * 100) : 'N/A'],
        ['Debt/Equity', ratios?.debtEquityRatioTTM ? formatRatio(ratios.debtEquityRatioTTM) : 'N/A'],
      ];

      altMetrics.forEach((metric, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 0.7 + (col * 4.5);
        const y = 2.5 + (row * 0.7);
        
        slide.addText(metric[0], {
          x,
          y,
          w: 2,
          h: 0.3,
          fontSize: 10,
          color: '6b7c8a',
          fontFace: this.theme.fontFamily.body,
        });
        slide.addText(metric[1], {
          x: x + 2,
          y,
          w: 2,
          h: 0.3,
          fontSize: 10,
          bold: true,
          color: this.theme.textColor,
          fontFace: this.theme.fontFamily.body,
        });
      });

      slide.addText('Note: Detailed financial data requires premium API access', {
        x: 0.5,
        y: 4.9,
        w: 9,
        h: 0.25,
        fontSize: 8,
        italic: true,
        color: '9ca8b3',
        fontFace: this.theme.fontFamily.body,
      });

      this.addFooter(slide);
      return;
    }

    // Financial metrics table section
    slide.addText('FINANCIAL PERFORMANCE', {
      x: 0.5,
      y: 2,
      w: 9,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    // Build metrics table with income statement data
    const headers: PptxGenJS.TableCell[] = [
      { text: 'Metric', options: { bold: true, fill: { color: this.theme.primaryColor }, color: 'ffffff' } },
    ];

    const sortedIncome = [...income]
      .filter((s) => s && s.calendarYear)
      .sort((a, b) => parseInt(b.calendarYear || '0') - parseInt(a.calendarYear || '0'))
      .slice(0, 4);
    sortedIncome.forEach((stmt) => {
      headers.push({
        text: safeText(`FY${stmt.calendarYear || 'N/A'}`),
        options: { bold: true, fill: { color: this.theme.primaryColor }, color: 'ffffff', align: 'right' },
      });
    });

    if (ratios) {
      headers.push({
        text: safeText('TTM'),
        options: { bold: true, fill: { color: this.theme.accentColor }, color: 'ffffff', align: 'right' },
      });
    }

    const rows: PptxGenJS.TableCell[][] = [headers];

    // Add all financial rows
    const metrics = [
      { name: 'Revenue', getValue: (s: any) => safeText(formatLargeNumber(s.revenue || 0)), ttm: '-' },
      { name: 'Gross Profit', getValue: (s: any) => safeText(formatLargeNumber(s.grossProfit || 0)), ttm: '-' },
      { name: 'EBITDA', getValue: (s: any) => safeText(formatLargeNumber(s.ebitda || 0)), ttm: '-' },
      { name: 'Net Income', getValue: (s: any) => safeText(formatLargeNumber(s.netIncome || 0)), ttm: '-' },
      { name: 'Gross Margin', getValue: (s: any) => safeText(formatPercentage((s.grossProfitRatio || 0) * 100)), ttm: ratios ? safeText(formatPercentage((ratios.grossProfitMarginTTM || 0) * 100)) : '-' },
      { name: 'Net Margin', getValue: (s: any) => safeText(formatPercentage((s.netIncomeRatio || 0) * 100)), ttm: ratios ? safeText(formatPercentage((ratios.netProfitMarginTTM || 0) * 100)) : '-' },
      { name: 'EPS (Diluted)', getValue: (s: any) => safeText(`$${(s.epsdiluted ?? 0).toFixed(2)}`), ttm: '-' },
    ];

    metrics.forEach((metric) => {
      const row: PptxGenJS.TableCell[] = [{ text: safeText(metric.name), options: { bold: true } }];
      sortedIncome.forEach((stmt) => {
        row.push({ text: safeText(metric.getValue(stmt)), options: { align: 'right' } });
      });
      if (ratios) row.push({ text: safeText(metric.ttm), options: { align: 'right' } });
      rows.push(row);
    });

    slide.addTable(validateTableRows(rows), {
      x: 0.5,
      y: 2.3,
      w: 9,
      fontSize: 9,
      fontFace: this.theme.fontFamily.body,
      color: this.theme.textColor,
      border: { type: 'solid', pt: 0.5, color: 'e8ecef' },
      rowH: 0.32,
    });

    this.addFooter(slide);
  }

  // ============================================
  // Slide 7: Financial Summary Table
  // ============================================
  private addFinancialSummary(): void {
    const slide = this.pptx.addSlide();
    const income = this.companyData.incomeStatements || [];

    slide.addText('Financial Summary', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.heading,
    });

    // Handle empty income statements
    if (income.length === 0) {
      slide.addText('Financial statement data requires premium API access.\n\nPlease add financial data manually or upgrade your FMP subscription.', {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 2,
        fontSize: 14,
        color: '9ca8b3',
        fontFace: this.theme.fontFamily.body,
        align: 'center',
      });
      this.addFooter(slide);
      return;
    }

    const sortedIncome = [...income]
      .filter((s) => s && s.calendarYear)
      .sort((a, b) => parseInt(a.calendarYear || '0') - parseInt(b.calendarYear || '0'));

    // Headers
    const headers: PptxGenJS.TableCell[] = [
      { text: '($ millions)', options: { bold: true, fill: { color: this.theme.primaryColor }, color: 'ffffff' } },
    ];
    sortedIncome.forEach((stmt) => {
      headers.push({
        text: safeText(`FY${stmt.calendarYear || 'N/A'}`),
        options: { bold: true, fill: { color: this.theme.primaryColor }, color: 'ffffff', align: 'right' },
      });
    });

    const rows: PptxGenJS.TableCell[][] = [headers];

    // Revenue
    const revenueRow: PptxGenJS.TableCell[] = [{ text: 'Revenue', options: { bold: true } }];
    sortedIncome.forEach((stmt) => {
      revenueRow.push({ text: safeText(((stmt.revenue || 0) / 1e6).toFixed(0)), options: { align: 'right' } });
    });
    rows.push(revenueRow);

    // Gross Profit
    const gpRow: PptxGenJS.TableCell[] = [{ text: 'Gross Profit', options: { bold: true } }];
    sortedIncome.forEach((stmt) => {
      gpRow.push({ text: safeText(((stmt.grossProfit || 0) / 1e6).toFixed(0)), options: { align: 'right' } });
    });
    rows.push(gpRow);

    // EBITDA
    const ebitdaRow: PptxGenJS.TableCell[] = [{ text: 'EBITDA', options: { bold: true } }];
    sortedIncome.forEach((stmt) => {
      ebitdaRow.push({ text: safeText(((stmt.ebitda || 0) / 1e6).toFixed(0)), options: { align: 'right' } });
    });
    rows.push(ebitdaRow);

    // Operating Income
    const opIncRow: PptxGenJS.TableCell[] = [{ text: 'Operating Income', options: { bold: true } }];
    sortedIncome.forEach((stmt) => {
      opIncRow.push({ text: safeText(((stmt.operatingIncome || 0) / 1e6).toFixed(0)), options: { align: 'right' } });
    });
    rows.push(opIncRow);

    // Net Income
    const netIncRow: PptxGenJS.TableCell[] = [{ text: 'Net Income', options: { bold: true } }];
    sortedIncome.forEach((stmt) => {
      netIncRow.push({ text: safeText(((stmt.netIncome || 0) / 1e6).toFixed(0)), options: { align: 'right' } });
    });
    rows.push(netIncRow);

    slide.addTable(validateTableRows(rows), {
      x: 0.5,
      y: 1.2,
      w: 9,
      fontSize: 10,
      fontFace: this.theme.fontFamily.body,
      color: this.theme.textColor,
      border: { type: 'solid', pt: 0.5, color: 'e8ecef' },
      rowH: 0.45,
    });

    this.addFooter(slide);
  }

  // ============================================
  // Slide 8-10: Chart Slides
  // ============================================
  private addChartSlide(chart: ChartExportResult): void {
    const slide = this.pptx.addSlide();

    slide.addText(chart.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.heading,
    });

    // Add chart image
    slide.addImage({
      data: chart.dataURL,
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 4,
    });

    this.addFooter(slide);
  }

  // ============================================
  // Slide 11: Peers & Comps
  // ============================================
  private addPeersComps(): void {
    const slide = this.pptx.addSlide();
    const peers = this.companyData.peersData || [];
    const profile = this.companyData.profile;
    const ratios = this.companyData.ratiosTTM;

    slide.addText('Peer Comparison', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.heading,
    });

    // Headers
    const headers: PptxGenJS.TableCell[] = [
      { text: 'Company', options: { bold: true, fill: { color: this.theme.primaryColor }, color: 'ffffff' } },
      { text: 'Market Cap', options: { bold: true, fill: { color: this.theme.primaryColor }, color: 'ffffff', align: 'right' } },
      { text: 'P/E (TTM)', options: { bold: true, fill: { color: this.theme.primaryColor }, color: 'ffffff', align: 'right' } },
      { text: 'EV/EBITDA', options: { bold: true, fill: { color: this.theme.primaryColor }, color: 'ffffff', align: 'right' } },
    ];

    const rows: PptxGenJS.TableCell[][] = [headers];

    // Add the subject company first (highlighted)
    if (profile) {
      rows.push([
        { text: safeText(`${profile.companyName || ''} *`), options: { bold: true, fill: { color: 'e8ecef' } } },
        { text: safeText(formatLargeNumber(profile.mktCap)), options: { align: 'right', fill: { color: 'e8ecef' } } },
        { text: safeText(ratios?.peRatioTTM ? formatRatio(ratios.peRatioTTM, 1) : 'N/A'), options: { align: 'right', fill: { color: 'e8ecef' } } },
        { text: safeText(ratios?.enterpriseValueMultipleTTM ? formatRatio(ratios.enterpriseValueMultipleTTM, 1) : 'N/A'), options: { align: 'right', fill: { color: 'e8ecef' } } },
      ]);
    }

    // Add peers
    peers.slice(0, 5).forEach((peer) => {
      rows.push([
        { text: safeText(peer.companyName) },
        { text: safeText(formatLargeNumber(peer.marketCap)), options: { align: 'right' } },
        { text: safeText(peer.peRatio ? formatRatio(peer.peRatio, 1) : 'N/A'), options: { align: 'right' } },
        { text: safeText(peer.evToEbitda ? formatRatio(peer.evToEbitda, 1) : 'N/A'), options: { align: 'right' } },
      ]);
    });

    slide.addTable(validateTableRows(rows), {
      x: 0.5,
      y: 1.2,
      w: 9,
      fontSize: 10,
      fontFace: this.theme.fontFamily.body,
      color: this.theme.textColor,
      border: { type: 'solid', pt: 0.5, color: 'e8ecef' },
      rowH: 0.45,
      colW: [3.5, 2, 1.75, 1.75],
    });

    slide.addText('* Subject company', {
      x: 0.5,
      y: 4.8,
      w: 9,
      h: 0.3,
      fontSize: 9,
      italic: true,
      color: '9ca8b3',
      fontFace: this.theme.fontFamily.body,
    });

    this.addFooter(slide);
  }

  // ============================================
  // Slide 12: Growth Drivers - Dense with Image Areas
  // ============================================
  private addGrowthDrivers(): void {
    const slide = this.pptx.addSlide();
    const profile = this.companyData.profile;

    // Header bar
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.45,
      fill: { color: this.theme.primaryColor },
    });
    slide.addText('Growth Drivers & Business Model', {
      x: 0.3,
      y: 0.08,
      w: 9,
      h: 0.3,
      fontSize: 14,
      bold: true,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.heading,
    });

    // LEFT COLUMN - Business Model
    slide.addShape('rect', {
      x: 0.3,
      y: 0.55,
      w: 4.5,
      h: 0.25,
      fill: { color: 'e8ecef' },
    });
    slide.addText('BUSINESS MODEL & REVENUE DRIVERS', {
      x: 0.3,
      y: 0.57,
      w: 4.5,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    const businessModel = [
      `Industry: ${profile?.industry || 'N/A'}`,
      `Sector: ${profile?.sector || 'N/A'}`,
      '• Primary revenue streams: [Add details]',
      '• Key customer segments: [Add details]',
      '• Geographic breakdown: [Add details]',
      '• Recurring vs one-time revenue: [Add %]',
    ];

    slide.addText(businessModel.join('\n'), {
      x: 0.35,
      y: 0.88,
      w: 4.4,
      h: 1.4,
      fontSize: 8,
      color: this.theme.secondaryColor,
      fontFace: this.theme.fontFamily.body,
      lineSpacingMultiple: 1.3,
    });

    // RIGHT COLUMN - Growth Initiatives
    slide.addShape('rect', {
      x: 5,
      y: 0.55,
      w: 4.5,
      h: 0.25,
      fill: { color: 'e8ecef' },
    });
    slide.addText('GROWTH INITIATIVES & CATALYSTS', {
      x: 5,
      y: 0.57,
      w: 4.5,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    const growth = [
      '• Organic growth: [Market expansion]',
      '• New products/services: [Pipeline]',
      '• M&A strategy: [Acquisition targets]',
      '• Cost optimization: [Margin expansion]',
      '• Digital transformation: [Initiatives]',
      '• Geographic expansion: [New markets]',
    ];

    slide.addText(growth.join('\n'), {
      x: 5.05,
      y: 0.88,
      w: 4.4,
      h: 1.4,
      fontSize: 8,
      color: this.theme.secondaryColor,
      fontFace: this.theme.fontFamily.body,
      lineSpacingMultiple: 1.3,
    });

    // PRODUCT/SERVICE IMAGES - Middle row
    slide.addText('KEY PRODUCTS & SERVICES', {
      x: 0.3,
      y: 2.4,
      w: 9.2,
      h: 0.2,
      fontSize: 7,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    // Three image placeholder boxes
    for (let i = 0; i < 3; i++) {
      const x = 0.3 + (i * 3.1);
      slide.addShape('rect', {
        x,
        y: 2.65,
        w: 2.9,
        h: 1.3,
        fill: { color: 'f0f2f5' },
        line: { color: 'e0e4e8', width: 1 },
      });
      slide.addText(safeText(`[ Product/Service ${i + 1} Image ]`), {
        x,
        y: 3.1,
        w: 2.9,
        h: 0.3,
        fontSize: 8,
        italic: true,
        color: '9ca8b3',
        fontFace: this.theme.fontFamily.body,
        align: 'center',
      });
    }

    // COMPETITIVE ADVANTAGES - Bottom section
    slide.addShape('rect', {
      x: 0.3,
      y: 4.1,
      w: 9.2,
      h: 0.25,
      fill: { color: this.theme.accentColor },
    });
    slide.addText('COMPETITIVE ADVANTAGES & MOATS', {
      x: 0.3,
      y: 4.12,
      w: 9.2,
      h: 0.2,
      fontSize: 8,
      bold: true,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    const advantages = [
      { title: 'Brand/Scale', desc: 'Market leadership position' },
      { title: 'Technology/IP', desc: 'Proprietary technology' },
      { title: 'Network Effects', desc: 'Platform advantages' },
      { title: 'Switching Costs', desc: 'Customer lock-in' },
    ];

    advantages.forEach((adv, i) => {
      const x = 0.3 + (i * 2.35);
      slide.addShape('rect', {
        x,
        y: 4.4,
        w: 2.2,
        h: 0.7,
        fill: { color: 'f5f6f8' },
      });
      slide.addText(adv.title, {
        x,
        y: 4.45,
        w: 2.2,
        h: 0.25,
        fontSize: 8,
        bold: true,
        color: this.theme.textColor,
        fontFace: this.theme.fontFamily.body,
        align: 'center',
      });
      slide.addText(adv.desc, {
        x,
        y: 4.7,
        w: 2.2,
        h: 0.35,
        fontSize: 7,
        color: '6b7c8a',
        fontFace: this.theme.fontFamily.body,
        align: 'center',
      });
    });

    this.addFooter(slide);
  }

  // ============================================
  // Slide 13: Investment Thesis (USER INPUT) - Lazard Style
  // ============================================
  private addInvestmentThesis(): void {
    const slide = this.pptx.addSlide();
    const profile = this.companyData.profile;

    // Header with accent bar
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.08,
      fill: { color: this.theme.accentColor },
    });

    slide.addText('Investment Thesis', {
      x: 0.5,
      y: 0.3,
      w: 7,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.heading,
    });

    // USER INPUT REQUIRED badge
    slide.addShape('rect', {
      x: 7.8,
      y: 0.3,
      w: 1.7,
      h: 0.4,
      fill: { color: 'fef3c7' },
    });
    slide.addText('ACTION REQUIRED', {
      x: 7.8,
      y: 0.35,
      w: 1.7,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: 'b45309',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    // Core thesis box
    slide.addShape('rect', {
      x: 0.5,
      y: 0.9,
      w: 9,
      h: 1.1,
      fill: { color: this.theme.primaryColor },
    });
    slide.addText('CORE THESIS', {
      x: 0.7,
      y: 0.95,
      w: 8.6,
      h: 0.25,
      fontSize: 9,
      color: '9ca8b3',
      fontFace: this.theme.fontFamily.body,
    });

    const thesisText = this.formData.investmentThesis 
      ? this.formData.investmentThesis.split('\n')[0] 
      : `We recommend ${this.formData.rating.toUpperCase()} on ${profile?.companyName || 'the company'} based on [YOUR THESIS HERE]`;
    
    slide.addText(thesisText, {
      x: 0.7,
      y: 1.2,
      w: 8.6,
      h: 0.7,
      fontSize: 12,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.body,
    });

    // Three-column layout for catalysts, evidence, timing
    const sections = [
      {
        title: 'KEY CATALYSTS',
        icon: '▶',
        content: `• Product launches / expansion\n• Earnings momentum\n• Market share gains\n• M&A opportunities`,
      },
      {
        title: 'SUPPORTING EVIDENCE',
        icon: '◆',
        content: `• Financial metrics\n• Competitive positioning\n• Industry tailwinds\n• Management track record`,
      },
      {
        title: 'WHY NOW?',
        icon: '●',
        content: `• Valuation opportunity\n• Near-term catalysts\n• Sentiment inflection\n• Risk/reward favorable`,
      },
    ];

    sections.forEach((section, i) => {
      const x = 0.5 + (i * 3.1);
      
      slide.addShape('rect', {
        x,
        y: 2.15,
        w: 2.9,
        h: 0.35,
        fill: { color: 'e8ecef' },
      });
      slide.addText(section.title, {
        x,
        y: 2.2,
        w: 2.9,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: this.theme.textColor,
        fontFace: this.theme.fontFamily.body,
        align: 'center',
      });

      slide.addShape('rect', {
        x,
        y: 2.5,
        w: 2.9,
        h: 2.2,
        fill: { color: 'f5f6f8' },
      });
      slide.addText(section.content, {
        x: x + 0.15,
        y: 2.6,
        w: 2.6,
        h: 2,
        fontSize: 9,
        color: this.theme.secondaryColor,
        fontFace: this.theme.fontFamily.body,
        lineSpacingMultiple: 1.4,
      });
    });

    // User notes at bottom
    slide.addText('Note: Replace placeholder content with your specific investment thesis, catalysts, and supporting analysis.', {
      x: 0.5,
      y: 4.85,
      w: 9,
      h: 0.3,
      fontSize: 8,
      italic: true,
      color: '9ca8b3',
      fontFace: this.theme.fontFamily.body,
    });

    slide.addNotes('USER ACTION REQUIRED: Replace the placeholder text with your investment thesis. Include your core thesis, catalysts, and supporting evidence.');

    this.addFooter(slide);
  }

  // ============================================
  // Slide 14: Valuation (USER INPUT) - Lazard Style
  // ============================================
  private addValuation(): void {
    const slide = this.pptx.addSlide();
    const profile = this.companyData.profile;
    const ratios = this.companyData.ratiosTTM;

    // Header with accent bar
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.08,
      fill: { color: this.theme.accentColor },
    });

    slide.addText('Valuation Analysis', {
      x: 0.5,
      y: 0.3,
      w: 7,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.heading,
    });

    // USER INPUT badge
    slide.addShape('rect', {
      x: 7.8,
      y: 0.3,
      w: 1.7,
      h: 0.4,
      fill: { color: 'fef3c7' },
    });
    slide.addText('ACTION REQUIRED', {
      x: 7.8,
      y: 0.35,
      w: 1.7,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: 'b45309',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    // Price target summary box
    const currentPrice = Number(profile?.price) || 0;
    const targetPrice = Number(this.formData.targetPrice) || 0;
    const upside = currentPrice > 0 && targetPrice > 0 ? ((targetPrice - currentPrice) / currentPrice * 100) : 0;

    slide.addShape('rect', {
      x: 0.5,
      y: 0.85,
      w: 9,
      h: 0.9,
      fill: { color: this.theme.primaryColor },
    });

    const priceBoxes = [
      { label: 'CURRENT PRICE', value: currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : 'N/A' },
      { label: 'TARGET PRICE', value: targetPrice ? `$${targetPrice.toFixed(2)}` : 'TBD' },
      { label: 'UPSIDE/DOWNSIDE', value: upside ? `${upside >= 0 ? '+' : ''}${upside.toFixed(1)}%` : 'TBD' },
      { label: 'TIME HORIZON', value: `${this.formData.timeHorizon} Months` },
    ];

    priceBoxes.forEach((box, i) => {
      const x = 0.7 + (i * 2.25);
      slide.addText(box.label, {
        x,
        y: 0.95,
        w: 2,
        h: 0.2,
        fontSize: 8,
        color: '9ca8b3',
        fontFace: this.theme.fontFamily.body,
      });
      slide.addText(box.value, {
        x,
        y: 1.15,
        w: 2,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: 'ffffff',
        fontFace: this.theme.fontFamily.body,
      });
    });

    // Three valuation methodology columns
    const methods = [
      {
        title: 'DCF ANALYSIS',
        items: [
          'Revenue Growth: [X]% CAGR',
          'Terminal Growth: [X]%',
          'WACC: [X]%',
          'Implied Value: $[XX]',
        ],
      },
      {
        title: 'COMPARABLE COMPANIES',
        items: [
          `P/E: ${ratios?.peRatioTTM ? formatRatio(ratios.peRatioTTM, 1) : '[X]x'}`,
          `EV/EBITDA: ${ratios?.enterpriseValueMultipleTTM ? formatRatio(ratios.enterpriseValueMultipleTTM, 1) : '[X]x'}`,
          'Peer Median: [X]x',
          'Implied Range: $[XX]-$[XX]',
        ],
      },
      {
        title: 'PRECEDENT TRANSACTIONS',
        items: [
          'Transaction Multiple: [X]x',
          'Premium Paid: [X]%',
          'Control Premium: [X]%',
          'Implied Value: $[XX]',
        ],
      },
    ];

    methods.forEach((method, i) => {
      const x = 0.5 + (i * 3.1);
      
      slide.addShape('rect', {
        x,
        y: 1.95,
        w: 2.9,
        h: 0.35,
        fill: { color: this.theme.accentColor },
      });
      slide.addText(method.title, {
        x,
        y: 2,
        w: 2.9,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: 'ffffff',
        fontFace: this.theme.fontFamily.body,
        align: 'center',
      });

      slide.addShape('rect', {
        x,
        y: 2.3,
        w: 2.9,
        h: 1.8,
        fill: { color: 'f5f6f8' },
      });

      method.items.forEach((item, j) => {
        slide.addText(safeText(`• ${item}`), {
          x: x + 0.1,
          y: 2.4 + (j * 0.4),
          w: 2.7,
          h: 0.35,
          fontSize: 9,
          color: this.theme.secondaryColor,
          fontFace: this.theme.fontFamily.body,
        });
      });
    });

    // Valuation football field placeholder
    slide.addText('VALUATION SUMMARY', {
      x: 0.5,
      y: 4.25,
      w: 9,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: '6b7c8a',
      fontFace: this.theme.fontFamily.body,
    });

    slide.addShape('rect', {
      x: 0.5,
      y: 4.5,
      w: 9,
      h: 0.4,
      fill: { color: 'e8ecef' },
    });
    slide.addText('[Add valuation range football field chart]', {
      x: 0.5,
      y: 4.55,
      w: 9,
      h: 0.3,
      fontSize: 9,
      italic: true,
      color: '9ca8b3',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    slide.addNotes('USER ACTION REQUIRED: Replace placeholder text with your valuation analysis. Include DCF assumptions, comparable multiples, and target price derivation.');

    this.addFooter(slide);
  }

  // ============================================
  // Slide 15: Risks & Mitigants (USER INPUT) - Lazard Style
  // ============================================
  private addRisksAndMitigants(): void {
    const slide = this.pptx.addSlide();

    // Header with accent bar
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.08,
      fill: { color: this.theme.accentColor },
    });

    slide.addText('Risks & Mitigants', {
      x: 0.5,
      y: 0.3,
      w: 7,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.heading,
    });

    // USER INPUT badge
    slide.addShape('rect', {
      x: 7.8,
      y: 0.3,
      w: 1.7,
      h: 0.4,
      fill: { color: 'fef3c7' },
    });
    slide.addText('ACTION REQUIRED', {
      x: 7.8,
      y: 0.35,
      w: 1.7,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: 'b45309',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    // Risk table header
    slide.addShape('rect', {
      x: 0.5,
      y: 0.85,
      w: 4.3,
      h: 0.4,
      fill: { color: 'dc2626' },
    });
    slide.addText('KEY RISKS', {
      x: 0.5,
      y: 0.9,
      w: 4.3,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    slide.addShape('rect', {
      x: 4.9,
      y: 0.85,
      w: 4.6,
      h: 0.4,
      fill: { color: '16a34a' },
    });
    slide.addText('MITIGATING FACTORS', {
      x: 4.9,
      y: 0.9,
      w: 4.6,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: 'ffffff',
      fontFace: this.theme.fontFamily.body,
      align: 'center',
    });

    // Risk rows
    const risks = [
      {
        category: 'MARKET / MACRO',
        risk: 'Economic downturn, interest rate changes, market volatility',
        mitigant: 'Diversified revenue, strong balance sheet, defensive positioning',
      },
      {
        category: 'COMPETITIVE',
        risk: 'New entrants, pricing pressure, technology disruption',
        mitigant: 'Strong moat, brand loyalty, R&D investment, scale advantages',
      },
      {
        category: 'EXECUTION',
        risk: 'Management changes, integration risks, operational issues',
        mitigant: 'Experienced team, track record, operational improvements',
      },
      {
        category: 'REGULATORY',
        risk: 'Policy changes, compliance costs, legal challenges',
        mitigant: 'Proactive compliance, regulatory expertise, diversification',
      },
      {
        category: 'VALUATION',
        risk: 'Multiple compression, earnings miss, sentiment shift',
        mitigant: 'Attractive entry point, catalyst visibility, margin of safety',
      },
    ];

    risks.forEach((item, i) => {
      const y = 1.3 + (i * 0.72);
      
      // Category label
      slide.addShape('rect', {
        x: 0.5,
        y,
        w: 4.3,
        h: 0.68,
        fill: { color: i % 2 === 0 ? 'f5f6f8' : 'ffffff' },
      });
      slide.addShape('rect', {
        x: 4.9,
        y,
        w: 4.6,
        h: 0.68,
        fill: { color: i % 2 === 0 ? 'f5f6f8' : 'ffffff' },
      });

      // Category badge
      slide.addShape('rect', {
        x: 0.55,
        y: y + 0.05,
        w: 1.4,
        h: 0.25,
        fill: { color: 'e8ecef' },
      });
      slide.addText(item.category, {
        x: 0.55,
        y: y + 0.07,
        w: 1.4,
        h: 0.2,
        fontSize: 7,
        bold: true,
        color: '6b7c8a',
        fontFace: this.theme.fontFamily.body,
        align: 'center',
      });

      // Risk text
      slide.addText(item.risk, {
        x: 0.6,
        y: y + 0.32,
        w: 4,
        h: 0.35,
        fontSize: 8,
        color: this.theme.secondaryColor,
        fontFace: this.theme.fontFamily.body,
      });

      // Mitigant text
      slide.addText(safeText(`✓ ${item.mitigant}`), {
        x: 5,
        y: y + 0.15,
        w: 4.4,
        h: 0.45,
        fontSize: 8,
        color: this.theme.secondaryColor,
        fontFace: this.theme.fontFamily.body,
      });
    });

    // Note at bottom
    slide.addText('Note: Replace placeholder risks and mitigants with company-specific analysis', {
      x: 0.5,
      y: 4.95,
      w: 9,
      h: 0.2,
      fontSize: 8,
      italic: true,
      color: '9ca8b3',
      fontFace: this.theme.fontFamily.body,
    });

    slide.addNotes('USER ACTION REQUIRED: Replace placeholder text with specific risks to your investment thesis and how they can be mitigated.');

    this.addFooter(slide);
  }

  // ============================================
  // Slide 16: Appendix
  // ============================================
  private addAppendix(): void {
    const slide = this.pptx.addSlide();

    slide.addText('Appendix', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: this.theme.textColor,
      fontFace: this.theme.fontFamily.heading,
    });

    slide.addText('Data Sources & Disclaimers', {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: this.theme.accentColor,
      fontFace: this.theme.fontFamily.heading,
    });

    const sources = [
      '• Financial data: Financial Modeling Prep (FMP) API',
      '• Stock prices: FMP historical price data',
      '• Company information: FMP company profiles',
      `• Generated: ${this.generatedDate}`,
      '',
      'Disclaimer:',
      'This presentation was generated using publicly available data for informational purposes only.',
      'Users must verify all data and assumptions before making investment decisions.',
      'This is NOT investment advice. Past performance does not guarantee future results.',
      '',
      'Additional resources to consider:',
      '• Company SEC filings (10-K, 10-Q)',
      '• Earnings call transcripts',
      '• Industry reports',
      '• Sell-side research',
    ];

    slide.addText(sources.join('\n'), {
      x: 0.5,
      y: 1.7,
      w: 9,
      h: 3.5,
      fontSize: 10,
      color: this.theme.secondaryColor,
      fontFace: this.theme.fontFamily.body,
      lineSpacingMultiple: 1.3,
    });

    this.addFooter(slide);
  }

  // ============================================
  // Build Complete Deck
  // ============================================
  public async build(): Promise<Blob> {
    // Add all slides in order with error tracking
    const slides = [
      { name: 'Cover', fn: () => this.addCoverSlide() },
      { name: 'TOC', fn: () => this.addTableOfContents() },
      { name: 'InvestmentSummary', fn: () => this.addInvestmentSummary() },
      { name: 'CompanyOverview', fn: () => this.addCompanyOverview() },
      { name: 'IndustryOverview', fn: () => this.addIndustryOverview() },
      { name: 'KeyMetrics', fn: () => this.addKeyMetrics() },
      { name: 'FinancialSummary', fn: () => this.addFinancialSummary() },
      { name: 'PeersComps', fn: () => this.addPeersComps() },
      { name: 'GrowthDrivers', fn: () => this.addGrowthDrivers() },
      { name: 'InvestmentThesis', fn: () => this.addInvestmentThesis() },
      { name: 'Valuation', fn: () => this.addValuation() },
      { name: 'RisksAndMitigants', fn: () => this.addRisksAndMitigants() },
      { name: 'Appendix', fn: () => this.addAppendix() },
    ];

    for (const slide of slides) {
      try {
        console.log(`[PPTX] Adding slide: ${slide.name}`);
        slide.fn();
      } catch (error) {
        console.error(`[PPTX] ERROR in slide ${slide.name}:`, error);
        throw new Error(`Failed on slide "${slide.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Add chart slides
    try {
      const revenueChart = this.charts.find((c) => c.type === 'revenueGrowth');
      if (revenueChart) {
        console.log('[PPTX] Adding chart: revenueGrowth');
        this.addChartSlide(revenueChart);
      }

      const priceChart = this.charts.find((c) => c.type === 'pricePerformance');
      if (priceChart) {
        console.log('[PPTX] Adding chart: pricePerformance');
        this.addChartSlide(priceChart);
      }

      const marketShareChart = this.charts.find((c) => c.type === 'marketShare');
      if (marketShareChart) {
        console.log('[PPTX] Adding chart: marketShare');
        this.addChartSlide(marketShareChart);
      }
    } catch (error) {
      console.error('[PPTX] ERROR adding chart slide:', error);
      throw new Error(`Failed on chart slide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Generate blob
    try {
      console.log('[PPTX] Generating blob...');
      const blob = await this.pptx.write({ outputType: 'blob' }) as Blob;
      console.log('[PPTX] Blob generated successfully');
      return blob;
    } catch (error) {
      console.error('[PPTX] ERROR generating blob:', error);
      throw new Error(`Failed generating PowerPoint file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============================================
// Export Helper
// ============================================

export async function generatePitchDeck(
  companyData: CompanyData,
  formData: FormData,
  charts: ChartExportResult[]
): Promise<Blob> {
  const builder = new PitchDeckBuilder(companyData, formData, charts);
  return builder.build();
}





