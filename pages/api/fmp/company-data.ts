/**
 * Aggregated Company Data Endpoint
 * Fetches all necessary data for a company in a single request
 * Uses FMP as primary source, Yahoo Finance as fallback
 * 
 * Usage: /api/fmp/company-data?symbol=AAPL
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchAllCompanyData,
} from '@/lib/fmpClient';
import { fetchYahooCompanyData } from '@/lib/yahooClient';
import { CompanyData, APIError } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CompanyData | { error: string; message: string; source?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', message: '' });
  }

  const { symbol } = req.query;
  
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ 
      error: 'Symbol required',
      message: 'Please provide a stock symbol'
    });
  }

  const upperSymbol = symbol.toUpperCase();
  const apiKey = process.env.FMP_API_KEY;
  
  // Try FMP first if API key is configured
  if (apiKey) {
    try {
      console.log(`[Company Data API] Trying FMP for: ${upperSymbol}`);
      
      const companyData = await fetchAllCompanyData(upperSymbol);
      
      if (companyData.profile) {
        console.log(`[Company Data API] FMP success for: ${upperSymbol}`);
        return res.status(200).json(companyData);
      }
    } catch (error) {
      const apiError = error as APIError;
      console.log(`[Company Data API] FMP failed: ${apiError.code} - ${apiError.message}`);
      
      // Only fall back to Yahoo for rate limits or network issues
      if (apiError.code !== 'RATE_LIMIT' && apiError.code !== 'NETWORK_ERROR' && apiError.code !== 'TIMEOUT') {
        // For auth errors or not found, don't try Yahoo
        if (apiError.code === 'AUTH_ERROR') {
          return res.status(401).json({
            error: 'Invalid API key',
            message: apiError.message,
          });
        }
        if (apiError.code === 'NOT_FOUND') {
          // Still try Yahoo as company might exist there
          console.log(`[Company Data API] Company not found in FMP, trying Yahoo...`);
        }
      }
      
      // Fall through to Yahoo Finance
      console.log(`[Company Data API] Falling back to Yahoo Finance...`);
    }
  }

  // Try Yahoo Finance as fallback
  try {
    console.log(`[Company Data API] Trying Yahoo Finance for: ${upperSymbol}`);
    
    const companyData = await fetchYahooCompanyData(upperSymbol);
    
    if (companyData.profile) {
      console.log(`[Company Data API] Yahoo Finance success for: ${upperSymbol}`);
      // Add a note that data came from Yahoo
      return res.status(200).json(companyData);
    }
    
    return res.status(404).json({
      error: 'Company not found',
      message: `No data found for symbol: ${upperSymbol}`,
    });
  } catch (error) {
    console.error('[Company Data API] Yahoo Finance also failed:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch company data',
      message: `Could not fetch data for ${upperSymbol} from any source. Please check the symbol and try again.`,
    });
  }
}





