/**
 * FMP (Financial Modeling Prep) API Client
 * Server-side wrapper with caching for FMP API calls
 */

import axios, { AxiosError } from 'axios';
import {
  FMPCompanyProfile,
  FMPIncomeStatement,
  FMPBalanceSheet,
  FMPCashFlowStatement,
  FMPRatiosTTM,
  FMPKeyMetrics,
  FMPEnterpriseValue,
  FMPHistoricalPriceResponse,
  FMPSearchResult,
  CompanyData,
  PeerData,
  APIError,
} from './types';

const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
// Longer cache to reduce API calls (free tier has strict limits)
const CACHE_DURATION_MS = (parseInt(process.env.CACHE_DURATION_MINUTES || '60', 10)) * 60 * 1000;

/**
 * Get cached data or fetch fresh
 */
async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log(`[FMP Cache] Hit: ${cacheKey}`);
    return cached.data;
  }
  
  console.log(`[FMP Cache] Miss: ${cacheKey}`);
  const data = await fetchFn();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error('FMP_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Make API request to FMP (new stable API format)
 */
async function fmpRequest<T>(endpoint: string, params: Record<string, string | number> = {}, allowEmpty: boolean = false): Promise<T> {
  const apiKey = getApiKey();
  const url = `${FMP_BASE_URL}${endpoint}`;
  
  try {
    const response = await axios.get(url, {
      params: {
        ...params,
        apikey: apiKey,
      },
      timeout: 15000,
    });
    
    // New stable API wraps data in { value: [...], Count: N } format
    const data = response.data;
    if (data && typeof data === 'object' && 'value' in data) {
      return data.value as T;
    }
    
    // Some endpoints return data directly
    return data as T;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    
    if (axiosError.response) {
      const status = axiosError.response.status;
      const message = axiosError.response.data?.message || axiosError.message;
      
      if (status === 401) {
        throw createAPIError('Invalid API key. Please check your FMP_API_KEY.', 'AUTH_ERROR');
      }
      if (status === 403) {
        // For free tier, return empty data instead of throwing
        console.log(`[FMP] 403 on ${endpoint} - free tier limitation, returning empty`);
        if (allowEmpty) {
          return [] as unknown as T;
        }
        throw createAPIError('API access forbidden. Your plan may not include this endpoint.', 'FORBIDDEN');
      }
      if (status === 429) {
        throw createAPIError('API rate limit exceeded. Please try again later.', 'RATE_LIMIT');
      }
      
      throw createAPIError(`API error: ${message}`, 'API_ERROR');
    }
    
    if (axiosError.code === 'ECONNABORTED') {
      throw createAPIError('Request timeout. The API is taking too long to respond.', 'TIMEOUT');
    }
    
    throw createAPIError('Network error. Please check your connection.', 'NETWORK_ERROR');
  }
}

/**
 * Create a standardized API error
 */
function createAPIError(message: string, code: string): APIError {
  return { message, code };
}

// ============================================
// FMP API Endpoints
// ============================================

/**
 * Search for companies by name or ticker
 */
export async function searchCompanies(query: string): Promise<FMPSearchResult[]> {
  const cacheKey = `search:${query.toLowerCase()}`;
  return getCachedOrFetch(cacheKey, () =>
    fmpRequest<FMPSearchResult[]>('/search', { query, limit: 10 })
  );
}

/**
 * Get company profile using new stable API
 */
export async function getCompanyProfile(symbol: string): Promise<FMPCompanyProfile | null> {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = `profile:${upperSymbol}`;
  
  const data = await getCachedOrFetch(cacheKey, () =>
    fmpRequest<FMPCompanyProfile[]>(`/profile`, { symbol: upperSymbol })
  );
  return data?.[0] || null;
}

/**
 * Get income statements (last N years) - new stable API
 */
export async function getIncomeStatements(symbol: string, limit: number = 5): Promise<FMPIncomeStatement[]> {
  const cacheKey = `income:${symbol.toUpperCase()}:${limit}`;
  return getCachedOrFetch(cacheKey, () =>
    fmpRequest<FMPIncomeStatement[]>(`/income-statement`, { symbol: symbol.toUpperCase(), limit })
  );
}

/**
 * Get balance sheet statements - new stable API
 */
export async function getBalanceSheets(symbol: string, limit: number = 5): Promise<FMPBalanceSheet[]> {
  const cacheKey = `balance:${symbol.toUpperCase()}:${limit}`;
  return getCachedOrFetch(cacheKey, () =>
    fmpRequest<FMPBalanceSheet[]>(`/balance-sheet-statement`, { symbol: symbol.toUpperCase(), limit })
  );
}

/**
 * Get cash flow statements - new stable API
 */
export async function getCashFlowStatements(symbol: string, limit: number = 5): Promise<FMPCashFlowStatement[]> {
  const cacheKey = `cashflow:${symbol.toUpperCase()}:${limit}`;
  return getCachedOrFetch(cacheKey, () =>
    fmpRequest<FMPCashFlowStatement[]>(`/cash-flow-statement`, { symbol: symbol.toUpperCase(), limit })
  );
}

/**
 * Get TTM ratios - new stable API
 */
export async function getRatiosTTM(symbol: string): Promise<FMPRatiosTTM | null> {
  const cacheKey = `ratios:${symbol.toUpperCase()}`;
  const data = await getCachedOrFetch(cacheKey, () =>
    fmpRequest<FMPRatiosTTM[]>(`/ratios-ttm`, { symbol: symbol.toUpperCase() })
  );
  return data?.[0] || null;
}

/**
 * Get key metrics - new stable API
 */
export async function getKeyMetrics(symbol: string, limit: number = 5): Promise<FMPKeyMetrics[]> {
  const cacheKey = `metrics:${symbol.toUpperCase()}:${limit}`;
  return getCachedOrFetch(cacheKey, () =>
    fmpRequest<FMPKeyMetrics[]>(`/key-metrics`, { symbol: symbol.toUpperCase(), limit })
  );
}

/**
 * Get enterprise values - new stable API
 */
export async function getEnterpriseValues(symbol: string, limit: number = 5): Promise<FMPEnterpriseValue[]> {
  const cacheKey = `ev:${symbol.toUpperCase()}:${limit}`;
  return getCachedOrFetch(cacheKey, () =>
    fmpRequest<FMPEnterpriseValue[]>(`/enterprise-values`, { symbol: symbol.toUpperCase(), limit })
  );
}

/**
 * Get historical prices - new stable API
 */
export async function getHistoricalPrices(
  symbol: string,
  timeseries: number = 1250
): Promise<FMPHistoricalPriceResponse | null> {
  const cacheKey = `prices:${symbol.toUpperCase()}:${timeseries}`;
  return getCachedOrFetch(cacheKey, () =>
    fmpRequest<FMPHistoricalPriceResponse>(`/historical-price-eod/full`, {
      symbol: symbol.toUpperCase(),
    })
  );
}

/**
 * Get company peers - new stable API
 */
export async function getCompanyPeers(symbol: string): Promise<string[]> {
  const cacheKey = `peers:${symbol.toUpperCase()}`;
  const data = await getCachedOrFetch(cacheKey, () =>
    fmpRequest<string[]>(`/stock-peers`, { symbol: symbol.toUpperCase() }, true)
  );
  return data || [];
}

/**
 * Get peer data with key metrics for comparison
 */
export async function getPeerData(peerSymbols: string[]): Promise<PeerData[]> {
  const peerDataPromises = peerSymbols.slice(0, 5).map(async (symbol) => {
    try {
      const [profile, ratios] = await Promise.all([
        getCompanyProfile(symbol),
        getRatiosTTM(symbol),
      ]);

      if (!profile) return null;

      return {
        symbol,
        companyName: profile.companyName,
        marketCap: profile.mktCap,
        peRatio: ratios?.peRatioTTM || null,
        evToEbitda: ratios?.enterpriseValueMultipleTTM || null,
        revenueGrowth: null, // Would need to calculate from income statements
      } as PeerData;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(peerDataPromises);
  return results.filter((p): p is PeerData => p !== null);
}

// ============================================
// Aggregated Data Fetching
// ============================================

/**
 * Safe fetch wrapper that returns null/empty on 403 errors (free tier limitations)
 */
async function safeFetch<T>(fetchFn: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await fetchFn();
  } catch (error) {
    const apiError = error as APIError;
    if (apiError.code === 'FORBIDDEN' || apiError.message?.includes('403')) {
      console.log('[FMP] Endpoint not available on free tier, skipping...');
      return defaultValue;
    }
    throw error;
  }
}

/**
 * Fetch all company data needed for the pitch deck
 * Handles free tier limitations gracefully
 */
export async function fetchAllCompanyData(symbol: string): Promise<CompanyData> {
  const upperSymbol = symbol.toUpperCase();

  // First, fetch the profile - this is essential and available on free tier
  const profile = await getCompanyProfile(upperSymbol);
  
  if (!profile) {
    throw createAPIError(`Company not found: ${upperSymbol}`, 'NOT_FOUND');
  }

  // Fetch remaining data in parallel, with graceful fallbacks for free tier
  const [
    incomeStatements,
    balanceSheets,
    cashFlowStatements,
    ratiosTTM,
    keyMetrics,
    enterpriseValues,
    historicalPricesResponse,
    peers,
  ] = await Promise.all([
    safeFetch(() => getIncomeStatements(upperSymbol, 5), []),
    safeFetch(() => getBalanceSheets(upperSymbol, 5), []),
    safeFetch(() => getCashFlowStatements(upperSymbol, 5), []),
    safeFetch(() => getRatiosTTM(upperSymbol), null),
    safeFetch(() => getKeyMetrics(upperSymbol, 5), []),
    safeFetch(() => getEnterpriseValues(upperSymbol, 5), []),
    safeFetch(() => getHistoricalPrices(upperSymbol, 1250), null),
    safeFetch(() => getCompanyPeers(upperSymbol), []),
  ]);

  // Fetch peer data separately (depends on peers list)
  const peersData = peers.length > 0 ? await safeFetch(() => getPeerData(peers), []) : [];

  return {
    profile,
    incomeStatements,
    balanceSheets,
    cashFlowStatements,
    ratiosTTM,
    keyMetrics,
    enterpriseValues,
    historicalPrices: historicalPricesResponse?.historical || [],
    peers,
    peersData,
  };
}

// ============================================
// Data Processing Utilities
// ============================================

/**
 * Calculate revenue growth rates from income statements
 */
export function calculateRevenueGrowth(incomeStatements: FMPIncomeStatement[]): { year: string; growth: number }[] {
  const sorted = [...incomeStatements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const growthRates: { year: string; growth: number }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prevRevenue = sorted[i - 1].revenue;
    const currRevenue = sorted[i].revenue;
    
    if (prevRevenue > 0) {
      const growth = ((currRevenue - prevRevenue) / prevRevenue) * 100;
      growthRates.push({
        year: sorted[i].calendarYear,
        growth: Math.round(growth * 10) / 10,
      });
    }
  }

  return growthRates;
}

/**
 * Condense company description to max words
 */
export function condenseDescription(description: string, maxWords: number = 40): string {
  const words = description.split(/\s+/);
  if (words.length <= maxWords) return description;
  
  const truncated = words.slice(0, maxWords).join(' ');
  return truncated + '...';
}

/**
 * Format large numbers for display
 */
export function formatLargeNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format ratio
 */
export function formatRatio(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return `${value.toFixed(decimals)}x`;
}





