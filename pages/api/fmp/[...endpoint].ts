/**
 * FMP API Proxy Endpoint
 * Proxies requests to Financial Modeling Prep API while keeping API key secure
 * 
 * Usage: /api/fmp/profile?symbol=AAPL
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

const FMP_BASE_URL = 'https://financialmodelingprep.com/stable';

// Simple in-memory cache
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint } = req.query;
  
  if (!endpoint || !Array.isArray(endpoint)) {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  const apiKey = process.env.FMP_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key not configured',
      message: 'Please set FMP_API_KEY in your environment variables'
    });
  }

  // Build the FMP endpoint path
  const fmpPath = '/' + endpoint.join('/');
  
  // Build query params (excluding internal params)
  const queryParams: Record<string, string> = {};
  Object.keys(req.query).forEach((key) => {
    if (key !== 'endpoint') {
      const value = req.query[key];
      if (typeof value === 'string') {
        queryParams[key] = value;
      }
    }
  });

  // Create cache key
  const cacheKey = `${fmpPath}:${JSON.stringify(queryParams)}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log(`[FMP Proxy] Cache hit: ${cacheKey}`);
    return res.status(200).json(cached.data);
  }

  try {
    console.log(`[FMP Proxy] Fetching: ${fmpPath}`);
    
    const response = await axios.get(`${FMP_BASE_URL}${fmpPath}`, {
      params: {
        ...queryParams,
        apikey: apiKey,
      },
      timeout: 15000,
    });

    // Handle new API format with value wrapper
    let data = response.data;
    if (data && typeof data === 'object' && 'value' in data) {
      data = data.value;
    }

    // Cache the response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    return res.status(200).json(data);
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    
    console.error('[FMP Proxy] Error:', axiosError.message);

    if (axiosError.response) {
      const status = axiosError.response.status;
      const message = axiosError.response.data?.message || axiosError.message;

      if (status === 401) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'Please check your FMP_API_KEY configuration',
        });
      }

      if (status === 403) {
        // Return empty data for free tier limitations instead of error
        console.log('[FMP Proxy] Endpoint not available on free tier:', fmpPath);
        return res.status(200).json([]);
      }

      if (status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Please wait a moment and try again',
        });
      }

      return res.status(status).json({
        error: 'API error',
        message,
      });
    }

    if (axiosError.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Request timeout',
        message: 'The API is taking too long to respond',
      });
    }

    return res.status(500).json({
      error: 'Network error',
      message: 'Failed to connect to FMP API',
    });
  }
}

