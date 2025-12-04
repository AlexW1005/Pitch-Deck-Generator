/**
 * Yahoo Finance Client
 * Backup data source when FMP rate limits are reached
 */

import yahooFinance from 'yahoo-finance2';
import {
  FMPCompanyProfile,
  FMPIncomeStatement,
  FMPHistoricalPrice,
  FMPRatiosTTM,
  CompanyData,
  PeerData,
} from './types';

/**
 * Convert Yahoo Finance quote to FMP-like profile
 */
function convertToFMPProfile(quote: any, summary: any): FMPCompanyProfile {
  return {
    symbol: quote.symbol || '',
    companyName: quote.longName || quote.shortName || '',
    price: quote.regularMarketPrice || 0,
    mktCap: quote.marketCap || 0,
    beta: quote.beta || 0,
    volAvg: quote.averageVolume || 0,
    lastDiv: quote.trailingAnnualDividendRate || 0,
    range: quote.fiftyTwoWeekRange || '',
    changes: quote.regularMarketChange || 0,
    exchange: quote.exchange || '',
    exchangeShortName: quote.exchange || '',
    industry: summary?.assetProfile?.industry || quote.industry || '',
    sector: summary?.assetProfile?.sector || quote.sector || '',
    website: summary?.assetProfile?.website || '',
    description: summary?.assetProfile?.longBusinessSummary || '',
    ceo: summary?.assetProfile?.companyOfficers?.[0]?.name || '',
    country: summary?.assetProfile?.country || 'US',
    city: summary?.assetProfile?.city || '',
    state: summary?.assetProfile?.state || '',
    fullTimeEmployees: summary?.assetProfile?.fullTimeEmployees?.toString() || '',
    image: `https://logo.clearbit.com/${quote.symbol?.toLowerCase()}.com`,
    ipoDate: '',
    currency: quote.currency || 'USD',
    cik: '',
    isin: '',
    cusip: '',
    address: summary?.assetProfile?.address1 || '',
    phone: summary?.assetProfile?.phone || '',
    zip: summary?.assetProfile?.zip || '',
    dcfDiff: 0,
    dcf: 0,
    isEtf: quote.quoteType === 'ETF',
    isActivelyTrading: true,
    isAdr: false,
    isFund: quote.quoteType === 'MUTUALFUND',
    defaultImage: false,
  };
}

/**
 * Convert Yahoo Finance financials to FMP-like income statements
 */
function convertToFMPIncomeStatements(financials: any): FMPIncomeStatement[] {
  if (!financials?.incomeStatementHistory?.incomeStatementHistory) {
    return [];
  }

  return financials.incomeStatementHistory.incomeStatementHistory.map((stmt: any) => {
    const date = new Date(stmt.endDate);
    return {
      date: date.toISOString().split('T')[0],
      symbol: '',
      reportedCurrency: 'USD',
      cik: '',
      fillingDate: '',
      acceptedDate: '',
      calendarYear: date.getFullYear().toString(),
      period: 'FY',
      revenue: stmt.totalRevenue || 0,
      costOfRevenue: stmt.costOfRevenue || 0,
      grossProfit: stmt.grossProfit || 0,
      grossProfitRatio: stmt.grossProfit && stmt.totalRevenue ? stmt.grossProfit / stmt.totalRevenue : 0,
      researchAndDevelopmentExpenses: stmt.researchDevelopment || 0,
      generalAndAdministrativeExpenses: stmt.generalExpense || 0,
      sellingAndMarketingExpenses: stmt.sellingMarketingExpense || 0,
      sellingGeneralAndAdministrativeExpenses: stmt.sellingGeneralAdministrative || 0,
      otherExpenses: stmt.otherOperatingExpenses || 0,
      operatingExpenses: stmt.totalOperatingExpenses || 0,
      costAndExpenses: (stmt.costOfRevenue || 0) + (stmt.totalOperatingExpenses || 0),
      interestIncome: stmt.interestIncome || 0,
      interestExpense: stmt.interestExpense || 0,
      depreciationAndAmortization: 0,
      ebitda: stmt.ebit ? stmt.ebit + (stmt.depreciation || 0) : 0,
      ebitdaratio: 0,
      operatingIncome: stmt.operatingIncome || 0,
      operatingIncomeRatio: stmt.operatingIncome && stmt.totalRevenue ? stmt.operatingIncome / stmt.totalRevenue : 0,
      totalOtherIncomeExpensesNet: stmt.totalOtherIncomeExpenseNet || 0,
      incomeBeforeTax: stmt.incomeBeforeTax || 0,
      incomeBeforeTaxRatio: stmt.incomeBeforeTax && stmt.totalRevenue ? stmt.incomeBeforeTax / stmt.totalRevenue : 0,
      incomeTaxExpense: stmt.incomeTaxExpense || 0,
      netIncome: stmt.netIncome || 0,
      netIncomeRatio: stmt.netIncome && stmt.totalRevenue ? stmt.netIncome / stmt.totalRevenue : 0,
      eps: stmt.dilutedEPS || 0,
      epsdiluted: stmt.dilutedEPS || 0,
      weightedAverageShsOut: 0,
      weightedAverageShsOutDil: 0,
      link: '',
      finalLink: '',
    };
  });
}

