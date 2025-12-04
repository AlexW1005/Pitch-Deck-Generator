/**
 * CompanyForm Component
 * Main input form for the pitch deck generator
 */

'use client';

import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { FormData, Rating, TimeHorizon, FMPSearchResult } from '@/lib/types';
import { LoadingSpinner } from './LoadingSpinner';

interface CompanyFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

const RATINGS: Rating[] = ['Buy', 'Outperform', 'Hold', 'Sell'];
const TIME_HORIZONS: { value: TimeHorizon; label: string }[] = [
  { value: '12', label: '12 months' },
  { value: '24', label: '24 months' },
  { value: '36', label: '36 months' },
];

export const CompanyForm: React.FC<CompanyFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<FormData>({
    companyInput: '',
    rating: 'Buy',
    timeHorizon: '12',
    targetPrice: undefined,
    pitchStyle: 'dense',
    charts: {
      marketShare: true,
      revenueGrowth: true,
      pricePerformance: true,
    },
    themeColor: '#2563eb',
    outputFilename: 'stock-pitch',
    authorName: '',
    investmentThesis: '',
    valuation: '',
    risksAndMitigants: '',
  });

  const [searchResults, setSearchResults] = useState<FMPSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounced search
  const searchCompanies = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/fmp/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle company input change with debounce
  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, companyInput: value }));
    setSelectedSymbol('');

    // Debounce search
    const timeoutId = setTimeout(() => searchCompanies(value), 300);
    return () => clearTimeout(timeoutId);
  };

  // Select a company from search results
  const handleSelectCompany = (result: FMPSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      companyInput: result.symbol,
      outputFilename: `${result.symbol.toLowerCase()}-pitch`,
    }));
    setSelectedSymbol(result.symbol);
    setShowResults(false);
    setSearchResults([]);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyInput.trim()) return;
    onSubmit(formData);
  };

  // Update form field
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle chart
  const toggleChart = (chart: keyof FormData['charts']) => {
    setFormData((prev) => ({
      ...prev,
      charts: { ...prev.charts, [chart]: !prev.charts[chart] },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Input */}
      <div className="relative">
        <label className="section-header">Company / Ticker</label>
        <div className="relative">
          <input
            type="text"
            value={formData.companyInput}
            onChange={handleCompanyInputChange}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Enter ticker (e.g., AAPL) or company name"
            className="input-lazard pr-10"
            disabled={isLoading}
            required
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
          {selectedSymbol && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-lazard-light max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={`${result.symbol}-${result.exchangeShortName}`}
                type="button"
                onClick={() => handleSelectCompany(result)}
                className="w-full px-4 py-3 text-left hover:bg-lazard-cream transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-lazard-navy">{result.symbol}</span>
                  <span className="ml-2 text-lazard-gray">{result.name}</span>
                </div>
                <span className="text-xs text-lazard-silver">{result.exchangeShortName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rating and Time Horizon */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="section-header">Rating</label>
          <select
            value={formData.rating}
            onChange={(e) => updateField('rating', e.target.value as Rating)}
            className="select-lazard"
            disabled={isLoading}
          >
            {RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="section-header">Time Horizon</label>
          <select
            value={formData.timeHorizon}
            onChange={(e) => updateField('timeHorizon', e.target.value as TimeHorizon)}
            className="select-lazard"
            disabled={isLoading}
          >
            {TIME_HORIZONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Price */}
      <div>
        <label className="section-header">Target Price (Optional)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lazard-gray">$</span>
          <input
            type="number"
            value={formData.targetPrice || ''}
            onChange={(e) => updateField('targetPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Enter target price"
            className="input-lazard pl-8"
            min="0"
            step="0.01"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Chart Toggles */}
      <div>
        <label className="section-header">Include Charts</label>
        <div className="space-y-2">
          {[
            { key: 'pricePerformance' as const, label: 'Price Performance (5Y)' },
            { key: 'revenueGrowth' as const, label: 'Revenue & Growth' },
            { key: 'marketShare' as const, label: 'Market Share' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.charts[key]}
                onChange={() => toggleChart(key)}
                className="checkbox-lazard"
                disabled={isLoading}
              />
              <span className="text-sm text-lazard-slate">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-lazard-gray hover:text-lazard-navy transition-colors"
      >
        <svg
          className={clsx('h-4 w-4 transition-transform', showAdvanced && 'rotate-90')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Advanced Options
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-lazard-cream/50 rounded-lg border border-lazard-light animate-fade-in">
          {/* Theme Color */}
          <div>
            <label className="section-header">Theme Color</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={formData.themeColor}
                onChange={(e) => updateField('themeColor', e.target.value)}
                disabled={isLoading}
              />
              <span className="text-sm text-lazard-gray">{formData.themeColor}</span>
            </div>
          </div>

          {/* Author Name */}
          <div>
            <label className="section-header">Author Name (Optional)</label>
            <input
              type="text"
              value={formData.authorName}
              onChange={(e) => updateField('authorName', e.target.value)}
              placeholder="Your name or team name"
              className="input-lazard"
              disabled={isLoading}
            />
          </div>

          {/* Output Filename */}
          <div>
            <label className="section-header">Output Filename</label>
            <div className="relative">
              <input
                type="text"
                value={formData.outputFilename}
                onChange={(e) => updateField('outputFilename', e.target.value)}
                placeholder="filename"
                className="input-lazard pr-16"
                disabled={isLoading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lazard-silver text-sm">
                .pptx
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subjective Content Section */}
      <div className="border-t border-lazard-light pt-6">
        <h3 className="text-lg font-semibold text-lazard-navy mb-2">
          Subjective Content
          <span className="ml-2 text-xs font-normal text-lazard-gray">(Optional - can edit later)</span>
        </h3>
        <p className="text-sm text-lazard-gray mb-4">
          These sections will appear as templates if left blank. You can fill them in now or edit the PowerPoint directly.
        </p>

        {/* Investment Thesis */}
        <div className="mb-4">
          <label className="section-header">Investment Thesis</label>
          <textarea
            value={formData.investmentThesis}
            onChange={(e) => updateField('investmentThesis', e.target.value)}
            placeholder="Why buy this stock? What are the key catalysts?"
            className="input-lazard min-h-[100px] resize-y"
            disabled={isLoading}
          />
        </div>

        {/* Valuation */}
        <div className="mb-4">
          <label className="section-header">Valuation</label>
          <textarea
            value={formData.valuation}
            onChange={(e) => updateField('valuation', e.target.value)}
            placeholder="DCF assumptions, comparable multiples, target price derivation..."
            className="input-lazard min-h-[100px] resize-y"
            disabled={isLoading}
          />
        </div>

        {/* Risks & Mitigants */}
        <div>
          <label className="section-header">Risks & Mitigants</label>
          <textarea
            value={formData.risksAndMitigants}
            onChange={(e) => updateField('risksAndMitigants', e.target.value)}
            placeholder="Key risks and how they can be mitigated..."
            className="input-lazard min-h-[100px] resize-y"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !formData.companyInput.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Fetch & Build Slides</span>
          </>
        )}
      </button>

      {/* Helper text */}
      <p className="text-xs text-center text-lazard-gray">
        Auto-fill from public sources. You will still need to provide your investment thesis, valuation, and risks.
      </p>
    </form>
  );
};

export default CompanyForm;





