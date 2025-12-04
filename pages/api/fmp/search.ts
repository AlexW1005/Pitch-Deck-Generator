/**
 * Company Search Endpoint
 * Search for companies by name or ticker
 * 
 * Usage: /api/fmp/search?query=apple
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';
import { FMPSearchResult } from '@/lib/types';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Cache for search results
const searchCache = new Map<string, { data: FMPSearchResult[]; timestamp: number }>();
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes for search

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  const apiKey = process.env.FMP_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API key not configured',
      message: 'Please set FMP_API_KEY in your environment variables'
    });
  }

  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `search:${normalizedQuery}`;
  
  // Check cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return res.status(200).json(cached.data);
  }

  try {
    const response = await axios.get<FMPSearchResult[]>(`${FMP_BASE_URL}/search`, {
      params: {
        query: normalizedQuery,
        limit: 10,
        apikey: apiKey,
      },
      timeout: 10000,
    });

    // Filter to only show actively traded stocks (exclude OTC, delisted)
    const filtered = response.data.filter(
      (result) => 
        result.exchangeShortName && 
        !result.exchangeShortName.includes('OTC') &&
        result.currency
    );

    // Cache results
    searchCache.set(cacheKey, {
      data: filtered,
      timestamp: Date.now(),
    });

    return res.status(200).json(filtered);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('[Search API] Error:', axiosError.message);
    
    return res.status(500).json({
      error: 'Search failed',
      message: 'Failed to search for companies',
    });
  }
}