/**
 * Convert Yahoo Finance historical prices
 */
function convertToFMPHistoricalPrices(history: any[]): FMPHistoricalPrice[] {
  return history.map((item: any) => ({
    date: new Date(item.date).toISOString().split('T')[0],
    open: item.open || 0,
    high: item.high || 0,
    low: item.low || 0,
    close: item.close || 0,
    adjClose: item.adjClose || item.close || 0,
    volume: item.volume || 0,
    unadjustedVolume: item.volume || 0,
    change: 0,
    changePercent: 0,
    vwap: 0,
    label: '',
    changeOverTime: 0,
  }));
}

/**
 * Create ratios from Yahoo Finance data
 */
function convertToFMPRatios(quote: any, summary: any): FMPRatiosTTM {
  return {
    dividendYielTTM: quote.trailingAnnualDividendYield || 0,
    dividendYielPercentageTTM: (quote.trailingAnnualDividendYield || 0) * 100,
    peRatioTTM: quote.trailingPE || summary?.summaryDetail?.trailingPE || 0,
    pegRatioTTM: quote.pegRatio || 0,
    payoutRatioTTM: summary?.summaryDetail?.payoutRatio || 0,
    currentRatioTTM: summary?.financialData?.currentRatio || 0,
    quickRatioTTM: summary?.financialData?.quickRatio || 0,
    cashRatioTTM: 0,
    daysOfSalesOutstandingTTM: 0,
    daysOfInventoryOutstandingTTM: 0,
    operatingCycleTTM: 0,
    daysOfPayablesOutstandingTTM: 0,
    cashConversionCycleTTM: 0,
    grossProfitMarginTTM: summary?.financialData?.grossMargins || 0,
    operatingProfitMarginTTM: summary?.financialData?.operatingMargins || 0,
    pretaxProfitMarginTTM: 0,
    netProfitMarginTTM: summary?.financialData?.profitMargins || 0,
    effectiveTaxRateTTM: 0,
    returnOnAssetsTTM: summary?.financialData?.returnOnAssets || 0,
    returnOnEquityTTM: summary?.financialData?.returnOnEquity || 0,
    returnOnCapitalEmployedTTM: 0,
    netIncomePerEBTTTM: 0,
    ebtPerEbitTTM: 0,
    ebitPerRevenueTTM: 0,
    debtRatioTTM: summary?.financialData?.debtToEquity ? summary.financialData.debtToEquity / 100 : 0,
    debtEquityRatioTTM: summary?.financialData?.debtToEquity || 0,
    longTermDebtToCapitalizationTTM: 0,
    totalDebtToCapitalizationTTM: 0,
    interestCoverageTTM: 0,
    cashFlowToDebtRatioTTM: 0,
    companyEquityMultiplierTTM: 0,
    receivablesTurnoverTTM: 0,
    payablesTurnoverTTM: 0,
    inventoryTurnoverTTM: 0,
    fixedAssetTurnoverTTM: 0,
    assetTurnoverTTM: 0,
    operatingCashFlowPerShareTTM: 0,
    freeCashFlowPerShareTTM: summary?.financialData?.freeCashflow ? summary.financialData.freeCashflow / (quote.sharesOutstanding || 1) : 0,
    cashPerShareTTM: 0,
    operatingCashFlowSalesRatioTTM: 0,
    freeCashFlowOperatingCashFlowRatioTTM: 0,
    cashFlowCoverageRatiosTTM: 0,
    shortTermCoverageRatiosTTM: 0,
    capitalExpenditureCoverageRatioTTM: 0,
    dividendPaidAndCapexCoverageRatioTTM: 0,
    priceBookValueRatioTTM: quote.priceToBook || 0,
    priceToBookRatioTTM: quote.priceToBook || 0,
    priceToSalesRatioTTM: quote.priceToSalesTrailing12Months || 0,
    priceEarningsRatioTTM: quote.trailingPE || 0,
    priceToFreeCashFlowsRatioTTM: 0,
    priceToOperatingCashFlowsRatioTTM: 0,
    priceCashFlowRatioTTM: 0,
    priceEarningsToGrowthRatioTTM: quote.pegRatio || 0,
    priceSalesRatioTTM: quote.priceToSalesTrailing12Months || 0,
    dividendYieldTTM: quote.trailingAnnualDividendYield || 0,
    enterpriseValueMultipleTTM: quote.enterpriseToEbitda || 0,
    priceFairValueTTM: 0,
  };
}

