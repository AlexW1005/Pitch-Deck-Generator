/**
 * Aggregated Company Data Endpoint
 * Fetches all necessary data for a company in a single request
 * 
 * Usage: /api/fmp/company-data?symbol=AAPL
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  fetchAllCompanyData,
} from '@/lib/fmpClient';
import { CompanyData, APIError } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CompanyData | { error: string; message: string }>
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

  const apiKey = process.env.FMP_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key not configured',
      message: 'Please set FMP_API_KEY in your environment variables'
    });
  }

  try {
    console.log(`[Company Data API] Fetching data for: ${symbol}`);
    
    const companyData = await fetchAllCompanyData(symbol.toUpperCase());
    
    // Check if we got a valid profile
    if (!companyData.profile) {
      return res.status(404).json({
        error: 'Company not found',
        message: `No data found for symbol: ${symbol.toUpperCase()}`,
      });
    }

    return res.status(200).json(companyData);
  } catch (error) {
    const apiError = error as APIError;
    console.error('[Company Data API] Error:', apiError);
    
    if (apiError.code === 'AUTH_ERROR') {
      return res.status(401).json({
        error: 'Invalid API key',
        message: apiError.message,
      });
    }
    
    if (apiError.code === 'RATE_LIMIT') {
      return res.status(429).json({
        error: 'API rate limit exceeded',
        message: 'The free FMP API has strict rate limits. Please wait 1-2 minutes and try again. Tip: Data is cached for 1 hour, so subsequent requests for the same company will be faster.',
      });
    }
    
    return res.status(500).json({
      error: 'Failed to fetch company data',
      message: apiError.message || 'An unexpected error occurred',
    });
  }
}





