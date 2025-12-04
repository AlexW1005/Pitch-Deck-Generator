/**
 * SlidePreview Component
 * Shows a preview of the generated slides with thumbnails and detail view
 */

'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { CompanyData, FormData } from '@/lib/types';
import { ChartExportResult } from '@/lib/chartHelpers';
import { formatLargeNumber, formatPercentage, condenseDescription } from '@/lib/fmpClient';

interface SlidePreviewProps {
  companyData: CompanyData;
  formData: FormData;
  charts: ChartExportResult[];
}

interface SlideData {
  id: string;
  title: string;
  type: 'auto' | 'user-input' | 'chart';
  content: React.ReactNode;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({
  companyData,
  formData,
  charts,
}) => {
  const [selectedSlide, setSelectedSlide] = useState(0);

  const profile = companyData.profile;
  const ratios = companyData.ratiosTTM;
  const income = companyData.incomeStatements;

  // Generate slide data
  const slides: SlideData[] = [
    // Slide 1: Cover
    {
      id: 'cover',
      title: 'Cover',
      type: 'auto',
      content: (
        <div className="h-full bg-lazard-navy text-white p-6 flex flex-col justify-center">
          <h1 className="text-2xl font-bold font-serif">{profile?.companyName}</h1>
          <p className="text-sm text-lazard-silver mt-2">
            {profile?.symbol} | {profile?.exchangeShortName}
          </p>
          <p className="text-xs text-lazard-silver mt-1 italic">Buy-Side Stock Pitch</p>
          <div className="mt-4">
            <span className={clsx(
              'px-2 py-1 rounded text-xs font-bold',
              formData.rating === 'Buy' && 'bg-green-500',
              formData.rating === 'Outperform' && 'bg-green-400',
              formData.rating === 'Hold' && 'bg-amber-500',
              formData.rating === 'Sell' && 'bg-red-500'
            )}>
              {formData.rating.toUpperCase()}
            </span>
          </div>
        </div>
      ),
    },
    // Slide 2: Table of Contents
    {
      id: 'toc',
      title: 'Table of Contents',
      type: 'auto',
      content: (
        <div className="h-full p-4">
          <h2 className="text-lg font-bold font-serif text-lazard-navy mb-3">Table of Contents</h2>
          <ol className="text-xs text-lazard-gray space-y-1">
            {['Investment Summary', 'Company Overview', 'Industry Overview', 'Key Metrics',
              'Financial Summary', 'Revenue & Growth', 'Price Performance', 'Peer Comparison',
              'Market Position', 'Growth Drivers', 'Investment Thesis', 'Valuation',
              'Risks & Mitigants', 'Appendix'].map((item, i) => (
              <li key={i}>{i + 1}. {item}</li>
            ))}
          </ol>
        </div>
      ),
    },
    // Slide 3: Investment Summary
    {
      id: 'summary',
      title: 'Investment Summary',
      type: 'auto',
      content: (
        <div className="h-full p-4">
          <h2 className="text-lg font-bold font-serif text-lazard-navy mb-3">Investment Summary</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-lazard-light/50 p-2 rounded">
              <span className="text-lazard-gray">Rating:</span>
              <span className="ml-2 font-semibold">{formData.rating}</span>
            </div>
            <div className="bg-lazard-light/50 p-2 rounded">
              <span className="text-lazard-gray">Horizon:</span>
              <span className="ml-2 font-semibold">{formData.timeHorizon} mo</span>
            </div>
            <div className="bg-lazard-light/50 p-2 rounded">
              <span className="text-lazard-gray">Target:</span>
              <span className="ml-2 font-semibold">
                {formData.targetPrice ? `$${formData.targetPrice}` : 'TBD'}
              </span>
            </div>
            <div className="bg-lazard-light/50 p-2 rounded">
              <span className="text-lazard-gray">Market Cap:</span>
              <span className="ml-2 font-semibold">
                {profile?.mktCap ? formatLargeNumber(profile.mktCap) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 4: Company Overview
    {
      id: 'company',
      title: 'Company Overview',
      type: 'auto',
      content: (
        <div className="h-full p-4">
          <h2 className="text-lg font-bold font-serif text-lazard-navy mb-3">Company Overview</h2>
          <div className="text-xs space-y-2">
            <p><span className="text-lazard-gray">CEO:</span> {profile?.ceo || 'N/A'}</p>
            <p><span className="text-lazard-gray">Sector:</span> {profile?.sector || 'N/A'}</p>
            <p><span className="text-lazard-gray">Industry:</span> {profile?.industry || 'N/A'}</p>
            <p className="mt-2 text-lazard-slate leading-relaxed">
              {profile?.description ? condenseDescription(profile.description, 50) : 'No description available.'}
            </p>
          </div>
        </div>
      ),
    },
    // Slide 5: Key Metrics
    {
      id: 'metrics',
      title: 'Key Metrics',
      type: 'auto',
      content: (
        <div className="h-full p-4">
          <h2 className="text-lg font-bold font-serif text-lazard-navy mb-3">Key Metrics</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-lazard-light/50 p-2 rounded">
              <span className="text-lazard-gray">P/E (TTM):</span>
              <span className="ml-2 font-semibold">
                {ratios?.peRatioTTM ? ratios.peRatioTTM.toFixed(1) + 'x' : 'N/A'}
              </span>
            </div>
            <div className="bg-lazard-light/50 p-2 rounded">
              <span className="text-lazard-gray">Gross Margin:</span>
              <span className="ml-2 font-semibold">
                {ratios?.grossProfitMarginTTM ? formatPercentage(ratios.grossProfitMarginTTM * 100) : 'N/A'}
              </span>
            </div>
            <div className="bg-lazard-light/50 p-2 rounded">
              <span className="text-lazard-gray">Net Margin:</span>
              <span className="ml-2 font-semibold">
                {ratios?.netProfitMarginTTM ? formatPercentage(ratios.netProfitMarginTTM * 100) : 'N/A'}
              </span>
            </div>
            <div className="bg-lazard-light/50 p-2 rounded">
              <span className="text-lazard-gray">EV/EBITDA:</span>
              <span className="ml-2 font-semibold">
                {ratios?.enterpriseValueMultipleTTM ? ratios.enterpriseValueMultipleTTM.toFixed(1) + 'x' : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 6: Financial Summary
    {
      id: 'financials',
      title: 'Financial Summary',
      type: 'auto',
      content: (
        <div className="h-full p-4">
          <h2 className="text-lg font-bold font-serif text-lazard-navy mb-3">Financial Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-lazard-navy text-white">
                  <th className="p-1 text-left">Metric</th>
                  {income.slice(0, 3).reverse().map((stmt) => (
                    <th key={stmt.calendarYear} className="p-1 text-right">{stmt.calendarYear}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-lazard-light">
                  <td className="p-1 font-medium">Revenue</td>
                  {income.slice(0, 3).reverse().map((stmt) => (
                    <td key={stmt.calendarYear} className="p-1 text-right">
                      {formatLargeNumber(stmt.revenue)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-lazard-light">
                  <td className="p-1 font-medium">Net Income</td>
                  {income.slice(0, 3).reverse().map((stmt) => (
                    <td key={stmt.calendarYear} className="p-1 text-right">
                      {formatLargeNumber(stmt.netIncome)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
  ];

  // Add chart slides
  charts.forEach((chart) => {
    slides.push({
      id: chart.type,
      title: chart.title,
      type: 'chart',
      content: (
        <div className="h-full p-4 flex flex-col">
          <h2 className="text-lg font-bold font-serif text-lazard-navy mb-2">{chart.title}</h2>
          <div className="flex-1 flex items-center justify-center">
            <img 
              src={chart.dataURL} 
              alt={chart.title}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      ),
    });
  });

  // Add user input slides
  slides.push(
    {
      id: 'thesis',
      title: 'Investment Thesis',
      type: 'user-input',
      content: (
        <div className="h-full p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-serif text-lazard-navy">Investment Thesis</h2>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">USER INPUT</span>
          </div>
          <div className="text-xs text-lazard-slate whitespace-pre-wrap">
            {formData.investmentThesis || '1) Summary thesis — why buy?\n2) 12–24 mo catalysts\n3) Evidence/metrics that support thesis'}
          </div>
        </div>
      ),
    },
    {
      id: 'valuation',
      title: 'Valuation',
      type: 'user-input',
      content: (
        <div className="h-full p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-serif text-lazard-navy">Valuation</h2>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">USER INPUT</span>
          </div>
          <div className="text-xs text-lazard-slate whitespace-pre-wrap">
            {formData.valuation || 'DCF / Comparable approach – user to fill model\nAssumptions: revenue growth X; margin Y; multiple Z'}
          </div>
        </div>
      ),
    },
    {
      id: 'risks',
      title: 'Risks & Mitigants',
      type: 'user-input',
      content: (
        <div className="h-full p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-serif text-lazard-navy">Risks & Mitigants</h2>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">USER INPUT</span>
          </div>
          <div className="text-xs text-lazard-slate whitespace-pre-wrap">
            {formData.risksAndMitigants || '• Market Risk: ...\n• Competitive Risk: ...\n• Execution Risk: ...\n• Regulatory Risk: ...'}
          </div>
        </div>
      ),
    }
  );

  return (
    <div className="flex gap-4 h-full">
      {/* Thumbnail sidebar */}
      <div className="w-32 flex-shrink-0 overflow-y-auto scrollbar-thin space-y-2 pr-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setSelectedSlide(index)}
            className={clsx(
              'w-full aspect-[16/9] rounded border-2 transition-all',
              'bg-white text-[6px] p-1 overflow-hidden',
              selectedSlide === index
                ? 'border-lazard-accent shadow-md'
                : 'border-lazard-light hover:border-lazard-silver'
            )}
          >
            <div className="font-bold truncate text-lazard-navy">{slide.title}</div>
            <div className="text-[5px] text-lazard-gray mt-0.5">
              {slide.type === 'user-input' && '(User Input)'}
              {slide.type === 'chart' && '(Chart)'}
            </div>
          </button>
        ))}
      </div>

      {/* Main preview */}
      <div className="flex-1 bg-white rounded-xl shadow-lg border border-lazard-light overflow-hidden">
        <div className="aspect-[16/9] bg-lazard-cream">
          {slides[selectedSlide]?.content}
        </div>
        <div className="p-3 border-t border-lazard-light">
          <p className="text-xs text-lazard-gray">
            Slide {selectedSlide + 1} of {slides.length} • {slides[selectedSlide]?.title}
            {slides[selectedSlide]?.type === 'user-input' && (
              <span className="ml-2 text-amber-600">(Requires your input)</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SlidePreview;