/**
 * Fetch all company data from Yahoo Finance
 */
export async function fetchYahooCompanyData(symbol: string): Promise<CompanyData> {
  const upperSymbol = symbol.toUpperCase();
  
  console.log(`[Yahoo Finance] Fetching data for: ${upperSymbol}`);
  
  try {
    // Fetch quote first
    const quote: any = await (yahooFinance as any).quote(upperSymbol);

    if (!quote) {
      throw new Error(`Company not found: ${upperSymbol}`);
    }

    // Try to get additional summary data
    let summary: any = null;
    try {
      summary = await (yahooFinance as any).quoteSummary(upperSymbol, {
        modules: ['assetProfile', 'summaryDetail', 'financialData'],
      });
    } catch {
      console.log('[Yahoo Finance] Could not fetch summary, continuing with quote data only');
    }

    // Try to get historical prices
    let history: any[] = [];
    try {
      history = await (yahooFinance as any).historical(upperSymbol, {
        period1: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), // 5 years ago
        period2: new Date(),
      });
    } catch {
      console.log('[Yahoo Finance] Could not fetch historical prices');
    }

    const profile = convertToFMPProfile(quote, summary);
    const incomeStatements: FMPIncomeStatement[] = [];
    const historicalPrices = convertToFMPHistoricalPrices(history || []);
    const ratiosTTM = convertToFMPRatios(quote, summary);

    // Get similar stocks as peers
    const peers: string[] = [];
    const peersData: PeerData[] = [];

    return {
      profile,
      incomeStatements,
      balanceSheets: [],
      cashFlowStatements: [],
      ratiosTTM,
      keyMetrics: [],
      enterpriseValues: [],
      historicalPrices,
      peers,
      peersData,
    };
  } catch (error) {
    console.error('[Yahoo Finance] Error:', error);
    throw error;
  }
}

/**
 * Search companies using Yahoo Finance
 */
export async function searchYahooCompanies(query: string): Promise<{ symbol: string; name: string }[]> {
  try {
    const results: any = await (yahooFinance as any).search(query);
    return (results.quotes || [])
      .filter((q: any) => q.quoteType === 'EQUITY')
      .slice(0, 10)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
      }));
  } catch {
    return [];
  }
}

