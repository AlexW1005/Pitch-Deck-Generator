/**
 * QuickBuy - Main Page
 * Lazard-style Buy-Side Stock Pitch Generator
 */

'use client';

import React, { useState, useCallback } from 'react';
import { ChartConfiguration } from 'chart.js';
import { CompanyForm } from '@/components/CompanyForm';
import { SlidePreview } from '@/components/SlidePreview';
import { ChartRenderer } from '@/components/ChartRenderer';
import { PptxExporter } from '@/components/PptxExporter';
import { ProgressSteps } from '@/components/ProgressSteps';
import { ErrorBox, InfoBox } from '@/components/ErrorBox';
import { CompanyData, FormData, ProgressStep } from '@/lib/types';
import {
  ChartExportResult,
  processPriceData,
  processRevenueData,
  createPricePerformanceConfig,
  createRevenueGrowthConfig,
  createMarketShareConfig,
  calculateMarketShare,
} from '@/lib/chartHelpers';

type AppState = 'form' | 'loading' | 'preview' | 'error';

export default function Home() {
  // App state
  const [appState, setAppState] = useState<AppState>('form');
  const [progressStep, setProgressStep] = useState<ProgressStep>('idle');
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [charts, setCharts] = useState<ChartExportResult[]>([]);

  // Chart configurations
  const [priceConfig, setPriceConfig] = useState<ChartConfiguration<'line'> | null>(null);
  const [revenueConfig, setRevenueConfig] = useState<ChartConfiguration | null>(null);
  const [marketShareConfig, setMarketShareConfig] = useState<ChartConfiguration<'pie'> | null>(null);

  // Handle form submission
  const handleFormSubmit = async (data: FormData) => {
    setFormData(data);
    setAppState('loading');
    setError(null);
    setCharts([]);

    try {
      // Step 1: Fetch company data
      setProgressStep('fetching-profile');
      const response = await fetch(`/api/fmp/company-data?symbol=${encodeURIComponent(data.companyInput)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch company data');
      }

      setProgressStep('fetching-financials');
      const companyDataResult: CompanyData = await response.json();
      setCompanyData(companyDataResult);

      setProgressStep('fetching-peers');
      // Peer data is already included in companyDataResult

      // Step 2: Build chart configurations
      setProgressStep('building-charts');
      
      // Price Performance Chart
      if (data.charts.pricePerformance && companyDataResult.historicalPrices.length > 0) {
        const priceData = processPriceData(companyDataResult.historicalPrices);
        const config = createPricePerformanceConfig(
          priceData,
          companyDataResult.profile?.companyName || data.companyInput,
          data.themeColor
        );
        setPriceConfig(config);
      }

      // Revenue Growth Chart
      if (data.charts.revenueGrowth && companyDataResult.incomeStatements.length > 0) {
        const revenueData = processRevenueData(companyDataResult.incomeStatements);
        const config = createRevenueGrowthConfig(revenueData, data.themeColor);
        setRevenueConfig(config);
      }

      // Market Share Chart (if we have peer data)
      if (data.charts.marketShare && companyDataResult.peersData.length > 0) {
        const latestIncome = companyDataResult.incomeStatements[0];
        if (latestIncome) {
          // Create a simple map for peer revenues (would need additional API calls for real data)
          const peerRevenues = new Map<string, number>();
          companyDataResult.peersData.forEach((peer) => {
            // Estimate revenue from market cap and typical revenue multiples
            // This is a simplification - in production, you'd fetch actual peer financials
            peerRevenues.set(peer.symbol, peer.marketCap * 0.15); // Rough estimate
          });

          const marketShareData = calculateMarketShare(
            latestIncome.revenue,
            companyDataResult.profile?.companyName || data.companyInput,
            companyDataResult.peersData,
            peerRevenues
          );
          
          if (marketShareData.values.length > 1) {
            const config = createMarketShareConfig(marketShareData, data.themeColor);
            setMarketShareConfig(config);
          }
        }
      }

      // Move to preview state - charts will be rendered and exported
      setProgressStep('generating-pptx');
      setAppState('preview');

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setProgressStep('error');
      setAppState('error');
    }
  };

  // Handle charts ready callback
  const handleChartsReady = useCallback((exportedCharts: ChartExportResult[]) => {
    setCharts(exportedCharts);
    setProgressStep('complete');
  }, []);

  // Reset to form
  const handleReset = () => {
    setAppState('form');
    setProgressStep('idle');
    setError(null);
    setCompanyData(null);
    setFormData(null);
    setCharts([]);
    setPriceConfig(null);
    setRevenueConfig(null);
    setMarketShareConfig(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lazard-cream via-white to-lazard-light">
      {/* Header */}
      <header className="bg-lazard-navy text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-serif tracking-tight">
                QuickBuy
              </h1>
              <p className="text-lazard-silver text-sm mt-1">
                Lazard-style buy-side pitch generator
              </p>
            </div>
            {appState !== 'form' && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm bg-lazard-slate hover:bg-lazard-gray 
                         rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                New Pitch
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Form State */}
        {appState === 'form' && (
          <div className="max-w-xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-lazard-navy font-serif">
                Generate Your Pitch Deck
              </h2>
              <p className="text-lazard-gray mt-2">
                Enter a company to auto-fill financial data and create a professional pitch deck
              </p>
            </div>

            <div className="card-lazard">
              <CompanyForm onSubmit={handleFormSubmit} isLoading={false} />
            </div>

            {/* Info box */}
            <div className="mt-6">
              <InfoBox
                title="How it works"
                message="We fetch public financial data from Financial Modeling Prep (FMP) to auto-fill company overviews, financials, and metrics. You'll add your investment thesis, valuation, and risk analysis."
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {appState === 'loading' && (
          <div className="max-w-md mx-auto py-12 animate-fade-in">
            <div className="card-lazard p-8">
              <h2 className="text-xl font-bold text-lazard-navy font-serif text-center mb-6">
                Building Your Pitch Deck
              </h2>
              <ProgressSteps currentStep={progressStep} />
            </div>
          </div>
        )}

        {/* Error State */}
        {appState === 'error' && (
          <div className="max-w-xl mx-auto py-12 animate-fade-in">
            <ErrorBox
              title="Failed to Generate Pitch"
              message={error || 'An unexpected error occurred'}
              suggestion={
                error?.includes('rate limit') 
                  ? "The free API has usage limits. Please wait 1-2 minutes before trying again."
                  : "Please check the ticker symbol and try again. Make sure your API key is configured."
              }
              onRetry={handleReset}
            />
          </div>
        )}

        {/* Preview State */}
        {appState === 'preview' && companyData && formData && (
          <div className="animate-fade-in">
            {/* Company header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-lazard-navy font-serif flex items-center gap-3">
                  {companyData.profile?.companyName}
                  <span className="text-lg font-normal text-lazard-gray">
                    ({companyData.profile?.symbol})
                  </span>
                </h2>
                <p className="text-sm text-lazard-gray mt-1">
                  {companyData.profile?.sector} • {companyData.profile?.industry}
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-sm font-bold text-white
                ${formData.rating === 'Buy' ? 'bg-green-500' : ''}
                ${formData.rating === 'Outperform' ? 'bg-green-400' : ''}
                ${formData.rating === 'Hold' ? 'bg-amber-500' : ''}
                ${formData.rating === 'Sell' ? 'bg-red-500' : ''}
              `}>
                {formData.rating.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Slide Preview */}
              <div className="lg:col-span-2 card-lazard p-6">
                <h3 className="text-lg font-semibold text-lazard-navy mb-4">
                  Slide Preview
                </h3>
                <div className="h-[500px]">
                  <SlidePreview
                    companyData={companyData}
                    formData={formData}
                    charts={charts}
                  />
                </div>
              </div>

              {/* Export Panel */}
              <div className="space-y-6">
                {/* Export Card */}
                <div className="card-lazard p-6 border-2 border-lazard-accent">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-lazard-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-lazard-navy">
                      Download Full Deck
                    </h3>
                  </div>
                  <p className="text-xs text-lazard-gray mb-4">
                    The PPTX file contains the complete Lazard-style deck with all data, professional formatting, and embedded charts.
                  </p>
                  <PptxExporter
                    companyData={companyData}
                    formData={formData}
                    charts={charts}
                    disabled={progressStep !== 'complete'}
                  />
                </div>

                {/* Charts (hidden, for export) */}
                <div className="card-lazard p-4">
                  <h3 className="text-sm font-semibold text-lazard-gray mb-3">
                    Chart Generation
                  </h3>
                  <ChartRenderer
                    priceConfig={priceConfig}
                    revenueConfig={revenueConfig}
                    marketShareConfig={marketShareConfig}
                    enabledCharts={formData.charts}
                    onChartsReady={handleChartsReady}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 px-4 border-t border-lazard-light bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-lazard-gray">
            <p>
              <strong>QuickBuy</strong> — Lazard-style buy-side pitch generator
            </p>
            <p className="text-xs text-center md:text-right max-w-lg">
              This application aggregates public data for convenience only. Users must verify 
              data and assumptions before making investment decisions. Not investment advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}





